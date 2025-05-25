// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM ELEMENTS ---
    const searchInput = document.getElementById('search-input');
    const subjectsGrid = UIManager.getSubjectsGridElement(); // Get subjectsGrid via UIManager
    const modalOverlay = document.getElementById('subtopic-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const mainContainer = document.querySelector('main.container');
    const siteHeaderWrapper = document.querySelector('.site-header-wrapper');
    // User ID display and login button are removed as Firebase is reverted.
    // const userIdDisplay = document.getElementById('user-id-display');
    // const loginBtn = document.getElementById('login-btn');


    // --- INITIALIZATION ---
    ThemeManager.init(); 

    try {
        // Reverted to loadAllSubjects which should fetch static JSON data
        await DataManager.loadAllSubjects(); 
        const allSubjects = DataManager.getAllSubjects();
        if (allSubjects.length > 0) {
            UIManager.renderSubjects(allSubjects); 
        } else {
            console.warn("No subjects loaded. Check data files or paths.");
            UIManager.renderSubjects([]); 
        }
    } catch (error) {
        console.error("Failed to initialize subjects:", error);
        UIManager.renderSubjects([]); 
    }


    // --- EVENT LISTENERS ---

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const allLoadedSubjects = DataManager.getAllSubjects(); 

            const filteredSubjects = allLoadedSubjects.filter(subject =>
                subject.name.toLowerCase().includes(searchTerm) ||
                subject.description.toLowerCase().includes(searchTerm) ||
                (subject.topics && subject.topics.some(topic =>
                    (topic.subtopics || []).some(subtopic => subtopic.name.toLowerCase().includes(searchTerm))
                ))
            );
            UIManager.renderSubjects(filteredSubjects);
        });
    }

    if (subjectsGrid) {
        subjectsGrid.addEventListener('click', (e) => { // Removed async as DataManager calls will be synchronous
            const cardLink = e.target.closest('.subject-card-link');
            // if (!cardLink) return; // Allow clicks on buttons even if not inside a link, like the bulb button

            const mindmapBtn = e.target.closest('.mindmap-card-btn.bulb-btn');
            if (mindmapBtn) {
                e.preventDefault(); // Prevent any default link behavior if the button is wrapped in <a>
                const subjectId = mindmapBtn.dataset.subjectId;
                console.log("Mind Map button clicked for subject:", subjectId);
                // Open mindmap.html in a new tab, passing the subjectId as a query parameter
                window.open(`mindmap.html?subject=${subjectId}`, '_blank');
                return; // Event handled
            }

            // Ensure further actions only proceed if the click was within a card link,
            // and not on the mindmap button which is handled above.
            if (!cardLink) return; 
            const subjectIdFromCard = cardLink.dataset.subjectId;


            if (e.target.matches('input[type="checkbox"]')) {
                const checkbox = e.target;
                const topicIndex = parseInt(checkbox.dataset.topicIndex);
                const subtopicIndex = parseInt(checkbox.dataset.subtopicIndex);
                const updatedSubject = DataManager.updateSubtopicCompletion(subjectIdFromCard, topicIndex, subtopicIndex, checkbox.checked);
                
                if (updatedSubject) {
                    UIManager.updateCardProgress(cardLink, updatedSubject);
                } else {
                    console.warn("Subject data not updated after completion change for card:", cardLink);
                }
                return;
            }

            const labelTarget = e.target.closest('label[data-subtopic-idx]');
            if (labelTarget && labelTarget.dataset.subjectId && labelTarget.dataset.topicIdx) {
                e.preventDefault();
                const subjectId = labelTarget.dataset.subjectId;
                const topicIndex = parseInt(labelTarget.dataset.topicIdx);
                const clickedSubtopicIndex = parseInt(labelTarget.dataset.subtopicIdx);
                const subject = DataManager.getSubjectById(subjectId); 
                const mainTopic = subject?.topics[topicIndex];
                if (mainTopic?.subtopics?.length > 0) {
                    UIManager.openModal(mainTopic.name, mainTopic.subtopics, clickedSubtopicIndex);
                }
                return;
            }

            const expandButton = e.target.closest('.expand-btn');
            if (expandButton) {
                e.preventDefault();
                const cardElement = cardLink.querySelector('.subject-card');
                if (cardElement) UIManager.toggleCardExpansion(cardElement);
                return;
            }
            
            const quickRevisionBtn = e.target.closest('.quick-revision-btn');
            if (quickRevisionBtn) {
                e.preventDefault();
                const subjectId = quickRevisionBtn.dataset.subjectId;
                const subject = DataManager.getSubjectById(subjectId);
                if (subject) {
                    UIManager.renderQuickRevisionPage(subject);
                    if (siteHeaderWrapper) siteHeaderWrapper.classList.add('hidden');
                }
                return;
            }
            
            // If the click was on the cardLink itself (e.g., padding areas) 
            // and not on any specific interactive element handled above,
            // prevent the default <a> behavior (e.g., navigating to href="#").
            if (e.target.closest('.subject-card-link')) {
                 e.preventDefault();
            }
        });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => UIManager.closeModal());
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) UIManager.closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) UIManager.closeModal(); });
    }

    if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            if (e.target.id === 'back-to-subjects-btn') {
                e.preventDefault();
                if (siteHeaderWrapper) siteHeaderWrapper.classList.remove('hidden');
                const allSubjects = DataManager.getAllSubjects(); 
                UIManager.renderSubjects(allSubjects);
            }
        });
    }
});
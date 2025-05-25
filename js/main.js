// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM ELEMENTS ---
    const subjectsGrid = UIManager.getSubjectsGridElement();
    const modalOverlay = document.getElementById('subtopic-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const mainContainer = document.querySelector('main.container');
    const siteHeaderWrapper = document.querySelector('.site-header-wrapper');
    const searchInput = document.getElementById('search-input');


    // --- INITIALIZATION ---
    ThemeManager.init();

    try {
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

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const allLoadedSubjects = DataManager.getAllSubjects();

            const filteredSubjects = allLoadedSubjects.filter(subject =>
                subject.name.toLowerCase().includes(searchTerm) ||
                subject.description.toLowerCase().includes(searchTerm) ||
                subject.topics.some(topic =>
                    (topic.subtopics || []).some(subtopic => subtopic.name.toLowerCase().includes(searchTerm))
                )
            );
            UIManager.renderSubjects(filteredSubjects);
        });
    }

    // Event delegation for card actions on the subjects grid
    if (subjectsGrid) {
        subjectsGrid.addEventListener('click', (e) => {
            const cardLink = e.target.closest('.subject-card-link');
            if (!cardLink) return;

            const subjectIdFromCard = cardLink.dataset.subjectId;

            // Handle CHECKBOX click
            if (e.target.matches('input[type="checkbox"]')) {
                const checkbox = e.target;
                const topicIndex = parseInt(checkbox.dataset.topicIndex);
                const subtopicIndex = parseInt(checkbox.dataset.subtopicIndex);

                DataManager.updateSubtopicCompletion(subjectIdFromCard, topicIndex, subtopicIndex, checkbox.checked);
                const updatedSubject = DataManager.getSubjectById(subjectIdFromCard);

                if (updatedSubject) {
                    UIManager.updateCardProgress(cardLink, updatedSubject);
                }
                return;
            }

            // Handle LABEL click for MODAL
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
                } else {
                    const title = mainTopic ? mainTopic.name : (subject ? subject.name : "Topic");
                    UIManager.openModal(title, [{ name: "Information", details: "No subtopics available to display for this topic." }]);
                }
                return;
            }

            // Handle EXPAND BUTTON click
            const expandButton = e.target.closest('.expand-btn');
            if (expandButton) {
                e.preventDefault();
                const cardElement = cardLink.querySelector('.subject-card');
                if (cardElement) {
                    UIManager.toggleCardExpansion(cardElement);
                }
                return;
            }
            
            // Handle QUICK REVISION button click
            const quickRevisionBtn = e.target.closest('.quick-revision-btn');
            if (quickRevisionBtn) {
                e.preventDefault();
                const subjectId = quickRevisionBtn.dataset.subjectId;
                const subject = DataManager.getSubjectById(subjectId);
                if (subject) {
                    UIManager.renderQuickRevisionPage(subject);
                    if (siteHeaderWrapper) siteHeaderWrapper.classList.add('hidden');
                } else {
                    console.error("Subject not found for quick revision:", subjectId);
                }
                return;
            }

            if (e.target.closest('.subject-card-link')) {
                 e.preventDefault();
            }
        });
    }

    // --- Modal Closing Listeners ---
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => UIManager.closeModal());
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) UIManager.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
                UIManager.closeModal();
            }
        });
    }

    // --- Event listener for the "Back to Subjects" button ---
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
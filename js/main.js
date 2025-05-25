// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM ELEMENTS ---
    const searchInput = document.getElementById('search-input');
    const mainContainer = document.querySelector('main.container');
    const siteHeaderWrapper = document.querySelector('.site-header-wrapper');

    // --- INITIALIZATION ---
    ThemeManager.init();

    try {
        await DataManager.loadAllSubjects();
        const allSubjects = DataManager.getAllSubjects();
        UIManager.renderSubjects(allSubjects); // Initial render of subject cards
    } catch (error) {
        console.error("Failed to initialize subjects:", error);
        UIManager.renderSubjects([]);
    }

    // --- EVENT LISTENERS ---

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (UIManager.getSubjectsGridElement()) {
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
            }
        });
    }

    if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            // Handle click on a subject card link (not the mindmap button inside it)
            const cardLink = e.target.closest('.subject-card-link');
            if (cardLink && !e.target.closest('.mindmap-card-btn')) {
                e.preventDefault();
                const subjectId = cardLink.dataset.subjectId;
                const subject = DataManager.getSubjectById(subjectId);
                if (subject) {
                    UIManager.renderSubjectDetailPage(subject);
                    if (siteHeaderWrapper) siteHeaderWrapper.classList.add('hidden');
                }
                return;
            }

            // Handle click on mindmap button within a card (on subjects grid)
            const mindmapBtnCard = e.target.closest('.subject-card .mindmap-card-btn');
            if (mindmapBtnCard) {
                 e.preventDefault();
                 const subjectId = mindmapBtnCard.dataset.subjectId;
                 console.log("Mind Map button clicked for subject:", subjectId);
                 window.open(`mindmap.html?subject=${subjectId}`, '_self');
                 return;
            }

            // Handle click on a subtopic label in the detail view's navigation panel
            const subtopicLabel = e.target.closest('.nav-subtopic-label-button');
            if (subtopicLabel) {
                e.preventDefault(); // Prevent if it's a link or button default action
                const subjectId = subtopicLabel.dataset.subjectId;
                const topicIndex = parseInt(subtopicLabel.dataset.topicIndex);
                const subtopicIndex = parseInt(subtopicLabel.dataset.subtopicIndex);

                const subject = DataManager.getSubjectById(subjectId);
                if (subject && subject.topics[topicIndex] && subject.topics[topicIndex].subtopics[subtopicIndex]) {
                    const subtopic = subject.topics[topicIndex].subtopics[subtopicIndex];
                    UIManager.renderSubtopicContent(subtopic, subtopicLabel); // Pass label to handle active state
                }
                return;
            }

            // Handle click on "Back to Subjects" button
            if (e.target.id === 'back-to-subjects-btn' || e.target.closest('#back-to-subjects-btn')) {
                e.preventDefault();
                if (siteHeaderWrapper) siteHeaderWrapper.classList.remove('hidden');
                const allSubjects = DataManager.getAllSubjects();
                UIManager.renderSubjects(allSubjects);
                if(searchInput) searchInput.value = '';
                return;
            }
        });

        // Add a separate event listener for 'change' events, specifically for checkboxes
        mainContainer.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"][data-subject-id]')) {
                const checkbox = e.target;
                const subjectId = checkbox.dataset.subjectId;
                const topicIndex = parseInt(checkbox.dataset.topicIndex);
                const subtopicIndex = parseInt(checkbox.dataset.subtopicIndex);
                const isCompleted = checkbox.checked;

                const updatedSubject = DataManager.updateSubtopicCompletion(subjectId, topicIndex, subtopicIndex, isCompleted);

                if (updatedSubject) {
                    // Update progress on the detail page if it's currently visible for this subject
                    const detailView = document.querySelector('.subject-detail-view');
                    // A bit simplistic check, ideally UIManager would know current subject
                    if (detailView && detailView.querySelector(`.detail-page-title`)?.textContent.includes(updatedSubject.name)) {
                         UIManager.updateSubjectDetailProgress(subjectId);
                    }
                    // The main subject cards will update when renderSubjects is called next.
                }
            }
        });
    }
});

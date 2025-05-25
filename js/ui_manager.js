// js/ui_manager.js

const UIManager = (() => {
    // --- DOM ELEMENT REFERENCES ---
    const mainContainer = document.querySelector('main.container');

    let subjectsGridElement = null;
    let noResultsDivElement = null;
    let subjectDetailViewElement = null;
    let currentActiveSubtopicButton = null;
    let detailPageProgressElement = null; // To store the progress span in detail view


    /**
     * Calculates the completion progress for a given subject.
     * @param {object} subject - The subject data object.
     * @returns {object} An object containing completedCount, totalCount, and percentage.
     */
    function calculateProgress(subject) {
        let completedCount = 0;
        let totalCount = 0;
        if (subject && subject.topics) {
            subject.topics.forEach(topic => {
                if (topic.subtopics && topic.subtopics.length > 0) {
                    topic.subtopics.forEach(subtopic => {
                        totalCount++;
                        if (subtopic.completed) {
                            completedCount++;
                        }
                    });
                }
            });
        }
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        return { completedCount, totalCount, percentage };
    }


    /**
     * Clears the main container of any existing views.
     */
    function clearMainContainer() {
        if (mainContainer) {
            mainContainer.innerHTML = '';
        }
        subjectsGridElement = null;
        noResultsDivElement = null;
        subjectDetailViewElement = null;
        currentActiveSubtopicButton = null;
        detailPageProgressElement = null;
    }

    /**
     * Renders all subject cards into the main grid.
     * @param {Array<object>} subjects - An array of subject data objects.
     */
    function renderSubjects(subjects) {
        clearMainContainer();
        mainContainer.classList.remove('subject-detail-layout');

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'subjects-grid-wrapper';
        mainContainer.appendChild(gridWrapper);

        subjectsGridElement = document.createElement('div');
        subjectsGridElement.id = 'subjects-grid';
        subjectsGridElement.className = 'subjects-grid';
        gridWrapper.appendChild(subjectsGridElement);

        noResultsDivElement = document.createElement('div');
        noResultsDivElement.id = 'no-results';
        noResultsDivElement.className = 'no-results hidden';
        noResultsDivElement.innerHTML = `<h2>No Subjects Found</h2><p>Your search did not match any subjects. Try a different keyword.</p>`;
        gridWrapper.appendChild(noResultsDivElement);


        if (!subjects || subjects.length === 0) {
            noResultsDivElement.classList.remove('hidden');
            return;
        } else {
            noResultsDivElement.classList.add('hidden');
        }

        subjects.forEach(subject => {
            const progress = calculateProgress(subject);
            const circumference = 2 * Math.PI * 30; // Adjusted radius for card progress circle
            const offset = circumference - (progress.percentage / 100) * circumference;

            const cardHTML = `
                <a href="#" class="subject-card-link" data-subject-id="${subject.id}" aria-label="View details for ${subject.name}">
                    <article class="subject-card">
                        <div class="card-header-flex">
                            <div class="card-content">
                                <div class="card-title-group">
                                    <div class="card-icon">${subject.icon || ''}</div>
                                    <h2 class="card-title">${subject.name}</h2>
                                </div>
                                <p class="card-description">${subject.description}</p>
                            </div>
                            <div class="card-progress-circle" title="${progress.completedCount} of ${progress.totalCount} subtopics completed">
                                <svg class="progress-circle-svg" width="70" height="70" viewBox="0 0 70 70">
                                    <circle class="progress-circle-bg" cx="35" cy="35" r="30"></circle>
                                    <circle class="progress-circle-fg" cx="35" cy="35" r="30"
                                        stroke-dasharray="${circumference}"
                                        stroke-dashoffset="${offset}">
                                    </circle>
                                </svg>
                                <span class="progress-circle-text">${progress.percentage}%</span>
                            </div>
                        </div>
                        <div class="card-footer-icon">
                             <button class="mindmap-card-btn" title="Open Mind Map for ${subject.name}" data-subject-id="${subject.id}" aria-label="Open Mind Map for ${subject.name}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M9 18h6" stroke="currentColor" fill="none"/>
                                  <path d="M10 22h4" stroke="currentColor" fill="none"/>
                                  <path d="M12.874 14.48a5 5 0 0 1-1.748 0A5.002 5.002 0 0 1 8 9.33V5a4 4 0 0 1 8 0v4.33a5.002 5.002 0 0 1-3.126 5.15z" fill="currentColor" stroke="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </article>
                </a>
            `;
            subjectsGridElement.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * Updates the progress indicator on the subject detail page.
     * @param {string} subjectId - The ID of the subject to update progress for.
     */
    function updateSubjectDetailProgress(subjectId) {
        const subject = DataManager.getSubjectById(subjectId);
        if (subject && detailPageProgressElement) {
            const progress = calculateProgress(subject);
            detailPageProgressElement.textContent = `(${progress.percentage}%)`;
            // Update progress circle on the detail page header
            const progressCircleFg = document.querySelector('.detail-page-header-progress .progress-circle-fg');
            const progressText = document.querySelector('.detail-page-header-progress .progress-circle-text');
            if (progressCircleFg && progressText) {
                const circumference = 2 * Math.PI * 20; // Radius for header progress circle
                const offset = circumference - (progress.percentage / 100) * circumference;
                progressCircleFg.style.strokeDashoffset = offset;
                progressText.textContent = `${progress.percentage}%`;
            }
        }
    }


    /**
     * Renders the subject detail page with a left navigation panel and a right content panel.
     * @param {object} subject - The subject data object.
     */
    function renderSubjectDetailPage(subject) {
        clearMainContainer();
        mainContainer.classList.add('subject-detail-layout');

        subjectDetailViewElement = document.createElement('div');
        subjectDetailViewElement.className = 'subject-detail-view';

        const navPanel = document.createElement('div');
        navPanel.className = 'subject-nav-panel';

        const progress = calculateProgress(subject);
        const headerCircumference = 2 * Math.PI * 20; // Radius for header progress circle
        const headerOffset = headerCircumference - (progress.percentage / 100) * headerCircumference;


        let navHTML = `
            <div class="subject-detail-header">
                <button id="back-to-subjects-btn" class="back-to-subjects-btn" aria-label="Go back to subjects list">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <div class="detail-page-title-container">
                    <h2 class="detail-page-title">${subject.name}</h2>
                    <div class="detail-page-header-progress" title="${progress.completedCount} of ${progress.totalCount} subtopics completed">
                        <svg class="progress-circle-svg" width="50" height="50" viewBox="0 0 50 50">
                            <circle class="progress-circle-bg" cx="25" cy="25" r="20"></circle>
                            <circle class="progress-circle-fg" cx="25" cy="25" r="20"
                                stroke-dasharray="${headerCircumference}"
                                stroke-dashoffset="${headerOffset}">
                            </circle>
                        </svg>
                        <span class="progress-circle-text">${progress.percentage}%</span>
                    </div>
                </div>
                <p class="detail-page-description">${subject.description}</p>
            </div>
        `;
        // Store the span for live updates
        // Note: This was the old way, now using the circle above.
        // detailPageProgressElement = document.createElement('span');
        // detailPageProgressElement.id = 'detail-page-progress-value';
        // detailPageProgressElement.textContent = `(${progress.percentage}%)`;
        // // This needs to be inserted into the navHTML or appended to the title container.
        // // For simplicity, the circle is directly in navHTML. We'll update it via updateSubjectDetailProgress.


        if (subject.topics && subject.topics.length > 0) {
            subject.topics.forEach((topic, topicIndex) => {
                navHTML += `
                    <div class="nav-topic-group">
                        <h3>${topic.name}</h3>
                        <ul class="nav-subtopics-list">
                            ${(topic.subtopics || []).map((subtopic, subtopicIndex) => `
                                <li class="nav-subtopic-item">
                                    <input type="checkbox" id="subtopic-chk-${subject.id}-${topicIndex}-${subtopicIndex}"
                                           data-subject-id="${subject.id}" data-topic-index="${topicIndex}" data-subtopic-index="${subtopicIndex}"
                                           ${subtopic.completed ? 'checked' : ''}>
                                    <label for="subtopic-chk-${subject.id}-${topicIndex}-${subtopicIndex}" class="nav-subtopic-label-button"
                                           data-subject-id="${subject.id}" data-topic-index="${topicIndex}" data-subtopic-index="${subtopicIndex}">
                                        ${subtopic.name}
                                    </label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });
        } else {
            navHTML += '<p>No topics available for this subject.</p>';
        }
        navPanel.innerHTML = navHTML;

        const contentPanel = document.createElement('div');
        contentPanel.className = 'subject-content-panel';
        contentPanel.id = 'subject-content-area';
        contentPanel.innerHTML = `
            <div class="content-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <p>Select a subtopic from the left to view its details.</p>
            </div>
        `;

        subjectDetailViewElement.appendChild(navPanel);
        subjectDetailViewElement.appendChild(contentPanel);
        mainContainer.appendChild(subjectDetailViewElement);

        // After appending, find the progress element if we were using the span approach
        // detailPageProgressElement = document.getElementById('detail-page-progress-value');
        // For the circle approach, updateSubjectDetailProgress will find it.

        const firstSubtopicLabel = navPanel.querySelector('.nav-subtopic-label-button');
        if (firstSubtopicLabel) {
            // Simulate click on the label to load content and set active state
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            firstSubtopicLabel.dispatchEvent(event);
        }
    }

    /**
     * Renders the content of a selected subtopic in the right panel.
     * @param {object} subtopic - The subtopic object.
     * @param {HTMLElement} clickedLabel - The label element that was clicked.
     */
    function renderSubtopicContent(subtopic, clickedLabel) {
        const contentArea = document.getElementById('subject-content-area');
        if (!contentArea) return;

        if (currentActiveSubtopicButton) {
            currentActiveSubtopicButton.classList.remove('active');
        }
        if (clickedLabel) {
            clickedLabel.classList.add('active');
            currentActiveSubtopicButton = clickedLabel;
        }

        if (subtopic && subtopic.details) {
            contentArea.innerHTML = `
                <h3 class="subtopic-content-title">${subtopic.name}</h3>
                <div class="subtopic-content-details">
                    ${subtopic.details}
                </div>
            `;
        } else if (subtopic) {
             contentArea.innerHTML = `
                <h3 class="subtopic-content-title">${subtopic.name}</h3>
                <div class="subtopic-content-details">
                    <p>No details available for this subtopic yet.</p>
                </div>
            `;
        } else {
            contentArea.innerHTML = `
                <div class="content-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><alert-circle cx="12" cy="12" r="10"></alert-circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <p>Could not load content for the selected subtopic.</p>
                </div>
            `;
        }
    }


    // --- PUBLIC API ---
    return {
        getSubjectsGridElement: () => subjectsGridElement,
        renderSubjects,
        renderSubjectDetailPage,
        renderSubtopicContent,
        updateSubjectDetailProgress // Expose this function
    };
})();

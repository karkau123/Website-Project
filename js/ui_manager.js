// js/ui_manager.js

const UIManager = (() => {
    // --- DOM ELEMENT REFERENCES ---
    const subjectsGrid = document.getElementById('subjects-grid');
    const noResultsDiv = document.getElementById('no-results');
    const mainContainer = document.querySelector('main.container');

    // Modal elements
    const modalOverlay = document.getElementById('subtopic-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetails = document.getElementById('modal-details');
    const body = document.body;

    /**
     * Calculates the completion progress for a given subject.
     * @param {object} subject - The subject data object.
     * @returns {object} An object containing completed count, total count, and percentage.
     */
    function calculateProgress(subject) {
        let completedCount = 0;
        let totalCount = 0;
        subject.topics.forEach(topic => {
            if (topic.subtopics && topic.subtopics.length > 0) {
                totalCount += topic.subtopics.length;
                completedCount += topic.subtopics.filter(st => st.completed).length;
            }
        });
        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return { completedCount, totalCount, percentage };
    }

    /**
     * Toggles the visibility of a subject card's details section.
     * @param {HTMLElement} cardElement - The .subject-card element.
     */
    function toggleCardExpansion(cardElement) {
        cardElement.classList.toggle('expanded');
    }

    /**
     * Updates the progress circle on a specific subject card.
     * @param {HTMLElement} cardLinkElement - The .subject-card-link element.
     * @param {object} subject - The updated subject data.
     */
    function updateCardProgress(cardLinkElement, subject) {
        const progress = calculateProgress(subject);
        const progressCircleFg = cardLinkElement.querySelector('.progress-circle-fg');
        const progressText = cardLinkElement.querySelector('.progress-circle-text');

        if (progressCircleFg && progressText) {
            const circumference = 2 * Math.PI * 40; // Assuming radius is 40
            const offset = circumference - (progress.percentage / 100) * circumference;
            progressCircleFg.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.round(progress.percentage)}%`;
        }
    }

    /**
     * Renders all subject cards into the main grid.
     * @param {Array<object>} subjects - An array of subject data objects.
     */
    function renderSubjects(subjects) {
        mainContainer.innerHTML = '';
        mainContainer.className = 'container'; 
        mainContainer.appendChild(subjectsGrid);
        mainContainer.appendChild(noResultsDiv);

        subjectsGrid.innerHTML = '';
        noResultsDiv.classList.toggle('hidden', subjects.length > 0);

        subjects.forEach(subject => {
            const progress = calculateProgress(subject);
            const circumference = 2 * Math.PI * 40; 
            const offset = circumference - (progress.percentage / 100) * circumference;

            const cardHTML = `
                <a href="#" class="subject-card-link" data-subject-id="${subject.id}" aria-label="View details for ${subject.name}">
                    <article class="subject-card">
                        <div class="card-main">
                            <div class="card-info">
                                <div class="card-title-group">
                                    <div class="card-icon">${subject.icon || ''}</div>
                                    <h2 class="card-title">${subject.name}</h2>
                                </div>
                                <p class="card-description">${subject.description}</p>
                            </div>
                            <div class="progress-circle" title="${progress.completedCount} of ${progress.totalCount} subtopics completed">
                                <svg class="progress-circle-svg" width="70" height="70" viewBox="0 0 100 100">
                                    <circle class="progress-circle-bg" cx="50" cy="50" r="40"></circle>
                                    <circle class="progress-circle-fg" cx="50" cy="50" r="40"
                                        stroke-dasharray="${circumference}"
                                        stroke-dashoffset="${offset}">
                                    </circle>
                                </svg>
                                <span class="progress-circle-text">${Math.round(progress.percentage)}%</span>
                            </div>
                        </div>

                        <div class="card-border-bottom">
                            <button class="expand-btn" aria-label="Toggle topic list">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                        </div>

                        <div class="card-details">
                            ${subject.topics.map((topic, topicIndex) => `
                                <div class="topic-group">
                                    <h3>${topic.name}</h3>
                                    <ul class="subtopics-list">
                                        ${(topic.subtopics || []).map((subtopic, subtopicIndex) => `
                                            <li class="subtopic-item">
                                                <input type="checkbox" id="subtopic-${subject.id}-${topicIndex}-${subtopicIndex}" 
                                                    data-topic-index="${topicIndex}" data-subtopic-index="${subtopicIndex}"
                                                    ${subtopic.completed ? 'checked' : ''}>
                                                <label for="subtopic-${subject.id}-${topicIndex}-${subtopicIndex}"
                                                    data-subject-id="${subject.id}" data-topic-idx="${topicIndex}" data-subtopic-idx="${subtopicIndex}"
                                                    title="Click to view details for ${subtopic.name}">
                                                    ${subtopic.name}
                                                </label>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            `).join('')}

                            <div class="quick-revision-container">
                                <button class="quick-revision-btn" data-subject-id="${subject.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.1571 5 3.24104 6.8283 3.0249 9.11833M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.8429 5 20.759 6.8283 20.9751 9.11833"></path><path d="M10 10.5C10 11.3284 9.32843 12 8.5 12C7.67157 12 7 11.3284 7 10.5C7 9.67157 7.67157 9 8.5 9C9.32843 9 10 9.67157 10 10.5Z"></path><path d="M17 10.5C17 11.3284 16.3284 12 15.5 12C14.6716 12 14 11.3284 14 10.5C14 9.67157 14.6716 9 15.5 9C16.3284 9 17 9.67157 17 10.5Z"></path></svg>
                                    Quick Revision
                                </button>
                            </div>
                        </div>
                    </article>
                </a>
            `;
            subjectsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    /**
     * Renders the Quick Revision page for a specific subject.
     * @param {object} subject - The subject data object to render.
     */
    function renderQuickRevisionPage(subject) {
        mainContainer.innerHTML = '';
        mainContainer.classList.add('revision-view');

        let revisionHTML = `
            <div class="revision-header">
                <button id="back-to-subjects-btn" class="back-btn" aria-label="Go back to subjects list">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <h1 class="revision-title">${subject.name} Revision</h1>
            </div>
            <div class="revision-content">
        `;

        subject.topics.forEach(topic => {
            if (topic.subtopics && topic.subtopics.length > 0) {
                revisionHTML += `
                    <section class="revision-topic-group" aria-labelledby="topic-title-${topic.name.replace(/\s+/g, '-')}">
                        <h3 id="topic-title-${topic.name.replace(/\s+/g, '-')}">${topic.name}</h3>
                        <div class="revision-subtopics-list">
                `;
                topic.subtopics.forEach(subtopic => {
                    revisionHTML += `
                        <div class="revision-subtopic-item">
                            <h4>${subtopic.name}</h4>
                            <div class="revision-subtopic-details">
                                ${subtopic.details || '<p>No details available for this topic yet.</p>'}
                            </div>
                        </div>
                    `;
                });
                revisionHTML += `</div></section>`;
            }
        });

        revisionHTML += `</div>`;
        mainContainer.innerHTML = revisionHTML;
    }

    /**
     * Opens the modal to show details for a list of subtopics.
     * @param {string} title - The title for the modal (usually the topic name).
     * @param {Array<object>} subtopics - The array of subtopics to display.
     * @param {number} [clickedSubtopicIndex=0] - The index of the subtopic that was clicked to open the modal.
     */
    function openModal(title, subtopics, clickedSubtopicIndex = 0) {
        modalTitle.textContent = title;
        modalDetails.innerHTML = ''; 

        subtopics.forEach(subtopic => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'modal-subtopic-entry';
            entryDiv.id = `modal-subtopic-${subtopic.name.replace(/\s+/g, '-')}`;
            entryDiv.innerHTML = `
                <h3 class="modal-subtopic-name">${subtopic.name}</h3>
                <div class="modal-subtopic-details-text">
                    ${subtopic.details || '<p>Details for this topic are not yet available.</p>'}
                </div>
            `;
            modalDetails.appendChild(entryDiv);
        });

        modalOverlay.classList.remove('hidden');
        body.classList.add('modal-open');

        const clickedElement = modalDetails.children[clickedSubtopicIndex];
        if (clickedElement) {
            modalDetails.scrollTop = clickedElement.offsetTop - modalDetails.offsetTop;
        } else {
            modalDetails.scrollTop = 0;
        }
    }

    /**
     * Closes the subtopic details modal.
     */
    function closeModal() {
        modalOverlay.classList.add('hidden');
        body.classList.remove('modal-open');
    }

    // --- PUBLIC API ---
    return {
        getSubjectsGridElement: () => subjectsGrid,
        renderSubjects,
        updateCardProgress,
        toggleCardExpansion,
        openModal,
        closeModal,
        renderQuickRevisionPage
    };
})();
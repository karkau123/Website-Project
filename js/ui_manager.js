// js/ui_manager.js

const UIManager = (() => {
    // --- DOM ELEMENT REFERENCES ---
    const mainContainer = document.querySelector('main.container');

    let subjectsGridElement = null;
    let noResultsDivElement = null;
    let subjectDetailViewElement = null;
    let currentActiveSubtopicButton = null;
    let detailPageProgressElement = null;

    /**
     * Initializes the AI Tutor widget and its logic.
     * @param {string} currentSubtopicName - The name of the currently viewed subtopic.
     * @param {string} currentSubtopicDetailsText - The plain text content of the subtopic.
     */
    function initializeAITutorWidget(currentSubtopicName, currentSubtopicDetailsText) {
        const llmSupportWidgetHTML = `
            <div id="llm-support-widget">
                <h3>OS Topic Helper</h3>
                <p id="llm-widget-instruction">Finished reading "${currentSubtopicName}"? Ask a question to understand it better or explore related concepts.</p>
                <textarea id="llm-user-question" placeholder="Ask about '${currentSubtopicName}'..."></textarea>
                <button id="llm-ask-button">Ask AI Tutor</button>
                <div id="llm-response-area">
                    <p>AI's answer will appear here.</p>
                </div>
            </div>
        `;

        const contentArea = document.getElementById('subject-content-area');
        if (!contentArea) {
            console.error("AI Tutor: subject-content-area not found.");
            return;
        }

        const existingWidget = document.getElementById('llm-support-widget');
        if (existingWidget) existingWidget.remove();

        contentArea.insertAdjacentHTML('beforeend', llmSupportWidgetHTML);

        const GEMINI_API_KEY = "AIzaSyCSQ4sfioDHkiu4gbKeXa-6Xgrm7f0OvOg"; // <-- IMPORTANT: REPLACE THIS KEY
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const askButton = document.getElementById('llm-ask-button');
        const userQuestionInput = document.getElementById('llm-user-question');
        const responseArea = document.getElementById('llm-response-area');

        if (!askButton || !userQuestionInput || !responseArea) return;

        askButton.addEventListener('click', handleAskAI);
        userQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleAskAI();
            }
        });

        async function handleAskAI() {
            const userQuestion = userQuestionInput.value.trim();
            if (!userQuestion) {
                responseArea.innerHTML = "<p>Please type a question first.</p>";
                return;
            }
            if (!GEMINI_API_KEY || GEMINI_API_KEY === "REPLACE_WITH_YOUR_NEW_API_KEY") {
                responseArea.innerHTML = "<p><strong>Error:</strong> API Key not configured in ui_manager.js.</p>";
                return;
            }

            askButton.disabled = true;
            responseArea.classList.add('loading');
            responseArea.innerHTML = "<p>Thinking...</p>";

            try {
                const pageContext = currentSubtopicDetailsText;
                const prompt = `
                    You are an expert Operating Systems tutor.
                    The user is studying the OS subtopic: "${currentSubtopicName}".
                    The content for that topic is provided below.
                    Please provide a clear, concise, and helpful answer to the user's question.
                    Base your answer primarily on the provided "OS TOPIC CONTENT".
                    If the question extends beyond the text but is related, use your broader knowledge.

                    OS TOPIC CONTENT:
                    ---
                    ${pageContext}
                    ---

                    USER'S QUESTION:
                    ${userQuestion}
                `;

                const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API call failed: ${response.status}. ${errorData.error?.message || ''}`);
                }

                const data = await response.json();
                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    const sanitizedResponse = aiResponse.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    responseArea.innerHTML = `<p>${sanitizedResponse.replace(/\n/g, '<br>')}</p>`;
                } else {
                    throw new Error("Unexpected API response structure.");
                }

            } catch (error) {
                console.error("Error interacting with Gemini API:", error);
                responseArea.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
            } finally {
                askButton.disabled = false;
                responseArea.classList.remove('loading');
            }
        }
    }


    /**
     * Calculates the completion progress for a given subject.
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
        if (mainContainer) mainContainer.innerHTML = '';
        subjectsGridElement = null;
        noResultsDivElement = null;
        subjectDetailViewElement = null;
        currentActiveSubtopicButton = null;
        detailPageProgressElement = null;
    }

    /**
     * Renders all subject cards into the main grid.
     */
    function renderSubjects(subjects) {
        document.body.classList.remove('detail-view-active');
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
            const circumference = 2 * Math.PI * 30;
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
     */
    function updateSubjectDetailProgress(subjectId) {
        const subject = DataManager.getSubjectById(subjectId);
        if (subject) {
            const progress = calculateProgress(subject);
            const progressCircleFg = document.querySelector('.detail-page-header-progress .progress-circle-fg');
            const progressText = document.querySelector('.detail-page-header-progress .progress-circle-text');
            if (progressCircleFg && progressText) {
                const circumference = 2 * Math.PI * 20;
                const offset = circumference - (progress.percentage / 100) * circumference;
                progressCircleFg.style.strokeDashoffset = offset;
                progressText.textContent = `${progress.percentage}%`;
            }
        }
    }


    /**
     * Renders the subject detail page with a left navigation panel and a right content panel.
     */
    function renderSubjectDetailPage(subject) {
        document.body.classList.add('detail-view-active');
        clearMainContainer();
        mainContainer.classList.add('subject-detail-layout');

        subjectDetailViewElement = document.createElement('div');
        subjectDetailViewElement.className = 'subject-detail-view';

        const navPanel = document.createElement('div');
        navPanel.className = 'subject-nav-panel';

        const progress = calculateProgress(subject);
        const headerCircumference = 2 * Math.PI * 20;
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

        const firstSubtopicLabel = navPanel.querySelector('.nav-subtopic-label-button');
        if (firstSubtopicLabel) {
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            firstSubtopicLabel.dispatchEvent(event);
        }
    }

    /**
     * Renders the content of a selected subtopic in the right panel.
     * This is the MODIFIED function.
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

        let subtopicName = "Selected Topic";
        let subtopicDetailsHTML = "<p>No details available for this subtopic yet.</p>";
        let subtopicDetailsText = "No details available for this subtopic yet.";

        if (subtopic) {
            subtopicName = subtopic.name;
            if (subtopic.details) {
                subtopicDetailsHTML = subtopic.details;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = subtopic.details;
                subtopicDetailsText = tempDiv.innerText || tempDiv.textContent || "";
            }
        }
        
        contentArea.innerHTML = `
            <h3 class="subtopic-content-title">${subtopicName}</h3>
            <div class="subtopic-content-details">
                ${subtopicDetailsHTML}
            </div>
        `;

        // Check if the subject is "Operating Systems" before initializing the tutor
        const subjectId = clickedLabel.dataset.subjectId;
        if (subjectId === 'os') {
            initializeAITutorWidget(subtopicName, subtopicDetailsText);
        }
    }


    // --- PUBLIC API ---
    return {
        getSubjectsGridElement: () => subjectsGridElement,
        renderSubjects,
        renderSubjectDetailPage,
        renderSubtopicContent,
        updateSubjectDetailProgress
    };
})();
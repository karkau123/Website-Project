document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    // In a real app, this might come from an API.
    // SVG icons are embedded directly for simplicity.
    const subjects = [
        {
            id: 'os',
            name: 'Operating System',
            icon: `<svg class="card-icon" style="color: #38bdf8;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
            description: 'Fundamental concepts of operating systems, process management, memory management, and concurrency.',
            topics: [
                { name: 'Introduction to OS', completed: false },
                { name: 'Process Management & CPU Scheduling', completed: false },
                { name: 'Memory Management', completed: false },
                { name: 'File Systems & Deadlocks', completed: false },
                { name: 'Concurrency & Synchronization', completed: false },
            ]
        },
        {
            id: 'dbms',
            name: 'Database Management',
            icon: `<svg class="card-icon" style="color: #34d399;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
            description: 'Core principles of database systems, SQL, normalization, and transaction management.',
            topics: [
                { name: 'Introduction to DBMS & ER Model', completed: false },
                { name: 'Relational Algebra & SQL Queries', completed: false },
                { name: 'Normalization (1NF, 2NF, 3NF, BCNF)', completed: false },
                { name: 'Transactions & Concurrency Control', completed: false },
                { name: 'Indexing and Hashing', completed: false },
            ]
        },
        {
            id: 'system-design',
            name: 'System Design',
            icon: `<svg class="card-icon" style="color: #c084fc;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="5" rx="2"></rect><rect x="2" y="16" width="20" height="5" rx="2"></rect><path d="M8 8v4"></path><path d="M12 8v4"></path><path d="M16 8v4"></path><path d="M12 3v13"></path></svg>`,
            description: 'Designing scalable, reliable, and maintainable large-scale distributed systems.',
            topics: [
                { name: 'Scalability: Horizontal vs Vertical', completed: false },
                { name: 'Load Balancing & Caching', completed: false },
                { name: 'Databases: SQL vs NoSQL', completed: false },
                { name: 'API Design (REST, GraphQL)', completed: false },
                { name: 'Common Design Patterns', completed: false },
            ]
        },
        {
            id: 'dsa',
            name: 'Data Structures',
            icon: `<svg class="card-icon" style="color: #f472b6;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
            description: 'Essential data structures and algorithms for problem-solving and coding interviews.',
            topics: [
                { name: 'Arrays, Strings & Hashing', completed: false },
                { name: 'Linked Lists, Stacks & Queues', completed: false },
                { name: 'Trees, Heaps & Graphs', completed: false },
                { name: 'Sorting & Searching Algorithms', completed: false },
                { name: 'Dynamic Programming & Greedy', completed: false },
            ]
        }
    ];

    // --- DOM ELEMENTS ---
    const subjectsGrid = document.getElementById('subjects-grid');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const noResults = document.getElementById('no-results');
    const htmlEl = document.documentElement;

    // --- FUNCTIONS ---

    /** Renders the subject cards to the DOM */
    function renderSubjects(subjectsToRender) {
        subjectsGrid.innerHTML = ''; // Clear existing cards
        if (subjectsToRender.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }

        subjectsToRender.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.dataset.subjectId = subject.id;

            const completedTopics = subject.topics.filter(t => t.completed).length;
            const totalTopics = subject.topics.length;
            const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

            card.innerHTML = `
                <div class="card-main">
                    <div class="card-header">
                        <div class="card-title-group">
                            ${subject.icon}
                            <h2 class="card-title">${subject.name}</h2>
                        </div>
                        <button class="expand-btn" aria-label="Expand details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>
                    <p class="card-description">${subject.description}</p>
                    <div class="progress-container">
                        <div class="progress-labels">
                            <span>Progress</span>
                            <span class="progress-value">${completedTopics} / ${totalTopics}</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="card-details">
                    <div class="details-section">
                        <h3>Key Topics:</h3>
                        <ul class="topics-list">
                            ${subject.topics.map((topic, index) => `
                                <li class="topic-item">
                                    <input type="checkbox" id="${subject.id}-topic-${index}" data-topic-index="${index}" ${topic.completed ? 'checked' : ''}>
                                    <label for="${subject.id}-topic-${index}">${topic.name}</label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
            subjectsGrid.appendChild(card);
        });
    }

    /** Toggles the dark mode */
    function toggleTheme() {
        htmlEl.classList.toggle('dark-mode');
        // Save preference to local storage
        if (htmlEl.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    }

    /** Loads theme from local storage */
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            htmlEl.classList.add('dark-mode');
        }
    }

    // --- EVENT LISTENERS ---

    // Search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSubjects = subjects.filter(subject =>
            subject.name.toLowerCase().includes(searchTerm) ||
            subject.description.toLowerCase().includes(searchTerm)
        );
        renderSubjects(filteredSubjects);
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Event delegation for card actions
    subjectsGrid.addEventListener('click', (e) => {
        // Expand/Collapse card
        const expandButton = e.target.closest('.expand-btn');
        if (expandButton) {
            const card = expandButton.closest('.subject-card');
            card.classList.toggle('expanded');
        }

        // Handle topic checkbox change
        const checkbox = e.target.closest('input[type="checkbox"]');
        if (checkbox) {
            const card = checkbox.closest('.subject-card');
            const subjectId = card.dataset.subjectId;
            const topicIndex = parseInt(checkbox.dataset.topicIndex);

            // Update data model
            const subject = subjects.find(s => s.id === subjectId);
            subject.topics[topicIndex].completed = checkbox.checked;

            // Update progress bar on the card
            const completedTopics = subject.topics.filter(t => t.completed).length;
            const totalTopics = subject.topics.length;
            const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

            card.querySelector('.progress-value').textContent = `${completedTopics} / ${totalTopics}`;
            card.querySelector('.progress-bar-fill').style.width = `${progress}%`;
        }
    });

    // --- INITIALIZATION ---
    loadTheme();
    renderSubjects(subjects);
});
// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// DataManager is imported and initialized within its own file,
// but we ensure it's loaded and can access it, possibly via window.DataManager if not using modules strictly.
// If DataManager exports itself as default, you'd import it:
// import DataManager from './data_manager.js'; // Adjust path as needed

document.addEventListener('DOMContentLoaded', async () => {
    // --- FIREBASE SETUP ---
    // App ID - use __app_id if available, otherwise a default
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    let firebaseApp;
    let auth;
    let currentUserId = null;

    try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        console.log("Firebase initialized in main.js.");

        // Initialize DataManager's Firebase instance (it has its own init)
        // DataManager.initFirebase(); // DataManager now auto-initializes

    } catch (error) {
        console.error("Error initializing Firebase in main.js:", error);
        // Handle initialization error (e.g., show a message to the user)
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            mainContainer.innerHTML = "<p style='color:red; text-align:center;'>Error initializing the application. Please try refreshing.</p>";
        }
        return; // Stop further execution if Firebase fails to init
    }


    // --- AUTH STATE OBSERVER ---
    onAuthStateChanged(auth, async (user) => {
        const mainContainer = document.querySelector('main.container');
        if (user) {
            currentUserId = user.uid;
            console.log("User is signed in (main.js):", user.email, "UID:", currentUserId);

            // Load all data (subjects and user-specific progress)
            // DataManager.loadAllData() will handle fetching structures and then progress
            try {
                // Show a loading indicator
                if (mainContainer) mainContainer.innerHTML = '<p style="text-align:center; padding:20px;">Loading your personalized dashboard...</p>';
                
                await window.DataManager.loadAllData(); // Use window.DataManager if it's made global
                const allSubjects = window.DataManager.getAllSubjects();
                if (typeof UIManager !== 'undefined') {
                    UIManager.renderSubjects(allSubjects);
                } else {
                    console.error("UIManager is not available.");
                }
            } catch (error) {
                console.error("Failed to load subjects and progress:", error);
                if (mainContainer) mainContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load course data. Please try again later.</p>';
            }

        } else {
            // User is signed out.
            currentUserId = null;
            console.log("User is not signed in (main.js). Redirecting to login...");
            // Clear any sensitive data from UI or DataManager's cache if necessary
            // DataManager.loadAllData() called without a userId will clear progress.
            await window.DataManager.loadAllData(); // This will load subjects without progress
             if (typeof UIManager !== 'undefined') {
                // Optionally, show a generic view or redirect
                // UIManager.renderSubjects(DataManager.getAllSubjects()); // Show subjects without progress
            }
            // Redirect to login page
            if (window.location.pathname !== "/login.html" && window.location.pathname !== "/login") { // Avoid redirect loop
                 window.location.href = "login.html";
            }
        }
    });
    
    // Attempt to sign in with custom token or anonymously
    // This needs to be after onAuthStateChanged is set up
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log("Attempting sign in with custom token.");
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Successfully signed in with custom token.");
        } else {
            console.log("No custom token, attempting anonymous sign in for initial load if no user session.");
            // Only sign in anonymously if there's no current user from a previous session
            if (!auth.currentUser) {
                 await signInAnonymously(auth);
                 console.log("Signed in anonymously for now.");
            } else {
                console.log("User session already exists:", auth.currentUser.uid);
            }
        }
    } catch (error) {
        console.error('Error during initial sign-in (custom/anonymous):', error);
        // If anonymous sign-in fails, the onAuthStateChanged will likely redirect to login.html
    }


    // --- DOM ELEMENTS ---
    const searchInput = document.getElementById('search-input');
    const siteHeaderWrapper = document.querySelector('.site-header-wrapper');
    const logoutBtn = document.getElementById('logout-btn');
    const mainContainer = document.querySelector('main.container'); // Re-select if cleared

    // --- INITIALIZATION ---
    if (typeof ThemeManager !== 'undefined') ThemeManager.init();
    // Initial data load is now handled by onAuthStateChanged

    // --- EVENT LISTENERS ---

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).catch((error) => {
                console.error('Sign out error', error);
                alert("Error signing out. Please try again.");
            });
        });
    }

    // Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (typeof UIManager !== 'undefined' && UIManager.getSubjectsGridElement()) {
                const searchTerm = e.target.value.toLowerCase().trim();
                const allLoadedSubjects = window.DataManager.getAllSubjects();
                const filteredSubjects = allLoadedSubjects.filter(subject =>
                    subject.name.toLowerCase().includes(searchTerm) ||
                    subject.description.toLowerCase().includes(searchTerm) ||
                    (subject.topics && subject.topics.some(topic =>
                        topic.name.toLowerCase().includes(searchTerm) ||
                        (topic.subtopics || []).some(subtopic => subtopic.name.toLowerCase().includes(searchTerm))
                    ))
                );
                UIManager.renderSubjects(filteredSubjects);
            }
        });
    }

    // Main container click delegation
    if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            // Handle click on a subject card link
            const cardLink = e.target.closest('.subject-card-link');
            if (cardLink && !e.target.closest('.mindmap-card-btn')) {
                e.preventDefault();
                const subjectId = cardLink.dataset.subjectId;
                const subject = window.DataManager.getSubjectById(subjectId);
                if (subject) {
                    const comingSoonSubjects = [
                        'system design',  
                        'database management system',  
                        'data structures & algorithms'
                    ];
                    if (comingSoonSubjects.includes(subject.name.toLowerCase())) {
                        // Create a simple "Coming Soon" view within the main container
                        mainContainer.innerHTML = `
                            <div style="padding: 40px; text-align: center;">
                                <button id="temp-back-btn" style="all: revert; margin-bottom:20px; padding:10px; cursor:pointer;">Back to Subjects</button>
                                <h1>Coming Soon!</h1>
                                <p>The content for <strong>${subject.name}</strong> is under development.</p>
                            </div>`;
                        document.getElementById('temp-back-btn').addEventListener('click', () => {
                             if (siteHeaderWrapper) siteHeaderWrapper.classList.remove('hidden');
                             UIManager.renderSubjects(window.DataManager.getAllSubjects());
                        });
                        if (siteHeaderWrapper) siteHeaderWrapper.classList.add('hidden');
                        return;
                    }
                    
                    if (typeof UIManager !== 'undefined') UIManager.renderSubjectDetailPage(subject);
                    if (siteHeaderWrapper) siteHeaderWrapper.classList.add('hidden');
                }
                return;
            }

            // Handle click on mindmap button
            const mindmapBtnCard = e.target.closest('.subject-card .mindmap-card-btn');
            if (mindmapBtnCard) {
                 e.preventDefault();
                 const subjectId = mindmapBtnCard.dataset.subjectId;
                 console.log("Mind Map button clicked for subject:", subjectId);
                 // This might need adjustment if mindmap.html also needs auth/data
                 window.open(`mindmap.html?subject=${subjectId}`, '_self');
                 return;
            }

            // Handle click on a subtopic label in detail view
            const subtopicLabel = e.target.closest('.nav-subtopic-label-button');
            if (subtopicLabel) {
                e.preventDefault();
                const subjectId = subtopicLabel.dataset.subjectId;
                const topicIndex = parseInt(subtopicLabel.dataset.topicIndex);
                const subtopicIndex = parseInt(subtopicLabel.dataset.subtopicIndex);

                const subject = window.DataManager.getSubjectById(subjectId);
                if (subject && subject.topics[topicIndex] && subject.topics[topicIndex].subtopics[subtopicIndex]) {
                    const subtopic = subject.topics[topicIndex].subtopics[subtopicIndex];
                    if (typeof UIManager !== 'undefined') UIManager.renderSubtopicContent(subtopic, subtopicLabel);
                }
                return;
            }

            // Handle click on "Back to Subjects" button
            if (e.target.id === 'back-to-subjects-btn' || e.target.closest('#back-to-subjects-btn')) {
                e.preventDefault();
                if (siteHeaderWrapper) siteHeaderWrapper.classList.remove('hidden');
                const allSubjects = window.DataManager.getAllSubjects(); // Should be merged data
                if (typeof UIManager !== 'undefined') UIManager.renderSubjects(allSubjects);
                if(searchInput) searchInput.value = '';
                return;
            }
        });

        // Event listener for checkbox changes (for subtopic completion)
        mainContainer.addEventListener('change', async (e) => {
            if (e.target.matches('input[type="checkbox"][data-subject-id]')) {
                const checkbox = e.target;
                const subjectId = checkbox.dataset.subjectId;
                const topicIndex = parseInt(checkbox.dataset.topicIndex);
                const subtopicIndex = parseInt(checkbox.dataset.subtopicIndex);
                const isCompleted = checkbox.checked;

                if (!currentUserId) {
                    alert("Please log in to save your progress.");
                    checkbox.checked = !isCompleted; // Revert checkbox
                    return;
                }

                // Disable checkbox temporarily to prevent rapid clicks
                checkbox.disabled = true;

                try {
                    const updatedSubject = await window.DataManager.updateSubtopicCompletion(subjectId, topicIndex, subtopicIndex, isCompleted);

                    if (updatedSubject && typeof UIManager !== 'undefined') {
                        // Update progress on the detail page header if it's currently visible
                        const detailView = document.querySelector('.subject-detail-view');
                        const detailPageTitleEl = detailView ? detailView.querySelector('.detail-page-title') : null;
                        if (detailView && detailPageTitleEl && detailPageTitleEl.textContent.includes(updatedSubject.name)) {
                             UIManager.updateSubjectDetailProgress(subjectId); // UIManager needs this function
                        }
                        // Update progress on the subject card if on the main grid view
                        // This requires UIManager to be able to refresh a single card or the grid.
                        // For simplicity, if on detail view, only update detail progress.
                        // If on grid view, a full re-render might happen or selective update.
                        // The current UIManager.renderSubjects() will re-render the whole grid.
                        // If not in detail view, we might want to refresh the grid to show updated card progress.
                        if (!detailView) {
                            UIManager.renderSubjects(window.DataManager.getAllSubjects());
                        }

                    } else if (!updatedSubject) {
                        // Update failed, DataManager should have reverted local state and alerted.
                        // Re-enable checkbox if it was reverted.
                         checkbox.checked = !isCompleted; // Ensure UI matches reverted state
                    }
                } catch (error) {
                    console.error("Error handling checkbox change in main.js:", error);
                    // Revert checkbox if an unexpected error occurred here
                    checkbox.checked = !isCompleted;
                    alert("An error occurred while saving your progress.");
                } finally {
                    checkbox.disabled = false; // Re-enable checkbox
                }
            }
        });
    }
});

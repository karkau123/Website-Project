// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- FIREBASE SETUP ---
    const firebaseConfig = {
      apiKey: "AIzaSyByfTCA3Gn18TrWubL--7mCrGjeDPeExLs",
      authDomain: "placement-preparation-website.firebaseapp.com",
      databaseURL: "https://placement-preparation-website-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "placement-preparation-website",
      storageBucket: "placement-preparation-website.firebasestorage.app",
      messagingSenderId: "667068078157",
      appId: "1:667068078157:web:f5614c76afa7e489c52404",
      measurementId: "G-1ECX1T9QHY"
    };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // --- AUTH STATE OBSERVER ---
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // User is signed out, redirect to login page.
            console.log("User is not signed in. Redirecting to login...");
            window.location.href = "login.html";
        } else {
            // User is signed in.
            console.log("User is signed in:", user.email);
        }
    });

    // --- DOM ELEMENTS ---
    const searchInput = document.getElementById('search-input');
    const mainContainer = document.querySelector('main.container');
    const siteHeaderWrapper = document.querySelector('.site-header-wrapper');
    const logoutBtn = document.getElementById('logout-btn');

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

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).catch((error) => {
                console.error('Sign out error', error);
                alert("Error signing out. Please try again.");
            });
        });
    }

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
                    // 💡 For debugging: This will print the exact subject name to the browser console (F12)
                    console.log("Clicked subject name:", subject.name);

                    // UPDATED: Expanded list of names to check for "Coming Soon" subjects
                    const comingSoonSubjects = [
                        'system design',  
                        'database management system',  
                        'data structures & algorithms' // Kept original
                    ];

                    if (comingSoonSubjects.includes(subject.name.toLowerCase())) {
                        window.location.href = 'styles/coming_soon.html'; // Redirect to coming soon page
                        return; // Stop further execution
                    }
                    
                    // Original logic for other subjects
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
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const DataManager = (() => {
    // Firebase app and services
    let app;
    let auth;
    let db;
    let userId = null; // To store the current user's ID

    // App ID - use __app_id if available, otherwise a default
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Subject data files (as before)
    const subjectDataFiles = [
        'data/os.json', // Assuming os.json is in a 'data' folder relative to index.html
        'data/dbms.json',
        'data/system_design.json',
        'data/dsa.json'
    ];
    let allSubjectsData = []; // Local cache for subject structure and content
    let userProgressData = {}; // Local cache for user's progress

    /**
     * Initializes Firebase app and services.
     * This should be called once.
     */
    async function initFirebase() {
        if (app) return; // Already initialized

        try {
            // Use __firebase_config if available
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
                // Fallback or prompt for config if __firebase_config is not available
                // For this example, I'll use the placeholder from your main.js,
                // but ideally, this should be securely provided.
                apiKey: "YOUR_API_KEY", // Replace with your actual config
                authDomain: "YOUR_AUTH_DOMAIN",
                projectId: "YOUR_PROJECT_ID",
                storageBucket: "YOUR_STORAGE_BUCKET",
                messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
                appId: "YOUR_APP_ID",
                databaseURL: "YOUR_DATABASE_URL" // if using RTDB, though we're using Firestore
            };

            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            console.log("Firebase initialized in DataManager.");

            // Listen for auth state changes to get the userId
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    userId = user.uid;
                    console.log("DataManager: User signed in:", userId);
                    // Load progress for the signed-in user
                    await loadUserProgress();
                    // After loading progress, merge it with subjects if they are already loaded
                    if (allSubjectsData.length > 0) {
                        mergeProgressWithSubjects();
                        // Potentially trigger a UI update if UIManager is ready
                        if (typeof UIManager !== 'undefined' && UIManager.renderSubjects) {
                           // UIManager.renderSubjects(getAllSubjects());
                           // This might be better handled in main.js after both subjects and progress are loaded
                        }
                    }
                } else {
                    userId = null;
                    userProgressData = {}; // Clear progress if user signs out
                    console.log("DataManager: User signed out.");
                    // If subjects are loaded, ensure they reflect no progress
                    if (allSubjectsData.length > 0) {
                        allSubjectsData.forEach(subject => {
                            subject.topics.forEach(topic => {
                                topic.subtopics.forEach(subtopic => {
                                    subtopic.completed = false;
                                });
                            });
                        });
                         // Potentially trigger a UI update
                        if (typeof UIManager !== 'undefined' && UIManager.renderSubjects) {
                           // UIManager.renderSubjects(getAllSubjects());
                        }
                    }
                }
            });

        } catch (error) {
            console.error("Error initializing Firebase in DataManager:", error);
        }
    }
    // Call initFirebase as soon as DataManager is defined
    initFirebase();


    /**
     * Fetches a JSON file from the specified path.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Object|null>} A promise that resolves with the parsed JSON data, or null if an error occurs.
     */
    async function fetchJson(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status} for ${filePath}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Loads all subject data from JSON files and augments subtopics with unique IDs.
     * @returns {Promise<Array<Object>>} A promise that resolves with an array of all subject data.
     */
    async function loadAllSubjectsStructure() {
        if (allSubjectsData.length > 0) return allSubjectsData; // Return cached if already loaded

        const subjectPromises = subjectDataFiles.map(file => fetchJson(file));
        const results = await Promise.all(subjectPromises);
        
        allSubjectsData = results.filter(subject => subject !== null);

        // Augment subtopics with unique IDs and ensure 'completed' property exists
        allSubjectsData.forEach(subject => {
            if (!subject.topics) subject.topics = [];
            subject.topics.forEach((topic, topicIndex) => {
                if (!topic.subtopics) topic.subtopics = [];
                topic.subtopics.forEach((subtopic, subtopicIndex) => {
                    // Generate a unique ID for each subtopic
                    subtopic.id = `${subject.id}_${topicIndex}_${subtopicIndex}`;
                    // Initialize 'completed' status, will be overwritten by user progress if available
                    subtopic.completed = false;
                });
            });
        });
        console.log("Subject structures loaded and augmented:", allSubjectsData);
        return allSubjectsData;
    }

    /**
     * Fetches the current user's progress from Firestore.
     */
    async function loadUserProgress() {
        if (!userId || !db) {
            console.log("Cannot load user progress: No user signed in or Firestore not initialized.");
            userProgressData = {};
            return;
        }
        // Path: /artifacts/{appId}/users/{userId}/progress_data/all_subjects_progress
        const progressDocRef = doc(db, `artifacts/${appId}/users/${userId}/progress_data/all_subjects_progress`);
        try {
            const docSnap = await getDoc(progressDocRef);
            if (docSnap.exists()) {
                userProgressData = docSnap.data().progress || {};
                console.log("User progress loaded from Firestore:", userProgressData);
            } else {
                console.log("No progress document found for user. Initializing empty progress.");
                userProgressData = {};
            }
        } catch (error) {
            console.error("Error loading user progress from Firestore:", error);
            userProgressData = {};
        }
    }

    /**
     * Merges the loaded user progress with the subject data.
     * This function should be called after both subject structures and user progress are loaded.
     */
    function mergeProgressWithSubjects() {
        if (allSubjectsData.length === 0 || Object.keys(userProgressData).length === 0 && !userId) {
             // If no user is logged in, or no progress, ensure all are marked not completed
            allSubjectsData.forEach(subject => {
                subject.topics.forEach(topic => {
                    topic.subtopics.forEach(subtopic => {
                        subtopic.completed = false;
                    });
                });
            });
            return;
        }

        allSubjectsData.forEach(subject => {
            const subjectProgress = userProgressData[subject.id]; // Array of completed subtopic IDs for this subject
            subject.topics.forEach(topic => {
                topic.subtopics.forEach(subtopic => {
                    if (subjectProgress && subjectProgress.includes(subtopic.id)) {
                        subtopic.completed = true;
                    } else {
                        subtopic.completed = false;
                    }
                });
            });
        });
        console.log("User progress merged into subjects data.");
    }

    /**
     * Loads all subjects, then user progress, then merges them.
     * This is the main function to call to get all data ready.
     */
    async function loadAllData() {
        await initFirebase(); // Ensure Firebase is ready
        await loadAllSubjectsStructure(); // Load base subject structure
        if (userId) { // Only load user progress if a user is signed in
            await loadUserProgress();
        } else {
            userProgressData = {}; // Ensure progress is empty if no user
        }
        mergeProgressWithSubjects(); // Merge them
        return allSubjectsData;
    }


    /**
     * Retrieves a subject by its ID from the local cache.
     * @param {string} subjectId - The ID of the subject to retrieve.
     * @returns {Object|null} The subject object if found, otherwise null.
     */
    function getSubjectById(subjectId) {
        return allSubjectsData.find(s => s.id === subjectId) || null;
    }
    
    /**
     * Retrieves all loaded and merged subject data.
     * @returns {Array<Object>} An array of all subject data.
     */
    function getAllSubjects() {
        return allSubjectsData;
    }

    /**
     * Updates the completion status of a specific subtopic and saves it to Firestore.
     * @param {string} subjectId - The ID of the subject.
     * @param {number} topicIndex - The index of the parent topic.
     * @param {number} subtopicIndex - The index of the subtopic.
     * @param {boolean} completed - The new completion status.
     * @returns {Promise<Object|null>} The updated subject object or null.
     */
    async function updateSubtopicCompletion(subjectId, topicIndex, subtopicIndex, completed) {
        if (!userId || !db) {
            console.error("Cannot update progress: No user signed in or Firestore not initialized.");
            // Optionally, allow local update for logged-out users but show a message
            // For now, we'll prevent updates if not logged in.
            alert("You must be logged in to save your progress.");
            return null;
        }

        const subject = getSubjectById(subjectId);
        if (!subject || !subject.topics[topicIndex] || !subject.topics[topicIndex].subtopics[subtopicIndex]) {
            console.error("Subtopic not found for update:", subjectId, topicIndex, subtopicIndex);
            return null;
        }

        const subtopicToUpdate = subject.topics[topicIndex].subtopics[subtopicIndex];
        const subtopicUniqueId = subtopicToUpdate.id;

        // 1. Update local cache first (optimistic update)
        subtopicToUpdate.completed = completed;

        // 2. Update Firestore
        // Path: /artifacts/{appId}/users/{userId}/progress_data/all_subjects_progress
        const progressDocRef = doc(db, `artifacts/${appId}/users/${userId}/progress_data/all_subjects_progress`);
        
        try {
            // Get current progress from local cache (which should be in sync or recently fetched)
            let currentSubjectProgress = userProgressData[subjectId] ? [...userProgressData[subjectId]] : [];

            if (completed) {
                if (!currentSubjectProgress.includes(subtopicUniqueId)) {
                    currentSubjectProgress.push(subtopicUniqueId);
                }
            } else {
                currentSubjectProgress = currentSubjectProgress.filter(id => id !== subtopicUniqueId);
            }
            
            // Update the specific subject's progress array in the userProgressData cache
            userProgressData[subjectId] = currentSubjectProgress;

            // Save the entire 'progress' object to Firestore
            // Using setDoc with merge might be safer if the document structure is complex,
            // but for updating a map field, updateDoc is also good.
            // We are replacing the entire 'progress' field or a part of it.
            // Let's ensure the document exists or create it.
            await setDoc(progressDocRef, { progress: userProgressData }, { merge: true });
            
            console.log(`Progress for subtopic ${subtopicUniqueId} (${completed}) saved to Firestore.`);
            return subject; // Return the updated subject for UI updates

        } catch (error) {
            console.error("Error saving subtopic completion to Firestore:", error);
            // Revert local change if Firestore update fails
            subtopicToUpdate.completed = !completed;
            // Also revert userProgressData cache
            let currentSubjectProgress = userProgressData[subjectId] ? [...userProgressData[subjectId]] : [];
            if (!completed) { // if we tried to mark as incomplete and it failed, add it back
                if (!currentSubjectProgress.includes(subtopicUniqueId)) currentSubjectProgress.push(subtopicUniqueId);
            } else { // if we tried to mark as complete and it failed, remove it
                currentSubjectProgress = currentSubjectProgress.filter(id => id !== subtopicUniqueId);
            }
            userProgressData[subjectId] = currentSubjectProgress;

            alert("Failed to save your progress. Please try again.");
            return null;
        }
    }

    // Public API exposed by the DataManager module
    return {
        initFirebase, // Expose if manual initialization is needed elsewhere, though it runs on load
        loadAllData, // Main function to get all data ready
        getSubjectById,
        getAllSubjects,
        updateSubtopicCompletion
    };
})();

// Ensure DataManager is available globally if other scripts need it.
// If using modules strictly, ensure proper exports/imports.
window.DataManager = DataManager; // Make it global for UIManager and main.js if they are not modules
export default DataManager; // If you plan to use ES6 modules throughout

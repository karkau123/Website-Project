// js/data_manager.js

const DataManager = (() => {
    const subjectDataFiles = [
        'data/os.json',
        'data/dbms.json',
        'data/system_design.json',
        'data/dsa.json'
    ];
    let allSubjectsData = [];

    /**
     * Fetches a JSON file from the specified path.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Object|null>} A promise that resolves with the parsed JSON data, or null if an error occurs.
     */
    async function fetchJson(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                const message = `HTTP error! status: ${response.status} for ${filePath}`;
                console.error(message);
                throw new Error(message); // Re-throw to be caught by loadAllSubjects
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${filePath}:`, error);
            return null; // Return null if fetch fails, so Promise.all can continue
        }
    }

    /**
     * Loads all subject data from the predefined JSON files.
     * Caches the data after the first load.
     * @returns {Promise<Array<Object>>} A promise that resolves with an array of all subject data.
     */
    async function loadAllSubjects() {
        if (allSubjectsData.length > 0) return allSubjectsData;

        const subjectPromises = subjectDataFiles.map(file => fetchJson(file));
        try {
            const results = await Promise.all(subjectPromises);
            // Filter out any null results from failed fetches
            allSubjectsData = results.filter(subject => subject !== null);

            // Ensure 'topics' and 'subtopics' arrays exist for all subjects/topics
            allSubjectsData.forEach(subject => {
                if (!subject.topics) subject.topics = [];
                subject.topics.forEach(topic => {
                    if (!topic.subtopics) topic.subtopics = [];
                });
            });
            return allSubjectsData;
        } catch (error) {
            console.error('Error loading subject data:', error);
            // If an error occurs during loading, ensure UIManager is informed
            // (assuming UIManager is globally accessible or passed in)
            // This might need a direct call or a custom event if UIManager is not global.
            // For now, we'll assume UIManager.renderSubjects can be called.
            if (typeof UIManager !== 'undefined' && UIManager.renderSubjects) {
                UIManager.renderSubjects([]); // Render an empty grid to show no results
            }
            return []; // Return empty array to indicate no data loaded
        }
    }

    /**
     * Retrieves a subject by its ID.
     * @param {string} subjectId - The ID of the subject to retrieve.
     * @returns {Object|null} The subject object if found, otherwise null.
     */
    function getSubjectById(subjectId) {
        return allSubjectsData.find(s => s.id === subjectId) || null;
    }
    
    /**
     * Retrieves all loaded subject data.
     * @returns {Array<Object>} An array of all subject data.
     */
    function getAllSubjects() {
        return allSubjectsData;
    }

    /**
     * Updates the completion status of a specific subtopic within a subject.
     * @param {string} subjectId - The ID of the subject.
     * @param {number} topicIndex - The index of the parent topic within the subject.
     * @param {number} subtopicIndex - The index of the subtopic within its parent topic.
     * @param {boolean} completed - The new completion status (true for completed, false for incomplete).
     * @returns {Object|null} The updated subject object if the subtopic was found and updated, otherwise null.
     */
    function updateSubtopicCompletion(subjectId, topicIndex, subtopicIndex, completed) {
        const subject = getSubjectById(subjectId);
        if (subject && subject.topics[topicIndex] && subject.topics[topicIndex].subtopics[subtopicIndex]) {
            subject.topics[topicIndex].subtopics[subtopicIndex].completed = completed;
            // No need to re-render all subjects here, UIManager will handle specific card updates
            return subject;
        }
        return null;
    }

    // Public API exposed by the DataManager module
    return {
        loadAllSubjects,
        getSubjectById,
        getAllSubjects,
        updateSubtopicCompletion
    };
})();

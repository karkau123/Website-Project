// js/theme_manager.js

/**
 * Manages theme switching (light/dark mode).
 */
const ThemeManager = (() => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    /**
     * Toggles the dark mode on/off.
     */
    function toggleTheme() {
        htmlEl.classList.toggle('dark-mode');
        // Save preference to local storage
        if (htmlEl.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    }

    /**
     * Loads the saved theme from local storage on page load.
     */
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            htmlEl.classList.add('dark-mode');
        } else {
            htmlEl.classList.remove('dark-mode'); // Ensure it's light if not dark or no preference
        }
    }

    /**
     * Initializes theme functionality.
     */
    function init() {
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        } else {
            console.warn('Theme toggle button not found.');
        }
        loadTheme();
    }

    // Public API
    return {
        init,
        toggleTheme, // Expose if needed externally, though init handles listener
        loadTheme    // Expose if needed externally
    };
})();

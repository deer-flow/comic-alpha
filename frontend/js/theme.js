/**
 * Theme Manager Module
 * Handles dark mode / light mode switching
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'comic-perfect-theme';
        this.currentTheme = this.loadTheme();
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = localStorage.getItem(this.STORAGE_KEY);
                if (!savedTheme) {
                    this.setTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        }
    }

    /**
     * Load theme from localStorage or system preference
     * @returns {string} Theme name ('light' or 'dark')
     */
    loadTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme) {
            return savedTheme;
        }

        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Save theme to localStorage
     * @param {string} theme - Theme name
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    applyTheme(theme) {
        const html = document.documentElement;

        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }

        this.currentTheme = theme;
        this.updateThemeButton();
    }

    /**
     * Set theme and save preference
     * @param {string} theme - Theme name ('light' or 'dark')
     * @param {boolean} save - Whether to save to localStorage (default: true)
     */
    setTheme(theme, save = true) {
        this.applyTheme(theme);
        if (save) {
            this.saveTheme(theme);
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Update theme button icon and text
     */
    updateThemeButton() {
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            const icon = themeBtn.querySelector('.theme-icon');
            if (icon) {
                // Sun icon for light mode, Moon icon for dark mode
                icon.textContent = this.currentTheme === 'light' ? '☀️' : '🌙';
            }

            // Update text label with i18n support
            const textSpan = themeBtn.querySelector('span[data-i18n]');
            if (textSpan && window.i18n) {
                const textKey = this.currentTheme === 'light' ? 'themeBtnLight' : 'themeBtnDark';
                textSpan.textContent = window.i18n.t(textKey);
                textSpan.setAttribute('data-i18n', textKey);
            }
        }
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.themeManager = themeManager;

    // Global function for button onclick
    window.toggleTheme = function () {
        themeManager.toggleTheme();
    };
}

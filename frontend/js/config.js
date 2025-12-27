/**
 * Configuration Module - Manages user settings and preferences
 */

const DEFAULT_CONFIG = {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    customModel: ''
};

class ConfigManager {
    /**
     * Load configuration from localStorage
     * @returns {Object} Configuration object
     */
    static loadConfig() {
        try {
            const savedConfig = localStorage.getItem('comic_ai_config');
            if (savedConfig) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        }
        return { ...DEFAULT_CONFIG };
    }

    /**
     * Save configuration to localStorage
     * @param {Object} config - Configuration to save
     * @returns {boolean} Success status
     */
    static saveConfig(config) {
        try {
            localStorage.setItem('comic_ai_config', JSON.stringify(config));
            return true;
        } catch (e) {
            console.error('Failed to save config:', e);
            return false;
        }
    }

    /**
     * Get current configuration with resolved model name
     * @returns {Object} Current configuration
     */
    static getCurrentConfig() {
        const config = this.loadConfig();
        let modelName = config.model;

        if (config.model === 'custom' && config.customModel) {
            modelName = config.customModel;
        }

        return {
            baseUrl: config.baseUrl,
            model: modelName
        };
    }

    /**
     * Load API key from localStorage
     * @returns {string} Saved API key or empty string
     */
    static loadApiKey() {
        try {
            return localStorage.getItem('comic_api_key') || '';
        } catch (e) {
            console.error('Failed to load API key:', e);
            return '';
        }
    }

    /**
     * Save API key to localStorage
     * @param {string} apiKey - API key to save
     * @returns {boolean} Success status
     */
    static saveApiKey(apiKey) {
        try {
            const trimmedKey = apiKey.trim();
            if (trimmedKey) {
                localStorage.setItem('comic_api_key', trimmedKey);
            } else {
                localStorage.removeItem('comic_api_key');
            }
            return true;
        } catch (e) {
            console.error('Failed to save API key:', e);
            return false;
        }
    }

    /**
     * Load Google API key from localStorage
     * @returns {string} Saved Google API key or empty string
     */
    static loadGoogleApiKey() {
        try {
            return localStorage.getItem('comic_google_api_key') || '';
        } catch (e) {
            console.error('Failed to load Google API key:', e);
            return '';
        }
    }

    /**
     * Save Google API key to localStorage
     * @param {string} apiKey - Google API key to save
     * @returns {boolean} Success status
     */
    static saveGoogleApiKey(apiKey) {
        try {
            const trimmedKey = apiKey.trim();
            if (trimmedKey) {
                localStorage.setItem('comic_google_api_key', trimmedKey);
            } else {
                localStorage.removeItem('comic_google_api_key');
            }
            return true;
        } catch (e) {
            console.error('Failed to save Google API key:', e);
            return false;
        }
    }

    /**
     * Clear all saved configuration
     */
    static clearConfig() {
        try {
            localStorage.removeItem('comic_ai_config');
            localStorage.removeItem('comic_api_key');
            localStorage.removeItem('comic_google_api_key');
        } catch (e) {
            console.error('Failed to clear config:', e);
        }
    }
}

// Export for use in other modules
window.ConfigManager = ConfigManager;
window.DEFAULT_CONFIG = DEFAULT_CONFIG;

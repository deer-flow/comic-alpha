/**
 * API Module - Handles all backend API calls
 */

const API_BASE_URL = 'http://localhost:5003/api';

class ComicAPI {
    /**
     * Generate comic script using AI
     * @param {string} apiKey - OpenAI API key
     * @param {string} prompt - User's comic description
     * @param {number} pageCount - Number of pages to generate
     * @param {string} baseUrl - OpenAI API base URL
     * @param {string} model - Model name
     * @param {string} comicStyle - Comic style (e.g., 'doraemon', 'manga', etc.)
     * @param {string} language - Comic language (e.g., 'zh', 'en', 'ja')
     * @returns {Promise<Object>} Generated comic pages
     */
    static async generateComic(apiKey, prompt, pageCount, baseUrl, model, comicStyle = 'doraemon', language = 'zh') {
        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    prompt: prompt,
                    page_count: pageCount,
                    base_url: baseUrl,
                    model: model,
                    comic_style: comicStyle,
                    language: language
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    /**
     * Validate comic script format
     * @param {Object|Array} script - Comic script to validate
     * @returns {Promise<Object>} Validation result
     */
    static async validateScript(script) {
        try {
            const response = await fetch(`${API_BASE_URL}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    script: script
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Validation failed:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', message: error.message };
        }
    }

    /**
     * Generate final comic image from page data
     * @param {Object} pageData - Comic page data
     * @param {string} googleApiKey - Google API key for image generation
     * @param {string} referenceImg - Optional reference image URL
     * @param {Object} extraBody - Optional extra parameters
     * @returns {Promise<Object>} Generated image result
     */
    static async generateComicImage(pageData, googleApiKey, referenceImg = null, extraBody = null, comicStyle = 'doraemon') {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page_data: pageData,
                    google_api_key: googleApiKey,
                    reference_img: referenceImg,
                    extra_body: extraBody,
                    comic_style: comicStyle
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Image generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate Xiaohongshu (Little Red Book) post content
     * @param {string} apiKey - OpenAI API key
     * @param {Array|Object} comicData - Comic pages data
     * @param {string} baseUrl - OpenAI API base URL
     * @param {string} model - Model name
     * @returns {Promise<Object>} Generated Xiaohongshu content
     */
    static async generateXiaohongshuContent(apiKey, comicData, baseUrl, model) {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-xiaohongshu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    comic_data: comicData,
                    base_url: baseUrl,
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Xiaohongshu content generation failed:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.ComicAPI = ComicAPI;

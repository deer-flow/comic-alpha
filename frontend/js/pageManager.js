/**
 * Page Manager Module - Manages multiple comic pages
 */

class PageManager {
    constructor() {
        this.pages = [];
        this.currentPageIndex = 0;
    }

    /**
     * Set pages data
     * @param {Array} pages - Array of page data
     */
    setPages(pages) {
        if (!Array.isArray(pages)) {
            this.pages = [pages];
        } else {
            this.pages = pages;
        }
        this.currentPageIndex = 0;
    }

    /**
     * Get current page data
     * @returns {Object|null} Current page data
     */
    getCurrentPage() {
        if (this.pages.length === 0) {
            return null;
        }
        return this.pages[this.currentPageIndex];
    }

    /**
     * Get page by index
     * @param {number} index - Page index
     * @returns {Object|null} Page data
     */
    getPage(index) {
        if (index < 0 || index >= this.pages.length) {
            return null;
        }
        return this.pages[index];
    }

    /**
     * Go to next page
     * @returns {boolean} Success status
     */
    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            return true;
        }
        return false;
    }

    /**
     * Go to previous page
     * @returns {boolean} Success status
     */
    prevPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            return true;
        }
        return false;
    }

    /**
     * Go to specific page
     * @param {number} index - Page index
     * @returns {boolean} Success status
     */
    goToPage(index) {
        if (index >= 0 && index < this.pages.length) {
            this.currentPageIndex = index;
            return true;
        }
        return false;
    }

    /**
     * Get total page count
     * @returns {number} Total pages
     */
    getPageCount() {
        return this.pages.length;
    }

    /**
     * Get current page index (0-based)
     * @returns {number} Current page index
     */
    getCurrentPageIndex() {
        return this.currentPageIndex;
    }

    /**
     * Set current page index
     * @param {number} index - Page index to set
     * @returns {boolean} Success status
     */
    setCurrentPageIndex(index) {
        return this.goToPage(index);
    }

    /**
     * Check if has next page
     * @returns {boolean} Has next page
     */
    hasNextPage() {
        return this.currentPageIndex < this.pages.length - 1;
    }

    /**
     * Check if has previous page
     * @returns {boolean} Has previous page
     */
    hasPrevPage() {
        return this.currentPageIndex > 0;
    }

    /**
     * Get all pages
     * @returns {Array} All pages
     */
    getAllPages() {
        return this.pages;
    }

    /**
     * Clear all pages
     */
    clear() {
        this.pages = [];
        this.currentPageIndex = 0;
    }

    /**
     * Update current page data
     * @param {Object} data - Updated page data
     * @returns {boolean} Success status
     */
    updateCurrentPage(data) {
        if (this.pages.length === 0) {
            return false;
        }
        this.pages[this.currentPageIndex] = data;
        return true;
    }
}

// Export for use in other modules
window.PageManager = PageManager;

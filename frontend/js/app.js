/**
 * UI Controller Module - Main application controller
 */

class UIController {
    constructor() {
        this.pageManager = new PageManager();
        this.renderer = new ComicRenderer('comic-page');
        this.isGenerating = false;
        
        // Initialize i18n
        if (window.i18n) {
            window.i18n.init();
        }
        
        this.initElements();
        this.initEventListeners();
        this.loadInitialConfig();
        this.initLanguage();
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Input elements
        this.apiKeyInput = document.getElementById('api-key');
        this.googleApiKeyInput = document.getElementById('google-api-key');
        this.promptInput = document.getElementById('prompt-input');
        this.pageCountInput = document.getElementById('page-count');
        this.comicStyleSelect = document.getElementById('comic-style');
        this.comicLanguageSelect = document.getElementById('comic-language');
        this.jsonInput = document.getElementById('json-input');
        
        // Config elements
        this.baseUrlInput = document.getElementById('base-url');
        this.modelSelect = document.getElementById('model-select');
        this.customModelInput = document.getElementById('custom-model');
        this.configPanel = document.getElementById('config-panel');
        
        // Button elements
        this.generateBtn = document.querySelector('button[onclick="generateWithAI()"]');
        this.renderBtn = document.querySelector('button[onclick="renderComic()"]');
        this.downloadBtn = document.querySelector('.download-btn');
        this.generateAllBtn = document.getElementById('generate-all-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // Status elements
        this.aiStatus = document.getElementById('ai-status');
        this.errorMsg = document.getElementById('error-msg');
        this.pageIndicator = document.getElementById('page-indicator');
        this.pageNav = document.getElementById('page-nav');
        this.actionButtons = document.getElementById('action-buttons');
        
        // Hide download button initially
        if (this.downloadBtn) {
            this.downloadBtn.style.display = 'none';
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // API key auto-save
        this.apiKeyInput.addEventListener('blur', () => {
            ConfigManager.saveApiKey(this.apiKeyInput.value);
        });
        
        // Google API key auto-save
        this.googleApiKeyInput.addEventListener('blur', () => {
            ConfigManager.saveGoogleApiKey(this.googleApiKeyInput.value);
        });

        // Model select change
        this.modelSelect.addEventListener('change', () => {
            const customInput = document.getElementById('custom-model-input');
            if (this.modelSelect.value === 'custom') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
            }
        });
        
        // Listen for language change events
        window.addEventListener('languageChanged', (e) => {
            this.onLanguageChanged(e.detail.lang);
        });
        
        // Add keyboard shortcut for Command+Enter (or Ctrl+Enter on Windows/Linux)
        this.promptInput.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                this.generateWithAI();
            }
        });
    }

    /**
     * Initialize language selector
     */
    initLanguage() {
        const languageSelect = document.getElementById('language-select');
        if (languageSelect && window.i18n) {
            const currentLang = window.i18n.getLanguage();
            languageSelect.value = currentLang;
            
            // Sync comic language with interface language on page load
            const comicLanguageSelect = document.getElementById('comic-language');
            if (comicLanguageSelect) {
                comicLanguageSelect.value = currentLang;
            }
        }
    }
    
    /**
     * Handle language change
     * @param {string} lang - New language code
     */
    onLanguageChanged(lang) {
        // Update page indicator if visible
        if (this.pageManager.getPageCount() > 0) {
            const current = this.pageManager.getCurrentPageIndex() + 1;
            const total = this.pageManager.getPageCount();
            this.pageIndicator.innerText = ' (' + window.i18n.t('pageIndicator', { current, total }) + ')';
        }
    }

    /**
     * Load initial configuration
     */
    loadInitialConfig() {
        const config = ConfigManager.loadConfig();
        this.baseUrlInput.value = config.baseUrl;
        this.modelSelect.value = config.model;
        
        if (config.customModel) {
            this.customModelInput.value = config.customModel;
        }
        
        if (config.model === 'custom') {
            document.getElementById('custom-model-input').style.display = 'block';
        }
        
        // Load saved API key
        const savedApiKey = ConfigManager.loadApiKey();
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
        
        // Load saved Google API key
        const savedGoogleApiKey = ConfigManager.loadGoogleApiKey();
        if (savedGoogleApiKey) {
            this.googleApiKeyInput.value = savedGoogleApiKey;
        }
        
        // Set up renderer onChange callback
        this.renderer.setOnChange((data) => {
            this.onComicDataChange(data);
        });
        
        // Render initial comic
        this.renderComic();
    }

    /**
     * Toggle configuration panel
     */
    toggleConfig() {
        if (this.configPanel.style.display === 'none') {
            this.configPanel.style.display = 'block';
        } else {
            this.configPanel.style.display = 'none';
        }
    }

    /**
     * Save configuration
     */
    saveConfig() {
        const baseUrl = this.baseUrlInput.value.trim();
        const model = this.modelSelect.value;
        const customModel = this.customModelInput.value.trim();
        
        if (!baseUrl) {
            alert(window.i18n.t('alertNoBaseUrl'));
            return;
        }
        
        if (model === 'custom' && !customModel) {
            alert(window.i18n.t('alertNoCustomModel'));
            return;
        }
        
        const config = {
            baseUrl: baseUrl,
            model: model,
            customModel: customModel
        };
        
        if (ConfigManager.saveConfig(config)) {
            alert(window.i18n.t('alertConfigSaved'));
        } else {
            alert(window.i18n.t('alertConfigFailed'));
        }
    }

    /**
     * Generate comic with AI
     */
    async generateWithAI() {
        if (this.isGenerating) return;
        
        const apiKey = this.apiKeyInput.value.trim();
        const prompt = this.promptInput.value.trim();
        const pageCount = parseInt(this.pageCountInput.value) || 3;
        const comicStyle = this.comicStyleSelect.value;
        const language = this.comicLanguageSelect.value;
        
        // Validate inputs
        if (!apiKey) {
            alert(window.i18n.t('alertNoApiKey'));
            return;
        }
        
        if (!prompt) {
            alert(window.i18n.t('alertNoPrompt'));
            return;
        }
        
        const originalBtnContent = this.generateBtn.innerHTML;

        try {
            this.isGenerating = true;
            const config = ConfigManager.getCurrentConfig();
            
            // Update UI with spinner
            this.generateBtn.disabled = true;
            this.generateBtn.classList.add('loading');
            this.generateBtn.innerHTML = '<span class="spinner" style="margin-right: 0;"></span>';
            // this.showStatus(window.i18n.t('statusGenerating', { model: config.model }), 'info');
            
            // Call API
            const result = await ComicAPI.generateComic(
                apiKey,
                prompt,
                pageCount,
                config.baseUrl,
                config.model,
                comicStyle,
                language
            );
            
            // Update page manager
            this.pageManager.setPages(result.pages);
            
            // Show action buttons container
            if (this.actionButtons) {
                this.actionButtons.style.display = 'flex';
            }

            // Show download button after generation
            if (this.downloadBtn) {
                this.downloadBtn.style.display = 'block';
            }
            
            // Show navigation if multiple pages
            if (result.page_count > 1) {
                this.pageNav.style.display = 'flex';
                this.generateAllBtn.style.display = 'block';
            } else {
                this.pageNav.style.display = 'none';
                this.generateAllBtn.style.display = 'none';
            }
            
            // Show Xiaohongshu button
            const xiaohongshuBtn = document.getElementById('xiaohongshu-btn');
            if (xiaohongshuBtn) {
                xiaohongshuBtn.style.display = 'block';
            }
            
            // Load first page
            this.loadCurrentPage();
            
            // Show success
            this.showStatus(window.i18n.t('statusSuccess', { count: result.page_count }), 'success');
            setTimeout(() => this.hideStatus(), 3000);
            
        } catch (error) {
            console.error('AI generation failed:', error);
            this.showStatus(window.i18n.t('statusError', { error: error.message }), 'error');
            
            let errorMsg = window.i18n.t('errorGenerationFailed', { error: error.message });
            alert(errorMsg);
        } finally {
            this.isGenerating = false;
            this.generateBtn.disabled = false;
            this.generateBtn.classList.remove('loading');
            if (typeof originalBtnContent !== 'undefined') {
                this.generateBtn.innerHTML = originalBtnContent;
            }
        }
    }

    /**
     * Render comic from JSON input
     */
    renderComic() {
        const input = this.jsonInput.value;
        
        // Skip rendering if input is empty
        if (!input || input.trim() === '') {
            return;
        }
        
        try {
            const data = JSON.parse(input);
            this.errorMsg.style.display = 'none';
            
            if (this.renderer.render(data)) {
                // Success - show comic page and hint
                const comicPage = document.getElementById('comic-page');
                const editHint = document.querySelector('.edit-hint');
                const previewContainer = document.querySelector('.preview-container');
                
                if (comicPage) comicPage.style.display = 'flex';
                if (editHint) editHint.style.display = 'block';
                if (previewContainer) previewContainer.classList.add('has-content');
                
                // Show action buttons
                if (this.actionButtons) this.actionButtons.style.display = 'flex';
                if (this.downloadBtn) this.downloadBtn.style.display = 'block';
                
                // Check if we need to show Xiaohongshu button (if we have pages)
                if (this.pageManager.getPageCount() > 0) {
                    const xiaohongshuBtn = document.getElementById('xiaohongshu-btn');
                    if (xiaohongshuBtn) xiaohongshuBtn.style.display = 'block';
                }

                // Check if we need to show Generate All button (if we have multiple pages)
                if (this.pageManager.getPageCount() > 1) {
                    if (this.generateAllBtn) this.generateAllBtn.style.display = 'block';
                }
            } else {
                throw new Error('Render failed');
            }
        } catch (e) {
            console.error(e);
            this.errorMsg.style.display = 'block';
            this.errorMsg.innerText = 'JSON 格式错误: ' + e.message;
        }
    }

    /**
     * Handle comic data changes from direct editing
     * @param {Object} data - Updated comic data
     */
    onComicDataChange(data) {
        // Update JSON input (even though it's hidden)
        this.jsonInput.value = JSON.stringify(data, null, 2);
        
        // Update page manager if we're in multi-page mode
        if (this.pageManager.getPageCount() > 0) {
            this.pageManager.updateCurrentPage(data);
        }
    }

    /**
     * Load current page
     */
    loadCurrentPage() {
        const pageData = this.pageManager.getCurrentPage();
        if (!pageData) return;
        
        // Update JSON editor
        this.jsonInput.value = JSON.stringify(pageData, null, 2);
        
        // Update page indicator
        const current = this.pageManager.getCurrentPageIndex() + 1;
        const total = this.pageManager.getPageCount();
        this.pageIndicator.innerText = ' (' + window.i18n.t('pageIndicator', { current, total }) + ')';
        
        // Update button states
        this.prevBtn.disabled = !this.pageManager.hasPrevPage();
        this.nextBtn.disabled = !this.pageManager.hasNextPage();
        
        // Render
        this.renderComic();
    }

    /**
     * Go to previous page
     */
    prevPage() {
        if (this.pageManager.prevPage()) {
            this.loadCurrentPage();
        }
    }

    /**
     * Go to next page
     */
    nextPage() {
        if (this.pageManager.nextPage()) {
            this.loadCurrentPage();
        }
    }

    /**
     * Download current page
     */
    async downloadCurrentPage() {
        const btn = this.downloadBtn;
        const originalText = btn.innerText;
        
        try {
            btn.disabled = true;
            btn.innerText = '生成中...';
            
            const element = this.renderer.getContainer();
            const success = await ComicExporter.downloadPage(element);
            
            if (!success) {
                alert('图片生成失败，请重试');
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('下载失败: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }



    /**
     * Generate final comic image from current page
     */
    async generateFinalImage() {
        const pageData = this.pageManager.getCurrentPage();
        
        if (!pageData) {
            alert(window.i18n.t('alertNoPageData'));
            return;
        }
        
        // Check Google API key
        const googleApiKey = this.googleApiKeyInput.value.trim();
        if (!googleApiKey) {
            alert(window.i18n.t('alertNoGoogleApiKey') || 'Please configure Google API Key in settings');
            return;
        }
        
        // Get the button element
        const generateImageBtn = document.querySelector('button[onclick="generateFinalImage()"]');
        
        try {
            // Add loading state - only disable and add spinner, no text change
            if (generateImageBtn) {
                generateImageBtn.disabled = true;
                generateImageBtn.classList.add('loading');
            }
            
            this.showStatus(window.i18n.t('statusPreparing'), 'info');
            
            // Get current sketch as base64 (layout only, without text)
            const element = this.renderer.getContainer();
            const sketchBase64 = await ComicExporter.getBase64WithoutText(element);
            
            // Get current comic style
            const comicStyle = this.comicStyleSelect.value;
            
            this.showStatus(window.i18n.t('statusGeneratingImage'), 'info');
            
            // Call API to generate image with sketch as reference
            const result = await ComicAPI.generateComicImage(pageData, googleApiKey, sketchBase64, null, comicStyle);
            
            if (result.success && result.image_url) {
                // Show the generated image
                this.displayGeneratedImage(result.image_url);
                this.showStatus(window.i18n.t('statusImageSuccess'), 'success');
                setTimeout(() => this.hideStatus(), 3000);
            } else {
                throw new Error('Image generation failed');
            }
            
        } catch (error) {
            console.error('Image generation failed:', error);
            this.showStatus(window.i18n.t('statusError', { error: error.message }), 'error');
            
            let errorMsg = window.i18n.t('errorImageFailed', { error: error.message });
            alert(errorMsg);
        } finally {
            // Restore button state - only remove disabled and loading class
            if (generateImageBtn) {
                generateImageBtn.disabled = false;
                generateImageBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Generate all pages images with AI
     * Uses previous generated pages as reference for consistency
     */
    async generateAllPagesImages() {
        const totalPages = this.pageManager.getPageCount();
        
        if (totalPages === 0) {
            alert(window.i18n.t('alertNoPages'));
            return;
        }
        
        // Check Google API key
        const googleApiKey = this.googleApiKeyInput.value.trim();
        if (!googleApiKey) {
            alert(window.i18n.t('alertNoGoogleApiKey') || 'Please configure Google API Key in settings');
            return;
        }
        
        // Confirm with user
        if (!confirm(window.i18n.t('alertGenerateAll', { total: totalPages }))) {
            return;
        }
        
        const generatedImages = []; // Store generated image URLs
        const comicStyle = this.comicStyleSelect.value;
        const originalPageIndex = this.pageManager.getCurrentPageIndex();
        
        try {
            // Disable buttons during generation - only disable and add spinner, no text change
            this.generateAllBtn.disabled = true;
            this.generateAllBtn.classList.add('loading');
            
            for (let i = 0; i < totalPages; i++) {
                // Update status with spinner
                this.showStatus(window.i18n.t('statusGeneratingPage', { current: i + 1, total: totalPages }), 'info');
                
                // Navigate to the page
                this.pageManager.setCurrentPageIndex(i);
                this.loadCurrentPage();
                
                // Wait for rendering
                await this._delay(300);
                
                // Get current page data
                const pageData = this.pageManager.getCurrentPage();
                
                // Get current sketch as base64 (layout only)
                const element = this.renderer.getContainer();
                const sketchBase64 = await ComicExporter.getBase64WithoutText(element);
                
                // Prepare reference images (use previous 2-3 generated pages)
                let previousPages = null;
                if (generatedImages.length > 0) {
                    // Use the last 2 pages as reference (or fewer if not available)
                    const refCount = Math.min(2, generatedImages.length);
                    previousPages = generatedImages.slice(-refCount);
                }
                
                // Generate image with sketch and previous pages as reference
                // Pass sketch as reference_img and previous pages as extra_body
                const result = await ComicAPI.generateComicImage(
                    pageData,
                    googleApiKey,
                    sketchBase64, 
                    previousPages,  // Pass previous pages as extra_body parameter
                    comicStyle
                );
                
                if (result.success && result.image_url) {
                    generatedImages.push({
                        pageIndex: i,
                        imageUrl: result.image_url,
                        pageTitle: pageData.title || `第 ${i + 1} 页`
                    });
                } else {
                    throw new Error(`第 ${i + 1} 页生成失败`);
                }
                
                // Small delay between generations
                await this._delay(500);
            }
            
            // Restore original page
            this.pageManager.setCurrentPageIndex(originalPageIndex);
            this.loadCurrentPage();
            
            // Show success and display all generated images
            this.showStatus(window.i18n.t('statusAllSuccess', { total: totalPages }), 'success');
            this.displayAllGeneratedImages(generatedImages);
            
        } catch (error) {
            console.error('Batch generation failed:', error);
            this.showStatus(window.i18n.t('statusError', { error: error.message }), 'error');
            
            // Restore original page
            this.pageManager.setCurrentPageIndex(originalPageIndex);
            this.loadCurrentPage();
            
            // If some images were generated, still show them
            if (generatedImages.length > 0) {
                alert(window.i18n.t('alertBatchError', { success: generatedImages.length, total: totalPages, error: error.message }));
                this.displayAllGeneratedImages(generatedImages);
            } else {
                alert(window.i18n.t('alertBatchFailed', { error: error.message }));
            }
        } finally {
            // Restore button state - only remove disabled and loading class
            this.generateAllBtn.disabled = false;
            this.generateAllBtn.classList.remove('loading');
        }
    }

    /**
     * Display all generated images in a gallery modal
     * @param {Array} images - Array of generated image objects
     */
    displayAllGeneratedImages(images) {
        if (!images || images.length === 0) return;
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            z-index: 10000;
            overflow-y: auto;
            padding: 20px;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
        `;
        header.innerText = window.i18n.t('modalGeneratedTitle', { count: images.length });
        
        // Create gallery container
        const gallery = document.createElement('div');
        gallery.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        `;
        
        // Add each image
        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            `;
            
            const title = document.createElement('div');
            title.style.cssText = `
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 16px;
            `;
            title.innerText = img.pageTitle;
            
            const image = document.createElement('img');
            image.src = img.imageUrl;
            image.style.cssText = `
                width: 100%;
                height: auto;
                display: block;
                border-radius: 4px;
                margin-bottom: 10px;
            `;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.innerText = window.i18n.t('btnDownloadThis');
            downloadBtn.style.cssText = `
                width: 100%;
                padding: 8px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            downloadBtn.onclick = () => {
                this.downloadImageFromUrl(img.imageUrl);
            };
            
            card.appendChild(title);
            card.appendChild(image);
            card.appendChild(downloadBtn);
            gallery.appendChild(card);
        });
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        `;
        
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.innerText = window.i18n.t('btnDownloadAll');
        downloadAllBtn.style.cssText = `
            flex: 1;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        downloadAllBtn.onclick = async () => {
            downloadAllBtn.disabled = true;
            downloadAllBtn.innerText = window.i18n.t('btnDownloading');
            for (let i = 0; i < images.length; i++) {
                await this.downloadImageFromUrl(images[i].imageUrl);
                await this._delay(500); // Delay between downloads
            }
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerText = window.i18n.t('btnDownloadAll');
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.innerText = window.i18n.t('btnClose');
        closeBtn.style.cssText = `
            flex: 1;
            padding: 12px 24px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        actions.appendChild(downloadAllBtn);
        actions.appendChild(closeBtn);
        
        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(gallery);
        modal.appendChild(actions);
        
        // Add to page
        document.body.appendChild(modal);
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Display generated image in a modal or new window
     * @param {string} imageUrl - URL of the generated image
     */
    displayGeneratedImage(imageUrl) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        // Create image container
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        // Create image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 100%;
            max-height: 80vh;
            display: block;
        `;
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = window.i18n.t('btnDownloadImage');
        downloadBtn.style.cssText = `
            margin-top: 15px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
        `;
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            this.downloadImageFromUrl(imageUrl);
        };
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = window.i18n.t('btnClose');
        closeBtn.style.cssText = `
            margin-top: 10px;
            padding: 10px 20px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
        `;
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            document.body.removeChild(modal);
        };
        
        // Assemble modal
        imgContainer.appendChild(img);
        imgContainer.appendChild(downloadBtn);
        imgContainer.appendChild(closeBtn);
        modal.appendChild(imgContainer);
        
        // Close on background click
        modal.onclick = () => {
            document.body.removeChild(modal);
        };
        
        // Prevent closing when clicking on image container
        imgContainer.onclick = (e) => {
            e.stopPropagation();
        };
        
        // Add to page
        document.body.appendChild(modal);
    }

    /**
     * Download image from URL
     * @param {string} imageUrl - URL of the image to download
     */
    async downloadImageFromUrl(imageUrl) {
        try {
            try {
                const response = await fetch(imageUrl, { mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `comic-final-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                    return;
                }
            } catch (directError) {
                console.warn('Direct download failed:', directError);
            }
            
            // Last resort: open in new tab (user can right-click save)
            window.open(imageUrl, '_blank');
            alert(window.i18n.t('alertDownloadAlt'));
            
        } catch (error) {
            console.error('Download failed:', error);
            alert(window.i18n.t('alertDownloadFailed'));
        }
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Message type (info, success, error)
     */
    showStatus(message, type = 'info') {
        this.aiStatus.style.display = 'block';
        this.aiStatus.innerText = message;
        
        switch (type) {
            case 'success':
                this.aiStatus.style.color = '#28a745';
                break;
            case 'error':
                this.aiStatus.style.color = '#dc3545';
                break;
            default:
                this.aiStatus.style.color = '#666';
        }
    }

    /**
     * Hide status message
     */
    hideStatus() {
        this.aiStatus.style.display = 'none';
    }

    /**
     * Generate Xiaohongshu post content
     */
    async generateXiaohongshuContent() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert(window.i18n.t('alertNoApiKey'));
            return;
        }
        
        const comicData = this.pageManager.getAllPages();
        
        if (!comicData || comicData.length === 0) {
            alert(window.i18n.t('alertNoComicData'));
            return;
        }
        
        // Get the button element
        const xiaohongshuBtn = document.getElementById('xiaohongshu-btn');
        
        try {
            // Add loading state - only disable and add spinner, no text change
            if (xiaohongshuBtn) {
                xiaohongshuBtn.disabled = true;
                xiaohongshuBtn.classList.add('loading');
            }
            
            this.showStatus(window.i18n.t('statusXiaohongshu'), 'info');
            
            const config = ConfigManager.getCurrentConfig();
            
            const result = await ComicAPI.generateXiaohongshuContent(
                apiKey,
                comicData,
                config.baseUrl,
                config.model
            );
            
            if (result.success) {
                this.displayXiaohongshuContent(result.title, result.content, result.tags);
                this.showStatus(window.i18n.t('statusXiaohongshuSuccess'), 'success');
                setTimeout(() => this.hideStatus(), 3000);
            } else {
                throw new Error('Content generation failed');
            }
            
        } catch (error) {
            console.error('Xiaohongshu content generation failed:', error);
            this.showStatus(window.i18n.t('statusError', { error: error.message }), 'error');
            alert(window.i18n.t('statusError', { error: error.message }));
        } finally {
            // Restore button state - only remove disabled and loading class
            if (xiaohongshuBtn) {
                xiaohongshuBtn.disabled = false;
                xiaohongshuBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Display Xiaohongshu content in a modal
     * @param {string} title - Post title
     * @param {string} content - Post content
     * @param {Array} tags - Post tags
     */
    displayXiaohongshuContent(title, content, tags) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        // Create content container
        const container = document.createElement('div');
        container.style.cssText = `
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1d1d1f;
            text-align: center;
        `;
        header.innerText = window.i18n.t('modalXiaohongshuTitle');
        
        // Create title section
        const titleSection = document.createElement('div');
        titleSection.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const titleLabel = document.createElement('div');
        titleLabel.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            color: #666;
            font-size: 14px;
        `;
        titleLabel.innerText = window.i18n.t('modalTitleLabel');
        
        const titleText = document.createElement('div');
        titleText.style.cssText = `
            padding: 12px;
            background: #f5f5f7;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #1d1d1f;
            line-height: 1.5;
        `;
        titleText.innerText = title;
        
        titleSection.appendChild(titleLabel);
        titleSection.appendChild(titleText);
        
        // Create content section
        const contentSection = document.createElement('div');
        contentSection.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const contentLabel = document.createElement('div');
        contentLabel.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            color: #666;
            font-size: 14px;
        `;
        contentLabel.innerText = window.i18n.t('modalContentLabel');
        
        const contentText = document.createElement('div');
        contentText.style.cssText = `
            padding: 12px;
            background: #f5f5f7;
            border-radius: 8px;
            font-size: 14px;
            color: #1d1d1f;
            line-height: 1.8;
            white-space: pre-wrap;
        `;
        contentText.innerText = content;
        
        contentSection.appendChild(contentLabel);
        contentSection.appendChild(contentText);
        
        // Create tags section
        const tagsSection = document.createElement('div');
        tagsSection.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const tagsLabel = document.createElement('div');
        tagsLabel.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            color: #666;
            font-size: 14px;
        `;
        tagsLabel.innerText = window.i18n.t('modalTagsLabel');
        
        const tagsContainer = document.createElement('div');
        tagsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        `;
        
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.style.cssText = `
                padding: 6px 12px;
                background: #007aff;
                color: white;
                border-radius: 16px;
                font-size: 13px;
            `;
            tagElement.innerText = '#' + tag;
            tagsContainer.appendChild(tagElement);
        });
        
        tagsSection.appendChild(tagsLabel);
        tagsSection.appendChild(tagsContainer);
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
        `;
        
        const copyBtn = document.createElement('button');
        copyBtn.innerText = window.i18n.t('btnCopyAll');
        copyBtn.style.cssText = `
            flex: 1;
            padding: 12px;
            background-color: #34c759;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
        `;
        copyBtn.onclick = () => {
            const fullText = `${title}\n\n${content}\n\n${tags.map(t => '#' + t).join(' ')}`;
            navigator.clipboard.writeText(fullText).then(() => {
                copyBtn.innerText = window.i18n.t('btnCopied');
                setTimeout(() => {
                    copyBtn.innerText = window.i18n.t('btnCopyAll');
                }, 2000);
            }).catch(err => {
                alert(window.i18n.t('alertCopyFailed'));
            });
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.innerText = window.i18n.t('btnClose');
        closeBtn.style.cssText = `
            flex: 1;
            padding: 12px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
        `;
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        actions.appendChild(copyBtn);
        actions.appendChild(closeBtn);
        
        // Assemble modal
        container.appendChild(header);
        container.appendChild(titleSection);
        container.appendChild(contentSection);
        container.appendChild(tagsSection);
        container.appendChild(actions);
        modal.appendChild(container);
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        // Add to page
        document.body.appendChild(modal);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UIController();
});

// Export for global access
window.UIController = UIController;

// Global functions for onclick handlers (backward compatibility)
function toggleConfig() {
    if (app) app.toggleConfig();
}

function saveConfig() {
    if (app) app.saveConfig();
}

function generateWithAI() {
    if (app) app.generateWithAI();
}

function renderComic() {
    if (app) app.renderComic();
}

function downloadComicImage() {
    if (app) app.downloadCurrentPage();
}



function prevPage() {
    if (app) app.prevPage();
}

function nextPage() {
    if (app) app.nextPage();
}

function generateFinalImage() {
    if (app) app.generateFinalImage();
}

function generateAllPagesImages() {
    if (app) app.generateAllPagesImages();
}

function generateXiaohongshuContent() {
    if (app) app.generateXiaohongshuContent();
}

function changeLanguage(lang) {
    if (window.i18n) {
        window.i18n.setLanguage(lang);
    }
    
    // Sync comic language with interface language
    const comicLanguageSelect = document.getElementById('comic-language');
    if (comicLanguageSelect) {
        comicLanguageSelect.value = lang;
    }
}

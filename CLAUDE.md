# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comic Panel Generator is an AI-powered web application for creating multi-page comic storyboards with script generation, image generation, and social media content export. It uses Google Gemini for image generation and supports both OpenAI and Google Gemini for script generation.

## Development Commands

### Backend (Python with uv)

```bash
# Install dependencies
cd backend && uv sync

# Run backend server (starts on http://localhost:5003)
cd backend && uv run app.py
```

### Frontend

```bash
# Serve frontend (from project root)
python -m http.server 8000
# Then visit http://localhost:8000
```

### One-click Start

```bash
# macOS/Linux
./start.sh

# Windows
start.bat
```

## Architecture

### Backend Structure (Flask)

The backend follows a controller-service pattern:

- `backend/app.py` - Flask entry point, registers all blueprints
- `backend/controllers/` - API endpoint handlers (Flask blueprints)
  - `comic_controller.py` - `/api/generate`, `/api/validate` - comic script generation
  - `image_controller.py` - `/api/generate-image`, `/api/generate-cover` - image generation
  - `social_media_controller.py` - `/api/generate-xiaohongshu` - social content generation
  - `prompt_controller.py` - `/api/optimize-prompt` - prompt optimization
- `backend/services/` - Business logic
  - `comic_service.py` - Uses LangChain + OpenAI/Gemini for structured comic script generation
  - `image_service.py` - Image generation orchestration
  - `social_media_service.py` - Social media content generation
  - `prompt_optimizer_service.py` - Prompt enhancement
- `backend/comic_generator.py` - Core Gemini image generation with `gemini-3-pro-image-preview` model

### Frontend Structure (Vanilla JS)

Modular JavaScript with classes exposed on `window`:

- `app.js` - `UIController` - main controller coordinating all modules
- `api.js` - `ComicAPI` - static methods for all backend API calls
- `renderer.js` - `ComicRenderer` - renders JSON scripts into comic panel previews
- `pageManager.js` - `PageManager` - multi-page state management
- `sessionManager.js` - `SessionManager` - localStorage-based session persistence
- `config.js` - `ConfigManager` - API key and settings persistence
- `i18n.js` - Internationalization (Chinese/English)
- `theme.js` - Dark/light mode toggle
- `exporter.js` - html2canvas-based image export

### Data Flow

1. User enters prompt + settings in frontend
2. `UIController` calls `ComicAPI.generateComic()`
3. Backend `ComicService` generates structured JSON via LangChain (OpenAI) or Google Gemini
4. Frontend `ComicRenderer` renders JSON as sketch preview
5. User can generate final images via `ComicAPI.generateComicImage()` using sketch as reference
6. `comic_generator.py` uses Gemini image generation with reference images for consistency

### Comic Script Schema

```json
{
  "title": "Page Title",
  "rows": [
    {
      "height": "180px",
      "panels": [
        { "text": "Panel description with dialogue" }
      ]
    }
  ]
}
```

## Key Implementation Details

- Image generation uses `gemini-3-pro-image-preview` with reference images for character consistency
- Script generation uses Pydantic models (`ComicScript`, `ComicPage`, `Row`, `Panel`) for structured output
- Frontend stores sessions, configs, and generated images in localStorage
- Backend saves generated images to `backend/static/images/`
- Supports comic styles: doraemon, american, watercolor, disney, ghibli, pixar, shonen

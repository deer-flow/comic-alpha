"""Session controller - handles session title generation endpoints"""
from flask import Blueprint, request, jsonify
import json
from services.session_title_service import SessionTitleService

session_bp = Blueprint('session', __name__)


@session_bp.route('/api/generate-session-title', methods=['POST'])
def generate_session_title():
    """
    Generate a concise, descriptive title for a comic session

    Expected JSON body:
    {
        "api_key": "your-openai-api-key",  # optional
        "google_api_key": "your-google-api-key",  # optional, preferred
        "prompt": "user's comic prompt",  # required
        "comic_data": {...},  # optional, the generated comic data
        "base_url": "https://api.openai.com/v1",  # optional
        "model": "gpt-4o-mini",  # optional
        "language": "zh"  # optional
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        api_key = data.get('api_key')
        google_api_key = data.get('google_api_key')
        prompt = data.get('prompt')

        if not api_key and not google_api_key:
            return jsonify({"error": "Either OpenAI API key or Google API key is required"}), 400

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        if not prompt.strip():
            return jsonify({"error": "Prompt cannot be empty"}), 400

        # Optional parameters
        base_url = data.get('base_url', 'https://api.openai.com/v1')
        model = data.get('model', 'gpt-4o-mini')
        language = data.get('language', 'zh')
        comic_data = data.get('comic_data')

        # Generate title
        service = SessionTitleService(
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
            google_api_key=google_api_key
        )

        title = service.generate_title(prompt, comic_data)

        return jsonify({
            "success": True,
            "title": title,
            "original_prompt": prompt
        })

    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

"""Social media controller - handles social media content generation endpoints"""
from flask import Blueprint, request, jsonify
import json
from services.social_media_service import SocialMediaService

social_bp = Blueprint('social', __name__)


@social_bp.route('/api/generate-xiaohongshu', methods=['POST'])
def generate_xiaohongshu_content():
    """
    Generate social media post content (Xiaohongshu or Twitter)
    
    Expected JSON body:
    {
        "api_key": "your-openai-api-key",
        "comic_data": [...],  # array of comic pages
        "base_url": "https://api.openai.com/v1",  # optional
        "model": "gpt-4o-mini",  # optional
        "platform": "xiaohongshu"  # or "twitter"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        api_key = data.get('api_key')
        comic_data = data.get('comic_data')
        
        if not api_key:
            return jsonify({"error": "API key is required"}), 400
        
        if not comic_data:
            return jsonify({"error": "Comic data is required"}), 400
        
        # Optional parameters
        base_url = data.get('base_url', 'https://api.openai.com/v1')
        model = data.get('model', 'gpt-4o-mini')
        platform = data.get('platform', 'xiaohongshu')
        
        # Generate social content using service
        service = SocialMediaService(api_key, base_url, model)
        result = service.generate_social_content(comic_data, platform)
        
        return jsonify({
            "success": True,
            **result
        })
        
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parsing failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

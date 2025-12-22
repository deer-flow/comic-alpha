"""
Comic Generator Flask Application
Main entry point - registers all Blueprints
"""
import logging
from flask import Flask
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)


# Configure Flask with explicit static folder
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # Enable CORS for frontend requests

# Register blueprints
from controllers import comic_bp, image_bp, social_bp

app.register_blueprint(comic_bp)
app.register_blueprint(image_bp)
app.register_blueprint(social_bp)


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)

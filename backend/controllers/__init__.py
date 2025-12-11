# Controllers package
from .comic_controller import comic_bp
from .image_controller import image_bp
from .social_media_controller import social_bp

__all__ = ['comic_bp', 'image_bp', 'social_bp']

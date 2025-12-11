"""Image generation service"""
import os
import requests
from typing import List, Dict, Any, Optional, Union
from comic_generator import generate_social_media_image_core


class ImageService:
    """Image generation and proxy service"""
    
    @staticmethod
    def generate_comic_image(
        page_data: Dict[str, Any],
        comic_style: str = 'doraemon',
        reference_img: Optional[Union[str, List[str]]] = None,
        extra_body: Optional[List] = None,
        google_api_key: str = None
    ) -> tuple[Optional[str], str]:
        """
        Generate comic image from page data
        
        Args:
            page_data: Comic page data with rows and panels
            comic_style: Style of the comic
            reference_img: Optional reference image(s)
            extra_body: Optional extra body parameters (previous pages)
            google_api_key: Google API key for image generation
            
        Returns:
            Tuple of (image_url, prompt)
        """
        # Convert page data to prompt with style
        prompt = ImageService._convert_page_to_prompt(page_data, comic_style)
        
        # Prepare reference images (can be single image or array)
        reference_images = []
        
        # Add current page sketch as first reference
        if reference_img:
            if isinstance(reference_img, str):
                reference_images.append(reference_img)
            elif isinstance(reference_img, list):
                reference_images.extend(reference_img)
        
        # Add previous generated pages as additional references
        if extra_body and isinstance(extra_body, list):
            # extra_body contains previous page URLs
            for prev_page in extra_body:
                if isinstance(prev_page, dict) and 'imageUrl' in prev_page:
                    reference_images.append(prev_page['imageUrl'])
                elif isinstance(prev_page, str):
                    reference_images.append(prev_page)
        
        # Use reference_images if we have any, otherwise None
        final_reference = reference_images if reference_images else None
        
        # Generate image
        image_url = generate_social_media_image_core(
            prompt=prompt,
            reference_img=final_reference,
            google_api_key=google_api_key
        )
        
        return image_url, prompt
    
    @staticmethod
    def proxy_image_download(image_url: str) -> tuple[bytes, str]:
        """
        Proxy image download to bypass CORS restrictions
        
        Args:
            image_url: URL of the image to download
            
        Returns:
            Tuple of (image_content, content_type)
        """
        response = requests.get(image_url, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"Failed to fetch image: {response.status_code}")
        
        content_type = response.headers.get('Content-Type', 'image/png')
        return response.content, content_type
    
    @staticmethod
    def _convert_page_to_prompt(page_data: Dict[str, Any], comic_style: str = 'doraemon') -> str:
        """Convert page data to image generation prompt"""
        panels = []
        if 'rows' in page_data:
            for i, row in enumerate(page_data['rows'], 1):
                if 'panels' in row:
                    for j, panel in enumerate(row['panels'], 1):
                        if 'text' in panel:
                            panels.append(f"Panel {i}-{j}: {panel['text']}")

        prompt_template = """Using the style of {comic_style}, convert the storyline in each panel of the reference image into corresponding comic content.

# Requirements:
- The content of each panel should avoid being overly complex.
- Maintain consistency in characters and scenes.
- Preserve the layout and proportions of the comic.
- The comic title should use a {comic_style} font.
- The image should be colorful and vibrant.
- Do not show panel index in the content.
- Include speech bubbles with short, clear dialogue to help tell the story.
- Keep dialogue concise to avoid cluttering the image.
- Ensure text is legible and spelled correctly.

# Content:

## Title
{title}

## Panels
{panels}
"""
        
        final_prompt = prompt_template.format(
            comic_style=comic_style, 
            title=page_data.get('title', ''),
            panels="\n".join(panels)
        )
        print(final_prompt)
        return final_prompt

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
        google_api_key: str = None,
        rows_per_page: Optional[int] = None,
        language: str = 'en'
    ) -> tuple[Optional[str], str]:
        """
        Generate comic image from page data

        Args:
            page_data: Comic page data with rows and panels
            comic_style: Style of the comic
            reference_img: Optional reference image(s)
            extra_body: Optional extra body parameters (previous pages)
            google_api_key: Google API key for image generation
            rows_per_page: Optional number of rows to strictly limit (3-5)
            language: Language of the comic content

        Returns:
            Tuple of (image_url, prompt)
        """
        # Truncate page data to rows_per_page if specified
        if rows_per_page is not None and 'rows' in page_data:
            page_data = page_data.copy()  # Don't modify original
            page_data['rows'] = page_data['rows'][:rows_per_page]

        # Convert page data to prompt with style and language
        prompt = ImageService._convert_page_to_prompt(page_data, comic_style, language)
        
        # Prepare reference images (can be single image or array)
        reference_images = []
        
        # Add previous generated pages as additional references
        if extra_body and isinstance(extra_body, list):
            # extra_body contains previous page URLs
            for prev_page in extra_body:
                if isinstance(prev_page, dict) and 'imageUrl' in prev_page:
                    reference_images.append(prev_page['imageUrl'])
                elif isinstance(prev_page, str):
                    reference_images.append(prev_page)
        
        # # Add current page sketch as last reference
        # if reference_img:
        #     if isinstance(reference_img, str):
        #         reference_images.append(reference_img)
        #     elif isinstance(reference_img, list):
        #         reference_images.extend(reference_img)
        
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
    def generate_comic_cover(
        comic_style: str = 'doraemon',
        google_api_key: str = None,
        reference_imgs: List[Union[str, Dict]] = None,
        language: str = 'en',
        custom_requirements: str = ''
    ) -> tuple[Optional[str], str]:
        """
        Generate comic cover image

        Args:
            comic_style: Style of the comic
            google_api_key: Google API key
            reference_imgs: List of reference image URLs
            language: Language of the comic
            custom_requirements: User's custom cover requirements (optional)

        Returns:
            Tuple of (image_url, prompt)
        """
        # Create cover prompt
        prompt = ImageService._create_cover_prompt(comic_style, language, custom_requirements)
        
        # Prepare reference images list (extract URLs from objects if needed)
        processed_refs = []
        if reference_imgs:
            for img in reference_imgs:
                if isinstance(img, dict) and 'imageUrl' in img:
                    processed_refs.append(img['imageUrl'])
                elif isinstance(img, str):
                    processed_refs.append(img)

        image_url = generate_social_media_image_core(
            prompt=prompt,
            reference_img=processed_refs,
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
        response = requests.get(image_url, timeout=60)
        
        if response.status_code != 200:
            raise Exception(f"Failed to fetch image: {response.status_code}")
        
        content_type = response.headers.get('Content-Type', 'image/png')
        return response.content, content_type
    
    @staticmethod
    def _convert_page_to_prompt(page_data: Dict[str, Any], comic_style: str = 'doraemon', language: str = 'en') -> str:
        """Convert page data to image generation prompt"""
        import json
        
        panels = []
        if 'rows' in page_data:
            for i, row in enumerate(page_data['rows'], 1):
                if 'panels' in row:
                    for j, panel in enumerate(row['panels'], 1):
                        if 'text' in panel:
                            panels.append(f"Panel {i}-{j}: {panel['text']}")

        language_map = {
            'zh': 'Chinese (简体中文)',
            'en': 'English',
            'ja': 'Japanese (日本語)',
            'ko': 'Korean (한국어)',
            'fr': 'French (Français)',
            'de': 'German (Deutsch)',
            'es': 'Spanish (Español)'
        }
        target_lang = language_map.get(language, 'English')

        # Main prompt content
        prompt_content = """Using the style of {comic_style}, convert the storyline in each panel of the reference image into corresponding comic content. All text in the comic, including titles and speech bubbles, MUST be in {target_lang}.

# Content:

## Title
{title}

## Panels
{panels}"""

        # Requirements section (positive guidance only)
        requirements_content = """- Maintain consistency in characters and scenes.
- The image should be colorful and vibrant.
- Include speech bubbles with short, clear dialogue to help tell the story.
- Ensure text is legible and spelled correctly.
- All dialogue and titles MUST be in {target_lang}.
- Display the title only once, typically at the top center of the comic page.
- Maintain consistent and uniform margins around the entire comic page.
- Ensure equal spacing on all sides (top, bottom, left, right) for a professional appearance.
- The comic title should use a {comic_style}-style font that matches the overall comic aesthetic.
- Use fonts that properly support {target_lang} characters.
- Ensure all text is correctly encoded and displayed clearly.
- Text should be clear, sharp, and properly rendered in both speech bubbles and titles.
- Character Consistency: Use the first provided images (previous pages) as the definitive source for character appearances. These may also include user-provided reference images for maintaining character, prop, or item consistency. Carry over the exact facial features, hair styles, and identical clothing/outfits."""

        # Negative prompt (all negative constraints)
        negative_prompt = "overly complex panels, complex panel content, inconsistent characters, distorted proportions, dull colors, panel indices visible, panel numbers shown, cluttered dialogue, verbose dialogue, illegible text, misspelled words, duplicated titles, multiple title locations, uneven margins, mismatched fonts, text corruption, mojibake, garbled characters, blurry text, character appearance changes, incorrect clothing, clothing changes without script requirement, layout deviation from sketch, costume changes"
        
        # Format the content
        formatted_prompt = prompt_content.format(
            comic_style=comic_style, 
            title=page_data.get('title', ''),
            panels="\n".join(panels),
            target_lang=target_lang
        )
        
        formatted_requirements = requirements_content.format(
            comic_style=comic_style,
            target_lang=target_lang
        )
        
        # Create structured JSON
        img_prompt = {
            "image_generation_data": {
                "prompt": formatted_prompt.strip(),
                "requirements": formatted_requirements.strip(),
                "negative_prompt": negative_prompt
            }
        }
        
        return json.dumps(img_prompt, ensure_ascii=False)

    @staticmethod
    def _create_cover_prompt(comic_style: str, language: str = 'en', custom_requirements: str = '') -> str:
        """Create prompt for comic cover"""
        language_map = {
            'zh': 'Chinese (简体中文)',
            'en': 'English',
            'ja': 'Japanese (日本語)',
            'ko': 'Korean (한국어)',
            'fr': 'French (Français)',
            'de': 'German (Deutsch)',
            'es': 'Spanish (Español)'
        }

        target_lang = language_map.get(language, 'English')

        prompt_template = """Create a high-quality comic book cover in the style of {comic_style}.

# Important Context:
- The reference images provided show the story pages of this comic.
- You MUST base the cover on the characters, scenes, and storyline shown in these reference images.
- The cover should capture the essence and key moments from the story pages.
- Use the same characters, props, and items with consistent appearances as shown in the reference images.

# Requirements:
- The image must be a vertical comic book cover composition.
- The art style must strictly follow {comic_style}.
- Make it eye-catching and dramatic while staying true to the story.
- Feature the main characters and key scenes from the reference story pages.
- High resolution, detailed, and professional quality.
- No other text except the title.
- The title text must be in {target_lang}.
- Clear and sharp text for the title, do not repeat all the titles in reference images.
- Vibrant colors and "Cover Art" aesthetic.
- Only present one row one panel in the cover.
- Ensure all characters in the title are correctly rendered and legible.
- The cover should feel like a natural introduction to the story shown in the reference pages.
{custom_section}"""

        # Add custom requirements if provided
        custom_section = ""
        if custom_requirements and custom_requirements.strip():
            custom_section = f"""

# IMPORTANT - User's Custom Requirements (MUST FOLLOW STRICTLY):
The user has provided specific requirements below. These are CRITICAL and take HIGHEST PRIORITY.
You MUST strictly follow these custom requirements while maintaining the basic comic cover style.

User Requirements:
{custom_requirements.strip()}

** You MUST implement ALL of the above user requirements. They are mandatory. **"""

        final_prompt = prompt_template.format(
            comic_style=comic_style,
            target_lang=target_lang,
            custom_section=custom_section
        )
        return final_prompt.strip()

from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json
from typing import List, Dict, Any
# Import locally because the app is launched from the backend directory
from comic_generator import generate_social_media_image_core

# Configure Flask with explicit static folder
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # Enable CORS for frontend requests

class ComicGenerator:
    """Comic script generator using OpenAI API"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1", model: str = "gpt-4o-mini", comic_style: str = "doraemon", language: str = "zh"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.comic_style = comic_style
        self.language = language
        openai.api_key = api_key
        openai.api_base = base_url
    
    def generate_comic_script(self, prompt: str, page_count: int = 3) -> List[Dict[str, Any]]:
        """
        Generate comic script based on user prompt
        
        Args:
            prompt: User's description of the comic
            page_count: Number of pages to generate
            
        Returns:
            List of comic page data
        """
        # Define style descriptions
        style_descriptions = {
            "doraemon": "哆啦A梦风格：圆润可爱的角色设计，简洁明快的线条，温馨幽默的氛围",
            "american": "美式漫画风格：夸张的肌肉线条，英雄主义，强烈的明暗对比",
            "watercolor": "水彩风格：柔和的色彩过渡，艺术感的笔触，梦幻氛围",
            "disney": "迪士尼动画风格：经典的迪士尼角色设计，流畅的动作表现，丰富的表情，温暖明亮的色彩，充满魔法和梦幻的氛围",
            "ghibli": "宫崎骏/吉卜力风格：细腻的自然场景描绘，柔和温暖的色调，充满想象力的奇幻元素，人物表情细腻生动，富有诗意和治愈感",
            "pixar": "皮克斯动画风格：3D渲染质感，圆润可爱的角色设计，丰富的光影效果，细腻的材质表现，情感表达真挚动人",
            "shonen": "日本少年漫画风格：充满动感的线条和速度线，夸张的表情和动作，热血激昂的氛围，强烈的视觉冲击力，快节奏的分镜"
        }
        
        # Define language instructions
        language_instructions = {
            "zh": "请用中文生成所有内容（包括标题和分镜描述）。",
            "en": "Please generate all content in English (including titles and panel descriptions).",
            "ja": "すべてのコンテンツ（タイトルとパネルの説明を含む）を日本語で生成してください。"
        }
        
        style_desc = style_descriptions.get(self.comic_style, style_descriptions["doraemon"])
        language_instruction = language_instructions.get(self.language, language_instructions["zh"])
        
        system_prompt = f"""你是一个专业的漫画分镜脚本编写助手。请根据用户的描述，生成{page_count}页漫画的分镜脚本。

**重要：请使用{style_desc}来设计分镜内容。**

**语言要求：{language_instruction}**

返回格式为JSON数组，每个元素代表一页：

[
  {{
    "title": "第1页标题",
    "rows": [
      {{
        "height": "180px",
        "panels": [
          {{ "text": "分镜描述文字" }}
        ]
      }}
    ]
  }},
  {{
    "title": "第2页标题",
    "rows": [...]
  }}
]

要求：
1. 生成{page_count}页完整的故事
2. 每页有独立的title
3. 每页漫画3-5行，合理安排剧情节奏
4. 每行可以有1-2个面板（尽量不要每行都是1个面板）
5. 分镜描述要简洁生动，推动故事发展，并体现所选风格的特点
6. 只返回JSON数组，不要有其他解释文字
7. 所有文本内容必须使用指定的语言"""

        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000
            )
            
            generated_text = response.choices[0].message.content.strip()
            
            # Extract JSON from markdown code blocks if present
            json_text = self._extract_json(generated_text)
            
            # Parse and validate JSON
            comic_data = json.loads(json_text)
            
            # Ensure it's an array
            if not isinstance(comic_data, list):
                comic_data = [comic_data]
            
            return comic_data
            
        except Exception as e:
            raise Exception(f"AI generation failed: {str(e)}")
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text, removing markdown code blocks"""
        if '```json' in text:
            return text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            return text.split('```')[1].split('```')[0].strip()
        return text


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Comic generator API is running"})


@app.route('/api/generate', methods=['POST'])
def generate_comic():
    """
    Generate comic script endpoint
    
    Expected JSON body:
    {
        "api_key": "your-openai-api-key",
        "prompt": "description of the comic",
        "page_count": 3,
        "base_url": "https://api.openai.com/v1",  # optional
        "model": "gpt-4o-mini"  # optional
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        api_key = data.get('api_key')
        prompt = data.get('prompt')
        
        if not api_key:
            return jsonify({"error": "API key is required"}), 400
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Optional parameters
        page_count = data.get('page_count', 3)
        base_url = data.get('base_url', 'https://api.openai.com/v1')
        model = data.get('model', 'gpt-4o-mini')
        comic_style = data.get('comic_style', 'doraemon')
        language = data.get('language', 'zh')
        
        # Validate page count
        if not isinstance(page_count, int) or page_count < 1 or page_count > 10:
            return jsonify({"error": "Page count must be between 1 and 10"}), 400
        
        # Generate comic script
        generator = ComicGenerator(api_key, base_url, model, comic_style, language)
        comic_pages = generator.generate_comic_script(prompt, page_count)
        
        return jsonify({
            "success": True,
            "pages": comic_pages,
            "page_count": len(comic_pages)
        })
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/validate', methods=['POST'])
def validate_script():
    """
    Validate comic script format
    
    Expected JSON body:
    {
        "script": {...}  # comic script object or array
    }
    """
    try:
        data = request.get_json()
        script = data.get('script')
        
        if not script:
            return jsonify({"valid": False, "error": "No script provided"})
        
        # Validate structure
        if isinstance(script, list):
            for page in script:
                if not _validate_page(page):
                    return jsonify({"valid": False, "error": "Invalid page structure"})
        else:
            if not _validate_page(script):
                return jsonify({"valid": False, "error": "Invalid page structure"})
        
        return jsonify({"valid": True})
        
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)})


def _validate_page(page: Dict) -> bool:
    """Validate a single page structure"""
    if not isinstance(page, dict):
        return False
    
    if 'rows' not in page or not isinstance(page['rows'], list):
        return False
    
    for row in page['rows']:
        if not isinstance(row, dict):
            return False
        if 'panels' not in row or not isinstance(row['panels'], list):
            return False
        for panel in row['panels']:
            if not isinstance(panel, dict):
                return False
    
    return True


@app.route('/api/generate-image', methods=['POST'])
def generate_comic_image():
    """
    Generate final comic image from page data
    
    Expected JSON body:
    {
        "page_data": {...},  # comic page data
        "reference_img": "url" or ["url1", "url2"],  # optional reference image(s)
        "comic_style": "doraemon",  # optional comic style
        "google_api_key": "your-google-api-key"  # required Google API key
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        page_data = data.get('page_data')
        if not page_data:
            return jsonify({"error": "Page data is required"}), 400
        
        google_api_key = data.get('google_api_key')
        if not google_api_key:
            return jsonify({"error": "Google API key is required"}), 400
        
        # Optional parameters
        comic_style = data.get('comic_style', 'doraemon')
        
        # Convert page data to prompt with style
        prompt = _convert_page_to_prompt(page_data, comic_style)
        
        # Optional parameters
        reference_img = data.get('reference_img')
        extra_body_param = data.get('extra_body')
        
        # Prepare reference images (can be single image or array)
        reference_images = []
        
        # Add current page sketch as first reference
        if reference_img:
            if isinstance(reference_img, str):
                reference_images.append(reference_img)
            elif isinstance(reference_img, list):
                reference_images.extend(reference_img)
        
        # Add previous generated pages as additional references
        if extra_body_param and isinstance(extra_body_param, list):
            # extra_body contains previous page URLs
            for prev_page in extra_body_param:
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
        
        if not image_url:
            return jsonify({"error": "Image generation failed"}), 500
        
        return jsonify({
            "success": True,
            "image_url": image_url,
            "prompt": prompt
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    """
    Proxy image download to bypass CORS restrictions
    
    Query parameters:
        url: The image URL to download
    """
    try:
        import requests
        
        image_url = request.args.get('url')
        if not image_url:
            return jsonify({"error": "Image URL is required"}), 400
        
        # Fetch the image
        response = requests.get(image_url, timeout=30)
        
        if response.status_code != 200:
            return jsonify({"error": f"Failed to fetch image: {response.status_code}"}), response.status_code
        
        # Return the image with appropriate headers
        from flask import Response
        return Response(
            response.content,
            mimetype=response.headers.get('Content-Type', 'image/png'),
            headers={
                'Content-Disposition': f'attachment; filename=comic-{os.urandom(4).hex()}.png',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-xiaohongshu', methods=['POST'])
def generate_xiaohongshu_content():
    """
    Generate Xiaohongshu (Little Red Book) post content
    
    Expected JSON body:
    {
        "api_key": "your-openai-api-key",
        "comic_data": [...],  # array of comic pages
        "base_url": "https://api.openai.com/v1",  # optional
        "model": "gpt-4o-mini"  # optional
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
        
        # Set OpenAI configuration
        openai.api_key = api_key
        openai.api_base = base_url
        
        # Extract comic content summary
        comic_summary = _extract_comic_summary(comic_data)
        
        # Generate Xiaohongshu content
        system_prompt = """你是一个爆款小红书内容创作专家。请根据漫画内容创作一篇引爆流量的小红书帖子。

核心要求：
1. 标题：15-25字，必须制造悬念、反转或强烈情绪冲击，善用emoji和符号
   - 可用技巧：提问式、对比式、夸张式、共鸣式
   - 例如："没想到...竟然..."、"震惊！原来..."、"太真实了！"

2. 正文：200-500字，讲故事而非复述剧情
   - 开头：用一句话抓住注意力（金句/疑问/共鸣点）
   - 中间：提炼漫画的核心冲突、反转或情感高潮，用戏剧化的语言描述
   - 结尾：引发思考或互动（提问/征集/共鸣）
   - 多用短句、emoji、换行，营造节奏感
   - 避免：流水账式复述、平铺直叙

3. 风格：年轻化、情绪化、有态度
   - 可以夸张、可以吐槽、可以煽情
   - 要有个人观点和情感表达
   - 让读者产生"太懂我了"的感觉

4. 标签：5-8个，混合热门话题和精准标签

返回JSON格式：
{
  "title": "标题内容",
  "content": "正文内容",
  "tags": ["标签1", "标签2", ...]
}"""

        user_prompt = f"""请为以下漫画内容生成小红书帖子：

{comic_summary}

请生成吸引人的标题、正文和标签。"""

        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=1000
        )
        
        generated_text = response.choices[0].message.content.strip()
        
        # Extract JSON from markdown code blocks if present
        if '```json' in generated_text:
            json_text = generated_text.split('```json')[1].split('```')[0].strip()
        elif '```' in generated_text:
            json_text = generated_text.split('```')[1].split('```')[0].strip()
        else:
            json_text = generated_text
        
        # Parse JSON
        xiaohongshu_content = json.loads(json_text)
        
        return jsonify({
            "success": True,
            "title": xiaohongshu_content.get("title", ""),
            "content": xiaohongshu_content.get("content", ""),
            "tags": xiaohongshu_content.get("tags", [])
        })
        
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parsing failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _extract_comic_summary(comic_data):
    """Extract summary from comic data"""
    summary_parts = []
    
    if isinstance(comic_data, list):
        for i, page in enumerate(comic_data, 1):
            if 'title' in page:
                summary_parts.append(f"第{i}页：{page['title']}")
            
            if 'rows' in page:
                for row in page['rows']:
                    if 'panels' in row:
                        for panel in row['panels']:
                            if 'text' in panel:
                                summary_parts.append(f"  - {panel['text']}")
    else:
        if 'title' in comic_data:
            summary_parts.append(f"标题：{comic_data['title']}")
        
        if 'rows' in comic_data:
            for row in comic_data['rows']:
                if 'panels' in row:
                    for panel in row['panels']:
                        if 'text' in panel:
                            summary_parts.append(f"  - {panel['text']}")
    
    return "\n".join(summary_parts)


def _convert_page_to_prompt(page_data, comic_style: str = 'doraemon') -> str:
    """Convert page data to image generation prompt"""
    # Define style descriptions for image generation
    style_descriptions = {
        "doraemon": "哆啦A梦漫画",
        "american": "美式漫画风格",
        "watercolor": "水彩风格",
        "disney": "迪士尼动画风格",
        "ghibli": "宫崎骏/吉卜力工作室风格",
        "pixar": "皮克斯动画风格",
        "shonen": "日本少年漫画风格"
    }

    style_desc = style_descriptions.get(comic_style, style_descriptions['doraemon'])
    
    prompt_parts = []
    
    # Add style instruction at the beginning
    prompt_parts.append(f"用{style_desc}的风格，将参考图中每一个格子中的剧情转换为对应的漫画内容。\n要求：- 不要保留太多的文字内容，以漫画的形式表现出来。\n- 每个格子中的内容应该尽可能地简洁，不要过于复杂。\n- 保持角色和场景的一致性。\n- 保持漫画的布局和比例。")
    
    # Add title if exists
    if 'title' in page_data:
        prompt_parts.append(f"Comic page titled '{page_data['title']}'")
    
    # Add panel descriptions
    if 'rows' in page_data:
        prompt_parts.append("The comic page contains the following panels:")
        for i, row in enumerate(page_data['rows'], 1):
            if 'panels' in row:
                for j, panel in enumerate(row['panels'], 1):
                    if 'text' in panel:
                        prompt_parts.append(f"Panel {i}-{j}: {panel['text']}")
    
    prompt_parts.append("Please generate a comic page image based on the above description.")
    prompt_parts.append("The image should be colorful and vibrant.")
    prompt_parts.append(f"The comic title should use a {style_desc} font.")
    
    # Create final prompt
    final_prompt = "\n".join(prompt_parts)
    
    return final_prompt


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)

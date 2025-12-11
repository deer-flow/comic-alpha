"""Comic script generation service"""
import openai
import json
from typing import List, Dict, Any


class ComicService:
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


def validate_script(script) -> tuple[bool, str]:
    """
    Validate comic script format
    
    Args:
        script: Comic script object or array
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not script:
        return False, "No script provided"
    
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
    
    # Validate structure
    if isinstance(script, list):
        for page in script:
            if not _validate_page(page):
                return False, "Invalid page structure"
    else:
        if not _validate_page(script):
            return False, "Invalid page structure"
    
    return True, ""

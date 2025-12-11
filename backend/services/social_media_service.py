"""Social media content generation service"""
import openai
import json
from typing import List, Dict, Any


class SocialMediaService:
    """Social media content generator for Xiaohongshu and Twitter"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1", model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        openai.api_key = api_key
        openai.api_base = base_url
    
    def generate_social_content(self, comic_data: List[Dict], platform: str = 'xiaohongshu') -> Dict[str, Any]:
        """
        Generate social media content from comic data
        
        Args:
            comic_data: Array of comic pages
            platform: 'xiaohongshu' or 'twitter'
            
        Returns:
            Dict with title, content, and tags
        """
        # Extract comic content summary
        comic_summary = self._extract_comic_summary(comic_data)
        
        # Select prompts based on platform
        if platform == 'twitter':
            system_prompt = """You are a viral Twitter/X content creator. Create an engaging, relatable post.

⚠️ KEY PRINCIPLES:
- Focus on the EMOTION and THEME, not panel-by-panel plot
- Make it relatable and shareable
- Add your own spin/commentary

Format:
1. Title (Main Tweet): 80-150 characters
   - A catchy hook that captures the vibe
   - Examples: "POV: when life gives you exactly what you didn't ask for 😅", "the duality of wanting peace but choosing chaos every time"

2. Content: 3-5 sentences (250-400 characters)
   - Opening: A punchy line that grabs attention
   - Middle: Your reaction, commentary, or relatable take on the theme
   - End: A question or call-to-action to drive engagement
   - Use 2-3 emojis strategically
   - Use line breaks for rhythm

3. Tags: 4-5 relevant hashtags

Return JSON:
{
  "title": "catchy main tweet",
  "content": "engaging thread content",
  "tags": ["tag1", "tag2"]
}"""

            user_prompt = f"""Comic theme: {comic_summary}

Create a viral tweet that captures the FEELING and makes people say "this is so me". Add your own commentary!"""

        else:  # xiaohongshu (default)
            system_prompt = """你是小红书爆款文案专家。创作有共鸣、有态度的帖子。

⚠️ 核心原则：
- 不要逐格复述剧情
- 重点提炼情绪共鸣点和个人感悟
- 加入你的态度和观点

格式要求：
1. 标题：12-20字
   - 制造悬念或情绪冲击
   - 例："成年人的崩溃就在一瞬间💔"、"看完这个漫画我沉默了..."

2. 正文：100-150字
   - 开头：1-2句情绪金句/共鸣点
   - 中间：3-4句个人感悟、吐槽或延伸思考
   - 可以联系生活经历、社会现象
   - 结尾：1-2句引发互动（提问/征集/共鸣）
   - 多用emoji、短句、换行营造节奏感
   - 语气要有态度：可以感慨、吐槽、煽情

3. 标签：10个，混合热门+精准

返回JSON：
{
  "title": "标题",
  "content": "正文",
  "tags": ["标签1", "标签2"]
}"""

            user_prompt = f"""漫画主题：{comic_summary}

写出让人"太懂了！"的文案，要有你的态度和感悟！"""

        response = openai.ChatCompletion.create(
            model=self.model,
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
        social_content = json.loads(json_text)
        
        return {
            "title": social_content.get("title", ""),
            "content": social_content.get("content", ""),
            "tags": social_content.get("tags", []),
            "platform": platform
        }
    
    def _extract_comic_summary(self, comic_data) -> str:
        """Extract a thematic summary from comic data (focused, not verbose)"""
        titles = []
        key_moments = []
        
        pages = comic_data if isinstance(comic_data, list) else [comic_data]
        
        for page in pages:
            # Collect page titles as they represent main themes
            if 'title' in page:
                titles.append(page['title'])
            
            # Extract key panels: first, middle, and last per page
            if 'rows' in page:
                all_panels = []
                for row in page['rows']:
                    if 'panels' in row:
                        for panel in row['panels']:
                            if 'text' in panel and panel['text'].strip():
                                all_panels.append(panel['text'].strip())
                
                # Get first, middle, and last panel (setup, development, payoff)
                if all_panels:
                    key_moments.append(all_panels[0])  # Setup
                    if len(all_panels) > 2:
                        mid_idx = len(all_panels) // 2
                        key_moments.append(all_panels[mid_idx])  # Development
                    if len(all_panels) > 1:
                        key_moments.append(all_panels[-1])  # Payoff
        
        # Build focused summary
        summary = ""
        if titles:
            summary += f"故事线：{'→'.join(titles)}\n"
        if key_moments:
            # Limit to 6 key moments for good context
            unique_moments = list(dict.fromkeys(key_moments))[:6]  # Remove duplicates, keep order
            summary += f"关键场景：{'；'.join(unique_moments)}"
        
        return summary if summary else "一个有趣的漫画故事"

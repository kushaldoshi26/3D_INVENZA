import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

class AIEngine:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def refine_prompt(self, user_prompt: str, style: str = "realistic") -> str:
        """Use AI to expand a simple prompt into a detailed 3D modeling description"""
        if not self.client:
            return user_prompt # Fallback

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o", # or gpt-3.5-turbo
                messages=[
                    {"role": "system", "content": "You are a professional 3D printing engineer. Convert user prompts into detailed 3D model descriptions optimized for printing."},
                    {"role": "user", "content": f"Convert this into a 3D modeling prompt: {user_prompt} in {style} style."}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

    def analyze_image_for_3d(self, image_url: str):
        """Use Vision AI to analyze an image for 3D reconstruction feasibility"""
        if not self.client:
            return {"status": "mock", "message": "Vision AI requires API key"}

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Analyze this image for 3D printing reconstruction. What are the key features and dimensions?"},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ],
                    }
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

ai_engine = AIEngine()

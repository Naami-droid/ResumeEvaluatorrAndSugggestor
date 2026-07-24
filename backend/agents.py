import os
import json
from pydantic import BaseModel, Field
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# We use the standard OpenAI client but point to xAI's endpoint
XAI_API_KEY = os.getenv("XAI_API_KEY", "")
client = OpenAI(
    api_key=XAI_API_KEY,
    base_url="https://api.x.ai/v1",
)
# For xAI, grok-beta is typically the model name. If you use OpenAI instead, change this to gpt-4o-mini
MODEL_NAME = "grok-beta"

class EvaluationResult(BaseModel):
    score: int = Field(description="Score out of 100 based on the match between resume and job description.")
    missing_keywords: List[str] = Field(description="List of keywords present in JD but missing in the resume.")
    matched_keywords: List[str] = Field(description="List of important keywords present in both.")
    rewrite_suggestions: List[str] = Field(description="Actionable suggestions to improve the resume bullet points.")

def call_llm(system_prompt: str, user_prompt: str, retries: int = 3) -> EvaluationResult:
    """Helper to call LLM and enforce JSON structure with retries."""
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            # Parse JSON and validate with Pydantic
            data = json.loads(content)
            return EvaluationResult(**data)
            
        except Exception as e:
            if attempt == retries - 1:
                raise Exception(f"Failed to generate valid evaluation after {retries} attempts. Error: {e}")
            print(f"Attempt {attempt + 1} failed. Retrying... Error: {e}")


def evaluate_resume(resume_text: str, job_description: str) -> dict:
    """
    Multiagent workflow:
    1. The Evaluator Agent extracts keywords and scores the resume.
    2. The Feedback Agent generates rewrite suggestions.
    Since LLMs can do both efficiently in one go, we combine the instructions into a structured prompt 
    but conceptually represent them as multiple specialized tasks.
    """
    
    system_prompt = (
        "You are an expert AI Technical Recruiter and Resume Coach. "
        "Your task is to evaluate a candidate's resume against a provided job description. "
        "You MUST output your response strictly as a JSON object matching the following schema:\n"
        "{\n"
        "  \"score\": integer (0-100),\n"
        "  \"missing_keywords\": [\"keyword1\", \"keyword2\"],\n"
        "  \"matched_keywords\": [\"keyword1\", \"keyword2\"],\n"
        "  \"rewrite_suggestions\": [\"suggestion1\", \"suggestion2\"]\n"
        "}\n\n"
        "Instructions:\n"
        "1. Identify core skills and requirements in the Job Description.\n"
        "2. Find matching keywords in the Resume.\n"
        "3. List critical missing keywords.\n"
        "4. Calculate a realistic score (0-100) based on the match.\n"
        "5. Provide actionable rewrite suggestions to improve specific bullet points in the resume."
    )
    
    user_prompt = f"--- JOB DESCRIPTION ---\n{job_description}\n\n--- RESUME ---\n{resume_text}"
    
    # Run the evaluation with validation
    result = call_llm(system_prompt, user_prompt)
    
    return result.model_dump()

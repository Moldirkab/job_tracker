import json
import os

import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException
from google import genai

from app.models import ImportPreview

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

EXTRACTION_PROMPT = """You are extracting structured data from a job posting's page text.
Read the text below and return ONLY a JSON object (no markdown, no code fences, no extra text) in exactly this shape:

{{
  "company": "string",
  "position": "string",
  "location": "string",
  "salary": "string or null if not mentioned",
  "skills": ["array", "of", "short", "skill", "names"]
}}

If you cannot confidently find a field, use an empty string for company/position/location, null for salary, or an empty array for skills.

Job posting text:
{page_text}
"""


def fetch_page_text(url: str) -> str:
    try:
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; JobTrackerBot/1.0)"},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException:
        raise HTTPException(
            status_code=422,
            detail="Couldn't fetch that URL. Check it's correct and publicly accessible.",
        )

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)

    return text[:15000]


def extract_job_info(url: str) -> ImportPreview:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="AI import isn't configured on the server (missing GEMINI_API_KEY).",
        )

    page_text = fetch_page_text(url)

    if not page_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Couldn't find any readable content on that page.",
        )

    client = genai.Client(api_key=GEMINI_API_KEY)

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=EXTRACTION_PROMPT.format(page_text=page_text),
        )
    except Exception as e :
        print(f"GEMINI ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=502,
            detail="The AI extraction service failed. Please try again.",
        
        )

    raw_text = (response.text or "").strip()

    # Models sometimes wrap JSON in ```json fences despite instructions — strip them defensively.
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="The AI response wasn't valid JSON. Please try again.",
        )

    return ImportPreview(
        company=data.get("company") or "",
        position=data.get("position") or "",
        location=data.get("location") or "",
        salary=data.get("salary") or None,
        skills=data.get("skills") or [],
    )
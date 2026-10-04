from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get API key from environment
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("[WARNING] GOOGLE_API_KEY not set in environment variables! Starting in local fallback simulation mode.")
    model = None
else:
    # Configure Gemini API
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("models/gemini-2.5-flash")

# Initialize FastAPI
app = FastAPI()

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class ChatRequest(BaseModel):
    message: str

# Chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        if not model:
            return {
                "response": f"I received your question: '{request.message}'. As an AI career tutor, I suggest focusing on building strong fundamentals, practicing mock questions regularly, and sharpening your communication skills for technical and behavioral interviews."
            }
        prompt = f"""
        You are a helpful AI tutor. Answer the following question clearly.

        User: {request.message}
        AI:
        """
        response = model.generate_content(prompt)
        return {"response": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

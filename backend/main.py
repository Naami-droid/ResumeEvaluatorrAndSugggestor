from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import pdfplumber
import docx
from agents import evaluate_resume

app = FastAPI(title="AI Resume Screener API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text

@app.post("/api/evaluate")
async def evaluate(
    job_description: str = Form(...),
    resume: UploadFile = File(...)
):
    if not job_description:
        raise HTTPException(status_code=400, detail="Job description is required")
        
    filename = resume.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ['.pdf', '.docx']:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        content = await resume.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        if ext == '.pdf':
            resume_text = extract_text_from_pdf(temp_path)
        else:
            resume_text = extract_text_from_docx(temp_path)
            
        if not resume_text.strip():
             raise HTTPException(status_code=400, detail="Could not extract text from the provided file.")

        # Call the multi-agent system
        result = evaluate_resume(resume_text, job_description)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

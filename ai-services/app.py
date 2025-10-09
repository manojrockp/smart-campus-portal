from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import os

app = FastAPI(title="Smart Campus AI Services")

# Simple storage for submitted texts
submitted_texts = {}

class PlagiarismRequest(BaseModel):
    text: str
    assignmentId: str

class PerformanceRequest(BaseModel):
    studentId: str
    attendanceRate: float
    assignmentScore: float
    historicalData: dict

class PlagiarismResponse(BaseModel):
    score: float
    similarity_matches: List[dict]

class PerformanceResponse(BaseModel):
    predictedGrade: str
    riskLevel: str
    confidence: float
    recommendations: List[str]

# Store submitted texts for plagiarism comparison
submitted_texts = {}

@app.post("/check-plagiarism", response_model=PlagiarismResponse)
async def check_plagiarism(request: PlagiarismRequest):
    try:
        text = request.text
        assignment_id = request.assignmentId
        
        # Simple text comparison
        similarities = []
        if assignment_id in submitted_texts:
            for stored_text in submitted_texts[assignment_id]:
                text_words = set(text.lower().split())
                stored_words = set(stored_text.lower().split())
                common_words = text_words.intersection(stored_words)
                similarity = len(common_words) / max(len(text_words), len(stored_words), 1)
                
                if similarity > 0.5:
                    similarities.append({
                        "similarity": float(similarity),
                        "text_snippet": stored_text[:100] + "..."
                    })
        
        if assignment_id not in submitted_texts:
            submitted_texts[assignment_id] = []
        submitted_texts[assignment_id].append(text)
        
        max_similarity = max([s["similarity"] for s in similarities], default=0.0)
        
        return PlagiarismResponse(
            score=max_similarity,
            similarity_matches=similarities
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-performance", response_model=PerformanceResponse)
async def predict_performance(request: PerformanceRequest):
    try:
        attendance_rate = request.attendanceRate
        assignment_score = request.assignmentScore
        
        if attendance_rate >= 0.9 and assignment_score >= 0.85:
            predicted_grade = "A"
            risk_level = "LOW"
            confidence = 0.9
        elif attendance_rate >= 0.8 and assignment_score >= 0.75:
            predicted_grade = "B"
            risk_level = "LOW"
            confidence = 0.8
        elif attendance_rate >= 0.7 and assignment_score >= 0.6:
            predicted_grade = "C"
            risk_level = "MEDIUM"
            confidence = 0.7
        elif attendance_rate >= 0.6 and assignment_score >= 0.5:
            predicted_grade = "D"
            risk_level = "HIGH"
            confidence = 0.6
        else:
            predicted_grade = "F"
            risk_level = "CRITICAL"
            confidence = 0.8
        
        recommendations = []
        if attendance_rate < 0.8:
            recommendations.append("Improve class attendance")
        if assignment_score < 0.7:
            recommendations.append("Focus on assignment quality")
        if attendance_rate < 0.6:
            recommendations.append("Meet with academic advisor")
        if not recommendations:
            recommendations.append("Keep up the good work!")
        
        return PerformanceResponse(
            predictedGrade=predicted_grade,
            riskLevel=risk_level,
            confidence=confidence,
            recommendations=recommendations
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
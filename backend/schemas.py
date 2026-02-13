from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import UserRole

# --- Forward Refs ---
# Pydantic v1 requires update_forward_refs, v2 handles strings better but ordering is safer.

# --- Doctor Profile Schemas ---
class DoctorProfileBase(BaseModel):
    license_number: str
    clinic_name: str

class DoctorProfileResponse(DoctorProfileBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# --- Patient Profile Schemas ---
class PatientProfileBase(BaseModel):
    diagnosis: str
    affected_eye: str
    baseline_visual_acuity: Optional[str] = None
    visual_acuity_left: Optional[str] = "20/20"
    visual_acuity_right: Optional[str] = "20/20"
    prescription_details: Optional[str] = "{}"

class PatientProfileCreate(PatientProfileBase):
    doctor_id: Optional[int] = None
    parent_id: Optional[int] = None

class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: int
    doctor_id: Optional[int] = None
    parent_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# --- User Schemas (Now they can ref profiles) ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.PATIENT

class UserCreate(UserBase):
    password: str
    doctor_id: Optional[int] = None
    child_name: Optional[str] = None
    child_email: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    doctor_profile: Optional[DoctorProfileResponse] = None
    patient_profile: Optional[PatientProfileResponse] = None
    
    class Config:
        from_attributes = True

# --- Session Schemas ---
class SessionCreate(BaseModel):
    user_id: int 
    game_type: str
    difficulty: str
    duration_seconds: int = Field(..., gt=0, le=7200, description="Max session 2 hours")
    score: int = Field(..., ge=0, description="Score cannot be negative")
    balloons_popped: int = Field(0, ge=0)
    accuracy: float = Field(0.0, ge=0.0, le=100.0)
    
    # New Metrics
    fixation_accuracy: Optional[float] = 0.0
    avg_response_time: Optional[float] = 0.0
    dichoptic_contrast_level: Optional[float] = 1.0
    completion_rate: Optional[float] = 0.0
    game_metadata: Optional[str] = "{}"

class SessionResponse(BaseModel):
    id: int
    user_id: int
    game_type: str
    difficulty: str
    duration_seconds: int
    score: int
    balloons_popped: int
    start_time: datetime
    
    # New Metrics
    fixation_accuracy: Optional[float] = 0.0
    avg_response_time: Optional[float] = 0.0
    
    scheduled_date: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    
    class Config:
        from_attributes = True

# --- Doctor Note Schemas ---
class DoctorNoteCreate(BaseModel):
    patient_id: int
    note_type: str # "suggestion" or "report"
    content: str
    
class DoctorNoteResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    note_type: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

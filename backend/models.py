from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    PARENT = "parent"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Relationships
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    # Relationships moved to end of file to resolve forward references


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    license_number = Column(String)
    clinic_name = Column(String)
    
    user = relationship("User", back_populates="doctor_profile")
    patients = relationship("PatientProfile", back_populates="doctor")
    notes = relationship("DoctorNote", back_populates="doctor")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Medical Data (Encrypted in prod)
    diagnosis = Column(String) # e.g., "Amblyopia Left Eye"
    affected_eye = Column(String) # "LE" or "RE"
    baseline_visual_acuity = Column(String) 
    visual_acuity_left = Column(String, default="20/20")
    visual_acuity_right = Column(String, default="20/20")
    prescription_details = Column(Text, default="{}") # JSON storage for sphere/cyl 
    
    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    doctor = relationship("DoctorProfile", back_populates="patients")
    parent = relationship("User", foreign_keys=[parent_id], back_populates="children_profiles")
    sessions = relationship("TherapySession", back_populates="patient")
    doctor_notes = relationship("DoctorNote", back_populates="patient")

class TherapySession(Base):
    __tablename__ = "therapy_sessions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"))
    
    start_time = Column(DateTime, default=datetime.utcnow)
    scheduled_date = Column(DateTime, nullable=True) # For Doctor scheduling
    end_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    # Session Settings
    game_type = Column(String) # "balloon", "space", "neural"
    difficulty = Column(String) # "easy", "medium", "hard"
    
    # Performance Metrics
    score = Column(Integer, default=0)
    balloons_popped = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    
    # Advanced / Eye Tracking Metrics
    fixation_accuracy = Column(Float, default=0.0) # Percentage of successful fixations
    avg_response_time = Column(Float, default=0.0) # Seconds to find target
    dichoptic_contrast_level = Column(Float, default=1.0) # Setting used
    completion_rate = Column(Float, default=0.0) # % of level finished
    game_metadata = Column(Text, default="{}") # JSON blob for game-specifics (stars connected, etc)

    # Legacy/Advanced Metrics
    average_fixation_score = Column(Float, nullable=True)
    suppression_events = Column(Integer, default=0)
    
    patient = relationship("PatientProfile", back_populates="sessions")
    
    @property
    def user_id(self):
        if self.patient:
            return self.patient.user_id
        return None

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    icon = Column(String)  # emoji or icon name
    requirement_type = Column(String)  # "balloons_popped", "sessions_completed", "streak_days"
    requirement_value = Column(Integer)
    
    user_achievements = relationship("UserAchievement", back_populates="achievement")

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    achievement = relationship("Achievement", back_populates="user_achievements")

class NoteType(str, enum.Enum):
    SUGGESTION = "suggestion"
    REPORT = "report"

class DoctorNote(Base):
    __tablename__ = "doctor_notes"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"))
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"))
    note_type = Column(Enum(NoteType), default=NoteType.SUGGESTION)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    doctor = relationship("DoctorProfile", back_populates="notes")
    patient = relationship("PatientProfile", back_populates="doctor_notes")

# Resolve User relationships (Circular dependency fix)
User.patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, foreign_keys=[PatientProfile.user_id])
User.children_profiles = relationship("PatientProfile", back_populates="parent", foreign_keys=[PatientProfile.parent_id])

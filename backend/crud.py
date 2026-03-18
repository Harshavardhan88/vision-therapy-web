from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, schemas
# pwd_context removed, handled in main or via import
# To avoid circular import, we can move security logic to a separate file, but for now let's duplicate or refactor.
# Refactoring is safer: Move security logic to security.py
# But simpler fix: Import get_password_hash? No, circular import (main imports crud).
# SOLUTION: Use bcrypt directly here too.

import bcrypt

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_patients_by_doctor(db: Session, doctor_id: int):
    return db.query(models.User).join(models.PatientProfile).filter(
        models.User.role == "patient",
        models.PatientProfile.doctor_id == doctor_id
    ).all()

def get_children_for_parent(db: Session, parent_id: int):
    return db.query(models.User).join(models.PatientProfile, models.User.id == models.PatientProfile.user_id).filter(
        models.PatientProfile.parent_id == parent_id
    ).all()

def get_all_doctors(db: Session):
    return db.query(models.User).filter(models.User.role == "doctor").all()

def create_patient_profile(db: Session, profile: schemas.PatientProfileCreate, user_id: int, doctor_id: int = None, parent_id: int = None):
    db_profile = models.PatientProfile(
        **profile.dict(exclude={'doctor_id', 'parent_id'}),
        user_id=user_id,
        doctor_id=doctor_id,
        parent_id=parent_id
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def create_therapy_session(db: Session, session: schemas.SessionCreate):
    # Ensure patient profile exists, or create/link. 
    # For simplicity, we'll try to find a patient profile for this user.
    patient = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == session.user_id).first()
    
    # Auto-create profile if missing (fallback)
    if not patient:
        patient = models.PatientProfile(user_id=session.user_id, diagnosis="Unknown", affected_eye="Both")
        db.add(patient)
        db.commit()
        db.refresh(patient)
    
    db_session = models.TherapySession(
        patient_id=patient.id,
        game_type=session.game_type,
        difficulty=session.difficulty,
        duration_seconds=session.duration_seconds,
        score=session.score,
        balloons_popped=session.balloons_popped,
        accuracy=session.accuracy,
        fixation_accuracy=session.fixation_accuracy,
        avg_response_time=session.avg_response_time,
        dichoptic_contrast_level=session.dichoptic_contrast_level,
        completion_rate=session.completion_rate,
        game_metadata=session.game_metadata
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_user_sessions(db: Session, user_id: int):
    # Join Payload: We need sessions linked to the user's patient profile
    return db.query(models.TherapySession)\
        .join(models.PatientProfile)\
        .filter(models.PatientProfile.user_id == user_id)\
        .order_by(models.TherapySession.start_time.desc())\
        .all()

def get_patient_stats(db: Session, user_id: int):
    """
    Aggregates session data to return high-level stats:
    - total_sessions
    - total_duration_minutes
    - average_accuracy
    - current_streak_days
    """
    print(f"DEBUG: get_patient_stats for user_id={user_id}")
    try:
        sessions = get_user_sessions(db, user_id)
        print(f"DEBUG: Found {len(sessions)} sessions")
        
        total_sessions = len(sessions)
        if total_sessions == 0:
            return {
                "total_sessions": 0,
                "total_duration_minutes": 0,
                "average_accuracy": 0,
                "balloons_popped": 0,
                "streak_days": 0
            }
            
        total_seconds = sum(s.duration_seconds for s in sessions)
        total_balloons = sum(s.balloons_popped for s in sessions)
        avg_acc = sum(s.accuracy for s in sessions) / total_sessions
        
        # Calculate Streak (naive implementation)
        # Sort by date desc
        sorted_sessions = sorted(sessions, key=lambda x: x.start_time, reverse=True)
        current_streak = 0
        today = datetime.utcnow().date()
        # Check if played today
        if not sorted_sessions or not sorted_sessions[0].start_time:
             # Fallback if start_time missing
             return {
                "total_sessions": total_sessions,
                "total_duration_minutes": int(total_seconds / 60),
                "average_accuracy": round(avg_acc, 2),
                "balloons_popped": total_balloons,
                "streak_days": 0
            }

        last_play_date = sorted_sessions[0].start_time.date()
        
        if last_play_date == today:
            current_streak = 1
            check_date = today - timedelta(days=1)
        elif last_play_date == today - timedelta(days=1):
            current_streak = 1
            check_date = today - timedelta(days=2)
        else:
            return {
                "total_sessions": total_sessions,
                "total_duration_minutes": int(total_seconds / 60),
                "average_accuracy": round(avg_acc, 2),
                "balloons_popped": total_balloons,
                "streak_days": 0
            }

        # Iterate backwards to find consecutive days
        # (Simple logic, could be optimized with SQL window functions)
        dates_played = {s.start_time.date() for s in sorted_sessions if s.start_time}
        
        while check_date in dates_played:
            current_streak += 1
            check_date -= timedelta(days=1)
            
        return {
            "total_sessions": total_sessions,
            "total_duration_minutes": int(total_seconds / 60),
            "average_accuracy": round(avg_acc, 2),
            "balloons_popped": total_balloons,
            "streak_days": current_streak
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

def create_doctor_note(db: Session, note: schemas.DoctorNoteCreate, doctor_id: int):
    db_note = models.DoctorNote(
        doctor_id=doctor_id,
        patient_id=note.patient_id,
        note_type=note.note_type,
        content=note.content
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def get_doctor_notes(db: Session, patient_id: int):
    return db.query(models.DoctorNote).filter(models.DoctorNote.patient_id == patient_id).order_by(models.DoctorNote.created_at.desc()).all()

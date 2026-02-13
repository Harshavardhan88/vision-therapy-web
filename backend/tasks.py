from datetime import datetime, timedelta
from database import SessionLocal
from models import User, TherapySession, UserRole

def check_inactivity_and_notify():
    """
    Checks for patients who haven't played in 3 days.
    In a real app, this would send Emails/SMS.
    Here, it logs to console or updates a notification table.
    """
    db = SessionLocal()
    try:
        # Get all patients
        patients = db.query(User).filter(User.role == UserRole.PATIENT).all()
        
        for patient in patients:
            # Get last session
            last_session = db.query(TherapySession)\
                .filter(TherapySession.patient_id == patient.patient_profile.id)\
                .order_by(TherapySession.start_time.desc())\
                .first()
            
            should_notify = False
            if not last_session:
                # Never played?
                if (datetime.utcnow() - patient.created_at).days > 3:
                     should_notify = True
            else:
                if (datetime.utcnow() - last_session.start_time).days > 3:
                    should_notify = True
            
            if should_notify:
                # Log Notification (Simulating Email)
                print(f"[NOTIFICATION] ALERT: Patient {patient.full_name} ({patient.email}) hasn't played in over 3 days!")
                
                # In a real system: send_email(patient.email, "Missed you at Star Guardian Academy!")

    except Exception as e:
        print(f"Error in background task: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_inactivity_and_notify()

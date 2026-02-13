
from backend.database import SessionLocal, engine
from backend import models, crud, schemas
from backend.models import Base
import bcrypt

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_demo_users():
    # 1. Create Doctor
    doc_email = "doctor@example.com"
    existing_doc = crud.get_user_by_email(db, doc_email)
    if not existing_doc:
        print(f"Creating {doc_email}...")
        doc = models.User(
            email=doc_email,
            full_name="Dr. Sarah Smith",
            hashed_password=bcrypt.hashpw("doc123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role="doctor"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Profile
        profile = models.DoctorProfile(
            user_id=doc.id,
            clinic_name="Vision Care Center",
            license_number="DOC-001"
        )
        db.add(profile)
        db.commit()
    else:
        print(f"{doc_email} already exists.")

    # 2. Create Patient
    pat_email = "patient@example.com"
    existing_pat = crud.get_user_by_email(db, pat_email)
    if not existing_pat:
        print(f"Creating {pat_email}...")
        pat = models.User(
            email=pat_email,
            full_name="Alex Patient",
            hashed_password=bcrypt.hashpw("pat123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role="patient"
        )
        db.add(pat)
        db.commit()
        db.refresh(pat)
        
        # Profile
        profile = models.PatientProfile(
            user_id=pat.id,
            diagnosis="Amblyopia (Left Eye)",
            affected_eye="left"
        )
        db.add(profile)
        db.commit()
    else:
        print(f"{pat_email} already exists.")

    # 3. Create Parent
    par_email = "parent@example.com"
    existing_par = crud.get_user_by_email(db, par_email)
    if not existing_par:
        print(f"Creating {par_email}...")
        par = models.User(
            email=par_email,
            full_name="Parent User",
            hashed_password=bcrypt.hashpw("par123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role="parent"
        )
        db.add(par)
        db.commit()
    else:
        print(f"{par_email} already exists.")

    db.close()

if __name__ == "__main__":
    create_demo_users()

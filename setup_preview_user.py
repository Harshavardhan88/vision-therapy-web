import sys
import os
sys.path.append(os.getcwd())

from backend import models, schemas, crud, database
from sqlalchemy.orm import Session
import traceback

def setup_preview_user():
    print("--- Setting up Preview User ---")
    db = database.SessionLocal()
    try:
        # Fixed email for preview
        parent_email = "preview_parent@test.com"
        child_email = "preview_child@test.com"
        password = "password"
        
        # Check/Create Parent
        parent_user = crud.get_user_by_email(db, email=parent_email)
        if not parent_user:
            print(f"Creating parent: {parent_email}")
            parent_in = schemas.UserCreate(
                full_name="Preview Parent",
                email=parent_email,
                password=password,
                role="parent",
                child_name="Preview Child"
            )
            parent_user = crud.create_user(db=db, user=parent_in)
        else:
            print(f"Parent exists: {parent_email}")

        # Check/Create Child
        child_user = crud.get_user_by_email(db, email=child_email)
        if not child_user:
            print(f"Creating child: {child_email}")
            # Ensure parent has child_name if it was missing (though create_user handles it)
            
            child_user_data = schemas.UserCreate(
                full_name="Preview Child",
                email=child_email,
                password=password,
                role=models.UserRole.PATIENT
            )
            child_user = crud.create_user(db=db, user=child_user_data)
            
            print("Linking child profile...")
            crud.create_patient_profile(
                db=db,
                profile=schemas.PatientProfileCreate(
                    diagnosis="Amblyopia",
                    affected_eye="Left"
                ),
                user_id=child_user.id,
                parent_id=parent_user.id
            )
        else:
            print(f"Child exists: {child_email}")
            
        print("SUCCESS: User setup complete.")
        
    except Exception:
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    setup_preview_user()

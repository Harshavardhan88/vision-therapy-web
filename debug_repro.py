import sys
import os
# Add the current directory to sys.path so we can import backend
sys.path.append(os.getcwd())

from backend import models, schemas, crud, database
from sqlalchemy.orm import Session
import traceback

def test_create_parent_with_child():
    print("--- Testing Parent Creation Logic ---")
    db = database.SessionLocal()
    try:
        # Create unique email
        import time
        ts = int(time.time())
        email = f"debug_parent_{ts}@test.com"
        child_name = f"Debug Child {ts}"
        
        user_in = schemas.UserCreate(
            full_name="Debug Parent",
            email=email,
            password="password",
            role="parent",
            child_name=child_name
        )
        
        print(f"Attempting to create user: {email}")
        
        # Simulate main.py logic
        db_user = crud.get_user_by_email(db, email=user_in.email)
        if db_user:
            print("User already exists")
            return

        new_user = crud.create_user(db=db, user=user_in)
        print(f"User created: {new_user.id}")
        
        if user_in.role == "parent" and user_in.child_name:
            print("Creating child...")
            child_email = f"child_{new_user.email}"
            child_user_data = schemas.UserCreate(
                full_name=user_in.child_name,
                email=child_email,
                password=user_in.password,
                role=models.UserRole.PATIENT
            )
            
            existing_child = crud.get_user_by_email(db, email=child_email)
            if not existing_child:
                child_user = crud.create_user(db=db, user=child_user_data)
                print(f"Child user created: {child_user.id}")
                
                print("Creating child profile linked to parent...")
                # THIS IS THE SUSPECTED FAILURE POINT
                crud.create_patient_profile(
                    db=db,
                    profile=schemas.PatientProfileCreate(
                        diagnosis="Pending Diagnosis",
                        affected_eye="Both"
                    ),
                    user_id=child_user.id,
                    parent_id=new_user.id
                )
                print("Child profile created.")
        
        print("SUCCESS")
        
    except Exception:
        with open("traceback.txt", "w") as f:
            traceback.print_exc(file=f)
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_create_parent_with_child()

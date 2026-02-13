
import sys
import os

# Add current directory to sys.path so we can import backend modules
sys.path.append(os.getcwd())

from backend import crud, database, models

def test_stats_crash():
    db = database.SessionLocal()
    try:
        print("Testing get_patient_stats for user_id=1...")
        # Check if user existing
        user = crud.get_user_by_email(db, "gamify_v4@test.com")
        if user:
            print(f"User found: {user.id}")
            stats = crud.get_patient_stats(db, user.id)
            print("Stats:", stats)
        else:
            print("User gamify_v4@test.com not found. Create it first using test_backend.py")
            # If not found, try user 1
            stats = crud.get_patient_stats(db, 1)
            print("Stats for user 1:", stats)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_stats_crash()

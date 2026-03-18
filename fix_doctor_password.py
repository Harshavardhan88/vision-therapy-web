import sys
import os
import bcrypt

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend import models, database
except ImportError:
    sys.path.append(os.getcwd())
    from backend import models, database

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def fix_password():
    print("Fixing Doctor Password...")
    db = database.SessionLocal()
    try:
        doctor_email = "doctor@test.com"
        user = db.query(models.User).filter(models.User.email == doctor_email).first()
        
        if user:
            print(f"User {doctor_email} found.")
            new_hash = get_password_hash("test123")
            user.hashed_password = new_hash
            db.commit()
            print("✅ Password updated to 'test123'")
        else:
            print(f"❌ User {doctor_email} NOT FOUND. Creating it...")
            # Optional: Create if missing, but let's stick to fixing for now unless needed.
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_password()

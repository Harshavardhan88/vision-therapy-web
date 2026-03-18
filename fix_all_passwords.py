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

def fix_all_passwords():
    print("Fixing ALL Passwords...")
    db = database.SessionLocal()
    try:
        users = db.query(models.User).all()
        new_hash = get_password_hash("test123")
        
        count = 0
        for user in users:
            user.hashed_password = new_hash
            count += 1
            print(f"  - Updated {user.email}")
            
        db.commit()
        print(f"✅ Updated {count} users to password 'test123'")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_passwords()

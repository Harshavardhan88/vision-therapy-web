import requests
import json

BASE_URL = "http://localhost:8000"

def create_test_users():
    """Create test patient and doctor accounts"""
    
    # 1. Create Doctor Account
    print("Creating doctor account...")
    doctor_data = {
        "full_name": "Dr. Sarah Johnson",
        "email": "doctor@test.com",
        "password": "test123",
        "role": "doctor"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/", json=doctor_data)
        if response.status_code == 200:
            print("[OK] Doctor account created successfully")
            doctor = response.json()
            print(f"  Email: {doctor['email']}")
        elif response.status_code == 400 and "already registered" in response.text:
            print("[OK] Doctor account already exists")
        else:
            print(f"[ERROR] Error creating doctor: {response.text}")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    # 2. Create Patient Account
    print("\nCreating patient account...")
    patient_data = {
        "full_name": "Alex Thompson",
        "email": "patient@test.com",
        "password": "test123",
        "role": "patient"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/", json=patient_data)
        if response.status_code == 200:
            print("[OK] Patient account created successfully")
            patient = response.json()
            print(f"  Email: {patient['email']}")
        elif response.status_code == 400 and "already registered" in response.text:
            print("[OK] Patient account already exists")
        else:
            print(f"[ERROR] Error creating patient: {response.text}")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    # 3. Test Login
    print("\n" + "="*50)
    print("TEST CREDENTIALS")
    print("="*50)
    print("\nDoctor Login:")
    print("  Email: doctor@test.com")
    print("  Password: test123")
    print("\nPatient Login:")
    print("  Email: patient@test.com")
    print("  Password: test123")
    print("="*50)

if __name__ == "__main__":
    create_test_users()


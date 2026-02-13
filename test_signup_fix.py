import requests
import sqlite3
import json

BASE_URL = "http://localhost:8000"

def test_api_signup_flow():
    print("--- Testing API Signup Flow ---")

    # 1. Fetch Public Doctors
    try:
        print("1. Fetching doctors...")
        resp = requests.get(f"{BASE_URL}/api/public/doctors")
        if resp.status_code != 200:
            print(f"FAIL: /api/public/doctors returned {resp.status_code}")
            return
        
        doctors = resp.json()
        if not doctors:
            print("FAIL: No doctors returned.")
            return

        # Pick the first doctor with a profile
        target_doc = None
        for doc in doctors:
            if doc.get('doctor_profile'):
                target_doc = doc
                break
        
        if not target_doc:
            print("FAIL: No doctor with a profile found.")
            return

        doc_profile_id = target_doc['doctor_profile']['id']
        print(f"   Target Doctor: {target_doc['full_name']} (Profile ID: {doc_profile_id})")

    except Exception as e:
        print(f"FAIL: Network error: {e}")
        return

    # 2. Signup as Patient with this Doctor
    user_data = {
        "full_name": "API Verified Patient",
        "email": "api_verified@example.com",
        "password": "password123",
        "role": "patient",
        "doctor_id": doc_profile_id
    }

    try:
        print(f"2. Registering patient 'api_verified@example.com' assigned to ID {doc_profile_id}...")
        resp = requests.post(f"{BASE_URL}/users/", json=user_data)
        
        if resp.status_code == 200:
            print("   Signup Successful.")
        elif resp.status_code == 400 and "Email already registered" in resp.text:
            print("   User already exists. Proceeding to verification.")
        else:
            print(f"FAIL: Signup failed: {resp.status_code} - {resp.text}")
            return

    except Exception as e:
        print(f"FAIL: Network error during signup: {e}")
        return

    # 3. Verify in Database
    print("3. Verifying database assignment...")
    try:
        conn = sqlite3.connect('amblyocare_v2.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email='api_verified@example.com'")
        user = cursor.fetchone()
        if not user:
             print("FAIL: User not found in DB.")
             return
        
        cursor.execute("SELECT doctor_id FROM patient_profiles WHERE user_id=?", (user[0],))
        profile = cursor.fetchone()
        
        if profile and profile[0] == doc_profile_id:
            print(f"SUCCESS: Patient assigned to Doctor Profile ID {profile[0]}. Verification Complete.")
        else:
            print(f"FAIL: Assigned to ID {profile[0] if profile else 'None'}, expected {doc_profile_id}.")
            
        conn.close()

    except Exception as e:
        print(f"FAIL: Database error: {e}")

if __name__ == "__main__":
    test_api_signup_flow()

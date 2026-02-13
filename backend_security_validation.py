import requests
import sys

BASE_URL = "http://localhost:8004" # Port 8004 is our dedicated test port
# Credentials (assuming these users exist from deep dive or we create them)
DOCTOR_EMAIL = "secure_doc@example.com"
PATIENT_A_EMAIL = "patient_a@example.com"
PATIENT_B_EMAIL = "patient_b@example.com"
PASSWORD = "password123"

def get_token(email, role="patient"):
    # 1. Register (ignore if exists)
    try:
        requests.post(f"{BASE_URL}/users/", json={
            "email": email, "password": PASSWORD, "full_name": email.split("@")[0], "role": role
        })
    except:
        pass
        
    # 2. Login
    resp = requests.post(f"{BASE_URL}/token", data={"username": email, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

def run_tests():
    print("[SEC] Starting RBAC Verification...")
    
    # Setup Tokens
    token_doc = get_token(DOCTOR_EMAIL, "doctor")
    token_a = get_token(PATIENT_A_EMAIL, "patient")
    token_b = get_token(PATIENT_B_EMAIL, "patient")
    
    # Get IDs (need to fetch /users/me to know my ID)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    id_a = requests.get(f"{BASE_URL}/users/me", headers=headers_a).json()["id"]
    
    headers_b = {"Authorization": f"Bearer {token_b}"}
    id_b = requests.get(f"{BASE_URL}/users/me", headers=headers_b).json()["id"]

    # TEST 1: Patient A tries to post session for Patient B
    print(f"[TEST 1] Patient A (ID {id_a}) posting for Patient B (ID {id_b})...", end=" ")
    resp = requests.post(f"{BASE_URL}/api/sessions", headers=headers_a, json={
        "user_id": id_b, # <-- MALICIOUS
        "game_type": "hack", "difficulty": "easy", "duration_seconds": 10, "score": 100
    })
    
    if resp.status_code == 403:
        print("✅ BLOCKED (403)")
    elif resp.json()['user_id'] == id_a:
         print(f"✅ SANITIZED (Overwritten to ID {id_a})")
    else:
        print(f"❌ FAILED! Status: {resp.status_code}")

    # TEST 2: Patient A tries to read Patient B's history
    print("[TEST 2] Patient A reading Patient B history...", end=" ")
    resp = requests.get(f"{BASE_URL}/api/sessions/{id_b}", headers=headers_a)
    if resp.status_code == 403:
        print("✅ BLOCKED (403)")
    else:
        print(f"❌ FAILED! Status: {resp.status_code}, Body: {resp.text[:50]}")

    # TEST 3: Doctor tries to read Patient A's history
    print("[TEST 3] Doctor reading Patient A history...", end=" ")
    resp = requests.get(f"{BASE_URL}/api/sessions/{id_a}", headers={"Authorization": f"Bearer {token_doc}"})
    if resp.status_code == 200:
        print("✅ ALLOWED")
    else:
        print(f"❌ FAILED! Status: {resp.status_code}")
        
    # TEST 4: Input Validation (Negative Score)
    print("[TEST 4] Sending Negative Score...", end=" ")
    resp = requests.post(f"{BASE_URL}/api/sessions", headers=headers_a, json={
        "user_id": id_a, 
        "game_type": "space", "difficulty": "easy", "duration_seconds": 60, 
        "score": -100 # <-- INVALID
    })
    
    if resp.status_code == 422:
        print("✅ BLOCKED (422 Pydantic)")
    else:
        print(f"❌ FAILED! Status: {resp.status_code}")

    print("[SEC] Verification Complete.")

if __name__ == "__main__":
    run_tests()

import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    resp = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None

def verify_parent_patient():
    print("--- Verifying Parent & Patient Features ---")
    
    # 1. Create/Login Parent
    parent_email = "test_parent@example.com"
    parent_pass = "password123"
    
    # Try generic register (might fail if exists)
    requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Test Parent",
        "email": parent_email,
        "password": parent_pass,
        "role": "parent"
    })
    
    token = get_token(parent_email, parent_pass)
    if not token:
        print("FAIL: Could not login as Parent.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check /users/me
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if resp.status_code == 200:
        print(f"SUCCESS: Parent /users/me working. Name: {resp.json()['full_name']}")
    else:
        print(f"FAIL: Parent /users/me failed: {resp.status_code}")

    # Check /api/parent/children
    resp = requests.get(f"{BASE_URL}/api/parent/children", headers=headers)
    if resp.status_code == 200:
        children = resp.json()
        print(f"SUCCESS: /api/parent/children returned {len(children)} children.")
    else:
        print(f"FAIL: /api/parent/children failed: {resp.status_code}")

    # 2. Check Patient Name Logic (Login as existing patient)
    # We use 'api_verified@example.com' from previous step
    patient_email = "api_verified@example.com"
    token = get_token(patient_email, "password123")
    
    if not token:
        print("WARNING: Could not login as 'api_verified@example.com'. Skipping patient check.")
    else:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if resp.status_code == 200:
             print(f"SUCCESS: Patient /users/me working. Name: {resp.json()['full_name']}")
        else:
             print(f"FAIL: Patient /users/me failed: {resp.status_code}")

if __name__ == "__main__":
    verify_parent_patient()

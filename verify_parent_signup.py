import requests
import json

BASE_URL = "http://localhost:8000"

def verify_parent_signup():
    print("--- Verifying Parent Signup with Child ---")
    
    parent_email = "new_parent@example.com"
    parent_pass = "password123"
    child_name = "New Child"
    
    # 1. Signup as Parent with Child Name
    print("1. Signing up as Parent...")
    payload = {
        "full_name": "New Parent",
        "email": parent_email,
        "password": parent_pass,
        "role": "parent",
        "child_name": child_name
    }
    
    resp = requests.post(f"{BASE_URL}/users/", json=payload)
    if resp.status_code != 200:
        if "Email already registered" in resp.text:
             print("   Parent already exists (from previous run?). Linking verification might rely on fresh data.")
        else:
             print(f"FAIL: Signup failed: {resp.status_code} - {resp.text}")
             return
    else:
        print("   Parent Signup Successful.")

    # 2. Login as Parent
    print("2. Logging in as Parent...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": parent_email, "password": parent_pass})
    if resp.status_code != 200:
        print("FAIL: Login failed.")
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Check Children
    print("3. Checking for created child...")
    resp = requests.get(f"{BASE_URL}/api/parent/children", headers=headers)
    if resp.status_code == 200:
        children = resp.json()
        print(f"   Children found: {len(children)}")
        found = False
        for child in children:
            print(f"   - {child['full_name']} (ID: {child['id']})")
            if child['full_name'] == child_name:
                found = True
        
        if found:
            print("SUCCESS: Child account was automatically created and linked.")
        else:
            print("FAIL: Child with expected name not found.")
            
    else:
        print(f"FAIL: /api/parent/children failed: {resp.status_code}")

if __name__ == "__main__":
    verify_parent_signup()

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def verify_child_linking():
    print("--- Verifying Manual Child Linking ---")
    
    # 1. Create a Standalone Patient (Simulating existing child)
    child_email = f"existing_child_{int(time.time())}@example.com"
    child_pass = "password123"
    print(f"1. Creating standalone patient: {child_email}")
    
    resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Existing Standalone Child",
        "email": child_email,
        "password": child_pass,
        "role": "patient"
    })
    
    if resp.status_code != 200:
        print(f"FAIL: Could not create child. {resp.text}")
        return
    child_id = resp.json()["id"]
    print(f"   Child Created. ID: {child_id}")

    # 2. Signup as Parent and Link to this Child
    parent_email = f"linking_parent_{int(time.time())}@example.com"
    print(f"2. Signing up as Parent linking to: {child_email}")
    
    resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Linking Parent",
        "email": parent_email,
        "password": "password123",
        "role": "parent",
        "child_email": child_email # The key field
    })
    
    if resp.status_code != 200:
        print(f"FAIL: Parent signup failed. {resp.text}")
        return
    print("   Parent Signup Successful.")
    
    # 3. Verify Linkage (Login as Parent)
    print("3. Verifying Linkage...")
    token_resp = requests.post(f"{BASE_URL}/token", data={"username": parent_email, "password": "password123"})
    token = token_resp.json()["access_token"]
    
    children_resp = requests.get(f"{BASE_URL}/api/parent/children", headers={"Authorization": f"Bearer {token}"})
    if children_resp.status_code == 200:
        children = children_resp.json()
        print(f"   Children found: {len(children)}")
        linked = False
        for c in children:
            if c["email"] == child_email:
                linked = True
                print(f"   MATCH: Found child {c['full_name']} ({c['email']})")
        
        if linked:
            print("SUCCESS: Existing child was successfully linked.")
        else:
            print("FAIL: Child not found in parent's list.")
    else:
        print(f"FAIL: API Error {children_resp.status_code}")

if __name__ == "__main__":
    verify_child_linking()

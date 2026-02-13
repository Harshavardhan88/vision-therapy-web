import requests
import time

BASE_URL = "http://localhost:8000"

def setup_parent_view_data():
    timestamp = int(time.time())
    print(f"--- Setting up Parent View Data ({timestamp}) ---")
    
    # 1. Create Proper Parent
    parent_email = f"parent_view_{timestamp}@example.com"
    parent_pass = "password123"
    print(f"1. Creating Parent: {parent_email}")
    requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Parent Viewer",
        "email": parent_email,
        "password": parent_pass,
        "role": "parent"
    })
    
    # Login Parent to get ID
    p_token = requests.post(f"{BASE_URL}/token", data={"username": parent_email, "password": parent_pass}).json()["access_token"]
    
    # 2. Create Proper Child (Linked to Parent)
    child_name = f"Child_{timestamp}"
    # Use parent signup logic? No, let's just create user and link manually or use the endpoint logic.
    # Easiest: Create child user, then create profile with parent_id.
    
    child_email = f"child_view_{timestamp}@example.com"
    print(f"2. Creating Child: {child_email}")
    child_resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": child_name,
        "email": child_email,
        "password": "password123",
        "role": "patient"
    })
    child_id = child_resp.json()["id"]
    
    # Link manually (since we don't have a direct endpoint for 'set parent' easily exposed without auth dance)
    # Actually, let's use the 'create_user' logic: parent signs up with child_name.
    # BUT we already created parent.
    # Let's use the DB directly? No, stick to API.
    # Use the 'link existing child' logic!
    # Parent (already created) -> We can't update role/link easily via API yet.
    
    # Better: user 'signup' as parent with 'child_name' param
    # Rerun step 1 but use correct payload
    real_parent_email = f"parent_real_{timestamp}@example.com"
    print(f"   (Re)Creating Parent with Auto-Child: {real_parent_email}")
    resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Parent Viewer Real",
        "email": real_parent_email,
        "password": "password123",
        "role": "parent",
        "child_name": f"Child of {timestamp}" # This matches backend logic to create child
    })
    
    parent_data = resp.json()
    # Now find the child. Backend creates 'child_{parent_email}'
    expected_child_email = f"child_{real_parent_email}"
    
    # Login as Doctor to add note
    doc_email = "test_doc_notes@example.com" # From previous step
    d_token = requests.post(f"{BASE_URL}/token", data={"username": doc_email, "password": "password123"}).json()["access_token"]
    
    # Get Child ID
    # Doctor needs to query users? Or we login as child to get ID.
    c_token = requests.post(f"{BASE_URL}/token", data={"username": expected_child_email, "password": "password123"}).json()["access_token"]
    child_me = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {c_token}"}).json()
    child_id = child_me["id"]
    print(f"3. Child Found: ID {child_id}")
    
    # 4. Doctor creates note for this child
    print("4. Doctor adding note...")
    requests.post(f"{BASE_URL}/api/doctor/notes", json={
        "patient_id": child_id,
        "note_type": "suggestion",
        "content": "Please increase daily session time to 20 minutes."
    }, headers={"Authorization": f"Bearer {d_token}"})
    
    print(f"DONE. Login as: {real_parent_email} / password123")
    print(f"Exepct to see note for: {child_me['full_name']}")

if __name__ == "__main__":
    setup_parent_view_data()

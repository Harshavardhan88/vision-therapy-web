import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def run_e2e_journey():
    print("--- Starting E2E Journey Simulation ---")
    
    timestamp = int(time.time())
    
    # 1. Parent Signup
    print("1. Parent Signup...")
    p_email = f"e2e_parent_{timestamp}@test.com"
    child_name = f"E2E Child {timestamp}"
    resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": "E2E Parent",
        "email": p_email,
        "password": "password",
        "role": "parent",
        "child_name": child_name
    })
    if resp.status_code != 200:
        print(f"FAIL: Parent signup. {resp.text}")
        return

    # Login Parent
    p_token = requests.post(f"{BASE_URL}/token", data={"username": p_email, "password": "password"}).json()["access_token"]
    
    # 2. Get Child Info
    print("2. Retrieve Child Info...")
    children = requests.get(f"{BASE_URL}/api/parent/children", headers={"Authorization": f"Bearer {p_token}"}).json()
    if not children:
        print("FAIL: No children found for parent.")
        return
    child_id = children[0]["id"]
    child_email = children[0]["email"]
    print(f"   Child ID: {child_id} ({child_email})")
    
    # 3. Child Plays Game (Session Log)
    print("3. Child Logs Session...")
    c_token = requests.post(f"{BASE_URL}/token", data={"username": child_email, "password": "password"}).json()["access_token"]
    
    sess_resp = requests.post(f"{BASE_URL}/api/sessions", json={
        "user_id": child_id,
        "game_type": "balloon",
        "difficulty": "easy",
        "duration_seconds": 120,
        "score": 500,
        "balloons_popped": 10
    }, headers={"Authorization": f"Bearer {c_token}"})
    
    if sess_resp.status_code != 200:
        print(f"FAIL: Session log. {sess_resp.text}")
        return

    # 4. Doctor Views Child (Linkage)
    print("4. Doctor Interaction...")
    # Create Doctor
    # Note: If reusing existing DB, this might conflict. Use unique email.
    d_email = f"e2e_doc2_{timestamp}@test.com"
    requests.post(f"{BASE_URL}/users/", json={"full_name": "Dr. E2E", "email": d_email, "password": "password", "role": "doctor"})
    
    # Login as Doctor to get token
    d_resp = requests.post(f"{BASE_URL}/token", data={"username": d_email, "password": "password"})
    if d_resp.status_code != 200:
        print(f"FAIL: Doctor Login. {d_resp.text}")
        return
    d_token = d_resp.json()["access_token"]
    
    # Needs to be a valid doctor profile. create_user makes it.
    
    print("5. Doctor Adds Note...")
    note_resp = requests.post(f"{BASE_URL}/api/doctor/notes", json={
        "patient_id": child_id,
        "note_type": "suggestion",
        "content": "E2E Test Note"
    }, headers={"Authorization": f"Bearer {d_token}"})
    
    if note_resp.status_code != 200:
        print(f"FAIL: Doctor Note. {note_resp.text}")
        return

    # 6. Parent Views Note
    print("6. Parent Views Note...")
    notes_resp = requests.get(f"{BASE_URL}/api/doctor/notes/{child_id}", headers={"Authorization": f"Bearer {p_token}"})
    if notes_resp.status_code != 200:
         print(f"FAIL: Parent View Note. {notes_resp.text}")
         return
         
    notes = notes_resp.json()
    if len(notes) > 0 and notes[0]["content"] == "E2E Test Note":
        print("SUCCESS: Full E2E Journey Completed.")
    else:
        print("FAIL: Note verification mismatch.")

if __name__ == "__main__":
    run_e2e_journey()

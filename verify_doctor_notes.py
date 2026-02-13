import requests
import json
import time

BASE_URL = "http://localhost:8000"

def verify_doctor_notes():
    print("--- Verifying Doctor Notes API ---")
    
    # 1. Login as Doctor (assuming 'test_doc_1' exists from previous setup or use a known one)
    # If not, create one.
    doc_email = "test_doc_notes@example.com"
    doc_pass = "password123"
    
    # Try login, if fail, create
    token_resp = requests.post(f"{BASE_URL}/token", data={"username": doc_email, "password": doc_pass})
    if token_resp.status_code != 200:
        print("   Creating new doctor for test...")
        requests.post(f"{BASE_URL}/users/", json={
            "full_name": "Dr. Notes Verification",
            "email": doc_email,
            "password": doc_pass,
            "role": "doctor"
        })
        token_resp = requests.post(f"{BASE_URL}/token", data={"username": doc_email, "password": doc_pass})
    
    if token_resp.status_code != 200:
        print(f"FAIL: Doctor login failed. {token_resp.text}")
        return

    doc_token = token_resp.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    
    # 2. Create a Patient via Doctor (to ensure linkage)
    pat_email = f"notes_patient_{int(time.time())}@example.com"
    print(f"   Creating patient: {pat_email}")
    pat_resp = requests.post(f"{BASE_URL}/users/", json={
        "full_name": "Notes Patient",
        "email": pat_email,
        "password": "password123",
        "role": "patient",
        "doctor_id": None # Will be auto-assigned if creator is doctor? No, need to check logic.
        # Logic says: "elif current_user ... role == doctor ... doctor_id = current_user.doctor_profile.id"
        # So we must pass the header.
    }, headers=doc_headers) # IMPORTANT: Pass headers to trigger implicit assignment
    
    if pat_resp.status_code != 200:
        print(f"FAIL: Patient creation failed. {pat_resp.text}")
        return
        
    patient_id = pat_resp.json()["id"]
    print(f"   Patient ID: {patient_id}")

    # 3. Create a Note
    print("3. Creating a Clinical Note...")
    note_content = "Patient shows good progress in convergence."
    note_resp = requests.post(f"{BASE_URL}/api/doctor/notes", json={
        "patient_id": patient_id,
        "note_type": "suggestion",
        "content": note_content
    }, headers=doc_headers)
    
    if note_resp.status_code != 200:
        print(f"FAIL: Create note failed. {note_resp.text}")
        return
    print("   Note created successfully.")
    
    # 4. Fetch Notes
    print("4. Fetching Notes...")
    get_resp = requests.get(f"{BASE_URL}/api/doctor/notes/{patient_id}", headers=doc_headers)
    
    if get_resp.status_code == 200:
        notes = get_resp.json()
        print(f"   Notes found: {len(notes)}")
        if len(notes) > 0 and notes[0]["content"] == note_content:
            print("SUCCESS: Note content verified.")
        else:
            print("FAIL: Note content mismatch or empty.")
    else:
        print(f"FAIL: Fetch notes failed. {get_resp.status_code}")

if __name__ == "__main__":
    verify_doctor_notes()

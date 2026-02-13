import pytest
from backend import schemas

def test_read_main(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "system": "AmblyoCare Clinical Engine"}

# --- AUTH TESTS ---
def test_create_user(client):
    response = client.post(
        "/users/",
        json={"email": "newuser@example.com", "password": "password", "full_name": "New User", "role": "patient"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

def test_login_token(client):
    # Ensure user exists (from previous test or fixture? Tests should be isolated but simplified here)
    client.post("/users/", json={"email": "login@example.com", "password": "password", "full_name": "Login User", "role": "patient"})
    response = client.post("/token", data={"username": "login@example.com", "password": "password"})
    assert response.status_code == 200
    assert "access_token" in response.json()

# --- DASHBOARD TESTS ---

def test_get_patient_stats_empty(client, patient_token):
    # Get ID of patient
    me = client.get("/users/me", headers={"Authorization": f"Bearer {patient_token}"}).json()
    response = client.get(f"/api/stats/{me['id']}", headers={"Authorization": f"Bearer {patient_token}"})
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_sessions"] == 0

def test_doctor_access_control(client, patient_token):
    # Patient trying to access doctor list
    response = client.get("/api/doctor/patients", headers={"Authorization": f"Bearer {patient_token}"})
    assert response.status_code == 403

def test_doctor_create_note(client, doctor_token):
    # 1. Create patient
    doc_auth = {"Authorization": f"Bearer {doctor_token}"}
    pat_resp = client.post("/users/", json={"email": "p_note@test.com", "password": "pw", "full_name": "P Note", "role": "patient"}, headers=doc_auth)
    pat_id = pat_resp.json()["id"]

    # 2. Create Note
    note_resp = client.post("/api/doctor/notes", json={
        "patient_id": pat_id, 
        "note_type": "suggestion", 
        "content": "Test Note"
    }, headers=doc_auth)
    assert note_resp.status_code == 200
    
    # 3. Get Note
    get_resp = client.get(f"/api/doctor/notes/{pat_id}", headers=doc_auth)
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1
    assert get_resp.json()[0]["content"] == "Test Note"

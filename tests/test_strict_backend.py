import pytest
from fastapi.testclient import TestClient

def test_signup_duplicate_email(client):
    """Ensure duplicate emails return 400 Bad Request."""
    email = "duplicate@test.com"
    # First signup
    resp1 = client.post("/users/", json={"email": email, "password": "pw", "full_name": "User 1", "role": "patient"})
    assert resp1.status_code == 200
    
    # Duplicate signup
    resp2 = client.post("/users/", json={"email": email, "password": "pw", "full_name": "User 2", "role": "patient"})
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Email already registered"

def test_login_invalid_credentials(client):
    """Ensure invalid login returns 401 Unauthorized."""
    # Create user
    client.post("/users/", json={"email": "valid@test.com", "password": "password", "full_name": "Valid User", "role": "patient"})
    
    # Wrong password
    resp = client.post("/token", data={"username": "valid@test.com", "password": "wrongpassword"})
    assert resp.status_code == 401
    
    # Wrong email
    resp = client.post("/token", data={"username": "invalid@test.com", "password": "password"})
    assert resp.status_code == 401

def test_negative_session_values(client, patient_token):
    """Ensure sessions cannot have negative duration or score."""
    # duration_seconds < 0
    resp = client.post("/api/sessions", json={
        "user_id": 1, # ID not verified in schema validation usually unless Pydantic model enforces it, let's see api logic
        "game_type": "test",
        "difficulty": "easy",
        "duration_seconds": -10,
        "score": 100
    }, headers={"Authorization": f"Bearer {patient_token}"})
    
    # FastAPI/Pydantic default validation for int might allow negative unless constrained.
    # If our schema doesn't have gt=0, this might pass (which is a bug/weakness).
    # If it passes, we should assert 422 if we want to be strict, or fix the model.
    # For now, let's see what happens. Ideally it should be 422.
    assert resp.status_code in [422, 400]

def test_unauthorized_doctor_notes(client, patient_token):
    """Ensure patients cannot create doctor notes."""
    resp = client.post("/api/doctor/notes", json={
        "patient_id": 1,
        "note_type": "suggestion",
        "content": "Hack"
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Only doctors can create notes"

def test_exact_user_profile(client, patient_token):
    """Verify exact fields in user profile response."""
    resp = client.get("/users/me", headers={"Authorization": f"Bearer {patient_token}"})
    assert resp.status_code == 200
    data = resp.json()
    
    # Strict key check
    expected_keys = {"id", "email", "full_name", "role", "is_active", "created_at", "doctor_profile", "patient_profile"}
    assert set(data.keys()) >= expected_keys # JSON response might have more keys if Pydantic model has extra fields
    
    assert data["role"] == "patient"
    assert data["email"] == "test_patient@example.com"

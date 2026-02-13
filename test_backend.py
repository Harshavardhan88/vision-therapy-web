import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def check_resp(res, task_name):
    if res.status_code not in [200, 201]:
        print(f"❌ {task_name} FAILED: {res.status_code}")
        print(f"Response: {res.text}")
        return None
    try:
        return res.json()
    except:
        print(f"❌ {task_name} FAILED: Invalid JSON")
        print(f"Response: {res.text}")
        return None

def test_flow():
    # 1. Signup
    email = "gamify_v4@test.com"
    password = "password123"
    print(f"Creating user {email}...")
    
    res = requests.post(f"{BASE_URL}/users/", json={
        "email": email,
        "password": password,
        "full_name": "Gamify Tester",
        "role": "patient"
    })
    
    if res.status_code == 400:
        print("User already exists, proceeding...")
    elif res.status_code == 200:
        print("✅ User created.")
    else:
        print(f"❌ Signup Error: {res.status_code} {res.text}")
        return

    # 2. Login
    print("Logging in...")
    login_res = requests.post(f"{BASE_URL}/token", data={
        "username": email,
        "password": password
    })
    data = check_resp(login_res, "Login")
    if not data: return
    token = data["access_token"]
    
    # 3. Get User ID
    print("Fetching /users/me...")
    me_res = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"})
    me_data = check_resp(me_res, "Get Me")
    if not me_data: return
    user_id = me_data["id"]
    print(f"Logged in as User ID: {user_id}")

    # 4. Check Initial Stats
    print("Checking initial stats...")
    stats_res = requests.get(f"{BASE_URL}/api/stats/{user_id}", headers={"Authorization": f"Bearer {token}"})
    stats_data = check_resp(stats_res, "Get Stats")
    if not stats_data: return
    print("Initial Stats:", stats_data)

    # 5. Create Session
    print("Creating Session...")
    session_data = {
        "user_id": user_id,
        "game_type": "space_fights",
        "difficulty": "easy",
        "duration_seconds": 120,
        "score": 500,
        "balloons_popped": 10,
        "accuracy": 0.95
    }
    
    sess_res = requests.post(f"{BASE_URL}/api/sessions", json=session_data, headers={"Authorization": f"Bearer {token}"})
    sess_data = check_resp(sess_res, "Create Session")
    if not sess_data: return
    print("✅ Session Created.")

    # 6. Check Updated Stats to verify logic
    print("Checking updated stats...")
    stats_res = requests.get(f"{BASE_URL}/api/stats/{user_id}", headers={"Authorization": f"Bearer {token}"})
    stats_data = check_resp(stats_res, "Get Final Stats")
    if not stats_data: return
    
    print("Final Stats:", stats_data)
    
    if stats_data["total_sessions"] >= 1:
        print("✅ SUCCESS: Backend logic verified.")
    else:
        print("❌ FAIL: Session did not update stats.")

if __name__ == "__main__":
    test_flow()

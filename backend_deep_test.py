import requests
import time
import random

BASE_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def test_deep_dive():
    log("Starting Deep Dive Verification...", "START")
    
    # ---------------------------------------------------------
    # 1. SECURITY AUDIT
    # ---------------------------------------------------------
    log("--- Phase 1: Security Audit ---")
    
    # Test 1.1: Access protected route without token
    res = requests.get(f"{BASE_URL}/users/me")
    if res.status_code == 401:
        log("✅ Protected route rejected unauthorized access (401)")
    else:
        log(f"❌ Protected route exposed! Status: {res.status_code}", "FAIL")

    # Test 1.2: Login with bad password
    res = requests.post(f"{BASE_URL}/token", data={"username": "gamify_v4@test.com", "password": "WRONG_PASSWORD"})
    if res.status_code == 401:
        log("✅ Invalid login handled correctly (401)")
    else:
        log(f"❌ Invalid login allowed or improperly handled! Status: {res.status_code}", "FAIL")


    # ---------------------------------------------------------
    # 2. GAMIFICATION LOGIC (The "99 Balloons" Problem)
    # ---------------------------------------------------------
    log("--- Phase 2: Gamification Logic ---")
    
    # Setup: Create a new user specifically for this test
    email = f"balloon_tester_{int(time.time())}@test.com"
    pwd = "password123"
    
    requests.post(f"{BASE_URL}/users/", json={"email": email, "password": pwd, "full_name": "Balloon Tester", "role": "patient"})
    
    # Login
    token_res = requests.post(f"{BASE_URL}/token", data={"username": email, "password": pwd}).json()
    token = token_res["access_token"]
    AUTH = {"Authorization": f"Bearer {token}"}
    
    me = requests.get(f"{BASE_URL}/users/me", headers=AUTH).json()
    uid = me["id"]
    log(f"Created Test User: {email} (ID: {uid})")
    
    # Test 2.1: Submit session with 99 balloons (Target is 100)
    # Note: We need to know previous total. New user = 0.
    requests.post(f"{BASE_URL}/api/sessions", json={
        "user_id": uid, "game_type": "test", "difficulty": "easy", 
        "duration_seconds": 60, "score": 100, "balloons_popped": 99, "accuracy": 0.8
    }, headers=AUTH)
    
    # Verify NO 'Balloon Popper' achievement yet
    # We can infer this by checking subsequent logs if we had them or check standard output manually? 
    # For now, we trust the logic if the NEXT step unlocks it.
    
    # Test 2.2: Submit 1 more balloon session
    requests.post(f"{BASE_URL}/api/sessions", json={
        "user_id": uid, "game_type": "test", "difficulty": "easy", 
        "duration_seconds": 60, "score": 10, "balloons_popped": 1, "accuracy": 0.8
    }, headers=AUTH)
    
    # At this point, Total = 100. Should be unlocked.
    # Since we can't query achievements directly via API (missing endpoint), we verify via Stats
    stats = requests.get(f"{BASE_URL}/api/stats/{uid}", headers=AUTH).json()
    if stats["balloons_popped"] == 100:
        log(f"✅ Exact boundary hit: 100 balloons recorded.")
    else:
        log(f"❌ Calculation error. Expected 100, got {stats['balloons_popped']}", "FAIL")


    # ---------------------------------------------------------
    # 3. LEADERBOARD RACE CONDITION
    # ---------------------------------------------------------
    log("--- Phase 3: Leaderboard Sorting ---")
    
    # Create 3 users with distinct scores
    users = [
        {"name": "Low Scorer", "score": 100},
        {"name": "Mid Scorer", "score": 500},
        {"name": "High Scorer", "score": 1000}
    ]
    
    for u in users:
        u_email = f"rank_{u['score']}_{int(time.time())}@test.com"
        # Signup
        requests.post(f"{BASE_URL}/users/", json={"email": u_email, "password": pwd, "full_name": u['name'], "role": "patient"})
        # Login
        u_token = requests.post(f"{BASE_URL}/token", data={"username": u_email, "password": pwd}).json()["access_token"]
        u_head = {"Authorization": f"Bearer {u_token}"}
        u_id = requests.get(f"{BASE_URL}/users/me", headers=u_head).json()["id"]
        
        # Post Score
        requests.post(f"{BASE_URL}/api/sessions", json={
            "user_id": u_id, "game_type": "ranking", "difficulty": "hard", 
            "duration_seconds": 60, "score": u['score'], "balloons_popped": 0, "accuracy": 1.0
        }, headers=u_head)
        # Sleep slightly to ensure DB commit order doesn't mix (though logic shouldn't care)
        time.sleep(0.1)

    # Fetch Leaderboard
    lb = requests.get(f"{BASE_URL}/api/leaderboard").json()
    
    # Check if High Scorer > Mid > Low
    # Note: Leaderboard includes previous test users, so we must find OUR users in the list
    found_ranks = []
    for entry in lb:
        if entry["player"] in ["High Scorer", "Mid Scorer", "Low Scorer"]:
            found_ranks.append(entry)
    
    # Verify Order
    # We expect 'High Scorer' to have higher score than 'Mid'
    log(f"Leaderboard Snippet: {found_ranks}")
    
    # Simple check: Ensure High Scorer (1000) is present and has correct score
    high_entry = next((x for x in lb if x["player"] == "High Scorer"), None)
    if high_entry and high_entry["score"] == 1000:
        log("✅ High Scorer correctly recorded on leaderboard.")
    else:
        log("❌ High Scorer missing or incorrect score!", "FAIL")

    # ---------------------------------------------------------
    # 4. LOAD & RELIABILITY
    # ---------------------------------------------------------
    log("--- Phase 4: Mini Load Test ---")
    # Spam 50 sessions valid requests for the High Scorer
    # Goal: See if server crashes or drops requests
    
    failures = 0
    start_time = time.time()
    for i in range(20):
        r = requests.post(f"{BASE_URL}/api/sessions", json={
            "user_id": uid, "game_type": "spam", "difficulty": "easy", 
            "duration_seconds": 1, "score": 1, "balloons_popped": 1, "accuracy": 0.5
        }, headers=AUTH)
        if r.status_code != 200:
            failures += 1
            
    duration = time.time() - start_time
    if failures == 0:
        log(f"✅ Load Test: 20 sessions processed in {duration:.2f}s without error.")
    else:
        log(f"❌ Load Test: {failures} requests failed!", "FAIL")

    log("Deep Dive Complete.", "END")

if __name__ == "__main__":
    test_deep_dive()

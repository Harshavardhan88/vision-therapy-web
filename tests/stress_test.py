import threading
import requests
import time
import random

BASE_URL = "http://localhost:8000"
NUM_USERS = 50
REQUESTS_PER_USER = 5
SUCCESS_COUNT = 0
ERROR_COUNT = 0
TOTAL_TIME = 0

def get_auth_token(role="patient"):
    email = f"stress_{role}_{random.randint(1, 100000)}@test.com"
    password = "password"
    try:
        # Create user
        requests.post(f"{BASE_URL}/users/", json={"full_name": "Stress User", "email": email, "password": password, "role": role})
        # Login
        resp = requests.post(f"{BASE_URL}/token", data={"username": email, "password": password})
        if resp.status_code == 200:
            return resp.json()["access_token"], resp.json().get("id") # NOTE: Token resp doesn't strictly have ID in standard OAuth, but let's see. 
            # Actually our endpoint adds "role". ID must be fetched from /users/me
    except:
        pass
    return None, None

def user_scenario(user_id):
    global SUCCESS_COUNT, ERROR_COUNT, TOTAL_TIME
    
    # Needs token
    token, _ = get_auth_token()
    if not token:
        # Just fail
        # ERROR_COUNT += 1 # Don't count setup failures
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # Fetch User ID properly
    me_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if me_resp.status_code != 200:
        return
    real_user_id = me_resp.json()["id"]

    for _ in range(REQUESTS_PER_USER):
        start = time.time()
        try:
            # Hit Stats
            r1 = requests.get(f"{BASE_URL}/api/stats/{real_user_id}", headers=headers)
            # Hit Sessions
            r2 = requests.get(f"{BASE_URL}/api/sessions/{real_user_id}", headers=headers)
            
            elapsed = time.time() - start
            TOTAL_TIME += elapsed
            
            if r1.status_code == 200 and r2.status_code == 200:
                SUCCESS_COUNT += 1
            else:
                ERROR_COUNT += 1
        except Exception as e:
            ERROR_COUNT += 1

def run_stress_test():
    print(f"--- Starting Stress Test ({NUM_USERS} Users) ---")
    threads = []
    start_time = time.time()
    
    for i in range(NUM_USERS):
        t = threading.Thread(target=user_scenario, args=(i,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    duration = time.time() - start_time
    print(f"--- Stress Test Completed in {duration:.2f}s ---")
    print(f"Total Requests: {SUCCESS_COUNT + ERROR_COUNT}")
    print(f"Success: {SUCCESS_COUNT}")
    print(f"Errors: {ERROR_COUNT}")
    if SUCCESS_COUNT > 0:
        print(f"Avg Latency: {(TOTAL_TIME / (SUCCESS_COUNT + ERROR_COUNT))*1000:.2f} ms")
    if duration > 0:
         print(f"RPS: {(SUCCESS_COUNT + ERROR_COUNT) / duration:.2f}")

if __name__ == "__main__":
    run_stress_test()

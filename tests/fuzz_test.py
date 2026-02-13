import requests
import random
import string

BASE_URL = "http://localhost:8000"

def get_random_string(length):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def run_fuzz_test():
    print("--- Starting API Fuzz Testing ---")
    
    endpoints = [
        ("POST", "/users/"),
        ("POST", "/token"),
        ("POST", "/api/sessions"),
        ("POST", "/api/doctor/notes")
    ]
    
    payloads = [
        {}, # Empty
        {"invalid_field": "data"}, # Wrong schema
        {"email": 12345}, # Wrong type
        {"email": "a" * 10000}, # Overflow
        "MALFORMED_JSON_STRING" # Not JSON
    ]
    
    errors = 0
    passed = 0
    
    for method, endpoint in endpoints:
        for payload in payloads:
            try:
                if payload == "MALFORMED_JSON_STRING":
                    resp = requests.request(method, f"{BASE_URL}{endpoint}", data=payload)
                else:
                    resp = requests.request(method, f"{BASE_URL}{endpoint}", json=payload)
                
                # We expect 400, 422, 401, 403, 404, 405.
                # We do NOT expect 500.
                if resp.status_code >= 500:
                    print(f"FAIL: {endpoint} returned {resp.status_code} with payload {str(payload)[:50]}...")
                    errors += 1
                else:
                    passed += 1
            except Exception as e:
                print(f"ERROR: Connection failed for {endpoint}: {e}")
                errors += 1

    print(f"--- Fuzz Test Complete ---")
    print(f"Passed (Handled Gracefully): {passed}")
    print(f"Server Errors (Crashing): {errors}")

if __name__ == "__main__":
    run_fuzz_test()

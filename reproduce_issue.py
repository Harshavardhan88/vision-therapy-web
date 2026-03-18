import sys
import os
import requests
import time

def check_api_login():
    print("=== API LOGIN CHECK ===")
    base_url = "http://localhost:8000"
    
    # 1. Check Health
    try:
        resp = requests.get(f"{base_url}/health", timeout=10)
        print(f"Health Check: {resp.status_code} {resp.json()}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Login as Doctor
    print("\n[Testing Doctor Login]")
    try:
        payload = {
            "username": "doctor@test.com",
            "password": "test123"
        }
        resp = requests.post(f"{base_url}/token", data=payload)
        
        if resp.status_code == 200:
            print("✅ Doctor Login SUCCESS")
            token = resp.json().get("access_token")
            print(f"   Token received (len={len(token)})")
        else:
            print(f"❌ Doctor Login FAILED: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"Error: {e}")

    # 3. Login as Patient
    print("\n[Testing Patient Login]")
    try:
        payload = {
            "username": "patient@test.com",
            "password": "test123"
        }
        resp = requests.post(f"{base_url}/token", data=payload)
        
        if resp.status_code == 200:
            print("✅ Patient Login SUCCESS")
            token = resp.json().get("access_token")
            print(f"   Token received (len={len(token)})")
        else:
            print(f"❌ Patient Login FAILED: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_api_login()

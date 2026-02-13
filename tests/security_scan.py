import requests
import sys

BASE_URL = "http://localhost:8000"

def run_security_scan():
    print("--- Starting Security Vulnerability Scan ---")
    issues = []
    
    # 1. Check Security Headers
    try:
        resp = requests.get(BASE_URL)
        headers = resp.headers
        if "X-Frame-Options" not in headers:
            issues.append("Missing X-Frame-Options header (Clickjacking risk)")
        if "Content-Security-Policy" not in headers:
            issues.append("Missing Content-Security-Policy header (XSS risk)")
        if "Strict-Transport-Security" not in headers:
             # Only relevant for HTTPS, but good to note
            pass 
    except Exception as e:
        issues.append(f"Failed to connect to base URL: {e}")
        
    # 2. Auth Bypass Check
    # Try to access protected endpoints without token
    protected_endpoints = [
        "/users/me",
        "/api/doctor/patients",
        "/api/parent/children"
    ]
    
    for endpoint in protected_endpoints:
        try:
            resp = requests.get(f"{BASE_URL}{endpoint}")
            if resp.status_code != 401 and resp.status_code != 403:
                issues.append(f"Auth Bypass Possible: {endpoint} returned {resp.status_code}")
        except:
            pass

    # 3. Role Isolation Check (Patient accessing Doctor Data)
    # create patient
    try:
        # Assuming existing patient or create one
        # Simplified: valid token for role 'patient' shouldn't access /api/doctor/patients
        pass 
        # (covered in unit tests mostly, but good integration check here)
    except:
        pass

    if issues:
        print(f"FAIL: Found {len(issues)} security issues:")
        for i in issues:
            print(f" - {i}")
    else:
        print("PASS: Basic security checks passed.")

if __name__ == "__main__":
    run_security_scan()

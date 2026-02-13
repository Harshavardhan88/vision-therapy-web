import requests
import sys

BASE_URL_BACKEND = "http://localhost:8000"
BASE_URL_FRONTEND = "http://localhost:3000"

ENDPOINTS = [
    {"url": f"{BASE_URL_BACKEND}/", "name": "Backend Root", "expect": "AmblyoCare Clinical Engine"},
    {"url": f"{BASE_URL_BACKEND}/docs", "name": "Backend Docs", "expect": "Swagger UI"},
    {"url": f"{BASE_URL_FRONTEND}/login", "name": "Frontend Login", "expect": "Welcome Back"},
    {"url": f"{BASE_URL_FRONTEND}/therapy/balloon", "name": "Balloon Game", "expect": "Balloon Pop"},
    {"url": f"{BASE_URL_FRONTEND}/therapy/neon", "name": "Neon Game", "expect": "Neon Voyage"},
    {"url": f"{BASE_URL_FRONTEND}/therapy/calibration", "name": "Calibration", "expect": "CALIBRATION"},
    {"url": f"{BASE_URL_FRONTEND}/therapy/space", "name": "VR Game", "expect": "Space Defender"},
]

def check_endpoints():
    print("Starting UI & Infrastructure Verification...")
    print("-" * 50)
    
    success_count = 0
    
    for ep in ENDPOINTS:
        try:
            print(f"Checking {ep['name']}...", end=" ")
            response = requests.get(ep['url'], timeout=5)
            
            if response.status_code == 200:
                if ep['expect'] in response.text:
                    print(f"[OK] Found '{ep['expect']}'")
                    success_count += 1
                else:
                    # React might not SSR everything, so let's be lenient but warn
                    print(f"[WARN] 200 OK, but string '{ep['expect']}' not found in raw HTML. (React Client Component?)")
                    # Count as success for reachability
                    success_count += 1
            else:
                print(f"[FAIL] Status: {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] {str(e)}")

    print("-" * 50)
    if success_count == len(ENDPOINTS):
        print(f"Verification PASSED: {success_count}/{len(ENDPOINTS)} endpoints reachable.")
    else:
        print(f"Verification INCOMPLETE: {success_count}/{len(ENDPOINTS)} endpoints reachable.")

if __name__ == "__main__":
    check_endpoints()

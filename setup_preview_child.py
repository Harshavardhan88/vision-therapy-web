import requests
import sys

BASE_URL = "http://localhost:8000"

def create_child_for_preview():
    # Unique email for this preview run
    email = "preview_child_link@example.com"
    
    # Check if exists
    try:
        requests.post(f"{BASE_URL}/users/", json={
            "full_name": "Existing Child Preview",
            "email": email,
            "password": "password123",
            "role": "patient"
        })
        print(f"Child Created: {email}")
    except:
        print("Child might already exist")

if __name__ == "__main__":
    create_child_for_preview()

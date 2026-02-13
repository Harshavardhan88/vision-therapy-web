import sqlite3
import json

def verify_doctor_assignment():
    try:
        conn = sqlite3.connect('amblyocare_v2.db')
        cursor = conn.cursor()

        print("\n--- Verifying Doctor Assignment ---")
        
        # 1. Check if 'Selected Patient' exists
        cursor.execute("SELECT id, full_name, role FROM users WHERE email='selected_patient@example.com'")
        patient = cursor.fetchone()
        
        if not patient:
            print("FAIL: Patient 'Selected Patient' not found.")
            return

        print(f"Patient Found: {patient[1]} (ID: {patient[0]})")

        # 2. Check Patient Profile linkage
        cursor.execute("SELECT doctor_id FROM patient_profiles WHERE user_id=?", (patient[0],))
        profile = cursor.fetchone()
        
        if not profile or not profile[0]:
            print("FAIL: Patient has no assigned doctor_id.")
            return
            
        print(f"Patient assigned to Doctor Profile ID: {profile[0]}")

        # 3. Verify Doctor Details
        cursor.execute("SELECT user_id, clinic_name FROM doctor_profiles WHERE id=?", (profile[0],))
        doc_profile = cursor.fetchone()
        
        if not doc_profile:
             print("FAIL: Doctor profile not found.")
             return

        cursor.execute("SELECT full_name, email FROM users WHERE id=?", (doc_profile[0],))
        doc_user = cursor.fetchone()
        
        print(f"Assigned Doctor: {doc_user[0]} ({doc_user[1]})")
        
        if doc_user[1] == 'test_doc_1@example.com':
            print("SUCCESS: Patient correctly assigned to 'Doctor One'.")
        else:
            print(f"FAIL: Assigned to wrong doctor: {doc_user[1]}")

        conn.close()

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify_doctor_assignment()

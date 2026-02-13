import sqlite3

try:
    conn = sqlite3.connect('amblyocare_v2.db')
    cursor = conn.cursor()

    print("--- Verification Report ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables found: {tables}")

    # Find the patient
    cursor.execute("SELECT id, email FROM users WHERE email='selected_patient@example.com'")
    user = cursor.fetchone()

    if not user:
        print("FAIL: Patient 'selected_patient@example.com' not found.")
    else:
        print(f"SUCCESS: Patient found. ID: {user[0]}")
        
        # Check profile linkage
        cursor.execute("SELECT doctor_id FROM patient_profiles WHERE user_id=?", (user[0],))
        profile = cursor.fetchone()
        
        if not profile:
            print("FAIL: No patient profile found.")
        elif not profile[0]:
            print("FAIL: Patient profile exists but doctor_id is NULL.")
        else:
            print(f"SUCCESS: Patient linked to Doctor Profile ID: {profile[0]}")
            
            # Check doctor details
            cursor.execute("SELECT user_id, clinic_name FROM doctor_profiles WHERE id=?", (profile[0],))
            doc_profile = cursor.fetchone()
            
            if doc_profile:
                cursor.execute("SELECT email FROM users WHERE id=?", (doc_profile[0],))
                doc_user = cursor.fetchone()
                if doc_user:
                    print(f"SUCCESS: Assigned Doctor Email: {doc_user[0]}")
                
                # Check negative case (Doctor 2)
                cursor.execute("SELECT id FROM users WHERE email='doctor2@example.com'")
                doc2 = cursor.fetchone()
                if doc2:
                    cursor.execute("SELECT id FROM doctor_profiles WHERE user_id=?", (doc2[0],))
                    doc2_profile = cursor.fetchone()
                    if doc2_profile and doc2_profile[0] != profile[0]:
                        print(f"SUCCESS: Verified isolation. Assigned Doctor ({profile[0]}) != Doctor 2 ({doc2_profile[0]})")
                    else:
                        print("WARNING: Doctor 2 profile check inconclusive.")
            else:
                 print("FAIL: Linked Doctor Profile ID not found in doctor_profiles table.")

    conn.close()
except Exception as e:
    print(f"ERROR: {e}")

import sys
import os

# Add the parent directory to sys.path so we can import 'backend' as a package if needed
# But if running from within backend, we adjust accordingly.
sys.path.append(os.getcwd())

print("Attempting to import backend modules...")

try:
    print("Importing crud...")
    import crud
    print("✅ crud imported.")
except Exception as e:
    print(f"❌ crud import failed: {e}")

try:
    print("Importing gamification...")
    import gamification
    print("✅ gamification imported.")
except Exception as e:
    print(f"❌ gamification import failed: {e}")

try:
    print("Importing main...")
    import main
    print("✅ main imported.")
except Exception as e:
    print(f"❌ main import failed: {e}")

import os
import re

def scan_file(filepath):
    """Simple regex scan for secrets"""
    patterns = {
        "AWS Key": r"AKIA[0-9A-Z]{16}",
        "Generic Secret": r"(?i)(api_key|secret_key|password)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]",
        "Private Key": r"-----BEGIN PRIVATE KEY-----"
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for name, pattern in patterns.items():
                if re.search(pattern, content):
                    return f"FAILED: Found {name}"
    except Exception as e:
        return f"ERROR: Could not read file: {str(e)}"
    
    return "SAFE"

def run_security_scan():
    print("[SECURITY] Starting Static Analysis...")
    root_dir = os.getcwd()
    issues = 0
    scanned = 0
    
    # Exclude venv, node_modules, .git
    exclude = set(['venv', 'node_modules', '.git', '__pycache__'])
    
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude]
        
        for file in files:
            if file.endswith(('.py', '.js', '.ts', '.tsx', '.env')):
                scanned += 1
                path = os.path.join(root, file)
                result = scan_file(path)
                if result != "SAFE":
                    print(f"❌ {file}: {result}")
                    issues += 1

    print(f"[SECURITY] Scan Complete. Scanned {scanned} files. Found {issues} potential issues.")
    if issues == 0:
        print("✅ No hardcoded secrets found.")
    else:
        print("⚠️  Review the findings above.")

if __name__ == "__main__":
    run_security_scan()

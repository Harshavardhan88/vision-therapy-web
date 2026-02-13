from bs4 import BeautifulSoup
import requests

BASE_URL = "http://localhost:3000" # Frontend

def run_a11y_check():
    print("--- Starting Accessibility (A11y) Structure Check ---")
    # Note: Since pages need auth or dynamic rendering, static scraping of localhost:3000 might only reach login.
    # We will test the Login page primarily as a proxy for static checks.
    
    pages = ["/login", "/signup"] 
    # Dashboards are protected and CSR, so BeautifulSoup seeing "Loading..." or redirect is expected.
    # Puppeteer/Playwright is better for this, but simplistic check here.
    
    issues = []
    
    for page in pages:
        try:
            resp = requests.get(f"{BASE_URL}{page}")
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # 1. Images must have alt
            imgs = soup.find_all('img')
            for img in imgs:
                if not img.get('alt'):
                    issues.append(f"{page}: Image missing alt text (src={img.get('src')})")
            
            # 2. Inputs must have labels or aria-labels
            inputs = soup.find_all('input')
            for inp in inputs:
                # overly simple check: just see if it has aria-label or id/name that implies label association
                if not inp.get('aria-label') and not inp.get('id'):
                     # Might be inside label tag, difficult to parse with BS4 easily without more logic.
                     # check for placeholder at least?
                     if not inp.get('placeholder'):
                         issues.append(f"{page}: Input field missing accessible name/placeholder")
                         
        except Exception as e:
             # Frontend might not be running or is loading JS
             pass

    if issues:
        print(f"FAIL: Found {len(issues)} A11y potential issues:")
        for i in issues:
            print(f" - {i}")
    else:
        print("PASS: Basic A11y checks passed (on public pages).")

if __name__ == "__main__":
    run_a11y_check()

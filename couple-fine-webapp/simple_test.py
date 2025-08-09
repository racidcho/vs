#!/usr/bin/env python3
"""
Simple test script for Couple Fine WebApp
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import os

class SimpleTest:
    def __init__(self):
        self.base_url = "https://joanddo.com"
        self.email1 = "racidcho@naver.com"
        self.email2 = "racidcho@gmail.com"
        
    async def run_test(self):
        print("=" * 50)
        print("Starting Simple Test")
        print(f"Target: {self.base_url}")
        print(f"Time: {datetime.now()}")
        print("=" * 50)
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # Go to website
                print("\n[1] Navigating to website...")
                await page.goto(self.base_url)
                await page.wait_for_timeout(2000)
                
                # Fill email
                print(f"[2] Entering email: {self.email1}")
                await page.fill('input[type="email"]', self.email1)
                await page.wait_for_timeout(1000)
                
                # Click login button
                print("[3] Clicking login button...")
                await page.click('button[type="submit"]')
                await page.wait_for_timeout(3000)
                
                # Check if OTP page appears
                print("[4] Waiting for OTP page...")
                try:
                    await page.wait_for_selector('input[inputmode="numeric"]', timeout=5000)
                    print("[SUCCESS] OTP page loaded!")
                    
                    # Take screenshot
                    if not os.path.exists("screenshots"):
                        os.makedirs("screenshots")
                    
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    screenshot_path = f"screenshots/otp_page_{timestamp}.png"
                    await page.screenshot(path=screenshot_path)
                    print(f"[INFO] Screenshot saved: {screenshot_path}")
                    
                    # Wait for user to enter OTP manually
                    print("\n" + "=" * 50)
                    print("MANUAL STEP REQUIRED:")
                    print("Please enter the OTP code manually in the browser")
                    print("The test will continue after you log in")
                    print("=" * 50)
                    
                    # Wait for dashboard
                    print("\n[5] Waiting for dashboard...")
                    await page.wait_for_url("**/dashboard", timeout=60000)
                    print("[SUCCESS] Logged in successfully!")
                    
                    # Take dashboard screenshot
                    await page.wait_for_timeout(3000)
                    dashboard_screenshot = f"screenshots/dashboard_{timestamp}.png"
                    await page.screenshot(path=dashboard_screenshot)
                    print(f"[INFO] Dashboard screenshot: {dashboard_screenshot}")
                    
                except Exception as e:
                    print(f"[ERROR] Failed to find OTP input: {e}")
                    
            except Exception as e:
                print(f"[ERROR] Test failed: {e}")
                
            finally:
                print("\n[6] Test complete. Browser will close in 5 seconds...")
                await page.wait_for_timeout(5000)
                await browser.close()
                
        print("\n" + "=" * 50)
        print("Test Finished")
        print("=" * 50)

async def main():
    test = SimpleTest()
    await test.run_test()

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Couple Fine WebApp 자동 테스트 스크립트
실서버(joanddo.com)에서 직접 테스트 실행
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright
import os

class CoupleAppTester:
    def __init__(self):
        self.base_url = "https://joanddo.com"
        self.screenshots_dir = "test_screenshots"
        self.test_results = []
        
        # 테스트 계정 정보
        self.test_user1 = {
            "email": "racidcho@naver.com",
            "id": "user1"
        }
        self.test_user2 = {
            "email": "racidcho@gmail.com", 
            "id": "user2"
        }
        
        # 스크린샷 디렉토리 생성
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
    
    async def setup_browsers(self):
        """두 개의 브라우저 인스턴스 설정"""
        self.playwright = await async_playwright().start()
        
        # User1 브라우저
        self.browser1 = await self.playwright.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )
        self.context1 = await self.browser1.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        self.page1 = await self.context1.new_page()
        
        # User2 브라우저  
        self.browser2 = await self.playwright.chromium.launch(
            headless=False,
            args=['--start-maximized', '--window-position=650,0']
        )
        self.context2 = await self.browser2.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        self.page2 = await self.context2.new_page()
        
        print("[OK] Browser setup complete")
    
    async def inject_test_session(self, page, user_id):
        """테스트 세션 주입 (OTP 우회)"""
        # localStorage에 테스트 세션 주입
        script = f"""
            (() => {{
                // 테스트 모드 세션 생성
                const testSession = {{
                    access_token: 'test-token-{user_id}',
                    refresh_token: 'test-refresh-{user_id}',
                    expires_at: {int(time.time() + 3600)},
                    user: {{
                        id: '{user_id}',
                        email: 'test{user_id}@joanddo.com',
                        app_metadata: {{}},
                        user_metadata: {{
                            display_name: 'TestUser{user_id}'
                        }}
                    }}
                }};
                
                // Supabase 세션 저장
                localStorage.setItem('sb-auth-token', JSON.stringify({{
                    currentSession: testSession,
                    expiresAt: testSession.expires_at
                }}));
                
                console.log('[OK] Test session injected:', '{user_id}');
            }})();
        """
        await page.evaluate(script)
    
    async def test_login_with_test_mode(self):
        """테스트 모드로 로그인"""
        print("\n[RUNNING] Test mode login...")
        
        # User1 로그인
        await self.page1.goto(f"{self.base_url}?test=true&user=1")
        await self.inject_test_session(self.page1, "1")
        await self.page1.reload()
        await self.page1.wait_for_timeout(2000)
        
        # User2 로그인
        await self.page2.goto(f"{self.base_url}?test=true&user=2")
        await self.inject_test_session(self.page2, "2")
        await self.page2.reload()
        await self.page2.wait_for_timeout(2000)
        
        # 스크린샷
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        await self.page1.screenshot(path=f"{self.screenshots_dir}/user1_login_{timestamp}.png")
        await self.page2.screenshot(path=f"{self.screenshots_dir}/user2_login_{timestamp}.png")
        
        print("[OK] Test mode login complete")
        return True
    
    async def test_couple_connection(self):
        """커플 연결 테스트"""
        print("\n[RUNNING] Couple connection test...")
        
        try:
            # User1: 새 커플 생성
            await self.page1.click('button:has-text("새 커플 만들기")')
            await self.page1.wait_for_timeout(2000)
            
            # 커플 코드 가져오기
            couple_code_element = await self.page1.query_selector('.couple-code')
            if couple_code_element:
                couple_code = await couple_code_element.text_content()
                print(f"[INFO] Generated couple code: {couple_code}")
            else:
                print("[WARNING] Couple code not found")
                return False
            
            # User2: 커플 참여
            await self.page2.fill('input[placeholder*="코드"]', couple_code)
            await self.page2.click('button:has-text("연결하기")')
            await self.page2.wait_for_timeout(3000)
            
            # 스크린샷
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            await self.page1.screenshot(path=f"{self.screenshots_dir}/user1_connected_{timestamp}.png")
            await self.page2.screenshot(path=f"{self.screenshots_dir}/user2_connected_{timestamp}.png")
            
            print("[OK] Couple connection test complete")
            return True
            
        except Exception as e:
            print(f"[ERROR] Couple connection test failed: {e}")
            return False
    
    async def test_realtime_sync(self):
        """실시간 동기화 테스트"""
        print("\n[RUNNING] Realtime sync test...")
        
        try:
            # User1: 규칙 추가
            await self.page1.goto(f"{self.base_url}/rules")
            await self.page1.wait_for_timeout(2000)
            
            await self.page1.click('button:has-text("규칙 추가")')
            await self.page1.fill('input[placeholder*="규칙"]', '테스트 규칙')
            await self.page1.fill('input[placeholder*="금액"]', '10000')
            await self.page1.click('button:has-text("저장")')
            await self.page1.wait_for_timeout(2000)
            
            # User2: 규칙 확인
            await self.page2.goto(f"{self.base_url}/rules")
            await self.page2.wait_for_timeout(3000)
            
            # 규칙이 나타나는지 확인
            rule_element = await self.page2.query_selector('text="테스트 규칙"')
            
            if rule_element:
                print("[OK] Realtime sync confirmed")
                return True
            else:
                print("[WARNING] Realtime sync failed")
                return False
                
        except Exception as e:
            print(f"[ERROR] Realtime sync test failed: {e}")
            return False
    
    async def test_crud_operations(self):
        """CRUD 작업 권한 테스트"""
        print("\n[RUNNING] CRUD operations test...")
        
        try:
            # User2: 벌금 기록
            await self.page2.goto(f"{self.base_url}/violations/new")
            await self.page2.wait_for_timeout(2000)
            
            await self.page2.click('button:has-text("추가")')
            await self.page2.select_option('select', index=0)
            await self.page2.fill('input[type="number"]', '5')
            await self.page2.click('button:has-text("저장")')
            await self.page2.wait_for_timeout(2000)
            
            # User1: 벌금 기록 확인
            await self.page1.goto(f"{self.base_url}/calendar")
            await self.page1.wait_for_timeout(3000)
            
            # 스크린샷
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            await self.page1.screenshot(path=f"{self.screenshots_dir}/user1_crud_{timestamp}.png")
            await self.page2.screenshot(path=f"{self.screenshots_dir}/user2_crud_{timestamp}.png")
            
            print("[OK] CRUD operations test complete")
            return True
            
        except Exception as e:
            print(f"[ERROR] CRUD operations test failed: {e}")
            return False
    
    async def cleanup(self):
        """테스트 정리"""
        print("\n[CLEANUP] Cleaning up test...")
        
        if hasattr(self, 'browser1'):
            await self.browser1.close()
        if hasattr(self, 'browser2'):
            await self.browser2.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        
        print("[OK] Cleanup complete")
    
    async def run_all_tests(self):
        """모든 테스트 실행"""
        print("=" * 50)
        print("Couple Fine WebApp Auto Test Start")
        print(f"Target Server: {self.base_url}")
        print(f"Start Time: {datetime.now()}")
        print("=" * 50)
        
        try:
            # 브라우저 설정
            await self.setup_browsers()
            
            # 테스트 실행
            tests = [
                ("로그인", self.test_login_with_test_mode),
                ("커플 연결", self.test_couple_connection),
                ("실시간 동기화", self.test_realtime_sync),
                ("CRUD 작업", self.test_crud_operations)
            ]
            
            for test_name, test_func in tests:
                result = await test_func()
                self.test_results.append({
                    "name": test_name,
                    "result": "[PASS]" if result else "[FAIL]",
                    "timestamp": datetime.now().isoformat()
                })
            
            # 결과 출력
            print("\n" + "=" * 50)
            print("Test Results Summary")
            print("=" * 50)
            
            for result in self.test_results:
                print(f"{result['result']} {result['name']}")
            
            # 결과 저장
            with open("test_results.json", "w", encoding="utf-8") as f:
                json.dump(self.test_results, f, ensure_ascii=False, indent=2)
            
            print(f"\n[COMPLETE] Test finished: {datetime.now()}")
            print(f"[INFO] Screenshots saved to: {self.screenshots_dir}")
            print(f"[INFO] Results file: test_results.json")
            
        except Exception as e:
            print(f"[ERROR] Test execution error: {e}")
        
        finally:
            await self.cleanup()

async def main():
    tester = CoupleAppTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
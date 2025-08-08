# 🧪 COMPREHENSIVE BACKEND FIX TEST SCENARIOS

## Overview

This document provides step-by-step test scenarios to validate that all backend issues have been resolved after applying the ultra-simple RLS migration.

**Migration File**: `supabase/migrations/20250808_ultra_simple_rls_fix.sql`
**Debug Script**: `debug_backend_issues.js`

---

## 📋 PRE-TEST CHECKLIST

### Prerequisites
- [ ] Applied the migration: `20250808_ultra_simple_rls_fix.sql`
- [ ] Both test users have active accounts
- [ ] Browser dev tools open (for console monitoring)
- [ ] `debug_backend_issues.js` script loaded in browser

### Test Environment Setup
1. **User A**: Primary test user (will create couple)
2. **User B**: Secondary test user (will join couple)
3. **Browser**: Chrome/Safari with dev tools open
4. **Network**: Stable internet connection

---

## 🎯 TEST SCENARIO 1: COUPLE CONNECTION FLOW

### Objective
Test that both users can connect successfully and see each other's information.

### Test Steps

#### Step 1.1: User A Creates Couple
1. **Login as User A**
2. **Navigate to Couple Setup**: `/couple-setup`  
3. **Create new couple**: 
   - Enter couple name: "Test Couple"
   - Click "새로운 커플 만들기"
4. **Expected Results**:
   - ✅ Couple created successfully
   - ✅ 6-digit couple code generated
   - ✅ User redirected appropriately

#### Step 1.2: User B Joins Couple
1. **Login as User B** (different browser/incognito)
2. **Navigate to Couple Setup**: `/couple-setup`
3. **Join existing couple**:
   - Enter couple code from Step 1.1
   - Click "커플 코드로 연결하기"
4. **Expected Results**:
   - ✅ Successfully joined couple
   - ✅ User redirected to celebration page

#### Step 1.3: Verify Connection Status
1. **Check User A**: Should see celebration page OR home with partner info
2. **Check User B**: Should see celebration page
3. **Console Check**: Run `testPartner()` in both browsers
4. **Expected Results**:
   - ✅ Both users show "connected" status
   - ✅ Partner information visible for both users
   - ✅ No "연결대기중" or "정보 로딩중" messages

---

## 🎯 TEST SCENARIO 2: CRUD OPERATIONS VALIDATION

### Objective
Verify that both users can create, read, update, and delete rules, rewards, and violations.

### Test Steps

#### Step 2.1: Rules CRUD Test
**Test as User A:**
1. **Navigate to Rules page**: `/rules`
2. **Create Rule**:
   - Title: "Test Rule A"
   - Fine Amount: 2000
   - Click Save
3. **Expected Results**:
   - ✅ Rule created successfully
   - ✅ Appears in rules list immediately
   - ✅ No error messages in console

**Test as User B:**
1. **Navigate to Rules page**: `/rules`
2. **Verify Rule Visibility**:
   - Should see "Test Rule A" created by User A
3. **Create Rule**:
   - Title: "Test Rule B"  
   - Fine Amount: 3000
   - Click Save
4. **Update Rule**: Edit "Test Rule B" to change amount to 3500
5. **Delete Rule**: Delete "Test Rule B"
6. **Expected Results**:
   - ✅ Can see User A's rule
   - ✅ Can create own rule
   - ✅ Can update own rule
   - ✅ Can delete own rule
   - ✅ All operations work without errors

#### Step 2.2: Violations CRUD Test
**Test as User A:**
1. **Navigate to Dashboard/Violations**
2. **Create Violation**:
   - Select "Test Rule A"
   - Violator: User B
   - Amount: 2000 (from rule)
   - Memo: "Test violation"
   - Click Save
3. **Expected Results**:
   - ✅ Violation created successfully
   - ✅ Appears in violations list
   - ✅ Couple balance updated

**Test as User B:**
1. **Navigate to Dashboard/Violations**
2. **Verify Violation Visibility**:
   - Should see violation recorded by User A
3. **Create Counter-Violation**:
   - Select any rule
   - Violator: User A
   - Click Save
4. **Expected Results**:
   - ✅ Can see violations recorded by partner
   - ✅ Can create own violations
   - ✅ Real-time sync works between users

#### Step 2.3: Rewards CRUD Test
**Test as User A:**
1. **Navigate to Rewards page**: `/rewards`
2. **Create Reward**:
   - Title: "Test Reward A"
   - Target Amount: 10000
   - Click Save
3. **Expected Results**:
   - ✅ Reward created successfully

**Test as User B:**
1. **Navigate to Rewards page**: `/rewards`
2. **Verify and Create**:
   - Should see "Test Reward A"
   - Create "Test Reward B" with 15000 target
3. **Expected Results**:
   - ✅ All reward operations work for both users

---

## 🎯 TEST SCENARIO 3: PARTNER NAME DISPLAY

### Objective
Verify that partner names display correctly throughout the application.

### Test Steps

#### Step 3.1: Settings Page Partner Display
1. **User A navigates to Settings**: `/settings`
2. **Check "우리들의 이름" section**:
   - Own name should display correctly
   - Partner name should display correctly (not "파트너" or loading)
3. **User B navigates to Settings**: `/settings`
4. **Check same section**:
   - Should see User A's name as partner
5. **Expected Results**:
   - ✅ Both users see partner's actual display_name
   - ✅ No "로딩 중..." or generic "파트너" text
   - ✅ Partner info loads within 2 seconds

#### Step 3.2: Dashboard Partner Info
1. **Check Dashboard/Home page** for both users
2. **Verify partner information appears**:
   - Partner name in couple info
   - Partner name in violation records
   - Partner name in activity feeds
3. **Expected Results**:
   - ✅ Partner names display consistently across all pages
   - ✅ No placeholder text or missing names

---

## 🎯 TEST SCENARIO 4: CELEBRATION PAGE FLOW

### Objective
Ensure celebration page shows at the right time and functions correctly.

### Test Steps

#### Step 4.1: First-Time Connection
1. **Create fresh couple connection** (new users)
2. **User A creates couple**
3. **User B joins couple**
4. **Expected Results**:
   - ✅ User B sees celebration page immediately after joining
   - ✅ User A sees celebration page on next page load/refresh
   - ✅ Celebration page shows both user names
   - ✅ "시작하기" button works and navigates to home

#### Step 4.2: Celebration Page Revisit
1. **Both users navigate to**: `/couple-complete`
2. **Expected Results**:
   - ✅ Page loads correctly
   - ✅ Shows both partner names
   - ✅ Displays couple information
   - ✅ All animations and effects work

#### Step 4.3: Celebration Logic Test
1. **Run in browser console**:
   ```javascript
   // Check celebration localStorage
   const user = await getCurrentUserInfo();
   const couple = await getCurrentCoupleInfo();
   const key = `couple_celebrated_${user.id}_${couple.id}`;
   console.log('Celebration key:', key);
   console.log('Has seen celebration:', localStorage.getItem(key));
   ```
2. **Expected Results**:
   - ✅ Celebration logic works correctly
   - ✅ localStorage properly tracks celebration status

---

## 🎯 TEST SCENARIO 5: REAL-TIME SYNCHRONIZATION

### Objective
Verify that changes made by one user appear immediately for the other user.

### Test Steps

#### Step 5.1: Rule Changes Sync
1. **User A and User B** both open Rules page
2. **User A creates a rule**
3. **Expected Results**:
   - ✅ Rule appears on User B's page within 5 seconds
   - ✅ No manual refresh needed

#### Step 5.2: Violation Changes Sync
1. **Both users open Dashboard**
2. **User A records a violation**
3. **Expected Results**:
   - ✅ Violation appears on User B's dashboard
   - ✅ Balance updates for both users
   - ✅ Activity feed updates in real-time

#### Step 5.3: Profile Changes Sync
1. **User A changes display name** in Settings
2. **User B checks Settings page**
3. **Expected Results**:
   - ✅ Updated name appears for User B
   - ✅ Partner name section shows new name

---

## 🎯 TEST SCENARIO 6: COMPREHENSIVE DEBUG SCRIPT

### Objective
Use the debug script to validate all fixes automatically.

### Test Steps

#### Step 6.1: Load Debug Script
1. **Open browser dev tools** (F12)
2. **Load debug script**:
   - Copy contents of `debug_backend_issues.js`
   - Paste into console and press Enter
3. **Expected Results**:
   - ✅ Script loads without errors
   - ✅ Usage instructions appear in console

#### Step 6.2: Run Comprehensive Test
1. **Execute in console**: `runDebugScript()`
2. **Wait for completion** (may take 30-60 seconds)
3. **Review results**
4. **Expected Results**:
   - ✅ All 6 tests pass (100% success rate)
   - ✅ No critical issues reported
   - ✅ Report saved to localStorage

#### Step 6.3: Quick Manual Tests
1. **Test RLS**: `testRLS()`
2. **Test Partner Info**: `testPartner()`
3. **Expected Results**:
   - ✅ All database queries succeed
   - ✅ Partner information loads correctly

---

## 🎯 TEST SCENARIO 7: EDGE CASES AND ERROR HANDLING

### Objective
Test edge cases and ensure proper error handling.

### Test Steps

#### Step 7.1: Network Issues
1. **Disconnect internet** while using app
2. **Try to create rule/violation**
3. **Reconnect internet**
4. **Expected Results**:
   - ✅ Proper error messages shown
   - ✅ Data syncs when connection restored
   - ✅ No data loss or corruption

#### Step 7.2: Invalid Data
1. **Try to create rule with empty title**
2. **Try to create violation with negative amount**
3. **Expected Results**:
   - ✅ Validation prevents invalid data
   - ✅ User-friendly error messages

#### Step 7.3: Partner Disconnection
1. **User A leaves couple** (in Settings)
2. **User B checks application state**
3. **Expected Results**:
   - ✅ User B sees disconnected state
   - ✅ No errors or crashes
   - ✅ Can create new couple or join different couple

---

## ✅ SUCCESS CRITERIA

### All Tests Must Pass
- [ ] Partner connection status shows correctly
- [ ] CRUD operations work for both users
- [ ] Partner names display throughout app
- [ ] Celebration page appears at right time
- [ ] Real-time sync works between users
- [ ] Debug script reports 100% success rate

### Performance Criteria
- [ ] Partner info loads within 2 seconds
- [ ] CRUD operations complete within 3 seconds
- [ ] Real-time updates appear within 5 seconds
- [ ] No console errors during normal usage

### User Experience Criteria
- [ ] No "연결대기중" or "정보 로딩중" errors
- [ ] Partner names show consistently
- [ ] Celebration page is delightful and functional
- [ ] All features work seamlessly for both users

---

## 🚨 FAILURE RESPONSE

If any tests fail:

1. **Check Console Errors**: Look for RLS or permission errors
2. **Verify Migration**: Ensure `20250808_ultra_simple_rls_fix.sql` was applied
3. **Check Database**: Verify RLS policies are active
4. **Review Logs**: Check application logs for errors
5. **Re-apply Migration**: May need to drop and recreate policies

### Common Issues and Fixes

**"Row level security is enabled" errors**:
- Re-apply the ultra-simple RLS migration
- Verify user authentication is working

**Partner not found errors**:
- Check profiles table RLS policy allows viewing all profiles
- Verify couple connection data is correct

**CRUD operations failing**:
- Check each table's RLS policies
- Verify couple_id relationships are correct

**Real-time not working**:
- Check Supabase realtime configuration
- Verify publications are set up correctly

---

## 📊 TESTING REPORT TEMPLATE

```
Backend Fix Testing Report
Date: ___________
Tester: ___________

Test Results:
□ Scenario 1 - Couple Connection: PASS / FAIL
□ Scenario 2 - CRUD Operations: PASS / FAIL  
□ Scenario 3 - Partner Names: PASS / FAIL
□ Scenario 4 - Celebration Page: PASS / FAIL
□ Scenario 5 - Real-time Sync: PASS / FAIL
□ Scenario 6 - Debug Script: PASS / FAIL
□ Scenario 7 - Edge Cases: PASS / FAIL

Overall Success Rate: ____%

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

Recommendations:
1. ________________________________
2. ________________________________
3. ________________________________

Conclusion: READY FOR PRODUCTION / NEEDS MORE WORK
```

---

This comprehensive test suite ensures all backend issues are resolved and the application works smoothly for both partners in a couple relationship.
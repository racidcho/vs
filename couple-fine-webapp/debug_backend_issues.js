/**
 * 🔍 COMPREHENSIVE BACKEND DEBUGGING SCRIPT
 * Purpose: Test and validate all backend fixes for couple-fine-webapp
 * Usage: Run in browser console on couple-fine-webapp
 * Date: 2025-08-08
 */

// 🎯 MAIN DEBUGGING FUNCTION
async function debugBackendIssues() {
  console.log('🚀 STARTING COMPREHENSIVE BACKEND DEBUG');
  console.log('=====================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    user: null,
    couple: null,
    partner: null,
    tests: {},
    issues: [],
    fixes: []
  };
  
  try {
    // Get current app context
    const user = await getCurrentUserInfo();
    const couple = await getCurrentCoupleInfo();
    const partner = await getPartnerInfo();
    
    results.user = user;
    results.couple = couple;
    results.partner = partner;
    
    console.log('👤 Current User:', user);
    console.log('💑 Current Couple:', couple);
    console.log('👫 Partner Info:', partner);
    
    // Run all tests
    results.tests = {
      partnerConnectionStatus: await testPartnerConnectionStatus(user, couple, partner),
      crudOperations: await testCrudOperations(user, couple),
      partnerNameDisplay: await testPartnerNameDisplay(user, couple, partner),
      celebrationPage: await testCelebrationPage(user, couple),
      homeScreenInfo: await testHomeScreenInfo(user, couple),
      realtimeSync: await testRealtimeSync(user, couple)
    };
    
    // Analyze results
    analyzeResults(results);
    
    // Generate report
    generateReport(results);
    
    return results;
    
  } catch (error) {
    console.error('💥 DEBUG ERROR:', error);
    results.issues.push({
      category: 'debug_script',
      issue: 'Debug script failed to execute',
      error: error.message,
      severity: 'critical'
    });
    return results;
  }
}

// 📊 GET CURRENT USER INFO
async function getCurrentUserInfo() {
  try {
    console.log('🔍 Getting current user info...');
    
    // Try to get user from app context
    if (window.app && window.app.user) {
      return window.app.user;
    }
    
    // Try to get from auth context
    if (window.supabase) {
      const { data: { user }, error } = await window.supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        const { data: profile, error: profileError } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        return profile || user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get user info:', error);
    return null;
  }
}

// 💑 GET CURRENT COUPLE INFO  
async function getCurrentCoupleInfo() {
  try {
    console.log('🔍 Getting current couple info...');
    
    // Try from app state first
    if (window.app && window.app.state && window.app.state.couple) {
      return window.app.state.couple;
    }
    
    // Try from database
    const user = await getCurrentUserInfo();
    if (user && user.couple_id && window.supabase) {
      const { data: couple, error } = await window.supabase
        .from('couples')
        .select(`
          *,
          partner_1:profiles!couples_partner_1_id_fkey(*),
          partner_2:profiles!couples_partner_2_id_fkey(*)
        `)
        .eq('id', user.couple_id)
        .single();
      
      if (error) {
        console.error('❌ Couple query error:', error);
        return null;
      }
      
      return couple;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get couple info:', error);
    return null;
  }
}

// 👫 GET PARTNER INFO
async function getPartnerInfo() {
  try {
    console.log('🔍 Getting partner info...');
    
    const user = await getCurrentUserInfo();
    const couple = await getCurrentCoupleInfo();
    
    if (!user || !couple) {
      return null;
    }
    
    // Determine partner ID
    let partnerId = null;
    if (couple.partner_1_id === user.id) {
      partnerId = couple.partner_2_id;
    } else if (couple.partner_2_id === user.id) {
      partnerId = couple.partner_1_id;
    }
    
    if (!partnerId) {
      return null;
    }
    
    // Try to get partner from couple data first
    const partnerFromCouple = couple.partner_1_id === partnerId ? couple.partner_1 : couple.partner_2;
    if (partnerFromCouple && partnerFromCouple.display_name) {
      return partnerFromCouple;
    }
    
    // Query partner directly
    if (window.supabase) {
      const { data: partner, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (error) {
        console.error('❌ Partner query error:', error);
        return null;
      }
      
      return partner;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get partner info:', error);
    return null;
  }
}

// 🧪 TEST 1: PARTNER CONNECTION STATUS
async function testPartnerConnectionStatus(user, couple, partner) {
  console.log('🧪 TEST 1: Partner Connection Status');
  
  const test = {
    name: 'Partner Connection Status',
    passed: false,
    issues: [],
    details: {}
  };
  
  try {
    // Check if user has couple
    if (!user || !user.couple_id) {
      test.issues.push('User has no couple_id');
      return test;
    }
    
    // Check if couple exists
    if (!couple) {
      test.issues.push('Couple data not found');
      return test;
    }
    
    // Check partner connection
    const hasPartner1 = !!couple.partner_1_id;
    const hasPartner2 = !!couple.partner_2_id;
    const isComplete = hasPartner1 && hasPartner2;
    
    test.details = {
      userCoupleId: user.couple_id,
      coupleId: couple.id,
      partner1Id: couple.partner_1_id,
      partner2Id: couple.partner_2_id,
      hasPartner1,
      hasPartner2,
      isComplete,
      partnerFound: !!partner,
      partnerName: partner?.display_name,
      userIsPartner1: user.id === couple.partner_1_id,
      userIsPartner2: user.id === couple.partner_2_id
    };
    
    // Determine status
    if (isComplete && partner) {
      test.passed = true;
      test.status = 'connected';
    } else if (isComplete && !partner) {
      test.issues.push('Couple complete but partner info missing');
      test.status = 'data_issue';
    } else {
      test.issues.push('Couple not complete');
      test.status = 'waiting';
    }
    
  } catch (error) {
    test.issues.push(`Error: ${error.message}`);
  }
  
  console.log('📊 Partner Connection Status Test:', test);
  return test;
}

// 🧪 TEST 2: CRUD OPERATIONS
async function testCrudOperations(user, couple) {
  console.log('🧪 TEST 2: CRUD Operations');
  
  const test = {
    name: 'CRUD Operations',
    passed: false,
    issues: [],
    details: {
      rules: { create: false, read: false, update: false, delete: false },
      rewards: { create: false, read: false, update: false, delete: false },
      violations: { create: false, read: false, update: false, delete: false }
    }
  };
  
  if (!user || !couple || !window.supabase) {
    test.issues.push('Missing user, couple, or supabase instance');
    return test;
  }
  
  try {
    // Test Rules CRUD
    console.log('Testing Rules CRUD...');
    
    // CREATE rule
    const { data: newRule, error: createRuleError } = await window.supabase
      .from('rules')
      .insert({
        couple_id: couple.id,
        title: 'Test Rule - DEBUG',
        description: 'Created by debug script',
        fine_amount: 1000,
        created_by_user_id: user.id,
        is_active: true
      })
      .select()
      .single();
    
    if (createRuleError) {
      test.issues.push(`Rule CREATE failed: ${createRuleError.message}`);
      console.error('❌ Rule CREATE error:', createRuleError);
    } else {
      test.details.rules.create = true;
      console.log('✅ Rule CREATE success:', newRule);
    }
    
    // READ rules
    const { data: rules, error: readRulesError } = await window.supabase
      .from('rules')
      .select('*')
      .eq('couple_id', couple.id);
    
    if (readRulesError) {
      test.issues.push(`Rule READ failed: ${readRulesError.message}`);
      console.error('❌ Rule READ error:', readRulesError);
    } else {
      test.details.rules.read = true;
      console.log('✅ Rule READ success:', rules?.length || 0, 'rules found');
    }
    
    // UPDATE rule (if we created one)
    if (newRule) {
      const { data: updatedRule, error: updateRuleError } = await window.supabase
        .from('rules')
        .update({ title: 'Test Rule - UPDATED' })
        .eq('id', newRule.id)
        .select()
        .single();
      
      if (updateRuleError) {
        test.issues.push(`Rule UPDATE failed: ${updateRuleError.message}`);
        console.error('❌ Rule UPDATE error:', updateRuleError);
      } else {
        test.details.rules.update = true;
        console.log('✅ Rule UPDATE success:', updatedRule);
      }
      
      // DELETE rule
      const { error: deleteRuleError } = await window.supabase
        .from('rules')
        .delete()
        .eq('id', newRule.id);
      
      if (deleteRuleError) {
        test.issues.push(`Rule DELETE failed: ${deleteRuleError.message}`);
        console.error('❌ Rule DELETE error:', deleteRuleError);
      } else {
        test.details.rules.delete = true;
        console.log('✅ Rule DELETE success');
      }
    }
    
    // Test Rewards CRUD
    console.log('Testing Rewards CRUD...');
    
    const { data: newReward, error: createRewardError } = await window.supabase
      .from('rewards')
      .insert({
        couple_id: couple.id,
        title: 'Test Reward - DEBUG',
        description: 'Created by debug script',
        target_amount: 10000,
        created_by_user_id: user.id,
        is_achieved: false
      })
      .select()
      .single();
    
    if (createRewardError) {
      test.issues.push(`Reward CREATE failed: ${createRewardError.message}`);
      console.error('❌ Reward CREATE error:', createRewardError);
    } else {
      test.details.rewards.create = true;
      console.log('✅ Reward CREATE success:', newReward);
      
      // Clean up reward
      await window.supabase.from('rewards').delete().eq('id', newReward.id);
      test.details.rewards.delete = true;
    }
    
    // READ rewards
    const { data: rewards, error: readRewardsError } = await window.supabase
      .from('rewards')
      .select('*')
      .eq('couple_id', couple.id);
    
    if (readRewardsError) {
      test.issues.push(`Reward READ failed: ${readRewardsError.message}`);
      console.error('❌ Reward READ error:', readRewardsError);
    } else {
      test.details.rewards.read = true;
      console.log('✅ Reward READ success:', rewards?.length || 0, 'rewards found');
    }
    
    // Test Violations CRUD
    console.log('Testing Violations CRUD...');
    
    // Get a rule for violation test
    const { data: existingRules } = await window.supabase
      .from('rules')
      .select('*')
      .eq('couple_id', couple.id)
      .limit(1);
    
    let testRuleId = null;
    if (!existingRules || existingRules.length === 0) {
      // Create a temporary rule for violation test
      const { data: tempRule } = await window.supabase
        .from('rules')
        .insert({
          couple_id: couple.id,
          title: 'Temp Rule for Violation Test',
          fine_amount: 1000,
          created_by_user_id: user.id,
          is_active: true
        })
        .select()
        .single();
      
      testRuleId = tempRule?.id;
    } else {
      testRuleId = existingRules[0].id;
    }
    
    if (testRuleId) {
      const { data: newViolation, error: createViolationError } = await window.supabase
        .from('violations')
        .insert({
          couple_id: couple.id,
          rule_id: testRuleId,
          violator_user_id: user.id,
          recorded_by_user_id: user.id,
          amount: 1000,
          memo: 'Debug test violation'
        })
        .select()
        .single();
      
      if (createViolationError) {
        test.issues.push(`Violation CREATE failed: ${createViolationError.message}`);
        console.error('❌ Violation CREATE error:', createViolationError);
      } else {
        test.details.violations.create = true;
        console.log('✅ Violation CREATE success:', newViolation);
        
        // Clean up violation
        await window.supabase.from('violations').delete().eq('id', newViolation.id);
        test.details.violations.delete = true;
      }
    }
    
    // READ violations
    const { data: violations, error: readViolationsError } = await window.supabase
      .from('violations')
      .select('*')
      .eq('couple_id', couple.id);
    
    if (readViolationsError) {
      test.issues.push(`Violation READ failed: ${readViolationsError.message}`);
      console.error('❌ Violation READ error:', readViolationsError);
    } else {
      test.details.violations.read = true;
      console.log('✅ Violation READ success:', violations?.length || 0, 'violations found');
    }
    
    // Check overall success
    const allOperations = Object.values(test.details).flatMap(table => Object.values(table));
    const successfulOperations = allOperations.filter(op => op === true).length;
    const totalOperations = allOperations.length;
    
    test.passed = successfulOperations >= (totalOperations * 0.7); // 70% success rate
    test.successRate = (successfulOperations / totalOperations * 100).toFixed(1) + '%';
    
  } catch (error) {
    test.issues.push(`CRUD test error: ${error.message}`);
    console.error('❌ CRUD test error:', error);
  }
  
  console.log('📊 CRUD Operations Test:', test);
  return test;
}

// 🧪 TEST 3: PARTNER NAME DISPLAY
async function testPartnerNameDisplay(user, couple, partner) {
  console.log('🧪 TEST 3: Partner Name Display');
  
  const test = {
    name: 'Partner Name Display',
    passed: false,
    issues: [],
    details: {}
  };
  
  try {
    if (!user || !couple) {
      test.issues.push('Missing user or couple data');
      return test;
    }
    
    // Check if partner exists
    if (!partner) {
      test.issues.push('Partner not found');
      test.details.partnerExists = false;
    } else {
      test.details.partnerExists = true;
      test.details.partnerHasName = !!partner.display_name;
      test.details.partnerName = partner.display_name;
      test.details.partnerEmail = partner.email;
      
      if (partner.display_name) {
        test.passed = true;
      } else if (partner.email) {
        test.issues.push('Partner has email but no display_name');
        test.details.fallbackName = partner.email.split('@')[0];
      } else {
        test.issues.push('Partner has no name or email');
      }
    }
    
    // Check DOM elements for partner display
    const partnerElements = document.querySelectorAll('[class*="partner"], [id*="partner"]');
    test.details.partnerElementsFound = partnerElements.length;
    
    // Check if partner name appears in page content
    if (partner && partner.display_name) {
      const pageText = document.body.innerText;
      test.details.nameAppearsInPage = pageText.includes(partner.display_name);
    }
    
  } catch (error) {
    test.issues.push(`Partner name test error: ${error.message}`);
  }
  
  console.log('📊 Partner Name Display Test:', test);
  return test;
}

// 🧪 TEST 4: CELEBRATION PAGE
async function testCelebrationPage(user, couple) {
  console.log('🧪 TEST 4: Celebration Page');
  
  const test = {
    name: 'Celebration Page',
    passed: false,
    issues: [],
    details: {}
  };
  
  try {
    if (!user || !couple) {
      test.issues.push('Missing user or couple data');
      return test;
    }
    
    // Check if couple is complete
    const isCoupleComplete = couple.partner_1_id && couple.partner_2_id;
    test.details.isCoupleComplete = isCoupleComplete;
    
    // Check localStorage for celebration flag
    const celebrationKey = `couple_celebrated_${user.id}_${couple.id}`;
    const hasSeenCelebration = localStorage.getItem(celebrationKey) === 'true';
    test.details.hasSeenCelebration = hasSeenCelebration;
    test.details.celebrationKey = celebrationKey;
    
    // Determine if celebration should be shown
    const shouldShowCelebration = isCoupleComplete && !hasSeenCelebration;
    test.details.shouldShowCelebration = shouldShowCelebration;
    
    // Check if celebration page is accessible
    const currentPath = window.location.pathname;
    const isCelebrationPage = currentPath === '/couple-complete';
    test.details.currentPath = currentPath;
    test.details.isCelebrationPage = isCelebrationPage;
    
    // Test navigation to celebration page
    if (window.navigate || (window.history && window.history.pushState)) {
      test.details.canNavigateToCelebration = true;
    }
    
    test.passed = isCoupleComplete;
    
    if (!isCoupleComplete) {
      test.issues.push('Couple not complete - celebration should not show');
    }
    
  } catch (error) {
    test.issues.push(`Celebration page test error: ${error.message}`);
  }
  
  console.log('📊 Celebration Page Test:', test);
  return test;
}

// 🧪 TEST 5: HOME SCREEN INFO
async function testHomeScreenInfo(user, couple) {
  console.log('🧪 TEST 5: Home Screen Info');
  
  const test = {
    name: 'Home Screen Info',
    passed: false,
    issues: [],
    details: {}
  };
  
  try {
    if (!user || !couple) {
      test.issues.push('Missing user or couple data');
      return test;
    }
    
    // Check couple information completeness
    test.details.coupleData = {
      id: couple.id,
      couple_name: couple.couple_name,
      couple_code: couple.couple_code,
      total_balance: couple.total_balance,
      partner_1_id: couple.partner_1_id,
      partner_2_id: couple.partner_2_id,
      is_active: couple.is_active
    };
    
    // Validate essential fields
    const essentialFields = ['id', 'couple_code', 'total_balance'];
    const missingFields = essentialFields.filter(field => !couple[field] && couple[field] !== 0);
    
    if (missingFields.length > 0) {
      test.issues.push(`Missing essential fields: ${missingFields.join(', ')}`);
    }
    
    // Check for partner information
    const hasPartnerInfo = couple.partner_1_id && couple.partner_2_id;
    test.details.hasPartnerInfo = hasPartnerInfo;
    
    if (!hasPartnerInfo) {
      test.issues.push('Missing partner information');
    }
    
    // Check if data appears in DOM
    const coupleElements = {
      coupleName: document.querySelector('[data-testid="couple-name"], .couple-name'),
      coupleCode: document.querySelector('[data-testid="couple-code"], .couple-code'),
      totalBalance: document.querySelector('[data-testid="total-balance"], .total-balance')
    };
    
    test.details.domElements = Object.entries(coupleElements).map(([key, element]) => ({
      key,
      found: !!element,
      text: element?.textContent || null
    }));
    
    test.passed = missingFields.length === 0 && hasPartnerInfo;
    
  } catch (error) {
    test.issues.push(`Home screen test error: ${error.message}`);
  }
  
  console.log('📊 Home Screen Info Test:', test);
  return test;
}

// 🧪 TEST 6: REALTIME SYNC
async function testRealtimeSync(user, couple) {
  console.log('🧪 TEST 6: Realtime Sync');
  
  const test = {
    name: 'Realtime Sync',
    passed: false,
    issues: [],
    details: {}
  };
  
  try {
    if (!window.supabase || !user || !couple) {
      test.issues.push('Missing supabase instance, user, or couple data');
      return test;
    }
    
    // Check if realtime is available
    test.details.realtimeAvailable = !!window.supabase.realtime;
    
    // Check active channels
    const channels = window.supabase.realtime?.channels || [];
    test.details.activeChannels = channels.map(ch => ({
      topic: ch.topic,
      state: ch.state,
      joinRef: ch.joinRef
    }));
    
    // Look for couple-specific channels
    const coupleChannels = channels.filter(ch => 
      ch.topic.includes(couple.id) || 
      ch.topic.includes('couple') ||
      ch.topic.includes('rules') ||
      ch.topic.includes('violations') ||
      ch.topic.includes('rewards')
    );
    
    test.details.coupleChannels = coupleChannels.length;
    test.details.hasRealtimeConnection = coupleChannels.length > 0;
    
    if (coupleChannels.length === 0) {
      test.issues.push('No couple-specific realtime channels found');
    } else {
      test.passed = true;
    }
    
    // Check if app has realtime hooks or subscriptions
    if (window.app && window.app.realtime) {
      test.details.appRealtimeEnabled = true;
    }
    
  } catch (error) {
    test.issues.push(`Realtime sync test error: ${error.message}`);
  }
  
  console.log('📊 Realtime Sync Test:', test);
  return test;
}

// 📊 ANALYZE RESULTS
function analyzeResults(results) {
  console.log('🔍 ANALYZING RESULTS');
  console.log('==================');
  
  const allTests = Object.values(results.tests);
  const passedTests = allTests.filter(test => test.passed);
  const failedTests = allTests.filter(test => !test.passed);
  
  console.log(`✅ Passed: ${passedTests.length}/${allTests.length} tests`);
  console.log(`❌ Failed: ${failedTests.length}/${allTests.length} tests`);
  
  // Categorize issues
  const criticalIssues = [];
  const minorIssues = [];
  
  failedTests.forEach(test => {
    if (test.name === 'CRUD Operations' || test.name === 'Partner Connection Status') {
      criticalIssues.push(...test.issues.map(issue => ({ test: test.name, issue })));
    } else {
      minorIssues.push(...test.issues.map(issue => ({ test: test.name, issue })));
    }
  });
  
  results.summary = {
    totalTests: allTests.length,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
    successRate: (passedTests.length / allTests.length * 100).toFixed(1) + '%',
    criticalIssues: criticalIssues.length,
    minorIssues: minorIssues.length
  };
  
  console.log('📈 Summary:', results.summary);
  
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    criticalIssues.forEach(item => console.log(`  - [${item.test}] ${item.issue}`));
  }
  
  if (minorIssues.length > 0) {
    console.log('⚠️ MINOR ISSUES:');
    minorIssues.forEach(item => console.log(`  - [${item.test}] ${item.issue}`));
  }
}

// 📋 GENERATE REPORT
function generateReport(results) {
  console.log('📋 GENERATING REPORT');
  console.log('===================');
  
  const report = `
🔍 BACKEND DEBUG REPORT
Generated: ${results.timestamp}

👤 USER INFO:
- ID: ${results.user?.id || 'N/A'}
- Email: ${results.user?.email || 'N/A'}  
- Name: ${results.user?.display_name || 'N/A'}
- Couple ID: ${results.user?.couple_id || 'N/A'}

💑 COUPLE INFO:
- ID: ${results.couple?.id || 'N/A'}
- Code: ${results.couple?.couple_code || 'N/A'}
- Name: ${results.couple?.couple_name || 'N/A'}
- Balance: ${results.couple?.total_balance || 0}
- Partner 1: ${results.couple?.partner_1_id || 'N/A'}
- Partner 2: ${results.couple?.partner_2_id || 'N/A'}

👫 PARTNER INFO:
- Found: ${results.partner ? 'Yes' : 'No'}
- Name: ${results.partner?.display_name || 'N/A'}
- Email: ${results.partner?.email || 'N/A'}

📊 TEST RESULTS:
${Object.entries(results.tests).map(([key, test]) => 
  `- ${test.name}: ${test.passed ? '✅ PASS' : '❌ FAIL'}`
).join('\n')}

📈 SUMMARY:
- Success Rate: ${results.summary?.successRate || '0%'}
- Critical Issues: ${results.summary?.criticalIssues || 0}
- Minor Issues: ${results.summary?.minorIssues || 0}

🎯 RECOMMENDATIONS:
${results.summary?.criticalIssues > 0 ? 
  '- Apply the ultra-simple RLS migration immediately\n- Check database connectivity and permissions' : 
  '- Backend appears to be working correctly'
}
${results.summary?.minorIssues > 0 ? 
  '- Address minor issues for optimal user experience' : 
  ''
}

💡 NEXT STEPS:
1. Apply migration: supabase/migrations/20250808_ultra_simple_rls_fix.sql
2. Test CRUD operations manually
3. Verify partner information displays correctly
4. Test celebration page flow
5. Monitor realtime synchronization
`;

  console.log(report);
  
  // Also save to localStorage for later reference
  localStorage.setItem('backend_debug_report', JSON.stringify(results, null, 2));
  localStorage.setItem('backend_debug_report_text', report);
  
  console.log('💾 Report saved to localStorage as "backend_debug_report"');
  
  return report;
}

// 🚀 AUTO-RUN FUNCTIONS
function runDebugScript() {
  console.log('🔧 Running Backend Debug Script...');
  console.log('This may take a few seconds to complete...');
  
  debugBackendIssues()
    .then(results => {
      console.log('🎉 Debug script completed successfully!');
      console.log('📊 Results available in console and localStorage');
      
      // Show quick summary
      const summary = results.summary;
      if (summary) {
        if (summary.passedTests === summary.totalTests) {
          console.log('🎊 ALL TESTS PASSED! Backend is working correctly.');
        } else if (summary.criticalIssues > 0) {
          console.log('🚨 CRITICAL ISSUES FOUND! Please apply the RLS migration.');
        } else {
          console.log('⚠️ Some minor issues found, but core functionality works.');
        }
      }
    })
    .catch(error => {
      console.error('💥 Debug script failed:', error);
    });
}

// 🎯 UTILITY FUNCTIONS FOR MANUAL TESTING

// Quick test for RLS policies
window.testRLS = async () => {
  if (!window.supabase) return console.error('Supabase not available');
  
  console.log('🧪 Quick RLS Test');
  
  try {
    // Test profiles
    const { data: profiles, error: profilesError } = await window.supabase
      .from('profiles')
      .select('id, display_name, email')
      .limit(5);
    
    console.log('Profiles access:', profilesError ? '❌ FAILED' : '✅ SUCCESS', 
                profiles?.length || 0, 'records');
    
    // Test couples  
    const { data: couples, error: couplesError } = await window.supabase
      .from('couples')
      .select('*')
      .limit(5);
    
    console.log('Couples access:', couplesError ? '❌ FAILED' : '✅ SUCCESS', 
                couples?.length || 0, 'records');
    
    // Test rules
    const { data: rules, error: rulesError } = await window.supabase
      .from('rules')
      .select('*')
      .limit(5);
    
    console.log('Rules access:', rulesError ? '❌ FAILED' : '✅ SUCCESS', 
                rules?.length || 0, 'records');
    
  } catch (error) {
    console.error('RLS test error:', error);
  }
};

// Quick partner info test
window.testPartner = async () => {
  const user = await getCurrentUserInfo();
  const couple = await getCurrentCoupleInfo();
  const partner = await getPartnerInfo();
  
  console.log('👤 User:', user?.display_name || user?.email || 'Not found');
  console.log('💑 Couple:', couple ? `${couple.couple_name} (${couple.couple_code})` : 'Not found');
  console.log('👫 Partner:', partner ? `${partner.display_name || partner.email}` : 'Not found');
};

// Export functions for global use
window.debugBackend = debugBackendIssues;
window.runDebugScript = runDebugScript;

// Show usage instructions
console.log(`
🎯 BACKEND DEBUG SCRIPT LOADED!

📋 Available Commands:
- runDebugScript()        // Run full comprehensive test
- debugBackend()          // Same as above, returns results
- testRLS()              // Quick RLS policy test  
- testPartner()          // Quick partner info test

🚀 Quick Start:
Just run: runDebugScript()

The script will test all backend functionality and provide a detailed report.
Results will be saved to localStorage for later reference.
`);

// Auto-run if in debug mode
if (window.location.search.includes('debug=true') || 
    window.localStorage.getItem('auto_debug') === 'true') {
  setTimeout(runDebugScript, 1000);
}
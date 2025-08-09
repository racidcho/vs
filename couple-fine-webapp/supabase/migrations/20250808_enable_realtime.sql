-- 🔄 ENABLE REALTIME FOR ALL TABLES
-- Purpose: Enable real-time synchronization between couple users
-- Date: 2025-08-08
-- This fixes: "데이터가 연동이 안돼" issue

-- ========================================
-- STEP 1: SET REPLICA IDENTITY FOR ALL TABLES
-- ========================================
-- This is required for Supabase Realtime to track changes

ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE couples REPLICA IDENTITY FULL;
ALTER TABLE rules REPLICA IDENTITY FULL;
ALTER TABLE violations REPLICA IDENTITY FULL;
ALTER TABLE rewards REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;

-- ========================================
-- STEP 2: ADD TABLES TO SUPABASE_REALTIME PUBLICATION
-- ========================================
-- Supabase가 자동으로 supabase_realtime publication을 생성하므로
-- 기존 publication에 테이블들을 추가합니다

-- Add tables to existing supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE couples;
ALTER PUBLICATION supabase_realtime ADD TABLE rules;
ALTER PUBLICATION supabase_realtime ADD TABLE violations;
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- ========================================
-- STEP 4: ENABLE REALTIME IN SUPABASE DASHBOARD
-- ========================================
-- Note: You also need to enable realtime in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Enable replication for these tables:
--    - profiles
--    - couples
--    - rules
--    - violations
--    - rewards
--    - activity_logs
-- 3. Select events: INSERT, UPDATE, DELETE

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if replica identity is set
-- SELECT 
--   schemaname,
--   tablename,
--   CASE relreplident
--     WHEN 'd' THEN 'default'
--     WHEN 'n' THEN 'nothing'
--     WHEN 'f' THEN 'full'
--     WHEN 'i' THEN 'index'
--   END as replica_identity
-- FROM pg_tables t
-- JOIN pg_class c ON c.relname = t.tablename
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'couples', 'rules', 'violations', 'rewards', 'activity_logs');

-- Check if publication exists
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check which tables are in the publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ========================================
-- SUMMARY
-- ========================================
/*
🔄 REALTIME SYNCHRONIZATION ENABLED:

✅ All tables now have REPLICA IDENTITY FULL
✅ Publication created for real-time events
✅ Ready for Supabase Realtime subscriptions

📝 NEXT STEPS:
1. Apply this migration: supabase db push
2. Enable realtime in Supabase Dashboard (Database > Replication)
3. Update AppContext.tsx to subscribe to realtime events
4. Test with two browsers logged in as couple partners

🎯 EXPECTED BEHAVIOR:
- Changes made by one user appear instantly for the other
- No manual refresh needed
- Works for all CRUD operations (Create, Read, Update, Delete)
*/
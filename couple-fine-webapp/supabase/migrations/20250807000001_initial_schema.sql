-- 우리 벌금통 (Couple Fine WebApp) 초기 스키마 설계
-- 작성일: 2025-08-07
-- MVP 아키텍처 기반 테이블 설계

-- 1. 사용자 프로필 테이블 (Supabase Auth 확장)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  couple_id UUID NULL,  -- 커플 연결용 ID
  pin_hash TEXT NULL,   -- PIN 해시 (보안 잠금)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 커플 테이블
CREATE TABLE public.couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_code TEXT NOT NULL UNIQUE,  -- 6자리 커플 연결 코드
  partner_1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_name TEXT NOT NULL DEFAULT '우리',
  total_balance INTEGER DEFAULT 0,  -- 현재 총 벌금액
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 규칙(약속) 테이블
CREATE TABLE public.rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  fine_amount INTEGER NOT NULL DEFAULT 1000,  -- 기본 벌금액 1000원
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',  -- general, health, lifestyle, etc
  icon_emoji TEXT DEFAULT '📝',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 벌금 기록 테이블
CREATE TABLE public.violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL,
  violator_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  recorded_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  amount INTEGER NOT NULL,  -- 양수: 벌금 추가, 음수: 벌금 차감
  memo TEXT,
  violation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 보상 테이블
CREATE TABLE public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount INTEGER NOT NULL,  -- 목표 벌금액
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ NULL,
  achieved_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'date',  -- date, gift, travel, food, etc
  icon_emoji TEXT DEFAULT '🎁',
  priority INTEGER DEFAULT 0,  -- 높을수록 우선순위 높음
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 활동 로그 테이블 (실시간 피드용)
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,  -- violation, reward_achieved, rule_added, etc
  activity_data JSONB NOT NULL,  -- 활동 관련 데이터
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX idx_couples_couple_code ON public.couples(couple_code);
CREATE INDEX idx_rules_couple_id ON public.rules(couple_id);
CREATE INDEX idx_rules_active ON public.rules(couple_id, is_active);
CREATE INDEX idx_violations_couple_id ON public.violations(couple_id);
CREATE INDEX idx_violations_date ON public.violations(couple_id, violation_date DESC);
CREATE INDEX idx_rewards_couple_id ON public.rewards(couple_id);
CREATE INDEX idx_rewards_active ON public.rewards(couple_id, is_achieved);
CREATE INDEX idx_activity_logs_couple_id ON public.activity_logs(couple_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(couple_id, created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책들

-- Profiles: 본인 프로필만 접근
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Couples: 커플 멤버만 접근
CREATE POLICY "Couple members can view couple data" ON public.couples
  FOR ALL USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
  );

-- Rules: 커플 멤버만 접근
CREATE POLICY "Couple members can manage rules" ON public.rules
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Violations: 커플 멤버만 접근
CREATE POLICY "Couple members can manage violations" ON public.violations
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Rewards: 커플 멤버만 접근
CREATE POLICY "Couple members can manage rewards" ON public.rewards
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- Activity Logs: 커플 멤버만 접근
CREATE POLICY "Couple members can view activity logs" ON public.activity_logs
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
    )
  );

-- 트리거 함수들 (자동 업데이트)

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거들
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 커플 잔액 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_couple_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 violation 추가 시
  IF TG_OP = 'INSERT' THEN
    UPDATE public.couples 
    SET 
      total_balance = total_balance + NEW.amount,
      updated_at = now()
    WHERE id = NEW.couple_id;
    RETURN NEW;
  END IF;
  
  -- violation 삭제 시
  IF TG_OP = 'DELETE' THEN
    UPDATE public.couples 
    SET 
      total_balance = total_balance - OLD.amount,
      updated_at = now()
    WHERE id = OLD.couple_id;
    RETURN OLD;
  END IF;
  
  -- violation 수정 시
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.couples 
    SET 
      total_balance = total_balance - OLD.amount + NEW.amount,
      updated_at = now()
    WHERE id = NEW.couple_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 커플 잔액 업데이트 트리거
CREATE TRIGGER update_couple_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.violations
  FOR EACH ROW EXECUTE FUNCTION update_couple_balance();

-- 활동 로그 자동 생성 트리거 함수
CREATE OR REPLACE FUNCTION create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
  activity_data JSONB;
  activity_type TEXT;
  user_id_val UUID;
BEGIN
  -- violations 테이블 변경 시
  IF TG_TABLE_NAME = 'violations' THEN
    IF TG_OP = 'INSERT' THEN
      activity_type := 'violation_added';
      activity_data := jsonb_build_object(
        'violation_id', NEW.id,
        'rule_id', NEW.rule_id,
        'amount', NEW.amount,
        'violator_id', NEW.violator_user_id
      );
      user_id_val := NEW.recorded_by_user_id;
      
      INSERT INTO public.activity_logs (couple_id, user_id, activity_type, activity_data)
      VALUES (NEW.couple_id, user_id_val, activity_type, activity_data);
    END IF;
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- rewards 테이블 변경 시
  IF TG_TABLE_NAME = 'rewards' THEN
    IF TG_OP = 'UPDATE' AND OLD.is_achieved = false AND NEW.is_achieved = true THEN
      activity_type := 'reward_achieved';
      activity_data := jsonb_build_object(
        'reward_id', NEW.id,
        'reward_title', NEW.title,
        'target_amount', NEW.target_amount
      );
      user_id_val := NEW.achieved_by_user_id;
      
      INSERT INTO public.activity_logs (couple_id, user_id, activity_type, activity_data)
      VALUES (NEW.couple_id, user_id_val, activity_type, activity_data);
    END IF;
    RETURN NEW;
  END IF;
  
  -- rules 테이블 변경 시
  IF TG_TABLE_NAME = 'rules' THEN
    IF TG_OP = 'INSERT' THEN
      activity_type := 'rule_added';
      activity_data := jsonb_build_object(
        'rule_id', NEW.id,
        'rule_title', NEW.title,
        'fine_amount', NEW.fine_amount
      );
      user_id_val := NEW.created_by_user_id;
      
      INSERT INTO public.activity_logs (couple_id, user_id, activity_type, activity_data)
      VALUES (NEW.couple_id, user_id_val, activity_type, activity_data);
    END IF;
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 활동 로그 생성 트리거들
CREATE TRIGGER create_violation_activity_log
  AFTER INSERT ON public.violations
  FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER create_reward_activity_log
  AFTER UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER create_rule_activity_log
  AFTER INSERT ON public.rules
  FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- 시드 데이터 (개발/테스트용)
-- 커플 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_couple_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- 헷갈리는 문자 제외
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ language 'plpgsql';

-- 기본 규칙 템플릿 함수
CREATE OR REPLACE FUNCTION create_default_rules(p_couple_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.rules (couple_id, created_by_user_id, title, description, fine_amount, category, icon_emoji) VALUES
    (p_couple_id, p_user_id, '늦잠 자기', '약속 시간에 늦잠 잤을 때', 2000, 'lifestyle', '😴'),
    (p_couple_id, p_user_id, '약속 시간 지키기', '데이트나 약속에 5분 이상 늦을 때', 3000, 'general', '⏰'),
    (p_couple_id, p_user_id, '휴대폰 많이 보기', '데이트 중 휴대폰을 과도하게 볼 때', 1000, 'lifestyle', '📱'),
    (p_couple_id, p_user_id, '화내고 삐지기', '이유 없이 화내거나 삐질 때', 5000, 'general', '😤'),
    (p_couple_id, p_user_id, '운동 안하기', '일주일에 운동 1회도 안 했을 때', 10000, 'health', '🏃‍♀️');
END;
$$ language 'plpgsql';

-- 기본 보상 템플릿 함수
CREATE OR REPLACE FUNCTION create_default_rewards(p_couple_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.rewards (couple_id, created_by_user_id, title, description, target_amount, category, icon_emoji, priority) VALUES
    (p_couple_id, p_user_id, '맛있는 카페 가기', '새로운 카페에서 디저트 먹기', 20000, 'date', '☕', 1),
    (p_couple_id, p_user_id, '영화관 데이트', '극장에서 영화보고 팝콘 먹기', 30000, 'date', '🎬', 2),
    (p_couple_id, p_user_id, '맛집 탐방하기', '찜해둔 맛집에서 저녁식사', 50000, 'food', '🍽️', 3),
    (p_couple_id, p_user_id, '당일치기 여행', '근교로 드라이브 겸 여행가기', 100000, 'travel', '🚗', 4),
    (p_couple_id, p_user_id, '1박2일 여행', '원하는 곳으로 여행가기', 200000, 'travel', '🏨', 5);
END;
$$ language 'plpgsql';

-- 실시간 구독을 위한 publication 설정
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.violations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- 스키마 생성 완료
COMMENT ON SCHEMA public IS '우리 벌금통 (Couple Fine WebApp) - 커플을 위한 재미있는 벌금 관리 시스템';
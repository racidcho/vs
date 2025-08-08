// Supabase Database Type Definitions
// This file should be generated from your Supabase instance
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          couple_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          couple_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          couple_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      couples: {
        Row: {
          id: string;
          code: string;
          theme: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          theme?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      rules: {
        Row: {
          id: string;
          couple_id: string;
          type: 'word' | 'behavior';
          title: string;
          penalty_amount: number;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          type: 'word' | 'behavior';
          title: string;
          penalty_amount: number;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          type?: 'word' | 'behavior';
          title?: string;
          penalty_amount?: number;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string | null;
        };
      };
      violations: {
        Row: {
          id: string;
          rule_id: string;
          violator_id: string;
          partner_id: string | null;
          amount: number;
          type: 'add' | 'subtract';
          note: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          rule_id: string;
          violator_id: string;
          partner_id?: string | null;
          amount: number;
          type: 'add' | 'subtract';
          note?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          rule_id?: string;
          violator_id?: string;
          partner_id?: string | null;
          amount?: number;
          type?: 'add' | 'subtract';
          note?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      rewards: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          target_amount: number;
          is_claimed: boolean;
          claimed_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          target_amount: number;
          is_claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          title?: string;
          target_amount?: number;
          is_claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      // Define any views here
    };
    Functions: {
      // Define any custom functions here
      get_couple_balance: {
        Args: {
          couple_id: string;
        };
        Returns: number;
      };
      get_user_balance: {
        Args: {
          user_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      rule_type: 'word' | 'behavior';
      violation_type: 'add' | 'subtract';
      theme_type: 'cute' | 'minimal' | 'playful';
    };
  };
}

// Helper types for extracting table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T];

// Convenience aliases
export type UserRow = Tables<'profiles'>;
export type CoupleRow = Tables<'couples'>;
export type RuleRow = Tables<'rules'>;
export type ViolationRow = Tables<'violations'>;
export type RewardRow = Tables<'rewards'>;

export type UserInsert = Inserts<'profiles'>;
export type CoupleInsert = Inserts<'couples'>;
export type RuleInsert = Inserts<'rules'>;
export type ViolationInsert = Inserts<'violations'>;
export type RewardInsert = Inserts<'rewards'>;

export type UserUpdate = Updates<'profiles'>;
export type CoupleUpdate = Updates<'couples'>;
export type RuleUpdate = Updates<'rules'>;
export type ViolationUpdate = Updates<'violations'>;
export type RewardUpdate = Updates<'rewards'>;
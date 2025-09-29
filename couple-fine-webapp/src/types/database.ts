export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string | null;
          activity_type: string;
          activity_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id?: string | null;
          activity_type: string;
          activity_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string | null;
          activity_type?: string;
          activity_data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      couples: {
        Row: {
          id: string;
          couple_code: string;
          partner_1_id: string | null;
          partner_2_id: string | null;
          couple_name: string;
          total_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_code: string;
          partner_1_id: string;
          partner_2_id?: string | null;
          couple_name?: string;
          total_balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_code?: string;
          partner_1_id?: string | null;
          partner_2_id?: string | null;
          couple_name?: string;
          total_balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "couples_partner_1_id_fkey";
            columns: ["partner_1_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_partner_2_id_fkey";
            columns: ["partner_2_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          couple_id: string | null;
          pin_hash: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          couple_id?: string | null;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          couple_id?: string | null;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          }
        ];
      };
      rewards: {
        Row: {
          id: string;
          couple_id: string;
          created_by_user_id: string | null;
          title: string;
          description: string | null;
          target_amount: number;
          is_achieved: boolean;
          achieved_at: string | null;
          achieved_by_user_id: string | null;
          category: string;
          icon_emoji: string;
          priority: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by_user_id?: string | null;
          title: string;
          description?: string | null;
          target_amount: number;
          is_achieved?: boolean;
          achieved_at?: string | null;
          achieved_by_user_id?: string | null;
          category?: string;
          icon_emoji?: string;
          priority?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by_user_id?: string | null;
          title?: string;
          description?: string | null;
          target_amount?: number;
          is_achieved?: boolean;
          achieved_at?: string | null;
          achieved_by_user_id?: string | null;
          category?: string;
          icon_emoji?: string;
          priority?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rewards_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rewards_achieved_by_user_id_fkey";
            columns: ["achieved_by_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      rules: {
        Row: {
          id: string;
          couple_id: string;
          created_by_user_id: string | null;
          title: string;
          description: string | null;
          fine_amount: number;
          is_active: boolean;
          category: string;
          icon_emoji: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by_user_id?: string | null;
          title: string;
          description?: string | null;
          fine_amount?: number;
          is_active?: boolean;
          category?: string;
          icon_emoji?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by_user_id?: string | null;
          title?: string;
          description?: string | null;
          fine_amount?: number;
          is_active?: boolean;
          category?: string;
          icon_emoji?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rules_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rules_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      violations: {
        Row: {
          id: string;
          couple_id: string;
          rule_id: string | null;
          violator_user_id: string;
          recorded_by_user_id: string;
          amount: number;
          memo: string | null;
          violation_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          rule_id?: string | null;
          violator_user_id: string;
          recorded_by_user_id: string;
          amount: number;
          memo?: string | null;
          violation_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          rule_id?: string | null;
          violator_user_id?: string;
          recorded_by_user_id?: string;
          amount?: number;
          memo?: string | null;
          violation_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "violations_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "violations_rule_id_fkey";
            columns: ["rule_id"];
            referencedRelation: "rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "violations_recorded_by_user_id_fkey";
            columns: ["recorded_by_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "violations_violator_user_id_fkey";
            columns: ["violator_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_couple_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

export type UserRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CoupleRow = Database["public"]["Tables"]["couples"]["Row"];
export type RuleRow = Database["public"]["Tables"]["rules"]["Row"];
export type ViolationRow = Database["public"]["Tables"]["violations"]["Row"];
export type RewardRow = Database["public"]["Tables"]["rewards"]["Row"];

export type UserInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type CoupleInsert = Database["public"]["Tables"]["couples"]["Insert"];
export type RuleInsert = Database["public"]["Tables"]["rules"]["Insert"];
export type ViolationInsert = Database["public"]["Tables"]["violations"]["Insert"];
export type RewardInsert = Database["public"]["Tables"]["rewards"]["Insert"];

export type UserUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type CoupleUpdate = Database["public"]["Tables"]["couples"]["Update"];
export type RuleUpdate = Database["public"]["Tables"]["rules"]["Update"];
export type ViolationUpdate = Database["public"]["Tables"]["violations"]["Update"];
export type RewardUpdate = Database["public"]["Tables"]["rewards"]["Update"];

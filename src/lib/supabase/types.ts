// Auto-generate the real version with:
//   npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
// This placeholder keeps TypeScript happy during development.

export type Role = "admin" | "trainer" | "client";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string;
          email: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: Role;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      trainers: {
        Row: {
          id: string;
          bio: string | null;
          coaching_style: string | null;
          ai_system_prompt: string | null;
          ai_name: string;
          photo_url: string | null;
          specialties: string[];
          whatsapp_number: string | null;
          instagram_handle: string | null;
          max_clients: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bio?: string | null;
          coaching_style?: string | null;
          ai_system_prompt?: string | null;
          ai_name?: string;
          photo_url?: string | null;
          specialties?: string[];
          whatsapp_number?: string | null;
          instagram_handle?: string | null;
          max_clients?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["trainers"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          trainer_id: string | null;
          age: number | null;
          gender: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          goals: string[];
          activity_level: string | null;
          gym_access: string | null;
          diet_type: string | null;
          sleep_hours: string | null;
          stress_level: string | null;
          work_hours: string | null;
          injuries: string[];
          notes: string | null;
          trainer_notes: string | null;
          pt_start_date: string | null;
          pt_end_date: string | null;
          onboarding_done: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          trainer_id?: string | null;
          age?: number | null;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          goals?: string[];
          activity_level?: string | null;
          gym_access?: string | null;
          diet_type?: string | null;
          sleep_hours?: string | null;
          stress_level?: string | null;
          work_hours?: string | null;
          injuries?: string[];
          notes?: string | null;
          trainer_notes?: string | null;
          pt_start_date?: string | null;
          pt_end_date?: string | null;
          onboarding_done?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      plans: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string;
          type: "full" | "workout" | "nutrition";
          title: string | null;
          content: Record<string, unknown>;
          is_active: boolean;
          generated_by: "ai" | "trainer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id: string;
          type: "full" | "workout" | "nutrition";
          title?: string | null;
          content: Record<string, unknown>;
          is_active?: boolean;
          generated_by?: "ai" | "trainer";
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
      };
      assessments: {
        Row: {
          id: string;
          client_id: string;
          answers: Record<string, unknown>;
          plan_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          answers: Record<string, unknown>;
          plan_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assessments"]["Insert"]>;
      };
      chat_sessions: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id: string;
          title?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_sessions"]["Insert"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          client_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          client_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_used?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
      };
      food_logs: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          food_description: string;
          items: Array<{ name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number }>;
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          date?: string;
          food_description: string;
          items: Array<{ name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number }>;
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
        };
        Update: Partial<Database["public"]["Tables"]["food_logs"]["Insert"]>;
      };
      usage_events: {
        Row: {
          id: string;
          user_id: string;
          trainer_id: string | null;
          event_type: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trainer_id?: string | null;
          event_type: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_my_trainer_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      role_enum: Role;
      plan_type: "full" | "workout" | "nutrition";
      plan_source: "ai" | "trainer";
      message_role: "user" | "assistant";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

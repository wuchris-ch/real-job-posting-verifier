export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          location: string;
          location_type: "REMOTE" | "HYBRID" | "ONSITE";
          salary_min: number | null;
          salary_max: number | null;
          apply_url: string;
          source_url: string;
          source: string | null;
          verification_status:
            | "VERIFIED"
            | "EXPIRED"
            | "BROKEN_LINK"
            | "NOT_HIRING"
            | "PENDING";
          last_verified_at: string | null;
          verification_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          location: string;
          location_type: "REMOTE" | "HYBRID" | "ONSITE";
          salary_min?: number | null;
          salary_max?: number | null;
          apply_url: string;
          source_url: string;
          source?: string | null;
          verification_status?:
            | "VERIFIED"
            | "EXPIRED"
            | "BROKEN_LINK"
            | "NOT_HIRING"
            | "PENDING";
          last_verified_at?: string | null;
          verification_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          company?: string;
          location?: string;
          location_type?: "REMOTE" | "HYBRID" | "ONSITE";
          salary_min?: number | null;
          salary_max?: number | null;
          apply_url?: string;
          source_url?: string;
          source?: string | null;
          verification_status?:
            | "VERIFIED"
            | "EXPIRED"
            | "BROKEN_LINK"
            | "NOT_HIRING"
            | "PENDING";
          last_verified_at?: string | null;
          verification_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          has_paid: boolean;
          paid_at: string | null;
          lemonsqueezy_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          has_paid?: boolean;
          paid_at?: string | null;
          lemonsqueezy_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          has_paid?: boolean;
          paid_at?: string | null;
          lemonsqueezy_customer_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Generated from the live schema. Do not hand-edit.
 *
 * Regenerate after every migration so the app cannot drift from the database:
 *   npm run db:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_emails: {
        Row: { added_by: string | null; created_at: string; email: string; note: string | null };
        Insert: { added_by?: string | null; created_at?: string; email: string; note?: string | null };
        Update: { added_by?: string | null; created_at?: string; email?: string; note?: string | null };
        Relationships: [
          {
            foreignKeyName: "admin_emails_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          detail: Json;
          id: number;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: number;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: number;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          allow_edit_after_submit: boolean;
          closes_at: string | null;
          cut_from: number | null;
          cut_to: number | null;
          deliver: string;
          id: string;
          idx: string;
          jp: string | null;
          locked_at: string | null;
          max_points: number;
          numeral: string;
          opens_at: string | null;
          pop: string;
          position: number;
          state: Database["public"]["Enums"]["chapter_state"];
          task: string;
          title: string;
          tools: string | null;
          updated_at: string;
          weight: number;
        };
        Insert: {
          allow_edit_after_submit?: boolean;
          closes_at?: string | null;
          cut_from?: number | null;
          cut_to?: number | null;
          deliver: string;
          id: string;
          idx: string;
          jp?: string | null;
          locked_at?: string | null;
          max_points?: number;
          numeral: string;
          opens_at?: string | null;
          pop: string;
          position: number;
          state?: Database["public"]["Enums"]["chapter_state"];
          task: string;
          title: string;
          tools?: string | null;
          updated_at?: string;
          weight: number;
        };
        Update: {
          allow_edit_after_submit?: boolean;
          closes_at?: string | null;
          cut_from?: number | null;
          cut_to?: number | null;
          deliver?: string;
          id?: string;
          idx?: string;
          jp?: string | null;
          locked_at?: string | null;
          max_points?: number;
          numeral?: string;
          opens_at?: string | null;
          pop?: string;
          position?: number;
          state?: Database["public"]["Enums"]["chapter_state"];
          task?: string;
          title?: string;
          tools?: string | null;
          updated_at?: string;
          weight?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_inr: number;
          created_at: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"] | null;
          note: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          reference: string | null;
          rejected_reason: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          submitted_at: string | null;
          team_id: string;
          updated_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          amount_inr?: number;
          created_at?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          note?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          reference?: string | null;
          rejected_reason?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string | null;
          team_id: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          amount_inr?: number;
          created_at?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          note?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          reference?: string | null;
          rejected_reason?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string | null;
          team_id?: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: true;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          college: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          year: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          college?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          year?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          college?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          year?: string | null;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          chapter_id: string;
          created_at: string;
          id: string;
          judged_by: string | null;
          notes: string | null;
          points: number;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          chapter_id: string;
          created_at?: string;
          id?: string;
          judged_by?: string | null;
          notes?: string | null;
          points: number;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          chapter_id?: string;
          created_at?: string;
          id?: string;
          judged_by?: string | null;
          notes?: string | null;
          points?: number;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scores_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scores_judged_by_fkey";
            columns: ["judged_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scores_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          announcement: string | null;
          entry_fee_inr: number;
          id: number;
          leaderboard_public: boolean;
          online_payment: boolean;
          registration_open: boolean;
          seats_cap: number;
          updated_at: string;
          updated_by: string | null;
          upi_id: string | null;
          upi_payee_name: string | null;
        };
        Insert: {
          announcement?: string | null;
          entry_fee_inr?: number;
          id?: number;
          leaderboard_public?: boolean;
          online_payment?: boolean;
          registration_open?: boolean;
          seats_cap?: number;
          updated_at?: string;
          updated_by?: string | null;
          upi_id?: string | null;
          upi_payee_name?: string | null;
        };
        Update: {
          announcement?: string | null;
          entry_fee_inr?: number;
          id?: number;
          leaderboard_public?: boolean;
          online_payment?: boolean;
          registration_open?: boolean;
          seats_cap?: number;
          updated_at?: string;
          updated_by?: string | null;
          upi_id?: string | null;
          upi_payee_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      submission_files: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          mime: string | null;
          original_name: string | null;
          size_bytes: number | null;
          storage_path: string;
          submission_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: string;
          mime?: string | null;
          original_name?: string | null;
          size_bytes?: number | null;
          storage_path: string;
          submission_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          mime?: string | null;
          original_name?: string | null;
          size_bytes?: number | null;
          storage_path?: string;
          submission_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submission_files_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          chapter_id: string;
          created_at: string;
          id: string;
          locked_at: string | null;
          payload: Json;
          status: Database["public"]["Enums"]["submission_status"];
          submitted_at: string | null;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          chapter_id: string;
          created_at?: string;
          id?: string;
          locked_at?: string | null;
          payload?: Json;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string | null;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          chapter_id?: string;
          created_at?: string;
          id?: string;
          locked_at?: string | null;
          payload?: Json;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string | null;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          captain_id: string;
          created_at: string;
          eliminated_at: string | null;
          eliminated_at_chapter: string | null;
          id: string;
          invite_code: string;
          name: string;
          note: string | null;
          partner_email: string | null;
          partner_id: string | null;
          partner_name: string | null;
          registered_at: string | null;
          seat: number | null;
          status: Database["public"]["Enums"]["team_status"];
          updated_at: string;
          withdrawn_at: string | null;
        };
        Insert: {
          captain_id: string;
          created_at?: string;
          eliminated_at?: string | null;
          eliminated_at_chapter?: string | null;
          id?: string;
          invite_code: string;
          name: string;
          note?: string | null;
          partner_email?: string | null;
          partner_id?: string | null;
          partner_name?: string | null;
          registered_at?: string | null;
          seat?: number | null;
          status?: Database["public"]["Enums"]["team_status"];
          updated_at?: string;
          withdrawn_at?: string | null;
        };
        Update: {
          captain_id?: string;
          created_at?: string;
          eliminated_at?: string | null;
          eliminated_at_chapter?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
          note?: string | null;
          partner_email?: string | null;
          partner_id?: string | null;
          partner_name?: string | null;
          registered_at?: string | null;
          seat?: number | null;
          status?: Database["public"]["Enums"]["team_status"];
          updated_at?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey";
            columns: ["captain_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_eliminated_chapter_fk";
            columns: ["eliminated_at_chapter"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          chapters_scored: number | null;
          eliminated_at: string | null;
          eliminated_at_chapter: string | null;
          name: string | null;
          seat: number | null;
          status: Database["public"]["Enums"]["team_status"] | null;
          team_id: string | null;
          total: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_apply_cut: { Args: { p_chapter_id: string }; Returns: number };
      admin_mark_paid_offline: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"];
          p_reference?: string;
          p_team_id: string;
        };
        Returns: undefined;
      };
      admin_restore_team: { Args: { p_team_id: string }; Returns: undefined };
      admin_score_team: {
        Args: { p_chapter_id: string; p_notes?: string; p_points: number; p_team_id: string };
        Returns: undefined;
      };
      admin_set_chapter_state: {
        Args: { p_chapter_id: string; p_state: Database["public"]["Enums"]["chapter_state"] };
        Returns: undefined;
      };
      admin_set_role: {
        Args: { p_profile_id: string; p_role: Database["public"]["Enums"]["app_role"] };
        Returns: undefined;
      };
      admin_verify_payment: {
        Args: { p_reason?: string; p_team_id: string; p_verified: boolean };
        Returns: undefined;
      };
      event_stats: { Args: never; Returns: Json };
      start_razorpay_order: { Args: { p_order_id: string }; Returns: undefined };
      record_razorpay_payment: {
        Args: { p_order_id: string; p_payment_id: string };
        Returns: undefined;
      };
      create_team: {
        Args: { p_name: string; p_partner_email?: string; p_partner_name?: string };
        Returns: string;
      };
      is_admin: { Args: never; Returns: boolean };
      join_team: { Args: { p_code: string }; Returns: string };
      leaderboard_is_public: { Args: never; Returns: boolean };
      leave_team: { Args: never; Returns: undefined };
      my_team_id: { Args: never; Returns: string };
      registration_is_open: { Args: never; Returns: boolean };
      submit_chapter: { Args: { p_chapter_id: string }; Returns: undefined };
      submit_payment_reference: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"];
          p_note?: string;
          p_reference: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "participant" | "admin" | "owner";
      chapter_state: "locked" | "open" | "closed" | "graded";
      payment_method: "razorpay" | "upi" | "cash" | "waived";
      payment_status: "pending" | "submitted" | "verified" | "rejected";
      submission_status: "draft" | "submitted" | "locked";
      team_status: "forming" | "registered" | "withdrawn" | "disqualified";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type Public = Database["public"];

export type Tables<T extends keyof (Public["Tables"] & Public["Views"])> = (Public["Tables"] &
  Public["Views"])[T] extends { Row: infer R }
  ? R
  : never;

export type Enums<T extends keyof Public["Enums"]> = Public["Enums"][T];

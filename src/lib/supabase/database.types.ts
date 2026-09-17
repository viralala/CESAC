/**
 * Generated from the live schema. Do not hand-edit.
 *
 * Regenerate after every migration so the app cannot drift from the database:
 *   npm run db:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_emails: {
        Row: {
          added_by: string | null;
          created_at: string;
          email: string;
          note: string | null;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          email: string;
          note?: string | null;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          email?: string;
          note?: string | null;
        };
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
      certificates: {
        Row: {
          contribution: Database["public"]["Enums"]["certificate_contribution"];
          created_at: string;
          drive_file_id: string;
          drive_link: string;
          event_name: string;
          file_name: string;
          id: string;
          mime_type: string;
          owner_id: string;
          prize_amount_inr: number | null;
          size_bytes: number;
          verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          contribution?: Database["public"]["Enums"]["certificate_contribution"];
          created_at?: string;
          drive_file_id: string;
          drive_link: string;
          event_name: string;
          file_name: string;
          id?: string;
          mime_type: string;
          owner_id: string;
          prize_amount_inr?: number | null;
          size_bytes: number;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          contribution?: Database["public"]["Enums"]["certificate_contribution"];
          created_at?: string;
          drive_file_id?: string;
          drive_link?: string;
          event_name?: string;
          file_name?: string;
          id?: string;
          mime_type?: string;
          owner_id?: string;
          prize_amount_inr?: number | null;
          size_bytes?: number;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_verified_by_fkey";
            columns: ["verified_by"];
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
      dept_events: {
        Row: {
          created_at: string;
          fee_inr: number;
          href: string | null;
          jp: string | null;
          kicker: string;
          name: string;
          one_liner: string;
          position: number;
          slug: string;
          state: Database["public"]["Enums"]["dept_event_state"];
          team_size: number;
          updated_at: string;
          updated_by: string | null;
          when_label: string;
        };
        Insert: {
          created_at?: string;
          fee_inr?: number;
          href?: string | null;
          jp?: string | null;
          kicker: string;
          name: string;
          one_liner: string;
          position?: number;
          slug: string;
          state?: Database["public"]["Enums"]["dept_event_state"];
          team_size?: number;
          updated_at?: string;
          updated_by?: string | null;
          when_label: string;
        };
        Update: {
          created_at?: string;
          fee_inr?: number;
          href?: string | null;
          jp?: string | null;
          kicker?: string;
          name?: string;
          one_liner?: string;
          position?: number;
          slug?: string;
          state?: Database["public"]["Enums"]["dept_event_state"];
          team_size?: number;
          updated_at?: string;
          updated_by?: string | null;
          when_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dept_events_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          created_at: string;
          event_slug: string;
          id: string;
          partner_id: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          payment_reference: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          status: Database["public"]["Enums"]["registration_status"];
          student_id: string;
          submitted_at: string | null;
          updated_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string;
          event_slug: string;
          id?: string;
          partner_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_reference?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          status?: Database["public"]["Enums"]["registration_status"];
          student_id: string;
          submitted_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string;
          event_slug?: string;
          id?: string;
          partner_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_reference?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          status?: Database["public"]["Enums"]["registration_status"];
          student_id?: string;
          submitted_at?: string | null;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_slug_fkey";
            columns: ["event_slug"];
            isOneToOne: false;
            referencedRelation: "dept_events";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "event_registrations_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      login_attempts: {
        Row: {
          attempted_at: string;
          email: string;
          id: number;
          ip: string | null;
          succeeded: boolean;
        };
        Insert: {
          attempted_at?: string;
          email: string;
          id?: never;
          ip?: string | null;
          succeeded: boolean;
        };
        Update: {
          attempted_at?: string;
          email?: string;
          id?: never;
          ip?: string | null;
          succeeded?: boolean;
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
            isOneToOne: false;
            referencedRelation: "leaderboard";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "payments_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
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
          drive_folder_id: string | null;
          email: string;
          full_name: string | null;
          id: string;
          must_change_password: boolean;
          phone: string | null;
          prn: string | null;
          role: Database["public"]["Enums"]["app_role"];
          student_class: string | null;
          updated_at: string;
          year: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          college?: string | null;
          created_at?: string;
          drive_folder_id?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          must_change_password?: boolean;
          phone?: string | null;
          prn?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          student_class?: string | null;
          updated_at?: string;
          year?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          college?: string | null;
          created_at?: string;
          drive_folder_id?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          must_change_password?: boolean;
          phone?: string | null;
          prn?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          student_class?: string | null;
          updated_at?: string;
          year?: string | null;
        };
        Relationships: [];
      };
      queries: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          answered_by: string | null;
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["query_status"];
          subject: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["query_status"];
          subject: string;
          topic: string;
          updated_at?: string;
        };
        Update: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["query_status"];
          subject?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queries_answered_by_fkey";
            columns: ["answered_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queries_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
            referencedRelation: "leaderboard";
            referencedColumns: ["team_id"];
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
            referencedRelation: "leaderboard";
            referencedColumns: ["team_id"];
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
            isOneToOne: false;
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
            isOneToOne: false;
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
        Relationships: [
          {
            foreignKeyName: "teams_eliminated_chapter_fk";
            columns: ["eliminated_at_chapter"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
        ];
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
        Args: {
          p_chapter_id: string;
          p_notes?: string;
          p_points: number;
          p_team_id: string;
        };
        Returns: undefined;
      };
      admin_set_chapter_state: {
        Args: {
          p_chapter_id: string;
          p_state: Database["public"]["Enums"]["chapter_state"];
        };
        Returns: undefined;
      };
      admin_set_role: {
        Args: {
          p_profile_id: string;
          p_role: Database["public"]["Enums"]["app_role"];
        };
        Returns: undefined;
      };
      admin_verify_payment: {
        Args: { p_reason?: string; p_team_id: string; p_verified: boolean };
        Returns: undefined;
      };
      audit: {
        Args: {
          p_action: string;
          p_detail?: Json;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: undefined;
      };
      certificate_points: {
        Args: { c: Database["public"]["Enums"]["certificate_contribution"] };
        Returns: number;
      };
      complete_password_change: { Args: never; Returns: undefined };
      create_team: {
        Args: {
          p_name: string;
          p_partner_email?: string;
          p_partner_name?: string;
        };
        Returns: string;
      };
      event_stats: { Args: never; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
      join_team: { Args: { p_code: string }; Returns: string };
      leaderboard_is_public: { Args: never; Returns: boolean };
      leave_team: { Args: never; Returns: undefined };
      login_attempt_record: {
        Args: { p_email: string; p_ip: string; p_ok: boolean };
        Returns: undefined;
      };
      login_throttle_check: {
        Args: { p_email: string; p_ip: string };
        Returns: number;
      };
      my_standing: {
        Args: never;
        Returns: {
          certificates: number;
          place: number;
          points: number;
          prize_total_inr: number;
          ranked_students: number;
        }[];
      };
      my_team_id: { Args: never; Returns: string };
      new_invite_code: { Args: never; Returns: string };
      ranking_board: {
        Args: { p_limit?: number };
        Returns: {
          certificates: number;
          name: string;
          place: number;
          points: number;
          student_id: string;
          year: string;
        }[];
      };
      record_razorpay_payment: {
        Args: { p_order_id: string; p_payment_id: string };
        Returns: undefined;
      };
      refresh_team_status: { Args: { p_team_id: string }; Returns: undefined };
      register_for_event: {
        Args: { p_partner_email?: string; p_slug: string };
        Returns: string;
      };
      registration_is_open: { Args: never; Returns: boolean };
      start_razorpay_order: { Args: { p_order_id: string }; Returns: undefined };
      submit_chapter: { Args: { p_chapter_id: string }; Returns: undefined };
      submit_event_payment: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"];
          p_reference: string;
          p_registration_id: string;
        };
        Returns: undefined;
      };
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
      certificate_contribution: "participation" | "third" | "second" | "first";
      chapter_state: "locked" | "open" | "closed" | "graded";
      dept_event_state: "locked" | "open" | "closed";
      payment_method: "razorpay" | "upi" | "cash" | "waived";
      payment_status: "pending" | "submitted" | "verified" | "rejected";
      query_status: "open" | "answered" | "closed";
      registration_status: "registered" | "withdrawn";
      submission_status: "draft" | "submitted" | "locked";
      team_status: "forming" | "registered" | "withdrawn" | "disqualified";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["participant", "admin", "owner"],
      certificate_contribution: ["participation", "third", "second", "first"],
      chapter_state: ["locked", "open", "closed", "graded"],
      dept_event_state: ["locked", "open", "closed"],
      payment_method: ["razorpay", "upi", "cash", "waived"],
      payment_status: ["pending", "submitted", "verified", "rejected"],
      query_status: ["open", "answered", "closed"],
      registration_status: ["registered", "withdrawn"],
      submission_status: ["draft", "submitted", "locked"],
      team_status: ["forming", "registered", "withdrawn", "disqualified"],
    },
  },
} as const;

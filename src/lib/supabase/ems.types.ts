/**
 * Types for the `ems` schema: the event management system that admins and
 * organisers run.
 *
 * Kept in its own file rather than in database.types.ts because that file is
 * regenerated wholesale by `npm run db:types` and would drop anything written
 * here by hand. `npm run db:types:ems` regenerates this one, and needs a
 * Supabase access token (`supabase login`, or SUPABASE_ACCESS_TOKEN).
 *
 * Why a second schema exists at all is written at the top of
 * supabase/migrations/20260918_ems_schema.sql. The short version: public
 * already has teams, payments, event_registrations, certificates, audit_log
 * and login_attempts with different shapes behind 1871 live profiles, and
 * seven of the new tables collide by name.
 */
import type { Json } from "./database.types";

export type { Json };

/** Where a team sits between forming and being in the event. */
export type TeamStatus = "forming" | "ready" | "payment_pending" | "registered" | "cancelled";

/** An invitation's life: sent, taken up, or turned down. */
export type MemberStatus = "invited" | "accepted" | "rejected";

export type RegistrationStatus = "pending" | "payment_pending" | "registered" | "cancelled";

export type EventStatus = "draft" | "open" | "closed" | "ongoing" | "completed" | "cancelled";

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "refunded" | "cancelled";

/**
 * committee: runs everything.
 * teacher:   oversight and analytics. Cannot enter events, cannot manage
 *            organisers, cannot upload certificates.
 */
export type AdminType = "committee" | "teacher";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type EmsDatabase = {
  ems: {
    Tables: {
      approved_students: {
        Row: Timestamps & {
          id: string;
          email: string;
          full_name: string | null;
          prn: string | null;
          phone: string | null;
          college: string | null;
          year: string | null;
          is_active: boolean;
          added_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          prn?: string | null;
          phone?: string | null;
          college?: string | null;
          year?: string | null;
          is_active?: boolean;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          prn?: string | null;
          phone?: string | null;
          college?: string | null;
          year?: string | null;
          is_active?: boolean;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      admin_users: {
        Row: {
          user_id: string;
          admin_type: AdminType;
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          admin_type: AdminType;
          added_by?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          admin_type?: AdminType;
          added_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      events: {
        Row: Timestamps & {
          id: string;
          name: string;
          description: string | null;
          min_team_size: number;
          max_team_size: number;
          max_teams: number;
          price_inr: number;
          registration_start: string;
          registration_end: string;
          event_start: string;
          event_end: string;
          status: EventStatus;
          created_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          min_team_size?: number;
          max_team_size?: number;
          max_teams: number;
          price_inr?: number;
          registration_start: string;
          registration_end: string;
          event_start: string;
          event_end: string;
          status?: EventStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          min_team_size?: number;
          max_team_size?: number;
          max_teams?: number;
          price_inr?: number;
          registration_start?: string;
          registration_end?: string;
          event_start?: string;
          event_end?: string;
          status?: EventStatus;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      event_organisers: {
        Row: {
          event_id: string;
          user_id: string;
          assigned_by: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          assigned_by: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          assigned_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      teams: {
        Row: Timestamps & {
          id: string;
          event_id: string;
          name: string;
          leader_id: string;
          status: TeamStatus;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          leader_id: string;
          status?: TeamStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          leader_id?: string;
          status?: TeamStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      team_members: {
        Row: {
          id: string;
          team_id: string;
          student_id: string;
          status: MemberStatus;
          invited_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          student_id: string;
          status?: MemberStatus;
          invited_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          student_id?: string;
          status?: MemberStatus;
          invited_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };

      event_registrations: {
        Row: Timestamps & {
          id: string;
          event_id: string;
          team_id: string;
          leader_id: string;
          status: RegistrationStatus;
          amount_inr: number;
          registered_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          team_id: string;
          leader_id: string;
          status?: RegistrationStatus;
          amount_inr?: number;
          registered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          team_id?: string;
          leader_id?: string;
          status?: RegistrationStatus;
          amount_inr?: number;
          registered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      payments: {
        Row: Timestamps & {
          id: string;
          registration_id: string;
          team_id: string;
          amount_inr: number;
          provider: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          status: PaymentStatus;
          paid_at: string | null;
        };
        /** Rows are written by the database functions only. */
        Insert: never;
        Update: never;
        Relationships: [];
      };

      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };

    Views: {
      /**
       * A team's people with their names attached. Readable by anyone on
       * that team, and by the event's organisers. See the note on these
       * views in the migration: they bypass RLS on purpose and gate
       * themselves, so that public.profiles never has to be widened.
       */
      team_roster: {
        Row: {
          member_id: string;
          team_id: string;
          student_id: string;
          status: MemberStatus;
          invited_at: string;
          responded_at: string | null;
          event_id: string;
          team_name: string;
          leader_id: string;
          is_leader: boolean;
          full_name: string | null;
          email: string;
          prn: string | null;
          student_class: string | null;
          college: string | null;
          year: string | null;
          avatar_url: string | null;
        };
        Relationships: [];
      };

      /** Every visible event, with true seat counts and the viewer's own position. */
      event_board: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          min_team_size: number;
          max_team_size: number;
          max_teams: number;
          price_inr: number;
          registration_start: string;
          registration_end: string;
          event_start: string;
          event_end: string;
          status: EventStatus;
          created_at: string;
          seats_taken: number;
          seats_left: number;
          registration_open: boolean;
          can_participate: boolean;
          is_organiser: boolean;
          my_team_id: string | null;
          my_team_name: string | null;
          my_team_status: TeamStatus | null;
          my_member_status: MemberStatus | null;
          my_is_leader: boolean | null;
        };
        Relationships: [];
      };

      my_invitations: {
        Row: {
          member_id: string;
          invited_at: string;
          team_id: string;
          team_name: string;
          event_id: string;
          event_name: string;
          min_team_size: number;
          max_team_size: number;
          price_inr: number;
          registration_end: string;
          leader_name: string | null;
          leader_email: string;
        };
        Relationships: [];
      };

      admin_directory: {
        Row: {
          user_id: string;
          admin_type: AdminType;
          created_at: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          added_by_name: string | null;
        };
        Relationships: [];
      };

      organiser_directory: {
        Row: {
          event_id: string;
          user_id: string;
          created_at: string;
          event_name: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          assigned_by_name: string | null;
        };
        Relationships: [];
      };

      registration_board: {
        Row: {
          registration_id: string;
          event_id: string;
          event_name: string;
          team_id: string;
          team_name: string;
          status: RegistrationStatus;
          amount_inr: number;
          registered_at: string | null;
          created_at: string;
          leader_id: string;
          leader_name: string | null;
          leader_email: string;
          leader_prn: string | null;
          accepted_members: number;
          payment_status: PaymentStatus | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          paid_at: string | null;
        };
        Relationships: [];
      };

      audit_feed: {
        Row: {
          id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
          actor_id: string | null;
          actor_name: string | null;
          actor_email: string | null;
        };
        Relationships: [];
      };

      /** Reads public.certificates, the one certificate store. */
      student_achievement_summary: {
        Row: {
          student_id: string;
          full_name: string | null;
          email: string;
          prn: string | null;
          phone: string | null;
          college: string | null;
          year: string | null;
          student_class: string | null;
          certificates: number;
          participated: number;
          first_place: number;
          second_place: number;
          third_place: number;
          verified_certificates: number;
          prize_money_inr: number;
        };
        Relationships: [];
      };

      monthly_certificate_analytics: {
        Row: {
          upload_month: string;
          total_certificates: number;
          unique_students: number;
          participation_count: number;
          first_place_count: number;
          second_place_count: number;
          third_place_count: number;
          verified_count: number;
          prize_money_inr: number;
        };
        Relationships: [];
      };

      event_participation_analytics: {
        Row: {
          event_id: string;
          event_name: string;
          status: EventStatus;
          min_team_size: number;
          max_team_size: number;
          max_teams: number;
          price_inr: number;
          registered_teams: number;
          teams_awaiting_payment: number;
          registered_students: number;
          collected_inr: number;
        };
        Relationships: [];
      };

      recent_achievement_highlights: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string | null;
          email: string;
          prn: string | null;
          college: string | null;
          year: string | null;
          event_name: string;
          contribution: "participation" | "third" | "second" | "first";
          prize_amount_inr: number | null;
          verified: boolean;
          drive_link: string;
          created_at: string;
        };
        Relationships: [];
      };
    };

    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_committee_admin: { Args: Record<string, never>; Returns: boolean };
      is_teacher_admin: { Args: Record<string, never>; Returns: boolean };
      is_event_organiser: { Args: { p_event_id: string }; Returns: boolean };
      can_participate_in_event: { Args: { p_event_id: string }; Returns: boolean };
      is_team_leader: { Args: { p_team_id: string }; Returns: boolean };
      is_team_member: { Args: { p_team_id: string }; Returns: boolean };
      is_approved_student_email: { Args: { p_email: string }; Returns: boolean };

      create_team: { Args: { p_event_id: string; p_team_name: string }; Returns: string };
      invite_team_member: { Args: { p_team_id: string; p_email: string }; Returns: string };
      accept_team_invitation: { Args: { p_team_member_id: string }; Returns: undefined };
      reject_team_invitation: { Args: { p_team_member_id: string }; Returns: undefined };
      remove_team_member: { Args: { p_team_member_id: string }; Returns: undefined };
      team_is_ready: { Args: { p_team_id: string }; Returns: boolean };
      register_team: { Args: { p_team_id: string }; Returns: string };

      create_payment_record: {
        Args: { p_registration_id: string; p_razorpay_order_id: string };
        Returns: string;
      };

      /** Service role only. Never callable from a signed-in session. */
      confirm_razorpay_payment: {
        Args: {
          p_registration_id: string;
          p_razorpay_payment_id: string;
          p_razorpay_order_id: string;
          p_razorpay_signature: string;
        };
        Returns: undefined;
      };

      add_committee_admin: { Args: { p_user_id: string }; Returns: undefined };
      add_teacher_admin: { Args: { p_user_id: string }; Returns: undefined };
      remove_admin: { Args: { p_user_id: string }; Returns: undefined };
      assign_event_organiser: { Args: { p_event_id: string; p_user_id: string }; Returns: undefined };
      remove_event_organiser: { Args: { p_event_id: string; p_user_id: string }; Returns: undefined };

      create_event: {
        Args: {
          p_name: string;
          p_description: string | null;
          p_min_team_size: number;
          p_max_team_size: number;
          p_max_teams: number;
          p_price_inr: number;
          p_registration_start: string;
          p_registration_end: string;
          p_event_start: string;
          p_event_end: string;
        };
        Returns: string;
      };

      update_event: {
        Args: {
          p_event_id: string;
          p_name: string;
          p_description: string | null;
          p_min_team_size: number;
          p_max_team_size: number;
          p_max_teams: number;
          p_price_inr: number;
          p_registration_start: string;
          p_registration_end: string;
          p_event_start: string;
          p_event_end: string;
          p_status: EventStatus;
        };
        Returns: undefined;
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type EmsSchema = EmsDatabase["ems"];

export type EmsTables<T extends keyof EmsSchema["Tables"]> = EmsSchema["Tables"][T]["Row"];
export type EmsViews<T extends keyof EmsSchema["Views"]> = EmsSchema["Views"][T]["Row"];

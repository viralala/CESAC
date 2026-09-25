/**
 * Generated from the live schema. Do not hand-edit.
 *
 * Regenerate after every migration so the app cannot drift from the database:
 *   npm run db:types
 *
 * Regenerated in full on 22 September 2026, which cleared the two blocks of
 * hand-written lines that used to sit here: the event-system functions from
 * 19 September and everything the student-records migrations added on the
 * 21st. Both were written by hand because generating needed a login only the
 * account holder has; both now match what the generator emits, which is the
 * check that they were right.
 *
 * This regeneration also carries the verifier: the fourth value on app_role,
 * and verify_record, admin_create_verifier, admin_set_verifier_password,
 * admin_remove_verifier, admin_verifiers and is_verifier, and answer_question,
 * which both consoles write a reply through.
 *
 * The lines for 20260925_profiles_photos_owner.sql were added by hand, the
 * way the 19 and 21 September ones first were: profiles.photo_path, the
 * profile columns on roster_people, roster_private, the schedule columns on
 * dept_events, and the functions that migration adds. Regenerate once it is
 * applied and the diff should be empty.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_emails_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_grants: {
        Row: {
          caps: string[]
          granted_by: string | null
          note: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          caps?: string[]
          granted_by?: string | null
          note?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          caps?: string[]
          granted_by?: string | null
          note?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          id: number
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: number
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: number
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_files: {
        Row: {
          certificate_id: string
          created_at: string
          drive_file_id: string
          drive_link: string
          file_name: string
          id: string
          mime_type: string
          owner_id: string
          size_bytes: number
          slot: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          drive_file_id: string
          drive_link: string
          file_name: string
          id?: string
          mime_type: string
          owner_id: string
          size_bytes: number
          slot: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          drive_file_id?: string
          drive_link?: string
          file_name?: string
          id?: string
          mime_type?: string
          owner_id?: string
          size_bytes?: number
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_files_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          chapter_name: string | null
          contribution: Database["public"]["Enums"]["certificate_contribution"]
          created_at: string
          drive_file_id: string | null
          drive_link: string | null
          e_journal: boolean | null
          edition: string | null
          entered_by: string | null
          event_name: string
          file_name: string | null
          happened_on: string | null
          id: string
          impact_factor: number | null
          indexing: string | null
          is_edited: boolean | null
          isbn_issn: string | null
          kind: Database["public"]["Enums"]["achievement_kind"]
          level: Database["public"]["Enums"]["achievement_level"] | null
          location: string | null
          mime_type: string | null
          owner_id: string
          page_numbers: string | null
          peer_reviewed: boolean | null
          place_of_publication: string | null
          primary_author: string | null
          prize_amount_inr: number | null
          publication_year: number | null
          publisher: string | null
          quartile: string | null
          secondary_authors: string | null
          size_bytes: number | null
          specialization: string | null
          venue_name: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          volume: string | null
        }
        Insert: {
          chapter_name?: string | null
          contribution?: Database["public"]["Enums"]["certificate_contribution"]
          created_at?: string
          drive_file_id?: string | null
          drive_link?: string | null
          e_journal?: boolean | null
          edition?: string | null
          entered_by?: string | null
          event_name: string
          file_name?: string | null
          happened_on?: string | null
          id?: string
          impact_factor?: number | null
          indexing?: string | null
          is_edited?: boolean | null
          isbn_issn?: string | null
          kind?: Database["public"]["Enums"]["achievement_kind"]
          level?: Database["public"]["Enums"]["achievement_level"] | null
          location?: string | null
          mime_type?: string | null
          owner_id: string
          page_numbers?: string | null
          peer_reviewed?: boolean | null
          place_of_publication?: string | null
          primary_author?: string | null
          prize_amount_inr?: number | null
          publication_year?: number | null
          publisher?: string | null
          quartile?: string | null
          secondary_authors?: string | null
          size_bytes?: number | null
          specialization?: string | null
          venue_name?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          volume?: string | null
        }
        Update: {
          chapter_name?: string | null
          contribution?: Database["public"]["Enums"]["certificate_contribution"]
          created_at?: string
          drive_file_id?: string | null
          drive_link?: string | null
          e_journal?: boolean | null
          edition?: string | null
          entered_by?: string | null
          event_name?: string
          file_name?: string | null
          happened_on?: string | null
          id?: string
          impact_factor?: number | null
          indexing?: string | null
          is_edited?: boolean | null
          isbn_issn?: string | null
          kind?: Database["public"]["Enums"]["achievement_kind"]
          level?: Database["public"]["Enums"]["achievement_level"] | null
          location?: string | null
          mime_type?: string | null
          owner_id?: string
          page_numbers?: string | null
          peer_reviewed?: boolean | null
          place_of_publication?: string | null
          primary_author?: string | null
          prize_amount_inr?: number | null
          publication_year?: number | null
          publisher?: string | null
          quartile?: string | null
          secondary_authors?: string | null
          size_bytes?: number | null
          specialization?: string | null
          venue_name?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          allow_edit_after_submit: boolean
          closes_at: string | null
          cut_from: number | null
          cut_to: number | null
          deliver: string
          id: string
          idx: string
          jp: string | null
          locked_at: string | null
          max_points: number
          numeral: string
          opens_at: string | null
          pop: string
          position: number
          state: Database["public"]["Enums"]["chapter_state"]
          task: string
          title: string
          tools: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          allow_edit_after_submit?: boolean
          closes_at?: string | null
          cut_from?: number | null
          cut_to?: number | null
          deliver: string
          id: string
          idx: string
          jp?: string | null
          locked_at?: string | null
          max_points?: number
          numeral: string
          opens_at?: string | null
          pop: string
          position: number
          state?: Database["public"]["Enums"]["chapter_state"]
          task: string
          title: string
          tools?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          allow_edit_after_submit?: boolean
          closes_at?: string | null
          cut_from?: number | null
          cut_to?: number | null
          deliver?: string
          id?: string
          idx?: string
          jp?: string | null
          locked_at?: string | null
          max_points?: number
          numeral?: string
          opens_at?: string | null
          pop?: string
          position?: number
          state?: Database["public"]["Enums"]["chapter_state"]
          task?: string
          title?: string
          tools?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      dept_events: {
        Row: {
          all_day: boolean
          created_at: string
          ends_at: string | null
          fee_inr: number
          href: string | null
          jp: string | null
          kicker: string
          name: string
          one_liner: string
          position: number
          slug: string
          starts_at: string | null
          state: Database["public"]["Enums"]["dept_event_state"]
          team_size: number
          updated_at: string
          updated_by: string | null
          venue: string | null
          when_label: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          ends_at?: string | null
          fee_inr?: number
          href?: string | null
          jp?: string | null
          kicker: string
          name: string
          one_liner: string
          position?: number
          slug: string
          starts_at?: string | null
          state?: Database["public"]["Enums"]["dept_event_state"]
          team_size?: number
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          when_label: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          ends_at?: string | null
          fee_inr?: number
          href?: string | null
          jp?: string | null
          kicker?: string
          name?: string
          one_liner?: string
          position?: number
          slug?: string
          starts_at?: string | null
          state?: Database["public"]["Enums"]["dept_event_state"]
          team_size?: number
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          when_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "dept_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_slug: string
          id: string
          partner_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["registration_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          event_slug: string
          id?: string
          partner_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          student_id: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          event_slug?: string
          id?: string
          partner_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_slug_fkey"
            columns: ["event_slug"]
            isOneToOne: false
            referencedRelation: "dept_events"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "event_registrations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: number
          ip: string | null
          succeeded: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: never
          ip?: string | null
          succeeded: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: never
          ip?: string | null
          succeeded?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          note: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          reference: string | null
          rejected_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string | null
          team_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_inr?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reference?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
          team_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_inr?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          note?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reference?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
          team_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string
          drive_folder_id: string | null
          email: string
          full_name: string | null
          id: string
          must_change_password: boolean
          phone: string | null
          photo_path: string | null
          prn: string | null
          role: Database["public"]["Enums"]["app_role"]
          showcase_opt_out: boolean
          student_class: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          drive_folder_id?: string | null
          email: string
          full_name?: string | null
          id: string
          must_change_password?: boolean
          phone?: string | null
          photo_path?: string | null
          prn?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          showcase_opt_out?: boolean
          student_class?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          drive_folder_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          phone?: string | null
          photo_path?: string | null
          prn?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          showcase_opt_out?: boolean
          student_class?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      queries: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          author_id: string
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["query_status"]
          subject: string
          topic: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          author_id: string
          body: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["query_status"]
          subject: string
          topic: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["query_status"]
          subject?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_groups: {
        Row: {
          accent: string | null
          id: string
          index_label: string | null
          jp: string | null
          kind: string
          position: number
          remit: string | null
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          accent?: string | null
          id: string
          index_label?: string | null
          jp?: string | null
          kind: string
          position?: number
          remit?: string | null
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          accent?: string | null
          id?: string
          index_label?: string | null
          jp?: string | null
          kind?: string
          position?: number
          remit?: string | null
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      roster_people: {
        Row: {
          about: string | null
          fun_fact: string | null
          github: string | null
          group_id: string
          hobbies: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          photo_url: string | null
          position: number
          preferred_name: string | null
          rank: string | null
          role: string | null
          slug: string | null
          tagline: string | null
          tenure: string | null
          updated_at: string
          visible: boolean
          year_branch: string | null
        }
        Insert: {
          about?: string | null
          fun_fact?: string | null
          github?: string | null
          group_id: string
          hobbies?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          photo_url?: string | null
          position?: number
          preferred_name?: string | null
          rank?: string | null
          role?: string | null
          slug?: string | null
          tagline?: string | null
          tenure?: string | null
          updated_at?: string
          visible?: boolean
          year_branch?: string | null
        }
        Update: {
          about?: string | null
          fun_fact?: string | null
          github?: string | null
          group_id?: string
          hobbies?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          photo_url?: string | null
          position?: number
          preferred_name?: string | null
          rank?: string | null
          role?: string | null
          slug?: string | null
          tagline?: string | null
          tenure?: string | null
          updated_at?: string
          visible?: boolean
          year_branch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_people_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "roster_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_private: {
        Row: {
          email: string | null
          person_id: string
          updated_at: string
        }
        Insert: {
          email?: string | null
          person_id: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_private_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "roster_people"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          judged_by: string | null
          notes: string | null
          points: number
          team_id: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          judged_by?: string | null
          notes?: string | null
          points: number
          team_id: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          judged_by?: string | null
          notes?: string | null
          points?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_judged_by_fkey"
            columns: ["judged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring: {
        Row: {
          band: string
          hint: string | null
          key: string
          label: string
          points: number
          position: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          band: string
          hint?: string | null
          key: string
          label: string
          points?: number
          position?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          band?: string
          hint?: string | null
          key?: string
          label?: string
          points?: number
          position?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          announcement: string | null
          entry_fee_inr: number
          id: number
          leaderboard_public: boolean
          online_payment: boolean
          registration_open: boolean
          seats_cap: number
          showcase_public: boolean
          updated_at: string
          updated_by: string | null
          upi_id: string | null
          upi_payee_name: string | null
        }
        Insert: {
          announcement?: string | null
          entry_fee_inr?: number
          id?: number
          leaderboard_public?: boolean
          online_payment?: boolean
          registration_open?: boolean
          seats_cap?: number
          showcase_public?: boolean
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
          upi_payee_name?: string | null
        }
        Update: {
          announcement?: string | null
          entry_fee_inr?: number
          id?: number
          leaderboard_public?: boolean
          online_payment?: boolean
          registration_open?: boolean
          seats_cap?: number
          showcase_public?: boolean
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
          upi_payee_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_categories: {
        Row: {
          blurb: string
          id: string
          metric: string
          position: number
          slots: number
          title: string
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          blurb?: string
          id: string
          metric: string
          position?: number
          slots?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          blurb?: string
          id?: string
          metric?: string
          position?: number
          slots?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "showcase_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_picks: {
        Row: {
          category_id: string
          created_at: string
          note: string | null
          position: number
          student_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          note?: string | null
          position?: number
          student_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          note?: string | null
          position?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_picks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "showcase_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_picks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_text: {
        Row: {
          hint: string | null
          key: string
          label: string
          multiline: boolean
          position: number
          section: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          hint?: string | null
          key: string
          label: string
          multiline?: boolean
          position?: number
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          hint?: string | null
          key?: string
          label?: string
          multiline?: boolean
          position?: number
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_text_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime: string | null
          original_name: string | null
          size_bytes: number | null
          storage_path: string
          submission_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          original_name?: string | null
          size_bytes?: number | null
          storage_path: string
          submission_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          original_name?: string | null
          size_bytes?: number | null
          storage_path?: string
          submission_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          locked_at: string | null
          payload: Json
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          team_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          locked_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          team_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          locked_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          team_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string
          created_at: string
          eliminated_at: string | null
          eliminated_at_chapter: string | null
          id: string
          invite_code: string
          name: string
          note: string | null
          partner_email: string | null
          partner_id: string | null
          partner_name: string | null
          registered_at: string | null
          seat: number | null
          status: Database["public"]["Enums"]["team_status"]
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          captain_id: string
          created_at?: string
          eliminated_at?: string | null
          eliminated_at_chapter?: string | null
          id?: string
          invite_code: string
          name: string
          note?: string | null
          partner_email?: string | null
          partner_id?: string | null
          partner_name?: string | null
          registered_at?: string | null
          seat?: number | null
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          captain_id?: string
          created_at?: string
          eliminated_at?: string | null
          eliminated_at_chapter?: string | null
          id?: string
          invite_code?: string
          name?: string
          note?: string | null
          partner_email?: string | null
          partner_id?: string | null
          partner_name?: string | null
          registered_at?: string | null
          seat?: number | null
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_eliminated_chapter_fk"
            columns: ["eliminated_at_chapter"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          chapters_scored: number | null
          eliminated_at: string | null
          eliminated_at_chapter: string | null
          name: string | null
          seat: number | null
          status: Database["public"]["Enums"]["team_status"] | null
          team_id: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_eliminated_chapter_fk"
            columns: ["eliminated_at_chapter"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      achievement_points: {
        Args: {
          p_contribution: Database["public"]["Enums"]["certificate_contribution"]
          p_kind: Database["public"]["Enums"]["achievement_kind"]
          p_level: Database["public"]["Enums"]["achievement_level"]
        }
        Returns: number
      }
      admin_apply_cut: { Args: { p_chapter_id: string }; Returns: number }
      admin_can: { Args: { p_cap: string }; Returns: boolean }
      admin_caps_all: { Args: never; Returns: string[] }
      admin_clear_grants: { Args: { p_profile_id: string }; Returns: undefined }
      admin_clear_photo: { Args: { p_profile_id: string }; Returns: undefined }
      admin_create_verifier: {
        Args: { p_email: string; p_name?: string; p_password: string }
        Returns: string
      }
      admin_delete_certificate: { Args: { p_id: string }; Returns: undefined }
      admin_delete_roster_group: { Args: { p_id: string }; Returns: undefined }
      admin_delete_roster_person: { Args: { p_id: string }; Returns: undefined }
      admin_delete_showcase_category: {
        Args: { p_id: string }
        Returns: undefined
      }
      admin_mark_paid_offline: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"]
          p_reference?: string
          p_team_id: string
        }
        Returns: undefined
      }
      admin_remove_showcase_pick: {
        Args: { p_category_id: string; p_student_id: string }
        Returns: undefined
      }
      admin_remove_verifier: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      admin_restore_team: { Args: { p_team_id: string }; Returns: undefined }
      admin_save_roster_profile: {
        Args: {
          p_about?: string
          p_email?: string
          p_fun_fact?: string
          p_github?: string
          p_hobbies?: string
          p_id: string
          p_instagram?: string
          p_linkedin?: string
          p_photo_url?: string
          p_preferred_name?: string
          p_slug?: string
          p_tagline?: string
          p_tenure?: string
          p_year_branch?: string
        }
        Returns: string
      }
      admin_score_team: {
        Args: {
          p_chapter_id: string
          p_notes?: string
          p_points: number
          p_team_id: string
        }
        Returns: undefined
      }
      admin_set_chapter_state: {
        Args: {
          p_chapter_id: string
          p_state: Database["public"]["Enums"]["chapter_state"]
        }
        Returns: undefined
      }
      admin_set_entry_status: {
        Args: {
          p_registration_id: string
          p_status: Database["public"]["Enums"]["registration_status"]
        }
        Returns: undefined
      }
      admin_set_event_schedule: {
        Args: {
          p_all_day?: boolean
          p_ends_at?: string
          p_slug: string
          p_starts_at?: string
          p_venue?: string
        }
        Returns: undefined
      }
      admin_set_event_state: {
        Args: {
          p_slug: string
          p_state: Database["public"]["Enums"]["dept_event_state"]
        }
        Returns: undefined
      }
      admin_set_grants: {
        Args: { p_caps: string[]; p_note?: string; p_profile_id: string }
        Returns: undefined
      }
      admin_set_password: {
        Args: { p_email: string; p_must_change?: boolean; p_password: string }
        Returns: string
      }
      admin_set_points: {
        Args: { p_key: string; p_points: number }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          p_profile_id: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      admin_set_showcase_pick: {
        Args: {
          p_category_id: string
          p_note?: string
          p_position?: number
          p_student_id: string
        }
        Returns: undefined
      }
      admin_set_site_text: {
        Args: { p_key: string; p_value: string }
        Returns: undefined
      }
      admin_set_verifier_password: {
        Args: { p_password: string; p_profile_id: string }
        Returns: undefined
      }
      admin_upsert_dept_event: {
        Args: {
          p_fee_inr: number
          p_href?: string
          p_jp?: string
          p_kicker: string
          p_name: string
          p_one_liner: string
          p_position: number
          p_slug: string
          p_team_size: number
          p_when_label: string
        }
        Returns: string
      }
      admin_upsert_roster_group: {
        Args: {
          p_accent?: string
          p_id: string
          p_index_label?: string
          p_jp?: string
          p_kind: string
          p_position?: number
          p_remit?: string
          p_title: string
          p_visible?: boolean
        }
        Returns: string
      }
      admin_upsert_roster_person: {
        Args: {
          p_group_id?: string
          p_id?: string
          p_name?: string
          p_position?: number
          p_rank?: string
          p_role?: string
          p_visible?: boolean
        }
        Returns: string
      }
      admin_upsert_showcase_category: {
        Args: {
          p_blurb: string
          p_id: string
          p_metric: string
          p_position?: number
          p_slots?: number
          p_title: string
          p_visible?: boolean
        }
        Returns: string
      }
      admin_verifiers: {
        Args: never
        Returns: {
          checked: number
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      admin_verify_event_payment: {
        Args: {
          p_reason?: string
          p_registration_id: string
          p_verified: boolean
        }
        Returns: undefined
      }
      admin_verify_payment: {
        Args: { p_reason?: string; p_team_id: string; p_verified: boolean }
        Returns: undefined
      }
      answer_question: {
        Args: { p_answer: string; p_query_id: string }
        Returns: undefined
      }
      audit: {
        Args: {
          p_action: string
          p_detail?: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      certificate_points: {
        Args: { c: Database["public"]["Enums"]["certificate_contribution"] }
        Returns: number
      }
      change_event_partner: {
        Args: { p_partner_email: string; p_registration_id: string }
        Returns: undefined
      }
      complete_password_change: { Args: never; Returns: undefined }
      confirm_event_razorpay_payment: {
        Args: { p_order_id: string; p_payment_id: string; p_signature: string }
        Returns: string
      }
      create_team: {
        Args: {
          p_name: string
          p_partner_email?: string
          p_partner_name?: string
        }
        Returns: string
      }
      dept_event_states: {
        Args: never
        Returns: {
          slug: string
          state: string
        }[]
      }
      event_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_verifier: { Args: never; Returns: boolean }
      join_team: { Args: { p_code: string }; Returns: string }
      leaderboard_is_public: { Args: never; Returns: boolean }
      leave_team: { Args: never; Returns: undefined }
      event_schedule: {
        Args: never
        Returns: {
          all_day: boolean
          ends_at: string
          slug: string
          starts_at: string
          venue: string
        }[]
      }
      login_attempt_record: {
        Args: { p_email: string; p_ip: string; p_ok: boolean }
        Returns: undefined
      }
      login_throttle_check: {
        Args: { p_email: string; p_ip: string }
        Returns: number
      }
      my_admin_caps: { Args: never; Returns: string[] }
      my_standing: {
        Args: never
        Returns: {
          certificates: number
          place: number
          points: number
          prize_total_inr: number
          ranked_students: number
        }[]
      }
      my_team_id: { Args: never; Returns: string }
      new_invite_code: { Args: never; Returns: string }
      ranking_board: {
        Args: { p_limit?: number }
        Returns: {
          certificates: number
          name: string
          photo: string
          place: number
          points: number
          student_id: string
          year: string
        }[]
      }
      record_razorpay_payment: {
        Args: { p_order_id: string; p_payment_id: string }
        Returns: undefined
      }
      refresh_team_status: { Args: { p_team_id: string }; Returns: undefined }
      register_for_event: {
        Args: { p_partner_email?: string; p_slug: string }
        Returns: string
      }
      registration_is_open: { Args: never; Returns: boolean }
      roster_photos: {
        Args: never
        Returns: {
          person_id: string
          photo: string
        }[]
      }
      roster_slugify: { Args: { p: string }; Returns: string }
      showcase_board: {
        Args: never
        Returns: {
          category_blurb: string
          category_id: string
          category_position: number
          category_title: string
          metric: string
          name: string
          note: string
          place: number
          student_id: string
          value: number
          year: string
        }[]
      }
      standouts_board: {
        Args: never
        Returns: {
          category_blurb: string
          category_id: string
          category_position: number
          category_title: string
          metric: string
          name: string
          note: string
          photo: string
          place: number
          seq: number
          slots: number
          student_id: string
          value: number
          year: string
        }[]
      }
      start_event_razorpay_order: {
        Args: { p_order_id: string; p_registration_id: string }
        Returns: undefined
      }
      start_razorpay_order: { Args: { p_order_id: string }; Returns: undefined }
      submit_chapter: { Args: { p_chapter_id: string }; Returns: undefined }
      submit_event_payment: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"]
          p_reference: string
          p_registration_id: string
        }
        Returns: undefined
      }
      submit_payment_reference: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_reference: string
        }
        Returns: undefined
      }
      verify_record: {
        Args: { p_certificate_id: string; p_decision: string }
        Returns: undefined
      }
      withdraw_event_entry: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
    }
    Enums: {
      achievement_kind:
        | "event"
        | "journal"
        | "conference"
        | "book"
        | "book_chapter"
      achievement_level:
        | "international"
        | "national"
        | "state"
        | "zonal"
        | "institute"
        | "other"
      app_role: "participant" | "admin" | "owner" | "verifier"
      certificate_contribution: "participation" | "third" | "second" | "first"
      chapter_state: "locked" | "open" | "closed" | "graded"
      dept_event_state: "locked" | "open" | "closed"
      payment_method: "razorpay" | "upi" | "cash" | "waived"
      payment_status: "pending" | "submitted" | "verified" | "rejected"
      query_status: "open" | "answered" | "closed"
      registration_status: "registered" | "withdrawn"
      submission_status: "draft" | "submitted" | "locked"
      team_status: "forming" | "registered" | "withdrawn" | "disqualified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_kind: [
        "event",
        "journal",
        "conference",
        "book",
        "book_chapter",
      ],
      achievement_level: [
        "international",
        "national",
        "state",
        "zonal",
        "institute",
        "other",
      ],
      app_role: ["participant", "admin", "owner", "verifier"],
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
} as const

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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_slots: {
        Row: {
          court_id: string
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          court_id: string
          created_at?: string
          created_by: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          court_id?: string
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_by: Database["public"]["Enums"]["booked_by_type"]
          cancelled_at: string | null
          club_id: string
          court_id: string
          created_at: string
          date: string
          duration_minutes: number
          end_time: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booked_by: Database["public"]["Enums"]["booked_by_type"]
          cancelled_at?: string | null
          club_id: string
          court_id: string
          created_at?: string
          date: string
          duration_minutes: number
          end_time: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booked_by?: Database["public"]["Enums"]["booked_by_type"]
          cancelled_at?: string | null
          club_id?: string
          court_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          end_time?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_amenities: {
        Row: {
          amenity: Database["public"]["Enums"]["amenity_type"]
          club_id: string
          id: string
        }
        Insert: {
          amenity: Database["public"]["Enums"]["amenity_type"]
          club_id: string
          id?: string
        }
        Update: {
          amenity?: Database["public"]["Enums"]["amenity_type"]
          club_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_amenities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_images: {
        Row: {
          club_id: string
          created_at: string
          id: string
          image_url: string
          position: number
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          image_url: string
          position?: number
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          image_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_images_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address_city: string
          address_country: string
          address_country_code: string | null
          address_postal_code: string | null
          address_street: string
          booking_mode: Database["public"]["Enums"]["booking_mode_type"]
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_published: boolean
          latitude: number | null
          longitude: number | null
          max_booking_advance_days: number
          min_booking_lead_minutes: number
          name: string
          owner_id: string | null
          phone: string | null
          slug: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address_city: string
          address_country?: string
          address_country_code?: string | null
          address_postal_code?: string | null
          address_street: string
          booking_mode?: Database["public"]["Enums"]["booking_mode_type"]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          max_booking_advance_days?: number
          min_booking_lead_minutes?: number
          name: string
          owner_id?: string | null
          phone?: string | null
          slug: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_city?: string
          address_country?: string
          address_country_code?: string | null
          address_postal_code?: string | null
          address_street?: string
          booking_mode?: Database["public"]["Enums"]["booking_mode_type"]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          max_booking_advance_days?: number
          min_booking_lead_minutes?: number
          name?: string
          owner_id?: string | null
          phone?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      court_closures: {
        Row: {
          affected_booking_count: number
          court_id: string
          created_at: string
          created_by: string
          end_date: string
          id: string
          notify_affected: boolean
          reason: string
          start_date: string
        }
        Insert: {
          affected_booking_count?: number
          court_id: string
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          notify_affected?: boolean
          reason: string
          start_date: string
        }
        Update: {
          affected_booking_count?: number
          court_id?: string
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          notify_affected?: boolean
          reason?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_closures_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      court_pricing_rules: {
        Row: {
          court_id: string
          day_of_week: number | null
          end_time: string
          id: string
          price_per_hour: number
          start_time: string
        }
        Insert: {
          court_id: string
          day_of_week?: number | null
          end_time: string
          id?: string
          price_per_hour: number
          start_time: string
        }
        Update: {
          court_id?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          price_per_hour?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_pricing_rules_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          club_id: string
          created_at: string
          id: string
          is_active: boolean
          is_indoor: boolean
          max_players: number | null
          name: string
          price_per_hour: number
          sport_type: Database["public"]["Enums"]["sport_type"]
          surface_type: Database["public"]["Enums"]["surface_type"] | null
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_indoor?: boolean
          max_players?: number | null
          name: string
          price_per_hour: number
          sport_type: Database["public"]["Enums"]["sport_type"]
          surface_type?: Database["public"]["Enums"]["surface_type"] | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_indoor?: boolean
          max_players?: number | null
          name?: string
          price_per_hour?: number
          sport_type?: Database["public"]["Enums"]["sport_type"]
          surface_type?: Database["public"]["Enums"]["surface_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_clubs: {
        Row: {
          club_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_clubs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          close_time: string
          club_id: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string
        }
        Insert: {
          close_time: string
          club_id: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time: string
        }
        Update: {
          close_time?: string
          club_id?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_court_closure: {
        Args: {
          p_court_id: string
          p_end_date: string
          p_notify?: boolean
          p_reason: string
          p_start_date: string
        }
        Returns: Json
      }
      get_available_slots: {
        Args: { p_court_id: string; p_date: string }
        Returns: {
          duration_minutes: number
          end_time: string
          price: number
          start_time: string
          status: string
        }[]
      }
      get_club_availability: {
        Args: { p_club_id: string; p_date: string; p_sport_type?: string }
        Returns: {
          court_id: string
          court_name: string
          court_sport_type: Database["public"]["Enums"]["sport_type"]
          court_surface_type: Database["public"]["Enums"]["surface_type"]
          is_indoor: boolean
          slot_duration_minutes: number
          slot_end_time: string
          slot_price: number
          slot_start_time: string
          slot_status: string
        }[]
      }
    }
    Enums: {
      amenity_type:
        | "parking"
        | "free_parking"
        | "changing_room"
        | "showers"
        | "lockers"
        | "wifi"
        | "cafeteria"
        | "restaurant"
        | "equipment_rental"
        | "store"
        | "disabled_access"
        | "lighting"
        | "covered"
        | "air_conditioning"
        | "heating"
      booked_by_type: "player" | "club_owner" | "admin"
      booking_mode_type: "owner_only" | "self_service"
      booking_status: "confirmed" | "cancelled" | "completed" | "no_show"
      payment_status: "pending" | "paid"
      sport_type:
        | "football"
        | "basketball"
        | "tennis"
        | "padel"
        | "volleyball"
        | "handball"
        | "futsal"
        | "other"
      surface_type:
        | "grass"
        | "artificial_grass"
        | "concrete"
        | "parquet"
        | "clay"
        | "rubber"
        | "sand"
        | "other"
      user_role: "player" | "club_owner" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      amenity_type: [
        "parking",
        "free_parking",
        "changing_room",
        "showers",
        "lockers",
        "wifi",
        "cafeteria",
        "restaurant",
        "equipment_rental",
        "store",
        "disabled_access",
        "lighting",
        "covered",
        "air_conditioning",
        "heating",
      ],
      booked_by_type: ["player", "club_owner", "admin"],
      booking_mode_type: ["owner_only", "self_service"],
      booking_status: ["confirmed", "cancelled", "completed", "no_show"],
      payment_status: ["pending", "paid"],
      sport_type: [
        "football",
        "basketball",
        "tennis",
        "padel",
        "volleyball",
        "handball",
        "futsal",
        "other",
      ],
      surface_type: [
        "grass",
        "artificial_grass",
        "concrete",
        "parquet",
        "clay",
        "rubber",
        "sand",
        "other",
      ],
      user_role: ["player", "club_owner", "admin"],
    },
  },
} as const

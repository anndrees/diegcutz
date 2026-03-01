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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          trigger_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          trigger_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_action_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          target_user_id: string | null
          target_user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancelled_at: string | null
          cancelled_by: string | null
          client_contact: string
          client_name: string
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          is_cancelled: boolean | null
          loyalty_credited: boolean | null
          loyalty_credited_by: string | null
          original_price: number | null
          playlist_url: string | null
          services: Json
          total_price: number
          user_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_contact: string
          client_name: string
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          is_cancelled?: boolean | null
          loyalty_credited?: boolean | null
          loyalty_credited_by?: string | null
          original_price?: number | null
          playlist_url?: string | null
          services?: Json
          total_price?: number
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_contact?: string
          client_name?: string
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          is_cancelled?: boolean | null
          loyalty_credited?: boolean | null
          loyalty_credited_by?: string | null
          original_price?: number | null
          playlist_url?: string | null
          services?: Json
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
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
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_24h: boolean
          is_closed: boolean
          time_ranges: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_24h?: boolean
          is_closed?: boolean
          time_ranges?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_24h?: boolean
          is_closed?: boolean
          time_ranges?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string
          unread_by_admin: boolean
          unread_by_user: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          unread_by_admin?: boolean
          unread_by_user?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string
          unread_by_admin?: boolean
          unread_by_user?: boolean
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          booking_id: string | null
          coupon_id: string
          discount_applied: number
          id: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          coupon_id: string
          discount_applied?: number
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          coupon_id?: string
          discount_applied?: number
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase: number | null
          start_date: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase?: number | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase?: number | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      giveaway_participants: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          excluded_user_ids: string[] | null
          id: string
          instagram_url: string | null
          is_finished: boolean
          prize: string
          requirements: string | null
          start_date: string
          title: string
          updated_at: string
          winner_id: string | null
          winner_name: string | null
          winner_username: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          excluded_user_ids?: string[] | null
          id?: string
          instagram_url?: string | null
          is_finished?: boolean
          prize: string
          requirements?: string | null
          start_date: string
          title: string
          updated_at?: string
          winner_id?: string | null
          winner_name?: string | null
          winner_username?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          excluded_user_ids?: string[] | null
          id?: string
          instagram_url?: string | null
          is_finished?: boolean
          prize?: string
          requirements?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          winner_id?: string | null
          winner_name?: string | null
          winner_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          completed_bookings: number
          created_at: string | null
          free_cuts_available: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_bookings?: number
          created_at?: string | null
          free_cuts_available?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_bookings?: number
          created_at?: string | null
          free_cuts_available?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          body: string
          created_at: string
          error_details: string | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_count: number | null
          status: string
          title: string
          total_subscriptions: number | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error_details?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_count?: number | null
          status?: string
          title: string
          total_subscriptions?: number | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error_details?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_count?: number | null
          status?: string
          title?: string
          total_subscriptions?: number | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_confirmations: boolean
          booking_reminders: boolean
          chat_messages: boolean
          created_at: string
          giveaways: boolean
          id: string
          promotions: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_confirmations?: boolean
          booking_reminders?: boolean
          chat_messages?: boolean
          created_at?: string
          giveaways?: boolean
          id?: string
          promotions?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_confirmations?: boolean
          booking_reminders?: boolean
          chat_messages?: boolean
          created_at?: string
          giveaways?: boolean
          id?: string
          promotions?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      optional_addons: {
        Row: {
          coming_soon: boolean
          created_at: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          coming_soon?: boolean
          created_at?: string
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          coming_soon?: boolean
          created_at?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          contact_value: string | null
          created_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          contact_value?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          contact_value?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_requests_user_id_fkey"
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
          ban_reason: string | null
          banned_at: string | null
          contact_method: string
          contact_value: string
          created_at: string | null
          full_name: string
          id: string
          is_banned: boolean | null
          is_restricted: boolean | null
          loyalty_token: string | null
          profile_complete: boolean | null
          pwa_installed_at: string | null
          restricted_at: string | null
          restriction_ends_at: string | null
          temp_password: string | null
          temp_password_active: boolean | null
          temp_password_created_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          contact_method: string
          contact_value: string
          created_at?: string | null
          full_name: string
          id: string
          is_banned?: boolean | null
          is_restricted?: boolean | null
          loyalty_token?: string | null
          profile_complete?: boolean | null
          pwa_installed_at?: string | null
          restricted_at?: string | null
          restriction_ends_at?: string | null
          temp_password?: string | null
          temp_password_active?: boolean | null
          temp_password_created_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          contact_method?: string
          contact_value?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean | null
          is_restricted?: boolean | null
          loyalty_token?: string | null
          profile_complete?: boolean | null
          pwa_installed_at?: string | null
          restricted_at?: string | null
          restriction_ends_at?: string | null
          temp_password?: string | null
          temp_password_active?: boolean | null
          temp_password_created_at?: string | null
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          coming_soon: boolean
          created_at: string | null
          custom_extras: Json | null
          description: string | null
          id: string
          included_service_ids: string[] | null
          name: string
          price: number
          service_type: string
          updated_at: string | null
        }
        Insert: {
          coming_soon?: boolean
          created_at?: string | null
          custom_extras?: Json | null
          description?: string | null
          id?: string
          included_service_ids?: string[] | null
          name: string
          price: number
          service_type: string
          updated_at?: string | null
        }
        Update: {
          coming_soon?: boolean
          created_at?: string | null
          custom_extras?: Json | null
          description?: string | null
          id?: string
          included_service_ids?: string[] | null
          name?: string
          price?: number
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      special_hours: {
        Row: {
          created_at: string
          date: string
          id: string
          is_closed: boolean
          note: string | null
          time_ranges: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_closed?: boolean
          note?: string | null
          time_ranges?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_closed?: boolean
          note?: string | null
          time_ranges?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string
          awarded_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: { p_code: string; p_total?: number; p_user_id?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

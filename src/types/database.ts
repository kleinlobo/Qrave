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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          restaurant_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          restaurant_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          status: string
          table_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          status?: string
          table_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          status?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_import_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_items: Json
          id: string
          restaurant_id: string
          status: string
          updated_at: string
          uploaded_file_path: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_items?: Json
          id?: string
          restaurant_id: string
          status?: string
          updated_at?: string
          uploaded_file_path: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_items?: Json
          id?: string
          restaurant_id?: string
          status?: string
          updated_at?: string
          uploaded_file_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_import_jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          dietary_tags: string[]
          display_order: number
          id: string
          is_available: boolean
          name: string
          price: number
          restaurant_id: string
          source: string
          thumbnail_url: string | null
          updated_at: string
          video_source: string | null
          video_url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[]
          display_order?: number
          id?: string
          is_available?: boolean
          name: string
          price: number
          restaurant_id: string
          source?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_source?: string | null
          video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[]
          display_order?: number
          id?: string
          is_available?: boolean
          name?: string
          price?: number
          restaurant_id?: string
          source?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_source?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          contributor_session_id: string | null
          edit_history: Json
          id: string
          is_removed: boolean
          item_name_snapshot: string
          menu_item_id: string
          notes: string | null
          order_id: string
          price_snapshot: number
          quantity: number
        }
        Insert: {
          contributor_session_id?: string | null
          edit_history?: Json
          id?: string
          is_removed?: boolean
          item_name_snapshot: string
          menu_item_id: string
          notes?: string | null
          order_id: string
          price_snapshot: number
          quantity: number
        }
        Update: {
          contributor_session_id?: string | null
          edit_history?: Json
          id?: string
          is_removed?: boolean
          item_name_snapshot?: string
          menu_item_id?: string
          notes?: string | null
          order_id?: string
          price_snapshot?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_contributor_session_id_fkey"
            columns: ["contributor_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: string
          delivery_address: string | null
          estimated_total: number
          fulfillment_type: string | null
          group_id: string | null
          id: string
          idempotency_key: string
          restaurant_id: string
          service_amount: number
          service_charge_rate_snapshot: number
          session_id: string
          status: string
          status_history: Json
          submitted_at: string
          subtotal: number
          table_id: string | null
          updated_at: string
          vat_amount: number
          vat_rate_snapshot: number
        }
        Insert: {
          channel: string
          delivery_address?: string | null
          estimated_total?: number
          fulfillment_type?: string | null
          group_id?: string | null
          id?: string
          idempotency_key: string
          restaurant_id: string
          service_amount?: number
          service_charge_rate_snapshot?: number
          session_id: string
          status?: string
          status_history?: Json
          submitted_at?: string
          subtotal?: number
          table_id?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate_snapshot?: number
        }
        Update: {
          channel?: string
          delivery_address?: string | null
          estimated_total?: number
          fulfillment_type?: string | null
          group_id?: string | null
          id?: string
          idempotency_key?: string
          restaurant_id?: string
          service_amount?: number
          service_charge_rate_snapshot?: number
          session_id?: string
          status?: string
          status_history?: Json
          submitted_at?: string
          subtotal?: number
          table_id?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_cache: {
        Row: {
          cache_key: string
          expires_at: string
          generated_at: string
          id: string
          placement: string
          recommended_item_ids: string[]
          restaurant_id: string
        }
        Insert: {
          cache_key: string
          expires_at: string
          generated_at?: string
          id?: string
          placement: string
          recommended_item_ids?: string[]
          restaurant_id: string
        }
        Update: {
          cache_key?: string
          expires_at?: string
          generated_at?: string
          id?: string
          placement?: string
          recommended_item_ids?: string[]
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_cache_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_events: {
        Row: {
          event_type: string
          id: string
          occurred_at: string
          placement: string
          recommended_item_ids: string[]
          restaurant_id: string
          session_id: string | null
          source_item_ids: string[]
        }
        Insert: {
          event_type: string
          id?: string
          occurred_at?: string
          placement: string
          recommended_item_ids?: string[]
          restaurant_id: string
          session_id?: string | null
          source_item_ids?: string[]
        }
        Update: {
          event_type?: string
          id?: string
          occurred_at?: string
          placement?: string
          recommended_item_ids?: string[]
          restaurant_id?: string
          session_id?: string | null
          source_item_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          acknowledged_at: string | null
          id: string
          request_type: string
          requested_at: string
          restaurant_id: string
          scope: string | null
          session_id: string
          table_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          request_type: string
          requested_at?: string
          restaurant_id: string
          scope?: string | null
          session_id: string
          table_id: string
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          request_type?: string
          requested_at?: string
          restaurant_id?: string
          scope?: string | null
          session_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          bill_disclaimer_text: string
          branding: Json
          created_at: string
          currency: string
          delivery_qr_token: string | null
          feature_flags: Json
          group_ordering_enabled: boolean
          id: string
          latitude: number | null
          locale: string
          longitude: number | null
          maintenance_mode: boolean
          name: string
          ordering_channels: Json
          region: string
          region_lock_radius_meters: number
          service_charge_rate: number
          session_expiry_minutes: number
          split_billing_enabled: boolean
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
          vat_rate: number
          venue_type: string
          whatsapp_number: string | null
        }
        Insert: {
          bill_disclaimer_text?: string
          branding?: Json
          created_at?: string
          currency: string
          delivery_qr_token?: string | null
          feature_flags?: Json
          group_ordering_enabled?: boolean
          id?: string
          latitude?: number | null
          locale?: string
          longitude?: number | null
          maintenance_mode?: boolean
          name: string
          ordering_channels?: Json
          region: string
          region_lock_radius_meters?: number
          service_charge_rate?: number
          session_expiry_minutes?: number
          split_billing_enabled?: boolean
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
          vat_rate?: number
          venue_type: string
          whatsapp_number?: string | null
        }
        Update: {
          bill_disclaimer_text?: string
          branding?: Json
          created_at?: string
          currency?: string
          delivery_qr_token?: string | null
          feature_flags?: Json
          group_ordering_enabled?: boolean
          id?: string
          latitude?: number | null
          locale?: string
          longitude?: number | null
          maintenance_mode?: boolean
          name?: string
          ordering_channels?: Json
          region?: string
          region_lock_radius_meters?: number
          service_charge_rate?: number
          session_expiry_minutes?: number
          split_billing_enabled?: boolean
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
          vat_rate?: number
          venue_type?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          channel: string
          created_at: string
          customer_contact: string | null
          customer_name: string | null
          expires_at: string
          group_id: string | null
          id: string
          last_active_at: string
          region_check_status: string | null
          restaurant_id: string
          status: string
          table_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_contact?: string | null
          customer_name?: string | null
          expires_at: string
          group_id?: string | null
          id: string
          last_active_at?: string
          region_check_status?: string | null
          restaurant_id: string
          status?: string
          table_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_contact?: string | null
          customer_name?: string | null
          expires_at?: string
          group_id?: string | null
          id?: string
          last_active_at?: string
          region_check_status?: string | null
          restaurant_id?: string
          status?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string
          restaurant_id: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          name: string
          restaurant_id?: string | null
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string
          restaurant_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          qr_token: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          qr_token: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          qr_token?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_analytics_events: {
        Row: {
          event_type: string
          id: string
          menu_item_id: string
          occurred_at: string
          restaurant_id: string
          session_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          menu_item_id: string
          occurred_at?: string
          restaurant_id: string
          session_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          menu_item_id?: string
          occurred_at?: string
          restaurant_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analytics_events_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_most_ordered_items: {
        Row: {
          menu_item_id: string | null
          name: string | null
          order_count: number | null
          restaurant_id: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recommendation_effectiveness: {
        Row: {
          added_to_cart: number | null
          conversion_rate_pct: number | null
          item_tapped: number | null
          placement: string | null
          restaurant_id: string | null
          shown: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_video_analytics: {
        Row: {
          add_to_cart: number | null
          conversion_rate_pct: number | null
          menu_item_id: string | null
          orders: number | null
          restaurant_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analytics_events_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_extend_trial: {
        Args: { p_new_trial_end: string; p_restaurant_id: string }
        Returns: undefined
      }
      admin_set_feature_flag: {
        Args: { p_flag: string; p_restaurant_id: string; p_value: boolean }
        Returns: undefined
      }
      admin_set_maintenance_mode: {
        Args: { p_restaurant_id: string; p_value: boolean }
        Returns: undefined
      }
      admin_set_subscription_status: {
        Args: { p_note?: string; p_restaurant_id: string; p_status: string }
        Returns: undefined
      }
      cleanup_recommendation_cache: { Args: never; Returns: undefined }
      current_session_restaurant_id: { Args: never; Returns: string }
      current_staff_restaurant_id: { Args: never; Returns: string }
      current_staff_role: { Args: never; Returns: string }
      expire_stale_sessions: { Args: never; Returns: undefined }
      is_manager_for: { Args: { p_restaurant_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_staff_for: { Args: { p_restaurant_id: string }; Returns: boolean }
      join_group: { Args: never; Returns: string }
      submit_order: {
        Args: {
          p_delivery_address?: string
          p_fulfillment_type?: string
          p_idempotency_key: string
          p_items: Json
        }
        Returns: string
      }
      update_order_status: {
        Args: { p_new_status: string; p_order_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

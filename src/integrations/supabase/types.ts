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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      checklist_templates: {
        Row: {
          equipment_type: string
          id: string
          item: string
          sort_order: number
        }
        Insert: {
          equipment_type: string
          id?: string
          item: string
          sort_order?: number
        }
        Update: {
          equipment_type?: string
          id?: string
          item?: string
          sort_order?: number
        }
        Relationships: []
      }
      discounts: {
        Row: {
          amount: number
          created_at: string
          discount_type: string
          id: string
          plate: string
          reason: string | null
          recorded_by: string | null
          site_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          discount_type?: string
          id?: string
          plate: string
          reason?: string | null
          recorded_by?: string | null
          site_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          discount_type?: string
          id?: string
          plate?: string
          reason?: string | null
          recorded_by?: string | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          asset_code: string | null
          created_at: string
          id: string
          name: string
          site_id: string
          sort_order: number
          status: string
          type: string
        }
        Insert: {
          asset_code?: string | null
          created_at?: string
          id?: string
          name: string
          site_id: string
          sort_order?: number
          status?: string
          type: string
        }
        Update: {
          asset_code?: string | null
          created_at?: string
          id?: string
          name?: string
          site_id?: string
          sort_order?: number
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          incident_id: string
          note: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id: string
          note?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          after_photos: string[]
          assigned_at: string | null
          assignee_id: string | null
          category: string
          code: string
          created_at: string
          description: string | null
          equipment_id: string | null
          id: string
          parts_used: string | null
          photos: string[]
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          site_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          after_photos?: string[]
          assigned_at?: string | null
          assignee_id?: string | null
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          parts_used?: string | null
          photos?: string[]
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          site_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          after_photos?: string[]
          assigned_at?: string | null
          assignee_id?: string | null
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          parts_used?: string | null
          photos?: string[]
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          site_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_results: {
        Row: {
          checks: Json
          created_at: string
          equipment_id: string
          id: string
          inspection_id: string
          note: string | null
          photos: string[]
          problem_type: string | null
          status: Database["public"]["Enums"]["check_status"]
        }
        Insert: {
          checks?: Json
          created_at?: string
          equipment_id: string
          id?: string
          inspection_id: string
          note?: string | null
          photos?: string[]
          problem_type?: string | null
          status: Database["public"]["Enums"]["check_status"]
        }
        Update: {
          checks?: Json
          created_at?: string
          equipment_id?: string
          id?: string
          inspection_id?: string
          note?: string | null
          photos?: string[]
          problem_type?: string | null
          status?: Database["public"]["Enums"]["check_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_results_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          inspection_date: string
          inspector_id: string
          note: string | null
          site_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id: string
          note?: string | null
          site_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string
          note?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_hourly: {
        Row: {
          entries: number
          exits: number
          hour: number
          id: string
          pay_exit: number
          pay_kiosk: number
          pay_qr: number
          revenue: number
          site_id: string
          stat_date: string
        }
        Insert: {
          entries?: number
          exits?: number
          hour: number
          id?: string
          pay_exit?: number
          pay_kiosk?: number
          pay_qr?: number
          revenue?: number
          site_id: string
          stat_date: string
        }
        Update: {
          entries?: number
          exits?: number
          hour?: number
          id?: string
          pay_exit?: number
          pay_kiosk?: number
          pay_qr?: number
          revenue?: number
          site_id?: string
          stat_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          employee_code: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          employee_code: string
          full_name?: string
          id: string
          phone?: string | null
          position?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          employee_code?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          active: boolean
          code: number
          created_at: string
          direction: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: number
          created_at?: string
          direction?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: number
          created_at?: string
          direction?: string
          id?: string
          name?: string
        }
        Relationships: []
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
      daily_totals: {
        Args: { _from: string; _to: string }
        Returns: {
          entries: number
          exits: number
          revenue: number
          stat_date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "executive" | "operator" | "technician"
      check_status: "ok" | "problem" | "note"
      incident_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "waiting_parts"
        | "resolved"
        | "closed"
      severity_level: "low" | "medium" | "high" | "critical"
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
      app_role: ["admin", "executive", "operator", "technician"],
      check_status: ["ok", "problem", "note"],
      incident_status: [
        "open",
        "assigned",
        "in_progress",
        "waiting_parts",
        "resolved",
        "closed",
      ],
      severity_level: ["low", "medium", "high", "critical"],
    },
  },
} as const

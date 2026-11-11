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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      car_maintenance_rules: {
        Row: {
          car_id: string
          interval_km: number | null
          interval_months: number | null
          is_enabled: boolean
          maintenance_type_id: string
        }
        Insert: {
          car_id: string
          interval_km?: number | null
          interval_months?: number | null
          is_enabled?: boolean
          maintenance_type_id: string
        }
        Update: {
          car_id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_enabled?: boolean
          maintenance_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_maintenance_rules_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_maintenance_rules_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          created_at: string
          current_mileage: number
          engine_type: Database["public"]["Enums"]["engine_type"]
          id: string
          make: string
          model: string
          owner_id: string
          photo_path: string | null
          plate_number: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          current_mileage?: number
          engine_type: Database["public"]["Enums"]["engine_type"]
          id?: string
          make: string
          model: string
          owner_id?: string
          photo_path?: string | null
          plate_number?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          current_mileage?: number
          engine_type?: Database["public"]["Enums"]["engine_type"]
          id?: string
          make?: string
          model?: string
          owner_id?: string
          photo_path?: string | null
          plate_number?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          car_id: string
          category: Database["public"]["Enums"]["expense_category"]
          comment: string | null
          created_at: string
          id: string
          mileage: number | null
          spent_at: string
        }
        Insert: {
          amount: number
          car_id: string
          category: Database["public"]["Enums"]["expense_category"]
          comment?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          spent_at: string
        }
        Update: {
          amount?: number
          car_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          comment?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          spent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          car_id: string
          created_at: string
          filled_at: string
          id: string
          is_full_tank: boolean
          liters: number
          mileage: number
          price_per_liter: number
          station: string | null
          total_cost: number | null
        }
        Insert: {
          car_id: string
          created_at?: string
          filled_at: string
          id?: string
          is_full_tank?: boolean
          liters: number
          mileage: number
          price_per_liter: number
          station?: string | null
          total_cost?: number | null
        }
        Update: {
          car_id?: string
          created_at?: string
          filled_at?: string
          id?: string
          is_full_tank?: boolean
          liters?: number
          mileage?: number
          price_per_liter?: number
          station?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_types: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          engine_types: Database["public"]["Enums"]["engine_type"][] | null
          id: string
          interval_km: number | null
          interval_months: number | null
          name: string
          owner_id: string | null
          sort_order: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          engine_types?: Database["public"]["Enums"]["engine_type"][] | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          name: string
          owner_id?: string | null
          sort_order?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          engine_types?: Database["public"]["Enums"]["engine_type"][] | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          name?: string
          owner_id?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      mileage_entries: {
        Row: {
          car_id: string
          created_at: string
          id: string
          mileage: number
          recorded_at: string
          source: Database["public"]["Enums"]["mileage_source"]
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          mileage: number
          recorded_at?: string
          source?: Database["public"]["Enums"]["mileage_source"]
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          mileage?: number
          recorded_at?: string
          source?: Database["public"]["Enums"]["mileage_source"]
        }
        Relationships: [
          {
            foreignKeyName: "mileage_entries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      service_record_items: {
        Row: {
          maintenance_type_id: string
          service_record_id: string
        }
        Insert: {
          maintenance_type_id: string
          service_record_id: string
        }
        Update: {
          maintenance_type_id?: string
          service_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_record_items_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_record_items_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          car_id: string
          comment: string | null
          created_at: string
          id: string
          labor_cost: number
          mileage: number
          parts_cost: number
          performed_at: string
          receipt_path: string | null
          service_station: string | null
          title: string | null
          total_cost: number | null
        }
        Insert: {
          car_id: string
          comment?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          mileage: number
          parts_cost?: number
          performed_at: string
          receipt_path?: string | null
          service_station?: string | null
          title?: string | null
          total_cost?: number | null
        }
        Update: {
          car_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          mileage?: number
          parts_cost?: number
          performed_at?: string
          receipt_path?: string | null
          service_station?: string | null
          title?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_records_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_car_owner: { Args: { p_car_id: string }; Returns: boolean }
    }
    Enums: {
      engine_type: "petrol" | "diesel" | "lpg" | "hybrid" | "electric"
      expense_category:
        | "repair"
        | "insurance"
        | "wash"
        | "parking"
        | "tax"
        | "fine"
        | "other"
      mileage_source: "manual" | "service" | "fuel" | "car_created"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      engine_type: ["petrol", "diesel", "lpg", "hybrid", "electric"],
      expense_category: [
        "repair",
        "insurance",
        "wash",
        "parking",
        "tax",
        "fine",
        "other",
      ],
      mileage_source: ["manual", "service", "fuel", "car_created"],
    },
  },
} as const

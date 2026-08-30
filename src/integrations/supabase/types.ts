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
      accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          opening_balance: number
          parent_code: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          opening_balance?: number
          parent_code?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          opening_balance?: number
          parent_code?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          emirates_id: string | null
          id: string
          name: string
          name_ar: string | null
          notes: string | null
          phone: string | null
          trn: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emirates_id?: string | null
          id?: string
          name: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          trn?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emirates_id?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          trn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          description_ar: string | null
          govt_fee: number
          id: string
          invoice_id: string
          qty: number
          service_id: string | null
          sort_order: number
          taxable: boolean
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          description_ar?: string | null
          govt_fee?: number
          id?: string
          invoice_id: string
          qty?: number
          service_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          description_ar?: string | null
          govt_fee?: number
          id?: string
          invoice_id?: string
          qty?: number
          service_id?: string | null
          sort_order?: number
          taxable?: boolean
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          govt_fees: number
          id: string
          invoice_no: string
          issue_date: string
          notes: string | null
          paid_amount: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          govt_fees?: number
          id?: string
          invoice_no: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          govt_fees?: number
          id?: string
          invoice_no?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          invoice_id: string | null
          method: string
          notes: string | null
          receipt_no: string
          received_on: string
          reference: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          receipt_no: string
          received_on?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          receipt_no?: string
          received_on?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          code: string | null
          created_at: string
          govt_bank: string | null
          govt_fee: number
          id: string
          name: string
          name_ar: string | null
          service_fee: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          code?: string | null
          created_at?: string
          govt_bank?: string | null
          govt_fee?: number
          id?: string
          name: string
          name_ar?: string | null
          service_fee?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          code?: string | null
          created_at?: string
          govt_bank?: string | null
          govt_fee?: number
          id?: string
          name?: string
          name_ar?: string | null
          service_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          company_name: string
          company_name_ar: string | null
          email: string | null
          footer_note: string | null
          id: boolean
          invoice_prefix: string
          phone: string | null
          receipt_prefix: string
          trn: string | null
          updated_at: string
          vat_rate: number
        }
        Insert: {
          address?: string | null
          company_name?: string
          company_name_ar?: string | null
          email?: string | null
          footer_note?: string | null
          id?: boolean
          invoice_prefix?: string
          phone?: string | null
          receipt_prefix?: string
          trn?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          address?: string | null
          company_name?: string
          company_name_ar?: string | null
          email?: string | null
          footer_note?: string | null
          id?: boolean
          invoice_prefix?: string
          phone?: string | null
          receipt_prefix?: string
          trn?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      typing_jobs: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          details: string | null
          due_date: string | null
          id: string
          invoice_id: string | null
          job_no: string | null
          priority: string
          service_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          job_no?: string | null
          priority?: string
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          job_no?: string | null
          priority?: string
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_jobs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      recalc_invoice: { Args: { _invoice_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "accountant" | "typist"
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
      app_role: ["admin", "accountant", "typist"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string
          template_id: string
          entity_type: string
          entity_id: string
          status: string
          current_step: number
          steps_data: Json
          created_at: string | null
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          template_id: string
          entity_type: string
          entity_id: string
          status: string
          current_step?: number
          steps_data: Json
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          template_id?: string
          entity_type?: string
          entity_id?: string
          status?: string
          current_step?: number
          steps_data?: Json
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          location: string
          address: string
          phone: string | null
          email: string | null
          general_manager: string | null
          type: string
          rooms: number
          currency_code: string
          currency_symbol: string
          currency_name: string
          budget_utilization: number | null
          image_url: string | null
          created_at: string | null
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          location: string
          address: string
          phone?: string | null
          email?: string | null
          general_manager?: string | null
          type: string
          rooms: number
          currency_code: string
          currency_symbol: string
          currency_name: string
          budget_utilization?: number | null
          image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          location?: string
          address?: string
          phone?: string | null
          email?: string | null
          general_manager?: string | null
          type?: string
          rooms?: number
          currency_code?: string
          currency_symbol?: string
          currency_name?: string
          budget_utilization?: number | null
          image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      property_users: {
        Row: {
          id: string
          property_id: string | null
          user_id: string | null
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          role: string
          created_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          user_id?: string | null
          role?: string
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    budgets: {
      Row: {
        id: string
        property_id: string
        category: string
        code: string
        total_budget: number
        utilized_budget: number
        year: number
        created_at: string
        created_by: string | null
        updated_at: string
        updated_by: string | null
      }
      Insert: {
        id?: string
        property_id: string
        category: string
        code: string
        total_budget: number
        utilized_budget?: number
        year: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
      Update: {
        id?: string
        property_id?: string
        category?: string
        code?: string
        total_budget?: number
        utilized_budget?: number
        year?: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
    }
    budget_requests: {
      Row: {
        id: string
        property_id: string
        budget_id: string
        title: string
        description: string | null
        amount: number
        status: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id: string
        current_step: number
        created_at: string
        created_by: string | null
        updated_at: string
        updated_by: string | null
      }
      Insert: {
        id?: string
        property_id: string
        budget_id: string
        title: string
        description?: string | null
        amount: number
        status: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id: string
        current_step?: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
      Update: {
        id?: string
        property_id?: string
        budget_id?: string
        title?: string
        description?: string | null
        amount?: number
        status?: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id?: string
        current_step?: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
    }
    budget_transfers: {
      Row: {
        id: string
        property_id: string
        from_budget_id: string
        to_budget_id: string
        amount: number
        reason: string | null
        status: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id: string
        current_step: number
        created_at: string
        created_by: string | null
        updated_at: string
        updated_by: string | null
      }
      Insert: {
        id?: string
        property_id: string
        from_budget_id: string
        to_budget_id: string
        amount: number
        reason?: string | null
        status: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id: string
        current_step?: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
      Update: {
        id?: string
        property_id?: string
        from_budget_id?: string
        to_budget_id?: string
        amount?: number
        reason?: string | null
        status?: 'draft' | 'pending' | 'approved' | 'rejected'
        workflow_id?: string
        current_step?: number
        created_at?: string
        created_by?: string | null
        updated_at?: string
        updated_by?: string | null
      }
    }
  }
}
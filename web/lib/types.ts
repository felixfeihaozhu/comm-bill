// Supabase 数据库类型定义
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>;
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspace_members']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>;
      };
      bills: {
        Row: {
          id: string;
          bill_no: string;
          bill_date: string;
          mode: 'bill' | 'quote' | 'ticket' | 'compare';
          status: 'draft' | 'confirmed' | 'cancelled';
          customer_id: string | null;
          customer_name: string | null;
          customer_contact: string | null;
          customer_company: string | null;
          customer_tax_id: string | null;
          customer_address: string | null;
          default_rate: number | null;
          addon_rate: number | null;
          ship: string | null;
          route: string | null;
          sailing_start: string | null;
          sailing_end: string | null;
          payment: string | null;
          remarks: string | null;
          total_amount: number | null;
          commission: number | null;
          net_amount: number | null;
          created_by: string | null;
          workspace_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'bill_no' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bills']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          trade_name: string | null;
          customer_type: string | null;
          contact: string | null;
          company: string | null;
          tax_id: string | null;
          address: string | null;
          email: string | null;
          phone: string | null;
          default_rate: number | null;
          addon_rate: number | null;
          notes: string | null;
          workspace_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
    };
    Functions: {
      init_workspace: {
        Args: { ws_name?: string };
        Returns: { workspace_id: string; name: string; role: string }[];
      };
      add_workspace_member: {
        Args: { ws_id: string; member_email: string; member_role?: string };
        Returns: { action: string; user_id: string; role: string };
      };
      is_workspace_member: {
        Args: { ws_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { ws_id: string };
        Returns: boolean;
      };
    };
  };
}



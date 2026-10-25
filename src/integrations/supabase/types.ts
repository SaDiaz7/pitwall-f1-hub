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
      admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      bingo_cells: {
        Row: {
          marked: boolean
          marked_at: string | null
          position: number
          season: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          marked?: boolean
          marked_at?: string | null
          position: number
          season: number
          text: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          marked?: boolean
          marked_at?: string | null
          position?: number
          season?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circuit_facts: {
        Row: {
          circuit_id: string
          created_at: string
          created_by: string | null
          fact: string
          id: string
          source: string | null
        }
        Insert: {
          circuit_id: string
          created_at?: string
          created_by?: string | null
          fact: string
          id?: string
          source?: string | null
        }
        Update: {
          circuit_id?: string
          created_at?: string
          created_by?: string | null
          fact?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      favorite_constructors: {
        Row: {
          constructor_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          constructor_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          constructor_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_drivers: {
        Row: {
          created_at: string
          driver_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          user_id?: string
        }
        Relationships: []
      }
      news_dismissals: {
        Row: {
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          updated_at?: string
          user_id?: string
          version: number
        }
        Update: {
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          picks: string[]
          points: number | null
          round: number
          season: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          picks: string[]
          points?: number | null
          round: number
          season: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          picks?: string[]
          points?: number | null
          round?: number
          season?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_season_round_fkey"
            columns: ["season", "round"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["season", "round"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
          is_public: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id: string
          is_public?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      race_events: {
        Row: {
          name: string
          qualifying_at: string | null
          race_at: string
          results: string[] | null
          round: number
          scored_at: string | null
          season: number
        }
        Insert: {
          name: string
          qualifying_at?: string | null
          race_at: string
          results?: string[] | null
          round: number
          scored_at?: string | null
          season: number
        }
        Update: {
          name?: string
          qualifying_at?: string | null
          race_at?: string
          results?: string[] | null
          round?: number
          scored_at?: string | null
          season?: number
        }
        Relationships: []
      }
      site_news: {
        Row: {
          active: boolean
          body: string
          id: number
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          body: string
          id?: number
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          body?: string
          id?: number
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          created_at: string
          credit: string | null
          driver_id: string | null
          driver_name: string | null
          file_ext: string
          height: number
          id: string
          quality: string
          status: string
          team_id: string | null
          team_name: string | null
          uploaded_by: string | null
          width: number
          year: number
        }
        Insert: {
          created_at?: string
          credit?: string | null
          driver_id?: string | null
          driver_name?: string | null
          file_ext?: string
          height: number
          id?: string
          quality: string
          status?: string
          team_id?: string | null
          team_name?: string | null
          uploaded_by?: string | null
          width: number
          year: number
        }
        Update: {
          created_at?: string
          credit?: string | null
          driver_id?: string | null
          driver_name?: string | null
          file_ext?: string
          height?: number
          id?: string
          quality?: string
          status?: string
          team_id?: string | null
          team_name?: string | null
          uploaded_by?: string | null
          width?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      all_distinct: { Args: { items: string[] }; Returns: boolean }
      get_leaderboard: {
        Args: { p_season: number }
        Returns: {
          avatar_url: string
          display_name: string
          scored_races: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      score_race: {
        Args: { p_results: string[]; p_round: number; p_season: number }
        Returns: number
      }
      username_available: { Args: { candidate: string }; Returns: boolean }
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
    Enums: {},
  },
} as const

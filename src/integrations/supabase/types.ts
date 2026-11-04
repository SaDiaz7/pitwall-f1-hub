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
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      league_members: {
        Row: {
          joined_at: string
          league_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          league_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
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
      notification_outbox: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string
          delivery: string | null
          id: number
          payload: Json
          sent_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key: string
          delivery?: string | null
          id?: never
          payload?: Json
          sent_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string
          delivery?: string | null
          id?: never
          payload?: Json
          sent_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          driver_result: boolean
          friend_request: boolean
          new_wallpaper: boolean
          points_scored: boolean
          prediction_reminder: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          driver_result?: boolean
          friend_request?: boolean
          new_wallpaper?: boolean
          points_scored?: boolean
          prediction_reminder?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          driver_result?: boolean
          friend_request?: boolean
          new_wallpaper?: boolean
          points_scored?: boolean
          prediction_reminder?: boolean
          updated_at?: string
          user_id?: string
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
          show_favorites: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id: string
          is_public?: boolean
          show_favorites?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          show_favorites?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      race_events: {
        Row: {
          driver_results_queued_at: string | null
          name: string
          qualifying_at: string | null
          race_at: string
          results: string[] | null
          round: number
          scored_at: string | null
          season: number
        }
        Insert: {
          driver_results_queued_at?: string | null
          name: string
          qualifying_at?: string | null
          race_at: string
          results?: string[] | null
          round: number
          scored_at?: string | null
          season: number
        }
        Update: {
          driver_results_queued_at?: string | null
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
      trophies: {
        Row: {
          awarded_at: string
          id: string
          league_id: string | null
          league_name: string
          member_count: number
          season: number
          total_points: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          league_id?: string | null
          league_name: string
          member_count: number
          season: number
          total_points: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          league_id?: string | null
          league_name?: string
          member_count?: number
          season?: number
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trophies_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      wallpaper_likes: {
        Row: {
          created_at: string
          user_id: string
          wallpaper_id: string
        }
        Insert: {
          created_at?: string
          user_id?: string
          wallpaper_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          wallpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallpaper_likes_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "wallpapers"
            referencedColumns: ["id"]
          },
        ]
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
          likes_count: number
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
          likes_count?: number
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
          likes_count?: number
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
      award_trophies: { Args: { p_season: number }; Returns: number }
      create_league: { Args: { p_name: string }; Returns: string }
      get_friend_predictions: {
        Args: { p_season: number; p_user_id: string }
        Returns: {
          picks: string[]
          points: number
          race_name: string
          results: string[]
          round: number
        }[]
      }
      get_friends: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          relation: string
          user_id: string
          username: string
        }[]
      }
      get_friends_leaderboard: {
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
      get_league_info: {
        Args: { p_league_id: string }
        Returns: {
          active: boolean
          invite_code: string
          is_owner: boolean
          league_id: string
          member_count: number
          min_members: number
          name: string
        }[]
      }
      get_league_invite: {
        Args: { p_code: string }
        Returns: {
          league_name: string
          member_count: number
          owner_name: string
        }[]
      }
      get_league_leaderboard: {
        Args: { p_league_id: string; p_season: number }
        Returns: {
          avatar_url: string
          display_name: string
          scored_races: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_my_leagues: {
        Args: never
        Returns: {
          active: boolean
          invite_code: string
          is_owner: boolean
          league_id: string
          member_count: number
          name: string
        }[]
      }
      get_profile_favorites: {
        Args: { p_user_id: string }
        Returns: {
          item_id: string
          kind: string
        }[]
      }
      get_profile_trophies: {
        Args: { p_user_id: string }
        Returns: {
          awarded_at: string
          league_name: string
          member_count: number
          season: number
          total_points: number
          trophy_id: string
        }[]
      }
      get_public_profile: {
        Args: { p_season: number; p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          relation: string
          scored_races: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      join_league: {
        Args: { p_code: string }
        Returns: {
          join_status: string
          joined_league_id: string
        }[]
      }
      league_min_members: { Args: never; Returns: number }
      leave_league: { Args: { p_league_id: string }; Returns: boolean }
      queue_prediction_reminders: { Args: never; Returns: number }
      remove_friend: { Args: { p_user_id: string }; Returns: boolean }
      respond_friend_request: {
        Args: { p_accept: boolean; p_requester_id: string }
        Returns: boolean
      }
      save_push_subscription: {
        Args: {
          p_auth_key: string
          p_endpoint: string
          p_p256dh: string
          p_user_agent: string
        }
        Returns: undefined
      }
      score_race: {
        Args: { p_results: string[]; p_round: number; p_season: number }
        Returns: number
      }
      score_race_system: {
        Args: { p_results: string[]; p_round: number; p_season: number }
        Returns: number
      }
      search_profiles: {
        Args: { p_query: string }
        Returns: {
          avatar_url: string
          display_name: string
          relation: string
          user_id: string
          username: string
        }[]
      }
      send_friend_request: { Args: { p_user_id: string }; Returns: string }
      send_test_notification: { Args: never; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

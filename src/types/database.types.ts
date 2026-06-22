export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      calendar_entries: {
        Row: {
          concert_id: string | null;
          created_at: string;
          date_time: string | null;
          description: string | null;
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          concert_id?: string | null;
          created_at?: string;
          date_time?: string | null;
          description?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          concert_id?: string | null;
          created_at?: string;
          date_time?: string | null;
          description?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_entries_concert_id_fkey";
            columns: ["concert_id"];
            isOneToOne: false;
            referencedRelation: "concerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      concert_artists: {
        Row: {
          artist_profile_id: string;
          concert_id: string;
        };
        Insert: {
          artist_profile_id: string;
          concert_id: string;
        };
        Update: {
          artist_profile_id?: string;
          concert_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concert_artists_artist_profile_id_fkey";
            columns: ["artist_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concert_artists_concert_id_fkey";
            columns: ["concert_id"];
            isOneToOne: false;
            referencedRelation: "concerts";
            referencedColumns: ["id"];
          },
        ];
      };
      concerts: {
        Row: {
          created_at: string;
          created_by: string;
          date_time: string;
          description: string;
          id: string;
          image_url: string | null;
          likes_count: number;
          name: string;
          price: number | null;
          ticket_url: string | null;
          updated_at: string;
          venue_address: string;
          venue_id: string | null;
          venue_name: string;
          visibility: Database["public"]["Enums"]["concert_visibility"];
        };
        Insert: {
          created_at?: string;
          created_by: string;
          date_time: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          likes_count?: number;
          name: string;
          price?: number | null;
          ticket_url?: string | null;
          updated_at?: string;
          venue_address?: string;
          venue_id?: string | null;
          venue_name: string;
          visibility?: Database["public"]["Enums"]["concert_visibility"];
        };
        Update: {
          created_at?: string;
          created_by?: string;
          date_time?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          likes_count?: number;
          name?: string;
          price?: number | null;
          ticket_url?: string | null;
          updated_at?: string;
          venue_address?: string;
          venue_id?: string | null;
          venue_name?: string;
          visibility?: Database["public"]["Enums"]["concert_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "concerts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concerts_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          concert_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          concert_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          concert_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_concert_id_fkey";
            columns: ["concert_id"];
            isOneToOne: false;
            referencedRelation: "concerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          payload: Json;
          read_at: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          payload?: Json;
          read_at?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          payload?: Json;
          read_at?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          biography: string | null;
          calendar_subscription_token: string;
          collaborator_scope: string | null;
          created_at: string;
          display_name: string;
          id: string;
          image_url: string | null;
          prestige: number;
          role: Database["public"]["Enums"]["user_role"];
          social_links: Json;
          updated_at: string;
          username: string;
          venue_address: string | null;
          venue_capacity: number | null;
        };
        Insert: {
          biography?: string | null;
          calendar_subscription_token?: string;
          collaborator_scope?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          image_url?: string | null;
          prestige?: number;
          role?: Database["public"]["Enums"]["user_role"];
          social_links?: Json;
          updated_at?: string;
          username: string;
          venue_address?: string | null;
          venue_capacity?: number | null;
        };
        Update: {
          biography?: string | null;
          calendar_subscription_token?: string;
          collaborator_scope?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          image_url?: string | null;
          prestige?: number;
          role?: Database["public"]["Enums"]["user_role"];
          social_links?: Json;
          updated_at?: string;
          username?: string;
          venue_address?: string | null;
          venue_capacity?: number | null;
        };
        Relationships: [];
      };
      promotion_logs: {
        Row: {
          created_at: string;
          from_role: string;
          id: string;
          promoted_at: string | null;
          rejected_at: string | null;
          to_role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          from_role: string;
          id?: string;
          promoted_at?: string | null;
          rejected_at?: string | null;
          to_role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          from_role?: string;
          id?: string;
          promoted_at?: string | null;
          rejected_at?: string | null;
          to_role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotion_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_config: {
        Row: {
          key: string;
          value: string;
        };
        Insert: {
          key: string;
          value: string;
        };
        Update: {
          key?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_prestige: { Args: { p_user_id: string }; Returns: number };
      check_promotion: { Args: { p_user_id: string }; Returns: undefined };
      concert_is_past: {
        Args: { concert: Database["public"]["Tables"]["concerts"]["Row"] };
        Returns: boolean;
      };
      get_concert_saved_count: {
        Args: { p_concert_id: string };
        Returns: number;
      };
      refresh_all_prestige: { Args: never; Returns: undefined };
    };
    Enums: {
      concert_visibility: "PUBLIC" | "PRIVATE";
      notification_type: "PROMOTION_OFFER" | "LIKE_RECEIVED" | "CONCERT_UPDATED";
      user_role: "USER" | "ARTIST" | "VENUE" | "COLLABORATOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      concert_visibility: ["PUBLIC", "PRIVATE"],
      notification_type: ["PROMOTION_OFFER", "LIKE_RECEIVED", "CONCERT_UPDATED"],
      user_role: ["USER", "ARTIST", "VENUE", "COLLABORATOR"],
    },
  },
} as const;

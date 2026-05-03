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
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          age: number | null
          bio: string | null
          city: string | null
          interests: string[]
          photos: string[]
          preferences: Json | null
          plan: 'free' | 'premium'
          swipes_today: number
          last_swipe_date: string
          is_onboarded: boolean
          is_suspended: boolean
          email_confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          age?: number | null
          bio?: string | null
          city?: string | null
          interests?: string[]
          photos?: string[]
          preferences?: Json | null
          plan?: 'free' | 'premium'
          swipes_today?: number
          last_swipe_date?: string
          is_onboarded?: boolean
          is_suspended?: boolean
          email_confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          age?: number | null
          bio?: string | null
          city?: string | null
          interests?: string[]
          photos?: string[]
          preferences?: Json | null
          plan?: 'free' | 'premium'
          swipes_today?: number
          last_swipe_date?: string
          is_onboarded?: boolean
          is_suspended?: boolean
          email_confirmed?: boolean
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          liker_id: string
          liked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          liker_id: string
          liked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          liker_id?: string
          liked_id?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          is_viewed: boolean
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          is_viewed?: boolean
        }
        Update: {
          is_viewed?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          match_id: string
          participant1_id: string
          participant2_id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          participant1_id: string
          participant2_id: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          last_message?: string | null
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          conversation_type: 'match' | 'direct'
          sender_id: string
          content: string | null
          message_type: 'text' | 'image' | 'audio' | 'file'
          file_url: string | null
          file_name: string | null
          file_size: number | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          conversation_type?: 'match' | 'direct'
          sender_id: string
          content?: string | null
          message_type?: 'text' | 'image' | 'audio' | 'file'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
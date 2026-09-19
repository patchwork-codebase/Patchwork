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
          name: string
          role: string
          reputation: number
          domain_reputation: Json | null
          bio: string | null
          avatar_url: string | null
          github_url: string | null
          linkedin_url: string | null
          website: string | null
          twitter: string | null
          is_verified_expert: boolean
          onboarding_call_scheduled: boolean
          signup_completed_at: string | null
          created_at: string
          updated_at: string
          organization_name: string | null
          organization_logo_url: string | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      rooms: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          builder_id: string
          tags: string[] | null
          cover_image: string | null
          primary_link: string | null
          project_stage: string | null
          primary_goal: string | null
          is_private: boolean
          visibility: string
          invite_token: string | null
          whitelisted_domains: string[] | null
          content_permissions: Json | null
          protection_flags: Json | null
          nda_text: string | null
          authorship_timestamp: string | null
          created_at: string
          updated_at: string
          retrospective_note: string | null
        }
        Insert: Partial<Database['public']['Tables']['rooms']['Row']>
        Update: Partial<Database['public']['Tables']['rooms']['Row']>
      }
      updates: {
        Row: {
          id: string
          room_id: string
          author_id: string
          content: string
          type: string | null
          media_url: string | null
          code_snippet: string | null
          figma_url: string | null
          draft: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['updates']['Row']>
        Update: Partial<Database['public']['Tables']['updates']['Row']>
      }
      reactions: {
        Row: {
          id: string
          room_id: string
          update_id: string
          observer_id: string
          type: string
          text: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reactions']['Row']>
        Update: Partial<Database['public']['Tables']['reactions']['Row']>
      }
      room_observers: {
        Row: {
          observer_id: string
          room_id: string
          role: string | null
          joined_at: string
        }
        Insert: Partial<Database['public']['Tables']['room_observers']['Row']>
        Update: Partial<Database['public']['Tables']['room_observers']['Row']>
      }
      room_integrations: {
        Row: {
          id: string
          room_id: string
          integration_type: string
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['room_integrations']['Row']>
        Update: Partial<Database['public']['Tables']['room_integrations']['Row']>
      }
      expert_applications: {
        Row: {
          id: string
          user_id: string
          status: string
          payload: Json
          created_at: string
          updated_at: string
          rejected_at: string | null
          rejection_reason: string | null
        }
        Insert: Partial<Database['public']['Tables']['expert_applications']['Row']>
        Update: Partial<Database['public']['Tables']['expert_applications']['Row']>
      }
      proof_of_work: {
        Row: {
          id: string
          user_id: string
          action_type: string
          points: number
          room_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['proof_of_work']['Row']>
        Update: Partial<Database['public']['Tables']['proof_of_work']['Row']>
      }
      roadmap_items: {
        Row: {
          id: string
          builder_id: string
          title: string
          description: string | null
          status: string
          position: number
          sprint_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['roadmap_items']['Row']>
        Update: Partial<Database['public']['Tables']['roadmap_items']['Row']>
      }
    }
  }
}

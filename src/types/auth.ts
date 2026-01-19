import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  created_at: string
  email: string | null
  full_name: string | null
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

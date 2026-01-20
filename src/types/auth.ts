import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  created_at: string
  email: string | null
  full_name: string | null
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  subscription: Subscription | null
  isSubscribed: boolean
  loading: boolean
  subscriptionLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, Profile, Subscription } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error.message)
        return null
      }
      return data as Profile
    } catch (e) {
      console.error('Profile fetch exception:', e)
      return null
    }
  }, [])

  const fetchSubscription = useCallback(async (userId: string): Promise<Subscription | null> => {
    console.log('Fetching subscription for user:', userId)
    setSubscriptionLoading(true)
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Subscription fetch timeout')), 5000)
      )

      const fetchPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise.then(() => ({ data: null, error: null }))]) as { data: Subscription | null, error: { message: string, code: string } | null }

      console.log('Subscription result:', { data, error })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error.message, error.code)
        return null
      }
      return data
    } catch (e) {
      console.error('Subscription fetch exception:', e)
      return null
    } finally {
      setSubscriptionLoading(false)
    }
  }, [])

  const refreshSubscription = useCallback(async () => {
    if (user) {
      const subscriptionData = await fetchSubscription(user.id)
      setSubscription(subscriptionData)
    }
  }, [user, fetchSubscription])

  // Auth initialization - only handles auth state, not subscription
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('getSession completed, session exists:', !!session)

        if (error) {
          console.error('Error getting session:', error.message)
          await supabase.auth.signOut()
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error instanceof Error ? error.message : 'Unknown error')
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (mounted) {
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out')
          setSession(null)
          setUser(null)
          setProfile(null)
          setSubscription(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (mounted) setProfile(profileData)
        } else {
          setProfile(null)
          setSubscription(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authSubscription.unsubscribe()
    }
  }, [fetchProfile])

  // Separate effect for subscription - runs after user is set
  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setSubscriptionLoading(false)
      return
    }

    console.log('User changed, fetching subscription...')
    fetchSubscription(user.id).then(data => {
      setSubscription(data)
    })
  }, [user, fetchSubscription])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error: error as Error | null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSession(null)
      setUser(null)
      setProfile(null)
      setSubscription(null)
    }
  }, [])

  const isSubscribed = subscription?.status === 'active'

  const value: AuthContextType = {
    user,
    session,
    profile,
    subscription,
    isSubscribed,
    loading,
    subscriptionLoading,
    signUp,
    signIn,
    signOut,
    refreshSubscription,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

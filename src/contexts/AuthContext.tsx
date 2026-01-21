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
    try {
      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Subscription fetch timeout')), 8000)
      )

      const fetchPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      console.log('Subscription result:', { data, error })

      if (error) {
        console.error('Error fetching subscription:', error.message)
        return null
      }
      return data as Subscription | null
    } catch (e) {
      console.error('Subscription fetch exception:', e instanceof Error ? e.message : e)
      return null
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

    // Fallback timeout - just set loading to false after 5 seconds
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth fallback timeout - setting loading to false')
        setLoading(false)
      }
    }, 5000)

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
        // Token refresh with valid session - just update session, don't reload everything
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed, keeping existing data')
          setSession(session)
          return
        }

        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out')
          setSession(null)
          setUser(null)
          setProfile(null)
          setSubscription(null)
          setLoading(false)
          return
        }

        // Only update user if it actually changed (prevents unnecessary subscription refetch)
        const newUserId = session?.user?.id
        setSession(session)

        if (session?.user) {
          setUser(prevUser => {
            // If same user, don't trigger subscription refetch
            if (prevUser?.id === newUserId) {
              console.log('Same user, skipping refetch')
              return prevUser
            }
            return session.user
          })
          const profileData = await fetchProfile(session.user.id)
          if (mounted) setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
          setSubscription(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(fallbackTimeout)
      authSubscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile])

  // Separate effect for subscription - runs after user is set
  useEffect(() => {
    let mounted = true

    if (!user) {
      setSubscription(null)
      setSubscriptionLoading(false)
      return () => {
        mounted = false
      }
    }

    setSubscriptionLoading(true)

    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Subscription fallback timeout (10s) - setting loading to false')
        setSubscriptionLoading(false)
      }
    }, 10000)

    console.log('Starting subscription fetch...')
    fetchSubscription(user.id)
      .then(data => {
        console.log('Subscription fetch completed, data:', data)
        if (mounted) {
          // Only update if we got data, otherwise keep existing subscription
          if (data !== null) {
            setSubscription(data)
          } else {
            console.log('Fetch returned null, keeping existing subscription')
            setSubscription(prev => prev) // Keep existing
          }
        }
      })
      .catch(error => {
        console.error('Subscription fetch error:', error instanceof Error ? error.message : error)
        // On error, keep existing subscription instead of setting to null
        console.log('Keeping existing subscription due to error')
      })
      .finally(() => {
        console.log('Subscription fetch finally block')
        if (mounted) setSubscriptionLoading(false)
        clearTimeout(fallbackTimeout)
      })

    return () => {
      mounted = false
      clearTimeout(fallbackTimeout)
    }
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

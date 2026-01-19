import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, Profile } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as Profile
  }, [])

  useEffect(() => {
    let mounted = true
    let authInitialized = false

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          // Clear potentially corrupt session data
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
            if (mounted) setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // On any error, clear auth state
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        authInitialized = true
        if (mounted) setLoading(false)
      }
    }

    // Timeout fallback - if auth takes longer than 3 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Auth initialization timeout - forcing load complete')
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }, 3000)

    initializeAuth().finally(() => clearTimeout(timeout))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out')
          setSession(null)
          setUser(null)
          setProfile(null)
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
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

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
      console.error('Sign out error:', error)
    } finally {
      // Always clear state, even if signOut fails
      setSession(null)
      setUser(null)
      setProfile(null)
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
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

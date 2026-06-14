import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string
  company: string
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, company: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<'admin' | 'user'>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'company' | 'avatar_url'>>) => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email: string, password: string, fullName: string, company: string) => {
    if (email === import.meta.env.VITE_ADMIN_EMAIL) {
      throw new Error('This email address is not available')
    }
    const { error, data } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: data.user.id, email, full_name: fullName, company
      })
      if (insertError) throw insertError
    }
  }

  const signIn = async (email: string, password: string): Promise<'admin' | 'user'> => {
    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

    // Admin check runs FIRST — before any Supabase call
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('apex_admin_session', 'true')
      return 'admin'
    }
    // Block admin email from regular auth
    if (email === ADMIN_EMAIL) {
      throw new Error('Invalid credentials')
    }
    // Normal user auth
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return 'user'
  }

  const signOut = async () => {
    localStorage.removeItem('apex_admin_session')
    await supabase.auth.signOut()
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'company' | 'avatar_url'>>) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        ...updates
      })
    if (error) throw error
    setProfile(prev => prev ? { ...prev, ...updates } : {
      id: user.id,
      email: user.email!,
      full_name: updates.full_name || '',
      company: updates.company || '',
      avatar_url: updates.avatar_url || null
    })
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const isAdmin = () => localStorage.getItem('apex_admin_session') === 'true'

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

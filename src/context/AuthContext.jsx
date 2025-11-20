import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) throw error
        if (user && mounted) {
          setUser(user)
          await ensureProfile(user)
        }
      } catch (err) {
        console.error('auth init error', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        await ensureProfile(nextUser)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const ensureProfile = async (user) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single()

    if (error) {
      console.error('ensureProfile error', error)
      throw error
    }
    setProfile(data)
  }

  const login = async (email, password) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
      throw error
    }
    if (data.user) {
      await ensureProfile(data.user)
    }
  }

  const signUp = async (email, password) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setError(error.message)
      throw error
    }
    if (data.user) {
      await ensureProfile(data.user)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

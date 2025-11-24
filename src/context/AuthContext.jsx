import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user: currentUser },
          error: userErr,
        } = await supabase.auth.getUser()
        if (userErr) throw userErr

        if (!cancelled) {
          setUser(currentUser ?? null)
        }

        if (currentUser) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()

          if (profErr) throw profErr
          if (!cancelled) setProfile(prof ?? null)
        } else {
          if (!cancelled) setProfile(null)
        }
      } catch (e) {
        console.error('Auth init error', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
          setProfile(prof ?? null)
        } else {
          setProfile(null)
        }
      },
    )

    return () => {
      sub?.subscription?.unsubscribe()
      cancelled = true
    }
  }, [])

  const value = { user, profile, loading, error }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
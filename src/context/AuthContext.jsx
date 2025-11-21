import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 初回だけユーザー＋プロフィールをロード
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

        if (!currentUser) {
          if (!cancelled) {
            setUser(null)
            setProfile(null)
          }
          return
        }

        if (!cancelled) {
          setUser(currentUser)
        }

        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profErr) throw profErr

        if (!cancelled) {
          setProfile(prof || null)
        }
      } catch (e) {
        console.error('Auth init error', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // auth 状態の変化を監視
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ここでは loading をいじらない（チカチカ防止）
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          try {
            const { data: prof, error: profErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle()

            if (profErr) {
              console.error('Auth profile reload error', profErr)
              return
            }
            setProfile(prof || null)
          } catch (e) {
            console.error('Auth profile reload fatal', e)
          }
        } else {
          setProfile(null)
        }
      },
    )

    return () => {
      cancelled = true
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    error,
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
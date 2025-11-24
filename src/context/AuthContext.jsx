import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// ★ デモユーザー用の固定認証情報（必要なら env に逃がしてもOK）
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'demo@example.com'
const DEMO_PASSWORD =
  import.meta.env.VITE_DEMO_PASSWORD || 'demopassword'

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
        // 1. 既存セッション確認
        const {
          data: { user: currentUser },
          error: userErr,
        } = await supabase.auth.getUser()
        if (userErr) {
          console.error('getUser error', userErr)
        }

        let effectiveUser = currentUser

        // 2. セッションなければデモユーザーで強制ログイン
        if (!effectiveUser) {
          const { data, error: signErr } =
            await supabase.auth.signInWithPassword({
              email: DEMO_EMAIL,
              password: DEMO_PASSWORD,
            })
          if (signErr) {
            throw signErr
          }
          effectiveUser = data.user
        }

        if (!cancelled) {
          setUser(effectiveUser ?? null)
        }

        // 3. プロフィール取得
        if (effectiveUser) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', effectiveUser.id)
            .maybeSingle()

          if (profErr) {
            console.error('profile load error', profErr)
          }

          if (!cancelled) {
            setProfile(prof ?? null)
          }
        } else {
          if (!cancelled) setProfile(null)
        }
      } catch (e) {
        console.error('Auth init fatal', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // auth 状態の変化監視（ほぼデモでは使わないが一応残す）
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
          if (profErr) {
            console.error('profile reload error', profErr)
          }
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
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// デモユーザーの認証情報（env に逃がしてもOK）
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

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        // 🔸 まずは既存セッションを全部捨てる
        await supabase.auth.signOut().catch(() => {})

        // 🔸 デモユーザーで強制ログイン
        const { data, error: signErr } =
          await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          })

        if (signErr) {
          throw signErr
        }

        const demoUser = data.user
        if (!demoUser) {
          throw new Error('デモユーザーのログインに失敗しました')
        }

        if (!cancelled) {
          setUser(demoUser)
        }

        // 🔸 プロフィール取得（あれば）
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', demoUser.id)
          .maybeSingle()

        if (profErr) {
          console.error('profile load error', profErr)
        }

        if (!cancelled) {
          setProfile(prof ?? null)
        }
      } catch (e) {
        console.error('Auth init fatal', e)
        if (!cancelled) {
          setError(e.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    init()

    // デモ用なので onAuthStateChange は使わない（必要なし）
    return () => {
      cancelled = true
    }
  }, [])

  const value = { user, profile, loading, error }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
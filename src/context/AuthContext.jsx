import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000 // 30分 無操作で自動ログアウト

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // --- 初回だけユーザー＋プロフィールをロード ---
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
        } else {
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
        }
      } catch (e) {
        console.error('Auth init error', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // auth 状態の変化を監視（ログイン／ログアウトなど）
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

  // --- 一定時間無操作なら自動ログアウト ---
  useEffect(() => {
    if (!user) return

    let lastActivity = Date.now()

    const resetActivity = () => {
      lastActivity = Date.now()
    }

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }))

    const intervalId = setInterval(async () => {
      const now = Date.now()
      if (!user) return

      const diff = now - lastActivity
      if (diff > INACTIVITY_LIMIT_MS) {
        console.log('Inactivity detected, auto sign-out')
        try {
          await supabase.auth.signOut()
        } catch (e) {
          console.error('auto sign-out error', e)
        } finally {
          // タイマー側で勝手に user をいじらず、
          // supabase の onAuthStateChange に任せる
          lastActivity = Date.now()
        }
      }
    }, 60 * 1000) // 1分ごとにチェック

    return () => {
      clearInterval(intervalId)
      events.forEach((ev) => window.removeEventListener(ev, resetActivity))
    }
  }, [user])

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
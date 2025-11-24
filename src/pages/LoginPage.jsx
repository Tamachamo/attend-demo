import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // すでにログイン済みならトップへ
  if (user) {
    return <Loading />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        // ログイン
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (err) throw err

        navigate('/', { replace: true })
      } else {
        // 新規登録（メール認証なし前提）
        if (!name.trim()) {
          throw new Error('氏名を入力してください。')
        }

        const { data, error: signupErr } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signupErr) throw signupErr

        const newUser = data.user
        if (newUser) {
          // 全員管理者で profiles を作成（FK対策）
          const { error: profErr } = await supabase.from('profiles').insert({
            id: newUser.id,
            email,
            name,
            is_admin: true,
          })
          if (profErr) {
            // ここでコケてもログイン自体は進める
            console.error('profiles insert error', profErr)
          }
        }

        // メール認証オフ前提なので、セッションが返ってくる → 即ログイン扱いでOK
        navigate('/', { replace: true })
      }
    } catch (e2) {
      console.error('auth error', e2)
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          勤怠デモダッシュボード
        </h1>
        <p
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            marginBottom: '0.75rem',
          }}
        >
          デモ用の簡易ログイン画面です。テスト用のアカウントを自由に作成できます。
        </p>

        {/* モード切り替え */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              borderRadius: '999px',
              border: mode === 'login' ? '1px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: mode === 'login' ? '#2563eb' : '#ffffff',
              color: mode === 'login' ? '#ffffff' : '#4b5563',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            ログイン
          </button>
          <button
            type="button'
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              borderRadius: '999px',
              border: mode === 'signup' ? '1px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: mode === 'signup' ? '#2563eb' : '#ffffff',
              color: mode === 'signup' ? '#ffffff' : '#4b5563',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            新規登録
          </button>
        </div>

        <ErrorMessage message={error} />

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
        >
          {mode === 'signup' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  marginBottom: '0.2rem',
                }}
              >
                氏名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                placeholder="例）山田 太郎"
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                marginBottom: '0.2rem',
              }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                marginBottom: '0.2rem',
              }}
            >
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.4rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: '#ffffff',
              fontSize: '0.85rem',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading
              ? '処理中…'
              : mode === 'login'
              ? 'ログイン'
              : '新規登録してログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.35rem 0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
}
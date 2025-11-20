import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ErrorMessage from '../components/ErrorMessage'

export default function LoginPage() {
  const { login, signUp, error } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setLocalError(null)
    try {
      if (!email || !password) {
        setLocalError('メールアドレスとパスワードを入力してください。')
        return
      }
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signUp(email, password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #e5e7eb, #f9fafb)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
          }}
        >
          勤怠・申請デモ
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#6b7280',
            marginBottom: '1rem',
          }}
        >
          {mode === 'login'
            ? '登録済みのメールアドレスとパスワードでログインしてください。'
            : '任意のメールアドレスとパスワードでサインアップできます。（デモ用）'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '0.4rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              backgroundColor: mode === 'login' ? '#111827' : '#ffffff',
              color: mode === 'login' ? '#f9fafb' : '#374151',
              cursor: 'pointer',
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '0.4rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              backgroundColor: mode === 'signup' ? '#111827' : '#ffffff',
              color: mode === 'signup' ? '#f9fafb' : '#374151',
              cursor: 'pointer',
            }}
          >
            新規登録
          </button>
        </div>

        <ErrorMessage message={localError || error} />

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.55rem 0.7rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: submitting ? '#9ca3af' : '#111827',
              color: '#f9fafb',
              fontSize: '0.9rem',
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? '送信中…' : mode === 'login' ? 'ログイン' : '登録してログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}

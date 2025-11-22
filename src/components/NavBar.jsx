import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function NavBar() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    } catch (e) {
      console.error('logout error', e)
      alert('ログアウト時にエラーが発生しました')
    }
  }

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: '#111827',
        color: '#f9fafb',
        padding: '0.4rem 0.75rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* 左：タイトル */}
        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          勤怠デモダッシュボード
        </div>

        {/* 右：ナビ＋ユーザー情報 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* ナビゲーション */}
          {user && (
            <nav
              style={{
                display: 'flex',
                gap: '0.4rem',
                fontSize: '0.78rem',
                flexWrap: 'wrap',
              }}
            >
              <NavLink to="/" label="ダッシュボード" active={isActive('/')} />
              <NavLink
                to="/calendar"
                label="カレンダー"
                active={isActive('/calendar')}
              />
              <NavLink
                to="/attendance"
                label="勤怠入力"
                active={isActive('/attendance')}
              />
              <NavLink
                to="/requests"
                label="申請"
                active={isActive('/requests')}
              />
              <NavLink
                to="/announcements"
                label="連絡事項"
                active={isActive('/announcements')}
              />
            </nav>
          )}

          {/* ユーザー情報 & ログアウト */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
            }}
          >
            {user ? (
              <>
                <span
                  style={{
                    color: '#d1d5db',
                    maxWidth: '130px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile?.name ?? user.email}
                  {profile?.is_admin ? '（管理者）' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid #4b5563',
                    backgroundColor: 'transparent',
                    color: '#e5e7eb',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  color: '#e5e7eb',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                }}
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '999px',
        textDecoration: 'none',
        color: active ? '#111827' : '#e5e7eb',
        backgroundColor: active ? '#facc15' : 'transparent',
        border: active ? '1px solid #facc15' : '1px solid transparent',
      }}
    >
      {label}
    </Link>
  )
}
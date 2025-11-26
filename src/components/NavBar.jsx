// src/components/NavBar.jsx
import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('logout error', e)
    } finally {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key)
        })
      } catch (_) {}

      setMenuOpen(false)
      navigate('/login', { replace: true })
    }
  }

  if (location.pathname === '/login') return null

  return (
    <header
      className="nav-root"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <nav
        className="nav-inner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {/* 左：ロゴ */}
        <div
          className="nav-logo"
          style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}
        >
          勤怠デモアプリ
        </div>

        {/* スマホ用ハンバーガー（display は CSS に任せる） */}
        <button
          className="nav-hamburger"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニュー"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.25rem',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              display: 'block',
              width: '20px',
              height: '2px',
              backgroundColor: '#111827',
              marginBottom: '4px',
              borderRadius: '999px',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '20px',
              height: '2px',
              backgroundColor: '#111827',
              marginBottom: '4px',
              borderRadius: '999px',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '20px',
              height: '2px',
              backgroundColor: '#111827',
              borderRadius: '999px',
            }}
          />
        </button>

        {/* メニューコンテナ（display も CSS 管理） */}
        <div
          className={`nav-menu-wrapper ${menuOpen ? 'open' : ''}`}
          style={{
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* 中央リンク */}
          <div
            className="nav-links"
            style={{
              alignItems: 'center',
              gap: '0.75rem',
              display: 'flex', // 縦 or 横は CSS の flex-direction で変える
            }}
          >
            <NavLink to="/" style={linkStyle} onClick={() => setMenuOpen(false)}>
              ダッシュボード
            </NavLink>
            <NavLink
              to="/calendar"
              style={linkStyle}
              onClick={() => setMenuOpen(false)}
            >
              カレンダー
            </NavLink>
            <NavLink
              to="/attendance"
              style={linkStyle}
              onClick={() => setMenuOpen(false)}
            >
              勤怠
            </NavLink>
            <NavLink
              to="/requests"
              style={linkStyle}
              onClick={() => setMenuOpen(false)}
            >
              申請
            </NavLink>
            <NavLink
              to="/announcements"
              style={linkStyle}
              onClick={() => setMenuOpen(false)}
            >
              連絡事項
            </NavLink>
          </div>

          {/* 右：ユーザー名＋ログアウト */}
          <div
            className="nav-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {profile?.name && (
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#4b5563',
                  maxWidth: '8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={profile.name}
              >
                {profile.name}
              </span>
            )}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

const linkStyle = ({ isActive }) => ({
  padding: '0.3rem 0.6rem',
  textDecoration: 'none',
  borderRadius: '6px',
  backgroundColor: isActive ? '#111827' : '#ffffff',
  color: isActive ? '#ffffff' : '#374151',
  border: isActive ? '1px solid #111827' : '1px solid #d1d5db',
  fontSize: '0.85rem',
})
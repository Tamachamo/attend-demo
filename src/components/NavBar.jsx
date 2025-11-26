// src/components/NavBar.jsx
import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const location = useLocation()
  const { profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('logout error', e)
    } finally {
      // Supabase のセッションキー掃除
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key)
        })
      } catch (_) {}

      // Vercel の 404 回避のため、/login ではなく / に戻す
      window.location.href = '/'
    }
  }

  // ログインページを使っていない想定だけど、
  // もし /login を見せるときはナビを消しておく
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

        {/* モバイル用ハンバーガー */}
        <button
          className="nav-hamburger"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: 'none', // CSS で上書きして使う
            background: 'none',
            border: 'none',
            padding: '0.25rem',
            cursor: 'pointer',
          }}
          aria-label="メニュー"
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

        {/* 中央＋右：PC では横並び、SP ではドロワー内にまとめる */}
        <div
          className={`nav-menu-wrapper ${menuOpen ? 'open' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* メニューリンク */}
          <div
            className="nav-links"
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <NavLink to="/" style={linkStyle}>
              ダッシュボード
            </NavLink>
            <NavLink to="/calendar" style={linkStyle}>
              カレンダー
            </NavLink>
            <NavLink to="/attendance" style={linkStyle}>
              勤怠
            </NavLink>
            <NavLink to="/requests" style={linkStyle}>
              申請
            </NavLink>
            <NavLink to="/announcements" style={linkStyle}>
              連絡事項
            </NavLink>
          </div>

          {/* 右側：ユーザー名＋ログアウト */}
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
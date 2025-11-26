// src/components/NavBar.jsx
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const location = useLocation()
  const { profile } = useAuth()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('logout error', e)
    } finally {
      // sb- のキーを全削除（自動ログイン対策）
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      } catch (e) {}

      window.location.href = '/login'
    }
  }

  // ログインページではナビを非表示
  if (location.pathname === '/login') return null

  return (
    <header
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {/* 左 ロゴ */}
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          勤怠デモアプリ
        </div>

        {/* 中央 メニュー */}
        <div
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

        {/* 右：ユーザー名＋ログアウト */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {profile?.name && (
            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              {profile.name}
            </span>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
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
// src/components/NavBar.jsx
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const linkBaseStyle = {
  padding: '0.35rem 0.6rem',
  borderRadius: '9999px',
  fontSize: '0.85rem',
  textDecoration: 'none',
  border: '1px solid transparent',
  whiteSpace: 'nowrap',
}

function navLinkStyle(isActive) {
  if (isActive) {
    return {
      ...linkBaseStyle,
      backgroundColor: '#111827',
      color: '#ffffff',
      borderColor: '#111827',
    }
  }
  return {
    ...linkBaseStyle,
    backgroundColor: '#ffffff',
    color: '#374151',
    borderColor: '#e5e7eb',
  }
}

export default function NavBar() {
  const location = useLocation()
  const { profile } = useAuth()

  const handleLogout = async () => {
    try {
      // Supabase のセッション削除
      await supabase.auth.signOut()
    } catch (e) {
      console.error('logout error', e)
    } finally {
      // Supabase が使っているローカルストレージのキーも消しておく
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      } catch (_e) {
        // localStorage 触れない環境なら無視
      }

      // 強制的にログインページへ
      window.location.href = '/login'
    }
  }

  // ログインページでは NavBar を非表示にする（見た目も挙動もシンプルに）
  if (location.pathname === '/login') {
    return null
  }

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          boxSizing: 'border-box',
        }}
      >
        {/* 左：タイトル */}
        <div
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#111827',
            whiteSpace: 'nowrap',
          }}
        >
          勤怠デモアプリ
        </div>

        {/* 中央：ナビ */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <NavLink
            to="/"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            ダッシュボード
          </NavLink>
          <NavLink
            to="/calendar"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            カレンダー
          </NavLink>
          <NavLink
            to="/attendance"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            勤怠入力
          </NavLink>
          <NavLink
            to="/requests"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            申請一覧
          </NavLink>
          <NavLink
            to="/announcements"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            連絡事項
          </NavLink>
        </nav>

        {/* 右：ユーザー名＋ログアウト */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
          }}
        >
          {profile?.name && (
            <span
              style={{
                fontSize: '0.8rem',
                color: '#4b5563',
                maxWidth: '8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
              padding: '0.35rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}
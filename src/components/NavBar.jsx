import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkStyle = ({ isActive }) => ({
  padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  fontSize: '0.9rem',
  color: isActive ? '#111827' : '#4b5563',
  backgroundColor: isActive ? '#e5e7eb' : 'transparent',
})

export default function NavBar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '1rem' }}>勤怠デモダッシュボード</div>
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <NavLink to="/" style={linkStyle} end>
          ホーム
        </NavLink>
        <NavLink to="/calendar" style={linkStyle}>
          カレンダー
        </NavLink>
        <NavLink to="/attendance" style={linkStyle}>
          勤怠入力
        </NavLink>
        <NavLink to="/requests" style={linkStyle}>
          申請
        </NavLink>
        <NavLink to="/announcements" style={linkStyle}>
          連絡事項
        </NavLink>
      </nav>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
        }}
      >
        {profile && <span>{profile.name}</span>}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            padding: '0.3rem 0.6rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}

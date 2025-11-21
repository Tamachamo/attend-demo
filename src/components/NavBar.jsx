import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBaseStyle = {
  padding: '0.4rem 0.6rem',
  borderRadius: '999px',
  textDecoration: 'none',
  fontSize: '0.8rem',
}

const linkStyle = ({ isActive }) => ({
  ...linkBaseStyle,
  color: isActive ? '#111827' : '#4b5563',
  backgroundColor: isActive ? '#e5e7eb' : 'transparent',
})

export default function NavBar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handler()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>勤怠デモダッシュボード</div>

      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
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
          gap: '0.5rem',
          fontSize: '0.8rem',
          alignSelf: isMobile ? 'flex-end' : 'center',
        }}
      >
        {profile && <span>{profile.name}</span>}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            padding: '0.25rem 0.6rem',
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
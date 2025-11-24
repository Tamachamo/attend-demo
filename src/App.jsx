import React from 'react'
import { Routes, Route } from 'react-router-dom'

import NavBar from './components/NavBar'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import AttendancePage from './pages/AttendancePage'
import RequestsPage from './pages/RequestsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <NavBar />

      <main style={{ width: '100%' }}>
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '0.75rem',
            boxSizing: 'border-box',
          }}
        >
          <Routes>
            {/* 認証画面 */}
            <Route path="/login" element={<LoginPage />} />

            {/* ▼ここからは未ログインでもページ表示OK（ProtectedRoute撤廃） */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
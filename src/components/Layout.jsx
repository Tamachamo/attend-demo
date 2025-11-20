import React from 'react'
import NavBar from './NavBar'

export default function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f3f4f6',
      }}
    >
      <NavBar />
      <main
        style={{
          flex: 1,
          padding: '1rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </main>
      <footer
        style={{
          padding: '0.75rem',
          fontSize: '0.75rem',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        Demo environment – data is reset daily at 0:00 JST.
      </footer>
    </div>
  )
}

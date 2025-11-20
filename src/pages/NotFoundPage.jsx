import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        ページが見つかりません
      </h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
        URL が間違っているか、ページが削除された可能性があります。
      </p>
      <Link
        to="/"
        style={{
          fontSize: '0.9rem',
          color: '#2563eb',
          textDecoration: 'underline',
        }}
      >
        ホームに戻る
      </Link>
    </div>
  )
}

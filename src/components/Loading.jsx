import React from 'react'

export default function Loading({ message = '読み込み中...' }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.1rem' }}>
      {message}
    </div>
  )
}

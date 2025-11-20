import React from 'react'

export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div
      style={{
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.9rem',
      }}
    >
      {message}
    </div>
  )
}

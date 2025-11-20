import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    date: format(startOfToday(), 'yyyy-MM-dd'),
    title: '',
    message: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error
        if (mounted) setItems(data || [])
      } catch (err) {
        console.error('announcements load error', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!form.message.trim()) {
        setError('メッセージを入力してください。')
        return
      }
      const payload = {
        date: form.date,
        title: form.title || null,
        message: form.message,
        created_by: user.id,
      }

      const { data, error } = await supabase
        .from('announcements')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error

      setItems((prev) => [data, ...prev])
      setForm((prev) => ({ ...prev, title: '', message: '' }))
    } catch (err) {
      console.error('announcement save error', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        連絡事項
      </h2>
      <ErrorMessage message={error} />

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem',
          maxWidth: '520px',
        }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <label
            htmlFor="date"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            日付
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label
            htmlFor="title"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            タイトル（任意）
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={handleChange('title')}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
            }}
          />
        </div>
        <div>
          <label
            htmlFor="message"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            メッセージ
          </label>
          <textarea
            id="message"
            rows="3"
            value={form.message}
            onChange={handleChange('message')}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: saving ? '#9ca3af' : '#111827',
            color: '#f9fafb',
            fontSize: '0.9rem',
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? '登録中…' : '連絡事項を登録'}
        </button>
      </form>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
        }}
      >
        {items.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>まだ連絡事項はありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((a) => (
              <li
                key={a.id}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  padding: '0.6rem 0',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: '0.15rem',
                  }}
                >
                  {format(new Date(a.date), 'yyyy/MM/dd')}
                </div>
                {a.title && (
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '0.15rem',
                    }}
                  >
                    {a.title}
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{a.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

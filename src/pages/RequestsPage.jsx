import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

const TYPE_OPTIONS = [
  { value: 'paid', label: '有休' },
  { value: 'half_am', label: '半休（午前）' },
  { value: 'half_pm', label: '半休（午後）' },
  { value: 'absence', label: '欠勤' },
  { value: 'overtime', label: '残業' },
  { value: 'holiday_work', label: '休日出勤' },
]

export default function RequestsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({
    type: 'paid',
    date: format(startOfToday(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) throw error
        if (mounted) setRequests(data || [])
      } catch (err) {
        console.error('requests load error', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user.id])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        user_id: user.id,
        type: form.type,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        reason: form.reason || null,
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error

      setRequests((prev) => [data, ...prev])
      setForm((prev) => ({ ...prev, reason: '' }))
    } catch (err) {
      console.error('request save error', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        申請作成 & 一覧
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div>
            <label
              htmlFor="type"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              種別
            </label>
            <select
              id="type"
              value={form.type}
              onChange={handleChange('type')}
              style={{
                width: '100%',
                padding: '0.4rem 0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="date"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              対象日
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
          <div>
            <label
              htmlFor="start_time"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              開始時間（任意）
            </label>
            <input
              id="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange('start_time')}
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
              htmlFor="end_time"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
            >
              終了時間（任意）
            </label>
            <input
              id="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange('end_time')}
              style={{
                width: '100%',
                padding: '0.4rem 0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
              }}
            />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label
            htmlFor="reason"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            理由（任意）
          </label>
          <textarea
            id="reason"
            rows="3"
            value={form.reason}
            onChange={handleChange('reason')}
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
          {saving ? '送信中…' : '申請を登録'}
        </button>
      </form>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          これまでの申請
        </h3>
        {requests.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>まだ申請はありません。</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.35rem' }}>日付</th>
                <th style={{ padding: '0.35rem' }}>種別</th>
                <th style={{ padding: '0.35rem' }}>時間</th>
                <th style={{ padding: '0.35rem' }}>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.35rem' }}>
                    {format(new Date(r.date), 'yyyy/MM/dd')}
                  </td>
                  <td style={{ padding: '0.35rem' }}>
                    {TYPE_OPTIONS.find((t) => t.value === r.type)?.label ?? r.type}
                  </td>
                  <td style={{ padding: '0.35rem', color: '#6b7280' }}>
                    {r.start_time && r.end_time
                      ? `${r.start_time}〜${r.end_time}`
                      : '-'}
                  </td>
                  <td style={{ padding: '0.35rem' }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

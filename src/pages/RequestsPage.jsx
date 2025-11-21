import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

const TYPE_LABELS = {
  paid: '有休',
  half_am: '半休(午前)',
  half_pm: '半休(午後)',
  absence: '欠勤',
  overtime: '残業',
  holiday_work: '休日出勤',
}

const STATUS_LABELS = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
}

export default function RequestsPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  const today = startOfToday()
  const [formDate, setFormDate] = useState(format(today, 'yyyy-MM-dd'))
  const [formType, setFormType] = useState('paid')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('18:00')
  const [formReason, setFormReason] = useState('')

  const isAdmin = profile?.is_admin === true

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('leave_requests')
          .select('*, profiles(name, is_admin)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (err) throw err

        if (!cancelled) {
          setItems(data || [])
        }
      } catch (e) {
        console.error('leave_requests load error', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user])

  const reloadList = async () => {
    if (!user) return
    try {
      const { data, error: fetchErr } = await supabase
        .from('leave_requests')
        .select('*, profiles(name, is_admin)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setItems(data || [])
    } catch (e) {
      console.error('leave_requests reload error', e)
      setError(e.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setError(null)

    try {
      const payload = {
        user_id: user.id,
        date: formDate,
        type: formType,
        start_time: formStartTime,
        end_time: formEndTime,
        reason: formReason || null,
        status: 'pending',
      }

      const { error: err } = await supabase.from('leave_requests').insert(payload)
      if (err) throw err

      await reloadList()

      setFormDate(format(startOfToday(), 'yyyy-MM-dd'))
      setFormReason('')
    } catch (e2) {
      console.error('leave_requests submit error', e2)
      setError(e2.message)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    if (!user || !isAdmin) return
    setError(null)
    try {
      const { error: err } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id)

      if (err) throw err
      await reloadList()
    } catch (e) {
      console.error('leave_requests update status error', e)
      setError(e.message)
    }
  }

  if (!user) {
    return <Loading />
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        申請（有休・残業など）
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        デモ用の簡易申請フォームです。送信されたデータは毎日0時にリセットされます。
      </p>

      <ErrorMessage message={error} />

      {/* フォーム */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          新規申請
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <label style={labelStyle}>日付</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>種別</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              style={inputStyle}
            >
              <option value="paid">有休</option>
              <option value="half_am">半休(午前)</option>
              <option value="half_pm">半休(午後)</option>
              <option value="absence">欠勤</option>
              <option value="overtime">残業</option>
              <option value="holiday_work">休日出勤</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>開始時刻</label>
            <input
              type="time"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>終了時刻</label>
            <input
              type="time"
              value={formEndTime}
              onChange={(e) => setFormEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>理由（任意）</label>
            <textarea
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '60px',
                resize: 'vertical',
              }}
              placeholder="例）病院受診のため など"
            />
          </div>

          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button
              type="submit"
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              申請を送信
            </button>
          </div>
        </form>
      </div>

      {/* 一覧 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          申請一覧
        </h3>

        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>まだ申請はありません。</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>日付</th>
                  <th style={thStyle}>申請者</th>
                  <th style={thStyle}>種別</th>
                  <th style={thStyle}>時間</th>
                  <th style={thStyle}>理由</th>
                  <th style={thStyle}>ステータス</th>
                  {isAdmin && <th style={thStyle}>操作</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusLabel = STATUS_LABELS[item.status] ?? item.status

                  return (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.date}</td>
                      <td style={tdStyle}>{item.profiles?.name ?? 'ユーザー'}</td>
                      <td style={tdStyle}>{TYPE_LABELS[item.type] ?? item.type}</td>
                      <td style={tdStyle}>
                        {item.start_time && item.end_time
                          ? `${item.start_time}〜${item.end_time}`
                          : ''}
                      </td>
                      <td style={tdStyle}>{item.reason}</td>
                      <td style={tdStyle}>{statusLabel}</td>
                      {isAdmin && (
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.25rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'approved')}
                              style={smallBtnStyle('#16a34a')}
                            >
                              承認
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'rejected')}
                              style={smallBtnStyle('#dc2626')}
                            >
                              却下
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.8rem',
  color: '#4b5563',
}

const inputStyle = {
  width: '100%',
  padding: '0.35rem 0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
}

const thStyle = {
  textAlign: 'left',
  padding: '0.4rem 0.35rem',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.4rem 0.35rem',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
}

const smallBtnStyle = (bg) => ({
  padding: '0.2rem 0.45rem',
  borderRadius: '999px',
  border: 'none',
  backgroundColor: bg,
  color: '#ffffff',
  fontSize: '0.75rem',
  cursor: 'pointer',
})
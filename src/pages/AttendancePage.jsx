import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function AttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [record, setRecord] = useState(null)
  const [saving, setSaving] = useState(false)
  const [clockIn, setClockIn] = useState('')
  const [clockOut, setClockOut] = useState('')
  const [breakMinutes, setBreakMinutes] = useState(60)

  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('work_date', todayStr)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') throw error

        if (mounted) {
          setRecord(data || null)
          if (data) {
            if (data.clock_in_at) {
              const t = new Date(data.clock_in_at)
              setClockIn(format(t, 'HH:mm'))
            }
            if (data.clock_out_at) {
              const t = new Date(data.clock_out_at)
              setClockOut(format(t, 'HH:mm'))
            }
            if (data.break_minutes != null) setBreakMinutes(data.break_minutes)
          }
        }
      } catch (err) {
        console.error('attendance load error', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user.id, todayStr])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let clockInAt = null
      let clockOutAt = null
      let totalMinutes = null

      if (clockIn) {
        const [h, m] = clockIn.split(':').map(Number)
        clockInAt = new Date(today)
        clockInAt.setHours(h, m, 0, 0)
      }
      if (clockOut) {
        const [h, m] = clockOut.split(':').map(Number)
        clockOutAt = new Date(today)
        clockOutAt.setHours(h, m, 0, 0)
      }
      if (clockInAt && clockOutAt) {
        const diffMs = clockOutAt.getTime() - clockInAt.getTime()
        totalMinutes = Math.max(
          0,
          Math.round(diffMs / (1000 * 60)) - Number(breakMinutes || 0),
        )
      }

      const payload = {
        user_id: user.id,
        work_date: todayStr,
        clock_in_at: clockInAt ? clockInAt.toISOString() : null,
        clock_out_at: clockOutAt ? clockOutAt.toISOString() : null,
        break_minutes: breakMinutes ? Number(breakMinutes) : 0,
        total_minutes: totalMinutes,
        status: totalMinutes != null ? 'working' : 'draft',
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'user_id,work_date' })
        .select('*')
        .single()

      if (error) throw error

      setRecord(data)
    } catch (err) {
      console.error('attendance save error', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        本日の勤怠入力（{format(today, 'yyyy/MM/dd')}）
      </h2>
      <ErrorMessage message={error} />
      <form
        onSubmit={handleSave}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          maxWidth: '480px',
        }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <label
            htmlFor="clockIn"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            出勤時刻
          </label>
          <input
            id="clockIn"
            type="time"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
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
            htmlFor="clockOut"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            退勤時刻
          </label>
          <input
            id="clockOut"
            type="time"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
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
            htmlFor="breakMinutes"
            style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}
          >
            休憩時間（分）
          </label>
          <input
            id="breakMinutes"
            type="number"
            min="0"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: '0.25rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: saving ? '#9ca3af' : '#111827',
            color: '#f9fafb',
            fontSize: '0.9rem',
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? '保存中…' : '保存'}
        </button>

        {record && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            合計労働時間:{' '}
            {record.total_minutes != null ? `${record.total_minutes} 分` : '未計算'}
          </div>
        )}
      </form>
    </div>
  )
}

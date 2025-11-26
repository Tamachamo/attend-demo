// src/pages/AttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

const BREAK_MINUTES = 60 // 固定休憩時間（分）

export default function AttendancePage() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    let cancelled = false

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
        if (!cancelled) setRecord(data ?? null)
      } catch (e) {
        console.error('attendance load error', e)
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, todayStr])

  if (!user || loading) return <Loading />

  function calcTotalMinutes(clockInIso, clockOutIso, breakMinutes = BREAK_MINUTES) {
    if (!clockInIso || !clockOutIso) return null
    const start = new Date(clockInIso)
    const end = new Date(clockOutIso)
    const diffMs = end.getTime() - start.getTime()
    const diff = Math.floor(diffMs / 60000) - breakMinutes
    return diff > 0 ? diff : 0
  }

  async function handleClockIn() {
    if (!user) return
    if (record?.clock_in_at) {
      setError('本日はすでに出勤が記録されています。')
      return
    }

    setSaving(true)
    setError(null)
    setMessage('')
    try {
      const nowIso = new Date().toISOString()

      if (!record) {
        // 新規レコード
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            user_id: user.id,
            work_date: todayStr,
            clock_in_at: nowIso,
            clock_out_at: null,
            break_minutes: BREAK_MINUTES,
            total_minutes: null,
            status: 'working',
          })
          .select('*')
          .single()

        if (error) throw error
        setRecord(data)
      } else {
        // 既存レコード更新（clock_in_at がまだ無いパターン）
        const { data, error } = await supabase
          .from('attendance_records')
          .update({
            clock_in_at: nowIso,
            break_minutes: BREAK_MINUTES,
            status: 'working',
          })
          .eq('id', record.id)
          .select('*')
          .single()

        if (error) throw error
        setRecord(data)
      }

      setMessage('出勤時刻を記録しました。')
    } catch (e) {
      console.error('clock in error', e)
      setError('出勤時刻の記録に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  async function handleClockOut() {
    if (!user) return
    if (!record?.clock_in_at) {
      setError('出勤が記録されていません。')
      return
    }
    if (record?.clock_out_at) {
      setError('本日はすでに退勤が記録されています。')
      return
    }

    setSaving(true)
    setError(null)
    setMessage('')
    try {
      const nowIso = new Date().toISOString()
      const totalMinutes = calcTotalMinutes(
        record.clock_in_at,
        nowIso,
        record.break_minutes ?? BREAK_MINUTES,
      )

      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          clock_out_at: nowIso,
          total_minutes: totalMinutes,
          status: 'off', // ダッシュボード側で「勤務外」と表示
        })
        .eq('id', record.id)
        .select('*')
        .single()

      if (error) throw error
      setRecord(data)
      setMessage('退勤時刻を記録しました。')
    } catch (e) {
      console.error('clock out error', e)
      setError('退勤時刻の記録に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  function formatTime(iso) {
    if (!iso) return '-'
    const d = new Date(iso)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const workTimeLabel =
    record?.clock_in_at || record?.clock_out_at
      ? `${formatTime(record?.clock_in_at)} 〜 ${formatTime(record?.clock_out_at)}`
      : ''

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        勤怠入力
      </h2>

      <ErrorMessage message={error} />

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
        }}
      >
        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          対象日：{format(today, 'yyyy/MM/dd')}（{'日月火水木金土'[today.getDay()]}）
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleClockIn}
            disabled={saving || !!record?.clock_in_at}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: record?.clock_in_at ? '#d1d5db' : '#fbbf24',
              color: '#111827',
              fontWeight: 600,
              cursor:
                saving || record?.clock_in_at ? 'not-allowed' : 'pointer',
            }}
          >
            出勤
          </button>

          <button
            onClick={handleClockOut}
            disabled={saving || !record?.clock_in_at || !!record?.clock_out_at}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor:
                !record?.clock_in_at || record?.clock_out_at
                  ? '#d1d5db'
                  : '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              cursor:
                !record?.clock_in_at || record?.clock_out_at || saving
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            退勤
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span>出勤時刻</span>
            <span>{formatTime(record?.clock_in_at)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span>退勤時刻</span>
            <span>{formatTime(record?.clock_out_at)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span>休憩時間</span>
            <span>{record?.break_minutes ?? BREAK_MINUTES} 分</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>実働時間</span>
            <span>
              {record?.total_minutes != null
                ? `${Math.floor(record.total_minutes / 60)}時間${
                    record.total_minutes % 60
                  }分`
                : '-'}
            </span>
          </div>
        </div>

        {workTimeLabel && (
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#4b5563',
            }}
          >
            勤務時間：{workTimeLabel}
          </p>
        )}

        {message && (
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#059669',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
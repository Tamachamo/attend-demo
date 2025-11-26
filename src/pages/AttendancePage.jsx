// src/pages/AttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const BREAK_MINUTES = 60 // 休憩時間（分）。事前設定値として自動計算に使用。

export default function AttendancePage() {
  const { profile } = useAuth() // profiles テーブルの行を想定
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const todayDateStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!profile?.id) return
    fetchTodayRecord()
  }, [profile?.id])

  async function fetchTodayRecord() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', profile.id)
        .eq('work_date', todayDateStr)
        .maybeSingle()

      if (error) throw error
      setTodayRecord(data)
    } catch (err) {
      console.error('fetchTodayRecord error', err)
      setError('本日の勤怠情報の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  function calcTotalMinutes(clockInIso, clockOutIso, breakMinutes) {
    const start = new Date(clockInIso)
    const end = new Date(clockOutIso)
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    return Math.max(diffMinutes - (breakMinutes || 0), 0)
  }

  async function handleClockIn() {
    if (!profile?.id) return
    setError('')
    setMessage('')

    // すでに出勤済みなら何もしない
    if (todayRecord?.clock_in_at) {
      setError('本日はすでに出勤済みです。')
      return
    }

    setSaving(true)
    try {
      const nowIso = new Date().toISOString()

      if (!todayRecord) {
        // 新規レコードを作成
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            user_id: profile.id,
            work_date: todayDateStr,
            clock_in_at: nowIso,
            clock_out_at: null,
            break_minutes: BREAK_MINUTES,
            total_minutes: null,
            status: 'working',
          })
          .select('*')
          .single()
        if (error) throw error
        setTodayRecord(data)
      } else {
        // 既存レコードを更新（clock_in_at が空だったパターン）
        const { data, error } = await supabase
          .from('attendance_records')
          .update({
            clock_in_at: nowIso,
            break_minutes: BREAK_MINUTES,
            status: 'working',
          })
          .eq('id', todayRecord.id)
          .select('*')
          .single()
        if (error) throw error
        setTodayRecord(data)
      }

      setMessage('出勤時刻を記録しました。')
    } catch (err) {
      console.error('handleClockIn error', err)
      setError('出勤の記録に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  async function handleClockOut() {
    if (!profile?.id) return
    setError('')
    setMessage('')

    if (!todayRecord?.clock_in_at) {
      setError('出勤が記録されていません。')
      return
    }
    if (todayRecord?.clock_out_at) {
      setError('本日はすでに退勤済みです。')
      return
    }

    setSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const totalMinutes = calcTotalMinutes(
        todayRecord.clock_in_at,
        nowIso,
        todayRecord.break_minutes ?? BREAK_MINUTES
      )

      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          clock_out_at: nowIso,
          total_minutes: totalMinutes,
          status: 'done',
        })
        .eq('id', todayRecord.id)
        .select('*')
        .single()

      if (error) throw error
      setTodayRecord(data)
      setMessage('退勤時刻を記録しました。')
    } catch (err) {
      console.error('handleClockOut error', err)
      setError('退勤の記録に失敗しました。')
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

  const isWorking = !!todayRecord?.clock_in_at && !todayRecord?.clock_out_at

  return (
    <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          勤怠入力
        </h1>

        {loading ? (
          <p>読み込み中です...</p>
        ) : (
          <>
            <p style={{ marginBottom: '0.5rem' }}>
              対象日：{todayDateStr}（本日）
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '0.75rem',
              }}
            >
              <button
                onClick={handleClockIn}
                disabled={saving || !!todayRecord?.clock_in_at}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: todayRecord?.clock_in_at
                    ? '#d1d5db'
                    : '#fbbf24',
                  color: '#111827',
                  fontWeight: 600,
                  cursor:
                    saving || todayRecord?.clock_in_at ? 'not-allowed' : 'pointer',
                }}
              >
                出勤
              </button>

              <button
                onClick={handleClockOut}
                disabled={saving || !isWorking}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: !isWorking ? '#d1d5db' : '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: !isWorking || saving ? 'not-allowed' : 'pointer',
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
                <span>{formatTime(todayRecord?.clock_in_at)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem',
                }}
              >
                <span>退勤時刻</span>
                <span>{formatTime(todayRecord?.clock_out_at)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem',
                }}
              >
                <span>休憩時間</span>
                <span>{todayRecord?.break_minutes ?? BREAK_MINUTES} 分</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>実働時間</span>
                <span>
                  {todayRecord?.total_minutes != null
                    ? `${Math.floor(todayRecord.total_minutes / 60)}時間${
                        todayRecord.total_minutes % 60
                      }分`
                    : '-'}
                </span>
              </div>
            </div>

            {message && (
              <p style={{ marginTop: '0.5rem', color: '#059669', fontSize: '0.85rem' }}>
                {message}
              </p>
            )}
            {error && (
              <p style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.85rem' }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
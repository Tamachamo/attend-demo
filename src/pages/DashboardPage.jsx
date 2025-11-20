import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    todayAttendanceCount: 0,
    todayLeaveCount: 0,
    todayEventCount: 0,
    myTodayStatus: null,
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const today = startOfToday()
        const todayStr = format(today, 'yyyy-MM-dd')

        const { data: attendance, error: attErr } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('work_date', todayStr)

        if (attErr) throw attErr

        const { data: leaves, error: leaveErr } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('date', todayStr)

        if (leaveErr) throw leaveErr

        const startOfDay = today.toISOString()
        const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

        const { data: events, error: eventErr } = await supabase
          .from('manual_events')
          .select('*')
          .lte('start_at', endOfDay)
          .gte('end_at', startOfDay)

        if (eventErr) throw eventErr

        const myRecord = attendance.find((a) => a.user_id === user.id) || null

        if (mounted) {
          setStats({
            todayAttendanceCount: attendance.length,
            todayLeaveCount: leaves.length,
            todayEventCount: events.length,
            myTodayStatus: myRecord?.status || null,
          })
        }
      } catch (err) {
        console.error('dashboard error', err)
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

  if (loading) return <Loading />

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        本日のサマリー
      </h2>
      <ErrorMessage message={error} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard label="本日の勤怠レコード" value={`${stats.todayAttendanceCount} 件`} />
        <StatCard label="本日の申請" value={`${stats.todayLeaveCount} 件`} />
        <StatCard label="本日の予定" value={`${stats.todayEventCount} 件`} />
        <StatCard
          label="あなたの勤怠ステータス"
          value={stats.myTodayStatus ? stats.myTodayStatus : '未登録'}
        />
      </div>

      <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
        ※ この環境はデモ用です。毎日 0:00（日本時間）にデータがリセットされます。
      </p>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        padding: '0.9rem 1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

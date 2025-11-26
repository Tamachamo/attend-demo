import React, { useEffect, useState } from 'react'
import { format, startOfToday } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

const ATTEND_STATUS_LABELS = {
  working: '勤務中',
  off: '勤務外',
  no_record: '未打刻',
  // もし attendance_records.status に on_time / late / absent などがあればここに足す
  on_time: '定時出勤',
  late: '遅刻',
  absent: '欠勤',
}

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

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [attend, setAttend] = useState(null)
  const [todayEvents, setTodayEvents] = useState([])
  const [todayLeaves, setTodayLeaves] = useState([])
  const [todayAnns, setTodayAnns] = useState([])
  const [workingList, setWorkingList] = useState([]) // 本日出勤中のユーザー一覧

  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        // 今日の勤怠（自分）
        const { data: att, error: attErr } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('work_date', todayStr)
          .maybeSingle()

        if (attErr && attErr.code !== 'PGRST116') throw attErr // not found 以外

        // 今日の予定（全員分・カレンダーのモーダルと同じ中身）
        const { data: ev, error: evErr } = await supabase
          .from('manual_events')
          .select('*, profiles(name)')
          .gte('start_at', `${todayStr}T00:00:00`)
          .lt('start_at', `${todayStr}T23:59:59`)
          .order('start_at', { ascending: true })

        if (evErr) throw evErr

        // 今日の申請
        const { data: lr, error: lrErr } = await supabase
          .from('leave_requests')
          .select('*, profiles(name)')
          .eq('date', todayStr)
          .order('created_at', { ascending: true })

        if (lrErr) throw lrErr

        // 今日の連絡事項
        const { data: an, error: anErr } = await supabase
          .from('announcements')
          .select('*')
          .eq('date', todayStr)
          .order('created_at', { ascending: true })

        if (anErr) throw anErr

        // 今日の出勤中ユーザー一覧
        const { data: working, error: workingErr } = await supabase
          .from('attendance_records')
          .select('*, profiles(name)')
          .eq('work_date', todayStr)
          .not('clock_in_at', 'is', null)
          .is('clock_out_at', null)
          .order('clock_in_at', { ascending: true })

        if (workingErr) throw workingErr

        if (!cancelled) {
          setAttend(att ?? null)
          setTodayEvents(ev || [])
          setTodayLeaves(lr || [])
          setTodayAnns(an || [])
          setWorkingList(working || [])
        }
      } catch (e) {
        console.error('dashboard load error', e)
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

  const statusLabel =
    ATTEND_STATUS_LABELS[attend?.status] ??
    (attend ? '記録あり' : '未打刻')

  const timeLabel =
    attend && attend.clock_in_at
      ? `${attend.clock_in} 〜 ${attend.clock_out || '---'}`
      : ''

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        ダッシュボード
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        今日の勤怠状況と予定・申請・連絡事項のサマリーです。
      </p>

      <ErrorMessage message={error} />

      {/* 今日の勤怠（自分） */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '0.4rem',
          }}
        >
          今日の勤怠
        </h3>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.1rem' }}>
          {format(today, 'yyyy/MM/dd')}（{'日月火水木金土'[today.getDay()]}）
        </p>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.1rem' }}>
          状態：{statusLabel}
        </p>
        {timeLabel && (
          <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>時間：{timeLabel}</p>
        )}
      </div>

      {/* 本日の出勤中リスト */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '0.4rem',
          }}
        >
          本日の出勤中リスト
        </h3>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem', color: '#6b7280' }}>
          対象日：{format(today, 'yyyy/MM/dd')}
        </p>

        {workingList.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            現在出勤中のユーザーはいません。
          </p>
        ) : (
          <ul style={listStyle}>
            {workingList.map((w) => (
              <li key={w.id} style={listItemStyle}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {w.profiles?.name ?? 'ユーザー'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      出勤時刻{' '}
                      {w.clock_in_at
                        ? format(new Date(w.clock_in), 'HH:mm')
                        : '未記録'}
                    </div>
                  </div>
                  <span style={badgeStyle}>勤務中</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 今日の予定・申請・連絡事項（カレンダーモーダルと同じ内容） */}
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
          今日の予定・申請・連絡事項
        </h3>

        {/* 予定 */}
        <SectionTitle>予定</SectionTitle>
        {todayEvents.length === 0 ? (
          <EmptyText>予定はありません。</EmptyText>
        ) : (
          <ul style={listStyle}>
            {todayEvents.map((e) => (
              <li key={e.id} style={listItemStyle}>
                <div style={{ fontSize: '0.85rem' }}>
                  {e.profiles?.name ?? 'ユーザー'} / {timeRangeFromEvent(e)}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{e.title}</div>
                {e.description && (
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {e.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 申請 */}
        <SectionTitle>申請</SectionTitle>
        {todayLeaves.length === 0 ? (
          <EmptyText>申請はありません。</EmptyText>
        ) : (
          <ul style={listStyle}>
            {todayLeaves.map((l) => (
              <li key={l.id} style={listItemStyle}>
                <div style={{ fontSize: '0.85rem' }}>
                  {l.profiles?.name ?? 'ユーザー'} /{' '}
                  {TYPE_LABELS[l.type] ?? l.type} {timeRangeFromLeave(l)}
                </div>
                {l.reason && (
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    理由：{l.reason}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  ステータス: {STATUS_LABELS[l.status] ?? l.status}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 連絡事項 */}
        <SectionTitle>連絡事項</SectionTitle>
        {todayAnns.length === 0 ? (
          <EmptyText>連絡事項はありません。</EmptyText>
        ) : (
          <ul style={listStyle}>
            {todayAnns.map((a) => (
              <li key={a.id} style={listItemStyle}>
                {a.title && (
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{a.title}</div>
                )}
                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  {a.message}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function timeRangeFromEvent(e) {
  if (!e.start_at) return ''
  const d = new Date(e.start_at)
  const s = format(d, 'HH:mm')
  if (!e.end_at) return s
  const e2 = new Date(e.end_at)
  return `${s}〜${format(e2, 'HH:mm')}`
}

function timeRangeFromLeave(l) {
  if (!l.start_time || !l.end_time) return ''
  return `(${l.start_time}〜${l.end_time})`
}

function SectionTitle({ children }) {
  return (
    <h4
      style={{
        marginTop: '0.75rem',
        marginBottom: '0.25rem',
        fontSize: '0.9rem',
        fontWeight: 600,
      }}
    >
      {children}
    </h4>
  )
}

function EmptyText({ children }) {
  return (
    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
      {children}
    </p>
  )
}

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

const listItemStyle = {
  padding: '0.4rem 0',
  borderBottom: '1px solid #f3f4f6',
}

const badgeStyle = {
  fontSize: '0.8rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '9999px',
  backgroundColor: '#dcfce7',
  color: '#166534',
}
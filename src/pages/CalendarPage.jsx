import React, { useEffect, useState } from 'react'
import {
  addDays,
  eachDayOfInterval,
  format,
  startOfToday,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { supabase } from '../lib/supabaseClient'
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

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [events, setEvents] = useState([])       // manual_events + profiles
  const [leaves, setLeaves] = useState([])       // leave_requests + profiles
  const [anns, setAnns] = useState([])           // announcements

  const [days, setDays] = useState([])
  const [offset, setOffset] = useState(0)        // 日付範囲のオフセット（0=今日中心、+1=未来寄せ…）

  const [selectedDate, setSelectedDate] = useState(null) // Date
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const base = addDays(startOfToday(), offset * 7)   // 週単位で動かす
        const start = addDays(base, -3)
        const end = addDays(base, 10)

        if (!cancelled) {
          setDays(eachDayOfInterval({ start, end }))
        }

        // manual_events + profiles
        const { data: ev, error: evErr } = await supabase
          .from('manual_events')
          .select('*, profiles(name)')
          .gte('start_at', start.toISOString())
          .lte('start_at', addDays(end, 1).toISOString())
          .order('start_at', { ascending: true })

        if (evErr) throw evErr

        // leave_requests + profiles
        const { data: lr, error: lrErr } = await supabase
          .from('leave_requests')
          .select('*, profiles(name)')
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (lrErr) throw lrErr

        // announcements
        const { data: an, error: anErr } = await supabase
          .from('announcements')
          .select('*')
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (anErr) throw anErr

        if (!cancelled) {
          setEvents(ev || [])
          setLeaves(lr || [])
          setAnns(an || [])
        }
      } catch (err) {
        console.error('calendar load error', err)
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [offset])

  if (loading) return <Loading />

  const eventsByDate = groupByDate(events, (e) => e.start_at)
  const leavesByDate = groupByDate(leaves, (l) => l.date)
  const annsByDate = groupByDate(anns, (a) => a.date)

  const today = startOfToday()
  const todayKey = format(today, 'yyyy-MM-dd')

  const handlePrev = () => setOffset((v) => v - 1)
  const handleNext = () => setOffset((v) => v + 1)
  const handleToday = () => setOffset(0)

  const handleDayClick = (day) => {
    setSelectedDate(day)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDate(null)
  }

  const selectedKey =
    selectedDate != null ? format(selectedDate, 'yyyy-MM-dd') : null

  const modalEvents = selectedKey ? eventsByDate[selectedKey] || [] : []
  const modalLeaves = selectedKey ? leavesByDate[selectedKey] || [] : []
  const modalAnns = selectedKey ? annsByDate[selectedKey] || [] : []

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        カレンダー（簡易タイムライン）
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        予定・申請・連絡事項を日付ごとに確認できます。
      </p>

      {/* 日付ナビ */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handlePrev}
          style={navBtnStyle}
        >
          ◀ 前へ（-1週）
        </button>
        <button
          type="button"
          onClick={handleToday}
          style={navBtnStyle}
        >
          今日へ
        </button>
        <button
          type="button"
          onClick={handleNext}
          style={navBtnStyle}
        >
          次へ（+1週）▶
        </button>
      </div>

      <ErrorMessage message={error} />

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[key] || []
            const dayLeaves = leavesByDate[key] || []
            const dayAnns = annsByDate[key] || []
            const isToday = key === todayKey

            return (
              <div
                key={key}
                onClick={() => handleDayClick(d)}
                style={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '0.6rem 0.7rem',
                  minHeight: '120px',
                  backgroundColor: isToday ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem',
                    fontWeight: isToday ? 600 : 500,
                  }}
                >
                  {format(d, 'MM/dd')}（{'日月火水木金土'[d.getDay()]}）
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {dayEvents.length === 0 &&
                    dayLeaves.length === 0 &&
                    dayAnns.length === 0 && <div>予定・申請・連絡事項なし</div>}

                  {dayEvents.map((e) => (
                    <div key={`ev-${e.id}`} style={{ marginTop: '0.15rem' }}>
                      <Badge color="#e0f2fe">予定</Badge>
                      <span>
                        {e.profiles?.name ?? 'ユーザー'} / {timeRangeFromEvent(e)} / {e.title}
                      </span>
                    </div>
                  ))}

                  {dayLeaves.map((l) => (
                    <div key={`lv-${l.id}`} style={{ marginTop: '0.15rem' }}>
                      <Badge color="#fee2e2">申請</Badge>
                      <span>
                        {l.profiles?.name ?? 'ユーザー'} /{' '}
                        {TYPE_LABELS[l.type] ?? l.type}{' '}
                        {timeRangeFromLeave(l)}
                      </span>
                    </div>
                  ))}

                  {dayAnns.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <Badge color="#fef3c7">連絡</Badge>
                      <span>{dayAnns.length} 件</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* モーダル */}
      {showModal && selectedDate && (
        <Modal onClose={closeModal}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            {format(selectedDate, 'yyyy/MM/dd')} の詳細
          </h3>

          {/* 予定 */}
          <SectionTitle>予定</SectionTitle>
          {modalEvents.length === 0 ? (
            <EmptyText>予定はありません。</EmptyText>
          ) : (
            <ul style={listStyle}>
              {modalEvents.map((e) => (
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
          {modalLeaves.length === 0 ? (
            <EmptyText>申請はありません。</EmptyText>
          ) : (
            <ul style={listStyle}>
              {modalLeaves.map((l) => (
                <li key={l.id} style={listItemStyle}>
                  <div style={{ fontSize: '0.85rem' }}>
                    {l.profiles?.name ?? 'ユーザー'} /{' '}
                    {TYPE_LABELS[l.type] ?? l.type}{' '}
                    {timeRangeFromLeave(l)}
                  </div>
                  {l.reason && (
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      理由：{l.reason}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    ステータス: {l.status}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 連絡事項 */}
          <SectionTitle>連絡事項</SectionTitle>
          {modalAnns.length === 0 ? (
            <EmptyText>連絡事項はありません。</EmptyText>
          ) : (
            <ul style={listStyle}>
              {modalAnns.map((a) => (
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
        </Modal>
      )}
    </div>
  )
}

function groupByDate(items, getter) {
  const map = {}
  for (const item of items) {
    const value = getter(item)
    if (!value) continue
    const key =
      typeof value === 'string'
        ? value.slice(0, 10)
        : format(new Date(value), 'yyyy-MM-dd')
    if (!map[key]) map[key] = []
    map[key].push(item)
  return map
}

function timeRangeFromEvent(e) {
  if (!e.start_at) return ''
  const start = new Date(e.start_at)
  const end = e.end_at ? new Date(e.end_at) : null
  const s = format(start, 'HH:mm')
  const eStr = end ? format(end, 'HH:mm') : ''
  return end ? `${s}〜${eStr}` : s
}

function timeRangeFromLeave(l) {
  if (!l.start_time || !l.end_time) return ''
  return `(${l.start_time}〜${l.end_time})`
}

function Badge({ color, children }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.1rem 0.35rem',
        borderRadius: '999px',
        backgroundColor: color,
        fontSize: '0.7rem',
        marginRight: '0.25rem',
      }}
    >
      {children}
    </span>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '0.25rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
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

const navBtnStyle = {
  padding: '0.35rem 0.7rem',
  borderRadius: '999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '0.8rem',
  cursor: 'pointer',
}
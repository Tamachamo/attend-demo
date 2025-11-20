import React, { useEffect, useState } from 'react'
import { addDays, eachDayOfInterval, format, startOfToday } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [leaves, setLeaves] = useState([])

  const today = startOfToday()
  const start = addDays(today, -3)
  const end = addDays(today, 10)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: ev, error: evErr } = await supabase
          .from('manual_events')
          .select('*')
          .gte('start_at', start.toISOString())
          .lte('start_at', addDays(end, 1).toISOString())
          .order('start_at', { ascending: true })

        if (evErr) throw evErr

        const { data: lr, error: lrErr } = await supabase
          .from('leave_requests')
          .select('*')
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (lrErr) throw lrErr

        if (mounted) {
          setEvents(ev || [])
          setLeaves(lr || [])
        }
      } catch (err) {
        console.error('calendar load error', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [start, end])

  if (loading) return <Loading />

  const days = eachDayOfInterval({ start, end })

  const eventsByDate = groupByDate(events, (e) => e.start_at)
  const leavesByDate = groupByDate(leaves, (l) => l.date)

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        カレンダー（簡易タイムライン）
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        今日を中心に前後の期間の予定・申請を一覧表示します。
      </p>
      <ErrorMessage message={error} />

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
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

            return (
              <div
                key={key}
                style={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '0.6rem 0.7rem',
                  minHeight: '120px',
                  backgroundColor:
                    format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                      ? '#eff6ff'
                      : '#ffffff',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem',
                    fontWeight:
                      format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 600 : 500,
                  }}
                >
                  {format(d, 'MM/dd')}（{'日月火水木金土'[d.getDay()]}
                  ）
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {dayEvents.length === 0 && dayLeaves.length === 0 && (
                    <div>予定・申請なし</div>
                  )}

                  {dayEvents.map((e) => (
                    <div key={`ev-${e.id}`} style={{ marginTop: '0.15rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '999px',
                          backgroundColor: '#e0f2fe',
                          fontSize: '0.7rem',
                          marginRight: '0.25rem',
                        }}
                      >
                        予定
                      </span>
                      <span>{e.title}</span>
                    </div>
                  ))}

                  {dayLeaves.map((l) => (
                    <div key={`lv-${l.id}`} style={{ marginTop: '0.15rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '999px',
                          backgroundColor: '#fee2e2',
                          fontSize: '0.7rem',
                          marginRight: '0.25rem',
                        }}
                      >
                        申請
                      </span>
                      <span>{l.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
  }
  return map
}

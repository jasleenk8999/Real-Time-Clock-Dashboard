import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const cityTimezones = [
  { label: 'New York', value: 'America/New_York' },
  { label: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Mumbai', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
]

const defaultZones = ['America/New_York', 'Europe/London', 'Asia/Singapore', 'Asia/Tokyo']
const defaultPrimaryZone = 'Europe/London'

export function getTimeInfo(date, timeZone, showSeconds) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  const hour24 = Number(values.hour || 0)
  const minute = Number(values.minute || 0)
  const second = Number(values.second || 0)
  const hour12 = hour24 % 12 || 12
  const period = hour24 >= 12 ? 'PM' : 'AM'

  return {
    hour24,
    hour12,
    minute,
    second,
    period,
    weekday: values.weekday,
    month: values.month,
    day: values.day,
    year: values.year,
    dateLabel: `${values.weekday} ${values.month} ${values.day}, ${values.year}`,
    digital: `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}${showSeconds ? `:${String(second).padStart(2, '0')}` : ''} ${period}`,
    analogHours: (hour24 % 12) * 30 + minute * 0.5,
    analogMinutes: minute * 6 + second * 0.1,
    analogSeconds: second * 6,
  }
}

function App() {
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const initialZone = cityTimezones.some((city) => city.value === browserTimeZone)
    ? browserTimeZone
    : defaultPrimaryZone

  const [selectedZone, setSelectedZone] = useState(() => {
    if (typeof window === 'undefined') return initialZone
    const saved = window.localStorage.getItem('world-clock-primary-zone')
    return saved && cityTimezones.some((city) => city.value === saved) ? saved : initialZone
  })
  const [selectedZones, setSelectedZones] = useState(() => {
    if (typeof window === 'undefined') return defaultZones
    const saved = window.localStorage.getItem('world-clock-zones')

    if (!saved) return defaultZones

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultZones
    } catch {
      return defaultZones
    }
  })
  const [showSeconds, setShowSeconds] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [accent, setAccent] = useState('#76e3ff')
  const [compactMode, setCompactMode] = useState(false)
  const [now, setNow] = useState(new Date())
  const [alarmTime, setAlarmTime] = useState('07:30')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [alarmStatus, setAlarmStatus] = useState('No alarms set')
  const [ringing, setRinging] = useState(false)
  const audioContextRef = useRef(null)
  const alarmIntervalRef = useRef(null)
  const alarmTriggered = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('world-clock-primary-zone', selectedZone)
  }, [selectedZone])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('world-clock-zones', JSON.stringify(selectedZones))
  }, [selectedZones])

  useEffect(() => {
    if (!alarmEnabled) {
      alarmTriggered.current = false
      return
    }

    const [hours, minutes] = alarmTime.split(':').map(Number)
    const current = getTimeInfo(now, selectedZone, false)

    if (current.hour24 === hours && current.minute === minutes && !alarmTriggered.current) {
      alarmTriggered.current = true
      setRinging(true)
      setAlarmStatus(`Alarm ringing • ${alarmTime}`)
    }

    if (current.hour24 !== hours || current.minute !== minutes) {
      alarmTriggered.current = false
    }
  }, [alarmEnabled, alarmTime, now, selectedZone])

  useEffect(() => {
    if (!ringing) {
      if (alarmIntervalRef.current) {
        window.clearInterval(alarmIntervalRef.current)
        alarmIntervalRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined)
        audioContextRef.current = null
      }
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    const playTone = () => {
      const context = audioContextRef.current
      if (!context) return
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, context.currentTime)
      gainNode.gain.setValueAtTime(0.12, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35)
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.35)
    }

    playTone()
    alarmIntervalRef.current = window.setInterval(playTone, 1400)

    return () => {
      if (alarmIntervalRef.current) {
        window.clearInterval(alarmIntervalRef.current)
        alarmIntervalRef.current = null
      }
    }
  }, [ringing])

  const primaryTime = useMemo(() => getTimeInfo(now, selectedZone, showSeconds), [now, selectedZone, showSeconds])

  const zoneCards = useMemo(
    () => selectedZones.map((zone) => ({ ...getTimeInfo(now, zone, showSeconds), zone })),
    [now, selectedZones, showSeconds],
  )

  const availableZones = cityTimezones.filter((city) => !selectedZones.includes(city.value))

  const addZone = (event) => {
    const value = event.target.value
    if (!value || selectedZones.includes(value)) return
    setSelectedZones((current) => [...current, value])
    event.target.value = ''
  }

  const toggleAlarm = () => {
    if (alarmEnabled) {
      setAlarmEnabled(false)
      setRinging(false)
      setAlarmStatus('Alarm disabled')
      return
    }

    setAlarmEnabled(true)
    setAlarmStatus(`Alarm armed for ${alarmTime}`)
  }

  const dismissAlarm = () => {
    setRinging(false)
    setAlarmEnabled(false)
    setAlarmStatus('Alarm dismissed')
  }

  const snoozeAlarm = () => {
    const currentInfo = getTimeInfo(now, selectedZone, false)
    const totalMinutes = currentInfo.hour24 * 60 + currentInfo.minute + 5
    const nextHour = Math.floor(totalMinutes / 60) % 24
    const nextMinute = totalMinutes % 60
    const nextAlarm = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`

    setAlarmTime(nextAlarm)
    setAlarmEnabled(true)
    setRinging(false)
    setAlarmStatus(`Snoozed until ${nextAlarm}`)
  }

  return (
    <div className={`app-shell ${theme}`} style={{ '--accent': accent }}>
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Real-time intelligence suite</p>
          <h1>World Clock Command Center</h1>
          <p className="summary">
            Track global time, manage zones, and respond to alarms from a single premium dashboard.
          </p>
        </div>
        <div className="hero-badge">
          <span className="pulse-dot" />
          Live sync • 1s updates
        </div>
      </header>

      <section className="controls-panel">
        <label className="toggle-chip">
          <input type="checkbox" checked={showSeconds} onChange={() => setShowSeconds((value) => !value)} />
          <span>Display seconds</span>
        </label>
        <label className="toggle-chip">
          <input type="checkbox" checked={theme === 'light'} onChange={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} />
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </label>
        <label className="toggle-chip">
          <input type="checkbox" checked={compactMode} onChange={() => setCompactMode((value) => !value)} />
          <span>Compact layout</span>
        </label>
        <label className="color-picker">
          <span>Accent</span>
          <input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
        </label>
      </section>

      <main className={`dashboard-grid ${compactMode ? 'compact' : ''}`}>
        <section className="primary-card">
          <div className="primary-heading">
            <div>
              <p className="eyebrow">Primary focus</p>
              <h2>{cityTimezones.find((city) => city.value === selectedZone)?.label ?? selectedZone.replace(/_/g, ' ')}</h2>
            </div>
            <select value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)}>
              {cityTimezones.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div className="clock-wrapper">
            <div className="analog-clock">
              <div className="clock-face">
                {[...Array(12)].map((_, index) => (
                  <span key={index} className="tick" style={{ transform: `rotate(${index * 30}deg)` }} />
                ))}
                {[...Array(12)].map((_, index) => {
                  const angle = (index * 30 * Math.PI) / 180
                  const radius = 88
                  const x = Math.sin(angle) * radius
                  const y = -Math.cos(angle) * radius
                  const value = index === 0 ? 12 : index
                  return (
                    <span
                      key={`number-${index}`}
                      className="clock-number"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {value}
                    </span>
                  )
                })}
                <div className="hand hour" style={{ transform: `rotate(${primaryTime.analogHours}deg)` }} />
                <div className="hand minute" style={{ transform: `rotate(${primaryTime.analogMinutes}deg)` }} />
                <div className="hand second" style={{ transform: `rotate(${primaryTime.analogSeconds}deg)` }} />
                <div className="center-dot" />
              </div>
            </div>

            <div className="live-time">
              <p className="eyebrow">Current time</p>
              <div className="digital-time">{primaryTime.digital}</div>
              <p className="date-line">{primaryTime.dateLabel}</p>
            </div>
          </div>
        </section>

        <section className="alarm-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Alarm control</p>
              <h3>Schedule a wake-up cue</h3>
            </div>
            <span className={`status-badge ${ringing ? 'ringing' : ''}`}>{alarmStatus}</span>
          </div>

          <label className="field">
            <span>Alarm time</span>
            <input type="time" value={alarmTime} onChange={(event) => setAlarmTime(event.target.value)} />
          </label>

          <div className="alarm-actions">
            <button type="button" className="primary-btn" onClick={toggleAlarm}>
              {alarmEnabled ? 'Disable alarm' : 'Enable alarm'}
            </button>
            <button type="button" className="secondary-btn" onClick={snoozeAlarm}>
              Snooze
            </button>
            <button type="button" className="secondary-btn" onClick={dismissAlarm}>
              Dismiss
            </button>
          </div>

          <p className="helper-text">Alarm checks the selected primary zone, plays a tone, and can be snoozed for five minutes.</p>
        </section>
      </main>

      <section className="world-list">
        <div className="card-head">
          <div>
            <p className="eyebrow">Timezone management</p>
            <h3>Multi-region overview</h3>
          </div>
          <label className="select-field">
            <span>Add zone</span>
            <select onChange={addZone} defaultValue="">
              <option value="">Choose a city</option>
              {availableZones.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="zone-grid">
          {zoneCards.map((zoneInfo) => (
            <article key={zoneInfo.zone} className="zone-card">
              <div className="zone-top">
                <h4>{cityTimezones.find((city) => city.value === zoneInfo.zone)?.label || zoneInfo.zone}</h4>
                <button type="button" className="ghost-btn" onClick={() => setSelectedZones((current) => current.filter((item) => item !== zoneInfo.zone))}>
                  Remove
                </button>
              </div>
              <p className="zone-time">{zoneInfo.digital}</p>
              <p className="zone-date">{zoneInfo.dateLabel}</p>
              <p className="zone-name">{zoneInfo.zone}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        © 2026 Jasleen Kaur | PRN: 12410014
      </footer>
    </div>
  )
}

export default App

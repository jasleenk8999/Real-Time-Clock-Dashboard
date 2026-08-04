import { describe, expect, it } from 'vitest'
import { getTimeInfo } from './App.jsx'

describe('getTimeInfo', () => {
  it('formats the hour and minute for a timezone', () => {
    const date = new Date('2026-08-04T13:30:00Z')
    const info = getTimeInfo(date, 'Europe/London', false)

    expect(info.hour12).toBe(2)
    expect(info.minute).toBe(30)
    expect(info.period).toBe('PM')
    expect(info.digital).toContain('02:30 PM')
  })

  it('supports seconds when requested', () => {
    const date = new Date('2026-08-04T13:30:45Z')
    const info = getTimeInfo(date, 'UTC', true)

    expect(info.second).toBe(45)
    expect(info.digital).toContain(':45')
  })
})

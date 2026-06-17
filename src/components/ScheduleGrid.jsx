import React, { useState, useEffect } from 'react'

function ScheduleGrid() {
  const [events, setEvents] = useState([])
  const [isGcalConnected, setIsGcalConnected] = useState(() => {
    return localStorage.getItem('the_routine_gcal_connected') === 'true'
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [editId, setEditId] = useState('')
  const [title, setTitle] = useState('')
  const [day, setDay] = useState(1)
  const [color, setColor] = useState('violet')
  const [room, setRoom] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('11:00')

  // Helpers
  const timeToMinutes = (timeStr) => {
    const parts = timeStr.split(':')
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  }

  const formatTime12 = (time24) => {
    if (!time24) return ''
    const parts = time24.split(':')
    let hour = parseInt(parts[0], 10)
    const minute = parts[1]
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12
    hour = hour ? hour : 12
    return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`
  }

  // Conflict checking: detects hour overlaps on the same day
  const checkConflicts = (eventList) => {
    const list = eventList.map(e => ({ ...e, hasConflict: false }))
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]

        if (parseInt(a.day, 10) === parseInt(b.day, 10)) {
          const aStart = timeToMinutes(a.start)
          const aEnd = timeToMinutes(a.end)
          const bStart = timeToMinutes(b.start)
          const bEnd = timeToMinutes(b.end)

          if (aStart < bEnd && aEnd > bStart) {
            list[i].hasConflict = true
            list[j].hasConflict = true
          }
        }
      }
    }
    return list
  }

  // Load events from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem('the_routine_timetable')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setEvents(checkConflicts(parsed))
      } catch (e) {
        setEvents([])
      }
    } else {
      const defaultEvents = [
        {
          id: 'e1',
          title: 'CS-302 Operating Systems',
          day: 1, // Monday
          start: '09:00',
          end: '11:00',
          room: 'Lecture Hall C',
          color: 'violet'
        },
        {
          id: 'e2',
          title: 'PHY-104 Lab Period',
          day: 1, // Monday
          start: '14:00',
          end: '17:00',
          room: 'Lab 4B',
          color: 'cyan'
        },
        {
          id: 'e3',
          title: 'MATH-201 Linear Algebra',
          day: 2, // Tuesday
          start: '10:00',
          end: '12:00',
          room: 'Room 201',
          color: 'emerald'
        },
        {
          id: 'e4',
          title: 'CS-302 OS Discussion',
          day: 3, // Wednesday
          start: '09:00',
          end: '10:00',
          room: 'Seminar A',
          color: 'violet'
        }
      ]
      const withConflicts = checkConflicts(defaultEvents)
      setEvents(withConflicts)
      localStorage.setItem('the_routine_timetable', JSON.stringify(withConflicts))
    }
  }, [])

  // Lucide icons setup
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [events, isModalOpen, isSyncing])

  const saveEvents = (updatedList) => {
    const withConflicts = checkConflicts(updatedList)
    setEvents(withConflicts)
    localStorage.setItem('the_routine_timetable', JSON.stringify(withConflicts))
  }

  const triggerGcalSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      let updatedList = [...events]
      if (!isGcalConnected) {
        updatedList.push(
          {
            id: 'gcal-1',
            title: '🗓️ GCal: Project Group Sync',
            day: 3, // Wednesday
            start: '14:00',
            end: '16:00',
            room: 'Zoom Link',
            color: 'cyan'
          },
          {
            id: 'gcal-2',
            title: '🗓️ GCal: Gym Workout',
            day: 4, // Thursday
            start: '16:00',
            end: '18:00',
            room: 'Campus Gym',
            color: 'rose'
          }
        )
        setIsGcalConnected(true)
        localStorage.setItem('the_routine_gcal_connected', 'true')
      }
      saveEvents(updatedList)
      setIsSyncing(false)
    }, 2500)
  }

  const handleOpenAddModal = () => {
    setEditId('')
    setTitle('')
    setDay(1)
    setColor('violet')
    setRoom('')
    setStart('09:00')
    setEnd('11:00')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (eventObj) => {
    setEditId(eventObj.id)
    setTitle(eventObj.title)
    setDay(eventObj.day)
    setColor(eventObj.color)
    setRoom(eventObj.room || '')
    setStart(eventObj.start)
    setEnd(eventObj.end)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const startHour = parseInt(start.split(':')[0], 10)
    const endHour = parseInt(end.split(':')[0], 10)

    if (endHour <= startHour) {
      alert('End time must be after the start time.')
      return
    }

    let updatedList = [...events]

    if (editId) {
      updatedList = updatedList.map(ev => {
        if (ev.id === editId) {
          return {
            ...ev,
            title: title.trim(),
            day: parseInt(day, 10),
            color,
            room: room.trim(),
            start,
            end
          }
        }
        return ev
      })
    } else {
      const newEvent = {
        id: Date.now().toString(),
        title: title.trim(),
        day: parseInt(day, 10),
        color,
        room: room.trim(),
        start,
        end
      }
      updatedList.push(newEvent)
    }

    saveEvents(updatedList)
    setIsModalOpen(false)
  }

  const handleDeleteEvent = () => {
    if (editId) {
      const updatedList = events.filter(e => e.id !== editId)
      saveEvents(updatedList)
      setIsModalOpen(false)
    }
  }

  const daysOfWeek = [
    { num: 1, label: 'Monday' },
    { num: 2, label: 'Tuesday' },
    { num: 3, label: 'Wednesday' },
    { num: 4, label: 'Thursday' },
    { num: 5, label: 'Friday' },
    { num: 6, label: 'Saturday' },
    { num: 0, label: 'Sunday' }
  ]

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM'
  ]

  return (
    <>
      <div className="timetable-container glass-panel">
        <div className="timetable-header-row">
          <div className="header-info">
            <h2>Weekly Schedule Planner</h2>
            <p>Organize classes, labs, and study times. Google Calendar events are synchronized.</p>
          </div>
          <div className="gcal-sync-status">
            <div className={`gcal-indicator ${isGcalConnected ? 'synced' : ''}`}>
              {isSyncing ? (
                <>
                  <i data-lucide="refresh-cw" className="spin" style={{ width: '14px', height: '14px' }}></i>
                  <span>Syncing...</span>
                </>
              ) : isGcalConnected ? (
                <>
                  <i data-lucide="check-circle" style={{ width: '14px', height: '14px' }}></i>
                  <span>GCal Connected</span>
                </>
              ) : (
                <>
                  <i data-lucide="alert-circle" style={{ width: '14px', height: '14px' }}></i>
                  <span>Not Connected</span>
                </>
              )}
            </div>
            <button className="btn gcal-btn btn-sm" onClick={triggerGcalSync} disabled={isSyncing}>
              <i data-lucide="refresh-cw" className={isSyncing ? 'spin' : ''}></i> Sync Calendar
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <i data-lucide="plus"></i> Add Event
            </button>
          </div>
        </div>

        <div className="timetable-wrapper" style={{ position: 'relative' }}>
          {isSyncing && (
            <div className="sync-loader-overlay" style={{ display: 'flex' }}>
              <i data-lucide="calendar" className="pulse" style={{ width: '44px', height: '44px', color: 'var(--accent-cyan)' }}></i>
              <p style={{ marginTop: '12px', fontWeight: 700 }}>Syncing Google Calendar Events...</p>
              <div className="liquid-fill-bar">
                <div className="liquid-fill-progress" style={{ animation: 'liquidFill 2.5s linear forwards' }}></div>
              </div>
            </div>
          )}

          <div className="timetable-grid">
            {/* Hours column */}
            <div className="time-col">
              <div className="grid-cell corner-cell">Time</div>
              {timeSlots.map(t => (
                <div key={t} className="grid-cell time-cell">{t}</div>
              ))}
            </div>

            {/* Days of Week columns */}
            {daysOfWeek.map(dayObj => {
              const dayEvents = events.filter(e => parseInt(e.day, 10) === dayObj.num)
              return (
                <div key={dayObj.num} className="day-col" data-day={dayObj.num}>
                  <div className="grid-cell day-header">{dayObj.label}</div>
                  <div className="day-events-container">
                    {dayEvents.map(event => {
                      const startHour = parseInt(event.start.split(':')[0], 10)
                      const endHour = parseInt(event.end.split(':')[0], 10)
                      const topOffset = (startHour - 8) * 60
                      const height = (endHour - startHour) * 60 - 8

                      return (
                        <div
                          key={event.id}
                          className={`event-card event-theme-${event.color} ${event.hasConflict ? 'has-conflict' : ''}`}
                          style={{ top: `${topOffset}px`, height: `${height}px` }}
                          onClick={() => handleOpenEditModal(event)}
                        >
                          <div className="event-card-title">{event.title}</div>
                          {event.room && (
                            <div className="event-card-room">
                              <i data-lucide="map-pin" style={{ width: '10px', height: '10px' }}></i> {event.room}
                            </div>
                          )}
                          <div className="event-card-time">
                            {formatTime12(event.start)} - {formatTime12(event.end)}
                          </div>
                          {event.hasConflict && (
                            <div className="event-card-room" style={{ color: '#ef4444' }}>
                              <i data-lucide="alert-triangle" style={{ width: '10px', height: '10px' }}></i> Time Conflict
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MODAL: ADD/EDIT EVENT */}
      {isModalOpen && (
        <div className="modal-backdrop active" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Course Event' : 'Schedule Course Event'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="event-title">Course Code / Subject Name</label>
                <input
                  type="text"
                  id="event-title"
                  required
                  placeholder="E.g., CS-301 Advanced Algorithms"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="event-day">Day of Week</label>
                  <select
                    id="event-day"
                    className="form-control"
                    value={day}
                    onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
                <div className="form-group col">
                  <label htmlFor="event-color">Theme Color</label>
                  <select
                    id="event-color"
                    className="form-control"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  >
                    <option value="violet">Violet</option>
                    <option value="cyan">Cyan</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="event-room">Location / Virtual Meeting Link</label>
                <input
                  type="text"
                  id="event-room"
                  placeholder="E.g., Room 402B or zoom.com/meet"
                  className="form-control"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group col">
                  <label htmlFor="event-start">Start Time</label>
                  <select
                    id="event-start"
                    className="form-control"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                  </select>
                </div>
                <div className="form-group col">
                  <label htmlFor="event-end">End Time</label>
                  <select
                    id="event-end"
                    className="form-control"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                {editId && (
                  <button type="button" className="btn btn-secondary" onClick={handleDeleteEvent}>
                    Delete
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ScheduleGrid

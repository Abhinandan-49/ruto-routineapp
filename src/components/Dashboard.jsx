import React, { useState, useEffect } from 'react'

function Dashboard({ switchTab, xp, streak }) {
  const [completedToday, setCompletedToday] = useState(0)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const [urgentTasks, setUrgentTasks] = useState([])
  const [todayEvents, setTodayEvents] = useState([])

  // Calculate Level and Progress percentage
  const routineLevel = Math.floor(xp / 1000) + 1
  const xpInCurrentLevel = xp % 1000
  const progressPercent = Math.min((xpInCurrentLevel / 1000) * 100, 100)

  useEffect(() => {
    // Load tasks from local storage
    const loadDashboardStats = () => {
      const storedTasks = JSON.parse(localStorage.getItem('the_routine_tasks') || '[]')
      
      // Calculate completed today (just general completed tasks)
      const completedCount = storedTasks.filter(t => t.completed).length
      setCompletedToday(completedCount)

      // Get urgent tasks (pending & priority === High)
      const urgent = storedTasks.filter(t => !t.completed && t.priority === 'High')
      setUrgentTasks(urgent.slice(0, 3)) // show top 3 urgent

      // Load focus minutes
      const focusTime = parseInt(localStorage.getItem('the_routine_focus_time') || '0', 10)
      setFocusMinutes(focusTime)

      // Load today's schedule events
      const storedSchedule = JSON.parse(localStorage.getItem('the_routine_timetable') || '[]')
      const todayDayNum = new Date().getDay() // 0 is Sunday, 1 is Monday...
      
      // Filter events matching today's day
      const todayEvs = storedSchedule.filter(ev => parseInt(ev.day, 10) === todayDayNum)
      
      // Sort events by start time (e.g. "08:00")
      todayEvs.sort((a, b) => a.start.localeCompare(b.start))
      setTodayEvents(todayEvs)
    }

    loadDashboardStats()
    
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [xp])

  // Format military start/end times into readable AM/PM format
  const formatTimeDisplay = (time24) => {
    if (!time24) return ''
    const [hourStr, minStr] = time24.split(':')
    const hour = parseInt(hourStr, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    return `${displayHour.toString().padStart(2, '0')}:${minStr} ${ampm}`
  }

  return (
    <div className="dashboard-grid">
      {/* Greeting / Streak hero card */}
      <div className="dash-hero glass-panel grid-span-2">
        <div className="hero-content">
          <h2>Enter Your Focus Flow.</h2>
          <p>
            Welcome back! You completed <span className="highlight-text" id="dash-done-count">{completedToday}</span> tasks today and tracked <span className="highlight-text" id="dash-focus-count">{focusMinutes}m</span> of deep study. Maintain your rhythm!
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => switchTab('timer')}>
              <i data-lucide="play"></i> Focus Hub
            </button>
            <button className="btn btn-secondary" onClick={() => switchTab('tasks')}>
              <i data-lucide="list"></i> Manage Tasks
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glass-sphere"></div>
        </div>
      </div>

      {/* Streak Card with flame visual overlay */}
      <div className="glass-panel streak-card">
        <div className="streak-flame-container">
          <div className="streak-flame"></div>
          <div className="streak-flame-particles"></div>
        </div>
        <h3 className="highlight-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
          {streak} Days
        </h3>
        <p className="stat-label">Daily Focus Streak</p>
      </div>

      {/* Routine badge XP progress level bar */}
      <div className="glass-panel stat-card">
        <div className="card-icon">
          <i data-lucide="star" style={{ color: 'var(--accent-violet)' }}></i>
        </div>
        <div className="stat-info" style={{ width: 'calc(100% - 70px)' }}>
          <h3>Routine Level</h3>
          <div className="stat-number" id="dash-level-number">Lvl {routineLevel}</div>
          <div className="gpa-progress-bar">
            <div className="gpa-progress-fill" id="dash-xp-progress" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="stat-label" style={{ marginTop: '4px' }}>
            {xpInCurrentLevel} / 1000 XP to next badge
          </p>
        </div>
      </div>

      {/* Schedule grid checklist previews */}
      <div className="glass-panel schedule-preview grid-span-2">
        <div className="panel-header">
          <h3><i data-lucide="book-open"></i> Timetable for Today</h3>
          <button className="btn-text" onClick={() => switchTab('timetable')}>Grid View</button>
        </div>
        <div className="schedule-preview-list" id="dash-schedule-today">
          {todayEvents.length === 0 ? (
            <div className="empty-state-text" style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No classes scheduled for today! Enjoy the free slot.
            </div>
          ) : (
            todayEvents.map(event => (
              <div key={event.id} className={`preview-schedule-item border-${event.color || 'violet'}`} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: '12px',
                marginBottom: '8px',
                borderLeft: `4px solid var(--accent-${event.color || 'violet'})`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{event.title}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{event.room || 'No location specified'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--accent-cyan)' }}>
                  {formatTimeDisplay(event.start)} - {formatTimeDisplay(event.end)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Urgent todo previews */}
      <div className="glass-panel task-preview grid-span-2">
        <div className="panel-header">
          <h3><i data-lucide="check-circle2"></i> Urgent Todo list</h3>
          <button className="btn-text" onClick={() => switchTab('tasks')}>Full Board</button>
        </div>
        <div className="task-preview-list" id="dash-tasks-today">
          {urgentTasks.length === 0 ? (
            <div className="empty-state-text" style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No urgent tasks pending! Great job keeping up.
            </div>
          ) : (
            urgentTasks.map(task => (
              <div key={task.id} className="preview-task-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                marginBottom: '8px'
              }}>
                <span className="priority-badge-text" style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: 'var(--color-danger)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>Urgent</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, flexGrow: 1 }}>{task.title}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {task.dueDate ? `Due: ${task.dueDate}` : 'No due date'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

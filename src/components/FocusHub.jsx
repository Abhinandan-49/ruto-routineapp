import React, { useState, useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import confetti from 'canvas-confetti'

function FocusHub({ incrementXp }) {
  const [mode, setMode] = useState('pomodoro') // 'pomodoro' | 'stopwatch'
  const [isRunning, setIsRunning] = useState(false)

  // Pomodoro states
  const [pomoPhase, setPomoPhase] = useState('focus') // 'focus' | 'break'
  const [workMins, setWorkMins] = useState(25)
  const [breakMins, setBreakMins] = useState(5)
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60)
  const [pomoTotalDuration, setPomoTotalDuration] = useState(25 * 60)

  // Stopwatch states
  const [swElapsedTime, setSwElapsedTime] = useState(0)
  const [swLaps, setSwLaps] = useState([])

  // Global gamification states synced with localStorage
  const [totalFocusTime, setTotalFocusTime] = useState(() => {
    return parseInt(localStorage.getItem('the_routine_focus_time') || '0', 10)
  })
  const [studyLogs, setStudyLogs] = useState(() => {
    const data = localStorage.getItem('the_routine_study_logs')
    if (data) {
      try {
        return JSON.parse(data)
      } catch (e) {
        return []
      }
    }
    // Default logs
    return [
      { id: 'l1', type: 'Pomodoro', duration: '25m', timestamp: 'Yesterday', status: 'Completed' },
      { id: 'l2', type: 'Pomodoro', duration: '25m', timestamp: 'Yesterday', status: 'Completed' }
    ]
  })

  // Timer refs
  const timerIntervalRef = useRef(null)
  const swStartTimeRef = useRef(0)
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const ringCircumference = 596.9

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('the_routine_focus_time', totalFocusTime.toString())
  }, [totalFocusTime])

  useEffect(() => {
    localStorage.setItem('the_routine_study_logs', JSON.stringify(studyLogs))
  }, [studyLogs])

  // Chart rendering and updating
  useEffect(() => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 180)
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)')
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)')

    const chartConfig = {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Focus Minutes',
          data: [45, 60, 30, 90, 75, 120, totalFocusTime > 0 ? totalFocusTime : 40],
          borderColor: '#06b6d4',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#7c3aed',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
          }
        }
      }
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }
    chartInstanceRef.current = new Chart(ctx, chartConfig)

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [totalFocusTime])

  // Sync icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [mode, isRunning, pomoPhase, swLaps, studyLogs])

  // Handle work mins and break mins input changes
  useEffect(() => {
    if (mode === 'pomodoro' && pomoPhase === 'focus' && !isRunning) {
      setPomoSecondsLeft(workMins * 60)
      setPomoTotalDuration(workMins * 60)
    }
  }, [workMins, mode, pomoPhase, isRunning])

  useEffect(() => {
    if (mode === 'pomodoro' && pomoPhase === 'break' && !isRunning) {
      setPomoSecondsLeft(breakMins * 60)
      setPomoTotalDuration(breakMins * 60)
    }
  }, [breakMins, mode, pomoPhase, isRunning])

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Timer Tick Logic
  const startTimer = () => {
    setIsRunning(true)

    // Update Header active focus state (DOM elements)
    const headerStatus = document.getElementById('header-focus-status')
    const headerDot = document.querySelector('.indicator-dot')
    if (headerStatus) {
      headerStatus.textContent = mode === 'pomodoro' ? `Focusing: ${pomoPhase.toUpperCase()}` : 'Stopwatch Running'
    }
    if (headerDot) {
      headerDot.classList.add('active-study')
    }

    if (mode === 'pomodoro') {
      const targetTime = Date.now() + pomoSecondsLeft * 1000
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000))
        setPomoSecondsLeft(remaining)

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current)
          playAlertSound()
          handlePomoCompletion()
        }
      }, 500)
    } else {
      swStartTimeRef.current = Date.now() - swElapsedTime
      timerIntervalRef.current = setInterval(() => {
        setSwElapsedTime(Date.now() - swStartTimeRef.current)
      }, 10)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    const headerStatus = document.getElementById('header-focus-status')
    const headerDot = document.querySelector('.indicator-dot')
    if (headerStatus) headerStatus.textContent = 'Ready to Flow'
    if (headerDot) headerDot.classList.remove('active-study')
  }

  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  const resetTimer = () => {
    pauseTimer()
    if (mode === 'pomodoro') {
      setPomoPhase('focus')
      setPomoSecondsLeft(workMins * 60)
      setPomoTotalDuration(workMins * 60)
    } else {
      setSwElapsedTime(0)
      setSwLaps([])
    }
  }

  const handlePomoCompletion = () => {
    setIsRunning(false)
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (pomoPhase === 'focus') {
      setTotalFocusTime(prev => prev + workMins)
      incrementXp(100) // 100XP reward

      // Increment daily focus streak
      const currentStreak = parseInt(localStorage.getItem('the_routine_streak') || '5', 10)
      localStorage.setItem('the_routine_streak', (currentStreak + 1).toString())

      // Dispatch global storage event so App.jsx/Header.jsx syncs streak
      window.dispatchEvent(new Event('storage'))

      const newLog = {
        id: Date.now().toString(),
        type: 'Pomodoro',
        duration: `${workMins}m`,
        timestamp: `Today ${timestamp}`,
        status: 'Completed'
      }
      setStudyLogs(prev => [newLog, ...prev])

      // Switch to break
      setPomoPhase('break')
      setPomoSecondsLeft(breakMins * 60)
      setPomoTotalDuration(breakMins * 60)

      alert('Session complete! Time for a glass break.')
    } else {
      setPomoPhase('focus')
      setPomoSecondsLeft(workMins * 60)
      setPomoTotalDuration(workMins * 60)

      alert('Break over! Back to deep flow.')
    }
  }

  const skipPomoPhase = () => {
    pauseTimer()
    if (pomoPhase === 'focus') {
      setPomoPhase('break')
      setPomoSecondsLeft(breakMins * 60)
      setPomoTotalDuration(breakMins * 60)
    } else {
      setPomoPhase('focus')
      setPomoSecondsLeft(workMins * 60)
      setPomoTotalDuration(workMins * 60)
    }
  }

  const recordStopwatchLap = () => {
    if (mode !== 'stopwatch' || swElapsedTime === 0) return

    const currentLapTime = swElapsedTime
    let relativeLapTime = currentLapTime

    if (swLaps.length > 0) {
      relativeLapTime = currentLapTime - swLaps[0].absoluteMs
    }

    const newLap = {
      lapNum: swLaps.length + 1,
      time: formatStopwatchTime(relativeLapTime),
      absoluteMs: currentLapTime
    }
    setSwLaps(prev => [newLap, ...prev])
  }

  const handleOptionClick = () => {
    if (mode === 'pomodoro') {
      skipPomoPhase()
    } else {
      recordStopwatchLap()
    }
  }

  const clearLogs = () => {
    if (mode === 'pomodoro') {
      setStudyLogs([])
    } else {
      setSwLaps([])
    }
  }

  const playAlertSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav')
    audio.play().catch(e => console.log('Audio blocked by browser sandbox.', e))
  }

  // Formatting helpers
  const formatStopwatchTime = (totalMs) => {
    let temp = totalMs
    const ms = Math.floor((temp % 1000) / 10)
    temp = Math.floor(temp / 1000)
    const secs = temp % 60
    temp = Math.floor(temp / 60)
    const mins = temp % 60
    const hrs = Math.floor(temp / 60)

    const msStr = ms.toString().padStart(2, '0')
    const secsStr = secs.toString().padStart(2, '0')
    const minsStr = mins.toString().padStart(2, '0')
    const hrsStr = hrs.toString().padStart(2, '0')

    if (hrs > 0) {
      return `${hrsStr}:${minsStr}:${secsStr}.${msStr}`
    }
    return `${minsStr}:${secsStr}.${msStr}`
  }

  const getPomoTimeDisplay = () => {
    const mins = Math.floor(pomoSecondsLeft / 60)
    const secs = pomoSecondsLeft % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Badge unlock checks
  const isPomoBadgeUnlocked = studyLogs.some(log => log.type === 'Pomodoro')
  const isStopwatchBadgeUnlocked = swLaps.length >= 3
  const isStreakBadgeUnlocked = parseInt(localStorage.getItem('the_routine_streak') || '5', 10) >= 5
  const isXpBadgeUnlocked = parseInt(localStorage.getItem('the_routine_xp') || '450', 10) >= 1000

  // Progress circle mapping
  const percent = mode === 'pomodoro' ? pomoSecondsLeft / pomoTotalDuration : 0
  const dashOffset = mode === 'pomodoro' ? ringCircumference - percent * ringCircumference : 0

  return (
    <div className="timer-layout">
      {/* Focus Controls */}
      <div className="focus-controls-card glass-panel">
        <div className="timer-mode-selector">
          <button
            className={`timer-mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}
            onClick={() => {
              pauseTimer()
              setMode('pomodoro')
              setPomoSecondsLeft(workMins * 60)
              setPomoTotalDuration(workMins * 60)
            }}
          >
            Pomodoro Mode
          </button>
          <button
            className={`timer-mode-btn ${mode === 'stopwatch' ? 'active' : ''}`}
            onClick={() => {
              pauseTimer()
              setMode('stopwatch')
              setSwElapsedTime(0)
              setSwLaps([])
            }}
          >
            Stopwatch Mode
          </button>
        </div>

        {/* Circular visual ring */}
        <div className="timer-ring-wrapper">
          <svg className="timer-svg" viewBox="0 0 220 220">
            <circle className="timer-ring-bg" cx="110" cy="110" r="95"></circle>
            <circle
              className="timer-ring-progress"
              id="timer-progress-ring"
              cx="110"
              cy="110"
              r="95"
              style={{
                strokeDasharray: ringCircumference,
                strokeDashoffset: dashOffset,
                stroke: mode === 'pomodoro' ? 'var(--accent-violet)' : 'var(--accent-cyan)',
                transition: isRunning && mode === 'pomodoro' ? 'stroke-dashoffset 0.5s linear' : 'none'
              }}
            ></circle>
          </svg>
          <div className="timer-text-overlay">
            <span className="timer-countdown" id="timer-display">
              {mode === 'pomodoro' ? getPomoTimeDisplay() : formatStopwatchTime(swElapsedTime)}
            </span>
            <span className="timer-label" id="timer-status-text">
              {mode === 'pomodoro' ? pomoPhase.toUpperCase() : 'STOPWATCH'}
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="timer-actions">
          <button className="btn btn-icon btn-secondary" onClick={resetTimer} title="Reset">
            <i data-lucide="rotate-ccw"></i>
          </button>
          <button className="btn btn-play" onClick={toggleTimer}>
            <i data-lucide={isRunning ? 'pause' : 'play'} id="timer-play-icon"></i>
          </button>
          <button
            className="btn btn-icon btn-secondary"
            onClick={handleOptionClick}
            title={mode === 'pomodoro' ? 'Skip Phase' : 'Record Lap'}
          >
            <i data-lucide={mode === 'pomodoro' ? 'skip-forward' : 'flag'} id="timer-option-icon"></i>
          </button>
        </div>

        {/* Settings Pomodoro */}
        {mode === 'pomodoro' && (
          <div className="pomodoro-settings-inline" id="pomodoro-settings" style={{ display: 'flex' }}>
            <div className="setting-item">
              <label>Work</label>
              <input
                type="number"
                id="pomo-work-input"
                min="1"
                max="120"
                value={workMins}
                onChange={(e) => setWorkMins(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <span>min</span>
            </div>
            <div className="setting-item">
              <label>Break</label>
              <input
                type="number"
                id="pomo-break-input"
                min="1"
                max="60"
                value={breakMins}
                onChange={(e) => setBreakMins(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <span>min</span>
            </div>
          </div>
        )}

        {/* Rewards trophies shelf */}
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: '24px'
        }}>Trophy Cabinet</h3>
        <div className="milestones-shelf">
          <div className={`badge-trophy ${isPomoBadgeUnlocked ? 'unlocked' : ''}`} data-tooltip="Scholar: Complete first Pomodoro" id="badge-pomo">🏆</div>
          <div className={`badge-trophy ${isStopwatchBadgeUnlocked ? 'unlocked' : ''}`} data-tooltip="Endurance: Record 3 Stopwatch Laps" id="badge-stopwatch">⏱️</div>
          <div className={`badge-trophy ${isStreakBadgeUnlocked ? 'unlocked' : ''}`} data-tooltip="Perfectionist: 5 days Focus Streak" id="badge-streak">🔥</div>
          <div className={`badge-trophy ${isXpBadgeUnlocked ? 'unlocked' : ''}`} data-tooltip="Overachiever: Reach 1000 Focus XP" id="badge-xp">🎖️</div>
        </div>
      </div>

      {/* Focus Analytics & Logs */}
      <div className="timer-logs-panel glass-panel">
        <div className="timer-logs-split">
          {/* ChartJS Analytics */}
          <div className="timer-chart-container glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Focus Time Logs</h3>
            <canvas id="timer-history-chart" ref={chartRef}></canvas>
          </div>
          {/* Log lists */}
          <div>
            <div className="panel-header">
              <h3 id="timer-log-title">
                {mode === 'pomodoro' ? 'Focus Session History' : 'Recorded Lap Marks'}
              </h3>
              <button className="btn-text" onClick={clearLogs}>Clear</button>
            </div>
            <div className="timer-logs-container" id="timer-logs-container">
              {mode === 'pomodoro' ? (
                studyLogs.length === 0 ? (
                  <div className="empty-state"><p>No focus sessions recorded.</p></div>
                ) : (
                  studyLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="log-item">
                      <span className="log-title completed">
                        <i data-lucide="award" style={{ width: '16px', height: '16px' }}></i>
                        {log.type} Focus block
                      </span>
                      <span className="log-duration">{log.duration}</span>
                      <span className="log-time">{log.timestamp}</span>
                    </div>
                  ))
                )
              ) : (
                swLaps.length === 0 ? (
                  <div className="empty-state"><p>Stopwatch marks will appear here.</p></div>
                ) : (
                  swLaps.slice(0, 4).map(lap => (
                    <div key={lap.lapNum} className="log-item">
                      <span className="log-title stopwatch-lap">
                        <i data-lucide="flag" style={{ width: '16px', height: '16px' }}></i>
                        Lap {lap.lapNum}
                      </span>
                      <span className="log-duration">{lap.time}</span>
                      <span className="log-time">Split: {lap.time}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocusHub

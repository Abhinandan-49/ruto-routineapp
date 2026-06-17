import React, { useState, useEffect } from 'react'

function Header({ activeTab, xp }) {
  const [time, setTime] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [greeting, setGreeting] = useState('Ready to Flow')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()

      // Time format
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }))

      // Date format
      setDateStr(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))

      // Greeting based on hour
      const hour = now.getHours()
      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning, Scholar')
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon, Scholar')
      } else if (hour >= 17 && hour < 22) {
        setGreeting('Good evening, Scholar')
      } else {
        setGreeting('Keep burning the midnight oil')
      }
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)

    if (window.lucide) {
      window.lucide.createIcons()
    }

    return () => clearInterval(timer)
  }, [])

  // Mobile sidebar check
  const openSidebarMobile = () => {
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) sidebar.classList.add('active')
  }

  return (
    <header className="topbar glass-panel">
      <div className="topbar-left">
        <button className="sidebar-toggle-btn" id="sidebar-toggle-btn" onClick={openSidebarMobile}>
          <i data-lucide="menu"></i>
        </button>
        <div className="greetings">
          <h1 id="greeting-title">{greeting}</h1>
          <p className="subtitle" id="current-date-display">{dateStr}</p>
        </div>
      </div>
      <div className="topbar-right">
        {/* XP indicator */}
        <div className="focus-badge">
          <i data-lucide="zap" style={{ color: 'var(--accent-cyan)', width: '14px', height: '14px' }}></i>
          <span id="header-xp-val" style={{ marginRight: '4px' }}>{xp}</span><span>XP</span>
        </div>
        <div className="focus-badge">
          <span className="indicator-dot pulse"></span>
          <span className="focus-badge-text" id="header-focus-status">Ready to Flow</span>
        </div>
        {/* Quick Clock */}
        <div className="quick-clock glass-panel">
          <i data-lucide="clock"></i>
          <span id="digital-clock">{time}</span>
        </div>
      </div>
    </header>
  )
}

export default Header

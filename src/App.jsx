import React, { useState, useEffect, useRef } from 'react'
import { initPremiumEffects } from './premiumEffects.js'
import { gsap } from 'gsap'

// Component Imports
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import TaskBoard from './components/TaskBoard.jsx'
import ScheduleGrid from './components/ScheduleGrid.jsx'
import FocusHub from './components/FocusHub.jsx'
import FriendCircle from './components/FriendCircle.jsx'
import GroupsHub from './components/GroupsHub.jsx'

// Tab Entry Spring Transition Wrapper
function TabTransition({ children }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 15, scale: 0.98, filter: 'blur(6px)' },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          filter: 'blur(0px)', 
          duration: 0.45, 
          ease: 'back.out(1.15)',
          clearProps: 'filter,transform'
        }
      )
    }
  }, [])

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [xp, setXp] = useState(() => {
    return parseInt(localStorage.getItem('the_routine_xp') || '450', 10)
  })
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('the_routine_streak') || '5', 10)
  })

  // Synchronize dynamic header XP function globally
  useEffect(() => {
    window.incrementXp = (amount) => {
      setXp(prev => {
        const next = prev + amount;
        localStorage.setItem('the_routine_xp', next.toString());
        return next;
      });
    };
    return () => {
      delete window.incrementXp;
    };
  }, []);

  // Initialize premium visual effects (magnetic, bulge, custom cursor)
  useEffect(() => {
    // Delay initialization slightly to let the React DOM fully render first
    const timer = setTimeout(() => {
      initPremiumEffects()
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const incrementXp = (amount) => {
    setXp(prev => {
      const next = prev + amount
      localStorage.setItem('routine_xp', next.toString())
      return next
    })
  }

  // Active Tab View Selector
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <TabTransition key="dashboard">
            <Dashboard switchTab={setActiveTab} xp={xp} streak={streak} />
          </TabTransition>
        )
      case 'tasks':
        return (
          <TabTransition key="tasks">
            <TaskBoard incrementXp={incrementXp} />
          </TabTransition>
        )
      case 'timetable':
        return (
          <TabTransition key="timetable">
            <ScheduleGrid />
          </TabTransition>
        )
      case 'timer':
        return (
          <TabTransition key="timer">
            <FocusHub incrementXp={incrementXp} />
          </TabTransition>
        )
      case 'friendCircle':
        return (
          <TabTransition key="friendCircle">
            <FriendCircle incrementXp={incrementXp} />
          </TabTransition>
        )
      case 'friendGroups':
        return (
          <TabTransition key="friendGroups">
            <GroupsHub />
          </TabTransition>
        )
      default:
        return null
    }
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Header activeTab={activeTab} xp={xp} />
        <section className="workspace-viewport">
          {renderTabContent()}
        </section>
      </main>
    </div>
  )
}

export default App

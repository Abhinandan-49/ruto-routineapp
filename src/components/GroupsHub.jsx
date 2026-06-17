import React, { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

function GroupsHub() {
  const [activeGroupId, setActiveGroupId] = useState('g1')
  const [isCallActive, setIsCallActive] = useState(false)
  const [chatInput, setChatInput] = useState('')

  // State for all groups data
  const [groupData, setGroupData] = useState(() => {
    const saved = localStorage.getItem('the_routine_groups_data')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // ignore and fallback
      }
    }
    return {
      g1: {
        name: 'Alpha Team Space',
        status: '4 members online',
        messages: [
          { id: 'm1', sender: 'John Doe', text: 'Hey guys, did you check out the new RoutineFlow dashboards?', type: 'incoming' },
          { id: 'm2', sender: 'Sarah Smith', text: 'Yeah! My streak is up to 5 days now, just unlocked the fire animation!', type: 'incoming' },
          { id: 'm3', sender: 'Alex Miller', text: 'I am starting a focus session in 5 mins. Who wants to join the WebRTC video study room?', type: 'incoming' }
        ],
        sharedTasks: [
          { id: 'st1', title: 'Draft UI Mockups in Figma', owner: 'Alex', completed: true },
          { id: 'st2', title: 'Set up Agora RTC client connections', owner: 'Sarah', completed: false },
          { id: 'st3', title: 'Write local storage schema definitions', owner: 'Me', completed: false }
        ]
      },
      g2: {
        name: 'Physics Study Squad',
        status: '2 members online',
        messages: [
          { id: 'm4', sender: 'John Doe', text: 'Midterm is next week! Has anyone completed the mock exam review sheet?', type: 'incoming' }
        ],
        sharedTasks: [
          { id: 'st4', title: 'Practice problems 1 to 15', owner: 'John', completed: false },
          { id: 'st5', title: 'Formula cheatsheet check-off', owner: 'Me', completed: false }
        ]
      }
    }
  })

  // Speaking indicator state for active group call tiles
  const [speakingTiles, setSpeakingTiles] = useState({
    me: true,
    john: false,
    alex: false,
    sarah: false
  })

  // Floating video call deck dragging state
  const [dragPos, setDragPos] = useState(null) // { x, y } when dragged
  const messageLogRef = useRef(null)

  const groupsList = [
    { id: 'g1', name: 'Alpha Team Space' },
    { id: 'g2', name: 'Physics Study Squad' }
  ]

  // Persist group data updates
  useEffect(() => {
    localStorage.setItem('the_routine_groups_data', JSON.stringify(groupData))
  }, [groupData])

  // Sync Lucide Icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [activeGroupId, isCallActive, groupData])

  // Scroll to chat bottom on message updates
  useEffect(() => {
    if (messageLogRef.current) {
      messageLogRef.current.scrollTop = messageLogRef.current.scrollHeight
    }
  }, [groupData, activeGroupId])

  // Speaking indicators animation loop
  useEffect(() => {
    if (!isCallActive) return

    const interval = setInterval(() => {
      setSpeakingTiles({
        me: Math.random() > 0.6,
        john: Math.random() > 0.6,
        alex: Math.random() > 0.6,
        sarah: Math.random() > 0.6
      })
    }, 1200)

    return () => clearInterval(interval)
  }, [isCallActive])

  const currentGroup = groupData[activeGroupId] || {
    name: '',
    status: '',
    messages: [],
    sharedTasks: []
  }

  // Handle outgoing chat message
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      sender: 'Scholar Orbit', // Me
      text: chatInput.trim(),
      type: 'outgoing'
    }

    setGroupData(prev => {
      const g = prev[activeGroupId]
      return {
        ...prev,
        [activeGroupId]: {
          ...g,
          messages: [...g.messages, userMessage]
        }
      }
    })

    setChatInput('')

    // Reward XP globally
    if (window.incrementXp) {
      window.incrementXp(5)
    }

    // Simulate response
    simulateResponse()
  }

  const simulateResponse = () => {
    const responses = [
      "Awesome! Let me check that out.",
      "Nice routine score today! 👍",
      "Yes, I will sync that with my schedule.",
      "Is anyone joining the video study session?",
      "Got it, finishing my Pomodoro now!"
    ]
    const members = ["Alex Miller", "Sarah Smith", "John Doe"]

    setTimeout(() => {
      setGroupData(prev => {
        const g = prev[activeGroupId]
        const randomText = responses[Math.floor(Math.random() * responses.length)]
        const randomMember = members[Math.floor(Math.random() * members.length)]
        const incomingMessage = {
          id: Date.now().toString(),
          sender: randomMember,
          text: randomText,
          type: 'incoming'
        }

        return {
          ...prev,
          [activeGroupId]: {
            ...g,
            messages: [...g.messages, incomingMessage]
          }
        }
      })
    }, 1500)
  }

  // Handle collaborative task checkbox toggle
  const handleToggleSharedTask = (taskId) => {
    setGroupData(prev => {
      const g = prev[activeGroupId]
      const updatedTasks = g.sharedTasks.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed
          if (nextCompleted) {
            confetti({
              particleCount: 50,
              spread: 40,
              colors: ['#7c3aed', '#06b6d4']
            })
            if (window.incrementXp) {
              window.incrementXp(20) // Shared task XP reward
            }
          }
          return { ...t, completed: nextCompleted }
        }
        return t
      })

      return {
        ...prev,
        [activeGroupId]: {
          ...g,
          sharedTasks: updatedTasks
        }
      }
    })
  }

  // Add shared task
  const handleAddSharedTask = () => {
    const text = prompt('Enter collaborative task description:')
    if (!text || !text.trim()) return

    const owners = ['Alex', 'Sarah', 'John', 'Me']
    const randomOwner = owners[Math.floor(Math.random() * owners.length)]

    const newTask = {
      id: Date.now().toString(),
      title: text.trim(),
      owner: randomOwner,
      completed: false
    }

    setGroupData(prev => {
      const g = prev[activeGroupId]
      return {
        ...prev,
        [activeGroupId]: {
          ...g,
          sharedTasks: [...g.sharedTasks, newTask]
        }
      }
    })

    if (window.incrementXp) {
      window.incrementXp(10)
    }
  }

  // Draggable Mouse handler
  const handleDragMouseDown = (e) => {
    e.preventDefault()
    // Calculate initial position offsets
    const panel = e.currentTarget.parentElement
    const rect = panel.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const handleMouseMove = (moveEvent) => {
      setDragPos({
        x: moveEvent.clientX - offsetX,
        y: moveEvent.clientY - offsetY
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="friend-groups-layout">
      {/* Sidebar list */}
      <div className="groups-sidebar glass-panel">
        <h3>My Focus Groups</h3>
        <div className="groups-list" id="groups-list-container">
          {groupsList.map(g => (
            <div
              key={g.id}
              className={`group-item ${g.id === activeGroupId ? 'active' : ''}`}
              onClick={() => setActiveGroupId(g.id)}
            >
              <div className="group-avatar">{g.name.substring(0, 2).toUpperCase()}</div>
              <span className="group-title">{g.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Chat room */}
      <div className="chat-hub-workspace">
        <div className="chat-room-container glass-panel">
          <div className="chat-room-header">
            <div className="chat-room-info">
              <h3 id="chat-active-group-name">{currentGroup.name}</h3>
              <p id="chat-active-group-status">{currentGroup.status}</p>
            </div>
            <button
              className={`btn video-deck-btn btn-sm ${isCallActive ? 'active-call' : ''}`}
              onClick={() => setIsCallActive(!isCallActive)}
            >
              <i data-lucide={isCallActive ? 'video-off' : 'video'}></i>
              {isCallActive ? ' End Call' : ' Group Call'}
            </button>
          </div>

          <div className="chat-messages-log" id="chat-messages-box" ref={messageLogRef}>
            {currentGroup.messages.length === 0 ? (
              <div className="empty-state"><p>No messages in this workspace yet. Start the conversation!</p></div>
            ) : (
              currentGroup.messages.map(msg => (
                <div key={msg.id} className={`chat-msg ${msg.type}`}>
                  <div className="chat-msg-avatar">
                    {msg.sender.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="chat-msg-bubble">
                    <div className="chat-msg-sender">{msg.sender}</div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              placeholder="Type group message..."
              className="form-control"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <i data-lucide="send"></i>
            </button>
          </form>
        </div>

        {/* Shared Todo Board */}
        <div className="shared-board-panel glass-panel">
          <div className="shared-board-header">
            <h4>Shared Board</h4>
            <button className="btn-text" onClick={handleAddSharedTask}>Add Shared</button>
          </div>
          <div className="shared-board-list" id="shared-todo-box">
            {currentGroup.sharedTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No collaborative tasks yet.</p></div>
            ) : (
              currentGroup.sharedTasks.map(task => (
                <div key={task.id} className={`shared-task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-left">
                    <button
                      className="subtask-checkbox shared-task-check"
                      onClick={() => handleToggleSharedTask(task.id)}
                    >
                      <i
                        data-lucide="check"
                        style={{
                          width: '10px',
                          height: '10px',
                          display: task.completed ? 'block' : 'none'
                        }}
                      ></i>
                    </button>
                    <span className="shared-task-title" style={{ marginLeft: '8px' }}>
                      {task.title}
                    </span>
                  </div>
                  <span className="shared-task-owner">{task.owner}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DRAGGABLE FLOATING VIDEO CALL PANEL MOCKUP */}
      <div
        className={`floating-video-call-deck glass-panel ${isCallActive ? 'active' : ''}`}
        id="floating-webrtc-call-panel"
        style={dragPos ? {
          left: `${dragPos.x}px`,
          top: `${dragPos.y}px`,
          bottom: 'auto',
          right: 'auto',
          position: 'fixed'
        } : {
          position: 'fixed'
        }}
      >
        <div
          className="video-deck-header"
          id="video-deck-drag-handle"
          onMouseDown={handleDragMouseDown}
          style={{ cursor: 'move' }}
        >
          <h4>
            <span className="indicator-dot active-study pulse" style={{ marginRight: '4px' }}></span>
            Group Call: WebRTC
          </h4>
          <button className="video-deck-close" onClick={() => setIsCallActive(false)}>&times;</button>
        </div>
        <div className="video-grid-mini">
          <div className={`video-tile ${speakingTiles.me ? 'speaking' : ''}`}>
            <div className="video-avatar-placeholder">ME</div>
            <span className="video-tile-name">Me {speakingTiles.me && '(Speaking)'}</span>
          </div>
          <div className={`video-tile ${speakingTiles.john ? 'speaking' : ''}`}>
            <div className="video-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>JD</div>
            <span className="video-tile-name">John Doe</span>
          </div>
          <div className={`video-tile ${speakingTiles.alex ? 'speaking' : ''}`}>
            <div className="video-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>AM</div>
            <span className="video-tile-name">Alex Miller</span>
          </div>
          <div className={`video-tile ${speakingTiles.sarah ? 'speaking' : ''}`}>
            <div className="video-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>SS</div>
            <span className="video-tile-name">Sarah Smith</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupsHub

import React, { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

function TaskBoard({ incrementXp }) {
  const [tasks, setTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Study')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')

  // Expanded subtasks tracking
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set())
  const [subtaskInputs, setSubtaskInputs] = useState({})

  // Load tasks on mount
  useEffect(() => {
    const data = localStorage.getItem('the_routine_tasks')
    if (data) {
      try {
        setTasks(JSON.parse(data))
      } catch (e) {
        setTasks([])
      }
    } else {
      // Default tasks
      const defaultTasks = [
        {
          id: '1',
          title: 'Review Machine Learning Algorithms Lecture notes',
          category: 'Study',
          priority: 'High',
          dueDate: getOffsetDateString(0),
          completed: false,
          subtasks: [
            { id: 's1', text: 'Study Gradient Descent formulas', completed: true },
            { id: 's2', text: 'Solve quiz practice problems', completed: false }
          ]
        },
        {
          id: '2',
          title: 'Implement Agora/Daily.co Floating Video Call Tile',
          category: 'Project',
          priority: 'High',
          dueDate: getOffsetDateString(1),
          completed: false,
          subtasks: [
            { id: 's3', text: 'Set up draggable wrapper element', completed: false },
            { id: 's4', text: 'Design speaker ring glow audio indicator', completed: false }
          ]
        },
        {
          id: '3',
          title: 'Submit Literature review essay draft',
          category: 'Assignment',
          priority: 'Medium',
          dueDate: getOffsetDateString(3),
          completed: false,
          subtasks: []
        }
      ]
      setTasks(defaultTasks)
      localStorage.setItem('the_routine_tasks', JSON.stringify(defaultTasks))
    }
  }, [])

  // Sync to local storage
  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks)
    localStorage.setItem('the_routine_tasks', JSON.stringify(updatedTasks))
  }

  // Hook up icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [tasks, filter, searchQuery, expandedTaskIds])

  const getOffsetDateString = (offsetDays) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().split('T')[0]
  }

  // Date formatter
  const formatTaskDate = (dateStr) => {
    if (!dateStr) return 'No due date'
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr

    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Handle task submission
  const handleTaskSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      priority,
      dueDate: dueDate || getOffsetDateString(0),
      completed: false,
      subtasks: []
    }

    const updated = [newTask, ...tasks]
    saveTasks(updated)

    // Reset inputs
    setTitle('')
    setDueDate('')
  }

  const handleDeleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id)
    saveTasks(updated)
  }

  const handleToggleTask = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed
        if (nextCompleted) {
          triggerConfettiBurst()
          incrementXp(50) // earn 50XP on task complete
        }
        return { ...t, completed: nextCompleted }
      }
      return t
    })
    saveTasks(updated)
  }

  const handleToggleSubtask = (taskId, subtaskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            const nextCompleted = !s.completed
            if (nextCompleted) {
              incrementXp(10) // minor 10XP reward
            }
            return { ...s, completed: nextCompleted }
          }
          return s
        })
        return { ...t, subtasks: updatedSubs }
      }
      return t
    })
    saveTasks(updated)
  }

  const handleAddSubtask = (taskId) => {
    const text = subtaskInputs[taskId]
    if (!text || !text.trim()) return

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const subs = t.subtasks || []
        const newSub = {
          id: Date.now().toString(),
          text: text.trim(),
          completed: false
        }
        return { ...t, subtasks: [...subs, newSub] }
      }
      return t
    })

    saveTasks(updated)
    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }))
  }

  const triggerConfettiBurst = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#7c3aed', '#06b6d4', '#10b981', '#ec4899', '#ffffff']
    })
  }

  // Toggle subtask accordion expanded set
  const toggleAccordion = (taskId) => {
    const next = new Set(expandedTaskIds)
    if (next.has(taskId)) {
      next.delete(taskId)
    } else {
      next.add(taskId)
    }
    setExpandedTaskIds(next)
  }

  // HTML5 Native Drag & Drop Reordering
  const [draggingId, setDraggingId] = useState(null)

  const handleDragStart = (e, id) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (draggingId === targetId) return

    const dIndex = tasks.findIndex(t => t.id === draggingId)
    const tIndex = tasks.findIndex(t => t.id === targetId)

    if (dIndex !== -1 && tIndex !== -1) {
      const updated = [...tasks]
      const [moved] = updated.splice(dIndex, 1)
      updated.splice(tIndex, 0, moved)
      saveTasks(updated)
    }
    setDraggingId(null)
  }

  // Apply visual category emojis
  const getCategoryEmoji = (cat) => {
    if (cat.includes('Assignment')) return '📝'
    if (cat.includes('Project')) return '💻'
    if (cat.includes('Exam')) return '🎯'
    if (cat.includes('Personal')) return '🏡'
    if (cat.includes('Other')) return '🌟'
    return '📚'
  }

  // Filter & Search Logic
  const getFilteredTasks = () => {
    let list = [...tasks]

    // Apply Filter badges
    if (filter === 'pending') {
      list = list.filter(t => !t.completed)
    } else if (filter === 'high') {
      list = list.filter(t => t.priority === 'High' && !t.completed)
    } else if (filter === 'completed') {
      list = list.filter(t => t.completed)
    }

    // Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      list = list.filter(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query))
    }

    return list
  }

  const filteredTasks = getFilteredTasks()

  return (
    <div className="task-manager-layout">
      {/* Left task creator form pane */}
      <div className="task-creator-panel glass-panel">
        <h3>Create New Task</h3>
        <form id="task-form" onSubmit={handleTaskSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Task Name</label>
            <input 
              type="text" 
              id="task-title" 
              required 
              placeholder="E.g., Read biology chapter 5" 
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group col">
              <label htmlFor="task-category">Category</label>
              <select 
                id="task-category" 
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Study">📚 Study</option>
                <option value="Assignment">📝 Assignment</option>
                <option value="Project">💻 Project</option>
                <option value="Exam">🎯 Exam</option>
                <option value="Personal">🏡 Personal</option>
                <option value="Other">🌟 Other</option>
              </select>
            </div>
            <div className="form-group col">
              <label htmlFor="task-priority">Priority</label>
              <select 
                id="task-priority" 
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Normal</option>
                <option value="High">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="task-due-date">Due Date</label>
            <input 
              type="date" 
              id="task-due-date" 
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            <i data-lucide="plus"></i> Add Task
          </button>
        </form>
      </div>

      {/* Right task list card list panel */}
      <div className="task-list-panel glass-panel">
        <div className="list-filters-bar">
          <div className="search-box glass-panel">
            <i data-lucide="search"></i>
            <input 
              type="text" 
              id="task-search" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-badges">
            {['all', 'pending', 'high', 'completed'].map(f => (
              <button 
                key={f}
                className={`filter-badge ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'high' ? 'Urgent' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="tasks-container" id="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <i data-lucide="inbox" style={{ width: '38px', height: '38px', marginBottom: '12px', color: 'var(--text-dark)' }}></i>
              <p>No tasks found.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate + 'T23:59:59') < new Date()
              const cleanCategory = task.category.replace(/📚|📝|💻|🎯|🏡|🌟/g, '').trim()
              const totalSubs = task.subtasks ? task.subtasks.length : 0
              const completedSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0

              return (
                <div 
                  key={task.id} 
                  className={`task-item glass-panel ${task.completed ? 'completed' : ''} ${expandedTaskIds.has(task.id) ? 'expanded' : ''} ${draggingId === task.id ? 'dragging' : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, task.id)}
                >
                  <div className="task-item-main">
                    <div className="task-left">
                      <button className="task-check-btn" onClick={() => handleToggleTask(task.id)}>
                        <i data-lucide="check"></i>
                      </button>
                      <div className="task-details">
                        <span className="task-item-title">{task.title}</span>
                        <div className="task-meta">
                          <span className="task-category-tag">
                            {getCategoryEmoji(task.category)} {cleanCategory}
                          </span>
                          <span className={`task-due-tag ${isOverdue ? 'overdue' : ''}`}>
                            <i data-lucide="calendar"></i>
                            {formatTaskDate(task.dueDate)} {isOverdue ? '(Overdue)' : ''}
                          </span>
                          {totalSubs > 0 && (
                            <span className="task-category-tag">
                              <i data-lucide="git-branch" style={{ width: '10px', height: '10px', display: 'inline-block', marginRight: '2px' }}></i>
                              {completedSubs}/{totalSubs}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="task-right">
                      <span className={`priority-indicator priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <button 
                        className="task-subtasks-toggle-btn" 
                        title="Toggle Subtasks"
                        onClick={() => toggleAccordion(task.id)}
                      >
                        <i data-lucide="chevron-down"></i>
                      </button>
                      <button className="task-delete-btn" onClick={() => handleDeleteTask(task.id)}>
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </div>

                  {/* Expandable subtasks checklist */}
                  <div className="subtasks-panel">
                    <div className="subtask-list">
                      {task.subtasks && task.subtasks.map(sub => (
                        <div key={sub.id} className={`subtask-row ${sub.completed ? 'completed' : ''}`}>
                          <button className="subtask-checkbox" onClick={() => handleToggleSubtask(task.id, sub.id)}>
                            <i data-lucide="check"></i>
                          </button>
                          <span className="subtask-text">{sub.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="subtask-creator-row">
                      <input 
                        type="text" 
                        placeholder="Add subtask..." 
                        className="form-control form-control-sm"
                        value={subtaskInputs[task.id] || ''}
                        onChange={(e) => setSubtaskInputs({ ...subtaskInputs, [task.id]: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSubtask(task.id)
                          }
                        }}
                      />
                      <button className="btn btn-secondary btn-sm add-sub-btn" onClick={() => handleAddSubtask(task.id)}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskBoard

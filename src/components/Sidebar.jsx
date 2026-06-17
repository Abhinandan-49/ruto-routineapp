import React, { useState, useEffect, useRef } from 'react'
import { animateNavBlob } from '../premiumEffects.js'


function Sidebar({ activeTab, setActiveTab }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef(null)
  const preMuteVolumeRef = useRef(0.5)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'tasks', label: 'Task Board', icon: 'check-square' },
    { id: 'timetable', label: 'Schedule Grid', icon: 'calendar' },
    { id: 'timer', label: 'Focus Hub', icon: 'timer' },
    { id: 'friendCircle', label: 'Friend Circle', icon: 'users' },
    { id: 'friendGroups', label: 'Groups Hub', icon: 'messages-square' },
  ]

  // Hook up navigation Lucide icons and GSAP blob animation
  useEffect(() => {
    animateNavBlob(activeTab)
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [activeTab])

  // Autoplay handler on mount (respects browser sandbox limits)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume

    const attemptAutoplay = () => {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.log("React Lofi autoplay blocked. Listening for user interaction...")
          const playOnInteraction = () => {
            audio.play()
              .then(() => {
                setIsPlaying(true)
                removeInteractionListeners()
              })
              .catch(err => console.log("Play failed on interaction:", err))
          }

          document.addEventListener('click', playOnInteraction)
          document.addEventListener('keydown', playOnInteraction)
          document.addEventListener('touchstart', playOnInteraction)

          const removeInteractionListeners = () => {
            document.removeEventListener('click', playOnInteraction)
            document.removeEventListener('keydown', playOnInteraction)
            document.removeEventListener('touchstart', playOnInteraction)
          }
        })
    }

    attemptAutoplay()
  }, [])

  // Sync state changes on native audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handlePause)
    audio.addEventListener('error', handlePause)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handlePause)
      audio.removeEventListener('error', handlePause)
    }
  }, [])

  const handlePlayPause = (e) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play().catch(err => console.error("Play failed:", err))
    } else {
      audio.pause()
    }
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  const handleMuteToggle = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.volume > 0) {
      preMuteVolumeRef.current = audio.volume
      audio.volume = 0
      setVolume(0)
      setIsMuted(true)
    } else {
      const targetVol = preMuteVolumeRef.current || 0.5
      audio.volume = targetVol
      setVolume(targetVol)
      setIsMuted(false)
    }
  }

  // Determine volume icon name based on state
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return 'volume-x'
    if (volume < 0.4) return 'volume-1'
    return 'volume-2'
  }

  // Close sidebar on mobile
  const closeSidebarMobile = () => {
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) sidebar.classList.remove('active')
  }

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">
            <i data-lucide="droplet"></i>
          </span>
          <span className="logo-text">RoutineFlow</span>
        </div>
        <button className="sidebar-close-btn" id="sidebar-close-btn" onClick={closeSidebarMobile}>
          <i data-lucide="chevron-left"></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-blob-indicator" id="nav-blob"></div>
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <a 
                href="#" 
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                data-tab={item.id}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab(item.id)
                }}
              >
                <i data-lucide={item.icon}></i>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Redesigned Compact Vinyl Lofi Player */}
      <div className="lofi-player-sidebar glass-panel">
        <div className="lofi-player-main">
          <div className={`lofi-cover-container ${isPlaying ? 'playing' : ''}`} id="lofi-cover-container">
            <img src="/lofi_cover.png" alt="Lofi Cover" className="lofi-cover-art" id="lofi-cover-art" />
          </div>
          <div className="lofi-track-details">
            <span className="lofi-track-title">Hotmix LoFi Radio</span>
            <span className="lofi-track-artist">Ambient Study Beats</span>
          </div>
          <button className="lofi-play-btn" id="lofi-player-toggle" title="Play/Pause Radio" onClick={handlePlayPause}>
            <i data-lucide={isPlaying ? 'pause' : 'play'} id="lofi-play-icon"></i>
          </button>
        </div>
        <div className="lofi-player-volume-control">
          <i 
            data-lucide={getVolumeIcon()} 
            className="lofi-volume-icon" 
            id="lofi-volume-icon"
            onClick={handleMuteToggle}
          ></i>
          <input 
            type="range" 
            id="lofi-volume-slider" 
            min="0" 
            max="1" 
            step="0.05" 
            value={volume} 
            className="lofi-volume-slider" 
            onChange={handleVolumeChange}
          />
        </div>
        <audio ref={audioRef} id="lofi-audio" src="https://streaming.hotmixradio.com/hotmix-lofi-en-mp3" preload="none"></audio>
      </div>

      <div className="sidebar-footer">
        <div className="student-profile">
          <div className="avatar">
            <span className="avatar-letters">RF</span>
          </div>
          <div className="profile-info">
            <p className="profile-name">Scholar Orbit</p>
            <p className="profile-role">Level 4 Focus Agent</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

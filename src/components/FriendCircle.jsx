import React, { useState, useEffect } from 'react'

function FriendCircle({ incrementXp }) {
  const [posts, setPosts] = useState([])
  const [activePostId, setActivePostId] = useState(null)
  const [commentText, setCommentText] = useState('')

  // Load posts on mount
  useEffect(() => {
    const data = localStorage.getItem('the_routine_posts')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setPosts(parsed)
        if (parsed.length > 0) {
          setActivePostId(parsed[0].id)
        }
      } catch (e) {
        setPosts([])
      }
    } else {
      const defaultPosts = [
        {
          id: 'p1',
          author: 'Alex Miller',
          avatar: 'AM',
          timestamp: '1 hour ago',
          score: '96',
          body: 'Just finished all my morning coding goals! The liquid UI is so clean.',
          stats: { tasks: 5, focus: 120, streak: 8 },
          reactions: [
            { emoji: '🔥', count: 8 },
            { emoji: '💡', count: 3 },
            { emoji: '👏', count: 5 }
          ],
          comments: [
            { id: 'c1', user: 'Sarah Smith', text: 'Insane focus! Keep it up!' },
            { id: 'c2', user: 'John Doe', text: 'Which libraries did you use?' }
          ]
        },
        {
          id: 'p2',
          author: 'Sarah Smith',
          avatar: 'SS',
          timestamp: '3 hours ago',
          score: '84',
          body: 'Prepping for the algorithms midterm. Focus Hub is keeping me sane.',
          stats: { tasks: 3, focus: 90, streak: 5 },
          reactions: [
            { emoji: '🔥', count: 4 },
            { emoji: '👏', count: 6 }
          ],
          comments: [
            { id: 'c3', user: 'Alex Miller', text: 'Study notes are shared on Group Board' }
          ]
        }
      ]
      setPosts(defaultPosts)
      setActivePostId('p1')
      localStorage.setItem('the_routine_posts', JSON.stringify(defaultPosts))
    }
  }, [])

  // Sync Lucide Icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [posts, activePostId])

  const savePosts = (updatedPosts) => {
    setPosts(updatedPosts)
    localStorage.setItem('the_routine_posts', JSON.stringify(updatedPosts))
  }

  const triggerEmojiBubbling = (emoji, x, y) => {
    const bubble = document.createElement('span')
    bubble.className = 'bubbling-emoji'
    bubble.textContent = emoji
    bubble.style.left = `${x}px`
    bubble.style.top = `${y}px`
    document.body.appendChild(bubble)

    setTimeout(() => {
      bubble.remove()
    }, 1200)
  }

  const handleAddReaction = (postId, emoji, e) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const reactionsCopy = [...post.reactions]
        const rIndex = reactionsCopy.findIndex(react => react.emoji === emoji)
        if (rIndex !== -1) {
          reactionsCopy[rIndex] = {
            ...reactionsCopy[rIndex],
            count: reactionsCopy[rIndex].count + 1
          }
        } else {
          reactionsCopy.push({ emoji, count: 1 })
        }
        return {
          ...post,
          reactions: reactionsCopy
        }
      }
      return post
    })

    savePosts(updated)

    if (e) {
      triggerEmojiBubbling(emoji, e.clientX, e.clientY)
    }

    incrementXp(5) // Award minor XP for interaction
  }

  const handleAddCustomReaction = (postId, e) => {
    const em = prompt('Enter reaction emoji (e.g. 🙌, 🚀, 💡):')
    if (em && em.trim()) {
      handleAddReaction(postId, em.trim(), e)
    }
  }

  const handleSendComment = (e) => {
    e.preventDefault()
    if (!activePostId || !commentText.trim()) return

    const updated = posts.map(post => {
      if (post.id === activePostId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: Date.now().toString(),
              user: 'Scholar Orbit', // Me
              text: commentText.trim()
            }
          ]
        }
      }
      return post
    })

    savePosts(updated)
    setCommentText('')
    incrementXp(10) // Comment XP reward
  }

  const handlePostMyStats = () => {
    // Collect stats from localStorage
    const storedTasks = JSON.parse(localStorage.getItem('the_routine_tasks') || '[]')
    const completedCount = storedTasks.filter(t => t.completed).length
    const focusMins = parseInt(localStorage.getItem('the_routine_focus_time') || '0', 10)
    const streak = parseInt(localStorage.getItem('the_routine_streak') || '5', 10)

    const newPost = {
      id: Date.now().toString(),
      author: 'Scholar Orbit',
      avatar: 'SO',
      timestamp: 'Just now',
      score: '92',
      body: "My focus flow is locked in! Check out today's RoutineFlow routine summary.",
      stats: { tasks: completedCount, focus: focusMins, streak: streak },
      reactions: [
        { emoji: '🔥', count: 1 },
        { emoji: '👏', count: 1 }
      ],
      comments: []
    }

    const updated = [newPost, ...posts]
    savePosts(updated)
    setActivePostId(newPost.id)

    incrementXp(75) // Post stats XP reward
    alert('Daily routine stats posted to circle! +75 XP earned.')
  }

  const activePost = posts.find(p => p.id === activePostId)

  return (
    <div className="friend-circle-layout">
      {/* Posts feed */}
      <div className="circle-feed-panel glass-panel">
        <div className="circle-feed-header">
          <h2>BeReal Routine Posts</h2>
          <button className="btn btn-primary btn-sm" onClick={handlePostMyStats}>
            <i data-lucide="share-2"></i> Post My Stats Today
          </button>
        </div>
        <div className="circle-feed-container" id="friend-feed-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts in the Circle yet.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-card glass-panel">
                <div className="post-header">
                  <div className="post-author">
                    <div className="post-avatar">{post.avatar}</div>
                    <div>
                      <div className="post-username">{post.author}</div>
                      <div className="post-time">{post.timestamp}</div>
                    </div>
                  </div>
                  <div className="post-score-badge">Score: {post.score}</div>
                </div>
                <div className="post-body">
                  <p>{post.body}</p>
                </div>

                {/* Stats block */}
                <div className="post-stats-grid">
                  <div className="post-stat-item">
                    <div className="post-stat-val highlight-text">{post.stats.tasks}</div>
                    <div className="post-stat-lbl">Tasks Done</div>
                  </div>
                  <div className="post-stat-item">
                    <div className="post-stat-val highlight-text">{post.stats.focus}m</div>
                    <div className="post-stat-lbl">Focus Time</div>
                  </div>
                  <div className="post-stat-item">
                    <div className="post-stat-val highlight-text">{post.stats.streak}d</div>
                    <div className="post-stat-lbl">Streak</div>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="post-actions-bar">
                  <div className="reaction-tray">
                    {post.reactions.map((react, i) => (
                      <button
                        key={i}
                        className="react-btn"
                        onClick={(e) => handleAddReaction(post.id, react.emoji, e)}
                      >
                        <span>{react.emoji}</span>
                        <span className="count">{react.count}</span>
                      </button>
                    ))}
                    <button className="react-btn add-custom-react" onClick={(e) => handleAddCustomReaction(post.id, e)}>
                      <span>➕</span>
                    </button>
                  </div>
                  <button className="post-comments-toggle" onClick={() => setActivePostId(post.id)}>
                    <i data-lucide="message-square" style={{ width: '16px', height: '16px' }}></i>
                    <span>{post.comments.length} Comments</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sliding Comment Section */}
      <div className="comments-side-panel glass-panel">
        <div className="comments-panel-header">
          <h3>
            {activePost ? `Comments: ${activePost.author}` : 'Thread Comments'}
          </h3>
          <span className="save-status">
            {activePost ? `${activePost.comments.length} comments` : '0 comments'}
          </span>
        </div>
        <div className="comments-list" id="comments-list-box">
          {!activePost ? (
            <div className="empty-state">
              <p>Select comments on a post to read reviews.</p>
            </div>
          ) : activePost.comments.length === 0 ? (
            <div className="empty-state">
              <p>No comments on this post yet. Say hello!</p>
            </div>
          ) : (
            activePost.comments.map(comment => (
              <div key={comment.id} className="comment-row">
                <div className="comment-avatar">
                  {comment.user.substring(0, 2).toUpperCase()}
                </div>
                <div className="comment-text-box">
                  <div className="comment-user">{comment.user}</div>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendComment} className="comment-input-bar">
          <input
            type="text"
            placeholder="Add comment..."
            className="form-control"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <i data-lucide="send"></i>
          </button>
        </form>
      </div>
    </div>
  )
}

export default FriendCircle

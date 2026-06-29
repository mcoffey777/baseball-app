import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, push, onValue, remove } from 'firebase/database'
import { formatTime } from '../utils'

export default function Schedule() {
  const [games, setGames] = useState([])
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('game')

  useEffect(() => {
    onValue(ref(db, 'games'), (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setGames(list.sort((a, b) => new Date(a.date) - new Date(b.date)))
      } else {
        setGames([])
      }
    })
  }, [])

  const addGame = () => {
    if (!opponent || !date) return
    push(ref(db, 'games'), { opponent, date, time, type })
    setOpponent('')
    setDate('')
    setTime('')
    setType('game')
  }

  const deleteGame = (id) => {
    remove(ref(db, `games/${id}`))
  }

  return (
    <div>
      <div className="card">
        <h2>Add Event</h2>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="game">Game</option>
          <option value="practice">Practice</option>
        </select>
        <input
          placeholder="Opponent / Location"
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
        <button onClick={addGame}>Add to Schedule</button>
      </div>

      <div className="card">
        <h2>Schedule ({games.length})</h2>
        {games.length === 0 && <p style={{color:'rgba(255,255,255,0.45)'}}>No events yet. Add one above!</p>}
        {games.map(g => (
          <div className="player-row" key={g.id}>
            <div>
              <span style={{fontSize:11, background: g.type === 'game' ? '#C9A84C' : '#2d6a4f', color: g.type === 'game' ? '#1a365d' : 'white', fontWeight:700, padding:'2px 9px', borderRadius:999, marginRight:8, letterSpacing:'0.6px'}}>
                {g.type === 'game' ? 'GAME' : 'PRACTICE'}
              </span>
              <strong>{g.opponent}</strong>
              <br/>
              <span style={{fontSize:13, color:'rgba(255,255,255,0.55)'}}>{g.date} {g.time && `@ ${formatTime(g.time)}`}</span>
            </div>
            <button className="btn-danger" onClick={() => deleteGame(g.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

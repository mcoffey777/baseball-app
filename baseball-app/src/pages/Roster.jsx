import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, push, onValue, remove } from 'firebase/database'

export default function Roster() {
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')

  useEffect(() => {
    const playersRef = ref(db, 'players')
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setPlayers(list.sort((a, b) => a.number - b.number))
      } else {
        setPlayers([])
      }
    })
  }, [])

  const addPlayer = () => {
    if (!name || !number) return
    push(ref(db, 'players'), { name, number: parseInt(number) })
    setName('')
    setNumber('')
  }

  const deletePlayer = (id) => {
    remove(ref(db, `players/${id}`))
  }

  return (
    <div>
      <div className="card">
        <h2>Add Player</h2>
        <input
          placeholder="Player name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          placeholder="Jersey number"
          type="number"
          value={number}
          onChange={e => setNumber(e.target.value)}
        />
        <button onClick={addPlayer}>Add Player</button>
      </div>

      <div className="card">
        <h2>Roster ({players.length})</h2>
        {players.map(p => (
          <div className="player-row" key={p.id}>
            <span>#{p.number} — {p.name}</span>
            <button className="btn-danger" onClick={() => deletePlayer(p.id)}>Remove</button>
          </div>
        ))}
        {players.length === 0 && <p style={{color:'#888'}}>No players yet. Add some above!</p>}
      </div>
    </div>
  )
}

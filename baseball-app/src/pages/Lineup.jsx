import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, onValue, set } from 'firebase/database'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']

export default function Lineup() {
  const [players, setPlayers] = useState([])
  const [lineup, setLineup] = useState({})

  useEffect(() => {
    onValue(ref(db, 'players'), (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setPlayers(list.sort((a, b) => a.number - b.number))
      } else {
        setPlayers([])
      }
    })
    onValue(ref(db, 'lineup'), (snapshot) => {
      setLineup(snapshot.val() || {})
    })
  }, [])

  const updateLineup = (playerId, field, value) => {
    const updated = { ...lineup, [playerId]: { ...lineup[playerId], [field]: value } }
    setLineup(updated)
    set(ref(db, 'lineup'), updated)
  }

  return (
    <div>
      <div className="card">
        <h2>Game Lineup</h2>
        {players.length === 0 && <p style={{color:'rgba(255,255,255,0.45)'}}>Add players on the Roster page first.</p>}
        {players.map((p, i) => (
          <div className="player-row" key={p.id}>
            <span style={{width: 24, color: 'rgba(255,255,255,0.45)', fontSize: 13}}>{i + 1}.</span>
            <span style={{flex: 1}}>#{p.number} {p.name}</span>
            <select
              style={{width: 80, marginBottom: 0}}
              value={lineup[p.id]?.position || ''}
              onChange={e => updateLineup(p.id, 'position', e.target.value)}
            >
              <option value="">Pos</option>
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              style={{width: 50, marginBottom: 0, marginLeft: 8, textAlign: 'center'}}
              type="number"
              placeholder="#"
              value={lineup[p.id]?.battingOrder || ''}
              onChange={e => updateLineup(p.id, 'battingOrder', e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

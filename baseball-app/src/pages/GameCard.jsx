import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, onValue, set } from 'firebase/database'

const POSITIONS = ['', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'Bench']
const INNINGS = [1, 2, 3, 4, 5, 6]

export default function GameCard() {
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState('')
  const [assignments, setAssignments] = useState({})

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

    onValue(ref(db, 'games'), (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter(g => g.type === 'game')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        setGames(list)
        if (list.length > 0) setSelectedGame(prev => prev || list[0].id)
      } else {
        setGames([])
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedGame) return
    const unsub = onValue(ref(db, `gamecards/${selectedGame}`), (snapshot) => {
      setAssignments(snapshot.val() || {})
    })
    return unsub
  }, [selectedGame])

  const updateAssignment = (playerId, inning, position) => {
    setAssignments(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [`i${inning}`]: position }
    }))
    set(ref(db, `gamecards/${selectedGame}/${playerId}/i${inning}`), position)
  }

  const selectedGameData = games.find(g => g.id === selectedGame)

  return (
    <div className="gamecard-page">
      <div className="card no-print">
        <div className="gamecard-controls">
          <div className="gamecard-controls-row">
            <label className="gamecard-label">Game</label>
            <select
              className="gamecard-game-select"
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
            >
              {games.length === 0 && <option value="">No games scheduled</option>}
              {games.map(g => (
                <option key={g.id} value={g.id}>
                  {g.date} — vs {g.opponent}
                </option>
              ))}
            </select>
            <button className="print-btn" onClick={() => window.print()}>Print Card</button>
          </div>
        </div>
      </div>

      <div className="card gamecard-card">
        <div className="gamecard-header">
          <div className="gamecard-header-title">Diamond Disciples</div>
          {selectedGameData && (
            <div className="gamecard-header-sub">
              {selectedGameData.date} · vs {selectedGameData.opponent}
              {selectedGameData.time && ` @ ${selectedGameData.time}`}
            </div>
          )}
        </div>

        {players.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Add players on the Roster page first.</p>
        ) : (
          <div className="gamecard-scroll">
            <table className="gamecard-table">
              <thead>
                <tr>
                  <th className="gc-player-col">#</th>
                  <th className="gc-name-col">Player</th>
                  {INNINGS.map(i => (
                    <th key={i} className="gc-inning-col">Inn {i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id}>
                    <td className="gc-num">{p.number}</td>
                    <td className="gc-name">{p.name}</td>
                    {INNINGS.map(i => (
                      <td key={i} className="gc-cell">
                        <select
                          value={assignments[p.id]?.[`i${i}`] || ''}
                          onChange={e => updateAssignment(p.id, i, e.target.value)}
                        >
                          {POSITIONS.map(pos => (
                            <option key={pos} value={pos}>{pos || '—'}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

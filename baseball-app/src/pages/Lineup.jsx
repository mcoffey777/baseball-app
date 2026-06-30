import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, onValue, set, push } from 'firebase/database'
import { formatTime } from '../utils'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'Bench']

function DragHandle({ slotIndex }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: slotIndex })
  return (
    <span
      ref={setNodeRef}
      className="drag-handle"
      style={{ opacity: isDragging ? 0.25 : 1 }}
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      ⠿
    </span>
  )
}

function BattingSlot({ index, playerId, players, availablePlayers, onAssign, onRemove, isSource }) {
  const player = players.find(p => p.id === playerId)
  const { setNodeRef, isOver } = useDroppable({ id: index })

  const cls = [
    'batting-slot',
    !player && 'batting-slot--empty',
    isOver && !isSource && 'batting-slot--over',
    isSource && 'batting-slot--source',
  ].filter(Boolean).join(' ')

  return (
    <div ref={setNodeRef} className={cls}>
      <span className="slot-number">{index + 1}</span>
      {player ? (
        <>
          <DragHandle slotIndex={index} />
          <span className="slot-player-name">#{player.number} {player.name}</span>
          <button className="slot-remove" onClick={() => onRemove(index)}>×</button>
        </>
      ) : (
        <select
          className="slot-picker"
          value=""
          onChange={e => { if (e.target.value) onAssign(index, e.target.value) }}
        >
          <option value="">— select player —</option>
          {availablePlayers.map(p => (
            <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function Lineup() {
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState('')
  const [battingOrder, setBattingOrder] = useState(Array(12).fill(null))
  const [positions, setPositions] = useState({})
  const [showNewGame, setShowNewGame] = useState(false)
  const [newOpponent, setNewOpponent] = useState('')
  const [newDate, setNewDate] = useState('')
  const [activeSlot, setActiveSlot] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    onValue(ref(db, 'players'), snap => {
      const data = snap.val()
      setPlayers(
        data
          ? Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.number - b.number)
          : []
      )
    })
    onValue(ref(db, 'games'), snap => {
      const data = snap.val()
      if (data) {
        const list = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .filter(g => g.type === 'game')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        setGames(list)
        setSelectedGame(prev => {
          if (prev) return prev
          const stored = sessionStorage.getItem('selectedGame')
          return (stored && list.find(g => g.id === stored)) ? stored : (list.length ? list[0].id : '')
        })
      } else {
        setGames([])
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedGame) return
    sessionStorage.setItem('selectedGame', selectedGame)
    const unsub = onValue(ref(db, `lineups/${selectedGame}`), snap => {
      const data = snap.val() || {}
      const batting = Array(12).fill(null)
      if (data.batting) {
        Object.entries(data.batting).forEach(([i, pid]) => {
          const idx = parseInt(i)
          if (idx >= 0 && idx < 12) batting[idx] = pid
        })
      }
      setBattingOrder(batting)
      setPositions(data.positions || {})
    })
    return unsub
  }, [selectedGame])

  const saveBatting = (order) => {
    if (!selectedGame) return
    const batting = {}
    order.forEach((pid, i) => { if (pid) batting[i] = pid })
    set(ref(db, `lineups/${selectedGame}/batting`), Object.keys(batting).length ? batting : null)
  }

  const handleAssign = (slot, pid) => {
    const next = [...battingOrder]
    next[slot] = pid || null
    setBattingOrder(next)
    saveBatting(next)
  }

  const handleDragStart = ({ active }) => setActiveSlot(Number(active.id))

  const handleDragEnd = ({ active, over }) => {
    setActiveSlot(null)
    if (!over) return
    const from = Number(active.id)
    const to = Number(over.id)
    if (from === to) return
    const next = [...battingOrder]
    ;[next[from], next[to]] = [next[to], next[from]]
    setBattingOrder(next)
    saveBatting(next)
  }

  const savePosition = (pid, pos) => {
    if (!selectedGame) return
    setPositions(prev => ({ ...prev, [pid]: pos }))
    set(ref(db, `lineups/${selectedGame}/positions/${pid}`), pos || null)
  }

  const createGame = () => {
    if (!newOpponent || !newDate) return
    const r = push(ref(db, 'games'), { opponent: newOpponent, date: newDate, type: 'game' })
    // Pre-populate new game with the current game's batting order
    const filledSlots = battingOrder.filter(Boolean)
    if (filledSlots.length > 0) {
      const batting = {}
      battingOrder.forEach((pid, i) => { if (pid) batting[i] = pid })
      set(ref(db, `lineups/${r.key}/batting`), batting)
    }
    setSelectedGame(r.key)
    setShowNewGame(false)
    setNewOpponent('')
    setNewDate('')
  }

  const assignedIds = battingOrder.filter(Boolean)
  const availablePlayers = players.filter(p => !assignedIds.includes(p.id))
  const selectedGameData = games.find(g => g.id === selectedGame)
  const activePlayer = activeSlot !== null ? players.find(p => p.id === battingOrder[activeSlot]) : null
  const lineupPlayers = battingOrder.filter(Boolean).map(pid => players.find(p => p.id === pid)).filter(Boolean)

  return (
    <div>
      {/* Game selector bar */}
      <div className="card no-print">
        <div className="lu-controls-row">
          <select
            className="lu-game-select"
            value={selectedGame}
            onChange={e => setSelectedGame(e.target.value)}
          >
            {games.length === 0 && <option value="">No games scheduled</option>}
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.date} — vs {g.opponent}</option>
            ))}
          </select>
          <button className="btn-auto" onClick={() => setShowNewGame(v => !v)}>
            {showNewGame ? 'Cancel' : '+ New Game'}
          </button>
        </div>

        {showNewGame && (
          <div className="lu-new-game-form">
            <input
              placeholder="Opponent name"
              value={newOpponent}
              onChange={e => setNewOpponent(e.target.value)}
            />
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
            />
            <button onClick={createGame}>Create Game</button>
          </div>
        )}

        {selectedGameData && (
          <div className="lu-game-meta">
            vs <strong>{selectedGameData.opponent}</strong>
            <span> · {selectedGameData.date}{selectedGameData.time && ` @ ${formatTime(selectedGameData.time)}`}</span>
          </div>
        )}
      </div>

      {/* Two-column lineup */}
      {players.length === 0 ? (
        <div className="card">
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Add players on the Roster page first.</p>
        </div>
      ) : !selectedGame ? (
        <div className="card">
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Select a game or create a new one above.</p>
        </div>
      ) : (
        <div className="lu-columns">
          {/* Left — Batting Order */}
          <div className="card lu-batting-card">
            {/* Shown only when printing */}
            <div className="lu-print-header">
              <div className="lu-print-title">Marauders</div>
              {selectedGameData && (
                <div className="lu-print-sub">
                  vs {selectedGameData.opponent} · {selectedGameData.date}
                  {selectedGameData.time && ` @ ${formatTime(selectedGameData.time)}`}
                </div>
              )}
            </div>

            <div className="lu-batting-header">
              <h2>Batting Order</h2>
              <button className="btn-auto lu-print-btn no-print" onClick={() => window.print()}>
                Print
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveSlot(null)}
            >
              {battingOrder.map((pid, i) => (
                <BattingSlot
                  key={i}
                  index={i}
                  playerId={pid}
                  players={players}
                  availablePlayers={availablePlayers}
                  onAssign={handleAssign}
                  onRemove={slot => handleAssign(slot, null)}
                  isSource={activeSlot === i}
                />
              ))}
              <DragOverlay dropAnimation={null}>
                {activePlayer && (
                  <div className="drag-overlay-card">
                    <span className="drag-handle" style={{ opacity: 1, cursor: 'grabbing' }}>⠿</span>
                    #{activePlayer.number} {activePlayer.name}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Right — Field Positions */}
          <div className="card no-print">
            <h2>Positions</h2>
            {lineupPlayers.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                Assign players in the batting order first.
              </p>
            ) : (
              lineupPlayers.map((player, i) => (
                <div key={player.id} className={`position-row${i % 2 === 1 ? ' position-row--alt' : ''}`}>
                  <span className="position-bat-num">{i + 1}</span>
                  <span className="position-name">
                    <span className="position-jersey">#{player.number}</span> {player.name}
                  </span>
                  <select
                    className="position-select"
                    value={positions[player.id] || ''}
                    onChange={e => savePosition(player.id, e.target.value)}
                  >
                    <option value="">—</option>
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, push, onValue, remove } from 'firebase/database'
import { parseRosterImport } from '../utils'

export default function Roster() {
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)

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

  const openImport = () => {
    setShowImport(true)
    setPreview(null)
    setImportText('')
  }

  const cancelImport = () => {
    setShowImport(false)
    setPreview(null)
    setImportText('')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = String(evt.target.result || '')
      setImportText(text)
      setPreview(parseRosterImport(text))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handlePreview = () => {
    setPreview(parseRosterImport(importText))
  }

  const updatePreviewRow = (idx, field, value) => {
    setPreview(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  const removePreviewRow = (idx) => {
    setPreview(prev => prev.filter((_, i) => i !== idx))
  }

  const addPreviewRow = () => {
    setPreview(prev => [...(prev || []), { number: '', name: '' }])
  }

  const confirmImport = async () => {
    const valid = (preview || []).filter(p => p.name && p.name.trim())
    if (valid.length === 0) return
    setImporting(true)
    try {
      const playersRef = ref(db, 'players')
      await remove(playersRef)
      for (const p of valid) {
        // eslint-disable-next-line no-await-in-loop
        await push(playersRef, {
          name: p.name.trim(),
          number: parseInt(p.number, 10) || 0
        })
      }
      cancelImport()
    } finally {
      setImporting(false)
    }
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
        <h2>Import Roster</h2>
        {!showImport && (
          <>
            <p className="import-hint">Bring in a roster exported from GameChanger — upload a CSV or paste the player list.</p>
            <button onClick={openImport}>Import from GameChanger</button>
          </>
        )}

        {showImport && (
          <>
            <p className="import-hint">Importing will <strong>replace</strong> your current roster.</p>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
            <textarea
              className="import-textarea"
              placeholder={'Paste roster here, e.g.\n12 John Smith\n7 Ava Rivera'}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={6}
            />
            <button onClick={handlePreview}>Preview Import</button>

            {preview && (
              <div className="import-preview">
                <h3 className="import-preview-title">Review before importing ({preview.length} player{preview.length === 1 ? '' : 's'})</h3>
                {preview.length === 0 && (
                  <p className="import-hint">Couldn't find any players in that input. Try adjusting the format or add rows manually below.</p>
                )}
                {preview.map((p, idx) => (
                  <div className="import-preview-row" key={idx}>
                    <input
                      className="import-preview-number"
                      type="number"
                      placeholder="#"
                      value={p.number}
                      onChange={e => updatePreviewRow(idx, 'number', e.target.value)}
                    />
                    <input
                      className="import-preview-name"
                      type="text"
                      placeholder="Player name"
                      value={p.name}
                      onChange={e => updatePreviewRow(idx, 'name', e.target.value)}
                    />
                    <button className="btn-danger" onClick={() => removePreviewRow(idx)}>Remove</button>
                  </div>
                ))}
                <button className="btn-secondary" onClick={addPreviewRow}>+ Add Row</button>
                <div className="import-actions">
                  <button
                    onClick={confirmImport}
                    disabled={importing || preview.filter(p => p.name && p.name.trim()).length === 0}
                  >
                    {importing ? 'Importing…' : `Confirm Import (Replace Roster)`}
                  </button>
                  <button className="btn-secondary" onClick={cancelImport} disabled={importing}>Cancel</button>
                </div>
              </div>
            )}

            {!preview && (
              <button className="btn-secondary" onClick={cancelImport}>Cancel</button>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Roster ({players.length})</h2>
        {players.map(p => (
          <div className="player-row" key={p.id}>
            <span>#{p.number} — {p.name}</span>
            <button className="btn-danger" onClick={() => deletePlayer(p.id)}>Remove</button>
          </div>
        ))}
        {players.length === 0 && <p style={{color:'rgba(255,255,255,0.45)'}}>No players yet. Add some above!</p>}
      </div>
    </div>
  )
}

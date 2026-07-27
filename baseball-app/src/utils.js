export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

// Parses roster data pasted or uploaded from GameChanger (or similar exports).
// Accepts CSV (with or without a header row) or plain pasted lines like
// "12 John Smith" / "John Smith #12" / "John Smith, 12".
// Returns an array of { number, name } — number may be '' if it couldn't be
// determined, so the caller can surface it for manual fixing before import.
export function parseRosterImport(text) {
  if (!text) return []
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const delimiter = lines[0].includes(',') ? ',' : (lines[0].includes('\t') ? '\t' : null)

  if (delimiter) {
    const splitRow = line => line.split(delimiter).map(c => c.trim().replace(/^"(.*)"$/, '$1').trim())
    let rows = lines.map(splitRow)

    const firstRowLower = rows[0].map(c => c.toLowerCase())
    const looksLikeHeader = firstRowLower.some(c =>
      /^#$|number|jersey|^no\.?$|^name$|first|last/.test(c)
    )

    let numberIdx = -1, nameIdx = -1, firstIdx = -1, lastIdx = -1
    if (looksLikeHeader) {
      firstRowLower.forEach((c, i) => {
        if (/^#$|number|jersey|^no\.?$/.test(c)) numberIdx = i
        else if (/first/.test(c)) firstIdx = i
        else if (/last/.test(c)) lastIdx = i
        else if (/name/.test(c)) nameIdx = i
      })
      rows = rows.slice(1)
    }

    return rows.map(cols => {
      let number = ''
      let name = ''

      if (looksLikeHeader) {
        if (numberIdx >= 0) number = cols[numberIdx] || ''
        if (firstIdx >= 0 || lastIdx >= 0) {
          name = [firstIdx >= 0 ? cols[firstIdx] : '', lastIdx >= 0 ? cols[lastIdx] : '']
            .filter(Boolean).join(' ')
        } else if (nameIdx >= 0) {
          name = cols[nameIdx] || ''
        }
      } else {
        // No header detected: assume one column is a bare number, the rest is the name.
        const numericCol = cols.find(c => /^\d{1,3}$/.test(c))
        number = numericCol || ''
        name = cols.filter(c => c !== numericCol).join(' ')
      }

      return { number: number ? parseInt(number, 10) : '', name: name.trim() }
    }).filter(p => p.name)
  }

  // Plain text paste, one player per line.
  return lines.map(line => {
    let m = line.match(/^#?(\d{1,3})\s+(.+)$/)
    if (m) return { number: parseInt(m[1], 10), name: m[2].trim() }
    m = line.match(/^(.+?)\s+#?(\d{1,3})$/)
    if (m) return { number: parseInt(m[2], 10), name: m[1].trim() }
    return { number: '', name: line.replace(/^#/, '').trim() }
  }).filter(p => p.name)
}

const storage = {
  get: (keys) =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        const err = chrome.runtime.lastError
        if (err) return reject(err)
        resolve(result)
      })
    }),
  set: (items) =>
    new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        const err = chrome.runtime.lastError
        if (err) return reject(err)
        resolve()
      })
    }),
}

async function persistBatch(batchKey, batchData) {
  const payload = { [batchKey]: batchData }
  try {
    localStorage.setItem(batchKey, JSON.stringify(batchData))
  } catch (err) {
    // localStorage may be disabled; keep going if it fails.
    console.warn('localStorage write failed', err)
  }
  await storage.set(payload)
}

async function maybeCloseIfCollecting() {
  const { collecting } = await storage.get('collecting')
  if (collecting) window.close()
}

function parseNumber(value, { stripPercent = false } = {}) {
  if (typeof value !== 'string') return 0
  const normalized = stripPercent ? value.replace('%', '') : value
  const num = Number(normalized.trim())
  return Number.isFinite(num) ? num : 0
}

async function getWottChats() {
  try {
    const studentsRows = Array.from(document.querySelectorAll('.dashboard-students > div.flexbox'))
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const stored = await storage.get(currentBatch)
    const batch = stored[currentBatch] ?? { students: {} }

    if (studentsRows.length > 0) {
      studentsRows.forEach((row) => {
        const studentNameEl = row.querySelector('.student-name')
        if (!studentNameEl) return

        const studentName = studentNameEl.textContent.trim()
        if (!studentName) return

        const wott = row.querySelector('.num-column:last-child')
        const flashcard = row.querySelector('.num-column:nth-last-child(2)')

        const wottCount = parseNumber(wott?.textContent)
        const flashcardCompletion = parseNumber(flashcard?.textContent, { stripPercent: true })

        batch.students[studentName] ??= { ticketCount: 0, wottCount: 0, flashcard: 0 }
        batch.students[studentName].wottCount = wottCount
        batch.students[studentName].flashcard = flashcardCompletion
      })
    } else {
      // No student rows found: reset the counters but keep the student list
      for (const studentName in batch.students) {
        const student = batch.students[studentName]
        student.wottCount = 0
        student.flashcard = 0
        student.ticketCount ||= 0
      }
    }

    await persistBatch(currentBatch, batch)
    await maybeCloseIfCollecting()
  } catch (err) {
    console.error('getWottChats failed', err)
  }
}

getWottChats()

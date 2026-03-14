// NOTE: This script is injected into the project dashboard page via the service worker.
// It relies on `scripts/storage.js` having run first to provide a `storage` helper.

function safeStorage() {
  if (window.storage) return window.storage
  return {
    get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
    set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  }
}

function ensureBatchData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {}
  data.tickets ||= []
  data.students ||= {}
  data.teams ||= {}
  data.urls ||= []
  data.urlsDone ||= []
  return data
}

function parseNamesFromTooltip(text) {
  const names = []
  const matcher = /alt='([^']+)'/g
  let match
  while ((match = matcher.exec(text)) !== null) {
    const name = match[1]?.trim()
    if (name) names.push(name)
  }
  return names
}

function parseNumbers(text, regex) {
  const matches = []
  let match
  while ((match = regex.exec(text)) !== null) {
    const n = Number(match[1])
    if (Number.isFinite(n)) matches.push(n)
  }
  return matches
}

async function getCommits() {
  try {
    const storage = safeStorage()
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const raw = localStorage.getItem(String(currentBatch))
    const data = ensureBatchData(raw ? JSON.parse(raw) : null)

    // Reset counts first
    for (const studentName of Object.keys(data.students)) {
      const studentData = data.students[studentName]
      studentData.commitCount = 0
      studentData.branchCount = 0
    }

    const commitEls = document.querySelectorAll(
      '.project-camp-day-wrapper[data-utilities--tooltips-title]'
    )

    commitEls.forEach((el) => {
      const content = el.getAttribute('data-utilities--tooltips-title') || ''
      const students = parseNamesFromTooltip(content)
      const branchCounts = parseNumbers(content, /(\d+)<\/strong>\s*(?:branch|branches)/g)
      const commitCounts = parseNumbers(content, /(\d+)<\/strong>\s*(?:commit|commits)/g)

      students.forEach((student, index) => {
        data.students[student] ||= {
          ticketCount: 0,
          commitCount: 0,
          branchCount: 0,
          wottCount: 0,
          flashcard: 0,
        }
        data.students[student].commitCount += commitCounts[index] ?? 0
        data.students[student].branchCount += branchCounts[index] ?? 0
      })
    })

    const teamEls = Array.from(document.querySelectorAll('h4'))
    const teamNames = teamEls.map((el) => el.textContent?.trim() || '')
    const teamCommits = Array.from(document.querySelectorAll('.project-dashboard .flex-shrink-0 small')).map((el) => el.textContent.match(/\d+/) ? Number(el.textContent.match(/\d+/)[0]) : 0)

    data.teams ||= {}
    teamNames.forEach((team, index) => {
      if (!team) return
      data.teams[team] ||= {}
      data.teams[team].commitCount = teamCommits[index] ?? 0
    })

    localStorage.setItem(currentBatch, JSON.stringify(data))
    await storage.set({ [currentBatch]: data })

    const { collecting } = await storage.get('collecting')
    if (collecting) {
      await storage.set({ collecting: false })
      window.close()
    }

    return data
  } catch (err) {
    console.error('getCommits failed', err)
    return null
  }
}

getCommits()

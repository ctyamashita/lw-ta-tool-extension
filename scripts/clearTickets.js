// NOTE: This script is injected into Kitt pages via the service worker.
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
  data.urls ||= []
  data.urlsDone ||= []
  data.teams ||= {}
  return data
}

async function clearTickets() {
  try {
    const storage = safeStorage()
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const raw = localStorage.getItem(String(currentBatch))
    const data = ensureBatchData(raw ? JSON.parse(raw) : null)

    data.tickets = []
    data.students = {}
    data.urlsDone = []
    data.urls = []
    data.teams = {}

    await storage.set({ [currentBatch]: data })
    try {
      localStorage.setItem(currentBatch, JSON.stringify(data))
    } catch (err) {
      console.warn('clearTickets: localStorage write failed', err)
    }
  } catch (err) {
    console.error('clearTickets failed', err)
  }
}

clearTickets()

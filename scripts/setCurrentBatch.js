// NOTE: This script is injected into Kitt pages via the service worker.
// It relies on `scripts/storage.js` having run first to provide a `storage` helper.

function safeStorage() {
  if (window.storage) return window.storage
  return {
    get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
    set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  }
}

function buildInitialBatch() {
  return {
    tickets: [],
    students: {},
    urls: [],
    urlsDone: [],
    bookmarked: [],
  }
}

async function setCurrentBatch() {
  const invalidUrl = !location.origin.includes('kitt.lewagon.com')
  if (invalidUrl) return

  const batchEl = document.querySelector('.menu-trigger-content-label')
  if (!batchEl) return

  const batchNumber = batchEl.innerText.match(/#(\d+)/)?.[1]
  if (!batchNumber) return

  const storage = safeStorage()
  const initialData = buildInitialBatch()

  // Ensure there is an entry for this batch in chrome.storage.local
  const existingBatch = await storage.get(batchNumber)
  if (!existingBatch?.[batchNumber]) {
    await storage.set({ [batchNumber]: initialData })
  }

  // Ensure localStorage keeps a copy for quick access
  try {
    if (!localStorage.getItem(batchNumber)) {
      localStorage.setItem(batchNumber, JSON.stringify(initialData))
    }
  } catch {
    // ignore localStorage failures (e.g. disabled)
  }

  await storage.set({ currentBatch: batchNumber })
}

setCurrentBatch()
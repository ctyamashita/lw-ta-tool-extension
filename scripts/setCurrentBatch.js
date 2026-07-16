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
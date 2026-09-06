async function setCurrentBatch() {
  const storage = {
    get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
    set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  }
  
  const invalidUrl = !location.origin.includes('kitt.lewagon.com')
  if (invalidUrl) return

  const batchEl = document.querySelector('.menu-trigger-content-label')
  if (!batchEl) return

  const batchNumber = batchEl.innerText.match(/#(\d+)/)?.[1]
  if (!batchNumber) return
  const course = batchEl.innerText.split(" ").slice(1, -1).join(" ")

  // Ensure there is an entry for this batch in chrome.storage.local
  const existingBatch = await storage.get(batchNumber)
  if (!existingBatch?.[batchNumber]) {
    const initialData = {
      tickets: [],
      students: {},
      urls: [],
      urlsDone: [],
      bookmarked: [],
      course: course
    }
    await storage.set({[batchNumber]: initialData})
  } else {
    existingBatch[batchNumber].course = course
    await storage.set(existingBatch)
  }

  // Ensure localStorage keeps a copy for quick access
  try {
    localStorage.setItem(batchNumber, JSON.stringify(existingBatch[batchNumber]))
  } catch {
    // ignore localStorage failures (e.g. disabled)
  }

  await storage.set({ currentBatch: batchNumber })
}

setCurrentBatch()
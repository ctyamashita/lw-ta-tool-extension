async function getAllDays() {
  const url = location.pathname
  if (!/day_dashboard\/?$/.test(url)) return

  try {
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const batchData = await storage.get(currentBatch)
    const current = batchData?.[currentBatch]
    if (!current) return

    const urls = Array.from(document.querySelectorAll('.day-navigation a.dropdown-item')).map((el) => el.href)
    const lastUrl = urls[urls.length - 1]
    if (lastUrl?.includes('Demo-Day')) {
      // ensure Demo-Day stays last
      urls.push(urls.pop())
    }

    if (!Array.isArray(current.urls) || current.urls.length < urls.length) {
      current.urls = urls
      await storage.set({ [currentBatch]: current })
      try {
        localStorage.setItem(currentBatch, JSON.stringify(current))
      } catch (err) {
        console.warn('unable to persist to localStorage', err)
      }
    }
  } catch (err) {
    console.error('getAllDays failed', err)
  }
}

getAllDays()
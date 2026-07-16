async function getWorkTime() {
  try {
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const workTime = document.querySelector(".today .camp-day small").innerText;

    // Ensure localStorage keeps a copy for quick access
    try {
      localStorage.setItem("time", workTime)
    } catch {
      // ignore localStorage failures (e.g. disabled)
    }

    await storage.set({time: workTime})

  } catch (error) {
    console.log("Failed to get work time:", error)
  }
}

getWorkTime()
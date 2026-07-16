// NOTE: This script is injected into ticket pages via the service worker.
// It observes DOM mutations to automatically toggle "on duty" status when break time ends.

function safeSyncStorage() {
  return {
    get: (keys) =>
      new Promise((resolve, reject) => {
        chrome.storage.sync.get(keys, (result) => {
          const err = chrome.runtime.lastError
          if (err) return reject(err)
          resolve(result)
        })
      }),
    set: (items) =>
      new Promise((resolve, reject) => {
        chrome.storage.sync.set(items, () => {
          const err = chrome.runtime.lastError
          if (err) return reject(err)
          resolve()
        })
      }),
  }
}

function getTimestamp() {
  const date = new Date()
  return date.toString().split(' ').slice(0, 4).join(' ')
}

function parseRemainingTime(text) {
  const match = text.match(/\d+/)
  return match ? Number(match[0]) : 0
}

async function autoOnAfterBreak() {
  const url = location.pathname
  if (!/tickets\/?$/.test(url)) return

  // Prevent multiple observers
  if (window.autoOnAfterBreakObserver) return

  try {
    const storage = safeSyncStorage()
    const { autoOnAfterBreak, onDutyLastTriggered } = await storage.get(['autoOnAfterBreak', 'onDutyLastTriggered'])

    if (!autoOnAfterBreak) return

    // Reset onDuty if a new day
    const currentDateString = getTimestamp()
    if (onDutyLastTriggered !== currentDateString) {
      await storage.set({ onDuty: false })
    }

    // Set up observer
    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes') {
          const target = mutation.target

          // Check for remaining time update
          const isRemainingTimeEl = target?.parentElement?.parentElement?.classList?.contains('info-bubble')
          if (isRemainingTimeEl) {
            handleRemainingTimeUpdate(target, storage)
          }

          // Check for toggle change
          if (target.classList?.contains('switch-container')) {
            const toggleValue = target.classList.contains('is-on-duty')
            storage.set({ onDuty: toggleValue, onDutyLastTriggered: getTimestamp() }).catch((err) =>
              console.error('Failed to update onDuty status', err)
            )
          }
        }
      }
    })

    const config = { attributes: true, childList: true, subtree: true }
    observer.observe(document, config)
    window.autoOnAfterBreakObserver = observer
  } catch (err) {
    console.error('autoOnAfterBreak failed', err)
  }
}

async function handleRemainingTimeUpdate(target, storage) {
  try {
    const { onDuty } = await storage.get('onDuty')
    if (!onDuty) return

    const text = target.innerText || ''
    const isStart = text.includes('hour')
    const remainingTime = parseRemainingTime(text) || (isStart ? 60 : 0)

    // Check if already online
    const alreadyOnline = !!document.querySelector('.is-on-duty')
    if (alreadyOnline) return

    if (remainingTime === 0) {
      // Go on duty
      const toggle = document.querySelector('a:has(.switch)')
      if (toggle) {
        toggle.click()
        setTimeout(() => {
          const popup = document.querySelector('.modal-dialog:has(#ticket-skills)')
          if (popup) {
            const skillsBtns = popup.querySelectorAll('#ticket-skills a')
            const submitBtn = popup.querySelector('.modal-footer button')

            skillsBtns.forEach((btn) => btn.click())
            if (submitBtn) submitBtn.click()
          }
          // Reload to reflect changes (consider if this can be avoided)
          location.reload()
        }, 1000)
      }
    } else {
      console.log('Remaining time:', remainingTime)
    }
  } catch (err) {
    console.error('handleRemainingTimeUpdate failed', err)
  }
}

autoOnAfterBreak()

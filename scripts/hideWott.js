async function hideWott() {
  const url = location.pathname
  if (!/tickets\/?$/.test(url)) return

  try {
    const { hideWott } = await new Promise((resolve) =>
      chrome.storage.sync.get('hideWott', resolve)
    )

    const wottEl = Array.from(document.querySelectorAll('[id]')).find((el) =>
      el.id.includes('ticket_conversations')
    )
    if (!wottEl) return

    let wottContainer = document.querySelector('.wottContainer')
    if (!wottContainer) {
      wottContainer = document.createElement('div')
      wottContainer.classList.add('wottContainer')
      wottEl.insertAdjacentElement('beforeBegin', wottContainer)
      wottContainer.append(wottEl)
    }

    if (hideWott) {
      wottContainer.style.display = 'none'
    } else {
      wottContainer.style.display = ''
    }
  } catch (err) {
    console.error('hideWott failed', err)
  }
}

hideWott()
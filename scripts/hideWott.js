function hideWott() {
  // console.log("hideWott triggered")

  const url = location.pathname
  // check if it's on ticket page
  if (!/tickets\/?$/.test(url)) return;

  chrome.storage.sync.get("hideWott").then((result) => {
    const { hideWott } = result
    const elWithIds = document.querySelectorAll('[id]')
    const wottEl = Array.from(elWithIds).find(el=>el.id.includes('ticket_conversations'))
    let wottContainer = document.querySelector('.wottContainer')
    
    if (wottContainer == null) {
      // if missing container
      wottContainer ||= document.createElement('div')
      wottContainer.classList.add('wottContainer')
      wottEl.insertAdjacentElement('beforeBegin', wottContainer)
      wottContainer.append(wottEl)
    }
    if (hideWott && wottEl) {
      // when enabled
      wottContainer.setAttribute('style', 'display: none')
    } else {
      // when disabled
      wottContainer.removeAttribute('style')
    }
  })
}

hideWott()
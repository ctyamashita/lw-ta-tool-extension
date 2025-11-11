function timestamp() {
  const date = new Date;
  return date.toString().split(' ').slice(0,4).join(' ') 
}

function autoOnAfterBreak() {
  // console.log("autoOnAfterBreak triggered")
  const url = location.pathname
  // check if it's on ticket page
  if (!/tickets\/?$/.test(url)) return;

  chrome.storage.sync.get(["autoOnAfterBreak", "onDuty", "onDutyLastTriggered"]).then((result) => {
    const { autoOnAfterBreak, onDuty, onDutyLastTriggered } = result
    if (autoOnAfterBreak) {
      // first time loading
      const currentDateString = timestamp()
      const triggeredToday = onDutyLastTriggered === currentDateString
      chrome.storage.sync.set({onDuty: triggeredToday})
      
      // setting observer
      const observer = new MutationObserver((mutationList, _observer) => {
        for (const mutation of mutationList) {
          // console.log("This element changed:", mutation.target)
          // check if it's a remaining time update
          const isRemainingTimeEl = mutation.target?.parentElement?.parentElement?.classList?.contains('info-bubble')
          // target(span) > strong > div.info-bubble
          if (mutation.type == 'attributes' && isRemainingTimeEl && autoOnAfterBreak && onDuty) {
            const isStart = mutation.target.innerText.includes('hour')
            let remainingTime = mutation.target.innerText.match(/\d+/)
            // finding remaining time
            if (remainingTime) {
              remainingTime = Number(remainingTime[0])
            } else {
              remainingTime = isStart ? 60 : 0
            }

            // check if already online
            const alreadyOnline = !!document.querySelector('.is-on-duty')
            if (alreadyOnline) return

            if (remainingTime == 0) {
              const toggle = document.querySelector('a:has(.switch)')
              toggle.click();
              location.reload();
            } else {
              // console.log('Remaining time:', remainingTime)
            }
          } else if (mutation.type == 'attributes' && mutation.target.classList.contains('is-on-duty')) {
            // if toggle change
            chrome.storage.sync.set({ onDuty: true, onDutyLastTriggered: timestamp() })
          }
        }
      });
      // Options for the observer (which mutations to observe)
      const config = { attributes: true, childList: true, subtree: true };
      // Start observing the target node for configured mutations
      observer.observe(document, config);
    }
  })
}

autoOnAfterBreak()
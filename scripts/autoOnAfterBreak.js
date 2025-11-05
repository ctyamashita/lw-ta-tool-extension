function autoOnAfterBreak() {
  // console.log("autoOnAfterBreak triggered")
  const url = location.pathname
  // check if it's on ticket page
  if (!/tickets\/?$/.test(url)) return;

  chrome.storage.sync.get("autoOnAfterBreak").then((result) => {
    const { autoOnAfterBreak } = result
    if (autoOnAfterBreak) {
      // setting observer
      const contentEl = document.querySelector('#ticketsApp');
      const observer = new MutationObserver((mutationList, _observer) => {
        for (const mutation of mutationList) {
          // console.log("This element changed:", mutation.target)
          // check if it's a remaining time update
          const isRemainingTimeEl = mutation.target?.parentElement?.parentElement?.classList?.contains('info-bubble')
          // target(span) > strong > div.info-bubble
          
          if (mutation.type == 'attributes' && isRemainingTimeEl && autoOnAfterBreak) {
            const isStart = mutation.target.innerText.includes('hour')
            let remainingTime = mutation.target.innerText.match(/\d+/)
            // finding remaining time
            if (remainingTime) {
              remainingTime = Number(remainingTime[0])
            } else {
              remainingTime = isStart ? 60 : 0
            }

            // check if already online
            const alreadyOnline = !!document.querySelector('.teacher-on-duty.me')
            if (alreadyOnline) return

            if (remainingTime == 0) {
              const toggle = document.querySelector('a:has(.switch)')
              toggle.click();
              location.reload();
            } else {
              // console.log('Remaining time:', remainingTime)
            }
          }
        }
      });
      // Options for the observer (which mutations to observe)
      const config = { attributes: true, childList: true, subtree: true };
      // Start observing the target node for configured mutations
      observer.observe(contentEl, config);
    }
  })
}

autoOnAfterBreak()
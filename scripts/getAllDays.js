function getAllDays() {
  const url = location.pathname
  // check if it's on statistics page
  if (/day_dashboard\/?$/.test(url)) {
    chrome.storage.local.get('currentBatch').then(currentBatchResponse=>{
      const { currentBatch } = currentBatchResponse
      if (currentBatch) {
        chrome.storage.local.get(currentBatch).then(response=>{
          if (response[currentBatch]) {
            // urls
            // response[currentBatch]?.todayUrl = document.querySelector('.day-navigation a.dropdown-item.active').href
            const urls = Array.from(document.querySelectorAll('.day-navigation a.dropdown-item')).map(el=>el.href)
            const lastUrl = urls.pop()
            if (lastUrl.includes('Demo-Day')) urls.push(lastUrl)
            if (!response[currentBatch]?.urls || response[currentBatch]?.urls?.length < urls.length) {
              response[currentBatch].urls = urls
              chrome.storage.local.set(response)
              localStorage.setItem(currentBatch, JSON.stringify(response[currentBatch]))
            }
          }
        })
      }
    })
  }
}

getAllDays()
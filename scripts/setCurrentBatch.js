function setCurrentBatch() {
  const invalidUrl = !location.origin.includes('kitt.lewagon.com')
  if (invalidUrl) return
  const batch = document.querySelector('.menu-trigger-content-label')
  if (!batch) return
  const batchNumber = batch.innerText.match(/#(\d+)/)[1]
  // console.log('Current batch set to:', batchNumber)

  const initialData = {
    tickets: [],
    ticketCount: {},
    urls: []
  }

  // check if already added to localStorage
  const data = JSON.parse(localStorage.getItem(batchNumber))
  // if not set initial data
  if (data == null) localStorage.setItem(batchNumber, JSON.stringify(initialData))
  chrome.storage.local.set({ currentBatch: batchNumber })

  // check if already added to chrome.storage.local
  chrome.storage.local.get(batchNumber).then((response)=>{
    // if not set initial data
    if (!response[batchNumber]) chrome.storage.local.set({ [batchNumber]: initialData })
  })
}

setCurrentBatch()
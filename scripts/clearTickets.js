function clearTickets() {
  chrome.storage.local.get('currentBatch').then(response=>{
    const { currentBatch } = response;
    chrome.storage.local.get(currentBatch).then(batchData=>{
      batchData[currentBatch].tickets = []
      batchData[currentBatch].ticketCount = {}
      batchData[currentBatch].urlsDone = []
      batchData[currentBatch].urls = []
      chrome.storage.local.set(batchData).then(()=>{
        localStorage.setItem(currentBatch, JSON.stringify(batchData[currentBatch]))
      })
    })
  })
}

clearTickets()
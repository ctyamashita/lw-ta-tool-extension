function clearTickets() {
  chrome.storage.local.get('currentBatch').then(response=>{
    const { currentBatch } = response;
    chrome.storage.local.get(currentBatch).then(batchData=>{
      batchData[currentBatch].tickets = []
      batchData[currentBatch].students = {}
      batchData[currentBatch].urlsDone = []
      batchData[currentBatch].urls = []
      batchData[currentBatch].teams = {}
      chrome.storage.local.set(batchData).then(()=>{
        localStorage.setItem(currentBatch, JSON.stringify(batchData[currentBatch]))
      })
    })
  })
}

clearTickets()
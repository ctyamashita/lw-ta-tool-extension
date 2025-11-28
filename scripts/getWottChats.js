async function getWottChats() {
  const studentsData = document.querySelectorAll('.dashboard-students > div');
  const { currentBatch } = await chrome.storage.local.get('currentBatch')
  chrome.storage.local.get(currentBatch).then(async response=>{
    studentsData.forEach(row=>{
      const student = row.querySelector('.student-name').innerText
      const wottCount = Number(row.querySelector('.num-column:last-child').innerText)
      const flashcard = Number(row.querySelector('.num-column:nth-last-child(2)').innerText.slice(0,-1))
      response[currentBatch].students[student].wottCount = wottCount
      response[currentBatch].students[student].flashcard = flashcard
    })

    localStorage.setItem(currentBatch, JSON.stringify(response[currentBatch]))
    await chrome.storage.local.set(response)

    chrome.storage.local.get('collecting').then(response=>{
      const { collecting } = response
      if (collecting) {
        window.close()
      }
    })
  })
}

getWottChats()
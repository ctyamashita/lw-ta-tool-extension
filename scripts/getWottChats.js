async function getWottChats() {
  const studentsData = document.querySelectorAll('.dashboard-students > div.flexbox');
  const { currentBatch } = await chrome.storage.local.get('currentBatch')
  chrome.storage.local.get(currentBatch).then(async response=>{
    studentsData.forEach(row=>{
      const student = row.querySelector('.student-name')
      const wott = row.querySelector('.num-column:last-child')
      const flashcard = row.querySelector('.num-column:nth-last-child(2)')
      const wottCount = wott ? Number(wott.innerText) : 0
      const flashcardCompletion = flashcard ? Number(flashcard.innerText.slice(0,-1)) : 0
      if (student) {
        const studentName = student.innerText
        response[currentBatch].students[studentName] ||= {ticketCount: 0, wottCount: 0, flashcard: 0}
        response[currentBatch].students[studentName].wottCount = wottCount
        response[currentBatch].students[studentName].flashcard = flashcardCompletion
      }
    })

    localStorage.setItem(currentBatch, JSON.stringify(response[currentBatch]))
    await chrome.storage.local.set(response)

    chrome.storage.local.get('collecting').then(response=>{
      const { collecting } = response
      if (collecting) window.close()
    })
  })
}

setTimeout(() => {
  getWottChats()
}, 2000);
// https://kitt.lewagon.com/camps/2123/project_dashboard
async function getCommits() {
  const { currentBatch } = await chrome.storage.local.get('currentBatch')
  const data = JSON.parse(localStorage.getItem(currentBatch.toString()))
  const commitEls = document.querySelectorAll('.project-camp-day-wrapper[data-utilities--tooltips-title]')
  // reseting commit and branch count
  for (const student in data.students) {
    if (!Object.hasOwn(data.students, student)) continue;
    
    const studentData = data.students[student];
    studentData.commitCount = 0
    studentData.branchCount = 0
  }
  commitEls.forEach((el)=>{
    const content = el.getAttribute('data-utilities--tooltips-title')
    const students = content.match(/alt='([a-zA-Z ]*)'/g).map(name=>name.slice(5,-1))
    console.log(students)
    const branchCount = content.match(/(\d+)<\/strong> branch|branches/g).map(el=>Number(el.replace(/[^0-9]+/,'')))
    const commitCount = content.match(/(\d+)<\/strong> commit|commits/g).map(el=>Number(el.replace(/[^0-9]+/,'')))
    students.forEach((student, index)=>{
      data.students[student] ||= { ticketCount: 0, commitCount: 0, branchCount: 0, wottCount: '0%' }
      data.students[student].commitCount += commitCount[index]
      data.students[student].branchCount += branchCount[index]
    })
  })

  const teams = Array.from(document.querySelectorAll('h4')).map(el=>el.innerText.trim())
  const teamCommits = Array.from(document.querySelectorAll('.flex-shrink-0 small')).map(el=>Number(el.innerText.slice(0,-8)))
  data.teams ||= {}
  teams.forEach((team,index)=>{
    data.teams[team] ||= {}
    data.teams[team].commitCount = teamCommits[index]
  })

  localStorage.setItem(currentBatch, JSON.stringify(data))
  await chrome.storage.local.set({[currentBatch]: data})
  chrome.storage.local.get('collecting').then(response=>{
    const { collecting } = response
    if (collecting) window.close()
  })
}
setTimeout(() => {
  getCommits()
}, 1000);
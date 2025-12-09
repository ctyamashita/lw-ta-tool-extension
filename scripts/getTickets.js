function extractText(array) {
  if (array == undefined) return [false, false]
  return array.map(string => string.slice(1, -1).trim()).filter(string => string.length > 0)
}

function stringTimeToIntegerSeconds(string) {
  string = string.trim()
  let totalSec = 0
  const timeArr = string.split(/(h|min|sec)/).filter(el=>el.trim().length > 0)
  // ['1','h','45','min'] or ['45','min'] or ['45','sec']
  timeArr.forEach((item, index)=>{
    item = Number(item)
    if (index % 2 == 0) {
      const unit = timeArr[index + 1]
      switch (unit) {
        case 'h':
          totalSec += item * 60 * 60
          break;
        case 'min':
          totalSec += item * 60
          break;
        case 's':
          totalSec += item
          break;
      
        default:
          break;
      }
    } 
  })
  return totalSec
}

async function getTickets() {
  const { currentBatch } = await chrome.storage.local.get('currentBatch')
  const data = JSON.parse(localStorage.getItem(currentBatch.toString()))
  data.urlsDone ||= []
  if (!data.urlsDone.includes(location.href) && location.href !== `https://kitt.lewagon.com/camps/${currentBatch}/tickets/day_dashboard?path=00-Setup`) data.urlsDone.push(location.href)

  if (location.href.includes('-Projects')) {
    const teamsEl = document.querySelectorAll('.student-ticket-data')
    teamsEl.forEach(el=>{
      const teamName = el.querySelector('a').innerText
      const ticketCount = Number(el.querySelector('.left-offset').innerText.replace(/[^0-9]/g, ''))
      data.teams[teamName] ||= {ticketCount: 0}
      data.teams[teamName].ticketCount += ticketCount
    })
  }

  const ticketsEl = document.querySelectorAll(".ticket-data")
  const dayLecture = document.querySelector("h2").innerText
  ticketsEl.forEach(ticket => {
    const student = ticket?.dataset?.title?.split(/<\/?strong>/)[1]
    const title = ticket?.dataset?.title
    const content = ticket?.dataset?.content

    const alreadyAdded = data.tickets.find(tckt => tckt?.content == content && tckt?.title == title)

    if (!alreadyAdded && student && title && content) {
      if (student) {
        if (data.students[student] == undefined) {
          data.students[student] = { ticketCount: 1, commitCount: 0, branchCount: 0, wottCount: 0, flashcard: 0 }
        } else {
          data.students[student].ticketCount++
        }

        // const contentText = content.match(/<\/h4>[^<]+<\/div>/)[0]?.slice(5,-7)?.trim()
        const challenge = content.match(/<h4>[^<]*/)[0]?.slice(4)?.trim()
        const withPreferredTA = /pref-teacher/.test(content)
        const timeString = title.match(/\d+(min|h\d+min|sec)/)[0]
        const timeInSec = stringTimeToIntegerSeconds(timeString)

        data.tickets.push({
          student: student,
          title: title,
          content: content,
          dayLecture: dayLecture,
          timeString: timeString,
          timeInSec: timeInSec,
          // contentText: contentText,
          withPreferredTA: withPreferredTA,
          challenge: challenge
        })
      }
    }
  })

  localStorage.setItem(currentBatch, JSON.stringify(data))
  return data
}

getTickets()
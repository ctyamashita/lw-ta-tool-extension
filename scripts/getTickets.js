function extractText(array) {
  if (array == undefined) return [false, false]
  return array.map(string => string.slice(1, -1).trim()).filter(string => string.length > 0)
}

async function getTickets() {
  const { currentBatch } = await chrome.storage.local.get('currentBatch')
  const data = JSON.parse(localStorage.getItem(currentBatch.toString()))
  data.urlsDone ||= []
  data.urlsDone.push(location.href)

  const ticketsEl = document.querySelectorAll(".ticket-data")
  const dayLecture = document.querySelector("h2").innerText
  ticketsEl.forEach(ticket => {
    const student = ticket?.dataset?.title?.split(/<\/?strong>/)[1]
    const title = ticket?.dataset?.title
    const content = ticket?.dataset?.content

    const alreadyAdded = data.tickets.find(tckt => tckt?.content == content && tckt?.title == title)

    if (!alreadyAdded && student && title && content) {
      if (student) {
        if (data.ticketCount[student] == undefined) {
          data.ticketCount[student] = { ticketCount: 1 }
        } else {
          data.ticketCount[student].ticketCount++
        }

        data.tickets.push({
          student: student,
          title: title,
          content: content,
          dayLecture: dayLecture
        })
      }
    }
  })

  localStorage.setItem(currentBatch, JSON.stringify(data))
  return data
}

getTickets()
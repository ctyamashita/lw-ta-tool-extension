function parseTimeToSeconds(value) {
  if (typeof value !== 'string') return 0
  const match = value.match(/(\d+)\s*(h(?:\d+min)?|min|sec|s)/)
  if (!match) return 0

  const quantity = Number(match[1])
  const unit = match[2]
  if (!Number.isFinite(quantity)) return 0

  if (unit.startsWith('h')) return quantity * 3600
  if (unit === 'min') return quantity * 60
  return quantity
}

function ensureBatchData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {}
  data.tickets ||= []
  data.students ||= {}
  data.teams ||= {}
  data.urls ||= []
  data.urlsDone ||= []
  return data
}

async function getTickets() {
  try {
    const { currentBatch } = await storage.get('currentBatch')
    if (!currentBatch) return

    const raw = localStorage.getItem(String(currentBatch))
    const data = ensureBatchData(raw ? JSON.parse(raw) : null)

    const currentUrl = location.href
    const isSetupPage = currentUrl === `https://kitt.lewagon.com/camps/${currentBatch}/tickets/day_dashboard?path=00-Setup`
    if (!isSetupPage && !data.urlsDone.includes(currentUrl)) {
      data.urlsDone.push(currentUrl)
    }

    if (currentUrl.includes('-Projects')) {
      const teamEls = document.querySelectorAll('.student-ticket-data')
      teamEls.forEach((el) => {
        const teamName = el.querySelector('a')?.textContent?.trim() ?? ''
        const ticketCount = Number(el.querySelector('.left-offset')?.textContent?.replace(/[^0-9]/g, '') ?? 0)
        if (!teamName) return
        data.teams[teamName] ||= { ticketCount: 0 }
        data.teams[teamName].ticketCount += ticketCount
      })
    }

    const ticketsEls = document.querySelectorAll('.ticket-data')
    const dayLecture = document.querySelector('h2')?.textContent?.trim() ?? ''

    ticketsEls.forEach((ticket) => {
      const title = ticket?.dataset?.title
      const content = ticket?.dataset?.content
      const student = title?.split(/<\/?strong>/)?.[1]?.trim()

      if (!student || !title || !content) return

      const alreadyAdded = data.tickets.some(
        (tckt) => tckt?.content === content && tckt?.title === title
      )
      if (alreadyAdded) return

      data.students[student] ||= {
        ticketCount: 0,
        commitCount: 0,
        branchCount: 0,
        wottCount: 0,
        flashcard: 0,
      }
      data.students[student].ticketCount += 1

      const challenge = content.match(/<h4[^>]*>([^<]*)/)?.[1]?.trim() ?? ''
      const withPreferredTA = /pref-teacher/.test(content)
      const timeString = title.match(/\d+\s*(?:h\d+min|min|sec|s)/)?.[0] ?? ''
      const timeInSec = parseTimeToSeconds(timeString)

      data.tickets.push({
        student,
        title,
        content,
        dayLecture,
        timeString,
        timeInSec,
        withPreferredTA,
        challenge,
      })
    })

    localStorage.setItem(currentBatch, JSON.stringify(data))
    await storage.set({ [currentBatch]: data })
    return data
  } catch (err) {
    console.error('getTickets failed', err)
    return null
  }
}

getTickets()

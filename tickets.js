chrome.storage.sync.get('css').then(response=>{
  const { css } = response;
  css.forEach((link)=>{
    const linkEl = document.createElement('link');
    linkEl.setAttribute('href', link);
    linkEl.setAttribute('rel','stylesheet');
    document.head.appendChild(linkEl)
  })
})

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
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

function descOrderEntriesByValue(obj) {
  return Object.entries(obj).sort((a,b)=>b[1] - a[1])
}

async function loadData(currentBatch) {
  if (!currentBatch) return

  const ticketsDataResponse = await chrome.storage.local.get(currentBatch)
  const { tickets, ticketCount } = ticketsDataResponse[currentBatch]
  const anyTickets = typeof tickets == 'object' && tickets?.length > 0

  // update heading
  document.title = `#${currentBatch} Tickets`
  document.querySelector('h1').innerText = `#${currentBatch} Tickets`
  document.querySelector('h2#all-tickets').innerText = `All Tickets (${tickets?.length || 0})`

  if (!anyTickets) return

  ticketsContainer.innerHTML = ''
  let totalDays = 0
  let dayNum = 0
  tickets.forEach(ticket=>{
    const id = ticket.dayLecture.replaceAll(/[ ,&()]+/g, '-').toLowerCase()
    let tab = document.getElementById(id)
    let tabContent = document.querySelector(`#${id} > div`)
    let title = document.querySelector(`#${id} summary`)

    if (!tab) {
      tab = document.createElement('details');
      tab.id = id
      title = document.createElement('summary')
      tabContent = document.createElement('div')
      tab.appendChild(title)
      tab.appendChild(tabContent)
      ticketsContainer.appendChild(tab)
      totalDays++
      dayNum++
    }

    tabContent.insertAdjacentHTML('beforeend',
      `<div class="popover">
        <div class="popover-header">
          ${ticket.title}
        </div>
        <div class="popover-body">
          ${ticket.content.replace('fas fa-heart', 'fa-solid fa-heart')}
        </div>
      </div>`
    )

    tabContent.querySelectorAll('a[href]').forEach(el=>{
      // fixing links
      if (el.href.includes('chrome-extension://')) el.setAttribute('href', el.href.replace(location.origin, `https://kitt.lewagon.com/`))
    })

    title.innerHTML = `<h3>Day ${pad(dayNum, 2)} | ${ticket.dayLecture} (${tabContent.childNodes.length})</h3>`
  })

  // most Tickets
  const arrCount = Object.entries(ticketCount).map(entry=>[entry[0], entry[1].ticketCount])
  const sortedCount = arrCount.sort((a,b)=> b[1] - a[1] )

  sortedCount.slice(0,8).forEach(student=>{
    const [ name, amount ] = student
    const ticketsPerDay = Math.round(amount / totalDays * 10) / 10
    document.querySelector("#most").insertAdjacentHTML('beforeend',`<li><strong>${name}</strong> - ${amount} tickets (${ticketsPerDay}/day)</li>`)
  })

  // finding longest ticket
  const allTickets = document.querySelectorAll('.popover');

  const sortedTickets = Array.from(allTickets).sort((a,b)=>{
    const aTime = a.querySelector('.ticket-popover-time').innerHTML
    const bTime = b.querySelector('.ticket-popover-time').innerHTML

    return stringTimeToIntegerSeconds(bTime) - stringTimeToIntegerSeconds(aTime)}
  )
  const longestTicket = sortedTickets[0]
  document.querySelector("#longest").appendChild(longestTicket)

  const picky = {}
  const favorites = {}
  const createdByTA = {}
  allTickets.forEach(ticket=>{
    const isPreferredTeacherPresent = ticket.querySelector('.pref-teacher')
    if (isPreferredTeacherPresent) {
      const ticketText = ticket.querySelector('.ticket-popover-body')
      const notCreatedByTA = Array.from(ticketText.childNodes).filter(child=>child.nodeName == '#text' ).map(el=>el.data.trim()).filter(e=>e.length > 0 ).join().length > 20

      const teacher = ticket.querySelector('.popover-pref-teacher-img').src
      if (notCreatedByTA) {
        const student = ticket.querySelector('.ticket-popover-student strong').innerHTML.trim();
        picky[student] ||= 0
        picky[student]++
        favorites[teacher] ||= 0
        favorites[teacher]++
      } else {
        createdByTA[teacher] ||= 0
        createdByTA[teacher]++
      }
    }
  })

  // Tickets by TA
  const sortedCreatedByTA = descOrderEntriesByValue(createdByTA)
  sortedCreatedByTA.forEach(teacher=>{
    const [teacherImg, count] = teacher
    document.querySelector('#created').insertAdjacentHTML('beforeend', `<span><img class="favorite-ta" src="${teacherImg}" /><strong>${count}<strong> <small>tickets</small></span>`)
  })

  // favorite
  const sortedFavorites = descOrderEntriesByValue(favorites)
  sortedFavorites.forEach(favorite=>{
    const [favoriteImg,favoriteCount] = favorite
    document.querySelector('#favorite').insertAdjacentHTML('beforeend', `<span><img class="favorite-ta" src="${favoriteImg}" /><strong>${favoriteCount}<strong> <small>tickets</small></span>`)
  })

  // picky
  const sortedPicky = descOrderEntriesByValue(picky)
  sortedPicky.slice(0,8).forEach(picky=>{
    const [pickyName,pickyCount] = picky
    document.querySelector('#picky').insertAdjacentHTML('beforeend', `<li><strong>${pickyName}</strong> - ${pickyCount} tickets</li>`)
  })
}

let { currentBatch } = await chrome.storage.local.get('currentBatch')
const ticketsContainer = document.getElementById('tickets-container')

if (location.search.includes('batch=')) {
  const batch = location.search.match(/\^?batch=(\d+)/)[1];
  currentBatch = batch
}

loadData(currentBatch)



chrome.storage.sync.get('css').then(response=>{
  const { css } = response;
  css.forEach((link)=>{
    const linkEl = document.createElement('link');
    linkEl.setAttribute('href', link);
    linkEl.setAttribute('rel','stylesheet');
    document.head.appendChild(linkEl)
  })
})

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

const currentBatchResponse = await chrome.storage.local.get('currentBatch')
let currentBatch = currentBatchResponse.currentBatch
const ticketsContainer = document.getElementById('tickets-container')

if (location.search.includes('batch=')) {
  const batch = location.search.match(/\^?batch=(\d+)/)[1];
  currentBatch = batch
}

if (currentBatch) {
  const ticketsDataResponse = await chrome.storage.local.get(currentBatch)
  const ticketsData = ticketsDataResponse[currentBatch]
  const tickets = ticketsData?.tickets
  const ticketCount = ticketsData?.ticketCount

  // update heading
  document.querySelector('h1').innerText = `#${currentBatch} Tickets`
  document.querySelector('h2#all-tickets').innerText = `All Tickets (${tickets?.length || 0})`

  if (tickets) {
    ticketsContainer.innerHTML = ''
    let totalDays = 0
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

      title.innerHTML = `<h2>${ticket.dayLecture} (${tabContent.childNodes.length})</h2>`
    })

    // most Tickets
    const arrCount = Object.entries(ticketCount).map(entry=>[entry[0], entry[1].ticketCount])
    const sortedCount = arrCount.sort((a,b)=> b[1] - a[1] )

    sortedCount.slice(0,5).forEach(student=>{
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
    allTickets.forEach(ticket=>{
      const isPreferredTeacherPresent = ticket.querySelector('.pref-teacher')
      if (isPreferredTeacherPresent) {
        const teacher = ticket.querySelector('.popover-pref-teacher-img').src
        const student = ticket.querySelector('.ticket-popover-student strong').innerHTML.trim();
        picky[student] ||= 0
        picky[student]++
        favorites[teacher] ||= 0
        favorites[teacher]++
      }
    })
    // favorite
    const sortedFavorites = descOrderEntriesByValue(favorites)
    sortedFavorites.forEach(favorite=>{
      const [favoriteImg,favoriteCount] = favorite
      document.querySelector('#favorite').insertAdjacentHTML('beforeend', `<span><img class="favorite-ta" src="${favoriteImg}" /><strong>${favoriteCount}<strong> <small>tickets</small></span>`)
    })

    // picky
    const sortedPicky = descOrderEntriesByValue(picky)
    sortedPicky.slice(0,3).forEach(picky=>{
      const [pickyName,pickyCount] = picky
      document.querySelector('#picky').insertAdjacentHTML('beforeend', `<li><strong>${pickyName}</strong> - ${pickyCount} tickets</li>`)
    })
  }
}


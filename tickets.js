chrome.storage.sync.get('css').then(response=>{
  const { css } = response;
  css.forEach((link)=>{
    const linkEl = document.createElement('link');
    linkEl.setAttribute('href', link);
    linkEl.setAttribute('rel','stylesheet');
    document.head.appendChild(linkEl)
  })
})

let stats = []
let totalTicketSeconds = 0
const icons = {
  commits: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M480-280q-73 0-127.5-45.5T284-440H80v-80h204q14-69 68.5-114.5T480-680q73 0 127.5 45.5T676-520h204v80H676q-14 69-68.5 114.5T480-280Zm0-80q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z"/></svg>',
  branches: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M440-160v-304L240-664v104h-80v-240h240v80H296l224 224v336h-80Zm154-376-58-58 128-126H560v-80h240v240h-80v-104L594-536Z"/></svg>',
  chats: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>',
  tickets: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm0-160q17 0 28.5-11.5T520-480q0-17-11.5-28.5T480-520q-17 0-28.5 11.5T440-480q0 17 11.5 28.5T480-440Zm0-160q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm320 440H160q-33 0-56.5-23.5T80-240v-160q33 0 56.5-23.5T160-480q0-33-23.5-56.5T80-560v-160q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v160q-33 0-56.5 23.5T800-480q0 33 23.5 56.5T880-400v160q0 33-23.5 56.5T800-160Zm0-80v-102q-37-22-58.5-58.5T720-480q0-43 21.5-79.5T800-618v-102H160v102q37 22 58.5 58.5T240-480q0 43-21.5 79.5T160-342v102h640ZM480-480Z"/></svg>',
  percentage: '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M300-520q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T360-660q0-25-17.5-42.5T300-720q-25 0-42.5 17.5T240-660q0 25 17.5 42.5T300-600Zm360 440q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T720-300q0-25-17.5-42.5T660-360q-25 0-42.5 17.5T600-300q0 25 17.5 42.5T660-240Zm-444 80-56-56 584-584 56 56-584 584Z"/></svg>',
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Pad with leading zeros for single-digit values
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

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

function descOrderEntriesByValue(arr) {
  return arr.sort((a,b)=>b[1] - a[1])
}

function buildRow(name, amount, unit, index) {
  return `<tr>
      <td>${index !== false ? `${index + 1}. ` : ''}${name}</td>
      <td>${amount} ${unit}</td>
      </tr>`
      // <td>${amount} <small>${unit}</small></td>
}

function updateTable(tableId, content, unit, listLimit) {
  const sortedContent = descOrderEntriesByValue(content).slice(0,listLimit)
  document.querySelector(tableId).innerHTML = sortedContent.map((student, index)=>{
    const [ name, amount ] = student
    return buildRow(name, amount, unit, index)
  }).join('')
}

function addToBookmark(ticket, ticketsDataResponse, currentBatch) {
  const bookmarkedContainer = document.getElementById('bookmarked-container')
  const id = Number(ticket.dataset.id)
  const ticketCopy = ticket.cloneNode(true)
  ticketCopy.querySelector('input').remove()
  ticketCopy.removeAttribute('data-id')
  ticketCopy.id = id
  ticketCopy.addEventListener('click', (e) => {
    ticket.querySelector('input').checked = false
    e.currentTarget.remove()
    const bookmarked = Array.from(bookmarkedContainer.children).map(el=>Number(el.id))
    ticketsDataResponse[currentBatch].bookmarked = bookmarked
    chrome.storage.local.set(ticketsDataResponse)
  })
  bookmarkedContainer.appendChild(ticketCopy)
}

async function loadData(currentBatch) {
  if (!currentBatch) return

  const ticketsDataResponse = await chrome.storage.local.get(currentBatch)
  const { tickets, students, teams } = ticketsDataResponse[currentBatch]
  const bookmarked = ticketsDataResponse[currentBatch].bookmarked || []
  const anyTickets = typeof tickets == 'object' && tickets?.length > 0
  const listLimit = teams ? Object.keys(teams).length : 5
 
  // update heading
  document.title = `Batch #${currentBatch}`
  document.querySelector('h1').innerText = `Batch #${currentBatch}`
  document.querySelector('h2#all-tickets .count').innerText = `(${tickets?.length || 0})`

  if (!anyTickets) return

  ticketsContainer.innerHTML = ''
  let totalDays = 0
  let dayNum = 0
  tickets.forEach((ticket,index)=>{
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
      `<label class="popover" data-id="${index + 1}">
        <input type="checkbox" class="bookmarked" >
        <div class="popover-header">
          ${ticket.title}
        </div>
        <div class="popover-body">
          ${ticket.content.replace('fas fa-heart', 'fa-solid fa-heart')}
        </div>
      </label>`
    )

    tabContent.querySelectorAll('a[href]').forEach(el=>{
      // fixing links
      if (el.href.includes('chrome-extension://')) el.setAttribute('href', el.href.replace(location.origin, `https://kitt.lewagon.com/`))
    })

    title.innerHTML = `<h3>Day ${pad(dayNum, 2)} | ${ticket.dayLecture} (${tabContent.childNodes.length})</h3>`
  })

  // finding longest ticket
  const allTickets = document.querySelectorAll('#tickets-container .popover');
  stats.push(['Ticket Total', allTickets.length])
  const sortedTickets = Array.from(allTickets).sort((a,b)=>{
    const aTime = a.querySelector('.ticket-popover-time').innerHTML
    const bTime = b.querySelector('.ticket-popover-time').innerHTML

    return stringTimeToIntegerSeconds(bTime) - stringTimeToIntegerSeconds(aTime)}
  ).slice(0,listLimit)

  const longestListArr = sortedTickets.map(tkt=>{
    const student = tkt.querySelector(".unstyled-link").textContent.trim()
    const time = tkt.querySelector('.ticket-popover-time').innerHTML.trim()
    totalTicketSeconds += stringTimeToIntegerSeconds(time)
    return [student, time]
  })
  stats.push(['Ticket Total Time', formatTime(totalTicketSeconds)])
  document.querySelector("#longest-list").innerHTML = longestListArr.map((student, index)=>{
    const [ name, amount ] = student
    return buildRow(name, amount, '', index)
  }).join('')

  const longestTicket = sortedTickets[0]
  document.getElementById("longest").insertAdjacentElement('afterbegin', longestTicket.cloneNode(true))

  const picky = {}
  const favorites = {}
  const createdByTA = {}

  allTickets.forEach(ticket=>{
    const id = ticket.dataset.id
    if (bookmarked.includes(Number(id))) {
      ticket.querySelector('input').checked = true
      addToBookmark(ticket, ticketsDataResponse, currentBatch)
    }

    ticket.addEventListener('input', (e)=>{
      const ticketCard = e.currentTarget
      const isBookmarked = !!ticketCard.querySelector('input:checked')

      const id = Number(ticketCard.dataset.id)
      if (isBookmarked) {
        bookmarked.push(id)
        addToBookmark(ticketCard, ticketsDataResponse, currentBatch)
      } else {
        const index = bookmarked.indexOf(id);
        if (index > -1) { // only splice array when item is found
          bookmarked.splice(index, 1); // 2nd parameter means remove one item only
          document.getElementById(id).remove()
        }
      }
      ticketsDataResponse[currentBatch].bookmarked = bookmarked
      chrome.storage.local.set(ticketsDataResponse)
    })

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
  const sortedCreatedByTA = descOrderEntriesByValue(Object.entries(createdByTA))
  sortedCreatedByTA.forEach(teacher=>{
    const [teacherImg, count] = teacher
    document.querySelector('#created').insertAdjacentHTML('beforeend', `<span><img class="favorite-ta" src="${teacherImg}" /><strong>${count}<strong> <small>tickets</small></span>`)
  })

  // favorite
  const sortedFavorites = descOrderEntriesByValue(Object.entries(favorites))
  sortedFavorites.forEach(favorite=>{
    const [favoriteImg,favoriteCount] = favorite
    document.querySelector('#favorite').insertAdjacentHTML('beforeend', `<span><img class="favorite-ta" src="${favoriteImg}" /><strong>${favoriteCount}<strong> <small>tickets</small></span>`)
  })

  // picky
  const arrPicky = Object.entries(picky)
  updateTable("#picky", arrPicky, icons.tickets, listLimit)

  const arrCount = []
  const arrCommits = []
  const arrBranches = []
  const arrFlashcard = []
  const arrWott = []

  for (const student in students) {  
    const { ticketCount, commitCount, branchCount, wottCount, flashcard } = students[student];
    
    arrCount.push([student, ticketCount])
    arrCommits.push([student, commitCount])
    arrBranches.push([student, branchCount])
    arrFlashcard.push([student, flashcard])
    arrWott.push([student, wottCount])
  }
  
  // most Tickets
  const sortedCount = descOrderEntriesByValue(arrCount).slice(0,listLimit)
  document.querySelector("#most").innerHTML = sortedCount.map((student, index)=>{
    const [ name, amount ] = student
    const ticketsPerDay = Math.round(amount / totalDays * 10) / 10
    return buildRow(name, amount, `${icons.tickets} (${ticketsPerDay}/day)`, index)
  }).join('')

  // commits
  updateTable("#commits", arrCommits, icons.commits, listLimit)

  // branches
  updateTable("#branches", arrBranches, icons.branches, listLimit)

  // wott chats
  updateTable("#wott", arrWott, icons.chats, listLimit)

  // flashcard completion
  updateTable("#flashcard", arrFlashcard, icons.percentage, listLimit)
  
  // teams commit
  // const arrTeamsTicket = Object.entries(teams).map(arr=> [arr[0], arr[1].commitCountCount])
  const arrTeams = Object.entries(teams).map(arr=> [arr[0], arr[1].commitCount])
  updateTable("#teams", arrTeams, icons.commits, listLimit)
  
  // teams tickets
  const arrTeamsTicket = Object.entries(teams).map(arr=> [arr[0], arr[1].ticketCount])
  updateTable("#teams-ticket", arrTeamsTicket, icons.tickets, listLimit)

  // stats
  document.querySelector("#stats").innerHTML = stats.map((item)=>{
    const [ name, amount ] = item
    return buildRow(name, amount, '', false)
  }).join('')
}

let { currentBatch } = await chrome.storage.local.get('currentBatch')
const ticketsContainer = document.getElementById('tickets-container')

if (location.search.includes('batch=')) {
  const batch = location.search.match(/\^?batch=(\d+)/)[1];
  currentBatch = batch
}

loadData(currentBatch)



chrome.storage.sync.get('css').then(response=>{
  const { css } = response;
  css.forEach((link)=>{
    const linkEl = document.createElement('link');
    linkEl.setAttribute('href', link);
    linkEl.setAttribute('rel','stylesheet');
    document.head.appendChild(linkEl)
  })
})

const currentBatchResponse = await chrome.storage.local.get('currentBatch')
let currentBatch = currentBatchResponse.currentBatch
const ticketsContainer = document.getElementById('tickets-dashboard')

if (location.search.includes('batch=')) {
  const batch = location.search.match(/\^?batch=(\d+)/)[1];
  currentBatch = batch
}

if (currentBatch) {
  const ticketsDataResponse = await chrome.storage.local.get(currentBatch)
  const ticketsData = ticketsDataResponse[currentBatch]
  const tickets = ticketsData?.tickets

  // update heading
  document.querySelector('h1').innerText = `#${currentBatch} Tickets (${tickets?.length || 0})`

  if (tickets) {
    ticketsContainer.innerHTML = ''
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
  }
}
//   <div class="card">
//     <div class="card-header">
//       <img src="#" alt="">
//       <span class="student">{{stundent}}</span>
//       <span class="time">{{time}}</span>
//     </div>
//     <h2 class="challenge">{{challenge}}</h2>
//     <p class="content">{{content}}</p>
//   </div>


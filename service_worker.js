import {triggerScript, getCurrentTab} from './scripts/helpers.js'

const scripts = ["getAllDays", "setCurrentBatch"]

function validUrl(url) {
  if (!url || typeof url !== 'string') return false

  const blackListedUrls = ['chrome-extension://', 'chrome://']
  const whiteListedUrls = ['kitt.lewagon.com/']
  return !blackListedUrls.some(blacklistedUrl=> url.includes(blacklistedUrl)) && whiteListedUrls.some(whitelistedUrl=> url.includes(whitelistedUrl))
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status != 'complete') return
  if (validUrl(tab?.url)) scripts.forEach(script=>triggerScript(tabId, script))
  
  const currentTab = await getCurrentTab();
  const { collecting, currentBatch } = await chrome.storage.local.get(['collecting', 'currentBatch']);

  if (tab?.url.includes('/day_dashboard') && tabId !== currentTab?.id && collecting) {
    // console.log('Collecting tickets from: ', tabId);
    chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      files: [`scripts/getTickets.js`]
    }).then((response) => {
      // response will be null if something goes wrong on getTickets.js
      // no errors are raised
      // console.log(response)
      const data = response[0]?.result
      const batchTickets = {}
      batchTickets[currentBatch] = data

      if (data && data.tickets) {
        chrome.storage.local.set(batchTickets).then(()=>{
          // console.log("Tickets collected:", data.tickets.length)
          chrome.tabs.remove(tabId)
        })
      }
    })
  }
})

chrome.tabs.onActivated.addListener(async(event)=>{
  const tab = await getCurrentTab()
  if (validUrl(tab?.url)) scripts.forEach(script=>triggerScript(event.tabId, script))
})

chrome.runtime.onConnect.addListener(async function(port) {
  if (port.name === "popup") {
    port.onDisconnect.addListener(function() {
      //  console.log("popup has been closed")
      chrome.storage.local.set({ collecting: false })
    });
  }
});
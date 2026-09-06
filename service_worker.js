import {triggerScript, getCurrentTab} from './scripts/helpers.js'

const scripts = ['getAllDays', 'setCurrentBatch']

function validUrl(url) {
  if (!url || typeof url !== 'string') return false

  const blackListedUrls = ['chrome-extension://', 'chrome://']
  const whiteListedUrls = ['kitt.lewagon.com/']
  return !blackListedUrls.some((blacklistedUrl) => url.includes(blacklistedUrl)) && whiteListedUrls.some((whitelistedUrl) => url.includes(whitelistedUrl))
}

async function runContentScripts(tabId, scriptsToRun) {
  const results = []
  for (const script of scriptsToRun) {
    try {
      const response = await triggerScript(tabId, script)
      results.push(response)
    } catch (err) {
      // Keep going even if one injection fails
      console.warn(`Failed to inject ${script} into tab ${tabId}:`, err)
      results.push(undefined)
    }
  }
  return results
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const storage = {
    get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
    set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  }
  if (changeInfo.status !== 'complete') return
  if (validUrl(tab?.url)) await runContentScripts(tabId, scripts)
  
  const currentTab = await getCurrentTab();
  const { collecting, currentBatch } = await storage.get(['collecting', 'currentBatch']);

  if (tab?.url === `https://kitt.lewagon.com/camps/${currentBatch}`) {
    await runContentScripts(tabId, ['workTime'])

    const data = await storage.get("time")
  } else if (tab?.url.includes('/day_dashboard') && tabId !== currentTab?.id && collecting) {
    // console.log('Collecting tickets from: ', tabId);
    const responses = await runContentScripts(tabId, ['getTickets'])
    const data = responses?.[1]?.[0]?.result
    const batchTickets = { [currentBatch]: data }

    if (data && data.tickets) {
      await storage.set(batchTickets)
    }
    chrome.tabs.remove(tabId)
  } else if (tab?.url.includes('/project_dashboard')) {
    await runContentScripts(tabId, ['getCommits'])
  } else if (tab?.url.includes('/dashboard') && !tab?.url.includes('/users')) {
    await runContentScripts(tabId, ['getWottChats'])
  }
})

chrome.tabs.onActivated.addListener(async (event) => {
  const tab = await getCurrentTab()
  if (validUrl(tab?.url)) await runContentScripts(event.tabId, scripts)
})

chrome.runtime.onConnect.addListener(async function(port) {
  const storage = {
    get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
    set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  }
  if (port.name === "popup") {
    port.onDisconnect.addListener(function() {
      //  console.log("popup has been closed")
      storage.set({ collecting: false })
    });
  }
});
import {triggerScript, getCurrentTab} from './scripts/helpers.js'

const scripts = ['storage', 'getAllDays', 'setCurrentBatch']

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
  if (changeInfo.status !== 'complete') return
  if (validUrl(tab?.url)) await runContentScripts(tabId, scripts)
  
  const currentTab = await getCurrentTab();
  const { collecting, currentBatch } = await chrome.storage.local.get(['collecting', 'currentBatch']);

  if (tab?.url.includes('/day_dashboard') && tabId !== currentTab?.id && collecting) {
    // console.log('Collecting tickets from: ', tabId);
    const responses = await runContentScripts(tabId, ['storage', 'getTickets'])
    const data = responses?.[1]?.[0]?.result
    const batchTickets = { [currentBatch]: data }

    if (data && data.tickets) {
      await chrome.storage.local.set(batchTickets)
      chrome.tabs.remove(tabId)
    }
  } else if (tab?.url.includes('/project_dashboard')) {
    await runContentScripts(tabId, ['storage', 'getCommits'])
  } else if (tab?.url.includes('/dashboard') && !tab?.url.includes('/users')) {
    await runContentScripts(tabId, ['storage', 'getWottChats'])
  }
})

chrome.tabs.onActivated.addListener(async (event) => {
  const tab = await getCurrentTab()
  if (validUrl(tab?.url)) await runContentScripts(event.tabId, scripts)
})

chrome.runtime.onConnect.addListener(async function(port) {
  if (port.name === "popup") {
    port.onDisconnect.addListener(function() {
      //  console.log("popup has been closed")
      chrome.storage.local.set({ collecting: false })
    });
  }
});
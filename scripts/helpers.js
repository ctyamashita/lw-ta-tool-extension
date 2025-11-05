export function triggerScript(tabId, jsFile) {
  chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      files: [`scripts/${jsFile}.js`]
  });
}

export async function getCurrentTab() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

export async function getLeWagonTab() {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  if (tabs.length == 0) return;
  
  const match = tabs.filter((tab)=>{ 
    return tab.url.includes('kitt.lewagon.com')
  });
  return match[0]
}
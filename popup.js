import { triggerScript, getCurrentTab, getLeWagonTab, timestamp } from './scripts/helpers.js'

chrome.runtime.connect({ name: "popup" })

const getTicketsBtn = document.getElementById('getTickets');
const clearTicketsBtn = document.getElementById('clearTickets');
const ticketsIndexBtn = document.getElementById('ticketsIndex');

function updateStatus(urlsMissing, urlsDone) {
    if (urlsMissing == 0) {
        // hiding collect btn
        getTicketsBtn.setAttribute('style', 'display: none')
        document.getElementById('collectionStatus').innerText = 'Tickets collection up to date'
    } else if (urlsDone == 0) {
        // hiding tickets and clear btn
        [ticketsIndexBtn, clearTicketsBtn].forEach(btn=>btn.setAttribute('style', 'display: none'))
    } else {
        document.getElementById('collectionStatus').innerText = `Missing ${urlsMissing} days`
    }
}

async function listenClick() {
    const leWagonTab = await getLeWagonTab()
    if (!leWagonTab) {
        window.close()
        return alert('Please have at least one tab opened and logged on Kitt')
    }

    chrome.storage.local.get('currentBatch').then(async (currentBatchResponse) => {
        const { currentBatch } = currentBatchResponse
        document.getElementById('currentBatch').innerText = `Batch #${currentBatch}`
        const { onDuty } = await chrome.storage.sync.get('onDuty')
        if (onDuty) document.getElementById('onDuty').classList.add('on')

        const progressEl = document.getElementById('progress');
        const progressBarEl = document.getElementById('progress-bar');
        const collectionStatus = document.getElementById('collectionStatus')
        chrome.storage.local.get(currentBatch).then(async (batchDataResponse) => {
            let urls = batchDataResponse[currentBatch]?.urls || [];
            let urlsDone = batchDataResponse[currentBatch]?.urlsDone || [];
            let urlsMissing = urls.length - urlsDone.length

            if (urlsMissing == 0) {
                // hiding collect btn
                getTicketsBtn.setAttribute('style', 'display: none')
                document.getElementById('collectionStatus').innerText = 'Tickets collection up to date'
            } else if (urlsDone == 0) {
                // hiding tickets and clear btn
                [ticketsIndexBtn, clearTicketsBtn].forEach(btn=>btn.setAttribute('style', 'display: none'))
            } else {
                document.getElementById('collectionStatus').innerText = `Missing ${urlsMissing} days`
            }

            const { lastTimeFetched } = await chrome.storage.local.get('lastTimeFetched')
            const currentTime = timestamp()
            const newDay = currentTime != lastTimeFetched
            if (urls.length == 0 || newDay) {
                alert('Updating past ticket days')
                chrome.storage.local.set({lastTimeFetched: currentTime, collecting: true}).then(async()=>{
                    const statisticsTab = await chrome.tabs.create({ url: `https://kitt.lewagon.com/camps/${currentBatch}/tickets/day_dashboard?path=00-Setup`, active: false })
                    chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
                        if (statisticsTab.id == tabId) {
                            // remove tab after completion
                            chrome.storage.local.set({collecting: false})
                            const updatedResponse = await chrome.storage.local.get(currentBatch)
                            urls = updatedResponse[currentBatch]?.urls
                            urlsDone = updatedResponse[currentBatch]?.urlsDone
                            urlsMissing = urls.length - urlsDone.length

                            if (urlsMissing == 0) {
                                // hiding collect btn
                                getTicketsBtn.setAttribute('style', 'display: none')
                                document.getElementById('collectionStatus').innerText = 'Tickets collection up to date'
                            } else if (urlsDone == 0) {
                                // hiding tickets and clear btn
                                [ticketsIndexBtn, clearTicketsBtn].forEach(btn=>btn.setAttribute('style', 'display: none'))
                            } else {
                                document.getElementById('collectionStatus').innerText = `Missing ${urlsMissing} days`
                            }
                        }
                    })
                })
            }

            getTicketsBtn.addEventListener('click', () => {
                if (urls.length == 0) {
                    alert("Urls collection required. Try again after the page is loaded.")
                    chrome.tabs.create({ url: `https://kitt.lewagon.com/camps/${currentBatch}/tickets/day_dashboard?path=00-Setup`, active: true })
                } else {
                    alert("Don't change tabs or close the extension popup until it's finished")
                    getTicketsBtn.setAttribute('disabled', true)
                    // reset
                    chrome.storage.local.set({ collecting: true })
                    const total = urls?.length
                    let progress = 0
                    let i = 0
                    urls.forEach((url, index) => {
                        if (!urlsDone.includes(url)) {
                            setTimeout(() => {
                                urlsDone.push(url)
                                chrome.tabs.create({ url: url, active: false })
                                progress = ((index + 1) * 100) / total
                                progressEl.dataset.progress = `${Math.round(progress)}% (${index + 1}/${total})`
                                progressBarEl.setAttribute('style', `width: ${Math.round(progress)}%`)
                                const dayTitle = decodeURIComponent(url.match(/path=([^&]+)/)[1])
                                collectionStatus.innerText = dayTitle
                                // console.log(`Progress: ${Math.round(progress)}%`)
                                if (progress == 100) {
                                    getTicketsBtn.removeAttribute('disabled')
                                    progressBarEl.classList.add('completed')
                                    setTimeout(() => {
                                        chrome.storage.local.set({ collecting: false })
                                        chrome.tabs.create({ url: "tickets.html" })
                                    }, 2000);
                                }
                            }, (2000 * i));
                            i++
                        }
                    })
                }
            })
        })

        
        clearTicketsBtn.addEventListener('click', () => {
            if (confirm("Are you sure?") == true) {
                triggerScript(leWagonTab.id, 'clearTickets')
                alert(`Cleared all tickets from #${currentBatch}`)
            }
        })
    })

    ticketsIndexBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: "tickets.html" })
    })

    // toggles
    const options = document.querySelectorAll('#optionsForm input')

    options.forEach(optionEl => {
        const id = optionEl.id

        chrome.storage.sync.get(id).then((result) => {
            // update checkbox
            optionEl.checked = result[id];
        })
    })

    const wottCheckbox = document.getElementById('hideWott')
    const autoOnAfterBreakCheckbox = document.getElementById('autoOnAfterBreak')

    chrome.storage.sync.get(["hideWott", "autoOnAfterBreak"]).then((result) => {
        // update checkbox
        wottCheckbox.checked = result.hideWott;
        autoOnAfterBreakCheckbox.checked = result.autoOnAfterBreak;
    })

    wottCheckbox.addEventListener('change', (e) => {
        chrome.storage.sync.get(["hideWott"]).then(async (result) => {
            chrome.storage.sync.set({ hideWott: !result.hideWott })
            triggerScript(leWagonTab.id, 'hideWott')
        })
    })

    autoOnAfterBreakCheckbox.addEventListener('change', () => {
        chrome.storage.sync.get(["autoOnAfterBreak"]).then(async (result) => {
            const tab = await getCurrentTab()
            chrome.storage.sync.set({ autoOnAfterBreak: !result.autoOnAfterBreak })
            triggerScript(leWagonTab.id, 'autoOnAfterBreak')
        })
    })


}

listenClick();
import { triggerScript, getCurrentTab, getLeWagonTab } from './scripts/helpers.js'

chrome.runtime.connect({ name: "popup" })

async function listenClick() {
    const leWagonTab = await getLeWagonTab()
    if (!leWagonTab) {
        window.close()
        return alert('Please have at least one tab opened and logged on Kitt')
    }

    chrome.storage.local.get('currentBatch').then(currentBatchResponse => {
        const { currentBatch } = currentBatchResponse
        document.getElementById('lastCollectionTitle').innerText = `Tickets - Batch #${currentBatch}`

        const getTicketsBtn = document.getElementById('getTickets')
        const progressEl = document.getElementById('progress');
        const progressBarEl = document.getElementById('progress-bar');
        const currentPageCollection = document.getElementById('currentPageCollection')
        chrome.storage.local.get(currentBatch).then((batchDataResponse) => {
            const urls = batchDataResponse[currentBatch]?.urls
            const urlsDone = []

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
                    urls.forEach((url, index) => {
                        if (!urlsDone.includes(url)) {
                            urlsDone.push(url)
                            setTimeout(() => {
                                chrome.tabs.create({ url: url, active: false })
                                progress = ((index + 1) * 100) / total
                                progressEl.dataset.progress = `${Math.round(progress)}% (${index + 1}/${total})`
                                progressBarEl.setAttribute('style', `width: ${Math.round(progress)}%`)
                                const dayTitle = decodeURIComponent(url.match(/path=([^&]+)/)[1])
                                currentPageCollection.innerText = dayTitle
                                // console.log(`Progress: ${Math.round(progress)}%`)
                                if (progress == 100) {
                                    getTicketsBtn.removeAttribute('disabled')
                                    progressBarEl.classList.add('completed')
                                    setTimeout(() => {
                                        chrome.storage.local.set({ collecting: false })
                                        chrome.tabs.create({ url: "tickets.html" })
                                    }, 2000);
                                }
                            }, (2000 * index));
                        }
                    })
                }
            })
        })

        const clearTicketsBtn = document.getElementById('clearTickets');
        clearTicketsBtn.addEventListener('click', () => {
            if (confirm("Are you sure?") == true) {
                triggerScript(leWagonTab.id, 'clearTickets')
                alert(`Cleared all tickets from #${currentBatch}`)
            }
        })
    })

    const ticketsIndexBtn = document.getElementById('ticketsIndex')
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
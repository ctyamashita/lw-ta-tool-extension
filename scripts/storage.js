// A tiny wrapper around chrome.storage.local to provide Promise-based access.
// This file is intended to be injected before other scripts so they can safely
// call `storage.get(...)` and `storage.set(...)`.

/* global chrome */

;(function () {
  if (window.storage) return

  function wrapChromeStorageApi(method) {
    return (keysOrItems) =>
      new Promise((resolve, reject) => {
        chrome.storage.local[method](keysOrItems, (result) => {
          const err = chrome.runtime.lastError
          if (err) return reject(err)
          resolve(result)
        })
      })
  }

  const storage = {
    get: wrapChromeStorageApi('get'),
    set: wrapChromeStorageApi('set'),
    async getBatch(batchKey) {
      if (!batchKey) return undefined
      const result = await this.get(batchKey)
      return result ? result[batchKey] : undefined
    },
    setBatch(batchKey, batchData) {
      if (!batchKey) return Promise.resolve()
      return this.set({ [batchKey]: batchData })
    },
  }

  window.storage = storage
})()

async function copyCSS() {
  const { css } = await chrome.storage.sync.get("css")
  if (!css) {
    const stylesheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).map(el=>el.href);
    if (css !== stylesheets) chrome.storage.sync.set({css: stylesheets})
  }
}

copyCSS()
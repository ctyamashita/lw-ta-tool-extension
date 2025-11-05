function copyCSS() {
  const stylesheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).map(el=>el.href);
  chrome.storage.sync.set({css: stylesheets})
}

copyCSS()
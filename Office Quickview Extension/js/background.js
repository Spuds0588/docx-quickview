// js/background.js

// This helper function was missing from the previous "complete" file. This was the bug.
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return self.btoa(binary);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handles the request to fetch the binary file data
    if (message.type === 'fetchFile') {
        (async () => {
            try {
                const response = await fetch(message.url);
                if (!response.ok) { throw new Error(`Fetch failed: ${response.statusText}`); }
                const arrayBuffer = await response.arrayBuffer();
                const base64 = arrayBufferToBase64(arrayBuffer);
                sendResponse({ success: true, base64: base64 });
            } catch (e) {
                console.error('[QuickView Background] Fetch error:', e);
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true; // Indicates that the response is asynchronous
    }

    // Handles the request from the viewer page to get the correct file URL
    if (message.type === 'getViewerUrl') {
        const storageKey = `tab_${sender.tab.id}`;
        chrome.storage.session.get(storageKey, (result) => {
            if (result[storageKey]) {
                sendResponse({ url: result[storageKey] });
                chrome.storage.session.remove(storageKey);
            } else {
                sendResponse({ error: 'No URL found in session storage.' });
            }
        });
        return true; // Indicates that the response is asynchronous
    }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    // Match only .docx files
    const isDocx = details.url.match(/\.(docx|DOCX)$/);
    if (details.frameId === 0 && isDocx) {
        const storageKey = `tab_${details.tabId}`;
        chrome.storage.session.set({ [storageKey]: details.url });
        console.log(`[QuickView] Stored URL for tab ${details.tabId}: ${details.url}`);
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
            if (!isAllowed) {
                chrome.tabs.create({ url: 'help.html' });
            }
        });
    }
});
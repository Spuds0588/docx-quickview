// js/background.js

// Helper function to convert ArrayBuffer to Base64
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
    if (message.type === 'fetchFile') {
        (async () => {
            try {
                const response = await fetch(message.url);
                const arrayBuffer = await response.arrayBuffer();
                
                // NEW: Encode the buffer to a Base64 string before sending
                const base64 = arrayBufferToBase64(arrayBuffer);
                
                sendResponse({ success: true, base64: base64 });

            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true; // async
    }

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
        return true; // async
    }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    const isDocx = details.url.match(/\.(docx|DOCX)$/);
    if (details.frameId === 0 && isDocx) {
        const storageKey = `tab_${details.tabId}`;
        chrome.storage.session.set({ [storageKey]: details.url });
    }
});
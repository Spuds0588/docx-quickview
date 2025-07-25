// js/background.js

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return self.btoa(binary);
}

// The onMessage listener no longer needs 'getViewerUrl'
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
        return true;
    }
});

// NEW REDIRECTION LOGIC:
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    // Only act on main frame navigations to .docx files
    if (details.frameId !== 0) return;
    
    const isDocx = details.url.match(/\.(docx|DOCX)$/);
    if (!isDocx) return;

    // Don't act on URLs that are already pointing to our viewer.
    // This prevents an infinite redirect loop if the user reloads the viewer page.
    if (details.url.includes(chrome.runtime.id)) return;

    // Construct the new URL for our viewer, with the file path as a parameter.
    const viewerUrl = chrome.runtime.getURL('viewer.html');
    const newUrl = `${viewerUrl}?file=${encodeURIComponent(details.url)}`;
    
    // Update the tab to navigate to our viewer page.
    // This happens instead of the original navigation.
    chrome.tabs.update(details.tabId, { url: newUrl });
    
}, { url: [{ schemes: ['file'] }] }); // Only listen for file URLs

// The onInstalled listener remains the same
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
            if (!isAllowed) {
                chrome.tabs.create({ url: 'help.html' });
            }
        });
    }
});
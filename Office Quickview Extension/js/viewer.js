// js/viewer.js

// Helper function to convert Base64 back to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary_string = self.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

(async function() {
    const response = await chrome.runtime.sendMessage({ type: 'getViewerUrl' });
    if (!response || !response.url) {
        displayError(response.error || 'No file URL was provided.');
        return;
    }
    
    const fileUrl = response.url;
    document.title = decodeURI(fileUrl.split('/').pop());

    try {
        const fileResponse = await chrome.runtime.sendMessage({ type: 'fetchFile', url: fileUrl });
        if (!fileResponse.success) {
            throw new Error(fileResponse.error || 'File could not be fetched.');
        }

        // NEW: Decode the Base64 string back into an ArrayBuffer
        const arrayBuffer = base64ToArrayBuffer(fileResponse.base64);

        // Render the DOCX from the restored ArrayBuffer
        await renderDocx(arrayBuffer);
        
        document.getElementById('qview-loading').style.display = 'none';

    } catch (error) {
        console.error('[Office QuickView] Error rendering file:', error);
        displayError(`Could not render this file. (${error.message})`);
    }
})();

async function renderDocx(buffer) {
    // This function is now correct and does not need to change.
    // It receives a valid buffer.
    const mammothOptions = {
        arrayBuffer: buffer
    };
    
    const result = await mammoth.convertToHtml(mammothOptions);
    
    const renderContainer = document.createElement('div');
    renderContainer.id = 'qview-container';
    renderContainer.innerHTML = result.value;
    document.body.appendChild(renderContainer);
    
    if (result.messages && result.messages.length > 0) {
        console.warn('[Office QuickView] Mammoth.js messages:', result.messages);
    }
}

function displayError(message) {
    const loadingDiv = document.getElementById('qview-loading');
    if (loadingDiv) {
        loadingDiv.innerText = `Error: ${message}`;
        loadingDiv.style.color = 'red';
    }
}
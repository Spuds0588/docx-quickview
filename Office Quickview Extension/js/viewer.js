// js/viewer.js

// Store buffer and filename globally for reuse in save functions
let currentDocBuffer = null;
let currentFilename = 'document';

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
        displayError(response.error === 'No URL found in session storage.' ? 'This page is for viewing local files. Please open a .docx file from your computer.' : 'An unknown error occurred.');
        return;
    }
    
    const fileUrl = response.url;
    currentFilename = decodeURI(fileUrl.split('/').pop());
    document.title = currentFilename;

    setupHeader(currentFilename);

    try {
        const fileResponse = await chrome.runtime.sendMessage({ type: 'fetchFile', url: fileUrl });
        if (!fileResponse.success) { throw new Error(fileResponse.error || 'File could not be fetched.'); }

        currentDocBuffer = base64ToArrayBuffer(fileResponse.base64);
        await renderDocx(currentDocBuffer);
        
        document.getElementById('qview-loading').style.display = 'none';
    } catch (error) {
        console.error('[Docx QuickView] Error rendering file:', error);
        displayError(`Could not render this file. (${error.message})`);
    }
})();

function setupHeader(filename) {
    const header = document.createElement('div');
    header.id = 'qview-header';
    
    const filenameP = document.createElement('p');
    filenameP.id = 'qview-filename';
    filenameP.textContent = filename;

    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'qview-actions';

    const savePdfButton = document.createElement('button');
    savePdfButton.className = 'qview-button';
    savePdfButton.textContent = 'Save as PDF';
    savePdfButton.onclick = handleSaveAsPdf;

    const saveHtmlButton = document.createElement('button');
    saveHtmlButton.className = 'qview-button';
    saveHtmlButton.textContent = 'Save as HTML';
    saveHtmlButton.onclick = handleSaveAsHtml;

    actionsDiv.appendChild(saveHtmlButton);
    actionsDiv.appendChild(savePdfButton);

    header.appendChild(filenameP);
    header.appendChild(actionsDiv);
    document.body.appendChild(header);
}

function handleSaveAsPdf() {
    const header = document.getElementById('qview-header');
    header.style.display = 'none';
    window.print();
    header.style.display = 'grid';
}

// UPDATED: Now fetches and embeds CSS for a self-contained file
async function handleSaveAsHtml() {
    if (!currentDocBuffer) return;

    try {
        // 1. Fetch the extension's CSS stylesheet
        const cssResponse = await fetch(chrome.runtime.getURL('css/main.css'));
        if (!cssResponse.ok) throw new Error('Could not fetch stylesheet.');
        let cssText = await cssResponse.text();
        
        // Minor tweak: Make the body white in the saved file for a cleaner look
        cssText += `\nbody { background-color: #fff; }`;

        // 2. Set Mammoth.js options to embed images as Base64 data
        const mammothOptions = {
            convertImage: mammoth.images.inline(element => {
                return element.read("base64").then(image_base64 => {
                    return { src: "data:" + element.contentType + ";base64," + image_base64 };
                });
            })
        };
    
        const result = await mammoth.convertToHtml({ arrayBuffer: currentDocBuffer }, mammothOptions);

        // 3. Construct the full HTML content with embedded styles
        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${currentFilename}</title>
                    <style>
                        ${cssText}
                    </style>
                </head>
                <body>
                    <div id="qview-container">
                        ${result.value}
                    </div>
                </body>
            </html>`;
            
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = currentFilename.replace(/\.docx?$/, '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch(e) {
        console.error("Failed to save HTML:", e);
        alert("Sorry, there was an error creating the HTML file.");
    }
}

async function renderDocx(buffer) {
    const mammothOptions = { arrayBuffer: buffer };
    
    const result = await mammoth.convertToHtml(mammothOptions);
    const renderContainer = document.createElement('div');
    renderContainer.id = 'qview-container';
    renderContainer.innerHTML = result.value;
    document.body.appendChild(renderContainer);
    
    if (result.messages && result.messages.length > 0) {
        console.warn('[Docx QuickView] Mammoth.js messages:', result.messages);
    }
}

function displayError(message) {
    const loadingDiv = document.getElementById('qview-loading');
    if (loadingDiv) {
        loadingDiv.innerText = `Error: ${message}`;
        loadingDiv.style.color = 'red';
    }
}
// js/viewer.js

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
    await applyTheme();

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
    
    const themeButton = document.createElement('button');
    themeButton.className = 'qview-button';
    themeButton.id = 'theme-toggle';
    themeButton.textContent = 'Toggle Theme';
    themeButton.onclick = handleThemeToggle;

    const savePdfButton = document.createElement('button');
    savePdfButton.className = 'qview-button';
    savePdfButton.textContent = 'Save as PDF';
    savePdfButton.onclick = handleSaveAsPdf;

    const saveHtmlButton = document.createElement('button');
    saveHtmlButton.className = 'qview-button';
    saveHtmlButton.textContent = 'Save as HTML';
    saveHtmlButton.onclick = handleSaveAsHtml;

    actionsDiv.appendChild(themeButton);
    actionsDiv.appendChild(saveHtmlButton);
    actionsDiv.appendChild(savePdfButton); // CORRECTED: This line is now present.

    header.appendChild(filenameP);
    header.appendChild(actionsDiv);
    document.body.prepend(header);
}

async function applyTheme() {
    const result = await chrome.storage.local.get('theme');
    const theme = result.theme || 'system';
    
    document.body.classList.remove('theme-light', 'theme-dark');
    const themeButton = document.getElementById('theme-toggle');

    if (theme === 'light') {
        document.body.classList.add('theme-light');
        if (themeButton) themeButton.textContent = "Theme: Light";
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        if (themeButton) themeButton.textContent = "Theme: Dark";
    } else {
        if (themeButton) themeButton.textContent = "Theme: System";
    }
}

async function handleThemeToggle() {
    const result = await chrome.storage.local.get('theme');
    let currentTheme = result.theme || 'system';
    let newTheme = 'dark';
    if (currentTheme === 'dark') newTheme = 'light';
    else if (currentTheme === 'light') newTheme = 'system';
    await chrome.storage.local.set({ theme: newTheme });
    applyTheme();
}

function handleSaveAsPdf() {
    const header = document.getElementById('qview-header');
    header.style.display = 'none';
    window.print();
    header.style.display = 'grid';
}

async function handleSaveAsHtml() {
    if (!currentDocBuffer) return;

    const interactiveScript = `
        function applyThemeFromStorage() {
            const theme = localStorage.getItem('theme') || 'system';
            const body = document.body;
            const button = document.getElementById('theme-toggle');
            body.classList.remove('theme-light', 'theme-dark');

            if (theme === 'light') {
                body.classList.add('theme-light');
                if (button) button.textContent = "Theme: Light";
            } else if (theme === 'dark') {
                body.classList.add('theme-dark');
                if (button) button.textContent = "Theme: Dark";
            } else {
                if (button) button.textContent = "Theme: System";
            }
        }
        function toggleTheme() {
            let currentTheme = localStorage.getItem('theme') || 'system';
            let newTheme = 'dark';
            if (currentTheme === 'dark') newTheme = 'light';
            else if (currentTheme === 'light') newTheme = 'system';
            localStorage.setItem('theme', newTheme);
            applyThemeFromStorage();
        }
        document.addEventListener('DOMContentLoaded', () => {
            applyThemeFromStorage();
            document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        });
    `;

    try {
        const cssResponse = await fetch(chrome.runtime.getURL('css/main.css'));
        if (!cssResponse.ok) throw new Error('Could not fetch stylesheet.');
        const cssText = await cssResponse.text();
        
        const mammothOptions = {
            convertImage: mammoth.images.inline(element => element.read("base64").then(image_base64 => ({ src: "data:" + element.contentType + ";base64," + image_base64 }))),
            styleMap: [ "p[style-name='Title'] => h1:fresh", "p[style-name='Heading 1'] => h1:fresh", "b => strong", "i => em" ]
        };
        
        const result = await mammoth.convertToHtml({ arrayBuffer: currentDocBuffer }, mammothOptions);

        // CORRECTED: The bad body style is removed, and the script is correctly formatted.
        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${currentFilename}</title>
                    <style>${cssText}</style>
                </head>
                <body>
                    <div id="qview-header">
                        <p id="qview-filename">${currentFilename}</p>
                        <div id="qview-actions">
                            <button class="qview-button" id="theme-toggle">Theme: System</button>
                        </div>
                    </div>
                    <div id="qview-container">
                        ${result.value}
                    </div>
                    <script>${interactiveScript}<\/script>
                </body>
            </html>`;
            
        const blob = new Blob([htmlContent.trim()], { type: 'text/html' });
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
    const mammothOptions = {
        arrayBuffer: buffer,
        styleMap: [ "p[style-name='Title'] => h1:fresh", "p[style-name='Heading 1'] => h1:fresh", "b => strong", "i => em" ]
    };
    
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
# Docx QuickView

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Instantly view local `.docx` files in your browser. Docx QuickView transforms Google Chrome into a lightning-fast, lightweight viewer for Microsoft Word documents, so you can stop waiting for heavy applications to load just to read a file.

The core philosophy is speed and simplicity. Double-click a `.docx` file on your computer, and it opens immediately in a new tab.

## The Problem

When you double-click a local Word document, your operating system launches a heavy, slow-to-load application like Microsoft Word or Apple Pages. This process is slow and context-breaking, especially when you just need to quickly reference or read the content. Your browser, which is almost always open, is a much faster environment for simply *viewing* documents.

## Key Features

*   ✅ **Instant Viewing:** Opens `.docx` files from your local filesystem directly in a new Chrome tab.
*   ✅ **Blazing Fast:** Bypasses slow application launch times. Go from double-click to reading in a fraction of a second.
*   ✅ **Light & Dark Themes:** Automatically detects your system's color scheme for comfortable reading. Includes a manual toggle button (System / Dark / Light) to override the theme.
*   ✅ **Save as PDF:** A one-click button to save the document as a clean, universally compatible PDF file using the browser's native print-to-PDF functionality.
*   ✅ **Save as Self-Contained HTML:** Exports the document as a single, portable `.html` file with all images and styles embedded. The saved file even includes the interactive theme-toggling functionality.
*   ✅ **Bookmarkable URLs:** Each viewed document gets a unique URL (`.../viewer.html?file=...`) so you can bookmark, save, and share links directly to your local files.
*   ✅ **Secure & Private:** All file processing happens entirely on your machine. Your documents are never uploaded to any server.

## Installation

### From the Chrome Web Store (Recommended)

**[Link to be added here once approved]** - Coming soon!

### From Source (for developers)

If you wish to load the extension manually from the source code:

1.  **Download:** Download this repository as a ZIP file and unzip it to a permanent location on your computer (e.g., `C:\Users\YourName\Documents\ChromeExtensions\DocxQuickView`).
2.  **Open Chrome Extensions:** Open Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** In the top-right corner of the extensions page, turn on the "Developer mode" toggle.
4.  **Load the Extension:** Click the "Load unpacked" button that appears.
5.  **Select the Folder:** In the file dialog, select the unzipped folder (e.g., the `DocxQuickView` folder) and click "Select Folder".

The extension is now installed.

## Getting Started: One-Time Setup

To make the experience seamless, you need to complete two one-time setup steps.

### 1. Grant File Access

The first time you install the extension, a `help.html` page should open automatically. If not, follow these steps:
1.  Go to `chrome://extensions`.
2.  Find "Docx QuickView" and click "Details".
3.  Scroll down and turn on the toggle for **"Allow access to file URLs"**. This is required for the extension to read your local files.

### 2. Set Chrome as the Default Viewer

This allows you to just double-click a `.docx` file to open it.

**On Windows:**
1.  Right-click on any `.docx` file.
2.  Select "Open with" > "Choose another app".
3.  Select "Google Chrome" from the list.
4.  Check the box that says **"Always use this app to open .docx files"** and click "OK".

**On macOS:**
1.  Right-click on any `.docx` file.
2.  Select "Get Info".
3.  In the "Open with:" section, select "Google Chrome" from the dropdown menu.
4.  Click the **"Change All..."** button to make this the default for all `.docx` files.

That's it! Now, any time you double-click a `.docx` file, it will open instantly in a new Chrome tab.

## Development

This extension is built with standard HTML, CSS, and JavaScript, with no build process required.
*   The core document conversion is powered by [**Mammoth.js**](https://github.com/mwilliamson/mammoth.js).
*   The redirection logic is handled in `background.js`.
*   The rendering and UI logic is in `viewer.js` and `main.css`.

---

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 The Docx QuickView Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

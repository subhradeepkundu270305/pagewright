<div align="center">

# ✦ Pagewright

### Turn Any Webpage into Publication-Grade PDFs in One Click
*True vector fidelity, clutter-free readability, 60fps fluid motion, and pluggable local-first AI intelligence.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](manifest.json)
[![Tests Passing](https://img.shields.io/badge/Tests-74%2F74_Passing-34D399?style=flat-square&logo=vitest&logoColor=white)](src/__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](vite.config.ts)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](tailwind.config.ts)
[![Release](https://img.shields.io/badge/Release-v1.0.0-8B5CF6?style=flat-square)](https://github.com/subhradeepkundu270305/pagewright/releases)

<br />

[**Key Features**](#-key-features) • [**Chrome Installation Guide**](#-installation-guide-chrome) • [**How to Use**](#-how-to-use) • [**AI Intelligence**](#-ai-intelligence-setup) • [**Design System**](#-midnight-ink-design-system) • [**Releasing**](#-releasing--packaging) • [**Architecture**](#-architecture)

</div>

---

## 💡 Why Pagewright?

Standard browser "Print to PDF" was designed decades ago for physical printers:
- ❌ Pages are cluttered with floating cookie banners, sticky headers, popups, and intrusive ads.
- ❌ Lazy-loaded images and dynamic charts appear as blank white rectangles.
- ❌ Multi-column layouts break awkwardly across page splits.
- ❌ Most online PDF tools send your private browsing data and documents to remote third-party servers.

**Pagewright completely reimagines web-to-PDF generation:**
- ✅ **100% Vector PDF Output**: Powered by the Chrome DevTools Protocol (`Page.printToPDF`). Your PDFs have crisp, selectable text, active hyperlinks, sharp vector graphics, and high-DPI images. **Never a blurry screenshot**.
- ✅ **Intelligent DOM Sanitization**: Automatically strips cookie overlays (OneTrust, Cookiebot, Didomi), sticky banners, social widgets, and ad frames while preserving substantive content.
- ✅ **Zero Remote Dependencies & Private**: Every operation runs entirely on your local machine. No telemetry, no cloud servers, no tracking.
- ✅ **Pluggable Local & Cloud AI**: Generate study guides, executive summaries, smart titles, and dynamic tables of contents via Groq Cloud, on-device Chrome AI, or local Ollama.

---

## ⚡ Key Features

| Feature | Description |
|---|---|
| **🌐 Full Page Mode** | Captures the entire document, resolves lazy images, neutralizes height/overflow constraints, and prints complete continuous layouts without cutoff pages. |
| **📖 Reader Mode** | Powered by Mozilla Readability. Extracts the core article and renders it with distraction-free typography (**Clean Serif**, **Modern Sans**, or **Minimalist**). |
| **🎯 Selected Content Mode** | Includes an interactive **Shadow DOM Element Inspector**: hover over elements on any live webpage, preview bounding boxes, and click to extract and convert exact subtrees. |
| **📚 AI Study Guide Mode** | Automatically analyzes webpage content to produce a comprehensive academic briefing with Key Concepts, Executive Summary, Core Takeaways, and Self-Study Quiz questions. |
| **✨ Smart AI Enhancements** | Additive AI toggles for standard modes: auto-generate an Executive Summary card, Smart Table of Contents (with heading-based fallback), and clean sanitized titles. |
| **🖼️ Offline Image Inlining** | Eagerly loads lazy images and inlines them into base64 data URIs via temporary canvas rendering, making images 100% immune to CORS, referrer checks, or CDN blocking. |
| **👁️ Interactive PDF Preview** | Open and inspect your PDF inside an integrated browser viewer tab before saving to disk. |
| **⚙️ Deep Formatting Controls** | Toggle Paper Size (A4 / Letter), Orientation (Portrait / Landscape), Margins (Narrow, Normal, Wide), Zoom Scale, Page Numbers, Headers, and Footers. |

---

## 📦 Installation Guide (Chrome)

Pagewright is built as a standard **Manifest V3** Chrome extension. You can install it in Google Chrome, Brave, Arc, Microsoft Edge, or any Chromium-based browser in less than 60 seconds.

### Method 1: Install from Pre-built Release Zip (Fastest)

1. **Download the Release**:
   - Go to [**Pagewright Releases**](https://github.com/subhradeepkundu270305/pagewright/releases).
   - Download the latest `pagewright-v1.0.0.zip` file.
2. **Unpack the Zip**:
   - Extract `pagewright-v1.0.0.zip` to a folder on your computer (e.g., `~/Documents/Pagewright`).
3. **Open Chrome Extensions Manager**:
   - In Google Chrome, open a new tab and navigate to:
     ```
     chrome://extensions
     ```
4. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.
5. **Load the Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the folder containing the extracted files (the folder containing `manifest.json`).
6. **Pin to Toolbar**:
   - Click the **Extensions puzzle icon** (🧩) on the top-right of your Chrome toolbar.
   - Click the **Pin** icon next to **Pagewright** for one-click access anytime!

---

### Method 2: Build From Source (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/subhradeepkundu270305/pagewright.git
cd pagewright

# 2. Install dependencies
npm install

# 3. Run automated tests to verify your environment
npm test

# 4. Build the production distribution
npm run build
```

Now load the `dist/` directory:
1. Open `chrome://extensions` in Chrome.
2. Ensure **Developer mode** is enabled.
3. Click **Load unpacked** and select the `dist/` directory inside your cloned `pagewright` repository.

> **Tip for Developers**: When making changes during development, run `npm run dev`. After rebuilding with `npm run build`, simply click the circular **Reload (🔄)** button on the Pagewright card in `chrome://extensions`.

---

## 🚀 How to Use

1. **Open Any Webpage**: Navigate to any article, documentation page, news story, or recipe you want to save.
2. **Launch Pagewright**: Click the Pagewright icon in your Chrome toolbar (or press <kbd>Alt</kbd>+<kbd>P</kbd>).
3. **Select Your Target Mode**:
   - **Full Page** (`WEB`): Complete page preservation with ads, popups, and sticky navigation stripped.
   - **Reader** (`CLEAN`): Clean, centered typography column with choice of Serif, Sans, or Minimal themes.
   - **Selected** (`PICK`): Launch the Element Inspector to click and convert a specific article body, code block, or comment thread.
   - **AI Notes** (`STUDY`): Generate a structured executive summary and study briefing with comprehension quiz.
4. **Configure Quick Settings**:
   - **Images**: Toggle images `ON` or `OFF` to produce ultra-compact text-only documents.
   - **Paper**: One-click toggle between `A4` and `LETTER`.
   - **Preview**: Toggle `Preview ON` to inspect your PDF before downloading, or `Preview OFF` to save immediately.
   - **Clean Ads**: Keep enabled to automatically remove ad banners and cookie consent banners.
5. **Convert**:
   - Click **Convert to PDF** (or press <kbd>Enter</kbd>).
   - Watch the 60fps pipeline indicator track through *Cleaning*, *Formatting*, and *Generating*.
   - When complete, your PDF will download automatically or open in the integrated preview tab!

---

## 🤖 AI Intelligence Setup

Pagewright includes a modular, pluggable AI engine ([`src/ai`](src/ai)) that is **100% optional**. You can choose between ultra-fast cloud AI or completely private, offline, on-device AI:

| Provider | Privacy & Speed | Setup |
|---|---|---|
| **Groq Cloud AI** *(Recommended)* | Extremely fast (500+ tokens/sec). Models: LLaMA 3.3 70B, Qwen 2.5 32B. | Open Extension **Preferences (⚙️)**, select **Groq**, and paste a free API key from [console.groq.com](https://console.groq.com). Stored locally in encrypted browser storage. |
| **Chrome Built-in AI** | 100% local, on-device, and private. Uses Gemini Nano built into Chromium. | Enable Chrome's built-in Prompt API flags in `chrome://flags` (`#prompt-api-for-gemini-nano`). Zero API keys required. |
| **Local Ollama** | 100% local and offline. Connects directly to `localhost:11434`. | Run `ollama run llama3.2` locally. Pagewright connects directly to your local endpoint without internet access. |
| **Disabled** | Pure deterministic conversion. | Default setting. Pagewright uses heading-based fallback algorithms to generate tables of contents with zero AI dependencies. |

---

## 🎨 "Midnight Ink" Design System

Pagewright features a custom design system called **Midnight Ink**, engineered for aesthetic sophistication, razor-sharp clarity, and fluid 60fps performance:

- **Spacious 420px Layout**: Form-fitted 420px width engineered with zero vertical clipping or scrollbars.
- **Concentric Squircle Radii**: System-wide radius token hierarchy (`--radius-xs: 8px` to `--radius-xl: 32px`) with progressive `corner-shape: squircle` enhancement.
- **Sliding Spring Pill**: Squash-and-stretch segmented mode selector with smooth color morphing across modes (Indigo, Violet, Cyan, Purple).
- **Subpixel Parallax (No 3D Blur)**: Replaces blurry Chromium 3D perspective with crisp, native-resolution 2D subpixel parallax (`translate3d`), keeping text and vector lines 100% sharp.
- **Magnetic Buttons & Ambient Physics**: Primary action button features cursor magnetic attraction, light sweep hover shine, active spring compression, and a 4s ambient breathing pulse.
- **Zero-Layout-Thrash Expandable Panels**: Contextual controls expand fluidly using CSS `grid-template-rows: 0fr -> 1fr`.
- **Motion Playground**: Includes an isolated testing suite at `src/playground/playground.html` to audit and benchmark all motion primitives.

---

## 📦 Releasing & Packaging

Pagewright comes with an automated packaging script and CI/CD workflow to generate production-ready zip archives for distribution:

### 1. Build & Package Locally
```bash
# Runs full Vitest suite, compiles Vite bundle, and creates release zip
npm run package
```
This produces a ready-to-publish archive:
```
release/
└── pagewright-v1.0.0.zip   # ~120 KB production release archive
```
You can upload this zip directly to the **Chrome Web Store Developer Dashboard** or attach it to a **GitHub Release**.

### 2. Automated GitHub Releases via Git Tags
The included GitHub Actions workflow ([`.github/workflows/build-and-release.yml`](.github/workflows/build-and-release.yml)) automatically runs all 74 unit tests, packages the extension, and creates a public GitHub Release with release notes whenever you push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
│                                                             │
│   ┌──────────────┐         ┌───────────────────────────┐    │
│   │  Active Tab  │         │     Pagewright Popup      │    │
│   │  (Webpage)   │         │     (React 18 + Zustand)  │    │
│   └──────┬───────┘         └─────────────┬─────────────┘    │
│          │                               │                  │
│          │ chrome.tabs                   │ startConversion()│
│          ▼                               ▼                  │
│   ┌────────────────────────────────────────────────────┐    │
│   │         Service Worker (Orchestrator)              │    │
│   └──────┬───────────────────────────────┬─────────────┘    │
│          │                               │                  │
│          │ Inject Extractor & Cleaner    │ Send Clean DOM   │
│          ▼                               ▼                  │
│   ┌───────────────────────┐      ┌─────────────────────┐    │
│   │ Content Scripts       │      │ Render Container    │    │
│   │ - extractor.ts        │      │ - render.html       │    │
│   │ - cleaner.ts          │      │ - Themes (Clean/    │    │
│   │ - picker.ts (Shadow)  │      │   Modern/Minimal)   │    │
│   │ - lazyImages.ts (b64) │      │ - Heading Anchors   │    │
│   └───────────────────────┘      └──────────┬──────────┘    │
│                                             │               │
│                                             ▼               │
│                                  ┌─────────────────────┐    │
│                                  │ chrome.debugger     │    │
│                                  │ Page.printToPDF     │    │
│                                  └──────────┬──────────┘    │
│                                             │               │
│                       ┌─────────────────────┴──────────┐    │
│                       ▼                                ▼    │
│              ┌─────────────────┐             ┌──────────────┐│
│              │ Integrated      │             │ Real Vector  ││
│              │ PDF Preview Tab │             │ Download PDF ││
│              └─────────────────┘             └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Development & Testing

### Project Structure
```
web2pdf/
├── .github/
│   ├── workflows/             # CI & automated release workflow
│   └── ISSUE_TEMPLATE/        # GitHub bug & feature templates
├── public/
│   └── icons/                 # Extension icons (16, 48, 128px)
├── scripts/
│   └── package.js             # Automated zip packager for releases
├── src/
│   ├── ai/                    # Pluggable AI engine (Groq, Chrome, Ollama)
│   ├── background/            # Manifest V3 service worker orchestrator
│   ├── content/               # Extractor, DOM cleaner, and element picker
│   ├── pdf/                   # Chrome debugger Page.printToPDF abstraction
│   ├── playground/            # Interactive dev Motion & Shape playground
│   ├── popup/                 # React 18 popup UI, Zustand store & motion components
│   ├── preview/               # Standalone PDF preview viewer
│   ├── render/                # Clean print container & typography themes
│   ├── utils/                 # Types, filename generators & URL resolvers
│   └── __tests__/             # 74 automated unit tests
├── manifest.json              # Chrome Manifest V3 declaration
├── package.json               # Dependencies, scripts & metadata
├── tailwind.config.ts         # Tailwind CSS design tokens
├── vite.config.ts             # Vite + CRXJS plugin configuration
└── vitest.config.ts           # Vitest test configuration
```

### Running Test Suite
Pagewright includes 74 unit tests covering sanitization, image resolution, URL resolution, PDF filename formatting, restricted page safety, and AI fallback logic:
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🔒 Permissions & Privacy

Pagewright is designed with strict adherence to privacy and the principle of least privilege:

| Permission | Why It's Needed |
|---|---|
| `activeTab` | Temporary access to the current webpage **only when you explicitly click the extension icon**. No persistent background tracking. |
| `scripting` | Injects the content extractor and interactive element picker on demand. |
| `downloads` | Saves the generated vector PDF to your local default Downloads folder. |
| `storage` | Stores your local preferences (paper size, margins, theme, API keys) strictly inside your browser's private storage. |
| `debugger` | Required by the Chrome DevTools Protocol to invoke `Page.printToPDF`, creating a real vector PDF directly in the browser engine without remote servers. |
| `host_permissions` | Scoped to enable cross-origin image resolution and optional AI API endpoints (`https://api.groq.com/*`, `http://localhost:11434/*`). |

**Privacy Guarantee**: Pagewright does not collect, store, transmit, or monetize any user data, browsing history, or documents. Everything stays on your machine.

---

## 📄 License

Pagewright is free, open-source software licensed under the **[MIT License](LICENSE)**.

```
MIT License
Copyright (c) 2026 Subhradeep Kundu
```

Feel free to use, modify, and distribute this software for personal and commercial projects. Contributions and pull requests are warmly welcomed!

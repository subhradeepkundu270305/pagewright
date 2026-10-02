# Contributing to Pagewright

Thank you for your interest in contributing to Pagewright! We welcome contributions of all kinds: bug reports, documentation updates, feature requests, and code contributions.

## Development Workflow

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer; recommended: Node 20 LTS)
- npm (version 9 or newer)
- Google Chrome, Brave, Chromium, or Microsoft Edge (Chromium Manifest V3)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/subhradeepkundu270305/pagewright.git
cd pagewright

# Install dependencies
npm install

# Start Vite in development mode (with HMR)
npm run dev
```

### 3. Load Extension in Chrome
1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory inside this repository.
5. Whenever you make code changes, run `npm run build` and click the 🔄 reload icon on the extension card in `chrome://extensions`.

### 4. Running Tests
We maintain high test coverage using [Vitest](https://vitest.dev/):
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### 5. Motion Playground
Test all physics, squircle tokens, magnetic buttons, and animation transitions in isolation:
Open `chrome-extension://<id>/src/playground/playground.html` in your browser.

### 6. Submitting a Pull Request
1. Fork the repository and create your feature branch: `git checkout -b feat/my-new-feature`.
2. Write clean, typed TypeScript adhering to existing patterns.
3. Ensure all automated tests pass: `npm test`.
4. Ensure the bundle builds with zero errors: `npm run build`.
5. Commit with clear, descriptive messages: `git commit -m "feat: add support for custom paper margins"`.
6. Push to your branch and open a Pull Request on GitHub.

## Code of Conduct
Please be respectful and constructive in all issues, discussions, and code reviews.

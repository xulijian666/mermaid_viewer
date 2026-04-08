# Mermaid Viewer

A Mermaid diagram editing and preview tool built with React + TypeScript + Vite + Tauri.

## Features

- **Real-time Preview**: Render diagrams in real-time while editing Mermaid code
- **Multiple Diagram Types**: Support for 20+ diagram types including flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, and more
- **Template Library**: Built-in rich diagram templates for quick start
- **Code Editor**: Integrated Monaco Editor with syntax highlighting and error hints
- **Error Diagnostics**: Real-time detection of Mermaid syntax errors with problem location
- **Export Function**: Support for exporting PNG images
- **Desktop Application**: Lightweight desktop application built with Tauri

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Desktop App**: Tauri 2
- **Code Editor**: Monaco Editor
- **Diagram Rendering**: Mermaid 11
- **Code Quality**: ESLint + TypeScript ESLint

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Build Tauri Desktop Application

```bash
npm run tauri:build
```

## Supported Diagram Types

- Flowchart
- Sequence Diagram
- Class Diagram
- State Diagram
- Entity Relationship Diagram
- User Journey
- Gantt
- Pie Chart
- Quadrant Chart
- Requirement Diagram
- Gitgraph
- C4 Diagram
- Mindmap
- Timeline
- Architecture Diagram
- Block Diagram
- Packet Diagram
- Sankey Diagram
- XY Chart
- And more...

## Project Structure

```
mermaid_viewer/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Styles
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── src-tauri/           # Tauri backend code
├── package.json         # Project configuration
└── vite.config.ts       # Vite configuration
```

## Development Notes

### React Compiler

This project has React Compiler enabled for performance optimization. See [React Compiler documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!
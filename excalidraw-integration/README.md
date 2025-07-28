# Excalidraw Integration Demo

This repository demonstrates how to integrate Excalidraw into a React application with support for both Excalidraw JSON files and Mermaid diagram conversion.

## Features

- **Load Excalidraw JSON files**: Render and edit existing Excalidraw diagrams
- **Convert Mermaid to Excalidraw**: Automatically convert Mermaid diagrams to Excalidraw format
- **Full Excalidraw functionality**: All drawing tools, shapes, and features are available
- **Export capabilities**: Export diagrams as PNG, SVG, or JSON
- **Interactive editing**: Users can modify and enhance generated diagrams
- **Multiple diagram types**: Support for flowcharts, sequence diagrams, class diagrams, and more

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd excalidraw-integration
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Loading Excalidraw JSON Files

```javascript
import ExcalidrawWrapper from './components/ExcalidrawWrapper';

const myExcalidrawData = {
  elements: [...], // Excalidraw elements
  appState: {...}, // App state
  files: {...}     // Optional files
};

<ExcalidrawWrapper 
  initialData={myExcalidrawData}
  onDataChange={(data) => console.log('Updated:', data)}
/>
```

### Converting Mermaid Diagrams

```javascript
import MermaidConverter from './components/MermaidConverter';

const mermaidDiagram = `
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process]
  B -->|No| D[End]
`;

<MermaidConverter 
  mermaidText={mermaidDiagram}
  onDataChange={(data) => console.log('Converted:', data)}
/>
```

### Programmatic API Usage

```javascript
// Get the Excalidraw API instance
const [excalidrawAPI, setExcalidrawAPI] = useState(null);

// Export as PNG
const exportPNG = async () => {
  const blob = await excalidrawAPI.exportToBlob({
    mimeType: 'image/png',
    quality: 0.95,
  });
  // Handle the blob (download, upload, etc.)
};

// Get current scene data
const getSceneData = () => {
  const elements = excalidrawAPI.getSceneElements();
  const appState = excalidrawAPI.getAppState();
  const files = excalidrawAPI.getFiles();
  return { elements, appState, files };
};
```

## Project Structure

```
excalidraw-integration/
├── src/
│   ├── components/
│   │   ├── ExcalidrawWrapper.jsx    # Main Excalidraw component
│   │   └── MermaidConverter.jsx     # Mermaid to Excalidraw converter
│   ├── data/
│   │   ├── sampleExcalidrawData.js  # Sample Excalidraw JSON
│   │   └── sampleMermaidData.js     # Sample Mermaid diagrams
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## Supported Mermaid Diagram Types

- **Flowcharts**: Basic flow diagrams with decision points
- **Sequence Diagrams**: Interaction between participants
- **Class Diagrams**: Object-oriented class relationships
- **State Diagrams**: State machines and transitions
- **ER Diagrams**: Entity-relationship diagrams

## Integration with Your LLM Agent

To integrate this with your LLM agent that generates diagrams:

1. **For Excalidraw JSON output**:
   ```javascript
   // Your LLM generates Excalidraw JSON
   const generatedData = await llmAgent.generateExcalidraw(prompt);
   
   // Render it
   <ExcalidrawWrapper initialData={generatedData} />
   ```

2. **For Mermaid output**:
   ```javascript
   // Your LLM generates Mermaid syntax
   const mermaidCode = await llmAgent.generateMermaid(prompt);
   
   // Convert and render
   <MermaidConverter mermaidText={mermaidCode} />
   ```

## Customization

### Changing the Theme

```javascript
<Excalidraw
  theme="dark" // or "light"
  // ... other props
/>
```

### View-Only Mode

```javascript
<ExcalidrawWrapper 
  initialData={data}
  viewMode={true} // Disables editing
/>
```

### Custom UI Options

```javascript
<Excalidraw
  UIOptions={{
    canvasActions: {
      loadScene: false,
      export: false,
      clearCanvas: false,
    },
  }}
/>
```

## Dependencies

- React 18.2.0
- @excalidraw/excalidraw 0.17.0
- Vite 4.4.0 (build tool)

## License

MIT

## Contributing

Feel free to submit issues and pull requests to improve this integration demo.

## Resources

- [Excalidraw Documentation](https://docs.excalidraw.com/)
- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw)
- [Mermaid Documentation](https://mermaid.js.org/)
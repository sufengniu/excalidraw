import React, { useState } from 'react';
import ExcalidrawWrapper from './components/ExcalidrawWrapper';
import MermaidConverter from './components/MermaidConverter';
import { sampleExcalidrawData } from './data/sampleExcalidrawData';
import { sampleMermaidDiagrams } from './data/sampleMermaidData';

function App() {
  const [activeTab, setActiveTab] = useState('excalidraw');
  const [selectedDemo, setSelectedDemo] = useState('flowchart');
  const [currentData, setCurrentData] = useState(null);
  const [showSource, setShowSource] = useState(false);

  const handleDataChange = (data) => {
    setCurrentData(data);
    console.log('Data changed:', data);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Excalidraw Integration Demo</h1>
        <div>
          <button 
            onClick={() => setShowSource(!showSource)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: showSource ? '#e0e0e0' : '#fff',
              cursor: 'pointer'
            }}
          >
            {showSource ? 'Hide' : 'Show'} Source
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'excalidraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('excalidraw')}
        >
          Excalidraw JSON
        </button>
        <button
          className={`tab ${activeTab === 'mermaid' ? 'active' : ''}`}
          onClick={() => setActiveTab('mermaid')}
        >
          Mermaid Diagrams
        </button>
        <button
          className={`tab ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          Blank Canvas
        </button>
      </div>

      <div className="content">
        {activeTab === 'excalidraw' && (
          <>
            <div className="info-box">
              <p>
                This demo shows how to load Excalidraw JSON files. The sample data represents a simple flowchart.
                You can edit the diagram and export it in various formats.
              </p>
            </div>
            <ExcalidrawWrapper 
              initialData={sampleExcalidrawData}
              onDataChange={handleDataChange}
            />
          </>
        )}

        {activeTab === 'mermaid' && (
          <>
            <div className="demo-selector">
              <label>Select Mermaid Diagram Type:</label>
              <select 
                value={selectedDemo} 
                onChange={(e) => setSelectedDemo(e.target.value)}
              >
                <option value="flowchart">Flowchart</option>
                <option value="sequenceDiagram">Sequence Diagram</option>
                <option value="classDiagram">Class Diagram</option>
                <option value="stateDiagram">State Diagram</option>
                <option value="erDiagram">ER Diagram</option>
              </select>
            </div>
            <div className="info-box">
              <p>
                This demo converts Mermaid diagrams to Excalidraw. Select different diagram types from the dropdown.
                Note: The conversion might take a moment.
              </p>
            </div>
            <MermaidConverter 
              mermaidText={sampleMermaidDiagrams[selectedDemo]}
              onDataChange={handleDataChange}
            />
          </>
        )}

        {activeTab === 'playground' && (
          <>
            <div className="info-box">
              <p>
                This is a blank Excalidraw canvas. Start drawing your own diagrams!
                All Excalidraw features are available including shapes, text, and hand-drawn styles.
              </p>
            </div>
            <ExcalidrawWrapper 
              initialData={{ elements: [], appState: {} }}
              onDataChange={handleDataChange}
            />
          </>
        )}

        {showSource && currentData && (
          <div className="source-viewer" style={{ marginTop: '2rem' }}>
            <h2>Current Drawing Data (JSON)</h2>
            <pre>
              {JSON.stringify({
                elements: currentData.elements,
                appState: currentData.appState
              }, null, 2)}
            </pre>
          </div>
        )}

        {showSource && activeTab === 'mermaid' && (
          <div className="source-viewer" style={{ marginTop: '2rem' }}>
            <h2>Mermaid Source</h2>
            <pre>{sampleMermaidDiagrams[selectedDemo]}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
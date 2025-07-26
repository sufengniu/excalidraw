import React, { useState } from 'react';
import ExcalidrawWrapper from '../components/ExcalidrawWrapper';
import MermaidConverter from '../components/MermaidConverter';

// Example component showing how to integrate with your LLM agent
const LLMIntegrationExample = () => {
  const [llmOutput, setLlmOutput] = useState(null);
  const [outputType, setOutputType] = useState('excalidraw'); // or 'mermaid'

  // Simulate LLM generating Excalidraw JSON
  const simulateLLMExcalidrawGeneration = async (prompt) => {
    // In real implementation, this would call your LLM API
    // const response = await fetch('/api/generate-excalidraw', {
    //   method: 'POST',
    //   body: JSON.stringify({ prompt }),
    // });
    // const data = await response.json();
    
    // For demo, return a simple generated diagram
    return {
      elements: [
        {
          type: "rectangle",
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          backgroundColor: "#a5d8ff",
          id: "generated-1",
          strokeColor: "#1e1e1e",
          roughness: 1,
          opacity: 100,
          strokeWidth: 1,
          strokeStyle: "solid",
          fillStyle: "hachure",
        },
        {
          type: "text",
          x: 150,
          y: 135,
          width: 100,
          height: 30,
          text: prompt || "Generated Content",
          fontSize: 16,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          id: "generated-text-1",
          containerId: "generated-1",
        }
      ],
      appState: {
        viewBackgroundColor: "#ffffff",
      }
    };
  };

  // Simulate LLM generating Mermaid diagram
  const simulateLLMMermaidGeneration = async (prompt) => {
    // In real implementation, this would call your LLM API
    // const response = await fetch('/api/generate-mermaid', {
    //   method: 'POST',
    //   body: JSON.stringify({ prompt }),
    // });
    // const data = await response.json();
    
    // For demo, return a simple Mermaid diagram
    return `flowchart TD
    A[User Request: ${prompt}] --> B[Process Request]
    B --> C{Valid?}
    C -->|Yes| D[Generate Response]
    C -->|No| E[Return Error]
    D --> F[Send to User]
    E --> F`;
  };

  const handleGenerateFromLLM = async () => {
    const userPrompt = "Create a simple workflow diagram";
    
    if (outputType === 'excalidraw') {
      const excalidrawData = await simulateLLMExcalidrawGeneration(userPrompt);
      setLlmOutput(excalidrawData);
    } else {
      const mermaidData = await simulateLLMMermaidGeneration(userPrompt);
      setLlmOutput(mermaidData);
    }
  };

  // Example of handling file upload (if your LLM saves files)
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        setLlmOutput(data);
        setOutputType('excalidraw');
      } catch (e) {
        // If not JSON, assume it's Mermaid
        setLlmOutput(text);
        setOutputType('mermaid');
      }
    }
  };

  return (
    <div>
      <h2>LLM Integration Example</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleGenerateFromLLM}>
          Simulate LLM Generation
        </button>
        
        <label style={{ marginLeft: '1rem' }}>
          Output Type:
          <select 
            value={outputType} 
            onChange={(e) => setOutputType(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="excalidraw">Excalidraw JSON</option>
            <option value="mermaid">Mermaid Diagram</option>
          </select>
        </label>
        
        <input 
          type="file" 
          accept=".json,.txt,.mmd"
          onChange={handleFileUpload}
          style={{ marginLeft: '1rem' }}
        />
      </div>

      {llmOutput && (
        <div>
          {outputType === 'excalidraw' ? (
            <ExcalidrawWrapper 
              initialData={llmOutput}
              onDataChange={(data) => {
                console.log('User modified the diagram:', data);
                // You can save this back to your database
              }}
            />
          ) : (
            <MermaidConverter 
              mermaidText={llmOutput}
              onDataChange={(data) => {
                console.log('Converted and possibly modified:', data);
                // You can save this back to your database
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LLMIntegrationExample;
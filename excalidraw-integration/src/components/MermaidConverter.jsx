import React, { useState, useEffect } from 'react';
import ExcalidrawWrapper from './ExcalidrawWrapper';

const MermaidConverter = ({ mermaidText, onDataChange }) => {
  const [excalidrawData, setExcalidrawData] = useState(null);
  const [error, setError] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (mermaidText) {
      convertMermaidToExcalidraw();
    }
  }, [mermaidText]);

  const convertMermaidToExcalidraw = async () => {
    setIsConverting(true);
    setError(null);
    
    try {
      // Dynamic import to avoid SSR issues
      const { convertMermaidToExcalidraw } = await import('@excalidraw/mermaid-to-excalidraw');
      
      const result = await convertMermaidToExcalidraw(mermaidText, {
        fontSize: 16,
      });
      
      setExcalidrawData({
        elements: result.elements,
        files: result.files || {},
        appState: {
          viewBackgroundColor: '#ffffff',
          gridSize: null,
        }
      });
    } catch (err) {
      console.error('Mermaid conversion error:', err);
      setError('Failed to convert Mermaid diagram. Please check the syntax.');
      
      // Fallback: create a text element with the Mermaid code
      setExcalidrawData({
        elements: [{
          type: "text",
          id: "mermaid-error",
          x: 100,
          y: 100,
          width: 400,
          height: 200,
          angle: 0,
          strokeColor: "#e03131",
          backgroundColor: "transparent",
          fillStyle: "hachure",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          text: `Error converting Mermaid diagram:\n\n${mermaidText}`,
          fontSize: 16,
          fontFamily: 1,
          textAlign: "left",
          verticalAlign: "top",
        }],
        appState: {
          viewBackgroundColor: '#ffffff',
        }
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (isConverting) {
    return (
      <div className="excalidraw-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '600px'
      }}>
        <div>Converting Mermaid diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="excalidraw-container">
        <div className="info-box" style={{ backgroundColor: '#fee', borderColor: '#fcc' }}>
          <p>{error}</p>
        </div>
        <ExcalidrawWrapper 
          initialData={excalidrawData} 
          onDataChange={onDataChange}
        />
      </div>
    );
  }

  return (
    <ExcalidrawWrapper 
      initialData={excalidrawData} 
      onDataChange={onDataChange}
    />
  );
};

export default MermaidConverter;
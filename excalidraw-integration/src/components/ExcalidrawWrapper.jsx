import React, { useState, useEffect, useRef } from 'react';
import { Excalidraw, serializeAsJSON, restoreElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

const ExcalidrawWrapper = ({ initialData, viewMode = false, onDataChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (excalidrawAPI && initialData) {
      try {
        if (initialData.elements) {
          const elements = restoreElements(initialData.elements);
          excalidrawAPI.updateScene({
            elements,
            appState: initialData.appState || {},
            collaborators: initialData.collaborators || []
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsLoading(false);
      }
    }
  }, [excalidrawAPI, initialData]);

  const handleChange = (elements, appState, files) => {
    if (onDataChange) {
      const serialized = serializeAsJSON(elements, appState, files, 'local');
      onDataChange({
        elements,
        appState,
        files,
        serialized
      });
    }
  };

  const handleExport = async (format) => {
    if (!excalidrawAPI) return;

    try {
      switch (format) {
        case 'png':
          const pngBlob = await excalidrawAPI.exportToBlob({
            mimeType: 'image/png',
            quality: 0.95,
          });
          downloadBlob(pngBlob, 'excalidraw.png');
          break;
          
        case 'svg':
          const svgElement = await excalidrawAPI.exportToSvg();
          const svgString = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          downloadBlob(svgBlob, 'excalidraw.svg');
          break;
          
        case 'json':
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const files = excalidrawAPI.getFiles();
          const json = serializeAsJSON(elements, appState, files, 'local');
          const jsonBlob = new Blob([json], { type: 'application/json' });
          downloadBlob(jsonBlob, 'excalidraw.json');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="excalidraw-container">
      {!viewMode && (
        <div className="toolbar">
          <button onClick={() => handleExport('png')}>Export as PNG</button>
          <button onClick={() => handleExport('svg')}>Export as SVG</button>
          <button onClick={() => handleExport('json')}>Export as JSON</button>
        </div>
      )}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}>
          Loading...
        </div>
      )}
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        viewModeEnabled={viewMode}
        zenModeEnabled={false}
        gridModeEnabled={false}
        theme="light"
        name="Excalidraw Integration Demo"
        UIOptions={{
          canvasActions: {
            loadScene: true,
            export: {
              saveFileToDisk: true,
            },
            clearCanvas: true,
            changeViewBackgroundColor: true,
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
};

export default ExcalidrawWrapper;
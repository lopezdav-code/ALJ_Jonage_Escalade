import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  deterministicIDLabels: true
});

const MermaidDiagram = ({ diagram, title, className = '' }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const uniqueId = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(uniqueId, diagram);
        setSvgContent(svg);
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err);
        setError('Erreur lors du rendu du diagramme');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [diagram]);

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      {isLoading && (
        <div className="bg-muted p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center h-40">
          <p className="text-muted-foreground">Chargement du diagramme...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <details className="text-xs text-red-700 dark:text-red-300 mt-2">
              <summary className="cursor-pointer font-semibold">Afficher le contenu Mermaid</summary>
              <pre className="mt-2 bg-red-100 dark:bg-red-900 p-2 rounded text-xs overflow-x-auto">
                {diagram}
              </pre>
            </details>
          </div>
        </div>
      )}

      {svgContent && !error && (
        <div
          className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto flex justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ minHeight: '300px' }}
        />
      )}
    </div>
  );
};

export default MermaidDiagram;

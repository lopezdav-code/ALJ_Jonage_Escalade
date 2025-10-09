import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Protection globale contre les boucles d'erreur d'images
import '@/lib/globalImageProtection';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
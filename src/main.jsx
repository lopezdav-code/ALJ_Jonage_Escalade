import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Log de débogage pour vérifier le chargement
console.log('🚀 ALJ Jonage Escalade - Application démarrée avec succès !');
console.log('🔢 Version: 2.3.0 - Fix React Router basename pour GitHub Pages');
console.log('🔧 React Router: basename="/ALJ_Jonage_Escalade" configuré');
console.log('✅ Navigation: URLs conservent maintenant le chemin de base');
console.log('📅 Chargement à:', new Date().toLocaleString('fr-FR'));
console.log('🌐 URL actuelle:', window.location.href);
console.log('📦 Mode de déploiement: GitHub Pages (gh-pages branch)');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
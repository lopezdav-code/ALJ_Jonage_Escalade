import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Log de débogage pour vérifier le chargement
console.log('🚀 ALJ Jonage Escalade - Application démarrée avec succès !');
console.log('� Version: 2.1.0 - Galerie photo interactive + corrections déploiement');
console.log('�📅 Chargement à:', new Date().toLocaleString('fr-FR'));
console.log('🌐 URL actuelle:', window.location.href);
console.log('📦 Mode de déploiement: GitHub Pages');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Utilisation de la syntaxe de rendu compatible avec les vieilles versions de React/Browsers
var rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
  } catch (err) {
    rootElement.innerHTML = '<div style="padding:20px; color:red;">Erreur de lancement : ' + err.message + '</div>';
  }
}
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import process from "process";
import { Buffer } from "buffer/";
import { UserProvider } from './context/UserContextApi.jsx';

window.process = process;
window.Buffer = Buffer;
window.global = window;

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <App />
  </UserProvider>
);

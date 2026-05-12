import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/topbar.css';
import './styles/auth-pages.css';
import './styles/app-logo.css';
import './styles/charts.css';
import './styles/events.css';
import './styles/create-event.css';
import './styles/payment-methods.css';
import './styles/select-menu.css';
import 'react-datepicker/dist/react-datepicker.css';
import './styles/datepicker.css';
import './styles/event-detail.css';
import './styles/profile.css';
import './styles/feedback.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

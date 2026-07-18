import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext.tsx';
import './index.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

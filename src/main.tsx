import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { UserProvider } from './context/UserContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <UserProvider>
                        <SocketProvider>
                            <App />
                        </SocketProvider>
                    </UserProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);
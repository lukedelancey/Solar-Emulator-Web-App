import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import StatusBar from './components/StatusBar';
import SimulationPage from './pages/SimulationPage';
import DatabasePage from './pages/DatabasePage';
import EmulationPage from './pages/EmulationPage';
import AboutPage from './pages/AboutPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <StatusBar />
        <NavBar />

        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          <div className="min-h-full">
            <Routes>
              <Route path="/" element={<Navigate to="/simulation" replace />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/modules" element={<DatabasePage />} />
              <Route path="/emulation" element={<EmulationPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/simulation" replace />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600">
              <p className="mb-2 sm:mb-0">
                2025/2026 Solar PV Emulator - ECEN 403 Project
              </p>
              <p className="text-slate-500">
                Built with React, TypeScript & Tailwind CSS
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;

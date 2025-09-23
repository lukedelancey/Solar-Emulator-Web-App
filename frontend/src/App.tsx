import React from 'react';
import NavBar from './components/NavBar';
import StatusBar from './components/StatusBar';

// TODO: Implement React Router, authentication context, and main application layout
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      <NavBar />
      <main className="container mx-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-center">Solar PV Emulator Web App</h1>
          <p className="text-center mt-4">Application placeholder - routing to be implemented</p>
        </div>
      </main>
    </div>
  );
};

export default App;

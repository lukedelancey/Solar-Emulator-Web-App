import React from 'react';

// TODO: Implement user authentication controls and device connection status indicator
const StatusBar: React.FC = () => {
  const isAuthenticated = false; // Placeholder - will be replaced with auth context
  const isDeviceConnected = false; // Placeholder - will be replaced with device context

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
      <div className="container mx-auto flex justify-end items-center space-x-6">
        {/* Device Connection Status */}
        <div className="flex items-center space-x-2" role="status" aria-live="polite">
          <span className="text-sm text-slate-600">ESP32:</span>
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                isDeviceConnected
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : 'bg-slate-400'
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-xs font-medium ${
                isDeviceConnected ? 'text-emerald-600' : 'text-slate-500'
              }`}
              aria-label={`ESP32 device ${isDeviceConnected ? 'connected' : 'disconnected'}`}
            >
              {isDeviceConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Authentication Controls */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-700 font-medium">John Doe</span>
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-colors duration-200"
                aria-label="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-colors duration-200"
                aria-label="Sign in to your account"
              >
                Sign In
              </button>
              <span className="text-slate-400 text-xs">|</span>
              <button
                type="button"
                className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-colors duration-200"
                aria-label="Create a new account"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
import React from 'react';
import { NavLink } from 'react-router-dom';

const NavBar: React.FC = () => {
  const navItems = [
    { path: '/simulation', label: 'Simulation', ariaLabel: 'Navigate to PV Model Simulation page' },
    { path: '/modules', label: 'Modules', ariaLabel: 'Navigate to PV Modules Database page' },
    { path: '/emulation', label: 'Emulation', ariaLabel: 'Navigate to PV Module Emulation page' },
    { path: '/about', label: 'About', ariaLabel: 'Navigate to About and Information page' },
  ];

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-cyan-600 shadow-lg" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-1">
            <h1 className="text-xl font-bold text-white mr-8">
              Solar PV Emulator
            </h1>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600 ${
                      isActive
                        ? 'bg-white bg-opacity-20 text-white shadow-md'
                        : 'text-teal-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`
                  }
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-teal-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600 p-2 rounded-md"
              aria-label="Toggle mobile navigation menu"
              aria-expanded="false"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600 ${
                    isActive
                      ? 'bg-white bg-opacity-20 text-white shadow-md'
                      : 'text-teal-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`
                }
                aria-label={item.ariaLabel}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
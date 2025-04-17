// src/layout/MainLayout.jsx
import React from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';

function MainLayout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-gray-100 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

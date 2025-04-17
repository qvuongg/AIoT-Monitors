// src/App.jsx
import React from 'react';
import MainLayout from './components/layout/MainLayout';
import UserPage from './pages/UserPage';

function App() {
  return (
    <MainLayout>
      <UserPage />
    </MainLayout>
  );
}

export default App;

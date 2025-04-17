// src/components/Sidebar.jsx
import React from 'react';

function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white p-6">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <ul>
        <li className="mb-4">
          <a href="#" className="hover:text-gray-400">User List</a>
        </li>
        <li className="mb-4">
          <a href="#" className="hover:text-gray-400">Settings</a>
        </li>
        <li className="mb-4">
          <a href="#" className="hover:text-gray-400">Reports</a>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;

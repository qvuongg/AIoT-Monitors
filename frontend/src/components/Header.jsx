import React from 'react';

function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">AIoT Monitor</h1>

        <nav className="flex items-center space-x-6">
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-gray-300">Home</a></li>
            <li><a href="#" className="hover:text-gray-300">About</a></li>
            <li><a href="#" className="hover:text-gray-300">Contact</a></li>
          </ul>

          {/* Profile Dropdown */}
          <div className="relative group ml-4">
            <img
              src="https://i.pravatar.cc/40" // ảnh đại diện giả
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-white"
            />
            <div className="absolute right-0 mt-1 w-40 bg-white text-black rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition duration-200 z-50">
              <a href="#" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
              <a href="#" className="block px-4 py-2 hover:bg-gray-100">Logout</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;

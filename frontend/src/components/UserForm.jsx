// src/components/UserForm.jsx
import React, { useState } from 'react';

function UserForm({ setUsers }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email) {
      alert('Please fill in all fields');
      return;
    }

    // Giả lập API để thêm người dùng
    const newUser = { id: Date.now(), name, email };
    setUsers((prevUsers) => [...prevUsers, newUser]);

    // Reset form
    setName('');
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-300 rounded p-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 rounded p-2"
      />
      <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
        Add User
      </button>
    </form>
  );
}

export default UserForm;

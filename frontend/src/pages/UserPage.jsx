// src/pages/UserPage.jsx
import React, { useState, useEffect } from 'react';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';

function UserPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Hàm tìm kiếm người dùng
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Lấy danh sách người dùng từ API
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  // Lọc người dùng theo search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Các hàm xử lý hành động
  const handleView = (userId) => {
    alert(`View user with ID: ${userId}`);
  };

  const handleEdit = (userId) => {
    alert(`Edit user with ID: ${userId}`);
  };

  const handleDelete = (userId) => {
    if (window.confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <UserForm setUsers={setUsers} />
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Search Users"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded p-2 w-1/3"
        />
      </div>

      <UserList
        users={filteredUsers}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default UserPage;

import { useState } from 'react';
import axios from 'axios';

function CreateCommand() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/commands', {
        title,
        description,
        created_by: createdBy
      });
      alert('Tạo command thành công!');
      console.log(res.data);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tạo command');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Tạo Command mới</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} /><br />
        <input placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} /><br />
        <input placeholder="Người tạo" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} /><br />
        <button type="submit">Tạo</button>
      </form>
    </div>
  );
}

export default CreateCommand;

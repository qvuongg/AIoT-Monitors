import { useState, useEffect } from 'react';
import axios from 'axios';

function CreateCommandList() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [commandLists, setCommandLists] = useState([]);
    const [loading, setLoading] = useState(false);

    // Command form states
    const [commandName, setCommandName] = useState('');
    const [commandText, setCommandText] = useState('');
    const [commandDesc, setCommandDesc] = useState('');
    const [isFileEdit, setIsFileEdit] = useState(false);
    const [selectedListId, setSelectedListId] = useState('');

    useEffect(() => {
        fetchCommandLists();
    }, []);

    const fetchCommandLists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/commands/lists', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCommandLists(response.data.command_lists || []);
            if (response.data.command_lists && response.data.command_lists.length > 0) {
                setSelectedListId(response.data.command_lists[0].id);
            }
        } catch (error) {
            console.error('Error fetching command lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/api/commands/lists', {
                name,
                description
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert('Danh sách lệnh đã được tạo thành công!');
            setName('');
            setDescription('');
            fetchCommandLists();
        } catch (error) {
            console.error('Error creating command list:', error);
            alert('Lỗi khi tạo danh sách lệnh: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCommandSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/api/commands', {
                name: commandName,
                command: commandText,
                description: commandDesc,
                is_file_edit: isFileEdit
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.command && selectedListId) {
                // Add command to selected list
                await axios.post(`http://localhost:8000/api/commands/lists/${selectedListId}/commands`, {
                    command_id: response.data.command.id
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            alert('Tạo command thành công!');
            setCommandName('');
            setCommandText('');
            setCommandDesc('');
            setIsFileEdit(false);
            fetchCommandLists();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tạo command: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="command-management" style={{ padding: '1rem' }}>
            <h1>Quản lý lệnh</h1>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h2>Tạo danh sách lệnh mới</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Tên danh sách:</label>
                            <input
                                id="name"
                                placeholder="Tên danh sách lệnh"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>Mô tả:</label>
                            <textarea
                                id="description"
                                placeholder="Mô tả về danh sách lệnh"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Tạo danh sách lệnh
                        </button>
                    </form>
                </div>

                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h2>Danh sách lệnh hiện có</h2>
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : commandLists.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {commandLists.map(list => (
                                <li
                                    key={list.id}
                                    style={{
                                        marginBottom: '0.5rem',
                                        padding: '0.5rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{list.name}</h3>
                                    {list.description && <p style={{ margin: '0 0 0.5rem 0' }}>{list.description}</p>}
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                                        Tạo bởi: {list.created_by || 'N/A'} |
                                        Ngày tạo: {new Date(list.created_at).toLocaleDateString('vi-VN')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Chưa có danh sách lệnh nào.</p>
                    )}
                </div>
            </div>

            {/* <div style={{ marginTop: '2rem' }}>
                <h2>Tạo Command mới</h2>
                <form onSubmit={handleCommandSubmit}>
                    {commandLists.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="list" style={{ display: 'block', marginBottom: '0.5rem' }}>Thêm vào danh sách:</label>
                            <select
                                id="list"
                                value={selectedListId}
                                onChange={(e) => setSelectedListId(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                {commandLists.map(list => (
                                    <option key={list.id} value={list.id}>{list.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="commandName" style={{ display: 'block', marginBottom: '0.5rem' }}>Tên command:</label>
                        <input
                            id="commandName"
                            placeholder="Tên command"
                            value={commandName}
                            onChange={(e) => setCommandName(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="commandText" style={{ display: 'block', marginBottom: '0.5rem' }}>Command text:</label>
                        <textarea
                            id="commandText"
                            placeholder="Nhập nội dung lệnh"
                            value={commandText}
                            onChange={(e) => setCommandText(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', minHeight: '100px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="commandDesc" style={{ display: 'block', marginBottom: '0.5rem' }}>Mô tả:</label>
                        <textarea
                            id="commandDesc"
                            placeholder="Mô tả về command"
                            value={commandDesc}
                            onChange={(e) => setCommandDesc(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={isFileEdit}
                                onChange={(e) => setIsFileEdit(e.target.checked)}
                                style={{ marginRight: '0.5rem' }}
                            />
                            Là lệnh chỉnh sửa file
                        </label>
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Tạo Command
                    </button>
                </form>
            </div> */}
        </div>
    );
}

export default CreateCommandList; 
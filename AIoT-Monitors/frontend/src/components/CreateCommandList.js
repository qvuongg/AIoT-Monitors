import { useState, useEffect } from 'react';
import { commandService } from '../services/api';

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
            const lists = await commandService.getAllCommandLists();
            setCommandLists(lists);
            if (lists.length > 0) {
                setSelectedListId(lists[0].id);
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
            await commandService.createCommandList({
                name,
                description
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
            const commandData = {
                name: commandName,
                command: commandText,
                description: commandDesc,
                is_file_edit: isFileEdit
            };
            
            const response = await commandService.createCommand(commandData);

            if (response.command && selectedListId) {
                // Add command to selected list
                await commandService.addCommandToList(selectedListId, response.command.id);
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
        <div className="command-management" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #4CAF50', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Quản lý lệnh cho Team Lead</h1>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h2 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Tạo danh sách lệnh mới</h2>
                    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f9f9f9', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tên danh sách:</label>
                            <input
                                id="name"
                                placeholder="Tên danh sách lệnh"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mô tả:</label>
                            <textarea
                                id="description"
                                placeholder="Mô tả về danh sách lệnh"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                padding: '0.7rem 1.2rem',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Tạo danh sách lệnh
                        </button>
                    </form>
                </div>

                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h2 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Danh sách lệnh hiện có</h2>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : commandLists.length > 0 ? (
                        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {commandLists.map(list => (
                                    <li
                                        key={list.id}
                                        style={{
                                            marginBottom: '0.8rem',
                                            padding: '0.8rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            backgroundColor: '#f9f9f9',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setSelectedListId(list.id)}
                                    >
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976D2' }}>{list.name}</h3>
                                        {list.description && <p style={{ margin: '0 0 0.5rem 0' }}>{list.description}</p>}
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                                            Tạo bởi: {list.created_by || 'N/A'} |
                                            Ngày tạo: {new Date(list.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                        {selectedListId === list.id && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.3rem', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }}>
                                                Đã chọn
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
                            <p>Chưa có danh sách lệnh nào. Hãy tạo danh sách lệnh mới.</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h2 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Tạo Command mới</h2>
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
            </div>
        </div>
    );
}

export default CreateCommandList;
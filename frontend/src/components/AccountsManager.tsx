import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Popover, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, EyeOutlined, EyeInvisibleOutlined, KeyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface AccountsManagerProps {
    currentUser: any;
    apiUrl: string;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({ currentUser, apiUrl }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/users`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (e) {
            // console.error(e);
        }
    };

    const handleCreate = async (values: any) => {
        try {
            const token = localStorage.getItem('token');
            // Fix: Convert empty string student_id to null
            const payload = {
                ...values,
                student_id: values.student_id ? parseInt(values.student_id) : null
            };

            await axios.post(`${apiUrl}/users`, payload, { headers: { Authorization: `Bearer ${token}` } });
            message.success('User created');
            setIsModalOpen(false);
            form.resetFields();
            fetchUsers();
        } catch (e: any) {
            if (e.response && e.response.data && e.response.data.detail) {
                message.error(e.response.data.detail);
            } else {
                message.error('Failed to create user');
            }
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            message.success('User deleted');
            fetchUsers();
        } catch (e) {
            message.error('Failed to delete user');
        }
    };

    const [resetUserId, setResetUserId] = useState<number | null>(null);
    const [resetForm] = Form.useForm();

    const handleResetPassword = async (values: any) => {
        if (!resetUserId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/users/${resetUserId}/reset-password`, { new_password: values.new_password }, { headers: { Authorization: `Bearer ${token}` } });
            message.success('Password reset successfully');
            setResetUserId(null);
            resetForm.resetFields();
            fetchUsers();
        } catch (e: any) {
            message.error('Failed to reset password');
        }
    };

    const columns = [
        { title: 'Username', dataIndex: 'username', key: 'username' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (r: string) => (
                <Tag color={r === 'admin' ? 'red' : (r === 'teacher' ? 'blue' : 'green')}>
                    {r.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Password',
            key: 'password',
            align: 'center' as const,
            render: (_: any, r: any) => {
                if (r.is_password_changed) {
                    return (
                        <Tooltip title="User has changed password">
                            <EyeInvisibleOutlined style={{ color: '#ccc', fontSize: '18px' }} />
                        </Tooltip>
                    );
                }
                return (
                    <Popover content={r.initial_password} title="Initial Password" trigger="click">
                        <EyeOutlined style={{ color: '#1890ff', fontSize: '18px', cursor: 'pointer' }} />
                    </Popover>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, r: any) => (
                <>
                    <Tooltip title="Reset Password">
                        <Button
                            icon={<KeyOutlined />}
                            style={{ marginRight: 8 }}
                            onClick={() => setResetUserId(r.id)}
                        />
                    </Tooltip>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(r.id)}
                        disabled={r.username === currentUser?.username}
                    >
                        Delete
                    </Button>
                </>
            )
        }
    ];

    return (
        <Card title="Account Management" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add User</Button>}>
            <Table dataSource={users} columns={columns} rowKey="id" />
            <Modal
                title="Create User"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please input username!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input password!' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="admin">Admin</Option>
                            <Option value="teacher">Teacher</Option>
                            <Option value="parent">Parent</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="student_id"
                        label="Link Student ID (Parent only)"
                        help="System ID (e.g. 1)"
                    >
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Reset Password"
                open={!!resetUserId}
                onCancel={() => setResetUserId(null)}
                onOk={() => resetForm.submit()}
            >
                <Form form={resetForm} onFinish={handleResetPassword} layout="vertical">
                    <Form.Item name="new_password" label="New Password" rules={[{ required: true, min: 6 }]}>
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

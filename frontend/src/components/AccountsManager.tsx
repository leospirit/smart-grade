import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Popover, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, EyeOutlined, EyeInvisibleOutlined, KeyOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface AccountsManagerProps {
    currentUser: any;
    apiUrl: string;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({ currentUser, apiUrl }) => {
    const { t } = useTranslation();
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
        } catch (e: any) {
            console.error(e);
            if (e.response?.status === 401) {
                message.error('Session expired. Please login again.');
                // Optional: Redirect to login
            } else {
                message.error('Failed to load users');
            }
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
            message.success(t('accounts.user_created'));
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
            message.success(t('accounts.password_changed'));
            setResetUserId(null);
            resetForm.resetFields();
            fetchUsers();
        } catch (e: any) {
            message.error(t('common.error'));
        }
    };

    const columns = [
        { title: t('accounts.username'), dataIndex: 'username', key: 'username' },
        {
            title: t('accounts.role'),
            dataIndex: 'role',
            key: 'role',
            render: (r: string) => (
                <Tag color={r === 'admin' ? 'red' : (r === 'teacher' ? 'blue' : 'green')}>
                    {r.toUpperCase()}
                </Tag>
            )
        },
        {
            title: t('accounts.password'),
            key: 'password',
            align: 'center' as const,
            render: (_: any, r: any) => {
                if (r.is_password_changed) {
                    return (
                        <Tooltip title={t('accounts.password_changed')}>
                            <EyeInvisibleOutlined style={{ color: '#ccc', fontSize: '18px' }} />
                        </Tooltip>
                    );
                }
                return (
                    <Popover content={r.initial_password} title={t('accounts.initial_password')} trigger="click">
                        <EyeOutlined style={{ color: '#1890ff', fontSize: '18px', cursor: 'pointer' }} />
                    </Popover>
                );
            }
        },
        {
            title: t('common.action'),
            key: 'action',
            render: (_: any, r: any) => (
                <>
                    <Tooltip title={t('accounts.reset_password')}>
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
                        {t('common.delete')}
                    </Button>
                </>
            )
        }
    ];

    return (
        <Card title={t('menu.accounts')} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>{t('accounts.add_user')}</Button>}>
            <Table dataSource={users} columns={columns} rowKey="id" />
            <Modal
                title={t('accounts.add_user')}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item name="username" label={t('accounts.username')} rules={[{ required: true, message: 'Please input username!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label={t('accounts.password')} rules={[{ required: true, message: 'Please input password!' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="role" label={t('accounts.role')} rules={[{ required: true }]}>
                        <Select>
                            <Option value="admin">Admin</Option>
                            <Option value="teacher">Teacher</Option>
                            <Option value="parent">Parent</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="student_id"
                        label="Link Student ID (Parent only)"
                        help={t('accounts.username') === 'parent' ? "System ID" : ""}
                    >
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={t('accounts.reset_password')}
                open={!!resetUserId}
                onCancel={() => setResetUserId(null)}
                onOk={() => resetForm.submit()}
            >
                <Form form={resetForm} onFinish={handleResetPassword} layout="vertical">
                    <Form.Item name="new_password" label={t('accounts.password')} rules={[{ required: true, min: 6 }]}>
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Content } = Layout;

export const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            const formData = new FormData();
            formData.append('username', values.username);
            formData.append('password', values.password);

            const response = await axios.post(`${API_URL}/token`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            // Fetch user info to decide where to go
            const userRes = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const role = userRes.data.role;
            localStorage.setItem('role', role);
            if (userRes.data.student_id) {
                localStorage.setItem('student_id', userRes.data.student_id);
            }

            message.success('Login successful!');

            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/parent');
            }

        } catch (error) {
            message.error('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#1890ff' }}>Smart Grade Academy</Title>
                    <Typography.Text type="secondary">Parent & Teacher Portal</Typography.Text>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please input your Username!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Username / Student ID" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                            Log in
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Default Admin: admin / admin123
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Default Parent: StudentID / 123456
                        </Typography.Text>
                    </div>
                </Form>
            </Card>
        </Layout>
    );
};

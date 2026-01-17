import React, { useEffect, useState } from 'react';
import { Layout, Button, message, Spin, Result } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StudentReport } from '../components/StudentReport';
import { StudentAnalytics } from '../components/StudentAnalytics';
import { useReactToPrint } from 'react-to-print';

const { Header, Content } = Layout;

export const ParentDashboard: React.FC = () => {
    // ... (existing state & hooks)
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [radarData, setRadarData] = useState<any[]>([]);
    const [classAverage, setClassAverage] = useState<any>({});
    const [courseList, setCourseList] = useState<string[]>([]);

    // ... (existing useEffect & loadData)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        loadData(token);
    }, []);

    const loadData = async (token: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // 1. Get User Info (Role & Student ID)
            const userRes = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { student_id } = userRes.data;

            if (!student_id) {
                message.error('No student linked to this account.');
                return;
            }

            // 2. Load ALL students (For simplicity, to calculate Class Average/Rank contexts)
            const studentsRes = await axios.get(`${API_URL}/students`);
            const allStudents = studentsRes.data;
            const myStudent = allStudents.find((s: any) => s.id === student_id);

            if (!myStudent) {
                message.error('Student data not found.');
                setLoading(false);
                return;
            }

            setStudent(myStudent);

            // 3. Process Data for Charts
            if (myStudent.grades) {
                // Fetch Visibility
                const coursesRes = await axios.get(`${API_URL}/api/courses`);
                const visibleMap: Record<string, boolean> = {};
                coursesRes.data.forEach((c: any) => visibleMap[c.name] = c.is_visible);

                const allCourses = Object.keys(myStudent.grades);
                const courses = allCourses.filter(c => visibleMap[c] !== false); // Default True if missing
                setCourseList(courses);

                // Radar Data
                const rData = courses.map(course => {
                    const totalScore = allStudents.reduce((acc: number, s: any) => acc + (s.grades[course]?.total || 0), 0);
                    const avg = totalScore / allStudents.length;

                    return {
                        subject: course,
                        A: myStudent.grades[course]?.total || 0,
                        B: Number(avg.toFixed(1)),
                        fullMark: 100
                    };
                });
                setRadarData(rData);

                // Avg Obj
                const avgObj: any = {};
                courses.forEach(c => {
                    const totalScore = allStudents.reduce((acc: number, s: any) => acc + (s.grades[c]?.total || 0), 0);
                    avgObj[c] = totalScore / allStudents.length;
                });
                setClassAverage(avgObj);
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to load report data');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const printRef = React.useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: student ? `Report_${student.name}` : 'Report'
    } as any);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>;
    if (!student) return <Result status="404" title="Student Not Found" subTitle="Please contact the administrator." />;

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px #f0f1f2' }}>
                <div style={{ fontWeight: 'bold', fontSize: 18, color: '#1890ff' }}>
                    智能成绩单
                </div>
                <div>
                    <span style={{ marginRight: 16 }}>欢迎您，{student.name} 家长</span>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Button>
                </div>
            </Header>
            <Content style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ background: 'transparent', padding: '0 0 20px 0', textAlign: 'right' }}>
                    <Button type="primary" size="large" onClick={handlePrint} style={{ boxShadow: '0 4px 14px rgba(24, 144, 255, 0.4)' }}>
                        下载 / 打印 A4 成绩单
                    </Button>
                </div>

                {/* Dynamic Analytics View */}
                <StudentAnalytics
                    student={student}
                    courseList={courseList}
                    classAverage={classAverage}
                    radarData={radarData}
                />

                {/* Hidden Print Template */}
                <div style={{ display: 'none' }}>
                    <StudentReport
                        ref={printRef}
                        student={student}
                        courseList={courseList}
                        classAverage={classAverage}
                        radarData={radarData}
                    />
                </div>
            </Content>
        </Layout>
    );
};

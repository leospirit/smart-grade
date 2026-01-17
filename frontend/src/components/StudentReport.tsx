import React from 'react';
import { Card, Table, Row, Col, Typography, Divider } from 'antd';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

interface StudentReportProps {
    student: any;
    courseList: string[];
    classAverage: any;
    radarData: any[];
}

export const StudentReport = React.forwardRef<HTMLDivElement, StudentReportProps>(({ student, courseList, classAverage, radarData }, ref) => {
    if (!student) return null;

    // Prepare table data
    const dataSource = courseList.map(course => {
        const score = student.grades[course]?.total || 0;
        const avg = classAverage[course] || 0;
        const diff = score - avg;
        return {
            key: course,
            subject: course,
            score: score,
            average: avg.toFixed(1),
            diff: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
            rank: 'Top 20%' // Placeholder for rank
        };
    });

    const columns = [
        { title: 'Subject', dataIndex: 'subject', key: 'subject' },
        { title: 'My Score', dataIndex: 'score', key: 'score', render: (val: number) => <b>{val}</b> },
        { title: 'Class Avg', dataIndex: 'average', key: 'average' },
        { title: 'Diff', dataIndex: 'diff', key: 'diff', render: (val: string) => <span style={{ color: val.startsWith('+') ? 'green' : 'red' }}>{val}</span> },
    ];

    return (
        <div ref={ref} style={{ padding: '15mm', background: 'white', width: '210mm', height: '296mm', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #1890ff', paddingBottom: 10 }}>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>Smart Grade Academy</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Official Academic Report - Semester 1, 2024</Text>
            </div>

            {/* Student Info */}
            <Card bordered={false} style={{ background: '#f5faff', marginBottom: 20 }} bodyStyle={{ padding: 12 }}>
                <Row gutter={24}>
                    <Col span={8}>
                        <Text type="secondary">Student Name</Text>
                        <Title level={4} style={{ margin: 0 }}>{student.name}</Title>
                    </Col>
                    <Col span={8}>
                        <Text type="secondary">Student ID</Text>
                        <Title level={4} style={{ margin: 0 }}>{student.student_number}</Title>
                    </Col>
                    <Col span={8}>
                        <Text type="secondary">Class</Text>
                        <Title level={4} style={{ margin: 0 }}>{student.grade_name} {student.class_name}</Title>
                    </Col>
                </Row>
            </Card>

            {/* Main Content: Radar + Table */}
            <Row gutter={40} align="middle" style={{ marginBottom: 20 }}>
                <Col span={12}>
                    <div style={{ textAlign: 'center', marginBottom: 5 }}>
                        <Title level={5}>Performance Radar</Title>
                    </div>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <RadarChart outerRadius={90} data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" style={{ fontSize: 12 }} />
                                <PolarRadiusAxis domain={[0, 100]} angle={30} tick={false} />
                                <Radar name="Student" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.4} />
                                <Radar name="Class Avg" dataKey="B" stroke="#52c41a" fill="#52c41a" fillOpacity={0.1} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Col>
                <Col span={12}>
                    <div style={{ textAlign: 'center', marginBottom: 5 }}>
                        <Title level={5}>Score Details</Title>
                    </div>
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        size="small"
                        bordered
                    />
                </Col>
            </Row>

            {/* Footer Comments */}
            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <Card title="Teacher's Comments" bordered style={{ marginBottom: 20, minHeight: 120 }} bodyStyle={{ padding: 12 }}>
                    <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>
                        {student.name} has shown excellent progress this semester. Specifically strong in {courseList[0]} and {courseList[1]}.
                        Keep up the good work!
                    </p>
                </Card>

                <Row style={{ marginTop: 40 }}>
                    <Col span={12} style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: 10 }}>
                            Class Teacher Signature
                        </div>
                    </Col>
                    <Col span={12} style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: 10 }}>
                            Principal Signature
                        </div>
                    </Col>
                </Row>

                <div style={{ textAlign: 'center', marginTop: 20, color: '#ccc', fontSize: 10 }}>
                    Generated by Smart Grade Platform on {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
});

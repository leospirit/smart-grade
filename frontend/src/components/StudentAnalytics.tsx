import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography, Segmented } from 'antd';
import { TrophyOutlined, RiseOutlined, BookOutlined, StarOutlined } from '@ant-design/icons';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';

const { Title } = Typography;

interface StudentAnalyticsProps {
    student: any;
    courseList: string[];
    classAverage: any;
    radarData: any[]; // { subject, A (Student), B (ClassAvg), fullMark }
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ student, courseList, classAverage, radarData }) => {
    const [activeView, setActiveView] = useState<string>('总览');

    // 1. Prepare Bar Data (Comparison)
    const barData = courseList.map(c => ({
        subject: c,
        MyScore: student.grades[c]?.total || 0,
        ClassAvg: Number((classAverage[c] || 0).toFixed(1))
    }));

    // 2. Compute Summary Stats
    const myTotal = courseList.reduce((acc, c) => acc + (student.grades[c]?.total || 0), 0);
    const myAvg = myTotal / (courseList.length || 1);

    // Simple logic for "Best Subject"
    let bestSubject = '-';
    let localMax = -1;
    courseList.forEach(c => {
        const val = student.grades[c]?.total || 0;
        if (val > localMax) {
            localMax = val;
            bestSubject = c;
        }
    });

    // 3. Prepare Sub-Item Data for specific subject
    const getSubItemData = (subject: string) => {
        const details = student.grades[subject]?.details || {};
        return Object.keys(details).map(key => ({
            subject: key,
            A: details[key],
            fullMark: 100
        }));
    };

    const currentRadarData = activeView === '总览' ? radarData : getSubItemData(activeView);

    return (
        <div>
            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="我的平均分"
                            value={myAvg}
                            precision={1}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<RiseOutlined />}
                            suffix="分"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="优势学科"
                            value={bestSubject}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<StarOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="考试科目"
                            value={courseList.length}
                            prefix={<BookOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="班级排名"
                            value="前 20%"
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                        <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>* 预估排名</div>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={24}>
                {/* Radar Chart */}
                <Col xs={24} md={12} style={{ marginBottom: 24 }}>
                    <Card
                        title="能力雷达"
                        bordered={false}
                        hoverable
                        bodyStyle={{ height: 440, display: 'flex', flexDirection: 'column' }}
                        extra={
                            <Segmented
                                options={['总览', ...courseList]}
                                value={activeView}
                                onChange={(val) => setActiveView(val.toString())}
                            />
                        }
                    >
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart outerRadius="70%" data={currentRadarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar
                                        name="我的得分"
                                        dataKey="A"
                                        stroke="#1890ff"
                                        fill="#1890ff"
                                        fillOpacity={0.6}
                                    />
                                    {activeView === '总览' && (
                                        <Radar
                                            name="班级平均"
                                            dataKey="B"
                                            stroke="#52c41a"
                                            fill="#52c41a"
                                            fillOpacity={0.2}
                                        />
                                    )}
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Comparison Bar Chart */}
                <Col xs={24} md={12} style={{ marginBottom: 24 }}>
                    <Card title="学科对比" bordered={false} hoverable bodyStyle={{ height: 440 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={barData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="subject" type="category" width={80} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="MyScore" name="我的得分" fill="#1890ff" barSize={20}>
                                    <LabelList dataKey="MyScore" position="right" />
                                </Bar>
                                <Bar dataKey="ClassAvg" name="班级平均" fill="#82ca9d" barSize={20}>
                                    <LabelList dataKey="ClassAvg" position="right" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            <Card title="教师评语" bordered={false} hoverable>
                <Typography.Paragraph>
                    <blockquote>
                        在 <b>{bestSubject}</b> 学科表现优异！您的分数显著高于班级平均水平。
                        请继续保持这种良好的学习势头。
                    </blockquote>
                </Typography.Paragraph>
                <div style={{ textAlign: 'right' }}>
                    <Tag color="blue">学习表现</Tag>
                    <Tag color="cyan">日常习惯</Tag>
                </div>
            </Card>
        </div>
    );
};

import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface Student {
    id: number;
    name: string;
    grade_name: string;
    class_name: string;
    grades: Record<string, { total: number; details: any }>;
}

interface ClassStatisticsProps {
    students: Student[];
    courseName: string; // 'All' or specific subject
    courseList: string[];
}

const COLORS = ['#52c41a', '#1890ff', '#faad14', '#f5222d']; // Excellent, Good, Standard, Fail

export const ClassStatistics: React.FC<ClassStatisticsProps> = ({ students, courseName, courseList }) => {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        if (students.length === 0) return null;

        let scores: number[] = [];
        const studentScores: { name: string, score: number, class_name: string }[] = [];

        students.forEach(s => {
            let score = 0;
            if (courseName === 'All') {
                // For 'All', we calculate the average of all subjects for this student
                const validCourses = courseList.filter(c => s.grades[c]);
                if (validCourses.length > 0) {
                    const total = validCourses.reduce((acc, c) => acc + s.grades[c].total, 0);
                    score = total / validCourses.length;
                    scores.push(score);
                    studentScores.push({ name: s.name, score, class_name: s.class_name });
                }
            } else {
                if (s.grades[courseName]) {
                    score = s.grades[courseName].total;
                    scores.push(score);
                    studentScores.push({ name: s.name, score, class_name: s.class_name });
                }
            }
        });

        if (scores.length === 0) return null;

        const max = Math.max(...scores);
        const min = Math.min(...scores);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Segments
        const segments = {
            full: 0, // 100
            s95: 0, // 95-99
            s90: 0, // 90-94
            s85: 0, // 85-89
            s75: 0, // 75-84
            s60: 0, // 60-74
            fail: 0 // <60
        };

        let excellent = 0; // >= 85
        let good = 0; // 75-84
        let standard = 0; // 60-74
        let pass = 0; // >= 60

        scores.forEach(s => {
            // Rates
            if (s >= 85) excellent++;
            if (s >= 75 && s < 85) good++;
            if (s >= 60 && s < 75) standard++;
            if (s >= 60) pass++;

            // Segments
            if (s === 100) segments.full++;
            else if (s >= 95) segments.s95++;
            else if (s >= 90) segments.s90++;
            else if (s >= 85) segments.s85++;
            else if (s >= 75) segments.s75++;
            else if (s >= 60) segments.s60++;
            else segments.fail++;
        });

        const count = scores.length;

        return {
            count,
            max,
            min,
            avg,
            rates: {
                excellent: (excellent / count) * 100,
                good: (good / count) * 100,
                standard: (standard / count) * 100,
                pass: (pass / count) * 100,
                failRate: ((count - pass) / count) * 100
            },
            counts: {
                excellent, good, standard, pass, fail: count - pass
            },
            segments
        };
    }, [students, courseName, courseList]);

    const classComparison = useMemo(() => {
        if (!students.length) return [];
        // Group by class
        const classMap: Record<string, { sum: number, count: number }> = {};
        students.forEach(s => {
            let score = 0;
            if (courseName === 'All') {
                const validCourses = courseList.filter(c => s.grades[c]);
                if (validCourses.length > 0) {
                    score = validCourses.reduce((acc, c) => acc + s.grades[c].total, 0) / validCourses.length;
                } else return; // Skip if no grades
            } else {
                if (s.grades[courseName]) score = s.grades[courseName].total;
                else return;
            }

            if (!classMap[s.class_name]) classMap[s.class_name] = { sum: 0, count: 0 };
            classMap[s.class_name].sum += score;
            classMap[s.class_name].count++;
        });

        return Object.entries(classMap).map(([cls, data]) => ({
            name: cls,
            avg: parseFloat((data.sum / data.count).toFixed(1))
        })).sort((a, b) => b.avg - a.avg); // Sort descending
    }, [students, courseName, courseList]);


    if (!stats) return <Empty description={t('common.loading')} />; // Or No Data

    const pieData = [
        { name: t('stats.excellent_rate'), value: stats.counts.excellent },
        { name: t('stats.good_rate'), value: stats.counts.good },
        { name: t('stats.standard_rate'), value: stats.counts.standard },
        { name: t('stats.fail_rate'), value: stats.counts.fail },
    ];

    const segmentData = [
        { range: '100 (Full)', count: stats.segments.full },
        { range: '95-99', count: stats.segments.s95 },
        { range: '90-94', count: stats.segments.s90 },
        { range: '85-89', count: stats.segments.s85 },
        { range: '75-84', count: stats.segments.s75 },
        { range: '60-74', count: stats.segments.s60 },
        { range: '< 60', count: stats.segments.fail },
    ];

    return (
        <div style={{ marginTop: 24 }}>
            {/* Top Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic title={t('stats.avg_score')} value={stats.avg} precision={1} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title={t('stats.max_score')} value={stats.max} valueStyle={{ color: '#3f8600' }} prefix={<ArrowUpOutlined />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title={t('stats.min_score')} value={stats.min} valueStyle={{ color: '#cf1322' }} prefix={<ArrowDownOutlined />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title={t('stats.pass_rate')} value={stats.rates.pass} precision={1} suffix="%" valueStyle={{ color: stats.rates.pass >= 60 ? '#3f8600' : '#cf1322' }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card title={t('stats.score_distribution')}>
                        <Row align="middle">
                            <Col span={12}>
                                <div style={{ marginBottom: 16 }}>
                                    <span>{t('stats.excellent_rate')} (&ge;85)</span>
                                    <Progress percent={parseFloat(stats.rates.excellent.toFixed(1))} strokeColor="#52c41a" />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <span>{t('stats.good_rate')} (75-84)</span>
                                    <Progress percent={parseFloat(stats.rates.good.toFixed(1))} strokeColor="#1890ff" />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <span>{t('stats.standard_rate')} (60-74)</span>
                                    <Progress percent={parseFloat(stats.rates.standard.toFixed(1))} strokeColor="#faad14" />
                                </div>
                                <div>
                                    <span>{t('stats.fail_rate')} (&lt;60)</span>
                                    <Progress percent={parseFloat(stats.rates.failRate.toFixed(1))} strokeColor="#f5222d" />
                                </div>
                            </Col>
                            <Col span={12} style={{ height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col span={12}>
                    {classComparison.length > 1 ? (
                        <Card title={t('stats.class_comparison')}>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={classComparison} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <RechartsTooltip />
                                        <Bar dataKey="avg" fill="#8884d8" name={t('stats.avg_score')} label={{ position: 'right' }} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    ) : (
                        <Card title={t('stats.segmentation')}>
                            <Table
                                dataSource={segmentData}
                                columns={[
                                    { title: t('stats.range'), dataIndex: 'range', key: 'range' },
                                    { title: t('stats.count'), dataIndex: 'count', key: 'count' },
                                    { title: t('stats.percentage'), key: 'percent', render: (_, r) => `${((r.count / stats.count) * 100).toFixed(1)}%` },
                                ]}
                                pagination={false}
                                size="small"
                                rowKey="range"
                            />
                        </Card>
                    )}
                </Col>
            </Row>

            {/* If we showed comparison above, show segment table below */}
            {classComparison.length > 1 && (
                <Card title={t('stats.segmentation')}>
                    <Table
                        dataSource={segmentData}
                        columns={[
                            { title: t('stats.range'), dataIndex: 'range', key: 'range' },
                            { title: t('stats.count'), dataIndex: 'count', key: 'count' },
                            { title: t('stats.percentage'), key: 'percent', render: (_, r) => `${((r.count / stats.count) * 100).toFixed(1)}%` },
                        ]}
                        pagination={false}
                        size="small"
                        rowKey="range"
                    />
                </Card>
            )}
        </div>
    );
};

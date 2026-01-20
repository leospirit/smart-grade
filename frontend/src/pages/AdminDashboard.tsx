import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Menu, Button, Upload, Table, message, Card, Statistic, Row, Col, Select, Segmented, Dropdown, Input, Modal, Steps, Divider, Alert, Form, Space, Avatar } from 'antd';
import { UploadOutlined, UserOutlined, BookOutlined, BarChartOutlined, InboxOutlined, EyeOutlined, EyeInvisibleOutlined, CloudUploadOutlined, LineChartOutlined, DeleteOutlined, PlusOutlined, ArrowRightOutlined, KeyOutlined, GlobalOutlined, DownOutlined, LogoutOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, LabelList, LineChart, Line } from 'recharts';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useReactToPrint } from 'react-to-print';
import { StudentReport } from '../components/StudentReport';
import { CSS } from '@dnd-kit/utilities';
import { AccountsManager } from '../components/AccountsManager';
import { ClassStatistics } from '../components/ClassStatistics';
const { Header, Content, Footer, Sider } = Layout;
const { Dragger } = Upload;
const { Option } = Select;

// --- Sortable Item Wrapper ---
const SortableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    breakInside: 'avoid' as any, // Prevent print break
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// --- API Client --- 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Assuming local backend

interface GradeDetail {
  total: number;
  details: Record<string, any>;
}

interface Student {
  id: number;
  student_number: string;
  name: string;
  grade_name: string;
  class_name: string;
  grades: Record<string, GradeDetail>;
}

export const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('analytics');

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
  };

  const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial data
    fetchStudents();
    fetchCourseVisibility();
    checkConnection();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch user info");
    }
  };
  const [courseName, setCourseName] = useState('English'); // Moved up
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [importFileKey, setImportFileKey] = useState('');
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState({ student_id: '', name: '', total_score: '' });
  const [isImporting, setIsImporting] = useState(false);

  // --- Connectivity Debug ---
  const [connStatus, setConnStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  const checkConnection = async () => {
    setConnStatus({ type: 'info', msg: 'Pinging server...' });
    try {
      await axios.get(`${API_URL}/courses`); // Check courses endpoint which exists under /api
      setConnStatus({ type: 'success', msg: `Connected successfully to ${API_URL}` });
    } catch (e: any) {
      setConnStatus({ type: 'error', msg: `Failed to connect to ${API_URL}. Error: ${e.message}` });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);
  const [courseList, setCourseList] = useState<string[]>([]);
  const [courseVisibility, setCourseVisibility] = useState<Record<string, boolean>>({});
  const [selectedAnalysisCourse, setSelectedAnalysisCourse] = useState<string>('');
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [passForm] = Form.useForm();

  const handleChangePassword = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/me/password`, {
        old_password: values.old_password,
        new_password: values.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Password changed successfully');
      setIsChangePassOpen(false);
      passForm.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Failed to change password');
    }
  };

  const handlePreview = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/upload/preview`, formData);
      setImportFileKey(res.data.file_key);
      setImportColumns(res.data.columns);
      setPreviewData(res.data.preview);

      // Auto-guess mapping
      const cols = res.data.columns as string[];
      const newMapping = { student_id: '', name: '', total_score: '' };

      cols.forEach(c => {
        const cs = c.toLowerCase();
        if (cs.includes('学号') || cs.includes('id') || cs.includes('no')) newMapping.student_id = c;
        if (cs.includes('姓名') || cs.includes('name')) newMapping.name = c;
        if (cs.includes('总分') || cs.includes('total') || cs.includes('score') || cs.includes('成绩')) newMapping.total_score = c;
      });
      setMapping(newMapping);

      setCurrentStep(1);
      onSuccess("Ok");
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.detail || "Upload failed: " + err.message);
      onError(err);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setIsImporting(true);
      const res = await axios.post(`${API_URL}/upload/confirm`, {
        file_key: importFileKey,
        course_name: courseName,
        mapping: mapping
      });
      message.success(res.data.message);
      setIsWizardOpen(false);
      setCurrentStep(0);
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.detail || "Import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const fetchCourseVisibility = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      const map: Record<string, boolean> = {};
      res.data.forEach((c: any) => map[c.name] = c.is_visible);
      setCourseVisibility(map);
    } catch (e) {
      console.error("Failed to fetch visibility", e);
    }
  };

  const handleToggleVisibility = async (courseName: string) => {
    try {
      const res = await axios.put(`${API_URL}/courses/${courseName}/toggle`);
      message.success(res.data.message);
      // Update local state immediately for snappy UI
      setCourseVisibility(prev => ({
        ...prev,
        [courseName]: !prev[courseName]
      }));
      // Then background refresh
      fetchCourseVisibility();
    } catch (error) {
      message.error('Failed to toggle visibility');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    // Refresh visibility map too
    fetchCourseVisibility();

    try {
      const res = await axios.get(`${API_URL}/students?limit=2000`);
      setStudents(res.data);

      // Extract unique courses
      const courses = new Set<string>();
      res.data.forEach((s: any) => {
        Object.keys(s.grades).forEach(c => courses.add(c));
      });
      setCourseList(Array.from(courses));
      if (!selectedAnalysisCourse && courses.size > 0) {
        setSelectedAnalysisCourse(Array.from(courses)[0]);
      }

    } catch (err) {
      console.error(err);
      message.error("Failed to fetch students. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeTab]);

  // --- Components ---

  const UploadRoster = () => {
    const props = {
      name: 'file',
      multiple: false,
      action: `${API_URL}/upload/roster`,
      onChange(info: any) {
        const { status } = info.file;
        if (status === 'done') {
          message.success(`${info.file.name} Roster uploaded successfully.`);
          fetchStudents();
        } else if (status === 'error') {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
    };

    return (
      <Card title={t('menu.roster')} bordered={false}>
        <p style={{ marginBottom: 20 }}>{t('upload.support_excel')} (Student ID, Name, Class).</p>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">{t('upload.click_to_upload')}</p>
        </Dragger>
      </Card>
    )
  };

  const UploadGrade = () => {
    return (
      <Card title={t('menu.grades')} bordered={false}>
        <div style={{ marginBottom: 20 }}>
          <span>{t('analytics.subject')}: </span>
          <Select
            style={{ width: 200 }}
            value={courseName}
            onChange={setCourseName}
            showSearch
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
                  <Input.Search
                    placeholder={t('common.search')}
                    enterButton={<PlusOutlined />}
                    size="small"
                    onSearch={(val) => {
                      if (val) setCourseName(val);
                    }}
                  />
                </div>
              </>
            )}
          >
            {courseList.map(c => <Option key={c} value={c}>{c}</Option>)}
            {/* Presets if empty */}
            {!courseList.includes('English') && <Option value="English">English</Option>}
            {!courseList.includes('Math') && <Option value="Math">Math</Option>}
          </Select>
        </div>

        <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setIsWizardOpen(true)} size="large" block style={{ height: 60, fontSize: 18 }}>
          {t('upload.confirm_import')}
        </Button>
        <p style={{ marginTop: 10, color: '#666' }}>{t('upload.support_excel')}</p>
        <p style={{ fontSize: 12, color: '#999' }}>{t('upload.select_columns')}</p>

        <Modal
          title={t('menu.grades')}
          open={isWizardOpen}
          onCancel={() => setIsWizardOpen(false)}
          footer={currentStep === 1 ? [
            <Button key="back" onClick={() => setCurrentStep(0)}>{t('common.cancel')}</Button>,
            <Button key="submit" type="primary" loading={isImporting} onClick={handleConfirmImport}>{t('upload.confirm_import')}</Button>
          ] : null}
          width={800}
        >
          <Steps current={currentStep} items={[
            { title: 'Upload File' },
            { title: 'Map Columns' },
            { title: 'Done' }
          ]} style={{ marginBottom: 24 }} />

          {currentStep === 0 && (
            <Dragger customRequest={handlePreview} showUploadList={false} height={200}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Upload Excel file. We will detect headers automatically.</p>
            </Dragger>
          )}

          {currentStep === 1 && (
            <div>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Student ID (学号)">
                    <Select value={mapping.student_id} onChange={v => setMapping({ ...mapping, student_id: v })}>
                      {importColumns.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Name (姓名)">
                    <Select value={mapping.name} onChange={v => setMapping({ ...mapping, name: v })}>
                      {importColumns.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Score (总分)">
                    <Select value={mapping.total_score} onChange={v => setMapping({ ...mapping, total_score: v })}>
                      <Option value="">(Auto Calculate / None)</Option>
                      {importColumns.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Preview Data</Divider>
              <p style={{ fontSize: 12, color: '#999' }}>First 3 rows:</p>
              <Table
                dataSource={previewData}
                columns={importColumns.slice(0, 8).map(c => ({ title: c, dataIndex: c, key: c }))}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />

              <div style={{ marginTop: 20, background: '#f6ffed', padding: 10, border: '1px solid #b7eb8f', borderRadius: 4 }}>
                <p><b style={{ color: '#52c41a' }}>Note:</b> Unmapped columns will be imported as <b>Sub-Scores</b> (e.g. Listening, Reading).</p>
              </div>
            </div>
          )}
        </Modal>
      </Card>
    );
  }

  const StudentTable = () => {
    // Dynamic columns based on courses
    // Get unique classes for filtering
    const classFilters = Array.from(new Set(students.map(s => s.class_name))).map(c => ({ text: c, value: c }));

    const columns: any[] = [
      { title: 'ID', dataIndex: 'student_number', key: 'student_number', width: 100, fixed: 'left' },
      { title: t('analytics.student'), dataIndex: 'name', key: 'name', width: 100, fixed: 'left' },
      {
        title: t('analytics.class'),
        dataIndex: 'class_name',
        key: 'class_name',
        width: 100,
        filters: classFilters,
        onFilter: (value: string, record: Student) => record.class_name === value,
      },
    ];

    // Add columns for each course found
    courseList.forEach(c => {
      const isVisible = courseVisibility[c] !== false; // Default true
      columns.push({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {c}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(c);
                }}
                style={{ cursor: 'pointer', marginLeft: 8, color: isVisible ? '#52c41a' : '#bfbfbf' }}
                title={isVisible ? t('common.visible') : t('common.hidden')}
              >
                {isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </span>
            </div>
            <DeleteOutlined
              style={{ color: 'red', cursor: 'pointer', marginLeft: 8 }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(t('accounts.delete_confirm'))) {
                  handleDeleteCourse(c);
                }
              }}
            />
          </div>
        ),
        key: c,
        fixed: 'left',
        width: 150,
        dataIndex: ['grades', c, 'total'],
        render: (_: any, record: Student) => {
          const g = record.grades[c];
          if (!g) return '-';
          return (
            <div>
              <span style={{ fontWeight: 'bold', color: g.total < 60 ? 'red' : 'inherit' }}>{g.total}</span>
            </div>
          )
        }
      });
    });

    const handleDeleteCourse = async (courseName: string) => {
      try {
        await axios.delete(`${API_URL}/courses/${courseName}`);
        message.success(`Course ${courseName} deleted successfully.`);
        fetchStudents(); // Refresh
      } catch (error) {
        message.error('Failed to delete course');
      }
    };

    const handleExport = (className?: string) => {
      const url = `${API_URL}/export/roster${className ? `?class_name=${className}` : ''}`;
      window.open(url, '_blank');
    };

    return (
      <Card title={t('menu.roster')} extra={
        <Button type="primary" icon={<UploadOutlined />} onClick={() => handleExport()}>
          {t('common.upload')} / Export
        </Button>
      }>
        <Table
          dataSource={students}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          expandable={{
            expandedRowRender: (record: any) => {
              return (
                <div style={{ padding: 20 }}>
                  <h4>Detail Breakdown:</h4>
                  {Object.keys(record.grades).map(c => (
                    <div key={c} style={{ marginBottom: 10 }}>
                      <b>{c}: </b>
                      {Object.entries(record.grades[c].details).map(([k, v]) => (
                        <span key={k} style={{ marginRight: 15, background: '#eee', padding: '2px 8px', borderRadius: 4 }}>{k}: {String(v)}</span>
                      ))}
                    </div>
                  ))}
                </div>
              )
            }
          }}
        />
      </Card>
    );
  }

  const Analytics = () => {
    const [chartMode, setChartMode] = useState<string>('Radar');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string>('All');
    const [isVisModalOpen, setIsVisModalOpen] = useState(false);

    // Auto-select if only one course
    useEffect(() => {
      if (courseList.length === 1) setSelectedCourse(courseList[0]);
    }, [courseList]);

    // Sync Class/Grade when Student Selected
    useEffect(() => {
      if (selectedStudentId) {
        const s = students.find(st => st.id === Number(selectedStudentId));
        if (s) {
          if (s.grade_name && s.grade_name !== selectedGrade) setSelectedGrade(s.grade_name);
          if (!selectedClass.includes(s.class_name)) setSelectedClass([s.class_name]);
        }
      }
    }, [selectedStudentId]);

    // Grade/Class Filter State
    const [selectedGrade, setSelectedGrade] = useState<string>('All');
    const [selectedClass, setSelectedClass] = useState<string[]>(['All']);

    // Scatter Plot State
    const [scatterX, setScatterX] = useState<string>(courseList[0] || 'English');
    const [scatterY, setScatterY] = useState<string>(courseList[1] || 'Math');

    // Report Board State
    const [reportItems, setReportItems] = useState(['Radar', 'Bar', 'Scatter', 'Heatmap']);
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5, // Require 5px movement to start drag, allowing clicks on buttons
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setReportItems((items) => {
          const oldIndex = items.indexOf(active.id as string);
          const newIndex = items.indexOf(over.id as string);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    const handleRemoveChart = (id: string) => {
      setReportItems(prev => prev.filter(item => item !== id));
    };

    const handleResetLayout = () => {
      setReportItems(['Radar', 'Bar', 'Scatter', 'Heatmap']);
    };

    // --- Computed Filters ---

    // 1. Available Grades
    const availableGrades = Array.from(new Set(students.map(s => s.grade_name || 'Default Grade'))).sort();

    // 2. Available Classes (dependent on selectedGrade)
    const availableClasses = Array.from(new Set(
      students
        .filter(s => selectedGrade === 'All' || s.grade_name === selectedGrade)
        .map(s => s.class_name)
    )).sort();

    // 3. Filtered Students (Source of Truth for Charts)
    // 3. Filtered Students (Source of Truth for Charts)
    const filteredStudents = students.filter(s => {
      const matchGrade = selectedGrade === 'All' || s.grade_name === selectedGrade;
      // Multi-class filter: if 'All' is present, ignore filter. Else check inclusion.
      const matchClass = selectedClass.includes('All') || selectedClass.includes(s.class_name);
      return matchGrade && matchClass;
    });

    // Reset Class when Grade changes
    // Reset Class when Grade changes
    useEffect(() => {
      if (selectedGrade !== 'All') setSelectedClass(['All']);
    }, [selectedGrade]);

    // --- Data Preparation ---

    // 1. Radar Data (Existing Logic, use filteredStudents)
    const getRadarData = () => {
      let data: any[] = [];
      if (selectedCourse === 'All') {
        const averages = courseList.map(c => {
          let sum = 0, count = 0;
          filteredStudents.forEach((s) => {
            if (s.grades[c]) { sum += s.grades[c].total; count += 1; }
          });
          return { subject: c, fullMark: 100, ClassAvg: count ? parseFloat((sum / count).toFixed(1)) : 0 };
        });
        data = [...averages];
        if (selectedStudentId) {
          const student = students.find((s) => s.id === Number(selectedStudentId));
          if (student) {
            data = data.map(item => ({ ...item, StudentScore: student.grades[item.subject]?.total || 0 }));
          }
        }
      } else {
        // Drilldown
        const subItemStats: Record<string, { sum: number, count: number }> = {};
        filteredStudents.forEach(s => {
          const g = s.grades[selectedCourse];
          if (g && g.details) {
            Object.entries(g.details).forEach(([key, val]) => {
              if (!subItemStats[key]) subItemStats[key] = { sum: 0, count: 0 };
              subItemStats[key].sum += Number(val);
              subItemStats[key].count += 1;
            });
          }
        });
        data = Object.keys(subItemStats).map(key => ({
          subject: key,
          fullMark: 50,
          ClassAvg: parseFloat((subItemStats[key].sum / subItemStats[key].count).toFixed(1))
        }));
        if (selectedStudentId) {
          const student = students.find((s) => s.id === Number(selectedStudentId));
          const g = student?.grades[selectedCourse];
          if (g && g.details) {
            data = data.map(item => ({ ...item, StudentScore: g.details[item.subject] || 0 }));
          }
        }
      }
      return data;
    };

    // Updated data getters to use filteredStudents

    // 2. Bar Data
    const getBarData = () => {
      const bins = [
        { name: '<60', min: 0, max: 59, count: 0 },
        { name: '60-69', min: 60, max: 69, count: 0 },
        { name: '70-79', min: 70, max: 79, count: 0 },
        { name: '80-89', min: 80, max: 89, count: 0 },
        { name: '90-100', min: 90, max: 100, count: 0 },
      ];
      filteredStudents.forEach(s => {
        let score = 0;
        if (selectedCourse === 'All') {
          const validCourses = courseList.filter(c => s.grades[c]);
          if (validCourses.length > 0) {
            const total = validCourses.reduce((acc, c) => acc + s.grades[c].total, 0);
            score = total / validCourses.length;
          }
        } else {
          score = s.grades[selectedCourse]?.total || 0;
        }
        const bin = bins.find(b => score >= b.min && score <= b.max);
        if (bin) bin.count++;
      });
      return bins;
    };

    // 3. Scatter Data
    const getScatterData = () => {
      return filteredStudents.map(s => ({
        name: s.name,
        x: s.grades[scatterX]?.total || 0,
        y: s.grades[scatterY]?.total || 0,
      }));
    };

    // 4. Trend Data (Line Chart)
    const getTrendData = () => {
      if (!selectedStudentId || selectedCourse === 'All') return [];
      const student = students.find(s => s.id === Number(selectedStudentId));
      if (!student) return [];
      const g = student.grades[selectedCourse];
      if (!g || !g.details) return [];

      // Convert details map to array
      return Object.entries(g.details).map(([key, val]) => ({
        name: key, // "Midterm", "Final" etc.
        score: Number(val)
      }));
    };

    // 5. Heatmap Data (Use filteredStudents inside renderer)
    const getHeatmapStudents = () => filteredStudents;


    // --- Renderers ---

    const renderTrend = () => {
      const data = getTrendData();
      if (data.length === 0) {
        return (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            {t('analytics.trend_placeholder')}
          </div>
        )
      }
      return (
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    };

    const renderRadar = () => (
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tickFormatter={(val) => {
            // Try to find translation for known subjects, otherwise fallback to val
            return i18n.exists(`subjects.${val}`) ? t(`subjects.${val}`) : val;
          }} />
          <PolarRadiusAxis angle={30} />
          <Radar name={t('stats.avg_score')} dataKey="ClassAvg" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          {selectedStudentId && <Radar name={t('analytics.student')} dataKey="StudentScore" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.8} />}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );

    const renderBar = () => (
      <ResponsiveContainer>
        <BarChart data={getBarData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8">
            <LabelList dataKey="count" position="top" />
            {/* Optional: color bars based on grade? */}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    const renderScatter = () => (
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name={scatterX} unit="pts" domain={[0, 100]} />
          <YAxis type="number" dataKey="y" name={scatterY} unit="pts" domain={[0, 100]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name={t('analytics.student')} data={getScatterData()} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    );

    const renderHeatmap = (limit?: number) => {
      // Simple Grid Implementation
      // Color scale: Red (0) -> Yellow (60) -> Green (100)
      const getColor = (score: number) => {
        if (score < 60) return `rgba(255, 0, 0, ${1 - score / 60})`; // Fading red? Or just solid codes.
        // Simple stepped colors
        if (score < 60) return '#ffccc7'; // Red-ish
        if (score < 70) return '#ffe58f'; // Yellow-ish
        if (score < 80) return '#d3f261'; // Lime
        if (score < 90) return '#b7eb8f'; // Green
        return '#52c41a'; // Dark Green
      };

      let studentsToRender = getHeatmapStudents();
      if (chartMode === 'Report' && selectedStudentId) {
        studentsToRender = studentsToRender.filter(s => s.id === Number(selectedStudentId));
      } else if (limit) {
        studentsToRender = studentsToRender.slice(0, limit);
      }

      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: 8, border: '1px solid #eee' }}>{t('analytics.student')}</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>{t('analytics.class')}</th>
                {courseList.map(c => <th key={c} style={{ padding: 8, border: '1px solid #eee' }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {studentsToRender.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: 8, border: '1px solid #eee', fontWeight: 'bold' }}>{s.name}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{s.grade_name} {s.class_name}</td>
                  {courseList.map(c => {
                    const score = s.grades[c]?.total || 0;
                    return (
                      <td key={c} style={{
                        padding: 8,
                        border: '1px solid #eee',
                        textAlign: 'center',
                        backgroundColor: getColor(score),
                        color: score >= 90 ? '#fff' : '#000'
                      }}>
                        {score}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {limit && !selectedStudentId && getHeatmapStudents().length > limit && (
            <div style={{ textAlign: 'center', padding: 8, fontStyle: 'italic', color: '#888' }}>
              {t('analytics.more_students', { count: getHeatmapStudents().length - limit })}
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 20 }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Segmented
                options={[
                  { label: t('analytics.radar'), value: 'Radar', icon: <BarChartOutlined /> },
                  { label: t('analytics.distribution'), value: 'Bar', icon: <BarChartOutlined rotate={90} /> },
                  { label: t('analytics.trend'), value: 'Trend', icon: <LineChartOutlined /> },
                  { label: t('analytics.scatter'), value: 'Scatter', icon: <BarChartOutlined /> },
                  { label: t('analytics.map'), value: 'Heatmap', icon: <BookOutlined /> },
                  { label: t('analytics.report'), value: 'Report', icon: <InboxOutlined /> },
                  { label: t('analytics.stats'), value: 'Stats', icon: <BarChartOutlined /> },
                ]}
                value={chartMode}
                onChange={setChartMode}
                size="large"
              />
              {chartMode === 'Report' && (
                <>
                  <Select
                    placeholder={t('analytics.select_student')}
                    style={{ width: 200, marginLeft: 16 }}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                  >
                    {filteredStudents.map(s => (
                      <Option key={s.id} value={String(s.id)}>{s.name} ({s.student_number})</Option>
                    ))}
                  </Select>

                  <Select
                    placeholder={t('analytics.select_subject')}
                    style={{ width: 150, marginLeft: 16 }}
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                  >
                    <Option value="All">{t('analytics.overview')}</Option>
                    {courseList.map(c => <Option key={c} value={c}>{c}</Option>)}
                  </Select>
                  <Button type="default" style={{ marginLeft: 16 }} onClick={handleResetLayout}>
                    {t('analytics.reset_layout')}
                  </Button>

                  {['Radar', 'Bar', 'Scatter', 'Heatmap'].filter(c => !reportItems.includes(c)).length > 0 && (
                    <Dropdown
                      menu={{
                        items: ['Radar', 'Bar', 'Scatter', 'Heatmap', 'Trend']
                          .filter(c => !reportItems.includes(c))
                          .map(c => ({
                            key: c,
                            label: c, // These are internal keys, but could be mapped if needed
                            onClick: () => setReportItems(prev => [...prev, c])
                          }))
                      }}
                    >
                      <Button style={{ marginLeft: 16 }} icon={<PlusOutlined />}>
                        {t('analytics.add_chart')}
                      </Button>
                    </Dropdown>
                  )}

                  <Button icon={<EyeOutlined />} onClick={() => setIsVisModalOpen(true)} style={{ marginLeft: 16 }}>
                    {t('analytics.visibility_mgmt')}
                  </Button>

                  <Button type="primary" style={{ marginLeft: 16 }} onClick={() => window.print()}>
                    {t('analytics.print_report')}
                  </Button>

                  <Modal title={t('analytics.parent_portal_visibility')} open={isVisModalOpen} onCancel={() => setIsVisModalOpen(false)} footer={null}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ color: '#999', fontSize: 12 }}>{t('analytics.controls_visibility')}</p>
                      {courseList.map(c => {
                        const isVisible = courseVisibility[c] !== false;
                        return (
                          <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid #eee', borderRadius: 6, alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{c}</span>
                            <Button
                              type={isVisible ? 'primary' : 'default'} ghost={isVisible} danger={!isVisible}
                              icon={isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                              onClick={() => handleToggleVisibility(c)}
                            >
                              {isVisible ? t('analytics.visible_status') : t('analytics.hidden_status')}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </Modal>

                </>
              )}
            </div>
            <div>
              <Statistic title={t('stats.total_students')} value={filteredStudents.length} valueStyle={{ fontSize: 16 }} prefix={<UserOutlined />} />
            </div>
          </div>

          {/* Hierarchy Filter */}
          <Card type="inner" title={t('analytics.org_filter')} style={{ marginBottom: 20, background: '#f9f9f9' }}>
            <Row gutter={16}>
              <Col span={8}>
                <b>{t('analytics.grade')}: </b>
                <Select style={{ width: '100%' }} value={selectedGrade} onChange={setSelectedGrade}>
                  <Option value="All">{t('analytics.all_grades')}</Option>
                  {availableGrades.map(g => <Option key={g} value={g}>{g}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <b>{t('analytics.class')}: </b>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder={t('analytics.select_classes')}
                  value={selectedClass}
                  onChange={(val) => {
                    const values = val as string[];
                    if (values.includes('All')) {
                      // If 'All' is selected, clear others or just keep 'All'?
                      // Let's say if they select 'All', it overrides everything else
                      if (selectedClass.includes('All') && values.length > 1) {
                        // Unselecting 'All' or selecting specific?
                        // If All was there, and now more added, remove All?
                        // Simple logic: if new selection contains 'All', use just 'All' ONLY if it was the last selected item?
                        // Actually simpler: if val contains 'All' and other things, logic is tricky.
                        // Let's do: If user selects 'All', set to ['All']. If user selects specifics, remove 'All'.
                        const last = values[values.length - 1];
                        if (last === 'All') setSelectedClass(['All']);
                        else setSelectedClass(values.filter(v => v !== 'All'));
                      } else {
                        // 'All' was not present, or 'All' is the only thing
                        if (values.includes('All')) setSelectedClass(['All']);
                        else setSelectedClass(values);
                      }
                    } else {
                      setSelectedClass(values);
                    }
                  }}
                  showSearch
                  allowClear
                  maxTagCount="responsive"
                >
                  <Option value="All">{t('analytics.all_classes')}</Option>
                  {availableClasses.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Col>
              {chartMode !== 'Stats' && (
                <Col span={8}>
                  <b>{t('analytics.student')}: </b>
                  <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder={t('analytics.all_students')}
                    optionFilterProp="children"
                    allowClear
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                  >
                    {filteredStudents.map(s => (
                      <Option key={s.id} value={String(s.id)}>{s.name} ({s.student_number})</Option>
                    ))}
                  </Select>
                </Col>
              )}
            </Row>
          </Card>

          {/* Chart Zone */}
          <div style={{ marginBottom: 20 }}>
            {/* Mode specific extra filters (e.g. Scatters) could go here if needed, but keeping it clean for now */}
            {/* Mode specific extra filters (e.g. Scatters) could go here if needed, but keeping it clean for now */}
            {chartMode === 'Bar' && (
              <div style={{ marginBottom: 10 }}>
                <b>{t('analytics.subject')}: </b>
                <Select value={selectedCourse} onChange={setSelectedCourse} style={{ width: 150 }}>
                  <Option value="All">{t('analytics.average')}</Option>
                  {courseList.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </div>
            )}
            {chartMode === 'Radar' && (
              <div style={{ marginBottom: 10 }}>
                <b>Subject: </b>
                <Select value={selectedCourse} onChange={setSelectedCourse} style={{ width: 150 }}>
                  <Option value="All">Overview</Option>
                  {courseList.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </div>
            )}
            {chartMode === 'Scatter' && (
              <div style={{ marginBottom: 10 }}>
                <b>X-Axis: </b>
                <Select value={scatterX} onChange={setScatterX} style={{ width: 120 }}>{courseList.map(c => <Option key={c} value={c}>{c}</Option>)}</Select>
                <b style={{ marginLeft: 16 }}>Y-Axis: </b>
                <Select value={scatterY} onChange={setScatterY} style={{ width: 120 }}>{courseList.map(c => <Option key={c} value={c}>{c}</Option>)}</Select>
              </div>
            )}
            {chartMode === 'Stats' && (
              <div style={{ marginBottom: 10 }}>
                <b>Subject: </b>
                <Select value={selectedCourse} onChange={setSelectedCourse} style={{ width: 150 }}>
                  <Option value="All">Overview</Option>
                  {courseList.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </div>
            )}
          </div>


          <Card title={chartMode === 'Report' ? 'Report Board (Drag to Reorder)' : `${chartMode} View`} bordered={false}>
            <div style={{ width: '100%', height: chartMode === 'Heatmap' ? 'auto' : (chartMode === 'Report' || chartMode === 'Stats' ? 'auto' : 500), minHeight: 400 }}>
              {chartMode === 'Radar' && renderRadar()}
              {chartMode === 'Bar' && renderBar()}
              {chartMode === 'Scatter' && renderScatter()}
              {chartMode === 'Heatmap' && renderHeatmap()}
              {chartMode === 'Trend' && renderTrend()}
              {chartMode === 'Stats' && <ClassStatistics students={filteredStudents} courseList={courseList} courseName={selectedCourse} />}

              {chartMode === 'Report' && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={reportItems} strategy={rectSortingStrategy}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="report-grid">
                      {reportItems.map(id => (
                        <SortableItem key={id} id={id}>
                          <Card
                            title={`${id} Chart`}
                            size="small"
                            extra={
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveChart(id)}
                                title="Remove from Report"
                                className="no-print"
                              />
                            }
                          >
                            <div className="report-chart-container" style={{ height: 300, overflow: 'hidden' }}>
                              {id === 'Radar' && renderRadar()}
                              {id === 'Bar' && renderBar()}
                              {id === 'Scatter' && renderScatter()}
                              {id === 'Heatmap' && renderHeatmap(15)} {/* Compact Heatmap */}
                            </div>
                          </Card>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </Card>
        </Card >
      </div >
    );
  };




  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', color: 'white', textAlign: 'center', lineHeight: '32px', fontWeight: 'bold' }}>SmartGrade</div>
        <Menu
          theme="dark"
          selectedKeys={[activeTab]}
          mode="inline"
          onClick={(e) => setActiveTab(e.key)}
          items={[
            { key: 'analytics', icon: <BarChartOutlined />, label: t('menu.analytics') }, // Reordered to be first? Or just keep current order.
            { key: 'roster', icon: <UserOutlined />, label: t('menu.roster') },
            { key: 'grades', icon: <CloudUploadOutlined />, label: t('menu.grades') },
            ...(currentUser?.role === 'admin' ? [{ key: 'accounts', icon: <UserOutlined />, label: t('menu.accounts') }] : [])
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              onClick={changeLanguage}
              icon={<GlobalOutlined />}
              style={{ marginRight: 16 }}
            >
              {i18n.language === 'en' ? '中文' : 'English'}
            </Button>
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Dropdown menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: t('common.logout'),
                      onClick: () => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                      }
                    }
                  ]
                }} trigger={['click']}>
                  <a onClick={e => e.preventDefault()}>
                    <Space>
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                      <span style={{ color: '#333' }}>{currentUser.username} ({currentUser.role})</span>
                      <DownOutlined style={{ color: '#333' }} />
                    </Space>
                  </a>
                </Dropdown>
                <Button
                  type="primary"
                  icon={<KeyOutlined />}
                  onClick={() => setIsChangePassOpen(true)}
                >
                  {t('accounts.change_password')}
                </Button>
              </div>
            )}
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            {connStatus && (
              <Alert
                message={connStatus.msg}
                type={connStatus.type}
                showIcon
                action={<Button size="small" onClick={checkConnection}>Retry Check</Button>}
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginBottom: 16, color: '#999', fontSize: 12 }}>
              Current API: <b>{API_URL}</b> (If this is localhost, external devices cannot connect)
            </div>

            {activeTab === 'analytics' && <Analytics />}

            {activeTab === 'roster' && (
              students.length === 0 ? <UploadRoster /> : <StudentTable />
            )}

            {activeTab === 'grades' && <UploadGrade />}

            {activeTab === 'accounts' && <AccountsManager currentUser={currentUser} apiUrl={API_URL} />}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Smart Grade Platform ©2026 Created by Antigravity | Connected to: {API_URL}
        </Footer>
        <Modal
          title="Change Password"
          open={isChangePassOpen}
          onCancel={() => setIsChangePassOpen(false)}
          onOk={() => passForm.submit()}
        >
          <Form form={passForm} onFinish={handleChangePassword} layout="vertical">
            <Form.Item name="old_password" label="Current Password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="New Password"
              rules={[{ required: true }, { min: 6, message: 'Min 6 chars' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={['new_password']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </Layout>
  );
}

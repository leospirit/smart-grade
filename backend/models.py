from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, unique=True, index=True) # 学号，唯一标识
    name = Column(String, index=True)
    grade_name = Column(String, index=True) # 年级
    class_name = Column(String, index=True)

    grades = relationship("Grade", back_populates="student")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # 课程名，如 "English", "Math"
    is_visible = Column(Boolean, default=True)

    grades = relationship("Grade", back_populates="course")

class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    total_score = Column(Float) # 总分
    sub_scores = Column(JSON) # 分项成绩，例如 {"listening": 10, "reading": 20}
    
    student = relationship("Student", back_populates="grades")
    course = relationship("Course", back_populates="grades")

    # Ensure one grade per course per student
    # Ensure one grade per course per student
    __table_args__ = (UniqueConstraint('student_id', 'course_id', name='_student_course_uc'),)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # "admin" or "student"
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    is_password_changed = Column(Boolean, default=False)
    initial_password = Column(String, nullable=True) 

    student = relationship("Student")

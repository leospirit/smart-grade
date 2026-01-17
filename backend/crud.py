from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import models, schemas

def get_student_by_number(db: Session, student_number: str):
    return db.query(models.Student).filter(models.Student.student_number == student_number).first()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(
        student_number=student.student_number,
        name=student.name,
        class_name=student.class_name
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def get_course_by_name(db: Session, name: str):
    return db.query(models.Course).filter(models.Course.name == name).first()

def create_course(db: Session, name: str):
    db_course = models.Course(name=name)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def create_or_update_grade(db: Session, student_id: int, course_id: int, total_score: float, sub_scores: dict):
    # Check if grade exists
    db_grade = db.query(models.Grade).filter(
        models.Grade.student_id == student_id,
        models.Grade.course_id == course_id
    ).first()

    if db_grade:
        db_grade.total_score = total_score
        db_grade.sub_scores = sub_scores
    else:
        db_grade = models.Grade(
            student_id=student_id,
            course_id=course_id,
            total_score=total_score,
            sub_scores=sub_scores
        )
        db.add(db_grade)
    
    db.commit()
    db.refresh(db_grade)
    return db_grade

def get_all_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

from database import SessionLocal, engine, get_db
import models, auth

def seed_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if student exists
    if db.query(models.Student).first():
        print("DB already has data. Skipping seed.")
        return

    print("Seeding DB...")
    
    # 1. Create Student
    s = models.Student(
        student_number="S1001",
        name="Alice Wonderland",
        grade_name="Grade 10",
        class_name="Class A"
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    
    # 2. Create User
    hashed_pwd = auth.get_password_hash("123456")
    u = models.User(
        username="S1001",
        hashed_password=hashed_pwd,
        role="student",
        student_id=s.id
    )
    db.add(u)
    
    # 3. Create Course & Grades
    courses = ["英语", "数学", "语文", "物理"]
    for c_name in courses:
        c = models.Course(name=c_name)
        db.add(c)
        db.commit()
        db.refresh(c)
        
        # Rich sub-scores for Radar (Chinese)
        if c_name == "英语":
            details = {"听力": 85, "基础": 90, "阅读": 88, "书面表达": 75, "口语": 92}
            total = 86.0
        elif c_name == "数学":
            details = {"基础运算": 95, "应用题": 85, "几何": 80}
            total = 86.6
        elif c_name == "语文":
            details = {"基础知识": 90, "文言文": 80, "作文": 85, "阅读": 88}
            total = 85.7
        elif c_name == "物理":
            details = {"理论": 80, "实验": 90, "计算": 85}
            total = 85.0
        else:
            details = {"期中": 80, "期末": 85}
            total = 82.5

        g = models.Grade(
            student_id=s.id,
            course_id=c.id,
            total_score=total,
            sub_scores=details
        )
        db.add(g)
        
    db.commit()
    print("Seeding Complete. User: S1001 / 123456")
    db.close()

if __name__ == "__main__":
    seed_db()

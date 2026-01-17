from database import SessionLocal, engine
import models, auth

def backfill_users():
    db = SessionLocal()
    students = db.query(models.Student).all()
    count = 0
    print(f"Checking {len(students)} students for missing user accounts...")
    
    for s in students:
        # Check if user exists
        user = db.query(models.User).filter(models.User.username == s.student_number).first()
        if not user:
            print(f"Creating user for {s.name} ({s.student_number})")
            hashed_pwd = auth.get_password_hash("123456")
            new_user = models.User(
                username=s.student_number, 
                hashed_password=hashed_pwd, 
                role="student", 
                student_id=s.id
            )
            db.add(new_user)
            count += 1
            
    db.commit()
    print(f"Backfill complete. Created {count} new user accounts.")
    db.close()

if __name__ == "__main__":
    backfill_users()

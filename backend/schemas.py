from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class StudentBase(BaseModel):
    student_number: str
    name: str
    grade_name: str
    class_name: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str
    student_id: int | None = None

class User(UserBase):
    id: int
    student_id: int | None = None
    is_password_changed: bool = False
    initial_password: str | None = None

    class Config:
        orm_mode = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PasswordReset(BaseModel):
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class GradeBase(BaseModel):
    total_score: float
    sub_scores: Optional[Dict[str, Any]] = {}

class GradeCreate(GradeBase):
    student_number: str # Used for upload matching
    course_name: str

class Grade(GradeBase):
    id: int
    course_name: str
    student_name: str 
    class Config:
        orm_mode = True

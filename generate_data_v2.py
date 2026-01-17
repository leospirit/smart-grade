import pandas as pd
import random

# 1. Create Roster (Orderly)
ids = [f"2023{str(i).zfill(3)}" for i in range(1, 81)]
names = [f"Student_{i}" for i in range(1, 81)]
grades = []
classes = []

for i in range(80):
    # Split into 2 Grades, each has 2 Classes
    # 0-39: Grade 10
    # 40-79: Grade 11
    if i < 40:
        g = "Grade 10"
        # 0-19: Class 1, 20-39: Class 2
        c = "Class 1" if i < 20 else "Class 2"
    else:
        g = "Grade 11"
        c = "Class 1" if i < 60 else "Class 2"
    grades.append(g)
    classes.append(c)

df_roster = pd.DataFrame({
    "学号": ids,
    "姓名": names,
    "年级": grades,
    "班级": classes
})
df_roster.to_excel("roster.xlsx", index=False)
print("Created roster.xlsx")

subjects = ["English", "Math", "Physics", "Chemistry", "Biology", "History"]

for subject in subjects:
    data = []
    # Mix up the order for each file to prove matching works
    shuffled_indices = list(range(80))
    random.shuffle(shuffled_indices)
    
    for idx in shuffled_indices:
        # Simulate some correlation? or just random.
        # Let's make Student_1 (index 0) good at everything to show full area
        score = random.randint(60, 95)
        if idx == 0: 
             score = 98 # High score for Student_1
        
        row = {
            "学号": ids[idx],
            "姓名": names[idx],
            "总分": score,
        }

        # Add specific sub-items based on subject
        if subject == "English":
            # Total ~100. Random split.
            row["Listening"] = random.randint(15, 25)
            row["Reading"] = random.randint(30, 40)
            row["Writing"] = random.randint(15, 25)
            row["Speaking"] = random.randint(5, 10)
        elif subject == "Math":
            row["Algebra"] = random.randint(30, 50)
            row["Geometry"] = random.randint(20, 30)
            row["Logic"] = random.randint(10, 20)
        else:
            # Generic sub-items
            row["Module 1"] = random.randint(30, 50)
            row["Module 2"] = random.randint(30, 50)

        data.append(row)
    
    df = pd.DataFrame(data)
    df.to_excel(f"{subject}_scores.xlsx", index=False)
    print(f"Created {subject}_scores.xlsx")

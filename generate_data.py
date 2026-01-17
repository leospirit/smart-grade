import pandas as pd
import random

# 1. Create Roster (Orderly)
ids = [f"2023{str(i).zfill(3)}" for i in range(1, 41)]
names = [f"Student_{i}" for i in range(1, 41)]
classes = ["Class 1"] * 40

df_roster = pd.DataFrame({
    "学号": ids,
    "姓名": names,
    "班级": classes
})
df_roster.to_excel("roster.xlsx", index=False)
print("Created roster.xlsx")

# 2. Create English Scores (Random Order, Sub-scores, Partial list)
# Only 35 students took the exam
random.seed(42)
sampled_indices = random.sample(range(40), 35)

english_data = []
for idx in sampled_indices:
    english_data.append({
        "学号": ids[idx],
        "姓名": names[idx],
        "总分": random.randint(60, 100),
        "听力": random.randint(10, 20),
        "阅读": random.randint(20, 40),
        "写作": random.randint(10, 30)
    })

# Shuffle rows
random.shuffle(english_data)
df_eng = pd.DataFrame(english_data)
df_eng.to_excel("english_scores.xlsx", index=False)
print("Created english_scores.xlsx (Ordered Randomly)")

# 3. Create Math Scores (Random Order, Different columns)
sampled_indices_math = random.sample(range(40), 38)
math_data = []
for idx in sampled_indices_math:
    math_data.append({
        "学号": ids[idx],
        "姓名": names[idx],
        "总分": random.randint(50, 100),
        "代数": random.randint(30, 50),
        "几何": random.randint(20, 50)
    })
random.shuffle(math_data)
df_math = pd.DataFrame(math_data)
df_math.to_excel("math_scores.xlsx", index=False)
print("Created math_scores.xlsx (Ordered Randomly)")

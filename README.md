# Smart Grade System

## 🚀 如何在新电脑上恢复项目 (How to Restore)

当你换了新电脑，只需按照以下步骤操作，即可完美恢复环境。

### 第一步：下载代码
打开终端（Terminal）或 Git Bash，运行：
```bash
git clone https://github.com/leospirit/smart-grade.git
cd smart-grade
```

### 第二步：恢复后端 (Backend)
1. **进入后端目录**：
   ```bash
   cd backend
   ```
2. **创建虚拟环境** (可选，但推荐)：
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Mac/Linux
   # 或者是: venv\Scripts\activate  # Windows
   ```
3. **安装依赖**：
   ```bash
   pip install -r requirements.txt
   ```
4. **启动后端**：
   ```bash
   python3 main.py
   ```
   *(保持这个窗口不要关)*

### 第三步：恢复前端 (Frontend)
1. **打开一个新的终端窗口**。
2. **进入前端目录**：
   ```bash
   cd smart-grade/frontend
   ```
3. **安装依赖**：
   ```bash
   npm install
   ```
4. **配置环境**：
   创建一个名为 `.env` 的文件，并在里面写入：
   ```
   VITE_API_URL=http://localhost:8000/api
   ```
5. **启动前端**：
   ```bash
   npm run dev
   ```

### 🎉 完成！
现在打开浏览器访问 `http://localhost:5173` (或终端显示的地址) 即可。

---

## 📂 项目结构
- `/backend`: Python FastAPI 后端代码
- `/frontend`: React + Ant Design 前端代码
- `/roster.xlsx`: 示例学生名单
- `/*_scores.xlsx`: 示例成绩单

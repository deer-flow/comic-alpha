@echo off
REM Comic Generator Startup Script for Windows

echo 🎨 漫画分镜生成器启动脚本
echo ================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM Check if backend dependencies are installed
if not exist "backend\venv" (
    echo 📦 首次运行，正在创建虚拟环境...
    python -m venv backend\venv
    
    echo 📦 安装后端依赖...
    call backend\venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
    call deactivate
)

REM Start backend server
echo 🚀 启动后端服务...
start "Comic Backend" cmd /k "cd backend && ..\backend\venv\Scripts\activate.bat && python app.py"

timeout /t 2 /nobreak >nul

REM Start frontend server
echo 🚀 启动前端服务...
start "Comic Frontend" cmd /k "python -m http.server 8000"

echo.
echo ================================
echo ✨ 服务已全部启动！
echo 🌐 请在浏览器中打开: http://localhost:8000
echo.
echo 📍 后端地址: http://localhost:5003
echo 📍 前端地址: http://localhost:8000
echo.
echo 关闭命令行窗口即可停止服务
echo ================================
pause

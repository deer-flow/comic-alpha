#!/bin/bash

# Comic Generator Startup Script

echo "🎨 漫画分镜生成器启动脚本"
echo "================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "📦 首次运行，正在创建虚拟环境..."
    python3 -m venv backend/venv
    
    echo "📦 安装后端依赖..."
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt
    deactivate
fi

# Start backend server
echo "🚀 启动后端服务..."
source backend/venv/bin/activate
cd backend
python app.py &
BACKEND_PID=$!
cd ..

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "📍 后端地址: http://localhost:5003"

# Wait for backend to start
sleep 2

# Start frontend server
echo "🚀 启动前端服务..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "📍 前端地址: http://localhost:8000"
echo ""
echo "================================"
echo "✨ 服务已全部启动！"
echo "🌐 请在浏览器中打开: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "================================"

# Trap Ctrl+C to kill both processes
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; deactivate 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT

# Wait for processes
wait

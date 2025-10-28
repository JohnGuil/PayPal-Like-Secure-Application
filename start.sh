#!/bin/bash

# PayPal-Like Secure Application - Startup Script
# This script ensures containers are ready before opening the browser

echo "🚀 Starting PayPal-Like Secure Application..."
echo ""

# Start Docker containers
echo "📦 Starting Docker containers..."
docker compose up -d

# Wait for database
echo "⏳ Waiting for database to be ready..."
until docker exec paypal_db pg_isready -U paypal_user > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Database is ready!"

# Wait for backend
echo "⏳ Waiting for backend to be ready..."
until curl -s http://localhost:8000/api/health > /dev/null 2>&1; do
    sleep 3
    echo "   Still waiting for backend..."
done
echo "✅ Backend is ready!"

# Wait for frontend
echo "⏳ Waiting for frontend to be ready..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Frontend is ready!"

echo ""
echo "🎉 Application is ready!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8000"
echo "📍 Database: localhost:5432"
echo ""
echo "Demo Accounts:"
echo "  👑 Super Admin: superadmin@paypal.test / SuperAdmin123!"
echo "  🛡️  Admin:       admin@paypal.test / Admin123!"
echo "  📊 Manager:     manager@paypal.test / Manager123!"
echo "  👤 User:        user@paypal.test / User123!"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"
echo ""

# Open browser (works on macOS, Linux, and WSL)
if command -v open > /dev/null; then
    open http://localhost:3000
elif command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v wslview > /dev/null; then
    wslview http://localhost:3000
else
    echo "💡 Open http://localhost:3000 in your browser"
fi

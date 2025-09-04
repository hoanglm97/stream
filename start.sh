#!/bin/bash

echo "🎬 Starting KidsStream Platform..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment configuration..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration before production use!"
fi

# Start the services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T backend python init_db.py

echo ""
echo "🎉 KidsStream is now running!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "👥 Sample User Accounts:"
echo "   Admin: admin@kidsstream.com / admin123"
echo "   Parent: parent@example.com / parent123"
echo "   Child: child@example.com / child123"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📋 To view logs: docker-compose logs -f"
echo "=================================="
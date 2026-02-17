#!/bin/bash

echo "Starting MSI Agentic Platform..."
echo "================================"

# Start Python Services
echo ""
echo "Starting Python Services on port 8000..."
cd backend/python-services
python main.py &
PYTHON_PID=$!
cd ../..

# Start Java Services
echo ""
echo "Starting Java Services on port 8080..."
cd backend/java-services
mvn spring-boot:run &
JAVA_PID=$!
cd ../..

# Start Frontend
echo ""
echo "Starting Angular Frontend on port 4200..."
cd frontend/workflow-builder-app
npm start &
FRONTEND_PID=$!
cd ../..

echo ""
echo "================================"
echo "All services started!"
echo ""
echo "Frontend:       http://localhost:4200"
echo "Python API:     http://localhost:8000"
echo "Java API:       http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $PYTHON_PID $JAVA_PID $FRONTEND_PID; exit" INT
wait

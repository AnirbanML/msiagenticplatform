# MSI Agentic Platform - Python Services

Backend services built with FastAPI for the MSI Agentic Platform.

## Project Structure

```
python-services/
├── api/              # API endpoints and routers
├── models/           # Data models and schemas
├── services/         # Business logic and services
├── utils/            # Utility functions
├── config/           # Configuration files
├── tests/            # Test files
├── main.py           # Application entry point
└── requirements.txt  # Python dependencies
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update environment variables in `.env` file

## Running the Application

### Development Mode
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

Run tests with pytest:
```bash
pytest
```

With coverage:
```bash
pytest --cov=. --cov-report=html
```

## Development

### Adding a new endpoint
1. Create a router file in `api/` directory
2. Define your endpoints using FastAPI decorators
3. Import and include the router in `main.py`

### Adding a new service
1. Create a service file in `services/` directory
2. Implement your business logic
3. Import and use in your API endpoints

## Environment Variables

See `.env.example` for all available configuration options.

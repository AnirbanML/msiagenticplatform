# MSI Agentic Platform

A comprehensive **Mortgage Workflow Builder** platform that enables users to design, configure, and manage automated workflows for mortgage document processing. Built with Angular 19 frontend and FastAPI backend, connected to Azure PostgreSQL database.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Workflow Landing Page
- **Workflow Management**: Create, view, edit, and delete workflows
- **Search & Filter**: Search workflows by name or document type
- **Category-based Cards**: Visual color-coded cards for Income, Asset, Liability, and Credit categories
- **Workflow Types**: Support for Standard, Agentic, and Orchestrator workflow types
- **Loading Animations**: Visual feedback when loading workflow details
- **Dark/Light Theme**: Toggle between dark and light themes

### Workflow Builder
- **Visual Canvas**: Drag-and-drop workflow steps on an infinite canvas
- **Zoom & Pan**: Navigate large workflows with zoom (20%-200%) and pan controls
- **Step Management**:
  - Add, edit, delete, and reorder workflow steps
  - Multiple node types: Text Extraction, Insights Executor, Output Generator
  - Dynamic step numbering and positioning
  - Connector lines with "Add step here" buttons
- **Code Editor**: Python code editing with syntax support
- **Pydantic Classes**: Define and manage output structures for Output Generator nodes
- **Datapoint Selection**: Choose from available datapoints for Insights Executor nodes
- **Workflow Settings**: Configure workflow name, description, category, documents, and type
- **Save Options**:
  - **Normal Save**: Overwrite existing workflow
  - **Save as New Version**: Increment version and preserve history in `historicalworkflow` column
- **Validation**: Comprehensive workflow validation before saving
- **Export**: Generate JSON workflow definitions

### Workflow Features
- **Step Types**:
  - **Text Extraction**: Extract data from documents
  - **Insights Executor**: Execute predefined datapoint calculations
  - **Output Generator**: Generate structured outputs using Pydantic classes
- **Workflow Types**:
  - **Standard**: Basic workflow execution
  - **Agentic**: AI-powered autonomous workflows
  - **Orchestrator**: Coordinate multiple sub-workflows
- **Version Control**: Track workflow versions with historical data preservation

---

## Technology Stack

### Frontend
- **Framework**: Angular 19.2.0
- **Language**: TypeScript 5.7.2
- **Routing**: Angular Router
- **Forms**: Angular Forms (Template-driven & Reactive)
- **HTTP**: Angular HttpClient
- **Styling**: CSS3 with custom properties (CSS variables)
- **Icons**: SVG icons and custom images

### Backend
- **Framework**: FastAPI 0.109.0
- **Server**: Uvicorn 0.27.0 with asyncio support
- **Language**: Python 3.12+
- **Database**: Azure PostgreSQL
- **ORM**: asyncpg 0.29.0 (async PostgreSQL driver)
- **Validation**: Pydantic 2.5.3
- **CORS**: FastAPI CORS middleware
- **Logging**: Python logging module

### Database
- **Database**: Azure PostgreSQL
- **Schema**: `common` schema
- **Main Table**: `mortgage_workflow`
- **Key Columns**:
  - `workflow` (JSONB): Current workflow steps
  - `historicalworkflow` (JSONB): Historical workflow versions
  - `version` (INTEGER): Current version number

---

## Project Structure

```
MSIAgenticPlatform/
├── frontend/
│   └── workflow-builder-app/           # Angular Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── workflow-landing/   # Landing page component
│       │   │   │   ├── workflow-landing.component.ts
│       │   │   │   ├── workflow-landing.component.html
│       │   │   │   └── workflow-landing.component.css
│       │   │   ├── workflow-builder/  # Workflow builder component
│       │   │   │   ├── workflow-builder.component.ts
│       │   │   │   ├── workflow-builder.component.html
│       │   │   │   └── workflow-builder.component.css
│       │   │   ├── app.component.ts
│       │   │   ├── app.module.ts
│       │   │   └── app-routing.module.ts
│       │   ├── assets/                 # Static assets
│       │   │   └── icons/              # Icon images
│       │   ├── index.html
│       │   └── styles.css              # Global styles
│       ├── angular.json
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── backend/
│   └── python-services/                # FastAPI Backend
│       ├── api/                        # API endpoints
│       │   ├── __init__.py
│       │   └── workflow_router.py      # Workflow API routes
│       ├── config/                     # Configuration
│       │   ├── __init__.py
│       │   ├── settings.py             # Application settings
│       │   └── database.py             # Database connection
│       ├── models/                     # Data models
│       │   ├── __init__.py
│       │   ├── document.py             # Document models
│       │   └── workflow.py             # Workflow models
│       ├── services/                   # Business logic
│       │   └── __init__.py
│       ├── utils/                      # Utility functions
│       │   └── __init__.py
│       ├── tests/                      # Test files
│       │   └── __init__.py
│       ├── main.py                     # Application entry point
│       ├── requirements.txt            # Python dependencies
│       ├── .env                        # Environment variables (not in git)
│       ├── .env.example                # Environment template
│       ├── .gitignore
│       └── README.md
│
├── .gitignore
├── start-all.sh                        # Linux/Mac startup script
├── start-all.bat                       # Windows startup script
└── README.md                           # This file
```

---

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Python**: 3.12 or higher
- **pip**: Latest version
- **Azure PostgreSQL**: Access to Azure PostgreSQL database

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MSIAgenticPlatform
```

### 2. Setup Backend (Python Services)

```bash
# Navigate to Python services
cd backend/python-services

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and update values
cp .env.example .env
# Edit .env with your database credentials

# Run the server
python main.py
```

The backend will start on `http://localhost:8000`

### 3. Setup Frontend (Angular Application)

```bash
# Open new terminal and navigate to frontend
cd frontend/workflow-builder-app

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:4200`

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:4200
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health Check**: http://localhost:8000/health

---

## Configuration

### Backend Configuration

Create a `.env` file in `backend/python-services/` with the following variables:

```env
# Application Settings
APP_NAME=MSI Agentic Platform - Python Services
DEBUG=True

# Server Settings
HOST=0.0.0.0
PORT=8000

# Database Settings (Azure PostgreSQL)
DB_HOST=aidigital.postgres.database.azure.com
DB_PORT=5432
DB_NAME=uwcopilotppr
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Frontend Configuration

The frontend API base URL is configured in:
- `src/app/workflow-landing/workflow-landing.component.ts` → `apiBaseUrl`
- `src/app/workflow-builder/workflow-builder.component.ts` → `apiUrl`

Default: `http://localhost:8000/api/v1`

---

## API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### Workflow Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents` | Get all document types |
| `GET` | `/workflows` | Get all workflows |
| `POST` | `/getworkflowdetails` | Get workflow details by ID |
| `POST` | `/createworkflow` | Create a new workflow |
| `PUT` | `/workflows/{id}` | Update workflow metadata |
| `PUT` | `/workflows/{id}/save` | Save workflow (overwrite) |
| `PUT` | `/workflows/{id}/save-version` | Save as new version |
| `DELETE` | `/workflows/{id}` | Delete workflow |

#### Save Workflow - Normal Save

**Endpoint**: `PUT /workflows/{workflow_id}/save`

**Description**: Overwrites the existing workflow steps and settings in the database.

**Request Body**:
```json
{
  "workflowName": "Schedule B Income",
  "description": "Calculate Schedule B income",
  "category": "income",
  "doc_type": "Schedule B",
  "other_doc": ["W2", "Paystub"],
  "flowType": "agentic",
  "workflow": [
    {
      "id": 1,
      "name": "Step 1",
      "node": "text extraction",
      "prompt": "Extract income data",
      ...
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Workflow saved successfully",
  "workflowId": 68
}
```

#### Save Workflow - Save as New Version

**Endpoint**: `PUT /workflows/{workflow_id}/save-version`

**Description**: Saves the current workflow to `historicalworkflow` JSONB column and increments the version number. The new workflow steps are saved to the `workflow` column.

**Request Body**: Same as normal save

**Response**:
```json
{
  "success": true,
  "message": "Workflow saved as version 2",
  "workflowId": 68,
  "versionNumber": 2
}
```

**Historical Workflow Structure** (in database):
```json
{
  "1": [/* previous workflow steps */],
  "2": [/* another previous version */]
}
```

#### Get Workflow Details

**Endpoint**: `POST /getworkflowdetails`

**Request Body**:
```json
{
  "id": 68
}
```

**Response**:
```json
{
  "workflowDetails": {
    "id": 68,
    "workflowName": "Schedule B Income",
    "description": "Calculate Schedule B income",
    "category": "income",
    "doc_type": "Schedule B",
    "other_doc": ["W2", "Paystub"],
    "version": 2,
    "flowType": "agentic",
    "workflow": [/* workflow steps */],
    "historicalworkflow": {
      "1": [/* version 1 steps */]
    }
  },
  "datapointList": [
    {"id": 1, "datapointName": "Schedule B income calculation"},
    {"id": 2, "datapointName": "Schedule C income calculation"}
  ]
}
```

---

## Database Schema

### Table: `common.mortgage_workflow`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique workflow identifier |
| `workflowName` | VARCHAR | Workflow name |
| `description` | TEXT | Workflow description |
| `category` | VARCHAR | Category (income, asset, liability, credit) |
| `doc_type` | VARCHAR | Primary document type |
| `other_doc` | TEXT[] | Additional document types |
| `version` | INTEGER | Current version number |
| `flowType` | VARCHAR | Workflow type (standard, agentic, orchestrator) |
| `workflow` | JSONB | Current workflow steps (JSON array) |
| `historicalworkflow` | JSONB | Historical versions (JSON object) |
| `data_point` | VARCHAR | Datapoint name |
| `prompt` | TEXT | Workflow prompt |
| `output_structure` | JSONB | Output structure definition |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |

### Workflow JSON Structure

```json
[
  {
    "id": 1,
    "name": "Step 1",
    "node": "text extraction",
    "prompt": "Extract income data from Schedule B",
    "model": "claude-sonnet-4",
    "temperature": 0,
    "x": 680,
    "y": 100
  },
  {
    "id": 2,
    "name": "Step 2",
    "node": "insights executor",
    "prompt": "Calculate total income",
    "model": "claude-sonnet-4",
    "temperature": 0,
    "datapoints": [
      {
        "pid": 2,
        "dataPointName": "Schedule B income calculation"
      }
    ],
    "x": 680,
    "y": 280
  },
  {
    "id": 3,
    "name": "Step 3",
    "node": "output generator",
    "prompt": "Generate structured output",
    "model": "claude-sonnet-4",
    "temperature": 0,
    "pydanticClasses": [
      {
        "name": "IncomeOutput",
        "code": "class IncomeOutput(BaseModel):\n    total_income: float\n    source: str"
      }
    ],
    "pydanticObject": {
      "className": "IncomeOutput"
    },
    "codeBlock": "# Python code here",
    "x": 680,
    "y": 460
  }
]
```

---

## Development

### Frontend Development

```bash
cd frontend/workflow-builder-app

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
ng lint
```

### Backend Development

```bash
cd backend/python-services

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run server with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .

# Type checking
mypy .
```

### Common Development Tasks

#### Adding a New API Endpoint

1. Create route function in `backend/python-services/api/workflow_router.py`
2. Define Pydantic request/response models
3. Implement database queries
4. Update API documentation

#### Adding a New Workflow Step Type

1. Update step type list in `workflow-builder.component.ts`
2. Add conditional logic in step configuration UI
3. Update validation rules in `validateFlow()`
4. Update `buildExportWorkflow()` to handle new type

#### Adding a New Theme

1. Define CSS variables in `styles.css`
2. Update theme toggle logic in components
3. Add theme preference to localStorage

---

## Deployment

### Frontend Deployment

```bash
cd frontend/workflow-builder-app

# Build for production
npm run build

# Output will be in dist/workflow-builder-app/
# Deploy to static hosting (AWS S3, Azure Blob, Netlify, etc.)
```

### Backend Deployment

#### Option 1: Docker

```dockerfile
# Dockerfile example
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t msi-agentic-backend .
docker run -p 8000:8000 --env-file .env msi-agentic-backend
```

#### Option 2: Traditional Server

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

---

## Scripts

### Start All Services

#### Windows
```batch
start-all.bat
```

#### Linux/Mac
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## License

© 2026 TATA Consultancy Services Limited. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## Support

For issues, questions, or contributions, please contact the development team or create an issue in the repository.

---

## Changelog

### Version 2.0.0 (Current)
- Added workflow version control with `historicalworkflow` column
- Implemented "Save as new version" functionality
- Added loading animations on workflow cards
- Enhanced workflow builder with connector buttons
- Improved step positioning and renumbering
- Added zoom and pan controls to canvas
- Implemented dark/light theme toggle
- Enhanced validation rules for workflows

### Version 1.0.0
- Initial release with basic workflow builder
- Landing page with workflow management
- Backend API with PostgreSQL integration
- Support for multiple workflow types and node types

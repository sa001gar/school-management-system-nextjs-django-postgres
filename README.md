# School Management System

A comprehensive school management system with Result Management, Payment Management, and Core Services modules.

## Technology Stack

### Backend
- **Django 6.0+** - Web framework
- **Django REST Framework** - API development
- **Django Ninja** - Alternative API framework (included)
- **SimpleJWT** - JWT authentication
- **SQLite** (development) / **PostgreSQL** (production)

### Frontend
- **React 18+** with TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Hook Form** - Form handling

## Project Structure

```
imp_project/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/           # Admin panel components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── ...
│   │   ├── lib/                 # API services and utilities
│   │   │   ├── api.ts           # Core API client
│   │   │   ├── authApi.ts       # Auth API
│   │   │   ├── coreApi.ts       # Core services API
│   │   │   ├── resultsApi.ts    # Results API
│   │   │   ├── paymentsApi.ts   # Payments API
│   │   │   ├── types.ts         # TypeScript types
│   │   │   └── index.ts         # Central exports
│   │   ├── contexts/            # React contexts
│   │   └── hooks/               # Custom hooks
│   └── .env                     # Environment variables
│
└── school_management_system/    # Django backend
    ├── core_services/           # Core module (users, classes, students)
    ├── result_management/       # Results module
    ├── payments_management/     # Payments module
    └── school_management_system/ # Django project settings
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm (or npm/yarn)

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd x:\imp_project\school_management_system
   ```

2. **Activate virtual environment:**
   ```powershell
   cd x:\imp_project
   .\venv\Scripts\Activate
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```powershell
   cd school_management_system
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create initial data (optional):**
   ```powershell
   python setup_dev.py
   ```

6. **Start the server:**
   ```powershell
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000/api/v1/`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd x:\imp_project\frontend
   ```

2. **Install dependencies:**
   ```powershell
   pnpm install
   ```

3. **Start development server:**
   ```powershell
   pnpm dev
   ```

   The app will be available at `http://localhost:5173/`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `GET /api/v1/auth/me/` - Get current user
- `POST /api/v1/auth/token/refresh/` - Refresh access token

### Core Services
- `/api/v1/sessions/` - Academic sessions CRUD
- `/api/v1/classes/` - Classes CRUD
- `/api/v1/sections/` - Sections CRUD
- `/api/v1/subjects/` - Subjects CRUD
- `/api/v1/students/` - Students CRUD
- `/api/v1/teachers/` - Teachers CRUD
- `/api/v1/cocurricular-subjects/` - Cocurricular subjects
- `/api/v1/optional-subjects/` - Optional subjects
- `/api/v1/class-subject-assignments/` - Subject assignments
- `/api/v1/class-marks-distribution/` - Marks distribution
- `/api/v1/school-config/` - School configuration

### Results Management
- `/api/v1/results/student-results/` - Student results CRUD
- `/api/v1/results/student-results/upsert/` - Create or update result
- `/api/v1/results/student-results/bulk-upsert/` - Bulk create/update
- `/api/v1/results/student-results/by-class-section/` - Get by class/section
- `/api/v1/results/cocurricular-results/` - Cocurricular results
- `/api/v1/results/optional-results/` - Optional subject results
- `/api/v1/results/marksheet/student/<id>/` - Student marksheet
- `/api/v1/results/marksheet/class-section/` - Class marksheet

### Payments Management
- `/api/v1/payments/fee-structures/` - Fee structures CRUD
- `/api/v1/payments/fee-discounts/` - Fee discounts CRUD
- `/api/v1/payments/student-fees/` - Student fees CRUD
- `/api/v1/payments/student-fees/summary/` - Fee summary
- `/api/v1/payments/student-fees/overdue/` - Overdue fees
- `/api/v1/payments/payments/` - Payments CRUD
- `/api/v1/payments/payments/daily-collection/` - Daily collection report
- `/api/v1/payments/payment-reminders/` - Payment reminders

## Default Credentials

After running `setup_dev.py`:

- **Admin:** admin@school.com / admin123
- **Teacher:** teacher@school.com / teacher123

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Backend
Set these in environment or `.env` file:
```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## Development

### Running Tests
```powershell
# Backend tests
cd school_management_system
python manage.py test

# Frontend tests (if configured)
cd frontend
pnpm test
```

### Linting
```powershell
# Frontend
cd frontend
pnpm lint
```

## License

MIT License

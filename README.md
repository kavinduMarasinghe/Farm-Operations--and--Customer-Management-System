# Farm-Operations--and--Customer-Management-System
A full-stack MERN application for managing farm operations, customer marketplace, employee workflows, and student training programs in a single integrated platform.

## Overview

This system unifies four user roles under one platform:

- **Admin** — manage products, cottages, employees, customers, students, orders, refunds, reports, and crop yields.
- **Customer** — browse the marketplace, book cottages, place orders, make payments, request refunds, and submit feedback.
- **Employee** — view assigned tasks, log work hours/timesheets, manage profile, and access work guides.
- **Student** — enroll in training programs, access learning materials, attend live sessions, and book lab tours.

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose
- **Auth:** JSON Web Tokens (JWT) + bcryptjs
- **Communication:** Nodemailer (email), Twilio (SMS)
- **Reports:** PDFKit
- **Other:** cookie-parser, cors, dotenv, axios

### Frontend
- **Build Tool:** Vite 7
- **Language:** TypeScript
- **Library:** React 18
- **UI:** shadcn-ui + Radix UI + Tailwind CSS
- **State / Data:** TanStack Query, React Hook Form, Zod
- **Routing:** React Router v6
- **Charts:** Recharts
- **Exports:** jsPDF, jspdf-autotable, xlsx, html2canvas, file-saver
- **Notifications:** Sonner

## Features

### Admin Module
- Dashboard with KPIs and analytics
- Product CRUD and inventory management
- Cottage CRUD and booking oversight
- Employee management with salary tracking
- Customer management and feedback review
- Order & refund processing
- Crop yield tracking
- Student program management (materials, live sessions, lab tours)
- Order and cottage reports (PDF/Excel)

### Customer Module
- Marketplace browsing and product purchase
- Shopping cart and checkout
- Cottage browsing and booking
- Order tracking and history
- Online payments
- Refund requests
- Feedback submission

### Employee Module
- Authentication and profile management
- Task list and status updates
- Timesheet / work-hours logging
- Work guide access

### Student Module
- Enrollment and student profile
- Learning materials library
- Live training sessions
- Lab tour bookings
- Feedback / FAQ pages

## Project Structure

```
Farm-Operations--and--Customer-Management-System/
├── Backend/
│   ├── controllers/        # Admin, Customer, Employee, Student, auth
│   ├── middleware/         # Auth & role guards
│   ├── models/             # Mongoose schemas
│   │   ├── Admin/          # Admin, Cottage, Product
│   │   ├── Customer/       # Cart, CottageBooking, Customer, Feedback, Order, Payment, Refund
│   │   ├── Employee/       # Employee, Task, Timesheet, User
│   │   └── Student/        # Student, LabTour, LearningMaterial, LiveSession, Feedback
│   ├── routes/             # Express routers grouped by role
│   ├── services/           # Business logic helpers
│   ├── mongodb.js          # DB connection
│   ├── nodemailer.js       # Email transport
│   └── server.js           # Express entry point
└── Frontend/
    ├── public/
    └── src/
        ├── api/            # Axios clients
        ├── assets/
        ├── components/     # Reusable UI (shadcn)
        ├── contexts/       # Auth & app contexts
        ├── hooks/
        ├── lib/
        ├── pages/
        │   ├── admin/      # Admin dashboard pages
        │   ├── auth/       # Login, Register
        │   └── user/       # Customer, Employee, Student pages
        ├── App.tsx
        └── main.tsx
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or MongoDB Atlas)
- (Optional) SMTP credentials for email, Twilio account for SMS

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Farm-Operations--and--Customer-Management-System.git
cd Farm-Operations--and--Customer-Management-System
```

### 2. Backend setup
```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/` with at least:
```env
PORT=8070
MONGODB_URI=mongodb://localhost:27017/farm_management
JWT_SECRET=your_jwt_secret_here

# Email (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Twilio (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Run the backend:
```bash
npm run server   # nodemon (dev)
# or
npm start        # node
```
Server runs at `http://localhost:8070`.

### 3. Frontend setup
```bash
cd ../Frontend
npm install
npm run dev
```
App runs at `http://localhost:8080` (or `5173` depending on Vite config).

## API Overview

Base URL: `http://localhost:8070`

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Generic authentication |
| Admin Auth | `/api/admin/auth` | Admin login/register |
| Customer Auth | `/api/customer/auth` | Customer login/register |
| Employee Auth | `/api/auth/employee` | Employee login |
| Student Auth | `/api/student/auth` | Student login/register |
| Products | `/api/products` | Product CRUD |
| Cottages | `/api/cottages` | Cottage CRUD |
| Cart | `/api/cart` | Customer cart |
| Bookings | `/api/bookings` | Cottage bookings |
| Orders | `/api/cusOrders` | Customer orders |
| Payments | `/api/payments` | Payments |
| Customers | `/api/customers` | Customer management |
| Feedback | `/api/cusFeedbacks` | Customer feedback |
| Refunds | `/api/refunds` | Refund requests |
| Crop Yields | `/api/yields` | Yield records |
| Employees | `/api/employees` | Employee management |
| Tasks | `/api/tasks` | Employee tasks |
| Timesheets | `/api/timesheets` | Work hours |
| Student Materials | `/api/student/materials` | Learning materials |
| Student Sessions | `/api/student/sessions` | Live sessions |
| Lab Tours | `/api/student/labtours` | Lab tour bookings |
| Reports | `/api/reports` | Order & cottage reports |

## Scripts

### Backend
| Command | Description |
|---|---|
| `npm start` | Run server with Node |
| `npm run server` | Run server with nodemon |

### Frontend
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview built app |
| `npm run lint` | Run ESLint |

## Security
The repository includes security review documents under `Backend/`:
- `SECURITY_ASSESSMENT_REPORT.md`
- `FINAL_ASSESSMENT_SUMMARY.md`

Review these before deploying to production.

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License
ISC

## Author
Kavindu Marasinghe


# ⚡ TaskFlow — Team Task Manager (Full-Stack)

A premium full-stack web application where users can create projects, assign tasks, and track progress with **role-based access control (Admin/Member)**.

## 🚀 Key Features

- **Authentication** — Signup/Login with JWT-based auth
- **Project Management** — Create, update, delete projects with team members
- **Task Management** — Full CRUD with Kanban board, status pipeline (To Do → In Progress → Review → Done)
- **Dashboard** — Real-time stats, overdue alerts, progress tracking
- **Team Management** — View members, promote/demote roles
- **Role-Based Access Control** — Admin: full access | Member: limited access
- **Premium UI** — Dark theme, glassmorphism, gradients, animations

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Styling | Vanilla CSS (Premium Dark Theme) |

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd team-task-manager
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment**
```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

4. **Run in development**
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🌐 Deployment (Railway)

1. Push to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Add environment variables:
   - `MONGO_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — A strong secret key
   - `NODE_ENV` — `production`
   - `PORT` — `5000`
4. Build command: `cd client && npm install && npm run build`
5. Start command: `cd server && node index.js`

## 📋 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Private |
| POST | `/api/projects` | Admin |
| GET | `/api/projects/:id` | Private |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | Private |
| GET | `/api/tasks/stats` | Private |
| POST | `/api/tasks` | Private |
| PUT | `/api/tasks/:id` | Private |
| DELETE | `/api/tasks/:id` | Admin/Creator |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Private |
| PUT | `/api/users/:id/role` | Admin |
| DELETE | `/api/users/:id` | Admin |

## 👤 Roles

- **Admin**: Full CRUD on projects, tasks, and users. Can promote/demote members.
- **Member**: Can view assigned projects, create/update tasks, and view team.

## 📁 Project Structure

```
team-task-manager/
├── client/          # React Frontend
│   ├── src/
│   │   ├── api/         # Axios API client
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Route pages
│   │   ├── App.jsx      # Main app with routing
│   │   └── index.css    # Premium design system
│   └── index.html
├── server/          # Express Backend
│   ├── config/      # Database config
│   ├── middleware/   # Auth & RBAC middleware
│   ├── models/      # Mongoose models
│   ├── routes/      # API routes
│   └── index.js     # Server entry point
└── README.md
```

## License

MIT

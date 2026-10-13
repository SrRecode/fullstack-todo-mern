# fullstack-todo-mern

Full-stack MERN (MongoDB, Express, React, Node.js) todo application with persistent CRUD, priorities, due dates, search, and filters.

## Features

- Create, read, update, and delete tasks
- Priority levels (low, medium, high)
- Due dates with overdue detection
- Filter by status (all, active, completed)
- Filter by priority
- Search by title or description
- Sort by date created, due date, or priority
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend:** React 18
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Styling:** CSS3

## Project Structure

```
fullstack-todo-mern/
├── server/               # Express backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── index.js          # Server entry point
│   └── package.json
├── client/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── styles/       # CSS styles
│   │   ├── api.js        # API client
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/SrRecode/fullstack-todo-mern.git
cd fullstack-todo-mern
```

### 2. Set up the backend

```bash
cd server
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todo-app
```

For MongoDB Atlas, use:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/todo-app
```

Install dependencies and start the server:

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the frontend

Open a new terminal:

```bash
cd client
npm install
npm start
```

The app will open at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | /api/tasks       | Get all tasks         |
| GET    | /api/tasks/:id   | Get a single task     |
| POST   | /api/tasks       | Create a new task     |
| PUT    | /api/tasks/:id   | Update a task         |
| DELETE | /api/tasks/:id   | Delete a task         |

### Query Parameters for GET /api/tasks

- `status` - Filter by status: `active` or `completed`
- `priority` - Filter by priority: `low`, `medium`, or `high`
- `search` - Search by title or description
- `sortBy` - Sort by: `created`, `dueDate`, or `priority`

## Available Scripts

### Server

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)

### Client

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests

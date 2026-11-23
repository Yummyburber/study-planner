# Study Planner

A lightweight student productivity web application for organizing classes, assignment deadlines, and estimated study time.

## MVP features

- Create, edit, and delete classes.
- Create, edit, and delete assignments.
- Set due dates, estimated study hours, and optional notes.
- Associate assignments with classes.
- Mark assignments complete or reopen them.
- View upcoming tasks, completed tasks, and remaining estimated study hours.
- Store application data in SQLite.

## Technology

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js and Express
- Database: SQLite using better-sqlite3
- Containerization: Docker and Docker Compose

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
cd backend
npm install
npm start
```

Open http://localhost:8080.

The SQLite database is created automatically in `backend/data/`.

## Run with Docker

Requirements: Docker Desktop.

From the repository root:

```bash
docker compose up --build
```

Open http://localhost:8080.

To stop the application:

```bash
docker compose down
```

Docker Compose stores database data in a named volume so it survives container restarts.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET, POST | `/api/classes` | List or create classes |
| PUT, DELETE | `/api/classes/:id` | Update or delete a class |
| GET, POST | `/api/assignments` | List or create assignments |
| PUT, DELETE | `/api/assignments/:id` | Update or delete an assignment |
| PATCH | `/api/assignments/:id/complete` | Toggle completion |

## Project structure

```text
study-planner/
├── Frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── package.json
│   └── server.js
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Current project status

The initial MVP implementation provides class and assignment management, a dashboard summary, a REST API, and SQLite persistence. Testing, deployment, and CI/CD configuration should be recorded as they are completed.

## AI tool usage

AI assistance (ChatGPT) was used to help plan the MVP architecture, generate an initial implementation, draft API routes, prepare Docker configuration, and organize project documentation. The project owner should review, run, test, and understand the generated code before submission. Any additional AI tools used during development should be added here with a description of their contribution.

## Development workflow

Features should be developed on descriptive feature branches, reviewed, and merged into `main` through pull requests. Use clear commit messages that describe the change. Record testing and deployment outcomes in the project documentation.

## Google Cloud Deployment

**Live Application:** https://study-planner-1053304824393.us-central1.run.app

The Study Planner MVP was successfully deployed using Google Cloud Run in the `us-central1` region.

### Deployment Process
1. Created the Google Cloud project `study-planner-mvp-2026`.
2. Linked a Google Cloud billing account.
3. Enabled Cloud Run, Cloud Build, and Artifact Registry.
4. Built and deployed the application using the Google Cloud CLI.
5. Verified that the live application loads and supports adding classes, adding assignments, and marking assignments complete.

### Deployment Challenge
Google Cloud initially blocked service activation because billing was not linked. After linking the billing account, deployment completed successfully.

## AI Development Assistance

ChatGPT assisted with MVP architecture, initial code generation, API routes, Docker configuration, troubleshooting, and deployment. The application was tested locally, in Docker, and on Google Cloud Run.

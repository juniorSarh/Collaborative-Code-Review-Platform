<img src="https://socialify.git.ci/juniorSarh/Collaborative-Code-Review-Platform/image?language=1&owner=1&name=1&stargazers=1&theme=Light" alt="Collaborative-Code-Review-Platform" width="640" height="320" />
# Collaborative Code Review Platform

An API-driven service that enables developers and teams to post code snippets, request feedback, and collaborate on reviews in real time.

## Features

### Authentication & User Management
- ✅ User registration and login with JWT authentication
- ✅ Role-based access control (admin, reviewer, submitter)
- ✅ Profile management (name, email, avatar)

### Projects / Repositories
- ✅ Create and manage projects
- ✅ Assign members to projects with different roles
- ✅ Project ownership and member management

### Code Submissions
- 🔄 Upload code snippets or files (text only)
- 🔄 Associate submissions with projects
- 🔄 Track submission status (pending, in_review, approved, changes_requested)

### Comments & Reviews
- 🔄 Add inline comments on specific lines of code
- 🔄 General comments on submissions
- 🔄 Review workflow with approvals and change requests

### Notifications
- 🔄 Real-time activity feed
- 🔄 WebSocket notifications for live updates

### Analytics Dashboard
- 🔄 Project-level statistics
- 🔄 Review performance metrics
- 🔄 User activity tracking

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Language:** TypeScript/JavaScript


## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/juniorSarh/Collaborative-Code-Review-Platform
   cd collaborative-code-review-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=codereview
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Set up PostgreSQL database**
   
   Using pgAdmin:
   - Create database `codereview`
   - Create user with appropriate permissions
   - Run migrations using the migrate script
   
   Or using SQL:
   ```sql
   CREATE DATABASE codereview;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE codereview TO your_username;
   ```

5. **Run database migrations**
   ```bash
   node scripts/migrate.js
   ```

6. **Start the server**
   ```bash
   node server.js
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "reviewer" // optional: "admin", "reviewer", "submitter"
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Projects (All require JWT token)

#### Create Project
```http
POST /api/projects
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description"
}
```

#### Get User Projects
```http
GET /api/projects
Authorization: Bearer <jwt_token>
```

#### Get Single Project
```http
GET /api/projects/:id
Authorization: Bearer <jwt_token>
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <jwt_token>
```

#### Add Project Member
```http
POST /api/projects/:id/members
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "role": "reviewer" // "admin", "reviewer", "submitter"
}
```

#### Remove Project Member
```http
DELETE /api/projects/:id/members/:userId
Authorization: Bearer <jwt_token>
```

#### Get Project Members
```http
GET /api/projects/:id/members
Authorization: Bearer <jwt_token>
```

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `password_hash` (VARCHAR, NOT NULL)
- `role` (ENUM: admin, reviewer, submitter)
- `avatar_url` (VARCHAR, optional)
- `created_at`, `updated_at` (TIMESTAMP)

### Projects
- `id` (UUID, Primary Key)
- `name` (VARCHAR, NOT NULL)
- `description` (TEXT)
- `created_by` (UUID, Foreign Key → users.id)
- `created_at`, `updated_at` (TIMESTAMP)

### Project Members
- `project_id` (UUID, Foreign Key → projects.id)
- `user_id` (UUID, Foreign Key → users.id)
- `role` (ENUM: admin, reviewer, submitter)
- `joined_at` (TIMESTAMP)

### Submissions
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key → projects.id)
- `user_id` (UUID, Foreign Key → users.id)
- `title` (VARCHAR, NOT NULL)
- `code_content` (TEXT, NOT NULL)
- `file_name` (VARCHAR, optional)
- `status` (ENUM: pending, in_review, approved, changes_requested)
- `created_at`, `updated_at` (TIMESTAMP)

### Comments
- `id` (UUID, Primary Key)
- `submission_id` (UUID, Foreign Key → submissions.id)
- `user_id` (UUID, Foreign Key → users.id)
- `content` (TEXT, NOT NULL)
- `line_number` (INTEGER, optional)
- `parent_comment_id` (UUID, Foreign Key → comments.id, optional)
- `created_at`, `updated_at` (TIMESTAMP)

### Reviews
- `id` (UUID, Primary Key)
- `submission_id` (UUID, Foreign Key → submissions.id)
- `reviewer_id` (UUID, Foreign Key → users.id)
- `decision` (ENUM: approved, changes_requested)
- `feedback` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### Notifications
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `type` (ENUM: comment_added, review_submitted, etc.)
- `content` (TEXT, NOT NULL)
- `related_entity_type` (VARCHAR)
- `related_entity_id` (UUID)
- `is_read` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)

## User Roles

### Admin
- Can create and manage projects
- Can add/remove project members
- Full access to all project features

### Reviewer
- Can review code submissions
- Can add comments
- Can approve/request changes

### Submitter
- Can create code submissions
- Can view comments on their submissions
- Cannot review others' code

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-restart on file changes.

### Database Migrations

To run all migrations:
```bash
node scripts/migrate.js
```

### Testing

```bash
npm test
```

## Project Structure

```
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── userController.js     # User-related endpoints
│   └── projectController.js  # Project-related endpoints
├── middleware/
│   └── auth.js               # Authentication middleware
├── migrations/               # SQL migration files
├── models/                   # TypeScript interfaces
├── routes/
│   ├── userRoutes.js         # User route definitions
│   └── projectRoutes.js      # Project route definitions
├── scripts/
│   └── migrate.js            # Migration runner
├── service/
│   ├── userService.js        # User business logic
│   └── projectService.js     # Project business logic
├── server.js                 # Main server file
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Future Enhancements

- [ ] Complete submission functionality
- [ ] Comments and reviews system
- [ ] WebSocket real-time notifications
- [ ] File upload support
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Comprehensive test suite
- [ ] Docker containerization
- [ ] Frontend web application

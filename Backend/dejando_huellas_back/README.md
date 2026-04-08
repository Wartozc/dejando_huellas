# Emprendedores Dejando Huellas de Ebéjico - Backend API

A REST API backend for the social organization platform built with Go, MongoDB, and Clean Architecture.

## Features

- User management with admin approval workflow
- Public posts/blog
- Contact form
- JWT authentication with role-based access control
- Auto-initialized admin user on first run

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin
- **Database**: MongoDB
- **Auth**: JWT
- **Architecture**: Clean Architecture

## Project Structure

```
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   ├── config.go
│   │   └── init_admin.go
│   ├── domain/
│   ├── delivery/
│   │   └── http/
│   ├── middleware/
│   ├── repository/
│   └── usecase/
├── pkg/
├── docs/
├── .env
├── go.mod
└── go.sum
```

## Getting Started

### Prerequisites

- Go 1.21+ installed and configured
- MongoDB running locally or via Docker

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   go mod download
   # or
   go mod tidy
   ```

3. Configure environment variables in `.env`:
   ```
   PORT=8080
   MONGO_URI=mongodb://localhost:27017
   DATABASE=dejando_huellas
   JWT_SECRET=your-secret-key-change-in-production
   ```

4. Run the server:
   ```bash
   go run cmd/api/main.go
   ```

### Default Admin Credentials

On first run, the application automatically creates a default admin user:

- **Email**: `admin@dejandohuellas.com`
- **Password**: `admin123`
- **Status**: APPROVED (no approval needed)

**Important**: Change these credentials in production!

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Login | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Members

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/members/register` | Register member | No |
| GET | `/api/v1/members` | List all members | Admin |
| GET | `/api/v1/members/:id` | Get member by ID | Admin |
| PUT | `/api/v1/members/:id` | Update member | Admin |
| DELETE | `/api/v1/members/:id` | Delete member | Admin |
| POST | `/api/v1/members/:id/approve` | Approve member | Admin |
| POST | `/api/v1/members/:id/reject` | Reject member | Admin |

### Posts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/posts` | List all posts | No |
| GET | `/api/v1/posts/:id` | Get post by ID | No |
| POST | `/api/v1/posts` | Create post | Admin |
| PUT | `/api/v1/posts/:id` | Update post | Admin |
| DELETE | `/api/v1/posts/:id` | Delete post | Admin |

### Contact

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/contact` | Send message | No |
| GET | `/api/v1/contact` | List messages | Admin |

## Example Requests

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dejandohuellas.com", "password": "admin123"}'
```

### Register Member
```bash
curl -X POST http://localhost:8080/api/v1/members/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "1234567890", "password": "password123"}'
```

### Create Post (Admin)
```bash
curl -X POST http://localhost:8080/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "New Activity", "content": "Description of the activity", "image_url": "https://example.com/image.jpg"}'
```

### Send Contact Message
```bash
curl -X POST http://localhost:8080/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "message": "Hello, I would like to join your organization!"}'
```

## Running Tests

```bash
go test ./...
```

## Development

### MongoDB with Docker

If you don't have MongoDB installed, you can use Docker:

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=dejando_huellas \
  mongo:latest
```

### Project Structure Explanation

- `cmd/api/main.go` - Application entry point
- `internal/config/` - Configuration and initialization
- `internal/domain/` - Domain models and DTOs
- `internal/repository/` - Data access layer (MongoDB)
- `internal/usecase/` - Business logic
- `internal/delivery/http/` - HTTP handlers/controllers
- `internal/middleware/` - Auth, CORS, and role middleware
- `pkg/utils/` - Shared utilities

## License

MIT

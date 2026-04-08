# API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Health Check
Check if the API is running.

**GET** `/health`

**Response:**
```json
{
  "status": "ok"
}
```

---

### Authentication

#### Login
Authenticate a user and receive a JWT token.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "status": "APPROVED"
  }
}
```

#### Get Current User
Get the currently authenticated user.

**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

---

### Members

#### Register Member
Register a new member (public endpoint, requires admin approval).

**POST** `/members/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Member registered successfully. Pending admin approval.",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "MEMBER",
    "status": "PENDING"
  }
}
```

#### List All Members
Get all members (Admin only).

**GET** `/members`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "status": "APPROVED"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER",
      "status": "PENDING"
    }
  ]
}
```

#### Get Member by ID
Get a specific member by ID (Admin only).

**GET** `/members/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "MEMBER",
    "status": "PENDING"
  }
}
```

#### Update Member
Update a member (Admin only).

**PUT** `/members/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "0987654321",
  "status": "APPROVED",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "phone": "0987654321",
    "role": "ADMIN",
    "status": "APPROVED"
  }
}
```

#### Delete Member
Delete a member (Admin only).

**DELETE** `/members/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

#### Approve Member
Approve a pending member (Admin only).

**POST** `/members/:id/approve`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "message": "User approved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "status": "APPROVED"
  }
}
```

#### Reject Member
Reject a pending member (Admin only).

**POST** `/members/:id/reject`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "message": "User rejected",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "status": "REJECTED"
  }
}
```

---

### Posts

#### List All Posts
Get all posts (Public).

**GET** `/posts`

**Response:**
```json
{
  "posts": [
    {
      "id": "507f1f77bcf86cd799439013",
      "title": "Community Event",
      "content": "Join us for our upcoming community event...",
      "image_url": "https://example.com/image.jpg",
      "created_by": "507f1f77bcf86cd799439011",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Post by ID
Get a specific post by ID (Public).

**GET** `/posts/:id`

**Response:**
```json
{
  "post": {
    "id": "507f1f77bcf86cd799439013",
    "title": "Community Event",
    "content": "Join us for our upcoming community event...",
    "image_url": "https://example.com/image.jpg",
    "created_by": "507f1f77bcf86cd799439011",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Create Post
Create a new post (Admin only).

**POST** `/posts`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "New Activity",
  "content": "Description of the activity",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "507f1f77bcf86cd799439014",
    "title": "New Activity",
    "content": "Description of the activity",
    "image_url": "https://example.com/image.jpg",
    "created_by": "507f1f77bcf86cd799439011",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

#### Update Post
Update a post (Admin only).

**PUT** `/posts/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "image_url": "https://example.com/new-image.jpg"
}
```

**Response:**
```json
{
  "message": "Post updated successfully",
  "post": {
    "id": "507f1f77bcf86cd799439014",
    "title": "Updated Title",
    "content": "Updated content",
    "image_url": "https://example.com/new-image.jpg"
  }
}
```

#### Delete Post
Delete a post (Admin only).

**DELETE** `/posts/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

---

### Contact

#### Send Message
Send a contact message (Public).

**POST** `/contact`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I would like to know more about your organization."
}
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "contact": {
    "id": "507f1f77bcf86cd799439015",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "I would like to know more about your organization.",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

#### List Messages
Get all contact messages (Admin only).

**GET** `/contact`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "contacts": [
    {
      "id": "507f1f77bcf86cd799439015",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "message": "I would like to know more about your organization.",
      "created_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
Invalid input or missing required fields.
```json
{
  "error": "error message here"
}
```

### 401 Unauthorized
Missing or invalid authentication token.
```json
{
  "error": "Authorization header required"
}
```

### 403 Forbidden
Insufficient permissions.
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
Resource not found.
```json
{
  "error": "User not found"
}
```

### 409 Conflict
Resource already exists.
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
Server error.
```json
{
  "error": "Failed to process request"
}
```

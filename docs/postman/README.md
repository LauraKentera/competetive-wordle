# Competitive Wordle – Backend API Testing (Postman)

This folder contains the Postman collection and environment used to test the backend API.

---

## 📦 Files

- `CompetitiveWordle-Backend.postman_collection.json`
- `CompetitiveWordle-Local.postman_environment.json`

---

## 🚀 How to Use

### 1. Import Files into Postman

- Open Postman
- Click **Import**
- Import both:
    - The collection file
    - The environment file

---

### 2. Select Environment

In the top-right dropdown, select:

---

### 3. Start Backend

Make sure backend is running:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

### 4. Register a User (First Time Only)

Request:
```
POST /api/auth/register
```

Body example:
```
{
  "username": "testuser",
  "password": "Test123"
}
```

---

### 5. Login

Request:
```
POST /api/auth/login
```

The login request automatically stores the JWT access token in the environment variable:
```
accessToken
```
---

### 6. Test Secure Endpoints

Examples:
```
GET /api/me
GET /api/users/{id}
```

These endpoints require a valid Bearer token.

The collection is configured to automatically use:
```
Authorization: Bearer {{accessToken}}
```
---

### Security Notes
- Passwords are hashed using BCrypt on the backend.
- JWT tokens expire after 1 hour.
- All secured endpoints require authentication.

---

### Testing Flow Summary
1.	Register (once)
2.	Login (token stored automatically)
3.	Test secured endpoints
4.	Token expires after 1 hour → login again


# PostgreSQL Database Setup Guide for AI Navigator

## Prerequisites

You need PostgreSQL 13 or later installed on your system.

---

## Step 1: Install PostgreSQL

### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer (PostgreSQL 15+ recommended)
3. During installation:
   - Set the superuser password (remember this!)
   - Choose port 5432 (default)
   - Install pgAdmin (optional, for GUI management)
4. After installation, PostgreSQL should be running as a service

### Verify Installation:
```bash
psql --version
```

---

## Step 2: Create Database and User

Open **pgAdmin** (if installed) or use the command line:

### Option A: Using pgAdmin (GUI - Easiest)
1. Open pgAdmin
2. Connect to your local PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name it: `ai_navigator`
5. Click Save

### Option B: Using Command Line (psql)
Open PowerShell or Command Prompt and run:

```bash
psql -U postgres
```

When prompted, enter your PostgreSQL superuser password.

Then run these SQL commands:

```sql
-- Create database
CREATE DATABASE ai_navigator;

-- Verify
\l
```

Type `\q` to exit psql.

---

## Step 3: Verify .env Configuration

Check that your `.env` file has the correct database URL:

**File: `backend/.env`**
```
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/ai_navigator
JWT_SECRET=a79b871dd19de190a96638db326ffdd3ff6f4a0a37005ac3dff95053508ce8fc
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_PLACEHOLDER
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHROMA_DB_DIR=./chroma_db
UPLOAD_DIRECTORY=./uploads
# ADMIN_EMAIL removed - admin user creation is no longer performed automatically
```

Replace `YOUR_PASSWORD` with your PostgreSQL superuser password.

---

## Step 4: Initialize Database Schema

Navigate to the backend directory and run:

```bash
cd backend
.venv\Scripts\python.exe init_db.py
```

Expected output:
```
============================================================
AI Navigator Database Setup
============================================================

[1/1] Creating database tables...
✓ Tables created successfully

============================================================
✓ Database setup completed successfully!
============================================================
```

---

## Step 5: Start the Backend Server

```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## Step 6: Test the Authentication

### Test Login Endpoint

Use Postman or curl to authenticate a user once accounts are created via your app's registration flow or seeded users.

**Using Postman or curl:**

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_user@example.com",
    "password": "your_password"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Test with Access Token

```bash
curl -X GET http://127.0.0.1:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Step 7: Frontend Configuration

Update your frontend `.env` to point to the backend:

**File: `.env` (root directory)**
```
VITE_API_URL=http://127.0.0.1:8000
```

Or in your API config:

**File: `src/lib/api/...`**
```typescript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

---

## Admin User Notes

- Admin user creation is not performed automatically by the setup script.
- Create accounts via the app registration flow or seed users as needed.

---

## Database Schema

Tables automatically created:

1. **users** - User accounts and authentication
   - id (Primary Key)
   - name
   - email (Unique)
   - hashed_password
   - role (admin, client, etc.)
   - created_at

2. **categories** - Tool categories
3. **tools** - AI tools/services
4. **documents** - Uploaded documents
5. **bookmarks** - User bookmarks
6. **chat_history** - Chat messages
7. **visited_tools** - User tool visits

---

## Troubleshooting

### Error: "Connection refused"
- PostgreSQL is not running
- **Solution:** Start PostgreSQL service:
  ```bash
  # Windows: Start the service via Services or:
  pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
  ```

### Error: "FATAL: Peer authentication failed for user"
- Password mismatch in .env
- **Solution:** Update DATABASE_URL with correct password

### Error: "Database 'ai_navigator' does not exist"
- Database not created
- **Solution:** Run Step 2 again to create the database

### Error: "asyncpg.exceptions.UnsupportedServerVersionError"
- PostgreSQL version too old
- **Solution:** Upgrade to PostgreSQL 13+

### Checking PostgreSQL Status (Windows)
```bash
# List running services
Get-Service postgres*

# Start PostgreSQL service
Start-Service postgresql-x64-15
```

---

## Next Steps

1. ✓ Database is set up
2. Admin user creation: manual (register or seed)
3. ✓ Backend is running
4. Next: Start frontend dev server and test signin
   ```bash
   npm run dev
   ```

---

## Security Notes

⚠️ **Important for Production:**
- Change default passwords after first login
- Use environment variables for sensitive data
- Enable HTTPS/SSL for the API
- Implement rate limiting on auth endpoints
- Add two-factor authentication (2FA)
- Use strong JWT secrets
- Implement password complexity requirements

---

## Support Commands

```bash
# Check all users in database (via psql):
psql -U postgres -d ai_navigator -c "SELECT id, name, email, role FROM users;"

# Reset passwords (if needed):
# Use database tools or user management endpoints to update passwords

# Backup database:
pg_dump -U postgres ai_navigator > backup.sql

# Restore database:
psql -U postgres ai_navigator < backup.sql
```

---

**Setup Complete! Your AI Navigator backend is ready with secure PostgreSQL authentication.** 🎉

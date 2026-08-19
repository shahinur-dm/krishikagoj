# Krishi-kagos

কৃষিকাগজ — বাংলাদেশের কৃষি নিউজ পোর্টাল (React + Express + MongoDB)

## Local development

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5050/api

## Admin login

- URL: `/login`
- Email: `superadmin@example.com`
- Password: `password`

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `VITE_API_URL` | Frontend API base (local: `http://localhost:5050/api`, Vercel: `/api`) |
| `PORT` | API port (local only) |

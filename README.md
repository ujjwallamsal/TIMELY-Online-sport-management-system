# CAPSTONE - Timely

- Django 5 + DRF + PostgreSQL backend (ASGI/Channels)
- React (Vite) frontend with Tailwind-like utility CSS, accessible UI

## Run (dev)
- Backend: create venv, install requirements, set env, run `daphne -b 127.0.0.1 -p 8000 timely.asgi:application`
- Frontend: `npm i` then `npm run dev` (visit 127.0.0.1:5173)

## Auth quick check
- POST /api/accounts/auth/login/ with admin@example.com / Passw0rd1 => HttpOnly `access`/`refresh`
- GET /api/accounts/users/me/ => 200

## Django Admin vs React UI
- Django Admin is back-office only for Admin/Organizers at `/admin/`.
- React app serves all user-facing flows (Athletes/Coaches/Organizers/Spectators) via `/api/`.
- Admin is branded and restricted to `is_staff`. Organizer staff see only their own Events/Fixtures/Registrations; no access to Users/Payments.
- Security notes (prod): enable `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, set strict CORS/CSRF, and consider IP allowlist and 2FA (django-otp).


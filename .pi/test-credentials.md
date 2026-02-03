# Test Credentials

These credentials are for automated testing and development use.

## Test User

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `testpassword123` |
| Username | `testuser` |
| Display Name | `Test User` |
| User ID | `A3zOh1UucxSE7V8iBTYSC` |

## Usage

Login via the app's sign-in page or use the auth API directly:

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

## Recreating the Test User

If the test user gets deleted or corrupted:

```bash
npx tsx scripts/seed-test-user.ts
```

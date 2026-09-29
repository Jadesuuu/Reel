# Step 3 — Auth

## What this step adds

Register, login, logout and "who am I", with the password stored as an argon2 hash and the
session carried as a JWT inside an httpOnly cookie named `reel_session`. Every later
controller is guarded by the same `JwtAuthGuard` and reads the caller through the same
`@CurrentUser()` decorator, so this is the one place identity is decided.

The routes are specified in the plan's Section 5.2.

## Files, in reading order

1. **`apps/api/src/users/users.service.ts`** — three Prisma calls: find by email, find by id,
   create. Kept separate from auth so that other modules can look a user up without knowing
   anything about passwords.
2. **`apps/api/src/auth/dto/register.dto.ts`** and **`login.dto.ts`** — `class-validator`
   decorators the global `ValidationPipe` enforces before the controller runs. Register requires
   ten to 128 characters; login has no minimum, because the rule applies when a password is
   chosen, not when it is typed.
3. **`apps/api/src/auth/auth.service.ts`** — `register` lowercases the email, refuses a
   duplicate with `409`, hashes with `argon2.hash`, and returns only `{ id, email }`.
   `validateUser` returns `null` for an unknown email _and_ for a wrong password, on purpose:
   a different answer would tell an attacker which emails exist. `signToken` puts the user id
   in `sub` and the email in the payload; there is no database lookup on later requests.
4. **`apps/api/src/auth/jwt.strategy.ts`** — a Passport strategy whose only unusual part is
   the extractor: it reads `req.cookies.reel_session` instead of the `Authorization` header.
   `validate` runs after the signature and expiry checks pass and returns the object that
   becomes `request.user`.
5. **`apps/api/src/auth/jwt-auth.guard.ts`** — `AuthGuard('jwt')` with nothing added. A
   missing or bad cookie is a `401` before the controller method is entered.
6. **`apps/api/src/auth/current-user.decorator.ts`** — a parameter decorator that hands the
   controller `request.user` as `{ userId, email }`. Every guarded route in the codebase takes
   it as its first argument.
7. **`apps/api/src/auth/auth.controller.ts`** — the four routes. `setCookie` is the one place
   the cookie's attributes live: `httpOnly` (JavaScript cannot read it), `sameSite: 'lax'`
   (sent on top-level navigations and same-site fetches, not on cross-site POSTs),
   `secure` from `COOKIE_SECURE` (true in production, false so it works over `http://localhost`),
   seven days. `@Res({ passthrough: true })` lets the method set a cookie and still return a
   body through Nest. Register and login are throttled to ten per minute per IP on top of the
   global limit.
8. **`apps/api/src/auth/auth.module.ts`** — `JwtModule.registerAsync` reads `JWT_SECRET` from
   config and signs with a seven-day expiry to match the cookie.
9. **`apps/api/src/main.ts`** — `cookieParser()` (without it `req.cookies` is undefined) and
   `enableCors({ origin: WEB_ORIGIN, credentials: true })`, which is what lets the web app on
   port 3000 send the cookie to port 4000.
10. **`apps/api/src/auth/auth.service.spec.ts`** — the four unit cases with `UsersService` and
    `JwtService` mocked: hash differs from the password and verifies; duplicate email is a
    conflict; unknown email and wrong password both give null. The e2e coverage lives in
    `test/hardening.e2e-spec.ts`, which registers, reads the `set-cookie` header for
    `HttpOnly`, and checks `me` with and without the cookie.

## Concepts

- **Hash, not encrypt.** A hash cannot be reversed; login recomputes it and compares. argon2
  is slow by design, and slow is the point: it makes guessing expensive.
- **Why a cookie and not localStorage.** A token in localStorage is readable by any script
  that runs on the page, so one XSS hole leaks every session. An httpOnly cookie is invisible
  to scripts; the browser attaches it itself. The cost is CORS with credentials and the
  `sameSite` setting, both handled in `main.ts` and `setCookie`.
- **What a JWT buys.** The server trusts the payload because it signed it; a request needs no
  database read to know who is calling. The trade is that revocation is not instant. The plan
  rules out refresh tokens for this project and says what would change at scale.
- **The browser extension does not use this.** It cannot read the cookie, so Step 24 gave it a
  separate bearer token checked by `BrowserTokenGuard`, which sets the same `request.user`
  shape so the downstream code does not care which guard ran.

## Gotchas

- `@Res()` without `passthrough: true` switches Nest off for that handler, and the method
  must then write the response itself. Every handler here uses passthrough.
- `ConfigService.get` is typed as possibly undefined; the code uses `getOrThrow` everywhere.
- Emails are lowercased at register and at login, so `Jade@` and `jade@` are one account.

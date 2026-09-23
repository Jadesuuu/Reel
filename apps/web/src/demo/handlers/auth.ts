import { ApiError } from '../../lib/api';
import { bad, route } from '../router';
import { DEMO_EMAIL, DEMO_PASSWORD, getState, mutate } from '../store';

function publicUser() {
  const { user } = getState();
  return { id: user.id, email: user.email, timezone: user.timezone, createdAt: user.createdAt };
}

route('GET', '/auth/me', () => {
  const state = getState();
  if (!state.signedIn) throw new ApiError(401, 'Unauthorized');
  return publicUser();
});

route('POST', '/auth/login', ({ body }) => {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const state = getState();
  const known = email === state.user.email.toLowerCase();
  const passwordOk = password === DEMO_PASSWORD || (known && password.length >= 10);
  if (!known || !passwordOk) throw new ApiError(401, 'Invalid credentials');
  mutate((draft) => {
    draft.signedIn = true;
  });
  return publicUser();
});

route('POST', '/auth/register', ({ body }) => {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) bad('email must be an email');
  if (password.length < 10) bad('password must be longer than or equal to 10 characters');
  mutate((draft) => {
    draft.user.email = email;
    draft.signedIn = true;
  });
  return publicUser();
});

route('POST', '/auth/logout', () => {
  mutate((draft) => {
    draft.signedIn = false;
  });
  return undefined;
});

route('POST', '/auth/demo', () => {
  mutate((draft) => {
    draft.user.email = DEMO_EMAIL;
    draft.signedIn = true;
  });
  return publicUser();
});

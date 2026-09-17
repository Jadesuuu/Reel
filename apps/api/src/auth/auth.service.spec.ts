import { ConflictException } from '@nestjs/common';
import argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import type { UsersService } from '../users/users.service.js';
import type { JwtService } from '@nestjs/jwt';

function makeService(
  overrides: Partial<Record<keyof UsersService, unknown>> = {},
) {
  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    ...overrides,
  } as unknown as UsersService;
  const jwt = {
    sign: vi.fn().mockReturnValue('signed.jwt.token'),
  } as unknown as JwtService;
  return { service: new AuthService(users, jwt), users, jwt };
}

describe('AuthService', () => {
  it('hashes the password on register and returns id + email', async () => {
    const { service, users } = makeService();
    (users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (users.create as ReturnType<typeof vi.fn>).mockImplementation(
      ({ email, passwordHash }: { email: string; passwordHash: string }) =>
        Promise.resolve({ id: 'u1', email, passwordHash }),
    );

    const result = await service.register('Jade@Example.com', 'password12345');

    expect(result).toEqual({ id: 'u1', email: 'jade@example.com' });
    const created = (users.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(created.passwordHash).not.toBe('password12345');
    expect(await argon2.verify(created.passwordHash, 'password12345')).toBe(
      true,
    );
  });

  it('rejects a duplicate email', async () => {
    const { service, users } = makeService();
    (users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
    });
    await expect(
      service.register('a@b.com', 'password12345'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns null for an unknown email', async () => {
    const { service, users } = makeService();
    (users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await service.validateUser('missing@b.com', 'x')).toBeNull();
  });

  it('returns null for a wrong password', async () => {
    const { service, users } = makeService();
    const passwordHash = await argon2.hash('correct-password');
    (users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash,
    });
    expect(await service.validateUser('a@b.com', 'wrong-password')).toBeNull();
  });
});

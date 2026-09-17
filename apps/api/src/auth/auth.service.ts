import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { UsersService } from '../users/users.service.js';

export type AuthUser = { id: string; email: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<AuthUser> {
    const normalized = email.toLowerCase();
    const existing = await this.users.findByEmail(normalized);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(password);
    const user = await this.users.create({ email: normalized, passwordHash });
    return { id: user.id, email: user.email };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user) {
      return null;
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return null;
    }
    return { id: user.id, email: user.email };
  }

  signToken(user: AuthUser): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}

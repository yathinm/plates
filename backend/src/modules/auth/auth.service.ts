import { eq, or } from 'drizzle-orm';
import { db, users } from '../../database';
import { hashPassword, verifyPassword } from '../../common/password';
import { signToken } from '../../common/jwt';
import { ConflictError, UnauthorizedError, ValidationError } from '../../common/errors';

interface SignupInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

interface LoginInput {
  login: string;   // username or email
  password: string;
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const { username, email, password, displayName } = input;

  if (!username || username.length < 3 || username.length > 30) {
    throw new ValidationError('Username must be 3-30 characters');
  }
  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email address');
  }
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('Username or email already taken');
  }

  const passwordHash = await hashPassword(password);

  const [created] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      displayName: displayName || username,
    })
    .returning();

  const token = signToken({ userId: created.id, username: created.username });

  return {
    token,
    user: {
      id: created.id,
      username: created.username,
      email: created.email,
      displayName: created.displayName,
      bio: created.bio,
      avatarUrl: created.avatarUrl,
      createdAt: created.createdAt,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { login, password } = input;

  if (!login || !password) {
    throw new ValidationError('Login and password are required');
  }

  const [found] = await db
    .select()
    .from(users)
    .where(
      login.includes('@')
        ? eq(users.email, login)
        : eq(users.username, login),
    )
    .limit(1);

  if (!found) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await verifyPassword(password, found.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = signToken({ userId: found.id, username: found.username });

  return {
    token,
    user: {
      id: found.id,
      username: found.username,
      email: found.email,
      displayName: found.displayName,
      bio: found.bio,
      avatarUrl: found.avatarUrl,
      createdAt: found.createdAt,
    },
  };
}

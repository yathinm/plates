import { prisma } from '../../database';
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
  login: string;
  password: string;
}

function sanitizeUser(user: any) {
  return {
    id:          user.id,
    username:    user.username,
    email:       user.email,
    displayName: user.displayName,
    bio:         user.bio,
    avatarUrl:   user.avatarUrl,
    createdAt:   user.createdAt,
  };
}

export async function signup(input: SignupInput) {
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

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Username or email already taken');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      displayName: displayName || username,
    },
  });

  const token = signToken({ userId: user.id, username: user.username });

  return { token, user: sanitizeUser(user) };
}

export async function login(input: LoginInput) {
  const { login, password } = input;

  if (!login || !password) {
    throw new ValidationError('Login and password are required');
  }

  const user = await prisma.user.findFirst({
    where: login.includes('@')
      ? { email: login }
      : { username: login },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = signToken({ userId: user.id, username: user.username });

  return { token, user: sanitizeUser(user) };
}

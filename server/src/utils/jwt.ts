import jwt from 'jsonwebtoken';

// TODO: Move JWT_SECRET to environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-env';
if (JWT_SECRET === 'your-super-secret-key-that-should-be-in-env') {
  console.warn('Warning: Using default JWT_SECRET. Please set a strong secret in environment variables for production.');
}

const JWT_EXPIRATION = '1h'; // Token expires in 1 hour

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (userId: string, email: string, role: string): string => {
  const payload: UserPayload = { userId, email, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

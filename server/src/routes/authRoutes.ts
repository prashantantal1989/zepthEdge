import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/database'; // Assuming pool is exported for querying
import { generateToken } from '../utils/jwt';

const router = express.Router();

const BCRYPT_SALT_ROUNDS = 10;

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Basic email format check
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  let client;
  try {
    client = await pool.connect();

    // Check if user already exists
    const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insert new user
    const newUserResult = await client.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role, created_at, updated_at',
      [email, passwordHash, full_name || null]
    );
    const newUser = newUserResult.rows[0];

    // Generate JWT
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Return response
    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error.stack ? error.stack : error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  } finally {
    if (client) client.release();
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  let client;
  try {
    client = await pool.connect();

    // Retrieve user by email
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }
    const user = userResult.rows[0];

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Generate JWT
    const token = generateToken(user.id, user.email, user.role);

    // Return response
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error.stack ? error.stack : error);
    res.status(500).json({ message: 'Internal server error during login.' });
  } finally {
    if (client) client.release();
  }
});

export default router;

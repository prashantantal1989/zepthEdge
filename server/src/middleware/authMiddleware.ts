import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Request as ExpressRequest } from 'express'; // Import Request type from express

// Define an interface that extends express.Request
export interface AuthenticatedRequest extends ExpressRequest {
  user?: any; // Define the user property. Use 'any' or a more specific type for the user payload
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: 'Access token is missing or malformed.' });
    }

    const userPayload = verifyToken(token);

    if (userPayload) {
      req.user = userPayload; // Attach user payload to the request object
      next();
    } else {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
  } else {
    return res.status(401).json({ message: 'Authorization header is missing.' });
  }
};

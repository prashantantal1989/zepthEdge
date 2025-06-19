import express, { Router } from 'express';
import { pool } from '../db/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';

const router: Router = Router();

// Apply authenticateJWT middleware to all routes in this router
router.use(authenticateJWT);

// GET /api/users/me - Get the currently authenticated user's profile
router.get('/users/me', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId; // Extracted from JWT by authenticateJWT middleware

  if (!userId) {
    // This case should ideally not be reached if authenticateJWT is effective
    return res.status(401).json({ message: 'Unauthorized: User ID not found in token.' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, avatar_url, role AS global_role, created_at FROM public.users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      // This would mean JWT is valid but user doesn't exist in DB, which is an inconsistency.
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = userResult.rows[0];

    // Fetch associated properties for the user
    const propertyUsersResult = await pool.query(
      `SELECT p.id AS property_id, p.name AS property_name, pu.role AS property_role
       FROM property_users pu
       JOIN properties p ON pu.property_id = p.id
       WHERE pu.user_id = $1`,
      [userId]
    );

    const userWithProperties = {
      ...user,
      properties: propertyUsersResult.rows,
    };

    // Map to frontend User type if necessary, e.g. full_name -> name, global_role -> role
    // For now, sending as is, AuthContext will adapt.
    // The AuthContext expects: id, email, name (maps to full_name), avatar (maps to avatar_url), role (maps to global_role), properties (string[])
    // The backend provides properties as an array of objects. AuthContext's fetchCurrentUser will need to map this.
    // Let's align it a bit here to match the frontend User type more closely, if possible.
    const frontendUserShape = {
        id: userWithProperties.id,
        email: userWithProperties.email,
        name: userWithProperties.full_name, // Map full_name to name
        avatar: userWithProperties.avatar_url, // Map avatar_url to avatar
        role: userWithProperties.global_role, // Map global_role to role
        properties: userWithProperties.properties, // Keep as array of objects, AuthContext will handle
        status: 'active', // Assuming active if authenticated
        dateJoined: userWithProperties.created_at,
    };


    res.status(200).json(frontendUserShape);
  } catch (error: any) {
    console.error(`Error fetching current user (me) ${userId}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});


// TODO: Define User and PropertyUser types, possibly importing from src/types/user.ts or a shared types location.
// For now, using 'any' or inline object shapes.

// GET /api/users - Get all users with their property associations
router.get('/users', async (req: AuthenticatedRequest, res) => {
  // TODO: Implement admin-only access control for this route.
  // For now, accessible to any authenticated user.
  console.log(`User making request: ${JSON.stringify(req.user)}`); // Log user from JWT

  try {
    const usersResult = await pool.query(
      'SELECT id, email, full_name, avatar_url, role AS global_role, created_at FROM public.users ORDER BY created_at DESC'
    );
    const users = usersResult.rows;

    const usersWithProperties = [];
    for (const user of users) {
      const propertyUsersResult = await pool.query(
        `SELECT p.id AS property_id, p.name AS property_name, pu.role AS property_role
         FROM property_users pu
         JOIN properties p ON pu.property_id = p.id
         WHERE pu.user_id = $1`,
        [user.id]
      );
      usersWithProperties.push({
        ...user,
        properties: propertyUsersResult.rows,
      });
    }

    res.status(200).json(usersWithProperties);
  } catch (error: any) {
    console.error('Error fetching users:', error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// GET /api/users/:id - Get a specific user by ID with property associations
router.get('/users/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  // TODO: Implement access control: User can get their own profile, or admin can get any.
  // For now, any authenticated user can fetch any profile by ID.
  // console.log(`User ${req.user?.userId} attempting to fetch profile for user ${id}`);

  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, avatar_url, role AS global_role, created_at FROM public.users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    const propertyUsersResult = await pool.query(
      `SELECT p.id AS property_id, p.name AS property_name, pu.role AS property_role
       FROM property_users pu
       JOIN properties p ON pu.property_id = p.id
       WHERE pu.user_id = $1`,
      [user.id]
    );

    const userWithProperties = {
      ...user,
      properties: propertyUsersResult.rows,
    };

    res.status(200).json(userWithProperties);
  } catch (error: any) {
    console.error(`Error fetching user ${id}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: `Error fetching user ${id}` });
  }
});

// GET /api/properties/:propertyId/users - Get all users for a specific property
router.get('/properties/:propertyId/users', async (req: AuthenticatedRequest, res) => {
  const { propertyId } = req.params;
  // TODO: Implement access control: Only users associated with the property or admins.
  // For now, any authenticated user can fetch users for any property.
  // console.log(`User ${req.user?.userId} attempting to fetch users for property ${propertyId}`);

  try {
    // First, check if the property exists to give a better error message
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ message: `Property with ID ${propertyId} not found.` });
    }

    const result = await pool.query(
      `SELECT
         u.id AS user_id,
         u.email,
         u.full_name,
         u.avatar_url,
         pu.id AS assignment_id, -- This is the ID of the property_users record
         pu.role AS property_role,
         pu.created_at AS assigned_at
       FROM property_users pu
       JOIN public.users u ON pu.user_id = u.id
       WHERE pu.property_id = $1
       ORDER BY u.full_name ASC`,
      [propertyId]
    );

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error(`Error fetching users for property ${propertyId}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: `Error fetching users for property ${propertyId}` });
  }
});

// POST /api/properties/:propertyId/users - Assign a user to a property with a specific role
router.post('/properties/:propertyId/users', async (req: AuthenticatedRequest, res) => {
  const { propertyId } = req.params;
  const { userId, role } = req.body;

  // TODO: Implement access control: Property managers or admins.
  // For now, any authenticated user can assign users.
  // console.log(`User ${req.user?.userId} attempting to assign user ${userId} with role ${role} to property ${propertyId}`);

  if (!userId || !role) {
    return res.status(400).json({ message: 'userId and role are required in the request body.' });
  }
  // TODO: Add more validation for `role` if there's a predefined set of property-specific roles.

  try {
    // Check if property exists
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1', [propertyId]);
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ message: `Property with ID ${propertyId} not found.` });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM public.users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    // Check for existing assignment (property_id, user_id, role should be unique as per schema)
    const existingAssignment = await pool.query(
      'SELECT id FROM property_users WHERE property_id = $1 AND user_id = $2 AND role = $3',
      [propertyId, userId, role]
    );
    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({ message: 'This user is already assigned this role for this property.' });
    }


    const result = await pool.query(
      'INSERT INTO property_users (property_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [propertyId, userId, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error assigning user ${userId} to property ${propertyId}:`, error.stack ? error.stack : error);
    // Catch unique violation for (property_id, user_id) if role is not part of the unique constraint but we want to prevent duplicate (user,property) pairs regardless of role.
    // The current schema has UNIQUE(property_id, user_id, role), so the above 409 check is more specific.
    if (error.code === '23505') { // Unique violation
        return res.status(409).json({ message: 'User assignment conflict. This user might already have a role on this property or another unique constraint was violated.' });
    }
    res.status(500).json({ message: `Error assigning user to property` });
  }
});

// DELETE /api/property-users/:assignmentId - Remove a user's assignment from a property
router.delete('/property-users/:assignmentId', async (req: AuthenticatedRequest, res) => {
  const { assignmentId } = req.params;

  // TODO: Implement access control: Property managers, admins, or user themselves (for their own assignments).
  // For now, any authenticated user can delete any assignment.
  // console.log(`User ${req.user?.userId} attempting to delete property assignment ${assignmentId}`);

  try {
    const result = await pool.query('DELETE FROM property_users WHERE id = $1 RETURNING *', [assignmentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Property assignment with ID ${assignmentId} not found.` });
    }

    res.status(204).send(); // No Content
  } catch (error: any) {
    console.error(`Error deleting property assignment ${assignmentId}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: `Error deleting property assignment` });
  }
});

// PATCH /api/property-users/:assignmentId/role - Update a user's role for a specific property assignment
router.patch('/property-users/:assignmentId/role', async (req: AuthenticatedRequest, res) => {
  const { assignmentId } = req.params;
  const { role } = req.body;

  // TODO: Implement access control: Property managers or admins.
  // For now, any authenticated user can update any assignment role.
  // console.log(`User ${req.user?.userId} attempting to update role for assignment ${assignmentId} to ${role}`);

  if (!role) {
    return res.status(400).json({ message: 'Role is required in the request body.' });
  }
  // TODO: Add validation for `role` if there's a predefined set of property-specific roles.

  try {
    const result = await pool.query(
      'UPDATE property_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      // Note: property_users doesn't have updated_at in the current schema.sql.
      // If it's added, the query above is fine. If not, remove updated_at.
      // For now, assuming it's not there as per schema.sql from previous step.
      // 'UPDATE property_users SET role = $1 WHERE id = $2 RETURNING *',
      [role, assignmentId]
    );

    // Re-adjusting based on the schema.sql which does not have updated_at for property_users
    const updateQuery = 'UPDATE property_users SET role = $1 WHERE id = $2 RETURNING *';
    const updatedResult = await pool.query(updateQuery, [role, assignmentId]);


    if (updatedResult.rowCount === 0) {
      return res.status(404).json({ message: `Property assignment with ID ${assignmentId} not found.` });
    }

    res.status(200).json(updatedResult.rows[0]);
  } catch (error: any) {
    console.error(`Error updating role for property assignment ${assignmentId}:`, error.stack ? error.stack : error);
     if (error.code === '23505') { // Unique violation if (property_id, user_id, role) must be unique
        return res.status(409).json({ message: 'This user is already assigned this role for this property.' });
    }
    res.status(500).json({ message: `Error updating role for property assignment` });
  }
});

export default router;

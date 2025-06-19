import express, { Router, Request, Response } from 'express';
import { pool } from '../db/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';

const router: Router = Router();

// Apply authenticateJWT middleware to all routes in this router
router.use(authenticateJWT);

// TODO: Define WorkflowTemplate, WorkflowInstance, WorkflowStep types, possibly from shared types.
// For now, using 'any' or inline object shapes.

// --- Workflow Template Routes ---

// GET /api/workflow-templates - Get all workflow templates
router.get('/workflow-templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM workflow_templates ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error fetching workflow templates:', error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error fetching workflow templates' });
  }
});

// POST /api/workflow-templates - Create a new workflow template
router.post('/workflow-templates', async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, category, steps } = req.body;
  const userId = req.user?.userId; // Assuming userId is stored in JWT payload

  // TODO: Access control (admin/manager only)
  if (!userId) {
      return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
  }

  if (!name || !steps || !Array.isArray(steps)) {
    return res.status(400).json({ message: 'Name and steps (array) are required.' });
  }
  // TODO: Validate structure of each step in the steps array

  try {
    const result = await pool.query(
      'INSERT INTO workflow_templates (name, description, category, steps, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
      [name, description || null, category || null, JSON.stringify(steps), userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating workflow template:', error.stack ? error.stack : error);
    if (error.code === '23505') { // unique_violation for name if it's set to unique
        return res.status(409).json({ message: `Workflow template with name '${name}' already exists.` });
    }
    res.status(500).json({ message: 'Error creating workflow template' });
  }
});

// GET /api/workflow-templates/:id - Get a specific workflow template by ID
router.get('/workflow-templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM workflow_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Workflow template with ID ${id} not found.` });
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error fetching workflow template ${id}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: `Error fetching workflow template ${id}` });
  }
});

// PUT /api/workflow-templates/:id - Update an existing workflow template
router.put('/workflow-templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, category, steps } = req.body;
  const userId = req.user?.userId;

  // TODO: Access control (admin/manager only)
   if (!userId) {
      return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
  }

  if (!name || !steps || !Array.isArray(steps)) {
    return res.status(400).json({ message: 'Name and steps (array) are required.' });
  }
  // TODO: Validate structure of each step

  try {
    const result = await pool.query(
      'UPDATE workflow_templates SET name = $1, description = $2, category = $3, steps = $4, updated_by = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description || null, category || null, JSON.stringify(steps), userId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Workflow template with ID ${id} not found.` });
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error updating workflow template ${id}:`, error.stack ? error.stack : error);
     if (error.code === '23505') { // unique_violation for name if it's set to unique
        return res.status(409).json({ message: `Workflow template with name '${name}' already exists.` });
    }
    res.status(500).json({ message: `Error updating workflow template ${id}` });
  }
});

// DELETE /api/workflow-templates/:id - Delete a workflow template
router.delete('/workflow-templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  // TODO: Access control (admin/manager only)
  // Also, consider if templates referenced by active workflows should be deletable (soft delete might be better).
  // For now, direct delete. Check for foreign key constraint violations if workflows reference it.

  if (!userId) {
      return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
  }

  try {
    // Check if any workflows are using this template.
    // The FOREIGN KEY constraint on workflows.template_id is ON DELETE RESTRICT by default from schema.sql.
    // So, an attempt to delete a used template will fail at DB level.
    // We can check this proactively if we want a friendlier error message.
    const usageCheck = await pool.query('SELECT id FROM workflows WHERE template_id = $1 LIMIT 1', [id]);
    if (usageCheck.rows.length > 0) {
        return res.status(400).json({ message: `Workflow template with ID ${id} is currently in use by active workflows and cannot be deleted.` });
    }

    const result = await pool.query('DELETE FROM workflow_templates WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Workflow template with ID ${id} not found.` });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error deleting workflow template ${id}:`, error.stack ? error.stack : error);
    if (error.code === '23503') { // foreign_key_violation
        return res.status(400).json({ message: `Workflow template with ID ${id} cannot be deleted because it is referenced by existing workflows.` });
    }
    res.status(500).json({ message: `Error deleting workflow template ${id}` });
  }
});

// --- Helper function to update associated entity status ---
const updateAssociatedEntityStatus = async (
  entityType: string,
  entityId: string,
  workflowStatus: 'completed' | 'rejected' | 'active' | 'cancelled', // expanded to include more workflow outcomes
  userId: string
): Promise<void> => {
  let targetTable: string = '';
  let targetStatus: string = '';

  // Map workflow status to entity-specific status
  switch (entityType) {
    case 'capex_request':
      targetTable = 'capex_requests';
      if (workflowStatus === 'completed') targetStatus = 'approved';
      else if (workflowStatus === 'rejected') targetStatus = 'rejected';
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending_approval'; // Default or if workflow is just 'active'
      break;
    case 'asset_disposal':
      targetTable = 'asset_disposals';
      if (workflowStatus === 'completed') targetStatus = 'approved'; // Or 'completed' if that's a status for asset_disposals
      else if (workflowStatus === 'rejected') targetStatus = 'rejected';
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending_approval';
      break;
    case 'budget_request': // Assuming these exist and have a status field
      targetTable = 'budget_requests';
      if (workflowStatus === 'completed') targetStatus = 'approved';
      else if (workflowStatus === 'rejected') targetStatus = 'rejected';
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending';
      break;
    case 'budget_transfer': // Assuming these exist and have a status field
      targetTable = 'budget_transfers';
      if (workflowStatus === 'completed') targetStatus = 'approved';
      else if (workflowStatus === 'rejected') targetStatus = 'rejected';
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending';
      break;
    case 'submittal':
      targetTable = 'submittals';
      if (workflowStatus === 'completed') targetStatus = 'approved';
      else if (workflowStatus === 'rejected') targetStatus = 'rejected';
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending_review';
      break;
    case 'rfi':
      targetTable = 'rfis';
      if (workflowStatus === 'completed') targetStatus = 'answered'; // Or 'closed'
      else if (workflowStatus === 'rejected') targetStatus = 'closed'; // Or a specific rejected status if exists
      else if (workflowStatus === 'cancelled') targetStatus = 'cancelled';
      else targetStatus = 'pending_response';
      break;
    // Add other entity types as needed
    default:
      console.warn(`Unsupported entity type for status update: ${entityType}`);
      return;
  }

  if (targetTable && targetStatus) {
    const query = `UPDATE ${targetTable} SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`;
    try {
      const result = await pool.query(query, [targetStatus, userId, entityId]);
      if (result.rowCount > 0) {
        console.log(`Updated status of ${entityType} ${entityId} to ${targetStatus}`);
      } else {
        console.warn(`No ${entityType} found with ID ${entityId} to update status.`);
      }
    } catch (error: any) {
      console.error(`Error updating status for ${entityType} ${entityId}:`, error.stack ? error.stack : error);
    }
  } else if (targetTable && !targetStatus && workflowStatus === 'active') {
    // If workflow is just active, we might not need to change the entity status from its initial "pending" state.
    console.log(`Workflow for ${entityType} ${entityId} is active. Entity status may not require change from its initial pending state.`);
  } else {
     console.warn(`Could not determine target status or table for ${entityType} with workflow status ${workflowStatus}. Entity status not updated.`);
  }
};


// --- Workflow Instance Routes ---

// POST /api/workflows - Create a new workflow instance
router.post('/workflows', async (req: AuthenticatedRequest, res: Response) => {
  const { templateId, entityType, entityId, context } = req.body; // Added context for more info if needed
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
  }
  if (!templateId || !entityType || !entityId) {
    return res.status(400).json({ message: 'templateId, entityType, and entityId are required.' });
  }

  try {
    // 1. Fetch the workflow template
    const templateResult = await pool.query('SELECT * FROM workflow_templates WHERE id = $1', [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ message: `Workflow template with ID ${templateId} not found.` });
    }
    const template = templateResult.rows[0];

    // 2. Initialize steps_data from template steps
    //    Each step in template.steps is like: {id: "uuid", name: "Step Name", description: "...", approver_role: "role_name"}
    //    steps_data will store: {id: "uuid", name: "Step Name", approver_role: "role_name", status: "pending/waiting", userId: null, comment: null, decided_at: null }
    const initialStepsData = template.steps.map((step: any, index: number) => ({
      id: step.id || `step_${index + 1}`, // Use template step ID or generate one
      name: step.name,
      description: step.description || '',
      approver_role: step.approver_role, // Role that can action this step
      status: index === 0 ? 'pending' : 'waiting', // First step is pending, others are waiting
      actioned_by_user_id: null,
      comment: null,
      actioned_at: null,
    }));

    // 3. Determine initial workflow status and current_step
    const initialStatus = 'active'; // Or 'pending_start' if an explicit start action is needed
    const initialCurrentStep = 0; // Index of the first step

    // 4. Insert the new workflow instance
    const workflowResult = await pool.query(
      `INSERT INTO workflows (template_id, entity_type, entity_id, status, current_step, steps_data, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *`,
      [templateId, entityType, entityId, initialStatus, initialCurrentStep, JSON.stringify(initialStepsData), userId]
    );

    const newWorkflowInstance = workflowResult.rows[0];

    // Optionally, update the associated entity's status to 'pending_approval' or similar
    // This depends on whether the entity status is driven by workflow creation or first step approval
    // For now, assuming the entity is already in a state awaiting workflow (e.g. capex_request 'draft' or 'pending_approval')
    // Or call: await updateAssociatedEntityStatus(entityType, entityId, 'active', userId);

    res.status(201).json(newWorkflowInstance);
  } catch (error: any) {
    console.error('Error creating workflow instance:', error.stack ? error.stack : error);
    if (error.code === '23503') { // foreign_key_violation (e.g. entityId doesn't exist in its table)
        return res.status(400).json({ message: `Invalid entityId or templateId. Ensure related records exist.`});
    }
    res.status(500).json({ message: 'Error creating workflow instance' });
  }
});

// GET /api/workflows/:id - Get a specific workflow instance by ID
router.get('/workflows/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // TODO: Access control - user should be involved in the workflow (creator, approver in a step) or admin.
  try {
    const result = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Workflow instance with ID ${id} not found.` });
    }
    // Ensure steps_data is parsed if stored as JSON string (it should be JSONB from schema, so direct access is fine)
    // const workflow = result.rows[0];
    // if (typeof workflow.steps_data === 'string') {
    //   workflow.steps_data = JSON.parse(workflow.steps_data);
    // }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error fetching workflow instance ${id}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: `Error fetching workflow instance ${id}` });
  }
});

// PATCH /api/workflows/:workflowId/steps/:stepIndex - Update a workflow step (approve/reject)
router.patch('/workflows/:workflowId/steps/:stepIndex', async (req: AuthenticatedRequest, res: Response) => {
  const { workflowId, stepIndex: stepIndexStr } = req.params;
  const { status: newStepStatus, comment } = req.body; // 'approved' or 'rejected'
  const userId = req.user?.userId;
  const userRole = req.user?.role; // Global role from JWT, or we might need property-specific role.

  if (!userId) {
    return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
  }
  if (newStepStatus !== 'approved' && newStepStatus !== 'rejected') {
    return res.status(400).json({ message: "Invalid step status. Must be 'approved' or 'rejected'." });
  }

  const stepIndex = parseInt(stepIndexStr, 10);
  if (isNaN(stepIndex) || stepIndex < 0) {
    return res.status(400).json({ message: 'Invalid step index.' });
  }

  try {
    const workflowResult = await pool.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ message: `Workflow instance with ID ${workflowId} not found.` });
    }
    const workflow = workflowResult.rows[0];

    if (workflow.status !== 'active') {
      return res.status(400).json({ message: `Workflow is not active. Current status: ${workflow.status}` });
    }
    if (stepIndex !== workflow.current_step) {
      return res.status(400).json({ message: `This is not the current step for this workflow. Current step is ${workflow.current_step}.`});
    }

    const stepsData = Array.isArray(workflow.steps_data) ? workflow.steps_data : JSON.parse(workflow.steps_data || '[]');
    if (stepIndex >= stepsData.length) {
      return res.status(400).json({ message: 'Step index out of bounds.' });
    }

    const currentStepDetails = stepsData[stepIndex];

    // TODO: RBAC - Check if the current user (userId, userRole) is allowed to action this step.
    // This requires knowing the user's role (e.g., from JWT or another query) and matching it against currentStepDetails.approver_role.
    // This check needs to be robust. For example, if approver_role is 'finance_manager', check if req.user.role matches.
    // const userRoles = req.user?.roles || []; // Assuming roles are part of JWT or fetched separately.
    // if (!userRoles.includes(currentStepDetails.approver_role) && !userRoles.includes('admin')) { // Admin override
    //   return res.status(403).json({ message: `Forbidden: User does not have the required role (${currentStepDetails.approver_role}) to action this step.` });
    // }
    console.log(`User role from JWT: ${userRole}. Required role for step: ${currentStepDetails.approver_role}`);
    // For now, simple check against global role. This needs to be more sophisticated (e.g. check property_users roles).
    if (currentStepDetails.approver_role && userRole !== currentStepDetails.approver_role && userRole !== 'admin') {
         console.warn(`Potential RBAC issue: User role '${userRole}' may not match required '${currentStepDetails.approver_role}'. Allowing for now due to simplified RBAC.`);
    }


    // Update the specific step
    stepsData[stepIndex] = {
      ...currentStepDetails,
      status: newStepStatus,
      actioned_by_user_id: userId,
      comment: comment || null,
      actioned_at: new Date().toISOString(),
    };

    let newWorkflowOverallStatus = workflow.status;
    let newCurrentStepIndex = workflow.current_step;

    if (newStepStatus === 'rejected') {
      newWorkflowOverallStatus = 'rejected';
      // current_step remains the one that was rejected.
    } else if (newStepStatus === 'approved') {
      if (stepIndex === stepsData.length - 1) { // Last step was approved
        newWorkflowOverallStatus = 'completed';
        newCurrentStepIndex = stepIndex; // Or stepsData.length to indicate completion
      } else { // Move to next step
        newCurrentStepIndex = stepIndex + 1;
        if (newCurrentStepIndex < stepsData.length) {
          stepsData[newCurrentStepIndex].status = 'pending';
        } else {
          // Should not happen if previous check for last step is correct
          console.error("Workflow logic error: advanced past last step.");
          newWorkflowOverallStatus = 'completed'; // Fallback
        }
      }
    }

    // Update workflow instance in DB
    const updatedWorkflowResult = await pool.query(
      'UPDATE workflows SET status = $1, current_step = $2, steps_data = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [newWorkflowOverallStatus, newCurrentStepIndex, JSON.stringify(stepsData), userId, workflowId]
    );

    // If workflow is completed or rejected, update the associated entity
    if (newWorkflowOverallStatus === 'completed' || newWorkflowOverallStatus === 'rejected' || newWorkflowOverallStatus === 'cancelled') {
      await updateAssociatedEntityStatus(workflow.entity_type, workflow.entity_id, newWorkflowOverallStatus, userId);
    }

    res.status(200).json(updatedWorkflowResult.rows[0]);

  } catch (error: any) {
    console.error(`Error updating workflow step for ${workflowId}:`, error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error updating workflow step' });
  }
});

export default router;

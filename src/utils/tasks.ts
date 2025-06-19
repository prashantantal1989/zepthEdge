import { request } from '../lib/apiClient';

// Align with backend schema: ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled')
// And priority: ('low', 'medium', 'high', 'critical')
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskUpdate {
  title?: string;
  description?: string;
  assignee?: string; // Should be assignee_user_id
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  propertyId?: string; // If task can be moved between properties
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface Task {
  id: string;
  propertyId?: string; // Optional if task can be non-property specific
  title: string;
  description?: string;
  assignee?: string; // User ID (assignee_user_id from backend)
  dueDate?: string; // Optional to align with schema
  priority: TaskPriority;
  status: TaskStatus;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
  createdBy?: string; // User ID
  updatedAt?: string;
  updatedBy?: string; // User ID
}

// Helper to map backend data to frontend Task type
const mapToFrontendTask = (data: any): Task => {
  return {
    id: data.id,
    propertyId: data.property_id,
    title: data.title,
    description: data.description,
    assignee: data.assignee_user_id, // Map from assignee_user_id
    dueDate: data.due_date,
    priority: data.priority as TaskPriority,
    status: data.status as TaskStatus,
    relatedEntityType: data.related_entity_type,
    relatedEntityId: data.related_entity_id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
};

// Helper to map frontend Task data (for create/update) to backend payload
const mapToBackendTaskPayload = (
  taskData: Partial<TaskUpdate> | Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): any => {
  const payload: any = {};
  if (taskData.title !== undefined) payload.title = taskData.title;
  if (taskData.description !== undefined) payload.description = taskData.description;
  if (taskData.propertyId !== undefined) payload.property_id = taskData.propertyId;
  if (taskData.assignee !== undefined) payload.assignee_user_id = taskData.assignee;
  if (taskData.dueDate !== undefined) payload.due_date = taskData.dueDate;
  if (taskData.priority !== undefined) payload.priority = taskData.priority;
  if (taskData.status !== undefined) payload.status = taskData.status;
  if (taskData.relatedEntityType !== undefined) payload.related_entity_type = taskData.relatedEntityType;
  if (taskData.relatedEntityId !== undefined) payload.related_entity_id = taskData.relatedEntityId;
  // created_by, updated_by are handled by backend
  return payload;
};

export const loadTasks = async (
  propertyId?: string, // Optional
  status?: TaskStatus
): Promise<Task[]> => {
  // TODO: Define backend API: GET /api/tasks?propertyId=X&status=Y
  let endpoint = '/api/tasks';
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (status) params.append('status', status);
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await request<any[]>(endpoint, { method: 'GET' }); // Replace any[] with BackendTask[]
    return data.map(mapToFrontendTask);
  } catch (error) {
    console.error('Error loading tasks via API:', error);
    return [];
  }
};

export const createTask = async (
  // Ensure 'priority' and 'status' are provided, or have defaults if not in Omit
  taskData: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Task | null> => {
  // TODO: Define backend API: POST /api/tasks
  // Backend sets id, created_by, created_at, updated_at
  try {
    const payload = mapToBackendTaskPayload(taskData);
    const data = await request<any>('/api/tasks', { // Replace any with BackendTask
      method: 'POST',
      body: payload,
    });
    return mapToFrontendTask(data);
  } catch (error) {
    console.error('Error creating task via API:', error);
    return null;
  }
};

// updateTaskStatus can be a specific variant of updateTask
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task | null> => {
  // This will call the general updateTask function
  return updateTask(taskId, { status });
};

export const updateTask = async (
  id: string,
  updates: TaskUpdate
): Promise<Task | null> => {
  // TODO: Define backend API: PATCH /api/tasks/:id
  // Backend sets updated_by, updated_at
  try {
    const payload = mapToBackendTaskPayload(updates);
    const data = await request<any>(`/api/tasks/${id}`, { // Replace any with BackendTask
      method: 'PATCH',
      body: payload,
    });
    return mapToFrontendTask(data);
  } catch (error) {
    console.error(`Error updating task ${id} via API:`, error);
    return null; // Or throw error
  }
};

export const deleteTask = async (id: string): Promise<boolean> => {
  // TODO: Define backend API: DELETE /api/tasks/:id
  try {
    await request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error(`Error deleting task ${id} via API:`, error);
    return false;
  }
};

// TODO: Add getTaskById(id: string) if needed
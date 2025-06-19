import { supabase } from '../lib/supabase';

// Mock data for development
const mockTasks: Task[] = [
  {
    id: 'j9k0l1m2-n3o4-5p6q-7r8s-t9u0v1w2x3y4',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    title: 'Review Q2 budget proposals',
    description: 'Review and approve department budget proposals for Q2',
    assignee: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    dueDate: '2024-05-15',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2024-04-01T10:30:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-05T14:45:00Z'
  },
  {
    id: 'k0l1m2n3-o4p5-6q7r-8s9t-u0v1w2x3y4z5',
    propertyId: '3c6c8353-2122-4e63-b63b-c9bdcb6b94a3',
    title: 'Prepare staff training schedule',
    description: 'Create training schedule for new front desk staff',
    assignee: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    dueDate: '2024-04-20',
    priority: 'medium',
    status: 'todo',
    createdAt: '2024-04-02T09:15:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-02T09:15:00Z'
  },
  {
    id: 'l1m2n3o4-p5q6-7r8s-9t0u-v1w2x3y4z5a6',
    propertyId: 'f8d7a9e5-b8c2-4b3a-9f4e-d5c6b7a8f9e0',
    title: 'Update vendor contracts',
    description: 'Review and update contracts with key suppliers',
    assignee: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    dueDate: '2024-04-30',
    priority: 'high',
    status: 'todo',
    createdAt: '2024-04-03T11:45:00Z',
    createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
    updatedAt: '2024-04-03T11:45:00Z'
  }
];

export interface TaskUpdate {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface Task {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export const loadTasks = async (
  propertyId: string,
  status?: 'todo' | 'in_progress' | 'review' | 'done'
): Promise<Task[]> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      let filteredTasks = mockTasks.filter(task => task.propertyId === propertyId);
      
      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }
      
      return filteredTasks;
    }
    
    // In production, fetch from Supabase
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('property_id', propertyId);
  
    if (status) {
      query = query.eq('status', status);
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  
    return data.map(row => ({
      id: row.id,
      propertyId: row.property_id,
      title: row.title,
      description: row.description,
      assignee: row.assignee,
      dueDate: row.due_date,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    }));
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const createTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<Task | null> => {
  try {
    // In development mode, return mock data
    if (import.meta.env.DEV) {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: 'u1s2e3r4-i5d6-7h8e9-r0e1-2i3s4h5e6r7e',
        updatedAt: new Date().toISOString()
      };
      
      mockTasks.push(newTask);
      return newTask;
    }
    
    // In production, insert into Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        property_id: task.propertyId,
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
  
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
  
    return {
      id: data.id,
      propertyId: data.property_id,
      title: data.title,
      description: data.description,
      assignee: data.assignee,
      dueDate: data.due_date,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: 'todo' | 'in_progress' | 'review' | 'done'
): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const taskIndex = mockTasks.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        mockTasks[taskIndex].status = status;
        mockTasks[taskIndex].updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }
    
    // In production, update in Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', taskId);
  
    if (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  
    return true;
  } catch (error) {
    console.error('Error updating task status:', error);
    return false;
  }
};

export const updateTask = async (
  id: string,
  updates: TaskUpdate
): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        mockTasks[taskIndex] = {
          ...mockTasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return true;
      }
      return false;
    }

    // In production, update in Supabase
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        assignee: updates.assignee,
        due_date: updates.dueDate,
        priority: updates.priority,
        status: updates.status,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating task:', error);
    return false;
  }
};

export const deleteTask = async (id: string): Promise<boolean> => {
  try {
    // In development mode, update mock data
    if (import.meta.env.DEV) {
      const initialLength = mockTasks.length;
      mockTasks = mockTasks.filter(task => task.id !== id);
      return mockTasks.length < initialLength;
    }
    
    // In production, delete from Supabase
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};
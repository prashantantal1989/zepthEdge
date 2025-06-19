export interface WorkflowStep {
  id: string;
  type: 'approval';
  role: string;
  description: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Settings {
  budgetCategories: Category[];
  disposalCategories: Category[];
  workflowTemplates: WorkflowTemplate[];
}

export const defaultSettings: Settings = {
  budgetCategories: [
    { id: '1', name: 'Operations', code: 'OPS', description: 'Operational expenses' },
    { id: '2', name: 'Facilities', code: 'FAC', description: 'Facility maintenance and upgrades' },
    { id: '3', name: 'Marketing', code: 'MKT', description: 'Marketing and advertising' },
    { id: '4', name: 'Technology', code: 'TECH', description: 'IT and software' },
    { id: '5', name: 'Food & Beverage', code: 'F&B', description: 'F&B operations' }
  ],
  disposalCategories: [
    { id: '1', name: 'Furniture', code: 'FUR', description: 'Furniture and fixtures' },
    { id: '2', name: 'Equipment', code: 'EQP', description: 'Operational equipment' },
    { id: '3', name: 'Electronics', code: 'ELE', description: 'Electronic devices' },
    { id: '4', name: 'Vehicles', code: 'VEH', description: 'Vehicles and transportation' }
  ],
  workflowTemplates: [
    {
      id: 'simple',
      name: 'Simple Approval',
      description: 'Single-level approval by finance director',
      steps: [
        {
          id: '1',
          type: 'approval',
          role: 'Finance Director',
          description: 'Finance director approval'
        }
      ]
    },
    {
      id: 'standard',
      name: 'Standard Approval',
      description: 'Two-level approval with operations and finance',
      steps: [
        {
          id: '1',
          type: 'approval',
          role: 'Operations Manager',
          description: 'Operations review and approval'
        },
        {
          id: '2',
          type: 'approval',
          role: 'Finance Director',
          description: 'Financial approval'
        }
      ]
    }
  ]
};
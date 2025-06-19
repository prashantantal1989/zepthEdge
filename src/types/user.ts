export interface User {
  id: string;
  name: string;
  email?: string; // Made optional since we can't reliably get it from frontend
  role: string;
  properties: string[];
  status: 'active' | 'pending' | 'inactive';
  lastLogin?: string; // Made optional since we can't reliably get it from frontend
  avatar?: string;
  department?: string;
  phone?: string;
  dateJoined?: string;
  recentActivity?: {
    action: string;
    date: string;
    property?: string;
  }[];
}
import { Building2, LayoutDashboard, FileSpreadsheet, DollarSign, Trash2, FileText, BarChart3, Users, LifeBuoy } from 'lucide-react';

export interface RouteConfig {
  path: string;
  title: string;
  icon?: any;
  breadcrumb?: string;
  parent?: string;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    breadcrumb: 'Dashboard'
  },
  {
    path: '/properties',
    title: 'Properties',
    icon: Building2,
    breadcrumb: 'Properties',
    children: [
      {
        path: '/properties/:id',
        title: 'Property Overview',
        breadcrumb: ':propertyName',
        children: [
          {
            path: '/properties/:id/financial',
            title: 'Financial Reporting',
            icon: BarChart3,
            breadcrumb: 'Financial'
          },
          {
            path: '/properties/:id/budget',
            title: 'Budget Approvals',
            icon: DollarSign,
            breadcrumb: 'Budget',
            children: [
              {
                path: '/properties/:id/budget/new',
                title: 'New Budget Request',
                breadcrumb: 'New Request'
              },
              {
                path: '/properties/:id/budget/transfer',
                title: 'Budget Transfer',
                breadcrumb: 'Transfer'
              },
              {
                path: '/properties/:id/budget/:budgetId',
                title: 'Budget Details',
                breadcrumb: 'Details'
              }
            ]
          },
          {
            path: '/properties/:id/capex',
            title: 'Capex Requests',
            icon: FileSpreadsheet,
            breadcrumb: 'Capex',
            children: [
              {
                path: '/properties/:id/capex/new',
                title: 'New Capex Request',
                breadcrumb: 'New Request'
              },
              {
                path: '/properties/:id/capex/:capexId',
                title: 'Capex Details',
                breadcrumb: 'Details'
              }
            ]
          },
          {
            path: '/properties/:id/disposal',
            title: 'Asset Disposal',
            icon: Trash2,
            breadcrumb: 'Asset Disposal',
            children: [
              {
                path: '/properties/:id/disposal/new',
                title: 'New Disposal Request',
                breadcrumb: 'New Request'
              },
              {
                path: '/properties/:id/disposal/:disposalId',
                title: 'Disposal Details',
                breadcrumb: 'Details'
              }
            ]
          },
          {
            path: '/properties/:id/assets',
            title: 'Asset Inventory',
            icon: FileText,
            breadcrumb: 'Asset Inventory',
            children: [
              {
                path: '/properties/:id/assets/new',
                title: 'New Asset',
                breadcrumb: 'New Asset'
              },
              {
                path: '/properties/:id/assets/:assetId',
                title: 'Asset Details',
                breadcrumb: 'Details'
              },
              {
                path: '/properties/:id/assets/:assetId/maintenance/new',
                title: 'Schedule Maintenance',
                breadcrumb: 'New Maintenance'
              }
            ]
          },
          {
            path: '/properties/:id/collab',
            title: 'Document Hub',
            icon: FileText,
            breadcrumb: 'Document Hub',
            children: [
              {
                path: '/properties/:id/collab/workspace',
                title: 'Document Workspace',
                breadcrumb: 'Workspace'
              },
              {
                path: '/properties/:id/collab/transmittal',
                title: 'Transmittals',
                breadcrumb: 'Transmittals',
                children: [
                  {
                    path: '/properties/:id/collab/transmittal/new',
                    title: 'New Transmittal',
                    breadcrumb: 'New'
                  }
                ]
              },
              {
                path: '/properties/:id/collab/submittals',
                title: 'Submittals',
                breadcrumb: 'Submittals',
                children: [
                  {
                    path: '/properties/:id/collab/submittals/new',
                    title: 'New Submittal',
                    breadcrumb: 'New'
                  }
                ]
              },
              {
                path: '/properties/:id/collab/rfi',
                title: 'RFI',
                breadcrumb: 'RFI',
                children: [
                  {
                    path: '/properties/:id/collab/rfi/new',
                    title: 'New RFI',
                    breadcrumb: 'New'
                  }
                ]
              },
              {
                path: '/properties/:id/collab/tasks',
                title: 'Tasks',
                breadcrumb: 'Tasks'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/admin',
    title: 'Admin Panel',
    icon: Users,
    breadcrumb: 'Admin Panel',
    children: [
      {
        path: '/onboarding',
        title: 'Hotel Onboarding',
        breadcrumb: 'Hotel Onboarding'
      }
    ]
  },
  {
    path: '/help',
    title: 'Help Center',
    icon: LifeBuoy,
    breadcrumb: 'Help Center',
    children: [
      {
        path: '/help/articles/:articleId',
        title: 'Article',
        breadcrumb: 'Article'
      },
      {
        path: '/help/submit-ticket',
        title: 'Submit a Ticket',
        breadcrumb: 'Submit a Ticket'
      }
    ]
  }
];
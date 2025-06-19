# Zepth Edge - Hotel Property Management Platform

A modern, feature-rich property management platform built with React and TypeScript, designed specifically for hotel operations and management.

![Zepth Edge Dashboard](https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)

## Features

- **Property Management**
  - Multi-property support
  - Property details and metrics
  - Occupancy tracking
  - Budget management

- **Financial Management**
  - Budget tracking and approvals
  - CAPEX request management
  - Financial reporting (daily, weekly, monthly)
  - Budget transfer workflows

- **Asset Management**
  - Asset disposal tracking
  - Inventory management
  - Asset lifecycle tracking
  - Approval workflows

- **Document Management**
  - Document workspace
  - Transmittal management
  - RFI tracking
  - Submittal workflows
  - Task management board

- **Administrative Tools**
  - User management
  - Role-based access control
  - Workflow template management
  - System configuration

## Technology Stack

- **Frontend Framework**: React 18.3
- **Type System**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context
- **Routing**: React Router
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Drag & Drop**: DND Kit
- **Database**: Supabase

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/zepth-edge.git
   cd zepth-edge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view the application

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── admin/         # Admin panel components
│   ├── financial/     # Financial management components
│   ├── navigation/    # Navigation components
│   ├── ui/           # Common UI components
│   └── workflow/     # Workflow related components
├── contexts/         # React context providers
├── data/            # Static data and mock data
├── layouts/         # Page layouts
├── pages/           # Page components
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Key Features Documentation

### Property Management

The property management module allows users to:
- View and manage multiple hotel properties
- Track property metrics and performance
- Monitor occupancy rates and revenue
- Manage property-specific budgets

### Financial Management

The financial module provides:
- Budget tracking and approval workflows
- CAPEX request management
- Financial reporting with customizable periods
- Budget transfer capabilities

### Document Management

The document management system includes:
- Centralized document workspace
- Transmittal tracking
- RFI management
- Submittal workflows
- Task management board with drag-and-drop functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please email support@zepthedge.com or open an issue in the GitHub repository.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [DND Kit](https://dndkit.com/)
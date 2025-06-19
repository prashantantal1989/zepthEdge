import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight size={16} className="mx-2 text-pastel-gray" />
          )}
          {item.to ? (
            <Link
              to={item.to}
              className="text-pastel-gray hover:text-pastel-mauve transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-pastel-dusty font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
import { matchPath } from 'react-router-dom';
import { routes, RouteConfig } from '../config/routes';
import { getPropertyById } from './properties';

export const findRouteConfig = (pathname: string): RouteConfig | null => {
  const findRoute = (routes: RouteConfig[]): RouteConfig | null => {
    for (const route of routes) {
      if (matchPath(route.path, pathname)) {
        return route;
      }
      if (route.children) {
        const childRoute = findRoute(route.children);
        if (childRoute) {
          return childRoute;
        }
      }
    }
    return null;
  };

  return findRoute(routes);
};

export const getPageTitle = (pathname: string): string => {
  const route = findRouteConfig(pathname);
  if (!route) return 'Zepth Edge';

  const propertyMatch = pathname.match(/^\/properties\/(\w+)/);
  if (propertyMatch) {
    const propertyId = propertyMatch[1];
    const property = getPropertyById(propertyId);
    if (property && route.title.includes(':propertyName')) {
      return route.title.replace(':propertyName', property.name);
    }
  }

  return route.title;
};

export const getBreadcrumbs = (pathname: string) => {
  const breadcrumbs = [{ label: 'Home', to: '/dashboard' }];
  let currentPath = '';

  const pathSegments = pathname.split('/').filter(Boolean);
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const route = findRouteConfig(currentPath);
    
    if (route) {
      let label = route.breadcrumb || route.title;
      let to = currentPath;

      // Handle property name in breadcrumb
      if (label === ':propertyName') {
        const propertyId = segment;
        const property = getPropertyById(propertyId);
        if (property) {
          label = property.name;
        }
      }

      breadcrumbs.push({ label, to });
    }
  }

  // Make the last breadcrumb not clickable
  if (breadcrumbs.length > 0) {
    const last = breadcrumbs[breadcrumbs.length - 1];
    breadcrumbs[breadcrumbs.length - 1] = { label: last.label };
  }

  return breadcrumbs;
};
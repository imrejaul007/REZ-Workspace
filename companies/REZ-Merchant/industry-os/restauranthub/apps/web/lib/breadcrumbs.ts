import { 
  Store, 
  Package, 
  Briefcase, 
  Shield, 
  Users, 
  ShoppingCart, 
  Settings,
  User,
  BarChart3,
  CreditCard,
  Calendar,
  MessageCircle,
  Bell,
  Building
} from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

const pathMappings: Record<string, { label: string; icon?: React.ElementType }> = {
  'dashboard': { label: 'Dashboard', icon: BarChart3 },
  'admin': { label: 'Admin', icon: Shield },
  'restaurant': { label: 'Restaurant', icon: Store },
  'employee': { label: 'Employee', icon: Users },
  'vendor': { label: 'Vendor', icon: Package },
  'profile': { label: 'Profile', icon: User },
  'settings': { label: 'Settings', icon: Settings },
  'marketplace': { label: 'Marketplace', icon: ShoppingCart },
  'jobs': { label: 'Jobs', icon: Briefcase },
  'community': { label: 'Community', icon: MessageCircle },
  'analytics': { label: 'Analytics', icon: BarChart3 },
  'wallet': { label: 'Wallet', icon: CreditCard },
  'notifications': { label: 'Notifications', icon: Bell },
  'calendar': { label: 'Calendar', icon: Calendar },
  'orders': { label: 'Orders', icon: ShoppingCart },
  'inventory': { label: 'Inventory', icon: Package },
  'applications': { label: 'Applications', icon: Users },
  'my-applications': { label: 'My Applications', icon: Users },
  'create': { label: 'Create', icon: Building },
  'add-product': { label: 'Add Product', icon: Package },
  'support': { label: 'Support', icon: MessageCircle },
  'training': { label: 'Training', icon: Building },
};

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return [{ label: 'Dashboard', icon: BarChart3 }];
  }
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const mapping = pathMappings[segment];
    
    if (mapping) {
      const isLast = index === segments.length - 1;
      breadcrumbs.push({
        label: mapping.label,
        href: isLast ? undefined : currentPath,
        icon: mapping.icon,
      });
    } else {
      // Fallback for unmapped segments - convert kebab-case to Title Case
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const isLast = index === segments.length - 1;
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }
  });
  
  return breadcrumbs;
}
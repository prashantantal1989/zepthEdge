export interface Property {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  generalManager: string;
  type: string;
  rooms: number;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  budgetUtilization: number;
  image: string;
}

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
];
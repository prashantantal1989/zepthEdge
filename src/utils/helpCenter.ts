import { supabase } from '../lib/supabase';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  url?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  content?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  articles: Article[];
}

export interface Update {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'maintenance' | 'announcement';
  date: string;
}

/**
 * Load quick actions for the help center
 */
export const loadQuickActions = async (): Promise<QuickAction[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: 'submit',
        title: 'Submit a Ticket',
        description: 'Get help from our support team',
        icon: 'MessageSquare',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        url: '/help/submit-ticket'
      },
      {
        id: 'tutorials',
        title: 'View Tutorials',
        description: 'Learn through video guides',
        icon: 'Play',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        url: '/help/tutorials'
      },
      {
        id: 'support',
        title: 'Contact Support',
        description: '24/7 support available',
        icon: 'HelpCircle',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        url: '/help/contact'
      },
      {
        id: 'docs',
        title: 'Documentation',
        description: 'Read detailed guides',
        icon: 'Book',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        url: '/help/documentation'
      }
    ];
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('help_quick_actions')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Error loading quick actions:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    icon: item.icon,
    bgColor: item.bg_color,
    iconColor: item.icon_color,
    url: item.url
  }));
};

/**
 * Load featured articles for the help center
 */
export const loadFeaturedArticles = async (): Promise<Article[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: '1',
        title: 'Getting Started with Zepth Edge',
        category: 'Basics',
        readTime: '5 min read',
        views: 1234,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Managing Property Documents',
        category: 'Documents',
        readTime: '8 min read',
        views: 987,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      },
      {
        id: '3',
        title: 'Budget Approval Workflow',
        category: 'Finance',
        readTime: '6 min read',
        views: 765,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z'
      },
      {
        id: '4',
        title: 'Asset Disposal Guide',
        category: 'Operations',
        readTime: '7 min read',
        views: 543,
        createdAt: '2025-01-04T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z'
      }
    ];
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('help_articles')
    .select('*')
    .eq('featured', true)
    .order('views', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error loading featured articles:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    readTime: `${item.read_time} min read`,
    views: item.views,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

/**
 * Load help categories with their articles
 */
export const loadHelpCategories = async (): Promise<HelpCategory[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: 'Book',
        articles: [
          { id: '1', title: 'Platform Overview', views: 1234, category: 'Basics', readTime: '5 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
          { id: '2', title: 'User Roles & Permissions', views: 856, category: 'Basics', readTime: '4 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
          { id: '3', title: 'Navigation Guide', views: 654, category: 'Basics', readTime: '3 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
        ]
      },
      {
        id: 'property-management',
        title: 'Property Management',
        icon: 'FileText',
        articles: [
          { id: '4', title: 'Adding a New Property', views: 987, category: 'Properties', readTime: '6 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
          { id: '5', title: 'Budget Management', views: 765, category: 'Finance', readTime: '7 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
          { id: '6', title: 'Document Collaboration', views: 543, category: 'Documents', readTime: '5 min read', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
        ]
      }
    ];
  }

  // In production, fetch from Supabase
  const { data: categories, error: categoriesError } = await supabase
    .from('help_categories')
    .select('*')
    .order('display_order');

  if (categoriesError) {
    console.error('Error loading help categories:', categoriesError);
    return [];
  }

  // Fetch articles for each category
  const result: HelpCategory[] = [];
  
  for (const category of categories) {
    const { data: articles, error: articlesError } = await supabase
      .from('help_articles')
      .select('*')
      .eq('category_id', category.id)
      .order('views', { ascending: false })
      .limit(3);
    
    if (articlesError) {
      console.error(`Error loading articles for category ${category.id}:`, articlesError);
      continue;
    }
    
    result.push({
      id: category.id,
      title: category.title,
      icon: category.icon,
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        category: article.category,
        readTime: `${article.read_time} min read`,
        views: article.views,
        createdAt: article.created_at,
        updatedAt: article.updated_at
      }))
    });
  }

  return result;
};

/**
 * Load recent updates for the help center
 */
export const loadRecentUpdates = async (): Promise<Update[]> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: '1',
        title: 'New Feature: Document Hub',
        description: 'Explore our new document collaboration features in the latest update.',
        type: 'feature',
        date: '2025-04-15'
      },
      {
        id: '2',
        title: 'System Maintenance',
        description: 'Scheduled maintenance on April 20, 2025, from 2 AM to 4 AM EST.',
        type: 'maintenance',
        date: '2025-04-10'
      }
    ];
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('help_updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error loading recent updates:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    date: new Date(item.created_at).toLocaleDateString()
  }));
};

/**
 * Get article by ID
 */
export const getArticleById = async (id: string): Promise<Article | null> => {
  // In development mode, return mock data
  if (import.meta.env.DEV) {
    const mockArticles = [
      {
        id: '1',
        title: 'Getting Started with Zepth Edge',
        category: 'Basics',
        readTime: '5 min read',
        content: 'This is a detailed guide on how to get started with Zepth Edge...',
        views: 1234,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Managing Property Documents',
        category: 'Documents',
        readTime: '8 min read',
        content: 'Learn how to effectively manage property documents in Zepth Edge...',
        views: 987,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      }
    ];
    
    return mockArticles.find(article => article.id === id) || null;
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('help_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error loading article:', error);
    return null;
  }

  // Increment view count
  await supabase
    .from('help_articles')
    .update({ views: data.views + 1 })
    .eq('id', id);

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    readTime: `${data.read_time} min read`,
    content: data.content,
    views: data.views,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Search articles
 */
export const searchArticles = async (query: string): Promise<Article[]> => {
  if (!query.trim()) return [];

  // In development mode, return mock data
  if (import.meta.env.DEV) {
    const mockArticles = [
      {
        id: '1',
        title: 'Getting Started with Zepth Edge',
        category: 'Basics',
        readTime: '5 min read',
        views: 1234,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Managing Property Documents',
        category: 'Documents',
        readTime: '8 min read',
        views: 987,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      }
    ];
    
    return mockArticles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  // In production, fetch from Supabase
  const { data, error } = await supabase
    .from('help_articles')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
    .order('views', { ascending: false });

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    readTime: `${item.read_time} min read`,
    views: item.views,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

/**
 * Submit a support ticket
 */
export const submitSupportTicket = async (
  email: string,
  subject: string,
  message: string,
  category: string
): Promise<boolean> => {
  // In development mode, return success
  if (import.meta.env.DEV) {
    console.log('Support ticket submitted:', { email, subject, message, category });
    return true;
  }

  // In production, submit to Supabase
  const { error } = await supabase
    .from('support_tickets')
    .insert([{
      email,
      subject,
      message,
      category,
      status: 'open'
    }]);

  if (error) {
    console.error('Error submitting support ticket:', error);
    return false;
  }

  return true;
};
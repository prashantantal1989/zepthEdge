import { request } from '../lib/apiClient';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgColor: string; // Consider if these style props should remain or be handled by UI components
  iconColor: string;
  url?: string;
  display_order?: number; // from schema
}

export interface Article {
  id: string;
  title: string;
  category: string; // This might become categoryId if normalized
  categoryId?: string; // from schema help_articles.category_id
  readTime: string | number; // Store as number (minutes), format in UI
  content?: string;
  views: number;
  featured?: boolean; // from schema
  createdAt: string;
  updatedAt?: string;
  // createdBy, updatedBy if needed
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description?: string; // from schema
  articles?: Article[]; // If fetched nested
  display_order?: number; // from schema
}

export interface Update { // Corresponds to help_updates table
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'maintenance' | 'announcement' | 'improvement' | 'fix'; // Align with schema
  publish_date?: string; // from schema
  createdAt?: string; // from schema (created_at)
  // createdBy, updatedBy if needed
}

// --- Mapping Functions ---
const mapToFrontendQuickAction = (data: any): QuickAction => ({
  id: data.id,
  title: data.title,
  description: data.description,
  icon: data.icon,
  bgColor: data.bg_color,
  iconColor: data.icon_color,
  url: data.url,
  display_order: data.display_order,
});

const mapToFrontendArticle = (data: any): Article => ({
  id: data.id,
  title: data.title,
  category: data.category_id, // Assuming we'll use category ID and fetch category title if needed
  categoryId: data.category_id,
  readTime: data.read_time || 5, // Default read time
  content: data.content,
  views: data.views || 0,
  featured: data.featured,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapToFrontendHelpCategory = (data: any, articles: Article[] = []): HelpCategory => ({
  id: data.id,
  title: data.title,
  icon: data.icon,
  description: data.description,
  articles: articles,
  display_order: data.display_order,
});

const mapToFrontendUpdate = (data: any): Update => ({
  id: data.id,
  title: data.title,
  description: data.description,
  type: data.type as Update['type'],
  publish_date: data.publish_date,
  createdAt: data.created_at,
});


// --- API Functions ---

export const loadQuickActions = async (): Promise<QuickAction[]> => {
  // TODO: Backend API: GET /api/help/quick-actions (ordered by display_order)
  try {
    const data = await request<any[]>('/api/help/quick-actions', { method: 'GET' });
    return data.map(mapToFrontendQuickAction);
  } catch (error) {
    console.error('Error loading quick actions:', error);
    return [];
  }
};

export const loadFeaturedArticles = async (): Promise<Article[]> => {
  // TODO: Backend API: GET /api/help/articles?featured=true&limit=4&orderBy=views:desc
  try {
    const data = await request<any[]>('/api/help/articles?featured=true&limit=4&orderBy=views:desc', { method: 'GET' });
    return data.map(mapToFrontendArticle);
  } catch (error) {
    console.error('Error loading featured articles:', error);
    return [];
  }
};

export const loadHelpCategories = async (): Promise<HelpCategory[]> => {
  // TODO: Backend API: GET /api/help/categories-with-articles?articleLimit=3 (or similar for nested data)
  // This is complex. Option 1: Backend sends nested data. Option 2: N+1 frontend calls (bad).
  // Assuming Option 1 for now.
  try {
    const data = await request<any[]>('/api/help/categories-with-articles?articleLimit=3', { method: 'GET' });
    return data.map(categoryData => mapToFrontendHelpCategory(
      categoryData,
      (categoryData.articles || []).map(mapToFrontendArticle)
    ));
  } catch (error) {
    console.error('Error loading help categories with articles:', error);
    return [];
  }
};

export const loadRecentUpdates = async (): Promise<Update[]> => {
  // TODO: Backend API: GET /api/help/updates?limit=3&orderBy=created_at:desc
  try {
    const data = await request<any[]>('/api/help/updates?limit=3&orderBy=publish_date:desc', { method: 'GET' });
    return data.map(mapToFrontendUpdate);
  } catch (error) {
    console.error('Error loading recent updates:', error);
    return [];
  }
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  // TODO: Backend API: GET /api/help/articles/:id
  // The backend should handle incrementing view count.
  try {
    const data = await request<any>(`/api/help/articles/${id}`, { method: 'GET' });
    return data ? mapToFrontendArticle(data) : null;
  } catch (error: any) {
    if (error.status === 404) return null;
    console.error(`Error loading article ${id}:`, error);
    return null;
  }
};

export const searchArticles = async (query: string): Promise<Article[]> => {
  // TODO: Backend API: GET /api/help/articles/search?q=<query>
  if (!query.trim()) return [];
  try {
    const data = await request<any[]>(`/api/help/articles/search?q=${encodeURIComponent(query)}`, { method: 'GET' });
    return data.map(mapToFrontendArticle);
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
};

export const submitSupportTicket = async (
  email: string,
  subject: string,
  message: string,
  category: string,
  // Frontend might also send userId if user is authenticated
  userId?: string
): Promise<boolean> => {
  // TODO: Backend API: POST /api/support-tickets
  // Backend will set status to 'open', created_at. created_by if userId is passed.
  try {
    const payload = { email, subject, message, category, userId, status: 'open' };
    await request<any>('/api/support-tickets', {
      method: 'POST',
      body: payload,
    });
    return true;
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    return false;
  }
};

// TODO: Add admin functions if needed:
// - createQuickAction, updateQuickAction, deleteQuickAction
// - createArticle, updateArticle, deleteArticle
// - createHelpCategory, updateHelpCategory, deleteHelpCategory
// - createHelpUpdate, updateHelpUpdate, deleteHelpUpdate
// - getSupportTickets, getSupportTicketById, updateSupportTicketStatus, assignSupportTicket
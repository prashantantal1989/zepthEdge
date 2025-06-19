// src/lib/apiClient.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any; // Allow any type for body, will be stringified if object
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`; // Prepend API base URL

  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Attempt to parse error response from backend if JSON
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      }
      // Throw an error object that includes status and potential message from backend
      const error: any = new Error(errorData?.message || `API request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData; // Attach full error data if available
      throw error;
    }

    // Handle cases where response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
      return null as T; // Or handle as appropriate for your application
    }

    // Assuming all other successful responses are JSON
    const data: T = await response.json();
    return data;

  } catch (error) {
    console.error(`API request error for endpoint ${endpoint}:`, error);
    throw error; // Re-throw to be handled by the calling service or component
  }
}

// Example usage (optional, for testing or demonstration):
// async function testApiClient() {
//   try {
//     const users = await request<{ id: string; name: string }[]>('/api/users');
//     console.log('Users:', users);
//     // const newUser = await request<{ id: string; name: string }>('/api/users', {
//     //   method: 'POST',
//     //   body: { name: 'New User' },
//     // });
//     // console.log('New User:', newUser);
//   } catch (error) {
//     console.error('API Client Test Error:', error);
//   }
// }
// testApiClient();

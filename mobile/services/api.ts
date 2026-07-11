import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function getDefaultApiBaseUrl(): string {
  return 'https://coastalert.onrender.com';
}

// The user can override this base URL in the Settings tab.
let apiBaseUrl = getDefaultApiBaseUrl();

export function getBaseUrl(): string {
  return apiBaseUrl;
}

export function setBaseUrl(url: string) {
  apiBaseUrl = url;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    // If SecureStore is unavailable in web/simulators, fallback
  }

  return headers;
}

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const headers = await getHeaders();
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Request failed');
    }
    return response.json();
  },

  async post<T = any>(endpoint: string, body: any, isMultipart = false): Promise<T> {
    const headers = await getHeaders();
    let finalBody = body;

    if (isMultipart) {
      // For multipart (image upload), let the browser set the boundary header automatically
      const multipartHeaders = { ...headers } as any;
      delete multipartHeaders['Content-Type'];
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: multipartHeaders,
        body: finalBody
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Submission failed');
      }
      return response.json();
    } else {
      finalBody = JSON.stringify(body);
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: finalBody
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Request failed');
      }
      return response.json();
    }
  },

  async patch<T = any>(endpoint: string, body: any): Promise<T> {
    const headers = await getHeaders();
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Request failed');
    }
    return response.json();
  }
};

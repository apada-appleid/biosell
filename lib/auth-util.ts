/**
 * This utility helps prevent authentication redirect loops by providing
 * centralized methods for handling redirects and authentication state.
 */

// کلید ذخیره‌سازی اطلاعات ریدایرکت
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';

/**
 * Saves the redirect URL to session storage with an expiration timestamp
 * to prevent infinite loops
 */
export function saveRedirectUrl(url: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Set expiration time to 10 minutes from now
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    // Save URL and expiration time
    localStorage.setItem('auth_redirect_url', url);
    localStorage.setItem('auth_redirect_expires', expiresAt.toString());
  } catch (error) {
    // Silent fail - this is not critical functionality
  }
}

/**
 * Gets the stored redirect URL if it exists and is not expired
 */
export function getRedirectUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    
    // Get stored URL and expiration time
    const url = localStorage.getItem('auth_redirect_url');
    const expiresAtStr = localStorage.getItem('auth_redirect_expires');
    
    // If no URL is stored, return null
    if (!url || !expiresAtStr) {
      return null;
    }
    
    // Check if URL has expired
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      // URL has expired, clear it and return null
      clearRedirectUrl();
      return null;
    }
    
    // Return valid URL
    return url;
  } catch (error) {
    return null;
  }
}

/**
 * Clears the redirect URL from both storage mechanisms
 */
export function clearRedirectUrl(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth_redirect_url');
    localStorage.removeItem('auth_redirect_expires');
  } catch (error) {
    // Silent fail
  }
}

/**
 * Generates a redirect URL with timestamp to prevent caching
 */
export function createRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl, window.location.origin);
  
  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });
  
  const finalUrl = url.toString();
  return finalUrl;
} 
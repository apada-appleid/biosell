/**
 * This utility helps prevent authentication redirect loops by providing
 * centralized methods for handling redirects and authentication state.
 */

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
  } catch {
    // Silent fail - this is not critical functionality
  }
}

/**
 * Gets the stored redirect URL if it exists and is not expired
 */
export function getRedirectUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const url = localStorage.getItem('auth_redirect_url');
    const expiresAtStr = localStorage.getItem('auth_redirect_expires');
    
    if (!url || !expiresAtStr) return null;
    
    const expiresAt = parseInt(expiresAtStr, 10);
    
    // Check if expired
    if (Date.now() > expiresAt) {
      // Clear expired redirect
      clearRedirectUrl();
      return null;
    }
    
    // Return valid URL
    return url;
  } catch {
    return null;
  }
}

/**
 * Clears the stored redirect URL
 */
export function clearRedirectUrl(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth_redirect_url');
    localStorage.removeItem('auth_redirect_expires');
  } catch {
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
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
export const saveRedirectUrl = (url: string) => {
  try {
    // Add a 10-minute expiration to avoid stale redirects
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    const redirectData = {
      url,
      expiresAt
    };
    
    console.log(`Saving redirect URL: ${url} (expires in 10 minutes)`);
    
    // Store in both session and local storage for redundancy
    sessionStorage.setItem(REDIRECT_STORAGE_KEY, JSON.stringify(redirectData));
    localStorage.setItem(REDIRECT_STORAGE_KEY, JSON.stringify(redirectData));
    
    // Return the URL for immediate use if needed
    return url;
  } catch (error) {
    console.error('Error saving redirect URL:', error);
    return null;
  }
};

/**
 * Gets the stored redirect URL if it exists and is not expired
 */
export const getRedirectUrl = (): string | null => {
  try {
    // First try session storage
    let redirectData = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    
    // If not in session storage, try localStorage
    if (!redirectData) {
      redirectData = localStorage.getItem(REDIRECT_STORAGE_KEY);
    }
    
    if (!redirectData) {
      console.log('No redirect URL found in storage');
      return null;
    }
    
    const { url, expiresAt } = JSON.parse(redirectData);
    
    // Check if the redirect URL has expired
    if (Date.now() > expiresAt) {
      console.log(`Redirect URL expired (set to expire at ${new Date(expiresAt).toISOString()})`);
      clearRedirectUrl();
      return null;
    }
    
    console.log(`Retrieved redirect URL: ${url}`);
    return url;
  } catch (error) {
    console.error('Error getting redirect URL:', error);
    clearRedirectUrl();
    return null;
  }
};

/**
 * Clears the redirect URL from both storage mechanisms
 */
export const clearRedirectUrl = () => {
  try {
    console.log('Clearing stored redirect URL');
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing redirect URL:', error);
  }
};

/**
 * Generates a redirect URL with timestamp to prevent caching
 */
export const createRedirectUrl = (baseUrl: string, params: Record<string, string> = {}) => {
  // Add timestamp to prevent caching
  params.t = Date.now().toString();
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value);
  });
  
  const finalUrl = `${baseUrl}?${searchParams.toString()}`;
  console.log(`Created redirect URL: ${finalUrl}`);
  return finalUrl;
}; 
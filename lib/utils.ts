/**
 * Utility functions for common tasks across the application
 */

/**
 * Format a date string into a readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Format date for Farsi calendar using Intl
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Format a price number to currency string with Persian format
 * @param price - Number to format as currency
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}; 
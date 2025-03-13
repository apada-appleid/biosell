/**
 * لیست نام‌های کاربری ممنوعه که نمی‌توانند به عنوان نام کاربری استفاده شوند
 * این لیست شامل مسیرهای اصلی برنامه و کلمات حساس می‌شود
 */
export const RESERVED_USERNAMES = [
  // مسیرهای اصلی برنامه
  'admin', 'seller', 'customer', 'checkout', 'api', 'auth',
  'shop', 'store', 'orders', 'legal', 'products', 'cart',
  'components', 'hooks', 'types', 'offline', '_offline',
  'routes', 'root', 'favicon', 'layout', 'providers', 'error',
  
  // مسیرهای فرعی که ممکن است در آینده اضافه شوند
  'settings', 'profile', 'help', 'support', 'contact', 'about',
  'terms', 'privacy', 'faq', 'login', 'logout', 'register', 'signup',
  'signin', 'payment', 'invoice', 'shipping', 'delivery', 'track',
  
  // نام‌های کاربری مشکل‌ساز
  'admin123', 'root', 'system', 'administrator', 'biosell', 'sudo',
  'moderator', 'staff', 'support', 'official', 'help', 'service',
  'null', 'undefined', 'true', 'false', 'default', 'test', 'anonymous'
];

/**
 * بررسی می‌کند که آیا نام کاربری مجاز است یا خیر
 * @param username نام کاربری که باید بررسی شود
 * @returns true اگر نام کاربری مجاز باشد، false در غیر این صورت
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  
  // نام کاربری نباید در لیست نام‌های کاربری ممنوعه باشد (با در نظر گرفتن حروف کوچک و بزرگ)
  const lowercaseUsername = username.toLowerCase();
  if (RESERVED_USERNAMES.includes(lowercaseUsername)) {
    return false;
  }

  // نام کاربری باید فقط شامل حروف، اعداد و کاراکترهای خاص باشد
  const validUsernameRegex = /^[a-zA-Z0-9_\-.]+$/;
  if (!validUsernameRegex.test(username)) {
    return false;
  }

  // نام کاربری نباید با اعداد یا کاراکترهای خاص شروع شود
  if (/^[^a-zA-Z]/.test(username)) {
    return false;
  }

  return true;
}

/**
 * بررسی می‌کند که آیا نام کاربری ممنوعه است یا خیر
 * @param username نام کاربری که باید بررسی شود
 * @returns پیام خطا اگر نام کاربری نامعتبر باشد، در غیر این صورت null
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }
  
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  
  if (username.length > 50) {
    return 'Username must be at most 50 characters';
  }

  // نام کاربری نباید در لیست نام‌های کاربری ممنوعه باشد
  const lowercaseUsername = username.toLowerCase();
  if (RESERVED_USERNAMES.includes(lowercaseUsername)) {
    return 'This username is reserved and cannot be used';
  }

  // نام کاربری باید فقط شامل حروف، اعداد و کاراکترهای خاص باشد
  const validUsernameRegex = /^[a-zA-Z0-9_\-.]+$/;
  if (!validUsernameRegex.test(username)) {
    return 'Username can only contain letters, numbers, underscores, hyphens, and periods';
  }

  // نام کاربری نباید با اعداد یا کاراکترهای خاص شروع شود
  if (/^[^a-zA-Z]/.test(username)) {
    return 'Username must start with a letter';
  }

  return null;
} 
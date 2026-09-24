/**
 * Centralized Error Mapper & Normalizer for DoctorCare App
 * Converts any backend error, Axios error, network failure, navigation error,
 * or custom exception into clean, human-readable, professional healthcare messages.
 *
 * RULE: The user must NEVER see raw technical errors.
 */

// ──────────────────────────────────────────────
// Situation-specific error message overrides
// ──────────────────────────────────────────────
const LOGIN_ERROR_MAP = {
  'admin_on_user_login': 'Administrator account detected. Please use the Admin Portal to sign in.',
  'user_on_admin_login': 'Admin access is required. Please use an authorized administrator account.',
  'wrong_credentials': 'Incorrect email or password. Please check your details and try again.',
  'account_inactive': 'Your account is currently inactive. Please contact support for assistance.',
  'account_locked': 'Your account has been temporarily locked. Please try again later or contact support.',
};

/**
 * Get a login-specific error message by key
 */
export const getLoginErrorMessage = (key) => LOGIN_ERROR_MAP[key] || LOGIN_ERROR_MAP['wrong_credentials'];

/**
 * Primary error message extractor
 * Converts any error (Axios, Network, JS, backend response) to a user-friendly string.
 */
export const getErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
  if (!error) return fallbackMessage;

  // 1. If error is already a string
  if (typeof error === 'string') {
    return cleanRawErrors(error);
  }

  // 2. Check if response has structured error from backend apiResponse
  const responseData = error.response?.data;
  if (responseData) {
    if (responseData.message && typeof responseData.message === 'string') {
      return cleanRawErrors(responseData.message);
    }
    if (responseData.errors && typeof responseData.errors === 'object') {
      // Pick first validation error if present
      const firstKey = Object.keys(responseData.errors)[0];
      if (firstKey && responseData.errors[firstKey]) {
        return cleanRawErrors(responseData.errors[firstKey]);
      }
    }
  }

  // 3. Check HTTP Status Code mapping
  const status = error.response?.status || error.status;
  if (status) {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your information and try again.';
      case 401:
        return 'Invalid email or password, or your session has expired.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested information could not be found.';
      case 409:
        return 'This slot or record has already been booked or modified. Please refresh and try again.';
      case 422:
        return 'Please review the entered information and correct any errors.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      case 500:
        return 'Something went wrong on our server. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service is temporarily unavailable. Please try again in a few moments.';
      default:
        break;
    }
  }

  // 4. Network or Timeout issues
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'The server is taking too long to respond. Please try again.';
  }
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // 5. Standard Error object message — sanitize before returning
  if (error.message && typeof error.message === 'string') {
    return cleanRawErrors(error.message);
  }

  return fallbackMessage;
};

/**
 * Filter out raw database / technical keywords to ensure users never see raw stack traces,
 * React Navigation errors, Axios internals, MongoDB errors, or JavaScript exceptions.
 */
const cleanRawErrors = (msg) => {
  if (!msg || typeof msg !== 'string') return 'An error occurred. Please try again.';

  // ── React Navigation errors (NEVER show to user) ──
  if (msg.includes("The action 'REPLACE'") || msg.includes("The action 'NAVIGATE'")) {
    return 'Unable to open this page. Please try again.';
  }
  if (msg.includes('CommonActions') || msg.includes('StackActions')) {
    return 'Unable to open this page. Please try again.';
  }

  // ── Database / MongoDB errors ──
  if (msg.includes('E11000') || msg.includes('duplicate key')) {
    return 'This record or booking already exists.';
  }
  if (msg.includes('Cast to ObjectId failed') || msg.includes('CastError')) {
    return 'Invalid identifier format.';
  }
  if (msg.includes('MongoServerError') || msg.includes('MongoError')) {
    return 'A database error occurred. Please try again later.';
  }

  // ── Auth / JWT errors ──
  if (msg.includes('jwt') || msg.includes('token expired') || msg.includes('JsonWebTokenError')) {
    return 'Your session has expired. Please sign in again.';
  }

  // ── Axios status code messages ──
  if (msg.includes('Request failed with status code 401')) {
    return 'Invalid email or password.';
  }
  if (msg.includes('Request failed with status code 403')) {
    return 'Access denied. You do not have permission.';
  }
  if (msg.includes('Request failed with status code 404')) {
    return 'The requested information could not be found.';
  }
  if (msg.includes('Request failed with status code 409')) {
    return 'This selection conflicts with an existing record. Please choose another.';
  }
  if (msg.includes('Request failed with status code 500')) {
    return 'Server error occurred. Please try again later.';
  }

  // ── Axios / Network internals ──
  if (msg.includes('AxiosError') || msg.includes('Network Error')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (msg.includes('ERR_NETWORK') || msg.includes('ERR_CONNECTION_REFUSED')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (msg.includes('ECONNABORTED') || msg.includes('timeout of') || msg.includes('exceeded')) {
    return 'The server is taking too long to respond. Please try again.';
  }

  // ── JavaScript exceptions (NEVER show to user) ──
  if (msg.includes('TypeError') || msg.includes('SyntaxError') || msg.includes('ReferenceError')) {
    return 'Something went wrong. Please try again.';
  }
  if (msg.includes('undefined is not') || msg.includes('null is not')) {
    return 'Something went wrong. Please try again.';
  }
  if (msg.includes('ValidationError')) {
    return 'Please check the entered information and try again.';
  }

  // ── API URLs or stack traces (NEVER show to user) ──
  if (msg.includes('http://') || msg.includes('https://') || msg.includes('localhost')) {
    return 'A connection error occurred. Please try again.';
  }
  if (msg.includes('at ') && msg.includes('.js:')) {
    return 'Something went wrong. Please try again.';
  }

  // If the message looks safe (no technical keywords), return as-is
  return msg;
};

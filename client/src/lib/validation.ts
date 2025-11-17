/**
 * Form validation utilities
 * Centralized validation logic for consistent error messages and rules
 */

import { VALIDATION } from './constants';

// ============================================================================
// Validation Result Type
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// ============================================================================
// Profile Field Validation
// ============================================================================

/**
 * Validate display name
 * Rules: Required, 1-50 characters
 */
export const validateDisplayName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length < VALIDATION.DISPLAY_NAME_MIN) {
    return {
      isValid: false,
      error: 'Display name is required',
    };
  }

  if (trimmed.length > VALIDATION.DISPLAY_NAME_MAX) {
    return {
      isValid: false,
      error: `Display name must be ${VALIDATION.DISPLAY_NAME_MAX} characters or less`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate username
 * Rules: Optional, 3-30 characters, alphanumeric + underscore only
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: true, error: null }; // Optional field
  }

  const trimmed = username.trim();

  if (trimmed.length < VALIDATION.USERNAME_MIN) {
    return {
      isValid: false,
      error: `Username must be at least ${VALIDATION.USERNAME_MIN} characters`,
    };
  }

  if (trimmed.length > VALIDATION.USERNAME_MAX) {
    return {
      isValid: false,
      error: `Username must be ${VALIDATION.USERNAME_MAX} characters or less`,
    };
  }

  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate bio
 * Rules: Optional, max 500 characters
 */
export const validateBio = (bio: string): ValidationResult => {
  if (!bio) {
    return { isValid: true, error: null }; // Optional field
  }

  if (bio.length > VALIDATION.BIO_MAX) {
    return {
      isValid: false,
      error: `Bio must be ${VALIDATION.BIO_MAX} characters or less`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate URL
 * Rules: Optional, valid URL format, max 200 characters
 */
export const validateUrl = (url: string, fieldName: string = 'URL'): ValidationResult => {
  if (!url) {
    return { isValid: true, error: null }; // Optional field
  }

  const trimmed = url.trim();

  if (trimmed.length > VALIDATION.URL_MAX) {
    return {
      isValid: false,
      error: `${fieldName} must be ${VALIDATION.URL_MAX} characters or less`,
    };
  }

  // Basic URL validation
  try {
    new URL(trimmed);
    return { isValid: true, error: null };
  } catch {
    return {
      isValid: false,
      error: `${fieldName} must be a valid URL (e.g., https://example.com)`,
    };
  }
};

// ============================================================================
// Template Field Validation
// ============================================================================

/**
 * Validate template name
 * Rules: Required, 3-100 characters
 */
export const validateTemplateName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length < VALIDATION.TEMPLATE_NAME_MIN) {
    return {
      isValid: false,
      error: `Template name must be at least ${VALIDATION.TEMPLATE_NAME_MIN} characters`,
    };
  }

  if (trimmed.length > VALIDATION.TEMPLATE_NAME_MAX) {
    return {
      isValid: false,
      error: `Template name must be ${VALIDATION.TEMPLATE_NAME_MAX} characters or less`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate template description
 * Rules: Optional, max 500 characters
 */
export const validateTemplateDescription = (description: string): ValidationResult => {
  if (!description) {
    return { isValid: true, error: null }; // Optional field
  }

  if (description.length > VALIDATION.TEMPLATE_DESCRIPTION_MAX) {
    return {
      isValid: false,
      error: `Description must be ${VALIDATION.TEMPLATE_DESCRIPTION_MAX} characters or less`,
    };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate image file
 * Rules: Must be image type, max 5MB
 */
export const validateImageFile = (file: File): ValidationResult => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image (PNG, JPG, GIF, etc.)',
    };
  }

  // Check file size
  if (file.size > VALIDATION.MAX_IMAGE_SIZE) {
    const maxSizeMB = VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `Image must be ${maxSizeMB}MB or less`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate any file
 * Rules: Max 10MB
 */
export const validateFile = (file: File): ValidationResult => {
  if (file.size > VALIDATION.MAX_FILE_SIZE) {
    const maxSizeMB = VALIDATION.MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File must be ${maxSizeMB}MB or less`,
    };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// Ethereum Address Validation
// ============================================================================

/**
 * Validate Ethereum address
 * Rules: Must be valid hex address format
 */
export const validateEthereumAddress = (address: string): ValidationResult => {
  const trimmed = address.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Address is required',
    };
  }

  // Check if it's a valid Ethereum address format (0x + 40 hex characters)
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid Ethereum address format',
    };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// Number Validation
// ============================================================================

/**
 * Validate positive number
 * Rules: Must be a positive number
 */
export const validatePositiveNumber = (
  value: string | number,
  fieldName: string = 'Value'
): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (num <= 0) {
    return {
      isValid: false,
      error: `${fieldName} must be greater than 0`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate integer
 * Rules: Must be a whole number
 */
export const validateInteger = (
  value: string | number,
  fieldName: string = 'Value'
): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a whole number`,
    };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple fields at once
 * Returns the first error found, or null if all valid
 */
export const validateFields = (
  validations: Array<() => ValidationResult>
): ValidationResult => {
  for (const validate of validations) {
    const result = validate();
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true, error: null };
};

// ============================================================================
// Export all validators
// ============================================================================

export default {
  validateDisplayName,
  validateUsername,
  validateBio,
  validateUrl,
  validateTemplateName,
  validateTemplateDescription,
  validateImageFile,
  validateFile,
  validateEthereumAddress,
  validatePositiveNumber,
  validateInteger,
  validateFields,
};

/**
 * Utility Functions Index
 * Central export point for all utility functions
 */

// UUID utilities
export {
  stringToUUID,
  generateUUID,
  isValidUUID,
  ensureUUID,
  createNamespacedUUID,
  UUIDExamples
} from './uuid';

// Re-export commonly used functions for convenience
export { stringToUUID as convertToUUID } from './uuid';
export { generateUUID as createUUID } from './uuid';
export { isValidUUID as validateUUID } from './uuid';
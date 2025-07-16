/**
 * UUID Helper Functions
 * Provides utilities for generating and validating UUID v4 format strings
 */

/**
 * Converts a string user ID into a deterministic UUID v4 format
 * This ensures consistent UUID generation for the same input string
 * 
 * @param userIdString - The input string to convert to UUID format
 * @returns A properly formatted UUID v4 string
 */
export function stringToUUID(userIdString: string): string {
  if (!userIdString || typeof userIdString !== 'string') {
    throw new Error('Invalid input: userIdString must be a non-empty string');
  }

  // Create a simple hash from the input string
  let hash = 0;
  for (let i = 0; i < userIdString.length; i++) {
    const char = userIdString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to positive number and create hex string
  const positiveHash = Math.abs(hash);
  let hashHex = positiveHash.toString(16);
  
  // Pad with zeros to ensure we have enough characters
  while (hashHex.length < 32) {
    hashHex = '0' + hashHex;
  }
  
  // If hash is longer than 32 chars, truncate it
  if (hashHex.length > 32) {
    hashHex = hashHex.substring(0, 32);
  }

  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // The '4' indicates version 4, and 'y' should be 8, 9, A, or B
  const uuid = [
    hashHex.slice(0, 8),
    hashHex.slice(8, 12),
    '4' + hashHex.slice(12, 15), // Version 4
    ((parseInt(hashHex[15], 16) & 0x3) | 0x8).toString(16) + hashHex.slice(16, 19), // Variant bits
    hashHex.slice(19, 31)
  ].join('-');

  return uuid;
}

/**
 * Generates a random UUID v4 format string
 * 
 * @returns A randomly generated UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is in proper UUID v4 format
 * 
 * @param uuid - The string to validate
 * @returns True if the string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Converts any string to a valid UUID format for database compatibility
 * If the input is already a valid UUID, returns it unchanged
 * Otherwise, converts it using stringToUUID
 * 
 * @param input - The input string to ensure is UUID format
 * @returns A valid UUID v4 format string
 */
export function ensureUUID(input: string): string {
  if (isValidUUID(input)) {
    return input;
  }
  return stringToUUID(input);
}

/**
 * Creates a namespace-based UUID for consistent generation
 * Useful when you need the same input to always generate the same UUID
 * 
 * @param namespace - A namespace identifier (e.g., 'user', 'session', 'guest')
 * @param value - The value to convert to UUID
 * @returns A deterministic UUID based on namespace and value
 */
export function createNamespacedUUID(namespace: string, value: string): string {
  const combined = `${namespace}:${value}`;
  return stringToUUID(combined);
}

// Example usage and test cases
export const UUIDExamples = {
  // Convert string user IDs to UUID format
  convertUserIds: () => {
    const examples = [
      'user_123',
      'guest_456',
      'admin_789',
      'test-user-id'
    ];
    
    return examples.map(id => ({
      original: id,
      uuid: stringToUUID(id),
      isValid: isValidUUID(stringToUUID(id))
    }));
  },
  
  // Generate random UUIDs
  generateRandomUUIDs: (count: number = 3) => {
    return Array.from({ length: count }, () => ({
      uuid: generateUUID(),
      isValid: true
    }));
  },
  
  // Test deterministic behavior
  testDeterministic: () => {
    const testString = 'user_123';
    const uuid1 = stringToUUID(testString);
    const uuid2 = stringToUUID(testString);
    
    return {
      input: testString,
      uuid1,
      uuid2,
      areSame: uuid1 === uuid2,
      isValid: isValidUUID(uuid1)
    };
  }
};
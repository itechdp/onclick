// Environment configuration for webhook URLs
export const config = {
  // n8n Cloud Production URL
  WEBHOOK_URL: 'https://n8n.srv954870.hstgr.cloud/webhook/e143d432-be0e-4631-a5ab-7172f0221f6f',
  
  
  // Request timeout in milliseconds
  TIMEOUT_MS: 20000, // 20 seconds

  // Debug mode
  DEBUG: true,
  
  // Supported file types
  SUPPORTED_FILE_TYPES: ['application/pdf'],
  
  // Maximum file size (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// Helper function to get the webhook URL
export const getWebhookUrl = (): string => {
  // Always use direct URL for now to avoid proxy issues with FormData
  return config.WEBHOOK_URL;
};

// Helper function for logging
export const debugLog = (...args: unknown[]) => {
  if (config.DEBUG) {
    console.log('[AI_DEBUG]', ...args);
  }
};

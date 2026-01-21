// Environment configuration for webhook URLs
export const config = {
  // n8n Cloud Production URL
  WEBHOOK_URL: 'https://n8n.srv954870.hstgr.cloud/webhook/fe134dec-ce75-4e75-bb7b-b88a06fb0422',
  
  
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

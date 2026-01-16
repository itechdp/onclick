// Test script to check webhook response format
const testWebhook = async () => {
  try {
    console.log('Testing webhook...');
    
    const response = await fetch('https://n8n.srv954870.hstgr.cloud/webhook/e143d432-be0e-4631-a5ab-7172f0221f6f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        message: 'Testing webhook connection',
        timestamp: new Date().toISOString()
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('JSON Response:', data);
    } else {
      const text = await response.text();
      console.log('Text Response:', text);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testWebhook();

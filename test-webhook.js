// Test script to check webhook response format
const testWebhook = async () => {
  try {
    console.log('Testing webhook...');
    
    const response = await fetch('https://n8n.srv954870.hstgr.cloud/webhook/fe134dec-ce75-4e75-bb7b-b88a06fb0422', {
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

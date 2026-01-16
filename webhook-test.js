// Simple test script to check webhook connectivity
// Run this in browser console to test your webhook

const testWebhook = async () => {
  const webhookUrl = 'https://n8n.srv954870.hstgr.cloud/webhook/31dd4edc-d138-4ad7-a67a-6ca788fbea00';
  
  console.log('🔧 Testing webhook:', webhookUrl);
  
  try {
    // Test 1: Simple JSON POST
    console.log('Test 1: Simple JSON POST');
    const jsonResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        message: 'Simple test message',
        timestamp: new Date().toISOString()
      })
    });
    
    console.log('JSON Test - Status:', jsonResponse.status);
    const jsonData = await jsonResponse.text();
    console.log('JSON Test - Response:', jsonData);
    
    // Test 2: FormData POST (simulating file upload)
    console.log('\nTest 2: FormData POST');
    const formData = new FormData();
    formData.append('test', 'true');
    formData.append('message', 'FormData test message');
    formData.append('timestamp', new Date().toISOString());
    
    const formResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });
    
    console.log('FormData Test - Status:', formResponse.status);
    const formDataResponse = await formResponse.text();
    console.log('FormData Test - Response:', formDataResponse);
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
  }
};

// Run the test
testWebhook();

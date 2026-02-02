export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  console.log('🚀 Webhook handler started');
  console.log('📍 Request method:', req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('📖 Reading request body...');
    const userData = await req.json();
    
    console.log('📨 Sending webhook to n8n with data:', JSON.stringify(userData, null, 2));
    
    // Forward the request to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      'https://n8n.srv954870.hstgr.cloud/webhook/7fc9bf52-5516-40ea-8f30-8a7ffd058651',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('📥 n8n response status:', response.status);
    console.log('📥 n8n response body:', responseText);

    if (!response.ok) {
      console.error('❌ Webhook failed:', response.status, responseText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook failed',
          details: responseText,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Webhook sent successfully');
    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('❌ Error details:', errorMessage);
    console.error('❌ Error stack:', errorStack);
    
    // Check if it's an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook timeout',
          details: 'Request to n8n timed out after 10 seconds' 
        }),
        { 
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: errorMessage,
        stack: errorStack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

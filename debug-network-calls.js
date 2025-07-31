// Debug script to intercept and log all network calls
console.log('🔍 Setting up network call interceptor...');

// Store original fetch
const originalFetch = window.fetch;

// Intercept all fetch calls
window.fetch = async function(...args) {
  const [url, options] = args;
  
  // Log all PATCH requests to event_seats table
  if (options?.method === 'PATCH' && url.includes('event_seats_fanaticka_7a3x9d')) {
    console.log('🚨 PATCH REQUEST INTERCEPTED:');
    console.log('URL:', url);
    console.log('Options:', options);
    console.log('Body:', options?.body);
    console.log('Stack trace:', new Error().stack);
    
    // Check if body contains 'hold'
    if (options?.body && typeof options.body === 'string') {
      if (options.body.includes('"hold"')) {
        console.error('❌ FOUND "hold" IN REQUEST BODY!');
        console.error('Body:', options.body);
        console.error('This is the problematic request!');
      }
    }
  }
  
  // Call original fetch
  const response = await originalFetch.apply(this, args);
  
  // Log response for PATCH requests
  if (options?.method === 'PATCH' && url.includes('event_seats_fanaticka_7a3x9d')) {
    console.log('📥 PATCH RESPONSE:');
    console.log('Status:', response.status);
    console.log('StatusText:', response.statusText);
    
    if (!response.ok) {
      console.error('❌ PATCH FAILED!');
      const errorText = await response.clone().text();
      console.error('Error body:', errorText);
    }
  }
  
  return response;
};

console.log('✅ Network interceptor ready! Try selecting a seat now.');
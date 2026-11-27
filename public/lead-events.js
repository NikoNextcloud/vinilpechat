'use strict';

// Call only after the server confirms the inquiry. No contact or order data is sent.
window.trackVinilLead = function(source) {
 if (typeof window.gtag !== 'function') return;
 try {
  window.gtag('event', 'generate_lead', {lead_source: source});
 } catch (error) {
  console.warn('Vinilpechat analytics event was not sent:', error.message);
 }
};

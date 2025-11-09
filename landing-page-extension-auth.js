/**
 * Landing Page Extension Auth Handler
 *
 * Add this script to your pocketstox.com/auth page to handle authentication
 * from the browser extension.
 *
 * This script:
 * 1. Detects when user arrives from the extension (?source=extension)
 * 2. Checks if user is already signed in
 * 3. Sends auth data to extension immediately if signed in
 * 4. OR proceeds with OAuth flow and sends data after completion
 */

(function() {
  'use strict';

  // Check if this page was opened from the extension
  const urlParams = new URLSearchParams(window.location.search);
  const fromExtension = urlParams.get('source') === 'extension';

  if (!fromExtension) {
    console.log('Not opened from extension, skipping extension auth handler');
    return;
  }

  console.log('Page opened from extension, setting up auth handler');

  /**
   * Send authentication data to the extension
   * @param {Object} user - Supabase user object
   * @param {Object} session - Supabase session object
   */
  function sendAuthToExtension(user, session) {
    console.log('Sending auth data to extension...', { email: user.email, hasToken: !!session.access_token });

    // Send message that the extension's content script will intercept
    window.postMessage({
      type: 'POCKETSTOX_AUTH_SUCCESS',
      source: 'pocketstox-landing',
      data: {
        user: {
          email: user.email,
          id: user.id,
          app_metadata: user.app_metadata || {}
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      }
    }, window.location.origin);

    console.log('Auth data sent to extension');

    // Show success message to user
    showSuccessMessage();
  }

  /**
   * Show success message and auto-close instructions
   */
  function showSuccessMessage() {
    // You can customize this UI to match your landing page design
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #2e1f5b 0%, #1e1b4b 100%);
      color: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      text-align: center;
      max-width: 400px;
    `;

    messageDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 1rem;">✓</div>
      <h2 style="margin: 0 0 0.5rem 0; font-size: 24px; font-weight: 600;">Signed In Successfully!</h2>
      <p style="margin: 0 0 1rem 0; opacity: 0.9;">Your Pocketstox extension is now authenticated.</p>
      <p style="margin: 0; font-size: 14px; opacity: 0.7;">You can close this tab and return to the extension.</p>
    `;

    document.body.appendChild(messageDiv);

    // Optional: Auto-close the tab after 3 seconds
    // Uncomment if you want this behavior
    // setTimeout(() => {
    //   window.close();
    // }, 3000);
  }

  /**
   * Check if user is already authenticated and send data
   * This should be called immediately when page loads
   */
  async function checkExistingAuth() {
    try {
      // Replace this with your actual Supabase client instance
      // Assuming you have a global 'supabase' object from @supabase/supabase-js

      if (typeof window.supabase === 'undefined') {
        console.error('Supabase client not found. Make sure Supabase is initialized before this script.');
        return;
      }

      console.log('Checking for existing authentication...');

      const { data: { session }, error } = await window.supabase.auth.getSession();

      if (error) {
        console.error('Error checking session:', error);
        return;
      }

      if (session && session.user) {
        console.log('User is already authenticated:', session.user.email);
        // User is already signed in - send auth data immediately
        sendAuthToExtension(session.user, session);
      } else {
        console.log('User not authenticated, waiting for OAuth flow...');
        // User needs to sign in - the onAuthStateChange listener below will handle it
      }
    } catch (error) {
      console.error('Error in checkExistingAuth:', error);
    }
  }

  /**
   * Listen for auth state changes (handles OAuth callback)
   */
  function setupAuthListener() {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase client not found');
      return;
    }

    console.log('Setting up auth state listener...');

    // Listen for auth state changes (fires after OAuth completes)
    window.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session && session.user) {
        console.log('User signed in:', session.user.email);
        // Send auth data to extension
        sendAuthToExtension(session.user, session);
      }
    });
  }

  // Initialize: Check for existing auth and set up listener
  console.log('Initializing extension auth handler...');

  // Wait for Supabase to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAuthListener();
      checkExistingAuth();
    });
  } else {
    setupAuthListener();
    checkExistingAuth();
  }

  // Also check after a short delay in case Supabase loads asynchronously
  setTimeout(() => {
    if (typeof window.supabase !== 'undefined') {
      checkExistingAuth();
    }
  }, 1000);

})();

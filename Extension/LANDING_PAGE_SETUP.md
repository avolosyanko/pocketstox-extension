# Landing Page Extension Auth Setup

This guide explains how to set up your `pocketstox.com/auth` page to properly communicate with the browser extension.

## Problem

When a user clicks "Sign in with Google" in the extension:
1. It opens `pocketstox.com/auth?source=extension`
2. If the user is **already signed in** on the website, no new OAuth flow happens
3. The extension never receives the authentication credentials
4. The extension still shows "Sign in" even though the user is authenticated

## Solution

Add the `landing-page-extension-auth.js` script to your auth page to:
1. Detect when the page is opened from the extension (`?source=extension`)
2. Check if the user is already authenticated
3. Send credentials to the extension immediately if signed in
4. OR send credentials after OAuth completes if not signed in

---

## Installation Steps

### 1. Add the script to your auth page

In your `pocketstox.com/auth` HTML file, add this script **AFTER** your Supabase initialization:

```html
<!-- Your existing Supabase setup -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Your Supabase initialization
  const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');
  window.supabase = supabase; // Make it globally available
</script>

<!-- Add the extension auth handler -->
<script src="/path/to/landing-page-extension-auth.js"></script>
```

**OR** you can inline the script directly in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');
  window.supabase = supabase;
</script>

<!-- Inline the extension auth handler -->
<script>
  // Paste the entire contents of landing-page-extension-auth.js here
</script>
```

### 2. Important Requirements

The script needs:

✅ **Supabase client available as `window.supabase`**
   - Make sure your Supabase client is initialized and accessible globally

✅ **Runs AFTER Supabase is initialized**
   - The script must load after Supabase is ready

✅ **Content Security Policy allows postMessage**
   - The script uses `window.postMessage` to communicate with the extension

### 3. Verify the Extension Content Script

Make sure your extension's `manifest.json` includes the content script for pocketstox.com:

```json
"content_scripts": [{
  "matches": ["https://pocketstox.com/*"],
  "js": ["src/content-scripts/auth-listener.js"],
  "run_at": "document_start"
}]
```

✅ This is already configured in your extension!

---

## How It Works

### Flow Diagram

```
User clicks "Sign in" in Extension
        ↓
Opens pocketstox.com/auth?source=extension
        ↓
Landing page script detects ?source=extension
        ↓
    ┌───────────────────────────┐
    │ Is user already signed in?│
    └───────────┬───────────────┘
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        ↓               ↓
Send auth data    Show Google OAuth
immediately            │
        │               ↓
        │         User signs in
        │               │
        │               ↓
        │        Send auth data
        │         after OAuth
        │               │
        └───────┬───────┘
                ↓
        window.postMessage
                ↓
    Extension content script
       (auth-listener.js)
                ↓
    chrome.runtime.sendMessage
                ↓
        Extension popup
        (AccountTab.jsx)
                ↓
    Save to chrome.storage.local
                ↓
        Show user email + "Sign out" button
```

### Message Format

The landing page sends this message via `window.postMessage`:

```javascript
{
  type: 'POCKETSTOX_AUTH_SUCCESS',
  source: 'pocketstox-landing',
  data: {
    user: {
      email: "user@example.com",
      id: "uuid-here",
      app_metadata: {
        subscription_status: "active" // or undefined
      }
    },
    session: {
      access_token: "jwt-token-here",
      refresh_token: "refresh-token-here",
      expires_at: 1234567890
    }
  }
}
```

---

## Testing

### Test Case 1: Already Signed In

1. Sign in to pocketstox.com normally (not from extension)
2. Open the extension
3. Click "Sign in with Google"
4. **Expected**: Auth page opens, immediately recognizes you're signed in, sends credentials, shows success message
5. **Check extension**: Should show your email and "Sign out" button

### Test Case 2: Not Signed In

1. Sign out from pocketstox.com
2. Open the extension
3. Click "Sign in with Google"
4. **Expected**: Auth page opens, shows Google OAuth flow
5. Complete sign-in
6. **Expected**: After OAuth completes, sends credentials, shows success message
7. **Check extension**: Should show your email and "Sign out" button

### Test Case 3: Normal Website Access

1. Go directly to pocketstox.com/auth (without ?source=extension)
2. **Expected**: Normal auth flow, NO messages sent to extension
3. Console should show: "Not opened from extension, skipping extension auth handler"

### Debugging

Check the browser console on the auth page for these messages:

✅ `Page opened from extension, setting up auth handler`
✅ `Checking for existing authentication...`
✅ `User is already authenticated: user@example.com` (if signed in)
✅ `Sending auth data to extension...`
✅ `Auth data sent to extension`

Check the extension console (right-click extension → Inspect):

✅ `Auth successful: { email: "user@example.com", ... }`
✅ Extension UI updates to show email and sign-out button

---

## Customization

### Custom Success Message

Edit the `showSuccessMessage()` function in `landing-page-extension-auth.js` to match your brand:

```javascript
function showSuccessMessage() {
  // Customize the HTML and styling here
  messageDiv.innerHTML = `
    <div style="...">Your custom message</div>
  `;
}
```

### Auto-Close Tab

Uncomment this line in the script to auto-close the tab after 3 seconds:

```javascript
setTimeout(() => {
  window.close();
}, 3000);
```

### Different Supabase Variable Name

If your Supabase client is not `window.supabase`, change these lines:

```javascript
// Find and replace:
window.supabase.auth.getSession()

// With:
yourSupabaseClient.auth.getSession()
```

---

## Troubleshooting

### "Supabase client not found" error

**Problem**: Script loads before Supabase is initialized

**Solution**: Move the script tag to load AFTER Supabase initialization

### Extension doesn't receive auth data

**Problem**: Content script not running on pocketstox.com

**Solution**:
1. Check `manifest.json` has the correct content script configuration
2. Reload the extension in `chrome://extensions/`
3. Check for CSP (Content Security Policy) issues

### Success message doesn't show

**Problem**: CSS might be conflicting with existing page styles

**Solution**: Adjust the `showSuccessMessage()` styling to have higher specificity or use `!important`

### User data incomplete (missing isPremium)

**Problem**: `app_metadata.subscription_status` not set in Supabase

**Solution**:
1. Set user metadata in Supabase dashboard
2. Or modify the script to check a different field for premium status

---

## Security Considerations

✅ **Origin check**: The script only sends messages to `window.location.origin` (pocketstox.com)

✅ **Source verification**: Extension content script verifies message source is `pocketstox-landing`

✅ **URL parameter**: Only activates when `?source=extension` is present

⚠️ **Token exposure**: Tokens are sent via `postMessage` which can be intercepted by other scripts on the same page. Ensure your landing page doesn't have XSS vulnerabilities.

---

## Next Steps

1. ✅ Add `landing-page-extension-auth.js` to your auth page
2. ✅ Test with both signed-in and signed-out states
3. ✅ Customize the success message UI
4. ✅ Deploy to production

---

## Questions?

If you run into issues, check:
- Browser console on landing page
- Extension console (right-click extension → Inspect)
- Network tab for any errors
- Supabase auth logs for session info

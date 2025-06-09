// Authentication service for premium accounts
class AuthService {
    constructor() {
        this.AUTH_URL = 'https://your-api.com/auth'; // Replace with your auth endpoint
    }

    async signUpWithEmail(email, password) {
        try {
            const storageManager = new window.StorageManager();
            const installId = await storageManager.getInstallId();
            
            const response = await fetch(`${this.AUTH_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    installId, // Link anonymous usage to account
                    source: 'chrome-extension'
                })
            });

            if (!response.ok) {
                throw new Error('Signup failed');
            }

            const data = await response.json();
            
            // Store account data and link anonymous history
            await storageManager.linkAnonymousToAccount({
                email: data.email,
                userId: data.userId,
                authToken: data.authToken,
                isPremium: data.isPremium || false,
                createdAt: new Date().toISOString()
            });

            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async signInWithEmail(email, password) {
        try {
            const storageManager = new window.StorageManager();
            
            const response = await fetch(`${this.AUTH_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                throw new Error('Sign in failed');
            }

            const data = await response.json();
            
            // Store account data
            await storageManager.setAccount({
                email: data.email,
                userId: data.userId,
                authToken: data.authToken,
                isPremium: data.isPremium || false,
                lastSignIn: new Date().toISOString()
            });

            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    async signOut() {
        const storageManager = new window.StorageManager();
        await storageManager.clearAccount();
    }

    async checkAuthStatus() {
        const storageManager = new window.StorageManager();
        const account = await storageManager.getAccount();
        
        if (!account || !account.authToken) {
            return { isAuthenticated: false };
        }

        // Optionally verify token with server
        try {
            const response = await fetch(`${this.AUTH_URL}/verify`, {
                headers: {
                    'Authorization': `Bearer ${account.authToken}`
                }
            });

            if (!response.ok) {
                await this.signOut();
                return { isAuthenticated: false };
            }

            const data = await response.json();
            return {
                isAuthenticated: true,
                isPremium: data.isPremium,
                email: account.email
            };
        } catch (error) {
            console.error('Auth check failed:', error);
            return { isAuthenticated: false };
        }
    }

    async upgradeToPremium(paymentToken) {
        try {
            const storageManager = new window.StorageManager();
            const account = await storageManager.getAccount();
            
            if (!account) {
                throw new Error('No account found');
            }

            const response = await fetch(`${this.AUTH_URL}/upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${account.authToken}`
                },
                body: JSON.stringify({
                    paymentToken,
                    userId: account.userId
                })
            });

            if (!response.ok) {
                throw new Error('Upgrade failed');
            }

            const data = await response.json();
            
            // Update account to premium
            await storageManager.setAccount({
                ...account,
                isPremium: true,
                upgradedAt: new Date().toISOString()
            });

            return data;
        } catch (error) {
            console.error('Upgrade error:', error);
            throw error;
        }
    }
}

window.AuthService = AuthService;
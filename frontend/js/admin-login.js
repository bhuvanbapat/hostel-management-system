// js/admin-login.js

(function() {
    // 1. DEPENDENCY CHECK
    if (!window.AuthService || !window.UIManager) {
        console.error("Critical modules (AuthService, UIManager) are not loaded.");
        return;
    }

    // 2. DOM ELEMENT CACHE
    const elements = {
        loginForm: document.getElementById('loginForm'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        loginBtn: document.getElementById('loginBtn'),
        errorMessage: document.getElementById('error-message')
    };

    /**
     * Decodes a JWT to extract its payload.
     */
    function decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) { return null; }
    }
    
    /**
     * Handles the admin login form submission.
     */
    async function handleLogin(event) {
        // === THIS IS THE CRITICAL FIX ===
        // This line stops the form from its default action of reloading the page.
        event.preventDefault(); 
        
        elements.errorMessage.textContent = '';
        elements.loginBtn.disabled = true;
        elements.loginBtn.textContent = 'Logging in...';

        const result = await AuthService.login(elements.usernameInput.value, elements.passwordInput.value);

        if (result.success) {
            const decodedToken = decodeJwt(result.token);
            if (decodedToken && decodedToken.user && decodedToken.user.role === 'admin') {
                UIManager.showToast('Login Successful!', 'success');
                window.location.href = 'admin.html';
            } else {
                AuthService.logout();
                elements.errorMessage.textContent = 'Access Denied: Not an admin user.';
                elements.loginBtn.disabled = false;
                elements.loginBtn.textContent = 'Login';
            }
        } else {
            elements.errorMessage.textContent = result.message;
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Login';
        }
    }

    // 4. INITIALIZATION
    function init() {
        if (AuthService.isLoggedIn()) {
            const decoded = decodeJwt(AuthService.getToken());
            if (decoded && decoded.user && decoded.user.role === 'admin') {
                window.location.href = 'admin.html';
                return;
            }
        }
        elements.loginForm.addEventListener('submit', handleLogin);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
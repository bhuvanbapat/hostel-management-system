// js/student-login.js

(function() {
    // 1. DEPENDENCY CHECK
    // We check if the global objects exist
    if (!window.AuthService || !window.UIManager) {
        console.error("Critical modules (AuthService, UIManager) are not loaded. Check script order in HTML.");
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

    // Helper: Decode Token
    function decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) { return null; }
    }
    
    // Handler: Login
    async function handleLogin(event) {
        event.preventDefault();
        elements.errorMessage.textContent = '';
        elements.loginBtn.disabled = true;
        elements.loginBtn.textContent = 'Logging in...';

        // Call the global AuthService
        const result = await window.AuthService.login(elements.usernameInput.value, elements.passwordInput.value);

        if (result.success) {
            const decodedToken = decodeJwt(result.token);
            
            // Security Check: Is this a student?
            if (decodedToken && decodedToken.user && decodedToken.user.role === 'student') {
                
                // Save Student ID if present
                if (decodedToken.user.studentId) {
                    sessionStorage.setItem('loggedInStudentId', decodedToken.user.studentId);
                }
                
                window.UIManager.showToast('Login Successful!', 'success');
                
                // Redirect
                setTimeout(() => {
                    window.location.href = 'student.html';
                }, 500);

            } else {
                // Not a student
                window.AuthService.logout();
                elements.errorMessage.textContent = 'Access Denied: Not a student user.';
                elements.loginBtn.disabled = false;
                elements.loginBtn.textContent = 'Login';
            }
        } else {
            // Login failed
            elements.errorMessage.textContent = result.message;
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Login';
        }
    }

    // 4. INITIALIZATION
    function init() {
        // Auto-redirect if already logged in
        if (window.AuthService.isLoggedIn()) {
            const decoded = decodeJwt(window.AuthService.getToken());
            if (decoded && decoded.user && decoded.user.role === 'student') {
                window.location.href = 'student.html';
                return;
            }
        }
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLogin);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
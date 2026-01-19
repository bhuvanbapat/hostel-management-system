// js/main.js

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
     * Decodes a JSON Web Token (JWT) to extract its payload.
     */
    function decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Failed to decode JWT:", e);
            return null;
        }
    }
    
    /**
     * Handles the login form submission.
     */
    async function handleLogin(event) {
        event.preventDefault();
        elements.errorMessage.textContent = '';
        elements.loginBtn.disabled = true;
        elements.loginBtn.textContent = 'Logging in...';

        const username = elements.usernameInput.value;
        const password = elements.passwordInput.value;

        const result = await AuthService.login(username, password);

        if (result.success) {
            UIManager.showToast('Login Successful!', 'success');
            
            const decodedToken = decodeJwt(result.token);
            if (decodedToken && decodedToken.user) {
                const { role, studentId } = decodedToken.user;
                
                if (role === 'student' && studentId) {
                    sessionStorage.setItem('loggedInStudentId', studentId);
                }

                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (role === 'student') {
                    window.location.href = 'student.html';
                } else {
                    elements.errorMessage.textContent = 'Unknown user role.';
                }
            } else {
                elements.errorMessage.textContent = 'Failed to process authentication token.';
            }
        } else {
            elements.errorMessage.textContent = result.message;
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Login';
        }
    }

    // 4. INITIALIZATION
    function init() {
        // === THIS BLOCK IS NOW REMOVED ===
        // The code that automatically checked for a login and redirected
        // has been deleted to ensure the login page is always shown.

        // Always attach the event listener for the login form.
        elements.loginForm.addEventListener('submit', handleLogin);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
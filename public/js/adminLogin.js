(function () {
  const form = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const errorMsg = document.getElementById('errorMsg');

  // Default admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = '1234';

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = (usernameInput.value || '').trim();
    const password = (passwordInput.value || '').trim();

    errorMsg.textContent = '';

    // Validate inputs
    if (!username || !password) {
      errorMsg.textContent = 'Please enter both username and password.';
      return;
    }

    // Disable submit button while processing
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }

    // Simulate server call
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }

      // Check credentials
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Store admin session
        localStorage.setItem('adminSession', JSON.stringify({
          username: username,
          timestamp: Date.now()
        }));
        
        // Redirect to admin dashboard
        window.location.href = 'admin.html';
      } else {
        errorMsg.textContent = 'Invalid username or password.';
        passwordInput.value = '';
        passwordInput.focus();
      }
    }, 800);
  });
})();
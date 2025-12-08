
    (function(){
      const form = document.getElementById('loginForm');
      const errorMsg = document.getElementById('errorMsg');

      form.addEventListener('submit', function(e){
        e.preventDefault();
        errorMsg.textContent = '';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
          errorMsg.textContent = 'Please enter both username and password.';
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        // Simulate server response
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;

          // Demo credentials: change or remove for production
          if (username === 'user' && password === '1234') {
            // redirect to the main/front page
            window.location.href = 'frontpage.html';
          } else {
            errorMsg.textContent = 'Invalid username or password.';
          }
        }, 900);
      });
    })();8

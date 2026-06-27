// auth.js
function checkAuth(isProtectedPage) {
    const user = localStorage.getItem('user');

    if (isProtectedPage && !user) {
        // If it's a protected page (like Dashboard) and no user exists, go to login
        window.location.replace('login.html');
    } else if (!isProtectedPage && user) {
        // If it's a public page (like Login) and a user DOES exist, go to dashboard
        window.location.replace('index.html');
    }
}
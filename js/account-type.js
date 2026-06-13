const accountTypeKey = 'nicagrowSelectedRole';
const accountCards = document.querySelectorAll('.account-type-card');

// guarda el tipo de cuenta elegido antes de abrir el login
for (let i = 0; i < accountCards.length; i++) {
    accountCards[i].addEventListener('click', function () {
        const role = this.dataset.role;
        localStorage.setItem(accountTypeKey, role);
        window.location.href = 'login.html';
    });
}
    
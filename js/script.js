const usersKey = 'nicagrowUsers';
const sessionKey = 'nicagrowCurrentUser';
const accountTypeKey = 'nicagrowSelectedRole';

// elementos principales del formulario
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const registerRoleMessage = document.getElementById('registerRoleMessage');
const roleSelector = document.getElementById('roleSelector');
const roleCards = document.querySelectorAll('.role-card');
const registerRoleInput = document.getElementById('registerRole');
const selectedRoleLabel = document.getElementById('selectedRoleLabel');
const continueRegisterBtn = document.getElementById('continueRegisterBtn');
const backToRolesBtn = document.getElementById('backToRolesBtn');
const roleStep = document.querySelector('.role-step');
const detailsStep = document.querySelector('.details-step');

// nombres visibles para cada tipo de cuenta
const roleLabels = {
    seller: 'Vendedor',
    buyer: 'Comprador'
};

// obtiene el rol que se escogio antes de entrar al login
function getSelectedAccountType() {
    return localStorage.getItem(accountTypeKey);
}

// lee los usuarios guardados en el navegador
function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(usersKey));

        if (users) {
            return users;
        }

        return [];
    } catch {
        return [];
    }
}

// guarda la lista completa de usuarios
function saveUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
}

// guarda el usuario que inicio sesion
function saveSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
}

// muestra mensajes de error o exito en los formularios
function setMessage(element, message, type) {
    if (!element) {
        return;
    }

    element.textContent = message;

    if (type === 'success') {
        element.classList.add('success');
    } else {
        element.classList.remove('success');
    }
}

// limpia mensajes antes de volver a validar
function clearMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = '';
    element.classList.remove('success');
}

// marca visualmente el rol elegido para el registro
function setSelectedRole(role) {
    registerRoleInput.value = role;
    selectedRoleLabel.textContent = roleLabels[role] || 'Cuenta';
    localStorage.setItem(accountTypeKey, role);

    for (let i = 0; i < roleCards.length; i++) {
        if (roleCards[i].dataset.role === role) {
            roleCards[i].classList.add('active');
        } else {
            roleCards[i].classList.remove('active');
        }
    }

    clearMessage(registerRoleMessage);
}

// vuelve al paso donde se escoge el tipo de cuenta
function showRoleStep() {
    roleStep.classList.add('active');
    detailsStep.classList.remove('active');
}

// muestra el formulario con los datos del usuario
function showDetailsStep() {
    roleStep.classList.remove('active');
    detailsStep.classList.add('active');
}

// manda a cada usuario a la pantalla que le corresponde
function redirectByRole(role) {
    if (role === 'seller') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'buyer-dashboard.html';
    }
}

// si ya venia un rol elegido, lo aplica al registro
function applySelectedRoleToRegister() {
    const selectedRole = getSelectedAccountType();

    if (selectedRole && roleLabels[selectedRole]) {
        setSelectedRole(selectedRole);
    }
}

// revisa si el correo ya fue usado
function emailAlreadyExists(users, email) {
    for (let i = 0; i < users.length; i++) {
        if (String(users[i].email).toLowerCase() === email) {
            return true;
        }
    }

    return false;
}

// busca un usuario que coincida con correo y contrasena
function findUser(users, email, password) {
    for (let i = 0; i < users.length; i++) {
        const sameEmail = String(users[i].email).toLowerCase() === email;
        const samePassword = users[i].password === password;

        if (sameEmail && samePassword) {
            return users[i];
        }
    }

    return null;
}

applySelectedRoleToRegister();

// abre el formulario de registro
registerBtn.addEventListener('click', function () {
    container.classList.add('active');
    showRoleStep();
    clearMessage(registerRoleMessage);
    clearMessage(registerMessage);
});

// vuelve al formulario de inicio de sesion
loginBtn.addEventListener('click', function () {
    container.classList.remove('active');
    clearMessage(loginMessage);
});

// permite escoger comprador o vendedor
roleSelector.addEventListener('click', function (event) {
    const button = event.target.closest('.role-card');

    if (button) {
        setSelectedRole(button.dataset.role);
    }
});

// pasa del rol a los datos personales
continueRegisterBtn.addEventListener('click', function () {
    if (!registerRoleInput.value) {
        setMessage(registerRoleMessage, 'Selecciona si deseas registrarte como vendedor o comprador.');
        return;
    }

    showDetailsStep();
    clearMessage(registerMessage);
});

// vuelve del formulario de datos al selector de rol
backToRolesBtn.addEventListener('click', function () {
    showRoleStep();
    clearMessage(registerMessage);
});

// crea la cuenta y entra automaticamente
registerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage(registerMessage);

    const role = registerRoleInput.value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const birthDate = document.getElementById('birthDate').value;
    const phone = document.getElementById('phone').value.trim();
    const city = document.getElementById('city').value.trim();

    if (!role || !firstName || !lastName || !email || !password || !birthDate || !phone || !city) {
        setMessage(registerMessage, 'Completa todos los campos para crear tu cuenta.');
        return;
    }

    if (password.trim().length < 6) {
        setMessage(registerMessage, 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const users = getUsers();

    if (emailAlreadyExists(users, email)) {
        setMessage(registerMessage, 'Ese correo ya está registrado. Intenta iniciar sesión.');
        return;
    }

    const newUser = {
        id: Date.now(),
        role: role,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        birthDate: birthDate,
        phone: phone,
        city: city
    };

    users.push(newUser);
    saveUsers(users);
    saveSession(newUser);

    setTimeout(function () {
        redirectByRole(newUser.role);
    }, 300);
});

// valida el login y abre la pantalla segun el rol guardado
loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearMessage(loginMessage);

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        setMessage(loginMessage, 'Ingresa tu correo y contraseña para continuar.');
        return;
    }

    const users = getUsers();
    const user = findUser(users, email, password);

    if (!user) {
        setMessage(loginMessage, 'Las credenciales no coinciden con ninguna cuenta registrada.');
        return;
    }

    localStorage.setItem(accountTypeKey, user.role);
    saveSession(user);
    setMessage(loginMessage, 'Bienvenido, ' + user.firstName + '. Redirigiendo...', 'success');

    setTimeout(function () {
        redirectByRole(user.role);
    }, 700);
});

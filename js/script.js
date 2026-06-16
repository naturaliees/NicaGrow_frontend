const accountTypeKey = 'nicagrowSelectedRole';

// elementos principales que controlan el cambio entre login y registro
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// formularios y mensajes que se actualizan segun cada accion
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

// etiquetas visibles para el tipo de cuenta seleccionado
const roleLabels = {
    seller: 'Vendedor',
    buyer: 'Comprador'
};

// lee la cuenta elegida antes de entrar al login
function getSelectedAccountType() {
    return localStorage.getItem(accountTypeKey);
}

// muestra mensajes de error o exito dentro de cada formulario
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

// limpia mensajes anteriores para que no confundan al usuario
function clearMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = '';
    element.classList.remove('success');
}

// guarda visualmente si el usuario quiere cuenta de comprador o vendedor
function setSelectedRole(role) {
    registerRoleInput.value = role;
    selectedRoleLabel.textContent = roleLabels[role] || 'Cuenta';
    localStorage.setItem(accountTypeKey, role);

    for (let i = 0; i < roleCards.length; i++) {
        roleCards[i].classList.toggle('active', roleCards[i].dataset.role === role);
    }

    clearMessage(registerRoleMessage);
}

// vuelve al primer paso del registro
function showRoleStep() {
    roleStep.classList.add('active');
    detailsStep.classList.remove('active');
}

// abre el formulario con los datos personales
function showDetailsStep() {
    roleStep.classList.remove('active');
    detailsStep.classList.add('active');
}

// manda al dashboard correcto despues de iniciar sesion
function redirectByRole(role) {
    if (role === 'seller') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'buyer-dashboard.html';
    }
}

// aplica el tipo de cuenta que venia desde la pantalla anterior
function applySelectedRoleToRegister() {
    const selectedRole = getSelectedAccountType();

    if (selectedRole && roleLabels[selectedRole]) {
        setSelectedRole(selectedRole);
    }
}

// bloquea botones mientras una peticion esta en proceso
function setLoading(button, isLoading, label) {
    if (!button) {
        return;
    }

    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? label : button.dataset.originalText;
}

// valida que la fecha de nacimiento indique al menos 18 anos
function isAdult(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();

    if (Number.isNaN(birth.getTime())) {
        return false;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    const dayDifference = today.getDate() - birth.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    return age >= 18;
}

// arma el cuerpo correcto para registrar compradores o vendedores
async function registerUser(payload) {
    if (payload.role === 'buyer') {
        return NicaGrowApi.post('/auth/registro-cliente/', {
            Nombre: payload.firstName,
            Apellidos: payload.lastName,
            Correo: payload.email,
            Telefono: payload.phone,
            FNacimiento: payload.birthDate,
            IdCiudad: payload.city.Id,
            Contrasena: payload.password
        });
    }

    return NicaGrowApi.post('/auth/registro-vendedor/', {
        Nombre: payload.firstName,
        Apellidos: payload.lastName,
        NombreNegocio: payload.businessName,
        Correo: payload.email,
        Telefono: payload.phone,
        FNacimiento: payload.birthDate,
        IdCiudad: payload.city.Id,
        Contrasena: payload.password
    });
}

// deja listo el registro con el rol guardado
applySelectedRoleToRegister();

// abre el panel de registro desde el login
registerBtn.addEventListener('click', function () {
    container.classList.add('active');
    showRoleStep();
    clearMessage(registerRoleMessage);
    clearMessage(registerMessage);
});

// regresa al panel de inicio de sesion
loginBtn.addEventListener('click', function () {
    container.classList.remove('active');
    clearMessage(loginMessage);
});

// permite elegir comprador o vendedor dentro del registro
roleSelector.addEventListener('click', function (event) {
    const button = event.target.closest('.role-card');

    if (button) {
        setSelectedRole(button.dataset.role);
    }
});

// valida que exista un rol antes de pasar al formulario
continueRegisterBtn.addEventListener('click', function () {
    if (!registerRoleInput.value) {
        setMessage(registerRoleMessage, 'Selecciona si deseas registrarte como vendedor o comprador.');
        return;
    }

    showDetailsStep();
    clearMessage(registerMessage);
});

// permite corregir el tipo de cuenta antes de crearla
backToRolesBtn.addEventListener('click', function () {
    showRoleStep();
    clearMessage(registerMessage);
});

// envia el registro a django y entra automaticamente
registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessage(registerMessage);

    const submitButton = registerForm.querySelector('.details-step .btn');
    const role = registerRoleInput.value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const birthDate = document.getElementById('birthDate').value;
    const phone = document.getElementById('phone').value.trim();
    const cityName = document.getElementById('city').value.trim();

    if (!role || !firstName || !lastName || !email || !password || !birthDate || !phone || !cityName) {
        setMessage(registerMessage, 'Completa todos los campos para crear tu cuenta.');
        return;
    }

    if (password.trim().length < 6) {
        setMessage(registerMessage, 'La contrasena debe tener al menos 6 caracteres.');
        return;
    }

    if (!isAdult(birthDate)) {
        setMessage(registerMessage, 'Debes ser mayor de 18 años para crear una cuenta.');
        return;
    }

    try {
        setLoading(submitButton, true, 'Creando...');
        const city = await NicaGrowApi.ensureCiudad(cityName);
        const response = await registerUser({
            role: role,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            birthDate: birthDate,
            phone: phone,
            city: city,
            businessName: firstName + ' ' + lastName
        });
        const user = NicaGrowApi.saveSession(response);
        user.city = city.Ciudad;
        user.cityId = city.Id;
        localStorage.setItem('nicagrowCurrentUser', JSON.stringify(user));
        redirectByRole(user.role);
    } catch (error) {
        setMessage(registerMessage, error.message || 'No se pudo crear la cuenta.');
    } finally {
        setLoading(submitButton, false);
    }
});

// valida credenciales y abre el dashboard segun el rol
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessage(loginMessage);

    const submitButton = loginForm.querySelector('.btn');
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        setMessage(loginMessage, 'Ingresa tu correo y contrasena para continuar.');
        return;
    }

    try {
        setLoading(submitButton, true, 'Entrando...');
        const response = await NicaGrowApi.post('/auth/login/', {
            Correo: email,
            Contrasena: password
        });
        const user = NicaGrowApi.saveSession(response);
        localStorage.setItem(accountTypeKey, user.role);
        setMessage(loginMessage, 'Bienvenido, ' + user.firstName + '. Redirigiendo...', 'success');
        redirectByRole(user.role);
    } catch (error) {
        setMessage(loginMessage, error.message || 'Las credenciales no coinciden con ninguna cuenta registrada.');
    } finally {
        setLoading(submitButton, false);
    }
});
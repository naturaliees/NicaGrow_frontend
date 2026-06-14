const NicaGrowApi = (function () {
    // rutas y claves que usa el frontend para hablar con django
    const defaultBaseUrl = 'https://out-farms-simplified-poet.trycloudflare.com/api';
    const configKey = 'nicagrowApiUrl';
    const sessionKey = 'nicagrowCurrentUser';
    const tokenKey = 'nicagrowAccessToken';

    // limpia la url para evitar dobles barras al unir endpoints
    function cleanBaseUrl(value) {
        return String(value || '')
            .trim()
            .replace(/\/$/, '');
    }

    // obtiene la url activa de la api, local por defecto
    function getBaseUrl() {
        return cleanBaseUrl(localStorage.getItem(configKey)) || defaultBaseUrl;
    }

    // permite cambiar la url si algun dia se vuelve a usar otra api
    function setBaseUrl(url) {
        localStorage.setItem(configKey, cleanBaseUrl(url));
    }

    // vuelve a usar la api local definida en el archivo
    function resetBaseUrl() {
        localStorage.removeItem(configKey);
    }

    // lee el token guardado despues del login
    function getToken() {
        return localStorage.getItem(tokenKey);
    }

    // recupera el usuario activo para proteger los dashboards
    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(sessionKey));
        } catch {
            return null;
        }
    }

    // traduce los nombres de rol del backend a los usados por las vistas
    function normalizeRole(role) {
        if (role === 'cliente') {
            return 'buyer';
        }

        if (role === 'vendedor') {
            return 'seller';
        }

        return role;
    }

    // deja el usuario con nombres simples para usarlo en toda la interfaz
    function normalizeUser(user, role) {
        return {
            id: user.Id,
            role: normalizeRole(role),
            firstName: user.Nombre || '',
            lastName: user.Apellidos || '',
            businessName: user.NombreNegocio || '',
            email: user.Correo || '',
            phone: user.Telefono || '',
            birthDate: user.FNacimiento || '',
            cityId: user.IdCiudad || '',
            city: user.Ciudad || user.IdCiudad || '',
            address: user.Direccion || ''
        };
    }

    // guarda usuario y token cuando el login o registro responden bien
    function saveSession(payload) {
        const user = normalizeUser(payload.usuario || payload.user, payload.rol || payload.role);
        const access = payload.tokens ? payload.tokens.access : payload.token;

        if (access) {
            localStorage.setItem(tokenKey, access);
        }

        localStorage.setItem(sessionKey, JSON.stringify(user));
        return user;
    }

    // cierra la sesion local sin tocar los datos del backend
    function clearSession() {
        localStorage.removeItem(sessionKey);
        localStorage.removeItem(tokenKey);
    }

    // funcion base para todas las llamadas a django
    async function request(path, options) {
        const settings = options || {};
        const headers = settings.headers || {};

        if (!headers['Content-Type'] && settings.body) {
            headers['Content-Type'] = 'application/json';
        }

        if (settings.auth) {
            const token = getToken();

            if (token) {
                headers.Authorization = 'Bearer ' + token;
            }
        }

        let response;

        try {
            response = await fetch(getBaseUrl() + path, {
                ...settings,
                headers: headers
            });
        } catch {
            throw new Error('No se pudo conectar con la API local. Revisa que Django este corriendo en 127.0.0.1:8000.');
        }

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const message = data && (data.detail || data.error || JSON.stringify(data));
            throw new Error(message || 'No se pudo completar la solicitud.');
        }

        return data;
    }

    // atajos para enviar datos al backend
    function post(path, body) {
        return request(path, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // actualiza recursos existentes, como perfil, producto o estado de venta
    function patch(path, body) {
        return request(path, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    // normaliza respuestas que pueden venir como lista directa o paginada
    async function list(path) {
        const data = await request(path);
        return Array.isArray(data) ? data : data.results || [];
    }

    // ayuda pequena para comparar texto de formularios
    function cleanText(value) {
        return String(value || '').trim();
    }

    // crea un codigo de ciudad si el backend no la tiene registrada
    function makeCityId(cityName) {
        const cleaned = cleanText(cityName)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z]/g, '')
            .toUpperCase();

        return (cleaned + 'XXX').slice(0, 3);
    }

    // busca la ciudad en la bd y la crea solo si hace falta
    async function ensureCiudad(cityName) {
        const cityText = cleanText(cityName);
        const ciudades = await list('/ciudades/');
        const found = ciudades.find(function (city) {
            return String(city.Id).toLowerCase() === cityText.toLowerCase() ||
                String(city.Ciudad).toLowerCase() === cityText.toLowerCase();
        });

        if (found) {
            return found;
        }

        return post('/ciudades/', {
            Id: makeCityId(cityText),
            Ciudad: cityText
        });
    }

    // busca elementos de catalogo antes de intentar crearlos
    async function ensureCatalog(path, field, value) {
        const text = cleanText(value);
        const items = await list(path);
        const found = items.find(function (item) {
            return String(item[field]).toLowerCase() === text.toLowerCase();
        });

        if (found) {
            return found;
        }

        return post(path, { [field]: text });
    }

    async function getEstado(name) {
        return ensureCatalog('/estados/', 'TipoEstado', name);
    }

    async function getMetodoPago(name) {
        return ensureCatalog('/metodos-pago/', 'Metodo', name);
    }

    async function getMetodoEnvio(name) {
        return ensureCatalog('/metodos-envio/', 'MetodoEnvio', name);
    }

    async function getCategoria(name) {
        return ensureCatalog('/categorias/', 'Categoria', name);
    }

    return {
        baseUrl: getBaseUrl,
        getBaseUrl: getBaseUrl,
        setBaseUrl: setBaseUrl,
        resetBaseUrl: resetBaseUrl,
        getSession: getSession,
        saveSession: saveSession,
        clearSession: clearSession,
        request: request,
        post: post,
        patch: patch,
        list: list,
        ensureCiudad: ensureCiudad,
        getEstado: getEstado,
        getMetodoPago: getMetodoPago,
        getMetodoEnvio: getMetodoEnvio,
        getCategoria: getCategoria
    };
})();

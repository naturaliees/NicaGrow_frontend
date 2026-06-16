const sessionKey = 'nicagrowCurrentUser';

// datos basicos de sesion y formato
function getCurrentUser() {
    return NicaGrowApi.getSession();
}

function saveSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
}

function formatCurrency(value) {
    return 'C$' + Number(value || 0).toLocaleString('es-NI');
}

function escapeHtml(value) {
    let text = String(value === null || value === undefined ? '' : value);
    text = text.split('&').join('&amp;');
    text = text.split('<').join('&lt;');
    text = text.split('>').join('&gt;');
    text = text.split('"').join('&quot;');
    text = text.split("'").join('&#039;');
    return text;
}

// detecta imagenes guardadas como texto base64 en la base de datos
function isBase64Image(value) {
    const image = String(value || '').replace(/\s/g, '');
    return image.length > 40 && /^[A-Za-z0-9+/=]+$/.test(image);
}

function getBase64Mime(value) {
    const image = String(value || '').replace(/\s/g, '');

    if (image.indexOf('iVBOR') === 0) {
        return 'image/png';
    }

    if (image.indexOf('R0lG') === 0) {
        return 'image/gif';
    }

    if (image.indexOf('UklGR') === 0) {
        return 'image/webp';
    }

    return 'image/jpeg';
}

// convierte rutas relativas de django en urls completas para el navegador
function normalizeImageSource(value) {
    const image = String(value || '').trim();
    const cleanImage = image.replace(/\s/g, '');

    if (!image) {
        return '';
    }

    if (image.indexOf('data:image') === 0 || image.indexOf('http') === 0 || image.indexOf('blob:') === 0) {
        return image;
    }

    if (isBase64Image(image)) {
        return 'data:' + getBase64Mime(image) + ';base64,' + cleanImage;
    }

    if (image.indexOf('/media/') === 0 || image.indexOf('media/') === 0) {
        const apiRoot = NicaGrowApi.getBaseUrl().replace(/\/api$/, '');
        return apiRoot + '/' + image.replace(/^\//, '');
    }

    if (image.indexOf('/') >= 0 || image.indexOf('.') >= 0) {
        const apiRoot = NicaGrowApi.getBaseUrl().replace(/\/api$/, '');
        return apiRoot + '/' + image.replace(/^\//, '');
    }

    return 'data:image/jpeg;base64,' + image;
}

// prepara imagenes que vienen como url o como archivo convertido a base64
function getProductImage(product) {
    const imageUrl = product.FotoUrl || product.FotoURL || product.foto_url || product.imagen_url ||
        product.ImagenUrl || product.FotoProductoUrl || product.Foto || product.foto ||
        product.Imagen || product.imagen || product.FotoProducto || product.foto_producto ||
        product.image || product.Image;
    const imageBase64 = product.FotoBase64 || product.foto_base64 || product.ImagenBase64 ||
        product.imagen_base64 || product.FotoProductoBase64 || product.foto_producto_base64;

    if (imageUrl) {
        return normalizeImageSource(imageUrl);
    }

    if (imageBase64) {
        return normalizeImageSource(imageBase64);
    }

    return '';
}

// deja solo el texto base64 cuando la api guarda la imagen en una columna
function cleanImageBase64(imageData) {
    const value = String(imageData || '');
    const commaIndex = value.indexOf(',');

    if (commaIndex >= 0) {
        return value.slice(commaIndex + 1);
    }

    return value;
}

// convierte una imagen del dispositivo en texto para enviarla al backend
function readImageFile(file) {
    return new Promise(function (resolve, reject) {
        if (!file) {
            resolve('');
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            const result = String(reader.result || '');
            resolve(result);
        };

        reader.onerror = function () {
            reject(new Error('No se pudo leer la imagen.'));
        };

        reader.readAsDataURL(file);
    });
}

// normaliza los estados para mostrarlos igual en toda la vista
function getStatusLabel(status) {
    const value = String(status || 'pendiente').toLowerCase();

    if (value === 'entregado') {
        return 'entregada';
    }

    return value;
}

// escoge el color del estado dentro de las tablas
function getStatusBadge(status) {
    const value = getStatusLabel(status);

    if (value === 'entregada') {
        return 'bg-success';
    }

    if (value === 'enviada') {
        return 'bg-primary';
    }

    if (value === 'preparando') {
        return 'bg-info text-dark';
    }

    return 'bg-warning text-dark';
}

const currentUser = getCurrentUser();

// protege el dashboard para que solo entren vendedores
if (!currentUser || currentUser.role !== 'seller') {
    window.location.href = 'account-type.html';
} else {
    // referencias de la interfaz del vendedor
    const sellerSessionName = document.getElementById('sellerSessionName');
    const logoutButton = document.getElementById('logoutButton');
    const navButtons = document.querySelectorAll('[data-dashboard-view]');
    const dashboardViews = document.querySelectorAll('.dashboard-view');
    const productForm = document.getElementById('productForm');
    const productMessage = document.getElementById('productMessage');
    const productFormTitle = document.getElementById('productFormTitle');
    const productSubmitBtn = document.getElementById('productSubmitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileButton = document.getElementById('profileButton');
    const profileModal = document.getElementById('profileModal');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const profileMessage = document.getElementById('profileMessage');
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileBusinessName = document.getElementById('profileBusinessName');
    const saleModal = document.getElementById('saleModal');
    const closeSaleModalBtn = document.getElementById('closeSaleModalBtn');
    const saveSaleStatusBtn = document.getElementById('saveSaleStatusBtn');
    const saleStatusSelect = document.getElementById('saleStatusSelect');
    const saleMessage = document.getElementById('saleMessage');
    const productCategory = document.getElementById('productCategory');
    const productImageInput = document.getElementById('productImage');
    const productImagePreview = document.getElementById('productImagePreview');

    let editingProductId = null;
    let activeSale = null;
    let categories = [];
    let productsCache = [];
    let salesCache = [];
    let clientsCache = [];

    sellerSessionName.textContent = currentUser.firstName + ' ' + currentUser.lastName;

    // cambia entre panel, productos y ventas
    function setDashboardView(viewName) {
        for (let i = 0; i < navButtons.length; i++) {
            navButtons[i].classList.toggle('active', navButtons[i].dataset.dashboardView === viewName);
        }

        for (let i = 0; i < dashboardViews.length; i++) {
            dashboardViews[i].classList.toggle('active', dashboardViews[i].id === viewName + 'View');
        }
    }

    // mensajes pequenos para formularios y modales
    function setProductMessage(message, type) {
        productMessage.textContent = message;
        productMessage.classList.toggle('error', type === 'error');
    }

    function setProfileMessage(message, type) {
        profileMessage.textContent = message;
        profileMessage.classList.toggle('error', type === 'error');
    }

    function setSaleMessage(message, type) {
        saleMessage.textContent = message;
        saleMessage.classList.toggle('error', type === 'error');
    }

    // muestra la foto actual o la nueva seleccionada en el formulario
    function renderProductImagePreview(image) {
        if (image) {
            productImagePreview.innerHTML = '<img src="' + escapeHtml(image) + '" alt="vista previa del producto">';
            return;
        }

        productImagePreview.textContent = 'sin foto';
    }

    // arma el formato que la api espera para guardar la foto en la base de datos
    async function buildProductJsonPayload(file) {
        const payload = {
            IdVendedor: currentUser.id,
            NombreProducto: document.getElementById('productName').value.trim(),
            Precio: Number(document.getElementById('productPrice').value),
            Stock: Number(document.getElementById('productStock').value),
            IdCategoria: productCategory.value
        };

        const imageBase64 = await readImageFile(file);

        if (imageBase64) {
            payload.Foto = imageBase64;
        }

        return payload;
    }

    // guarda productos usando el campo foto en base64 que entiende django
    async function saveProductToApi(productId, file) {
        const jsonPayload = await buildProductJsonPayload(file);

        if (productId) {
            return await NicaGrowApi.patch('/productos/' + productId + '/', jsonPayload);
        }

        return await NicaGrowApi.post('/productos/', jsonPayload);
    }

    // busca el nombre visible de una categoria
    function categoryName(id) {
        const category = categories.find(function (item) {
            return String(item.Id) === String(id);
        });

        return category ? category.Categoria : 'Sin categoria';
    }

    // limpia textos para comparar nombres que vienen desde reportes
    function normalizeText(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // busca el cliente de una venta para completar contacto
    function findClientForSale(sale) {
        const saleClientName = normalizeText(sale.Cliente);

        return clientsCache.find(function (client) {
            const clientName = normalizeText((client.Nombre || '') + ' ' + (client.Apellidos || ''));

            return String(client.Id) === String(sale.IdCliente || sale.ClienteId || '') ||
                clientName === saleClientName;
        });
    }

    // busca direccion si viene del reporte o de una compra hecha en este navegador
    function findSaleAddress(sale) {
        const directAddress = sale.Direccion || sale.DireccionEnvio || sale.DireccionEntrega || sale.DireccionCliente;

        if (directAddress) {
            return directAddress;
        }

        try {
            const invoices = JSON.parse(localStorage.getItem('nicagrowBuyerInvoices')) || [];
            const invoice = invoices.find(function (item) {
                return String(item.IdPedido) === String(sale.IdPedido) &&
                    normalizeText(item.NombreProducto) === normalizeText(sale.NombreProducto);
            });

            return invoice ? invoice.Direccion : '';
        } catch {
            return '';
        }
    }

    // agrega correo, telefono y direccion cuando el reporte no los trae
    function enrichSaleWithClientInfo(sale) {
        const client = findClientForSale(sale) || {};

        return {
            ...sale,
            ClienteCorreo: sale.ClienteCorreo || sale.CorreoCliente || client.Correo || '',
            ClienteTelefono: sale.ClienteTelefono || sale.TelefonoCliente || client.Telefono || '',
            Direccion: findSaleAddress(sale)
        };
    }

    // carga las categorias necesarias para publicar productos
    async function loadCategories() {
        const defaultCategories = [
            'Artesanias Tradicionales',
            'Bisuteria Hecha a Mano',
            'Cacao y Cafe Artesanal',
            'Ceramica de Barro',
            'Cuero Artesanal',
            'Decoracion Tipica',
            'Hogar y Bambu',
            'Productos Ecologicos',
            'Souvenirs Nacionales',
            'Textiles Nicaraguenses'
        ];

        categories = await NicaGrowApi.list('/categorias/');

        if (categories.length === 0) {
            for (let i = 0; i < defaultCategories.length; i++) {
                await NicaGrowApi.getCategoria(defaultCategories[i]);
            }

            categories = await NicaGrowApi.list('/categorias/');
        }

        let html = '<option value="">Selecciona una categoria</option>';

        for (let i = 0; i < categories.length; i++) {
            html += '<option value="' + escapeHtml(categories[i].Id) + '">' + escapeHtml(categories[i].Categoria) + '</option>';
        }

        productCategory.innerHTML = html;
    }

    // crea la tarjeta visual de un producto del vendedor
    function buildProductCard(product) {
        const image = getProductImage(product);
        let productMedia = '<div class="seller-product-placeholder">sin foto</div>';
        let html = '';

        if (image) {
            productMedia = '<img src="' + escapeHtml(image) + '" class="card-img-top" alt="' + escapeHtml(product.NombreProducto) + '">';
        }

        html += '<div class="col-md-6 col-xl-4">';
        html += '<article class="card seller-product-card h-100">';
        html += productMedia;
        html += '<div class="card-body">';
        html += '<h3 class="card-title">' + escapeHtml(product.NombreProducto) + '</h3>';
        html += '<span class="seller-category">' + escapeHtml(categoryName(product.IdCategoria)) + '</span>';
        html += '<p class="card-text">Producto publicado en NicaGrow.</p>';
        html += '<p class="text-price">' + formatCurrency(product.Precio) + '</p>';
        html += '<span class="seller-stock">Stock: ' + escapeHtml(product.Stock) + '</span>';
        html += '<button type="button" class="seller-edit-product-btn" data-product-id="' + escapeHtml(product.Id) + '">Editar</button>';
        html += '</div>';
        html += '</article>';
        html += '</div>';
        return html;
    }

    function renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        const overviewProducts = document.getElementById('overviewProducts');
        const productCountLabel = document.getElementById('productCountLabel');
        let productsHtml = '';
        let overviewHtml = '';

        for (let i = 0; i < products.length; i++) {
            productsHtml += buildProductCard(products[i]);

            if (i < 3) {
                overviewHtml += buildProductCard(products[i]);
            }
        }

        if (!productsHtml) {
            productsHtml = '<div class="col-12"><p class="buyer-empty">Todavia no tienes productos publicados.</p></div>';
        }

        productsGrid.innerHTML = productsHtml;
        overviewProducts.innerHTML = overviewHtml || productsHtml;
        productCountLabel.textContent = products.length + ' productos publicados';
    }

    // pinta el historial de ventas del vendedor
    function renderSalesTable(sales) {
        const salesTableBody = document.getElementById('salesTableBody');
        let html = '';

        for (let i = 0; i < sales.length; i++) {
            const badgeClass = getStatusBadge(sales[i].Estado);
            const statusLabel = getStatusLabel(sales[i].Estado);

            html += '<tr>';
            html += '<td>' + escapeHtml(sales[i].NombreProducto) + '</td>';
            html += '<td>' + escapeHtml(sales[i].Cliente) + '</td>';
            html += '<td>' + escapeHtml(sales[i].ClienteTelefono || sales[i].ClienteCorreo || 'Sin contacto') + '</td>';
            html += '<td>' + escapeHtml(sales[i].Cantidad) + '</td>';
            html += '<td><span class="badge ' + badgeClass + '">' + escapeHtml(statusLabel) + '</span></td>';
            html += '<td>' + formatCurrency(sales[i].Subtotal) + '</td>';
            html += '<td><button type="button" class="seller-sale-detail-btn" data-sale-index="' + i + '">Ver detalle</button></td>';
            html += '</tr>';
        }

        if (!html) {
            html = '<tr><td colspan="7">Todavia no hay ventas registradas.</td></tr>';
        }

        salesTableBody.innerHTML = html;
    }

    // arma una grafica simple con el total vendido por producto
    function renderSalesChart(containerId, sales) {
        const container = document.getElementById(containerId);
        const totals = {};
        let maxValue = 1;
        let html = '';

        for (let i = 0; i < sales.length; i++) {
            const productName = sales[i].NombreProducto;
            totals[productName] = (totals[productName] || 0) + Number(sales[i].Subtotal || 0);

            if (totals[productName] > maxValue) {
                maxValue = totals[productName];
            }
        }

        for (const productName in totals) {
            let width = (totals[productName] / maxValue) * 100;

            if (width < 8) {
                width = 8;
            }

            html += '<div class="seller-chart-row">';
            html += '<div class="seller-chart-label">';
            html += '<span>' + escapeHtml(productName) + '</span>';
            html += '<strong>' + formatCurrency(totals[productName]) + '</strong>';
            html += '</div>';
            html += '<div class="seller-chart-track"><span style="width:' + width + '%"></span></div>';
            html += '</div>';
        }

        container.innerHTML = html || '<p class="buyer-empty">Sin ventas para graficar.</p>';
    }

    // actualiza los numeros grandes del resumen
    function renderStats(products, sales) {
        let revenue = 0;
        let delivered = 0;
        let pending = 0;

        for (let i = 0; i < sales.length; i++) {
            revenue += Number(sales[i].Subtotal || 0);

            if (getStatusLabel(sales[i].Estado) === 'entregada') {
                delivered++;
            }

            if (getStatusLabel(sales[i].Estado) === 'pendiente') {
                pending++;
            }
        }

        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalSales').textContent = sales.length;
        document.getElementById('totalRevenue').textContent = formatCurrency(revenue);
        document.getElementById('deliveredSales').textContent = delivered;
        document.getElementById('pendingSales').textContent = pending;
        document.getElementById('averageSale').textContent = formatCurrency(sales.length ? Math.round(revenue / sales.length) : 0);
    }

    // trae productos y ventas desde la api
    async function loadDashboard() {
        productsCache = await NicaGrowApi.list('/productos/?vendedor=' + currentUser.id);

        try {
            clientsCache = await NicaGrowApi.list('/clientes/');
        } catch {
            clientsCache = [];
        }

        const allSales = await NicaGrowApi.list('/reportes/detalle-pedidos/');
        salesCache = allSales.filter(function (sale) {
            return String(sale.Vendedor).toLowerCase() === String(currentUser.businessName).toLowerCase();
        }).map(function (sale) {
            return enrichSaleWithClientInfo(sale);
        });

        renderProducts(productsCache);
        renderStats(productsCache, salesCache);
        renderSalesTable(salesCache);
        renderSalesChart('overviewSalesChart', salesCache);
        renderSalesChart('salesChart', salesCache);
    }

    // limpia el formulario despues de publicar o editar
    function resetProductForm() {
        editingProductId = null;
        productForm.reset();
        renderProductImagePreview('');
        productFormTitle.textContent = 'Publicar producto';
        productSubmitBtn.textContent = 'Publicar';
        cancelEditBtn.classList.remove('active');
    }

    // carga un producto publicado dentro del formulario de edicion
    function startEditProduct(productId) {
        const product = productsCache.find(function (item) {
            return String(item.Id) === String(productId);
        });

        if (!product) {
            setProductMessage('No se encontro el producto.', 'error');
            return;
        }

        editingProductId = product.Id;
        document.getElementById('productName').value = product.NombreProducto || '';
        document.getElementById('productCategory').value = product.IdCategoria || '';
        document.getElementById('productPrice').value = product.Precio || '';
        document.getElementById('productStock').value = product.Stock || '';
        productImageInput.value = '';
        renderProductImagePreview(getProductImage(product));

        productFormTitle.textContent = 'Editar producto';
        productSubmitBtn.textContent = 'Guardar cambios';
        cancelEditBtn.classList.add('active');
        setDashboardView('products');
        setProductMessage('Editando producto: ' + product.NombreProducto, 'success');
    }

    // rellena el modal con la informacion del vendedor
    function fillProfileForm() {
        document.getElementById('profileFirstName').value = currentUser.firstName || '';
        document.getElementById('profileLastName').value = currentUser.lastName || '';
        document.getElementById('profileBusinessInput').value = currentUser.businessName || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profileBirthDate').value = currentUser.birthDate || '';
        document.getElementById('profilePhone').value = currentUser.phone || '';
        document.getElementById('profileCity').value = currentUser.city || currentUser.cityId || '';
        profileDisplayName.textContent = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
        profileBusinessName.textContent = currentUser.businessName || 'Nombre del negocio';
    }

    // abre y cierra el modal del perfil
    function openProfileModal() {
        fillProfileForm();
        setProfileMessage('', 'success');
        profileModal.classList.add('active');
    }

    function closeProfileModal() {
        profileModal.classList.remove('active');
    }

    // muestra todos los datos de una venta para poder cambiar su estado
    function openSaleModal(index) {
        const sale = salesCache[Number(index)];

        if (!sale) {
            return;
        }

        activeSale = sale;
        document.getElementById('saleDetailProduct').textContent = sale.NombreProducto;
        document.getElementById('saleDetailCustomer').textContent = sale.Cliente;
        document.getElementById('saleDetailTotal').textContent = formatCurrency(sale.Subtotal);
        document.getElementById('saleDetailEmail').textContent = sale.ClienteCorreo || 'Sin correo';
        document.getElementById('saleDetailPhone').textContent = sale.ClienteTelefono || 'Sin telefono';
        document.getElementById('saleDetailQuantity').textContent = sale.Cantidad;
        document.getElementById('saleDetailPayment').textContent = sale.MetodoPago;
        document.getElementById('saleDetailShipping').textContent = sale.MetodoEnvio;
        document.getElementById('saleDetailAddress').textContent = sale.Direccion || 'Sin direccion registrada';
        saleStatusSelect.value = getStatusLabel(sale.Estado);
        setSaleMessage('', 'success');
        saleModal.classList.add('active');
    }

    // guarda el nuevo estado de la venta en django
    async function saveSaleStatus() {
        if (!activeSale) {
            return;
        }

        try {
            const estado = await NicaGrowApi.getEstado(saleStatusSelect.value);
            const pedidos = await NicaGrowApi.list('/pedidos/');
            const pedido = pedidos.find(function (item) {
                return String(item.Id) === String(activeSale.IdPedido);
            });

            if (!pedido) {
                setSaleMessage('No se encontro el pedido.', 'error');
                return;
            }

            await NicaGrowApi.patch('/pedidos/' + activeSale.IdPedido + '/', {
                IdEstado: estado.Id
            });
            setSaleMessage('Estado actualizado correctamente.', 'success');
            await loadDashboard();
        } catch (error) {
            setSaleMessage(error.message || 'No se pudo actualizar el estado.', 'error');
        }
    }

    // navegacion interna del dashboard
    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener('click', function () {
            setDashboardView(this.dataset.dashboardView);
        });
    }

    // acciones delegadas para productos y ventas
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('seller-edit-product-btn')) {
            startEditProduct(event.target.dataset.productId);
        }

        if (event.target.classList.contains('seller-sale-detail-btn')) {
            openSaleModal(event.target.dataset.saleIndex);
        }
    });

    // botones principales de modales y formularios
    cancelEditBtn.addEventListener('click', function () {
        resetProductForm();
        setProductMessage('', 'success');
    });

    productImageInput.addEventListener('change', async function () {
        try {
            const imageBase64 = await readImageFile(productImageInput.files[0]);
            renderProductImagePreview(imageBase64);
        } catch (error) {
            renderProductImagePreview('');
            setProductMessage(error.message || 'No se pudo leer la imagen.', 'error');
        }
    });

    profileButton.addEventListener('click', openProfileModal);
    closeProfileBtn.addEventListener('click', closeProfileModal);
    closeSaleModalBtn.addEventListener('click', function () {
        saleModal.classList.remove('active');
        activeSale = null;
    });
    saveSaleStatusBtn.addEventListener('click', saveSaleStatus);

    profileModal.addEventListener('click', function (event) {
        if (event.target === profileModal) {
            closeProfileModal();
        }
    });

    saleModal.addEventListener('click', function (event) {
        if (event.target === saleModal) {
            saleModal.classList.remove('active');
        }
    });

    // guarda los cambios del perfil del vendedor
    profileForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        try {
            const city = await NicaGrowApi.ensureCiudad(document.getElementById('profileCity').value.trim());
            const payload = {
                Nombre: document.getElementById('profileFirstName').value.trim(),
                Apellidos: document.getElementById('profileLastName').value.trim(),
                NombreNegocio: document.getElementById('profileBusinessInput').value.trim() || currentUser.businessName,
                Correo: document.getElementById('profileEmail').value.trim().toLowerCase(),
                FNacimiento: document.getElementById('profileBirthDate').value,
                Telefono: document.getElementById('profilePhone').value.trim(),
                IdCiudad: city.Id
            };
            const updated = await NicaGrowApi.patch('/vendedores/' + currentUser.id + '/', payload);

            currentUser.firstName = updated.Nombre;
            currentUser.lastName = updated.Apellidos;
            currentUser.businessName = updated.NombreNegocio;
            currentUser.email = updated.Correo;
            currentUser.birthDate = updated.FNacimiento;
            currentUser.phone = updated.Telefono;
            currentUser.cityId = updated.IdCiudad;
            currentUser.city = city.Ciudad;
            saveSession(currentUser);
            sellerSessionName.textContent = currentUser.firstName + ' ' + currentUser.lastName;
            fillProfileForm();
            setProfileMessage('Perfil actualizado correctamente.', 'success');
            await loadDashboard();
        } catch (error) {
            setProfileMessage(error.message || 'No se pudo actualizar el perfil.', 'error');
        }
    });

    // publica productos nuevos o guarda cambios de productos existentes
    productForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const productName = document.getElementById('productName').value.trim();
        const productPrice = document.getElementById('productPrice').value;
        const productStock = document.getElementById('productStock').value;
        const categoryId = productCategory.value;
        const productImageFile = document.getElementById('productImage').files[0];

        if (!productName || !categoryId || !productPrice || !productStock) {
            setProductMessage('Completa los datos del producto.', 'error');
            return;
        }

        try {
            if (editingProductId) {
                await saveProductToApi(editingProductId, productImageFile);
                setProductMessage('Producto actualizado correctamente.', 'success');
            } else {
                await saveProductToApi('', productImageFile);
                setProductMessage('Producto publicado correctamente.', 'success');
            }

            resetProductForm();
            await loadDashboard();
        } catch (error) {
            setProductMessage(error.message || 'No se pudo guardar el producto.', 'error');
        }
    });

    // cierra la sesion actual
    logoutButton.addEventListener('click', function () {
        NicaGrowApi.clearSession();
        window.location.href = 'account-type.html';
    });

    // arranque inicial del dashboard
    (async function init() {
        try {
            await loadCategories();
            await loadDashboard();
        } catch (error) {
            setProductMessage(error.message || 'No se pudo cargar el panel.', 'error');
        }
    })();
}
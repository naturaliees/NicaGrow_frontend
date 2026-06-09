const sessionKey = 'nicagrowCurrentUser';
const usersKey = 'nicagrowUsers';
const productsKey = 'nicagrowSellerProducts';
const salesKey = 'nicagrowSellerSales';
const purchasesKey = 'nicagrowBuyerPurchases';

// toma la sesion que se guardo al iniciar o crear cuenta
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey));
    } catch {
        return null;
    }
}

// lee cualquier lista guardada sin romper la pagina si algo sale mal
function getStoredItems(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));

        if (data) {
            return data;
        }

        return [];
    } catch {
        return [];
    }
}

function saveStoredItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
}

function saveSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
}

// deja los montos en el formato que se muestra en el panel
function formatCurrency(value) {
    const numberValue = Number(value || 0);
    return 'C$' + numberValue.toLocaleString('es-NI');
}

// limpia texto escrito por usuarios
function escapeHtml(value) {
    let text = String(value || '');

    text = text.split('&').join('&amp;');
    text = text.split('<').join('&lt;');
    text = text.split('>').join('&gt;');
    text = text.split('"').join('&quot;');
    text = text.split("'").join('&#039;');

    return text;
}

// formato para subir imagenes
function getExternalImage(image) {
    const value = String(image || '').trim();

    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
        return value;
    }

    return '';
}

function getSampleProducts(sellerId) {
    const products = [];

    products.push({
        id: Date.now(),
        sellerId: sellerId,
        name: 'Camisa típica',
        description: 'Camisa de traje típico tejida a mano.',
        category: 'Textiles Nicaraguenses',
        price: 500,
        stock: 8,
        image: 'images/9e12520ad2012a0d5ca709c4197e8dff.jpg',
        isLocalSample: true
    });

    products.push({
        id: Date.now() + 1,
        sellerId: sellerId,
        name: 'Bolso tejido',
        description: 'Diseño artesanal resistente.',
        category: 'Artesanias Tradicionales',
        price: 200,
        stock: 12,
        image: 'images/65283311-accesorios-de-moda-femenina-y-de-diversos-artículos-de-bolsos-de-estilo-cubo-de-punto-mochilas.jpg',
        isLocalSample: true
    });

    return products;
}

function getSampleSales(sellerId) {
    const sales = [];

    sales.push({
        id: Date.now(),
        sellerId: sellerId,
        productName: 'Camisa típica',
        customer: 'María López',
        date: '12/04/2026',
        status: 'Entregado',
        total: 500
    });

    sales.push({
        id: Date.now() + 1,
        sellerId: sellerId,
        productName: 'Bolso tejido',
        customer: 'Carlos Ruiz',
        date: '10/04/2026',
        status: 'Pendiente',
        total: 200
    });

    sales.push({
        id: Date.now() + 2,
        sellerId: sellerId,
        productName: 'Camisa típica',
        customer: 'Ana Mendoza',
        date: '08/04/2026',
        status: 'Entregado',
        total: 500
    });

    return sales;
}

function getSellerItems(items, sellerId) {
    const sellerItems = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].sellerId === sellerId) {
            sellerItems.push(items[i]);
        }
    }

    return sellerItems;
}

// agrega datos de ejemplo para que el dashboard no aparezca vacio al inicio
function seedSellerData(sellerId) {
    const products = getStoredItems(productsKey);
    const sellerProducts = getSellerItems(products, sellerId);
    const sampleProducts = getSampleProducts(sellerId);

    if (sellerProducts.length === 0) {
        for (let i = 0; i < sampleProducts.length; i++) {
            products.push(sampleProducts[i]);
        }

        saveStoredItems(productsKey, products);
    } else {
        for (let i = 0; i < products.length; i++) {
            for (let j = 0; j < sampleProducts.length; j++) {
                const isSameSeller = products[i].sellerId === sellerId;
                const isSameProduct = products[i].name === sampleProducts[j].name;

            if (isSameSeller && isSameProduct && !products[i].image) {
                products[i].image = sampleProducts[j].image;
                products[i].isLocalSample = true;
            }

            if (isSameSeller && isSameProduct && !products[i].category) {
                products[i].category = sampleProducts[j].category;
            }
        }
    }

        saveStoredItems(productsKey, products);
    }

    const sales = getStoredItems(salesKey);
    const sellerSales = getSellerItems(sales, sellerId);
    const sampleSales = getSampleSales(sellerId);

    if (sellerSales.length === 0) {
        for (let i = 0; i < sampleSales.length; i++) {
            sales.push(sampleSales[i]);
        }

        saveStoredItems(salesKey, sales);
    }
}

// si no hay un vendedor logueado, se regresa al flujo de seleccion de cuenta
const currentUser = getCurrentUser();

if (!currentUser || currentUser.role !== 'seller') {
    window.location.href = 'account-type.html';
} else {
    seedSellerData(currentUser.id);

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
    let editingProductId = null;
    let activeSaleId = null;

    if (sellerSessionName) {
        sellerSessionName.textContent = currentUser.firstName + ' ' + currentUser.lastName;
    }

    function getSellerProducts() {
        const allProducts = getStoredItems(productsKey);
        return getSellerItems(allProducts, currentUser.id);
    }

    // busca los datos del comprador para mostrar contacto en ventas
    function getBuyerById(buyerId) {
        const users = getStoredItems(usersKey);

        for (let i = 0; i < users.length; i++) {
            if (String(users[i].id) === String(buyerId)) {
                return users[i];
            }
        }

        return null;
    }

    // normaliza estados para que comprador y vendedor lean lo mismo
    function getStatusLabel(status) {
        const value = String(status || 'pendiente').toLowerCase();

        if (value === 'entregado') {
            return 'entregada';
        }

        return value;
    }

    // elige el color del estado en la tabla del vendedor
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

    // toma contacto guardado en la compra o lo busca en usuarios
    function getPurchaseCustomer(purchase) {
        const buyer = getBuyerById(purchase.buyerId);

        if (purchase.buyer) {
            return purchase.buyer;
        }

        if (buyer) {
            return {
                name: buyer.firstName + ' ' + buyer.lastName,
                email: buyer.email || 'correo@nicagrow.com',
                phone: buyer.phone || '+505 9999 0000',
                city: buyer.city || 'Nicaragua'
            };
        }

        return {
            name: 'Cliente',
            email: 'correo@nicagrow.com',
            phone: '+505 9999 0000',
            city: 'Nicaragua'
        };
    }

    // convierte una compra del cliente en una venta para el vendedor
    function getSaleFromPurchase(purchase) {
        const customer = getPurchaseCustomer(purchase);
        const productTotal = Number(purchase.product.price || 0) * Number(purchase.quantity || 1);

        return {
            id: purchase.id,
            purchaseId: purchase.id,
            sellerId: purchase.product.sellerId,
            productName: purchase.product.name,
            customer: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            customerCity: customer.city,
            quantity: purchase.quantity || 1,
            status: getStatusLabel(purchase.status),
            total: productTotal + Number(purchase.shippingCost || 0),
            paymentMethod: purchase.paymentMethod || 'Pago contra entrega',
            shipping: purchase.shipping || 'Cargotrans',
            address: purchase.address || 'Nicaragua',
            source: 'purchase'
        };
    }

    // junta las ventas reales y deja ejemplos si aun no hay compras
    function getSellerSales() {
        const purchases = getStoredItems(purchasesKey);
        const sales = [];

        for (let i = 0; i < purchases.length; i++) {
            if (purchases[i].product && purchases[i].product.sellerId === currentUser.id) {
                sales.push(getSaleFromPurchase(purchases[i]));
            }
        }

        if (sales.length === 0) {
            const sampleSales = getSellerItems(getStoredItems(salesKey), currentUser.id);

            for (let i = 0; i < sampleSales.length; i++) {
                sampleSales[i].quantity = sampleSales[i].quantity || 1;
                sampleSales[i].customerEmail = sampleSales[i].customerEmail || 'cliente@nicagrow.com';
                sampleSales[i].customerPhone = sampleSales[i].customerPhone || '+505 8888 0000';
                sampleSales[i].paymentMethod = sampleSales[i].paymentMethod || 'Pago contra entrega';
                sampleSales[i].shipping = sampleSales[i].shipping || 'Cargotrans';
                sampleSales[i].address = sampleSales[i].address || 'Managua, Nicaragua';
                sampleSales[i].status = getStatusLabel(sampleSales[i].status);
                sampleSales[i].source = 'sample';
                sales.push(sampleSales[i]);
            }
        }

        return sales;
    }

    // cambia entre panel, productos e historial sin salir del dashboard
    function setDashboardView(viewName) {
        for (let i = 0; i < navButtons.length; i++) {
            if (navButtons[i].dataset.dashboardView === viewName) {
                navButtons[i].classList.add('active');
            } else {
                navButtons[i].classList.remove('active');
            }
        }

        for (let i = 0; i < dashboardViews.length; i++) {
            if (dashboardViews[i].id === viewName + 'View') {
                dashboardViews[i].classList.add('active');
            } else {
                dashboardViews[i].classList.remove('active');
            }
        }
    }

    // arma una tarjeta de producto reutilizable para las dos vistas
    function buildProductCard(product) {
        let image = '';

        if (product.isLocalSample) {
            image = product.image;
        } else {
            image = getExternalImage(product.image);
        }

        let productMedia = '<div class="seller-product-placeholder">sin imagen</div>';

        if (image) {
            productMedia = '<img src="' + escapeHtml(image) + '" class="card-img-top" alt="' + escapeHtml(product.name) + '">';
        }

        let html = '';
        html += '<div class="col-md-6 col-xl-4">';
        html += '<article class="card seller-product-card h-100">';
        html += productMedia;
        html += '<div class="card-body">';
        html += '<h3 class="card-title">' + escapeHtml(product.name) + '</h3>';
        html += '<span class="seller-category">' + escapeHtml(product.category || 'Sin categoria') + '</span>';
        html += '<p class="card-text">' + escapeHtml(product.description) + '</p>';
        html += '<p class="text-price">' + formatCurrency(product.price) + '</p>';
        html += '<span class="seller-stock">Stock: ' + escapeHtml(product.stock) + '</span>';
        html += '<button type="button" class="seller-edit-product-btn" data-product-id="' + escapeHtml(product.id) + '">Editar</button>';
        html += '</div>';
        html += '</article>';
        html += '</div>';

        return html;
    }

    // pinta los productos del vendedor y actualiza el contador
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

        if (productsGrid) {
            productsGrid.innerHTML = productsHtml;
        }

        if (overviewProducts) {
            overviewProducts.innerHTML = overviewHtml;
        }

        if (productCountLabel) {
            productCountLabel.textContent = products.length + ' productos publicados';
        }
    }

    // llena la tabla del historial con cada venta guardada
    function renderSalesTable(sales) {
        const salesTableBody = document.getElementById('salesTableBody');

        if (!salesTableBody) {
            return;
        }

        let html = '';

        for (let i = 0; i < sales.length; i++) {
            const badgeClass = getStatusBadge(sales[i].status);
            const statusLabel = getStatusLabel(sales[i].status);

            html += '<tr>';
            html += '<td>' + escapeHtml(sales[i].productName) + '</td>';
            html += '<td>' + escapeHtml(sales[i].customer) + '</td>';
            html += '<td>' + escapeHtml(sales[i].customerPhone || 'Sin telefono') + '</td>';
            html += '<td>' + escapeHtml(sales[i].quantity || 1) + '</td>';
            html += '<td><span class="badge ' + badgeClass + '">' + escapeHtml(statusLabel) + '</span></td>';
            html += '<td>' + formatCurrency(sales[i].total) + '</td>';
            html += '<td><button type="button" class="seller-sale-detail-btn" data-sale-id="' + escapeHtml(sales[i].id) + '">Ver detalle</button></td>';
            html += '</tr>';
        }

        salesTableBody.innerHTML = html;
    }

    // agrupa los ingresos para saber cuanto vendio cada producto
    function buildSalesByProduct(sales) {
        const totals = {};

        for (let i = 0; i < sales.length; i++) {
            const productName = sales[i].productName;

            if (!totals[productName]) {
                totals[productName] = 0;
            }

            totals[productName] += Number(sales[i].total || 0);
        }

        return totals;
    }

    function getMaxSaleValue(totals) {
        let maxValue = 1;

        for (const productName in totals) {
            if (totals[productName] > maxValue) {
                maxValue = totals[productName];
            }
        }

        return maxValue;
    }

    // dibuja barras simples para comparar ventas sin meter librerias
    function renderSalesChart(containerId, sales) {
        const container = document.getElementById(containerId);

        if (!container) {
            return;
        }

        const totals = buildSalesByProduct(sales);
        const maxValue = getMaxSaleValue(totals);
        let html = '';

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
            html += '<div class="seller-chart-track">';
            html += '<span style="width:' + width + '%"></span>';
            html += '</div>';
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // actualiza las tarjetas numericas del dashboard
    function renderStats(products, sales) {
        let revenue = 0;
        let delivered = 0;
        let pending = 0;

        for (let i = 0; i < sales.length; i++) {
            revenue += Number(sales[i].total || 0);

            if (getStatusLabel(sales[i].status) === 'entregada') {
                delivered++;
            }

            if (getStatusLabel(sales[i].status) === 'pendiente') {
                pending++;
            }
        }

        let average = 0;

        if (sales.length > 0) {
            average = Math.round(revenue / sales.length);
        }

        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalSales').textContent = sales.length;
        document.getElementById('totalRevenue').textContent = formatCurrency(revenue);
        document.getElementById('deliveredSales').textContent = delivered;
        document.getElementById('pendingSales').textContent = pending;
        document.getElementById('averageSale').textContent = formatCurrency(average);
    }

    // refresca todo lo que depende de productos y ventas
    function renderDashboard() {
        const products = getSellerProducts();
        const sales = getSellerSales();

        renderProducts(products);
        renderStats(products, sales);
        renderSalesTable(sales);
        renderSalesChart('overviewSalesChart', sales);
        renderSalesChart('salesChart', sales);
    }

    // muestra mensajes cortos debajo del formulario de producto
    function setProductMessage(message, type) {
        if (!productMessage) {
            return;
        }

        productMessage.textContent = message;

        if (type === 'error') {
            productMessage.classList.add('error');
        } else {
            productMessage.classList.remove('error');
        }
    }

    function setProfileMessage(message, type) {
        if (!profileMessage) {
            return;
        }

        profileMessage.textContent = message;

        if (type === 'error') {
            profileMessage.classList.add('error');
        } else {
            profileMessage.classList.remove('error');
        }
    }

    function setSaleMessage(message, type) {
        if (!saleMessage) {
            return;
        }

        saleMessage.textContent = message;

        if (type === 'error') {
            saleMessage.classList.add('error');
        } else {
            saleMessage.classList.remove('error');
        }
    }

    // encuentra una venta para abrirla en el modal
    function findSaleById(saleId) {
        const sales = getSellerSales();

        for (let i = 0; i < sales.length; i++) {
            if (String(sales[i].id) === String(saleId)) {
                return sales[i];
            }
        }

        return null;
    }

    // llena el modal con contacto, pago, envio y estado
    function openSaleModal(saleId) {
        const sale = findSaleById(saleId);

        if (!sale) {
            return;
        }

        activeSaleId = sale.id;
        document.getElementById('saleDetailProduct').textContent = sale.productName;
        document.getElementById('saleDetailCustomer').textContent = sale.customer;
        document.getElementById('saleDetailTotal').textContent = formatCurrency(sale.total);
        document.getElementById('saleDetailEmail').textContent = sale.customerEmail || 'correo@nicagrow.com';
        document.getElementById('saleDetailPhone').textContent = sale.customerPhone || '+505 9999 0000';
        document.getElementById('saleDetailQuantity').textContent = sale.quantity || 1;
        document.getElementById('saleDetailPayment').textContent = sale.paymentMethod || 'Pago contra entrega';
        document.getElementById('saleDetailShipping').textContent = sale.shipping || 'Cargotrans';
        document.getElementById('saleDetailAddress').textContent = sale.address || 'Nicaragua';
        saleStatusSelect.value = getStatusLabel(sale.status);
        setSaleMessage('', 'success');
        saleModal.classList.add('active');
    }

    // cierra el modal de detalle de venta
    function closeSaleModal() {
        saleModal.classList.remove('active');
        activeSaleId = null;
    }

    // guarda el estado que controla el vendedor
    function saveSaleStatus() {
        const purchases = getStoredItems(purchasesKey);
        const sales = getStoredItems(salesKey);
        let updated = false;

        for (let i = 0; i < purchases.length; i++) {
            if (String(purchases[i].id) === String(activeSaleId)) {
                purchases[i].status = saleStatusSelect.value;
                updated = true;
            }
        }

        if (!updated) {
            for (let i = 0; i < sales.length; i++) {
                if (String(sales[i].id) === String(activeSaleId)) {
                    sales[i].status = saleStatusSelect.value;
                    updated = true;
                }
            }
        }

        if (!updated) {
            setSaleMessage('No se encontro la venta.', 'error');
            return;
        }

        saveStoredItems(purchasesKey, purchases);
        saveStoredItems(salesKey, sales);
        renderDashboard();
        openSaleModal(activeSaleId);
        setSaleMessage('Estado actualizado correctamente.', 'success');
    }

    function fillProfileForm() {
        document.getElementById('profileFirstName').value = currentUser.firstName || '';
        document.getElementById('profileLastName').value = currentUser.lastName || '';
        document.getElementById('profileBusinessInput').value = currentUser.businessName || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profileBirthDate').value = currentUser.birthDate || '';
        document.getElementById('profilePhone').value = currentUser.phone || '';
        document.getElementById('profileCity').value = currentUser.city || '';

        profileDisplayName.textContent = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
        profileBusinessName.textContent = currentUser.businessName || 'Nombre del negocio';
    }

    function openProfileModal() {
        fillProfileForm();
        setProfileMessage('', 'success');
        profileModal.classList.add('active');
    }

    function closeProfileModal() {
        profileModal.classList.remove('active');
    }

    function emailBelongsToOtherUser(users, email) {
        for (let i = 0; i < users.length; i++) {
            const sameEmail = String(users[i].email).toLowerCase() === email;
            const otherUser = users[i].id !== currentUser.id;

            if (sameEmail && otherUser) {
                return true;
            }
        }

        return false;
    }

    function saveProfileChanges() {
        const firstName = document.getElementById('profileFirstName').value.trim();
        const lastName = document.getElementById('profileLastName').value.trim();
        const businessName = document.getElementById('profileBusinessInput').value.trim();
        const email = document.getElementById('profileEmail').value.trim().toLowerCase();
        const birthDate = document.getElementById('profileBirthDate').value;
        const phone = document.getElementById('profilePhone').value.trim();
        const city = document.getElementById('profileCity').value.trim();

        if (!firstName || !lastName || !email || !birthDate || !phone || !city) {
            setProfileMessage('Completa todos los datos del perfil.', 'error');
            return;
        }

        const users = getStoredItems(usersKey);

        if (emailBelongsToOtherUser(users, email)) {
            setProfileMessage('Ese correo ya pertenece a otra cuenta.', 'error');
            return;
        }

        for (let i = 0; i < users.length; i++) {
            if (users[i].id === currentUser.id) {
                users[i].firstName = firstName;
                users[i].lastName = lastName;
                users[i].businessName = businessName;
                users[i].email = email;
                users[i].birthDate = birthDate;
                users[i].phone = phone;
                users[i].city = city;
            }
        }

        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.businessName = businessName;
        currentUser.email = email;
        currentUser.birthDate = birthDate;
        currentUser.phone = phone;
        currentUser.city = city;

        saveStoredItems(usersKey, users);
        saveSession(currentUser);
        sellerSessionName.textContent = currentUser.firstName + ' ' + currentUser.lastName;
        profileDisplayName.textContent = currentUser.firstName + ' ' + currentUser.lastName;
        profileBusinessName.textContent = currentUser.businessName || 'Nombre del negocio';
        setProfileMessage('Perfil actualizado correctamente.', 'success');
    }

    function resetProductForm() {
        editingProductId = null;
        productForm.reset();
        productFormTitle.textContent = 'Publicar producto';
        productSubmitBtn.textContent = 'Publicar';
        cancelEditBtn.classList.remove('active');
    }

    function findProductById(productId) {
        const products = getStoredItems(productsKey);

        for (let i = 0; i < products.length; i++) {
            if (String(products[i].id) === String(productId)) {
                return products[i];
            }
        }

        return null;
    }

    function startEditProduct(productId) {
        const product = findProductById(productId);

        if (!product) {
            setProductMessage('No se encontro el producto.', 'error');
            return;
        }

        editingProductId = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || '';

        if (product.isLocalSample) {
            document.getElementById('productImage').value = '';
        } else {
            document.getElementById('productImage').value = product.image || '';
        }

        productFormTitle.textContent = 'Editar producto';
        productSubmitBtn.textContent = 'Guardar cambios';
        cancelEditBtn.classList.add('active');
        setDashboardView('products');
        setProductMessage('Editando producto: ' + product.name, 'success');
    }

    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener('click', function () {
            setDashboardView(this.dataset.dashboardView);
        });
    }

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('seller-edit-product-btn')) {
            startEditProduct(event.target.dataset.productId);
        }

        if (event.target.classList.contains('seller-sale-detail-btn')) {
            openSaleModal(event.target.dataset.saleId);
        }
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function () {
            resetProductForm();
            setProductMessage('', 'success');
        });
    }

    if (profileButton) {
        profileButton.addEventListener('click', function () {
            openProfileModal();
        });
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', function () {
            closeProfileModal();
        });
    }

    if (profileModal) {
        profileModal.addEventListener('click', function (event) {
            if (event.target === profileModal) {
                closeProfileModal();
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', function (event) {
            event.preventDefault();
            saveProfileChanges();
        });
    }

    if (closeSaleModalBtn) {
        closeSaleModalBtn.addEventListener('click', function () {
            closeSaleModal();
        });
    }

    if (saleModal) {
        saleModal.addEventListener('click', function (event) {
            if (event.target === saleModal) {
                closeSaleModal();
            }
        });
    }

    if (saveSaleStatusBtn) {
        saveSaleStatusBtn.addEventListener('click', function () {
            saveSaleStatus();
        });
    }

    // guarda un producto nuevo y vuelve a pintar el panel
    if (productForm) {
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const productName = document.getElementById('productName').value.trim();
            const productDescription = document.getElementById('productDescription').value.trim();
            const productCategory = document.getElementById('productCategory').value;
            const productPrice = document.getElementById('productPrice').value;
            const productStock = document.getElementById('productStock').value;
            const productImage = document.getElementById('productImage').value;

            if (!productName || !productDescription || !productCategory || !productPrice || !productStock) {
                setProductMessage('Completa los datos del producto.', 'error');
                return;
            }

            const products = getStoredItems(productsKey);
            let edited = false;

            if (editingProductId) {
                for (let i = 0; i < products.length; i++) {
                    if (String(products[i].id) === String(editingProductId)) {
                        products[i].name = productName;
                        products[i].description = productDescription;
                        products[i].category = productCategory;
                        products[i].price = Number(productPrice);
                        products[i].stock = Number(productStock);

                        if (!products[i].isLocalSample) {
                            products[i].image = getExternalImage(productImage);
                        }

                        edited = true;
                    }
                }
            } else {
                products.push({
                    id: Date.now(),
                    sellerId: currentUser.id,
                    name: productName,
                    description: productDescription,
                    category: productCategory,
                    price: Number(productPrice),
                    stock: Number(productStock),
                    image: getExternalImage(productImage)
                });
            }

            if (editingProductId && !edited) {
                setProductMessage('No se pudo actualizar el producto.', 'error');
                return;
            }

            saveStoredItems(productsKey, products);

            if (edited) {
                setProductMessage('Producto actualizado correctamente.', 'success');
            } else {
                setProductMessage('Producto publicado correctamente.', 'success');
            }

            resetProductForm();
            renderDashboard();
        });
    }

    // cierra la sesion y obliga a escoger tipo de cuenta otra vez
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            localStorage.removeItem(sessionKey);
            window.location.href = 'account-type.html';
        });
    }

    renderDashboard();
}

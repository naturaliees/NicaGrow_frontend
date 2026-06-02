const SESSION_KEY = 'nicagrowCurrentUser';
const PRODUCTS_KEY = 'nicagrowSellerProducts';
const SALES_KEY = 'nicagrowSellerSales';

// toma la sesion que se guardo al iniciar o crear cuenta
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
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
    const products = getStoredItems(PRODUCTS_KEY);
    const sellerProducts = getSellerItems(products, sellerId);
    const sampleProducts = getSampleProducts(sellerId);

    if (sellerProducts.length === 0) {
        for (let i = 0; i < sampleProducts.length; i++) {
            products.push(sampleProducts[i]);
        }

        saveStoredItems(PRODUCTS_KEY, products);
    } else {
        for (let i = 0; i < products.length; i++) {
            for (let j = 0; j < sampleProducts.length; j++) {
                const isSameSeller = products[i].sellerId === sellerId;
                const isSameProduct = products[i].name === sampleProducts[j].name;

                if (isSameSeller && isSameProduct && !products[i].image) {
                    products[i].image = sampleProducts[j].image;
                    products[i].isLocalSample = true;
                }
            }
        }

        saveStoredItems(PRODUCTS_KEY, products);
    }

    const sales = getStoredItems(SALES_KEY);
    const sellerSales = getSellerItems(sales, sellerId);
    const sampleSales = getSampleSales(sellerId);

    if (sellerSales.length === 0) {
        for (let i = 0; i < sampleSales.length; i++) {
            sales.push(sampleSales[i]);
        }

        saveStoredItems(SALES_KEY, sales);
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

    if (sellerSessionName) {
        sellerSessionName.textContent = currentUser.firstName + ' ' + currentUser.lastName;
    }

    function getSellerProducts() {
        const allProducts = getStoredItems(PRODUCTS_KEY);
        return getSellerItems(allProducts, currentUser.id);
    }

    function getSellerSales() {
        const allSales = getStoredItems(SALES_KEY);
        return getSellerItems(allSales, currentUser.id);
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

    // arma una tarjeta de producto reutilizable para las vistas
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
        html += '<p class="card-text">' + escapeHtml(product.description) + '</p>';
        html += '<p class="text-price">' + formatCurrency(product.price) + '</p>';
        html += '<span class="seller-stock">Stock: ' + escapeHtml(product.stock) + '</span>';
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
            let badgeClass = 'bg-warning text-dark';

            if (sales[i].status === 'Entregado') {
                badgeClass = 'bg-success';
            }

            html += '<tr>';
            html += '<td>' + escapeHtml(sales[i].productName) + '</td>';
            html += '<td>' + escapeHtml(sales[i].customer) + '</td>';
            html += '<td>' + escapeHtml(sales[i].date) + '</td>';
            html += '<td><span class="badge ' + badgeClass + '">' + escapeHtml(sales[i].status) + '</span></td>';
            html += '<td>' + formatCurrency(sales[i].total) + '</td>';
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

    // dibuja barras simples para comparar ventas 
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

            if (sales[i].status === 'Entregado') {
                delivered++;
            }

            if (sales[i].status === 'Pendiente') {
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

    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener('click', function () {
            setDashboardView(this.dataset.dashboardView);
        });
    }

    // guarda un producto nuevo y vuelve a pintar el panel
    if (productForm) {
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const productName = document.getElementById('productName').value.trim();
            const productDescription = document.getElementById('productDescription').value.trim();
            const productPrice = document.getElementById('productPrice').value;
            const productStock = document.getElementById('productStock').value;
            const productImage = document.getElementById('productImage').value;

            if (!productName || !productDescription || !productPrice || !productStock) {
                setProductMessage('Completa los datos del producto.', 'error');
                return;
            }

            const products = getStoredItems(PRODUCTS_KEY);

            products.push({
                id: Date.now(),
                sellerId: currentUser.id,
                name: productName,
                description: productDescription,
                price: Number(productPrice),
                stock: Number(productStock),
                image: getExternalImage(productImage)
            });

            saveStoredItems(PRODUCTS_KEY, products);
            productForm.reset();
            setProductMessage('Producto publicado correctamente.', 'success');
            renderDashboard();
        });
    }

    // cierra la sesion y obliga a escoger tipo de cuenta otra vez
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'account-type.html';
        });
    }

    renderDashboard();
}

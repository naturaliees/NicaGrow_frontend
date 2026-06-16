const sessionKey = 'nicagrowCurrentUser';
const buyerInvoicesKey = 'nicagrowBuyerInvoices';

// sesion actual del comprador
function getCurrentUser() {
    return NicaGrowApi.getSession();
}

function saveSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
}

// formato seguro para textos y precios
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

// obtiene el id aunque la api lo regrese con otro nombre
function getApiId(item) {
    if (!item) {
        return '';
    }

    if (item.Id || item.id || item.IdPedido || item.idPedido) {
        return item.Id || item.id || item.IdPedido || item.idPedido;
    }

    if (item.pedido) {
        return item.pedido.Id || item.pedido.id || item.pedido.IdPedido || item.pedido.idPedido;
    }

    if (item.data) {
        return item.data.Id || item.data.id || item.data.IdPedido || item.data.idPedido;
    }

    return '';
}

// guarda facturas locales para mostrar exactamente lo comprado
function getSavedBuyerInvoices() {
    try {
        return JSON.parse(localStorage.getItem(buyerInvoicesKey)) || [];
    } catch {
        return [];
    }
}

function saveBuyerInvoices(invoices) {
    localStorage.setItem(buyerInvoicesKey, JSON.stringify(invoices));
}

// muestra una confirmacion breve sin abrir la factura automaticamente
function showBuyerNotice(message) {
    const oldNotice = document.querySelector('.buyer-toast');

    if (oldNotice) {
        oldNotice.remove();
    }

    const notice = document.createElement('div');
    notice.className = 'buyer-toast';
    notice.textContent = message;
    document.body.appendChild(notice);

    setTimeout(function () {
        notice.classList.add('show');
    }, 10);

    setTimeout(function () {
        notice.classList.remove('show');

        setTimeout(function () {
            notice.remove();
        }, 250);
    }, 2600);
}

function saveCheckoutInvoices(pedidoId, items, paymentMethod, shippingMethod, address) {
    const invoices = getSavedBuyerInvoices();

    for (let i = 0; i < items.length; i++) {
        invoices.push({
            localInvoice: true,
            IdPedido: pedidoId,
            IdProducto: items[i].product.Id,
            IdVendedor: items[i].product.IdVendedor,
            ClienteId: currentUser.id,
            Cliente: (currentUser.firstName + ' ' + currentUser.lastName).trim(),
            NombreProducto: items[i].product.NombreProducto,
            PrecioUnitario: Number(items[i].product.Precio || 0),
            Cantidad: items[i].quantity,
            Subtotal: Number(items[i].product.Precio || 0) * items[i].quantity,
            MetodoPago: paymentMethod,
            MetodoEnvio: shippingMethod,
            Direccion: address,
            Estado: 'pendiente',
            FotoBase64: items[i].product.FotoBase64,
            ImagenBase64: items[i].product.ImagenBase64,
            Foto: items[i].product.Foto,
            Imagen: items[i].product.Imagen,
            ImagenUrl: items[i].product.ImagenUrl,
            FotoProducto: items[i].product.FotoProducto
        });
    }

    saveBuyerInvoices(invoices);
}

// convierte rutas relativas de django en urls completas para el navegador
function normalizeImageSource(value) {
    const image = String(value || '').trim();

    if (!image) {
        return '';
    }

    if (image.indexOf('data:image') === 0 || image.indexOf('http') === 0 || image.indexOf('blob:') === 0) {
        return image;
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

// obtiene la imagen del producto, venga como url o base64
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

const currentUser = getCurrentUser();

// protege el dashboard para que solo entren compradores
if (!currentUser || currentUser.role !== 'buyer') {
    window.location.href = 'account-type.html';
} else {
    // referencias principales de la interfaz del comprador
    const buyerProductsGrid = document.getElementById('buyerProductsGrid');
    const buyerPurchasesGrid = document.getElementById('buyerPurchasesGrid');
    const buyerSearchInput = document.getElementById('buyerSearchInput');
    const buyerCategoryFilter = document.getElementById('buyerCategoryFilter');
    const buyerLogoutBtn = document.getElementById('buyerLogoutBtn');
    const buyerProfileBtn = document.getElementById('buyerProfileBtn');
    const buyerNavButtons = document.querySelectorAll('[data-buyer-view]');
    const buyerViews = document.querySelectorAll('.buyer-view');

    const purchaseModal = document.getElementById('purchaseModal');
    const closePurchaseModal = document.getElementById('closePurchaseModal');
    const cartButton = document.getElementById('cartButton');
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const checkoutPayment = document.getElementById('checkoutPayment');
    const checkoutShipping = document.getElementById('checkoutShipping');
    const checkoutAddress = document.getElementById('checkoutAddress');
    const checkoutMessage = document.getElementById('checkoutMessage');
    const sellerModal = document.getElementById('sellerModal');
    const closeSellerModal = document.getElementById('closeSellerModal');
    const buyerProfileModal = document.getElementById('buyerProfileModal');
    const closeBuyerProfileBtn = document.getElementById('closeBuyerProfileBtn');
    const buyerProfileForm = document.getElementById('buyerProfileForm');
    const buyerProfileMessage = document.getElementById('buyerProfileMessage');

    let productsCache = [];
    let sellersCache = [];
    let categoriesCache = [];
    let purchasesCache = [];
    let cartCache = [];
    let productsLoadError = '';

    // cambia entre inicio y compras realizadas
    function setBuyerView(viewName) {
        for (let i = 0; i < buyerNavButtons.length; i++) {
            buyerNavButtons[i].classList.toggle('active', buyerNavButtons[i].dataset.buyerView === viewName);
        }

        for (let i = 0; i < buyerViews.length; i++) {
            buyerViews[i].classList.toggle('active', buyerViews[i].id === 'buyer' + viewName.charAt(0).toUpperCase() + viewName.slice(1) + 'View');
        }
    }

    // busca vendedores y categorias dentro de los datos cargados
    function getSellerById(id) {
        return sellersCache.find(function (seller) {
            return String(seller.Id) === String(id);
        });
    }

    function categoryName(id) {
        const category = categoriesCache.find(function (item) {
            return String(item.Id) === String(id);
        });

        return category ? category.Categoria : '';
    }

    // rellena el filtro de categorias
    function renderCategoryFilter() {
        let html = '<option value="">Todas las categorias</option>';

        for (let i = 0; i < categoriesCache.length; i++) {
            html += '<option value="' + escapeHtml(categoriesCache[i].Id) + '">' + escapeHtml(categoriesCache[i].Categoria) + '</option>';
        }

        buyerCategoryFilter.innerHTML = html;
    }

    // encuentra un producto por su id
    function getProductById(productId) {
        return productsCache.find(function (product) {
            return String(product.Id) === String(productId);
        });
    }

    // intenta encontrar el vendedor de una compra aunque el reporte no traiga id
    function getPurchaseSellerId(purchase) {
        if (purchase.IdVendedor) {
            return purchase.IdVendedor;
        }

        const product = productsCache.find(function (item) {
            return String(item.Id) === String(purchase.IdProducto) ||
                String(item.NombreProducto).toLowerCase() === String(purchase.NombreProducto).toLowerCase();
        });

        return product ? product.IdVendedor : '';
    }

    // arma una tarjeta para productos o compras
    function buildProductCard(product, isPurchase) {
        const id = product.Id || product.IdProducto || product.purchaseIndex;
        const name = product.NombreProducto || product.productName;
        const price = product.Precio || product.PrecioUnitario || product.price || 0;
        const sellerId = product.IdVendedor;
        const image = getProductImage(product);
        let productMedia = '<div class="seller-product-placeholder buyer-product-placeholder">sin foto</div>';
        let html = '';

        if (image) {
            productMedia = '<img src="' + escapeHtml(image) + '" class="card-img-top" alt="' + escapeHtml(name) + '">';
        }

        html += '<div class="col-12 col-md-6 col-xl-4">';
        html += '<article class="card buyer-product-card h-100">';
        html += productMedia;
        html += '<div class="card-body buyer-product-info d-flex flex-column">';
        html += '<h2 class="card-title">' + escapeHtml(name) + '</h2>';
        html += '<p class="card-text">' + escapeHtml(categoryName(product.IdCategoria)) + '</p>';
        html += '<strong class="mt-auto">' + formatCurrency(price) + '</strong>';
        html += '<div class="buyer-card-actions">';

        if (isPurchase) {
            html += '<button type="button" class="btn" data-view-purchase="' + escapeHtml(product.purchaseIndex) + '">Ver compra</button>';
        } else {
            html += '<div class="buyer-quantity-control">';
            html += '<label for="qty-' + escapeHtml(id) + '">Cantidad</label>';
            html += '<input id="qty-' + escapeHtml(id) + '" type="number" min="1" max="' + escapeHtml(product.Stock || 99) + '" value="1" data-quantity-product="' + escapeHtml(id) + '">';
            html += '</div>';
            html += '<button type="button" class="btn" data-buy-product="' + escapeHtml(id) + '">Agregar al carrito</button>';
        }

        if (sellerId) {
            html += '<button type="button" class="btn" data-view-seller="' + escapeHtml(sellerId) + '">Ver vendedor</button>';
        }
        html += '</div>';
        html += '</div>';
        html += '</article>';
        html += '</div>';
        return html;
    }

    // muestra productos filtrados por nombre y categoria
    function renderProducts() {
        const search = buyerSearchInput.value.trim().toLowerCase();
        const categoryFilter = buyerCategoryFilter.value;
        let html = '';

        for (let i = 0; i < productsCache.length; i++) {
            const name = String(productsCache[i].NombreProducto).toLowerCase();
            const sameCategory = !categoryFilter || String(productsCache[i].IdCategoria) === String(categoryFilter);

            if (sameCategory && (!search || name.indexOf(search) >= 0)) {
                html += buildProductCard(productsCache[i], false);
            }
        }

        buyerProductsGrid.innerHTML = html || '<div class="col-12"><p class="buyer-empty">' + escapeHtml(productsLoadError || 'No hay productos publicados.') + '</p></div>';
    }

    // lee solo los productos del carrito del cliente actual desde la tabla Carrito
    function getBuyerCart() {
        const buyerCartItems = [];

        for (let i = 0; i < cartCache.length; i++) {
            const product = getProductById(cartCache[i].IdProducto) || {};

            buyerCartItems.push({
                cartId: cartCache[i].Id,
                buyerId: currentUser.id,
                product: {
                    ...product,
                    Id: cartCache[i].IdProducto,
                    IdVendedor: cartCache[i].IdVendedor || product.IdVendedor,
                    NombreProducto: cartCache[i].NombreProducto || product.NombreProducto,
                    Precio: cartCache[i].Precio || product.Precio,
                    FotoBase64: cartCache[i].FotoBase64 || product.FotoBase64,
                    ImagenBase64: cartCache[i].ImagenBase64 || product.ImagenBase64,
                    Foto: cartCache[i].Foto || product.Foto,
                    Imagen: cartCache[i].Imagen || product.Imagen,
                    ImagenUrl: cartCache[i].ImagenUrl || product.ImagenUrl,
                    FotoProducto: cartCache[i].FotoProducto || product.FotoProducto
                },
                quantity: cartCache[i].Cantidad
            });
        }

        return buyerCartItems;
    }

    async function loadCart() {
        cartCache = await NicaGrowApi.list('/carrito/?cliente=' + currentUser.id);
    }

    // mensajes del carrito y del perfil
    function setCheckoutMessage(message, type) {
        checkoutMessage.textContent = message;
        checkoutMessage.classList.toggle('error', type === 'error');
    }

    function setBuyerProfileMessage(message, type) {
        buyerProfileMessage.textContent = message;
        buyerProfileMessage.classList.toggle('error', type === 'error');
    }

    // rellena la direccion del checkout con el perfil si existe
    function fillCheckoutForm() {
        checkoutPayment.value = '';
        checkoutShipping.value = '';
        checkoutAddress.value = currentUser.address || '';
        setCheckoutMessage('', 'success');
    }

    // pinta los productos agregados al carrito
    function renderCart() {
        const buyerCartItems = getBuyerCart();
        let html = '';
        let total = 0;

        for (let i = 0; i < buyerCartItems.length; i++) {
            const cartImage = getProductImage(buyerCartItems[i].product);
            let cartMedia = '<div class="seller-product-placeholder buyer-cart-placeholder">sin foto</div>';

            if (cartImage) {
                cartMedia = '<img src="' + escapeHtml(cartImage) + '" alt="' + escapeHtml(buyerCartItems[i].product.NombreProducto) + '">';
            }

            total += Number(buyerCartItems[i].product.Precio || 0) * buyerCartItems[i].quantity;
            html += '<div class="buyer-cart-item">';
            html += cartMedia;
            html += '<div>';
            html += '<h3>' + escapeHtml(buyerCartItems[i].product.NombreProducto) + '</h3>';
            html += '<p>Cantidad: ' + buyerCartItems[i].quantity + '</p>';
            html += '<strong>' + formatCurrency(buyerCartItems[i].product.Precio) + '</strong>';
            html += '</div>';
            html += '<button type="button" data-remove-cart="' + escapeHtml(buyerCartItems[i].cartId) + '">Quitar</button>';
            html += '</div>';
        }

        cartItems.innerHTML = html || '<p class="buyer-empty-cart">Tu carrito esta vacio.</p>';
        cartTotal.textContent = formatCurrency(total);
        cartCount.textContent = buyerCartItems.length;
    }

    // agrega el producto al carrito sin abrir el modal
    async function buyProduct(productId) {
        const product = getProductById(productId);

        if (!product) {
            return;
        }

        const quantityInput = document.querySelector('[data-quantity-product="' + productId + '"]');
        let quantity = Number(quantityInput ? quantityInput.value : 1);

        if (!quantity || quantity < 1) {
            quantity = 1;
        }

        const existing = cartCache.find(function (item) {
            return String(item.IdProducto) === String(productId);
        });

        try {
            if (existing) {
                await NicaGrowApi.patch('/carrito/' + existing.Id + '/', {
                    IdProducto: product.Id,
                    IdCliente: currentUser.id,
                    Cantidad: Number(existing.Cantidad) + quantity
                });
            } else {
                await NicaGrowApi.post('/carrito/', {
                    IdProducto: product.Id,
                    IdCliente: currentUser.id,
                    Cantidad: quantity
                });
            }

            await loadCart();
            renderCart();
        } catch (error) {
            setCheckoutMessage(error.message || 'No se pudo agregar al carrito.', 'error');
            cartModal.classList.add('active');
        }
    }

    // quita un producto del carrito
    async function removeCartItem(cartId) {
        try {
            await NicaGrowApi.remove('/carrito/' + cartId + '/');
            await loadCart();
            renderCart();
        } catch (error) {
            setCheckoutMessage(error.message || 'No se pudo quitar el producto.', 'error');
        }
    }

    async function clearCart() {
        try {
            await NicaGrowApi.remove('/carrito/limpiar/?cliente=' + currentUser.id);
            cartCache = [];
        } catch {
            const currentCartItems = getBuyerCart();

            for (let i = 0; i < currentCartItems.length; i++) {
                await NicaGrowApi.remove('/carrito/' + currentCartItems[i].cartId + '/');
            }

            cartCache = [];
        }
    }

    // confirma la compra con pago, envio y direccion
    async function checkoutCart() {
        const buyerCartItems = getBuyerCart();
        const paymentMethod = checkoutPayment.value;
        const shippingMethod = checkoutShipping.value;
        const address = checkoutAddress.value.trim();

        if (buyerCartItems.length === 0) {
            return;
        }

        if (!paymentMethod || !shippingMethod || !address) {
            setCheckoutMessage('Selecciona pago, envio y direccion para continuar.', 'error');
            return;
        }

        try {
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Procesando...';

            const metodoPago = await NicaGrowApi.getMetodoPago(paymentMethod);
            const metodoEnvio = await NicaGrowApi.getMetodoEnvio(shippingMethod);
            const estado = await NicaGrowApi.getEstado('pendiente');

            const pedido = await NicaGrowApi.post('/pedidos/crear_con_procedimiento/', {
                IdCliente: currentUser.id,
                IdMetodoPago: metodoPago.Id,
                IdMetodoEnvio: metodoEnvio.Id,
                IdEstado: estado.Id,
                Direccion: address
            });
            const pedidoId = getApiId(pedido);

            if (!pedidoId) {
                throw new Error('La API creo el pedido, pero no regreso el id del pedido.');
            }

            for (let i = 0; i < buyerCartItems.length; i++) {
                await NicaGrowApi.post('/pedidos/' + pedidoId + '/agregar_producto/', {
                    IdProducto: buyerCartItems[i].product.Id,
                    Cantidad: buyerCartItems[i].quantity
                });
            }

            saveCheckoutInvoices(pedidoId, buyerCartItems, paymentMethod, shippingMethod, address);
            currentUser.address = address;
            saveSession(currentUser);
            await clearCart();
            await loadPurchases();
            renderCart();
            renderPurchases();
            setBuyerView('purchases');
            fillCheckoutForm();
            cartModal.classList.remove('active');
            showBuyerNotice('Compra realizada con éxito.');
        } catch (error) {
            setCheckoutMessage(error.message || 'No se pudo finalizar la compra.', 'error');
        } finally {
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Finalizar compra';
        }
    }

    // carga el historial de compras del cliente
    async function loadPurchases() {
        const currentName = (currentUser.firstName + ' ' + currentUser.lastName).trim().toLowerCase();
        const savedInvoices = getSavedBuyerInvoices().filter(function (purchase) {
            return String(purchase.ClienteId) === String(currentUser.id);
        });
        const reports = await NicaGrowApi.list('/reportes/detalle-pedidos/');
        const apiPurchases = reports.filter(function (purchase) {
            return String(purchase.Cliente).toLowerCase() === currentName;
        });
        const savedKeys = savedInvoices.map(function (purchase) {
            return String(purchase.IdPedido) + '-' + String(purchase.IdProducto || purchase.NombreProducto);
        });
        const missingApiPurchases = apiPurchases.filter(function (purchase) {
            const key = String(purchase.IdPedido) + '-' + String(purchase.IdProducto || purchase.NombreProducto);
            return savedKeys.indexOf(key) === -1;
        });

        purchasesCache = savedInvoices.concat(missingApiPurchases);
    }

    // muestra las compras realizadas como tarjetas
    function renderPurchases() {
        let html = '';

        for (let i = 0; i < purchasesCache.length; i++) {
            html += buildProductCard({
                ...purchasesCache[i],
                Id: purchasesCache[i].IdPedido,
                IdVendedor: getPurchaseSellerId(purchasesCache[i]),
                productName: purchasesCache[i].NombreProducto,
                price: purchasesCache[i].PrecioUnitario,
                purchaseIndex: i
            }, true);
        }

        buyerPurchasesGrid.innerHTML = html || '<div class="col-12"><p class="buyer-empty">Todavia no tenes compras realizadas.</p></div>';
    }

    // abre el modal con el detalle de una compra
    function openPurchaseDetail(index) {
        const purchase = purchasesCache[Number(index)];

        if (!purchase) {
            return;
        }

        document.getElementById('purchaseStatusLabel').textContent = purchase.Estado;
        const purchaseImage = document.getElementById('purchaseImage');
        const purchaseImageSource = getProductImage(purchase);
        const purchaseTop = purchaseImage.parentElement;

        if (purchaseImageSource) {
            purchaseImage.src = purchaseImageSource;
            purchaseImage.style.display = 'block';
            purchaseTop.classList.remove('no-image');
        } else {
            purchaseImage.src = '';
            purchaseImage.style.display = 'none';
            purchaseTop.classList.add('no-image');
        }

        document.getElementById('purchaseQty').textContent = purchase.Cantidad;
        document.getElementById('purchaseProductName').textContent = purchase.NombreProducto;
        document.getElementById('purchaseTotal').textContent = formatCurrency(purchase.Subtotal);
        document.getElementById('purchasePayment').textContent = purchase.MetodoPago;
        document.getElementById('purchaseAddress').textContent = purchase.Direccion || currentUser.address || 'Direccion registrada';
        document.getElementById('purchaseShipping').textContent = purchase.MetodoEnvio;
        document.getElementById('purchaseGrandTotal').textContent = formatCurrency(purchase.Subtotal);
        purchaseModal.classList.add('active');
    }

    // coloca los datos actuales en el perfil del cliente
    function fillBuyerProfile() {
        document.getElementById('buyerProfileFirstName').value = currentUser.firstName || '';
        document.getElementById('buyerProfileLastName').value = currentUser.lastName || '';
        document.getElementById('buyerProfileEmail').value = currentUser.email || '';
        document.getElementById('buyerProfilePhone').value = currentUser.phone || '';
        document.getElementById('buyerProfileCity').value = currentUser.city || currentUser.cityId || '';
        document.getElementById('buyerProfileAddress').value = currentUser.address || '';
        document.getElementById('buyerProfileName').textContent = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
        document.getElementById('buyerProfileEmailText').textContent = currentUser.email || 'correo@nicagrow.com';
    }

    // abre y cierra el perfil del cliente
    function openBuyerProfile() {
        fillBuyerProfile();
        setBuyerProfileMessage('', 'success');
        buyerProfileModal.classList.add('active');
    }

    function closeBuyerProfile() {
        buyerProfileModal.classList.remove('active');
    }

    // guarda informacion de contacto del cliente
    async function saveBuyerProfile() {
        const firstName = document.getElementById('buyerProfileFirstName').value.trim();
        const lastName = document.getElementById('buyerProfileLastName').value.trim();
        const email = document.getElementById('buyerProfileEmail').value.trim().toLowerCase();
        const phone = document.getElementById('buyerProfilePhone').value.trim();
        const cityName = document.getElementById('buyerProfileCity').value.trim();
        const address = document.getElementById('buyerProfileAddress').value.trim();

        if (!firstName || !lastName || !email || !phone || !cityName) {
            setBuyerProfileMessage('Completa los datos de contacto.', 'error');
            return;
        }

        try {
            const city = await NicaGrowApi.ensureCiudad(cityName);
            const updated = await NicaGrowApi.patch('/clientes/' + currentUser.id + '/', {
                Nombre: firstName,
                Apellidos: lastName,
                Correo: email,
                Telefono: phone,
                IdCiudad: city.Id,
                Direccion: address
            });

            currentUser.firstName = updated.Nombre;
            currentUser.lastName = updated.Apellidos;
            currentUser.email = updated.Correo;
            currentUser.phone = updated.Telefono;
            currentUser.cityId = updated.IdCiudad;
            currentUser.city = city.Ciudad;
            currentUser.address = address;
            saveSession(currentUser);
            fillBuyerProfile();
            fillCheckoutForm();
            setBuyerProfileMessage('Perfil actualizado correctamente.', 'success');
        } catch (error) {
            setBuyerProfileMessage(error.message || 'No se pudo actualizar el perfil.', 'error');
        }
    }

    // muestra el perfil del vendedor y sus productos
    function openSellerProfile(sellerId) {
        const sellerInfo = getSellerById(sellerId);
        let count = 0;
        let html = '';

        if (!sellerInfo) {
            return;
        }

        document.getElementById('sellerProfileName').textContent = sellerInfo.Nombre + ' ' + sellerInfo.Apellidos;
        document.getElementById('sellerProfileBusiness').textContent = sellerInfo.NombreNegocio;
        document.getElementById('sellerProfileEmail').textContent = sellerInfo.Correo;
        document.getElementById('sellerProfilePhone').textContent = sellerInfo.Telefono;
        document.getElementById('sellerProfileCity').textContent = sellerInfo.IdCiudad;

        for (let i = 0; i < productsCache.length; i++) {
            if (String(productsCache[i].IdVendedor) === String(sellerId)) {
                count++;
                html += buildProductCard(productsCache[i], false);
            }
        }

        document.getElementById('sellerProfileProductCount').textContent = count;
        document.getElementById('sellerProductsGrid').innerHTML = html || '<div class="col-12"><p class="buyer-empty">Este vendedor aun no tiene productos publicados.</p></div>';
        sellerModal.classList.add('active');
    }

    // trae datos iniciales sin romper toda la vista si algo falla
    async function loadInitialData() {
        try {
            productsCache = await NicaGrowApi.list('/productos/');
            productsLoadError = '';
        } catch (error) {
            productsCache = [];
            productsLoadError = error.message || 'No se pudieron cargar los productos.';
        }

        try {
            sellersCache = await NicaGrowApi.list('/vendedores/');
        } catch {
            sellersCache = [];
        }

        try {
            categoriesCache = await NicaGrowApi.list('/categorias/');
        } catch {
            categoriesCache = [];
        }

        renderCategoryFilter();

        try {
            await loadPurchases();
        } catch {
            purchasesCache = [];
        }

        try {
            await loadCart();
        } catch {
            cartCache = [];
        }

        renderProducts();
        renderPurchases();
        renderCart();
        fillCheckoutForm();
    }

    // navegacion interna del dashboard del cliente
    for (let i = 0; i < buyerNavButtons.length; i++) {
        buyerNavButtons[i].addEventListener('click', function () {
            setBuyerView(this.dataset.buyerView);
        });
    }

    buyerSearchInput.addEventListener('input', renderProducts);
    buyerCategoryFilter.addEventListener('change', renderProducts);

    // acciones delegadas para tarjetas, carrito y vendedores
    document.addEventListener('click', function (event) {
        if (event.target.dataset.buyProduct) {
            buyProduct(event.target.dataset.buyProduct);
        }

        if (event.target.dataset.viewPurchase) {
            openPurchaseDetail(event.target.dataset.viewPurchase);
        }

        if (event.target.dataset.viewSeller) {
            openSellerProfile(event.target.dataset.viewSeller);
        }

        if (event.target.dataset.removeCart) {
            removeCartItem(event.target.dataset.removeCart);
        }
    });

    closePurchaseModal.addEventListener('click', function () {
        purchaseModal.classList.remove('active');
    });

    closeSellerModal.addEventListener('click', function () {
        sellerModal.classList.remove('active');
    });

    cartButton.addEventListener('click', function () {
        renderCart();
        fillCheckoutForm();
        cartModal.classList.add('active');
    });

    closeCartModal.addEventListener('click', function () {
        cartModal.classList.remove('active');
    });

    // botones principales de modales y sesion
    checkoutButton.addEventListener('click', checkoutCart);
    buyerProfileBtn.addEventListener('click', openBuyerProfile);
    closeBuyerProfileBtn.addEventListener('click', closeBuyerProfile);

    buyerProfileModal.addEventListener('click', function (event) {
        if (event.target === buyerProfileModal) {
            closeBuyerProfile();
        }
    });

    buyerProfileForm.addEventListener('submit', function (event) {
        event.preventDefault();
        saveBuyerProfile();
    });

    buyerLogoutBtn.addEventListener('click', function () {
        NicaGrowApi.clearSession();
        window.location.href = 'account-type.html';
    });

    loadInitialData().catch(function (error) {
        buyerProductsGrid.innerHTML = '<div class="col-12"><p class="buyer-empty">' + escapeHtml(error.message || 'No se pudo cargar la tienda.') + '</p></div>';
    });
}
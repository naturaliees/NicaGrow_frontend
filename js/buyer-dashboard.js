const sessionKey = 'nicagrowCurrentUser';
const usersKey = 'nicagrowUsers';
const productsKey = 'nicagrowSellerProducts';
const purchasesKey = 'nicagrowBuyerPurchases';
const cartKey = 'nicagrowBuyerCart';

// toma la sesion actual del cliente
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey));
    } catch {
        return null;
    }
}

// lee listas guardadas y devuelve una lista vacia si algo falla
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

// guarda una lista completa en el navegador
function saveStoredItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
}

// muestra precios con el formato usado en la tienda
function formatCurrency(value) {
    return 'C$' + Number(value || 0).toLocaleString('es-NI');
}

// limpia texto para evitar que se rompa el html
function escapeHtml(value) {
    let text = String(value || '');
    text = text.split('&').join('&amp;');
    text = text.split('<').join('&lt;');
    text = text.split('>').join('&gt;');
    text = text.split('"').join('&quot;');
    text = text.split("'").join('&#039;');
    return text;
}

// usa la imagen del producto o una local si no tiene imagen
function getProductImage(product) {
    if (product.image) {
        return product.image;
    }

    return 'images/297226.jpg';
}

// agrega productos de ejemplo cuando todavia no hay productos publicados
function seedBuyerProducts() {
    const products = getStoredItems(productsKey);

    if (products.length > 0) {
        return;
    }

    products.push({
        id: Date.now(),
        sellerId: 'demo-seller',
        name: 'Hamaca',
        description: 'Hamaca tejida nicaraguense azul y blanco.',
        category: 'Textiles Nicaraguenses',
        price: 900,
        stock: 6,
        image: 'images/FONDO_HOMEALTERNATIVO.jpeg',
        isLocalSample: true
    });

    products.push({
        id: Date.now() + 1,
        sellerId: 'demo-seller',
        name: 'Olla de barro',
        description: 'Olla de barro pintada a mano.',
        category: 'Ceramica de Barro',
        price: 1000,
        stock: 4,
        image: 'images/297226.jpg',
        isLocalSample: true
    });

    products.push({
        id: Date.now() + 2,
        sellerId: 'demo-seller',
        name: 'Encurtidos',
        description: 'Encurtidos de cebolla y jalapeños.',
        category: 'Productos Ecologicos',
        price: 190,
        stock: 10,
        image: 'images/9e12520ad2012a0d5ca709c4197e8dff.jpg',
        isLocalSample: true
    });

    saveStoredItems(productsKey, products);
}

const currentUser = getCurrentUser();

// protege el dashboard para que solo entren compradores
if (!currentUser || currentUser.role !== 'buyer') {
    window.location.href = 'account-type.html';
} else {
    seedBuyerProducts();

    const buyerProductsGrid = document.getElementById('buyerProductsGrid');
    const buyerPurchasesGrid = document.getElementById('buyerPurchasesGrid');
    const buyerSearchInput = document.getElementById('buyerSearchInput');
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
    let activePurchaseId = null;

    // cambia entre inicio y compras sin salir del dashboard
    function setBuyerView(viewName) {
        for (let i = 0; i < buyerNavButtons.length; i++) {
            if (buyerNavButtons[i].dataset.buyerView === viewName) {
                buyerNavButtons[i].classList.add('active');
            } else {
                buyerNavButtons[i].classList.remove('active');
            }
        }

        for (let i = 0; i < buyerViews.length; i++) {
            if (buyerViews[i].id === 'buyer' + viewName.charAt(0).toUpperCase() + viewName.slice(1) + 'View') {
                buyerViews[i].classList.add('active');
            } else {
                buyerViews[i].classList.remove('active');
            }
        }
    }

    // busca un producto por su id
    function getProductById(productId) {
        const products = getStoredItems(productsKey);

        for (let i = 0; i < products.length; i++) {
            if (String(products[i].id) === String(productId)) {
                return products[i];
            }
        }

        return null;
    }

    // arma la tarjeta que se usa en productos y compras
    function buildProductCard(product, isPurchase) {
        let html = '';
        html += '<div class="col-12 col-md-6 col-xl-4">';
        html += '<article class="card buyer-product-card h-100">';
        html += '<img src="' + escapeHtml(getProductImage(product)) + '" class="card-img-top" alt="' + escapeHtml(product.name) + '">';
        html += '<div class="card-body buyer-product-info d-flex flex-column">';
        html += '<h2 class="card-title">' + escapeHtml(product.name) + '</h2>';
        html += '<p class="card-text">' + escapeHtml(product.description) + '</p>';
        html += '<strong class="mt-auto">' + formatCurrency(product.price) + '</strong>';
        html += '<div class="buyer-card-actions">';

        if (isPurchase) {
            html += '<button type="button" class="btn" data-view-purchase="' + escapeHtml(product.purchaseId) + '">Ver compra</button>';
        } else {
            html += '<button type="button" class="btn" data-buy-product="' + escapeHtml(product.id) + '">Agregar al carrito</button>';
        }

        html += '<button type="button" class="btn" data-view-seller="' + escapeHtml(product.sellerId) + '">Ver vendedor</button>';
        html += '</div>';
        html += '</div>';
        html += '</article>';
        html += '</div>';
        return html;
    }

    // muestra los productos publicados y aplica la busqueda
    function renderProducts() {
        const products = getStoredItems(productsKey);
        const search = buyerSearchInput.value.trim().toLowerCase();
        let html = '';

        for (let i = 0; i < products.length; i++) {
            const name = String(products[i].name).toLowerCase();
            const category = String(products[i].category || '').toLowerCase();

            if (!search || name.indexOf(search) >= 0 || category.indexOf(search) >= 0) {
                html += buildProductCard(products[i], false);
            }
        }

        buyerProductsGrid.innerHTML = html;
    }

    // obtiene solo las compras del cliente actual
    function getBuyerPurchases() {
        const purchases = getStoredItems(purchasesKey);
        const buyerPurchases = [];

        for (let i = 0; i < purchases.length; i++) {
            if (purchases[i].buyerId === currentUser.id) {
                buyerPurchases.push(purchases[i]);
            }
        }

        return buyerPurchases;
    }

    // pinta las compras realizadas por el cliente
    function renderPurchases() {
        const purchases = getBuyerPurchases();
        let html = '';

        for (let i = 0; i < purchases.length; i++) {
            const product = purchases[i].product;
            product.purchaseId = purchases[i].id;
            html += buildProductCard(product, true);
        }

        if (!html) {
            html = '<div class="col-12"><p class="buyer-empty">Todavia no tenes compras realizadas.</p></div>';
        }

        buyerPurchasesGrid.innerHTML = html;
    }

    // obtiene solo el carrito del cliente actual
    function getBuyerCart() {
        const allCartItems = getStoredItems(cartKey);
        const buyerCartItems = [];

        for (let i = 0; i < allCartItems.length; i++) {
            if (allCartItems[i].buyerId === currentUser.id) {
                buyerCartItems.push(allCartItems[i]);
            }
        }

        return buyerCartItems;
    }

    // guarda el carrito del cliente sin borrar carritos de otros usuarios
    function saveBuyerCart(buyerCartItems) {
        const allCartItems = getStoredItems(cartKey);
        const nextCartItems = [];

        for (let i = 0; i < allCartItems.length; i++) {
            if (allCartItems[i].buyerId !== currentUser.id) {
                nextCartItems.push(allCartItems[i]);
            }
        }

        for (let i = 0; i < buyerCartItems.length; i++) {
            nextCartItems.push(buyerCartItems[i]);
        }

        saveStoredItems(cartKey, nextCartItems);
    }

    function setCheckoutMessage(message, type) {
        checkoutMessage.textContent = message;

        if (type === 'error') {
            checkoutMessage.classList.add('error');
        } else {
            checkoutMessage.classList.remove('error');
        }
    }

    function setBuyerProfileMessage(message, type) {
        buyerProfileMessage.textContent = message;

        if (type === 'error') {
            buyerProfileMessage.classList.add('error');
        } else {
            buyerProfileMessage.classList.remove('error');
        }
    }

    // deja la direccion del perfil lista para comprar
    function fillCheckoutForm() {
        checkoutPayment.value = '';
        checkoutShipping.value = '';
        checkoutAddress.value = currentUser.address || '';
        setCheckoutMessage('', 'success');
    }

    // actualiza los productos, total y contador del carrito
    function renderCart() {
        const buyerCartItems = getBuyerCart();
        let html = '';
        let total = 0;

        for (let i = 0; i < buyerCartItems.length; i++) {
            total += Number(buyerCartItems[i].product.price || 0) * buyerCartItems[i].quantity;

            html += '<div class="buyer-cart-item">';
            html += '<img src="' + escapeHtml(getProductImage(buyerCartItems[i].product)) + '" alt="' + escapeHtml(buyerCartItems[i].product.name) + '">';
            html += '<div>';
            html += '<h3>' + escapeHtml(buyerCartItems[i].product.name) + '</h3>';
            html += '<p>Cantidad: ' + buyerCartItems[i].quantity + '</p>';
            html += '<strong>' + formatCurrency(buyerCartItems[i].product.price) + '</strong>';
            html += '</div>';
            html += '<button type="button" data-remove-cart="' + escapeHtml(buyerCartItems[i].product.id) + '">Quitar</button>';
            html += '</div>';
        }

        if (!html) {
            html = '<p class="buyer-empty-cart">Tu carrito esta vacio.</p>';
        }

        cartItems.innerHTML = html;
        cartTotal.textContent = formatCurrency(total);
        cartCount.textContent = buyerCartItems.length;
    }

    // agrega un producto al carrito y abre el panel
    function buyProduct(productId) {
        const product = getProductById(productId);

        if (!product) {
            return;
        }

        const buyerCartItems = getBuyerCart();
        let exists = false;

        for (let i = 0; i < buyerCartItems.length; i++) {
            if (String(buyerCartItems[i].product.id) === String(productId)) {
                buyerCartItems[i].quantity++;
                exists = true;
            }
        }

        if (!exists) {
            buyerCartItems.push({
                buyerId: currentUser.id,
                product: product,
                quantity: 1
            });
        }

        saveBuyerCart(buyerCartItems);
        renderCart();
        cartModal.classList.add('active');
    }

    // arma los datos de contacto del comprador para la venta
    function getBuyerContact() {
        return {
            name: (currentUser.firstName || '') + ' ' + (currentUser.lastName || ''),
            email: currentUser.email || 'correo@nicagrow.com',
            phone: currentUser.phone || '+505 9999 0000',
            city: currentUser.city || 'Nicaragua',
            address: currentUser.address || ''
        };
    }

    // crea una compra con datos simples de envio
    function createPurchase(product, quantity, paymentMethod, shippingMethod, address) {
        const purchases = getStoredItems(purchasesKey);
        const purchase = {
            id: Date.now(),
            buyerId: currentUser.id,
            buyer: getBuyerContact(),
            product: product,
            quantity: quantity,
            status: 'pendiente',
            paymentMethod: paymentMethod,
            address: address,
            shipping: shippingMethod,
            shippingCost: 20
        };

        purchases.push(purchase);
        saveStoredItems(purchasesKey, purchases);
        return purchase.id;
    }

    // convierte todo el carrito en compras realizadas
    function checkoutCart() {
        const buyerCartItems = getBuyerCart();
        const paymentMethod = checkoutPayment.value;
        const shippingMethod = checkoutShipping.value;
        const address = checkoutAddress.value.trim();
        let lastPurchaseId = null;

        if (buyerCartItems.length === 0) {
            return;
        }

        if (!paymentMethod || !shippingMethod || !address) {
            setCheckoutMessage('Selecciona pago, envio y direccion para continuar.', 'error');
            return;
        }

        for (let i = 0; i < buyerCartItems.length; i++) {
            lastPurchaseId = createPurchase(buyerCartItems[i].product, buyerCartItems[i].quantity, paymentMethod, shippingMethod, address);
        }

        saveBuyerCart([]);
        renderCart();
        renderPurchases();
        setBuyerView('purchases');
        cartModal.classList.remove('active');
        fillCheckoutForm();
        openPurchaseDetail(lastPurchaseId);
    }

    // quita un producto del carrito
    function removeCartItem(productId) {
        const buyerCartItems = getBuyerCart();
        const nextCartItems = [];

        for (let i = 0; i < buyerCartItems.length; i++) {
            if (String(buyerCartItems[i].product.id) !== String(productId)) {
                nextCartItems.push(buyerCartItems[i]);
            }
        }

        saveBuyerCart(nextCartItems);
        renderCart();
    }

    // busca una compra guardada por su id
    function findPurchase(purchaseId) {
        const purchases = getStoredItems(purchasesKey);

        for (let i = 0; i < purchases.length; i++) {
            if (String(purchases[i].id) === String(purchaseId)) {
                return purchases[i];
            }
        }

        return null;
    }

    // abre el detalle de una compra
    function openPurchaseDetail(purchaseId) {
        const purchase = findPurchase(purchaseId);

        if (!purchase) {
            return;
        }

        activePurchaseId = purchase.id;
        document.getElementById('purchaseStatusLabel').textContent = purchase.status;
        document.getElementById('purchaseImage').src = getProductImage(purchase.product);
        document.getElementById('purchaseQty').textContent = purchase.quantity;
        document.getElementById('purchaseProductName').textContent = purchase.product.name;
        document.getElementById('purchaseTotal').textContent = formatCurrency(Number(purchase.product.price) * purchase.quantity);
        document.getElementById('purchasePayment').textContent = purchase.paymentMethod || 'Pago contra entrega';
        document.getElementById('purchaseAddress').textContent = purchase.address;
        document.getElementById('purchaseShipping').textContent = purchase.shipping;
        document.getElementById('purchaseGrandTotal').textContent = formatCurrency((Number(purchase.product.price) * purchase.quantity) + purchase.shippingCost);
        purchaseModal.classList.add('active');
    }

    // llena el perfil del cliente con sus datos de contacto
    function fillBuyerProfile() {
        document.getElementById('buyerProfileFirstName').value = currentUser.firstName || '';
        document.getElementById('buyerProfileLastName').value = currentUser.lastName || '';
        document.getElementById('buyerProfileEmail').value = currentUser.email || '';
        document.getElementById('buyerProfilePhone').value = currentUser.phone || '';
        document.getElementById('buyerProfileCity').value = currentUser.city || '';
        document.getElementById('buyerProfileAddress').value = currentUser.address || '';

        document.getElementById('buyerProfileName').textContent = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
        document.getElementById('buyerProfileEmailText').textContent = currentUser.email || 'correo@nicagrow.com';
        document.getElementById('buyerProfilePurchases').textContent = getBuyerPurchases().length;
    }

    // abre el perfil del cliente
    function openBuyerProfile() {
        fillBuyerProfile();
        setBuyerProfileMessage('', 'success');
        buyerProfileModal.classList.add('active');
    }

    // cierra el perfil del cliente
    function closeBuyerProfile() {
        buyerProfileModal.classList.remove('active');
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

    // guarda los datos de contacto del cliente
    function saveBuyerProfile() {
        const firstName = document.getElementById('buyerProfileFirstName').value.trim();
        const lastName = document.getElementById('buyerProfileLastName').value.trim();
        const email = document.getElementById('buyerProfileEmail').value.trim().toLowerCase();
        const phone = document.getElementById('buyerProfilePhone').value.trim();
        const city = document.getElementById('buyerProfileCity').value.trim();
        const address = document.getElementById('buyerProfileAddress').value.trim();

        if (!firstName || !lastName || !email || !phone || !city) {
            setBuyerProfileMessage('Completa los datos de contacto.', 'error');
            return;
        }

        const users = getStoredItems(usersKey);

        if (emailBelongsToOtherUser(users, email)) {
            setBuyerProfileMessage('Ese correo ya pertenece a otra cuenta.', 'error');
            return;
        }

        for (let i = 0; i < users.length; i++) {
            if (users[i].id === currentUser.id) {
                users[i].firstName = firstName;
                users[i].lastName = lastName;
                users[i].email = email;
                users[i].phone = phone;
                users[i].city = city;
                users[i].address = address;
            }
        }

        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.email = email;
        currentUser.phone = phone;
        currentUser.city = city;
        currentUser.address = address;

        saveStoredItems(usersKey, users);
        localStorage.setItem(sessionKey, JSON.stringify(currentUser));
        fillBuyerProfile();
        fillCheckoutForm();
        setBuyerProfileMessage('Perfil actualizado correctamente.', 'success');
    }

    // obtiene la informacion publica del vendedor
    function getSellerInfo(sellerId) {
        const users = getStoredItems(usersKey);

        for (let i = 0; i < users.length; i++) {
            if (String(users[i].id) === String(sellerId)) {
                return {
                    name: users[i].firstName + ' ' + users[i].lastName,
                    businessName: users[i].businessName || 'Nombre del negocio',
                    email: users[i].email || 'correo@nicagrow.com',
                    phone: users[i].phone || '+505 9999 0000',
                    city: users[i].city || 'Nicaragua'
                };
            }
        }

        return {
            name: 'Buenos encurtidos',
            businessName: 'Buenos encurtidos',
            email: 'contacto@nicagrow.com',
            phone: '+505 9999 0000',
            city: 'Managua, Nicaragua'
        };
    }

    // abre el perfil del vendedor con sus productos publicados
    function openSellerProfile(sellerId) {
        const products = getStoredItems(productsKey);
        const sellerInfo = getSellerInfo(sellerId);
        let count = 0;
        let html = '';

        document.getElementById('sellerProfileName').textContent = sellerInfo.name;
        document.getElementById('sellerProfileBusiness').textContent = sellerInfo.businessName;
        document.getElementById('sellerProfileEmail').textContent = sellerInfo.email;
        document.getElementById('sellerProfilePhone').textContent = sellerInfo.phone;
        document.getElementById('sellerProfileCity').textContent = sellerInfo.city;

        for (let i = 0; i < products.length; i++) {
            if (String(products[i].sellerId) === String(sellerId)) {
                count++;
                html += buildProductCard(products[i], false);
            }
        }

        if (!html) {
            html = '<div class="col-12"><p class="buyer-empty">Este vendedor aun no tiene productos publicados.</p></div>';
        }

        document.getElementById('sellerProfileProductCount').textContent = count;
        document.getElementById('sellerProductsGrid').innerHTML = html;
        sellerModal.classList.add('active');
    }

    // conecta los botones de navegacion del cliente
    for (let i = 0; i < buyerNavButtons.length; i++) {
        buyerNavButtons[i].addEventListener('click', function () {
            setBuyerView(this.dataset.buyerView);
        });
    }

    // actualiza la tienda mientras el cliente escribe en el buscador
    buyerSearchInput.addEventListener('input', function () {
        renderProducts();
    });

    // escucha acciones de tarjetas, compras y carrito
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

    // cierra el modal de detalle de compra
    closePurchaseModal.addEventListener('click', function () {
        purchaseModal.classList.remove('active');
    });

    // cierra el modal del vendedor
    closeSellerModal.addEventListener('click', function () {
        sellerModal.classList.remove('active');
    });

    // abre el carrito con los datos actualizados
    cartButton.addEventListener('click', function () {
        renderCart();
        fillCheckoutForm();
        cartModal.classList.add('active');
    });

    // cierra el carrito
    closeCartModal.addEventListener('click', function () {
        cartModal.classList.remove('active');
    });

    // finaliza la compra del carrito
    checkoutButton.addEventListener('click', function () {
        checkoutCart();
    });

    buyerProfileBtn.addEventListener('click', function () {
        openBuyerProfile();
    });

    closeBuyerProfileBtn.addEventListener('click', function () {
        closeBuyerProfile();
    });

    buyerProfileModal.addEventListener('click', function (event) {
        if (event.target === buyerProfileModal) {
            closeBuyerProfile();
        }
    });

    buyerProfileForm.addEventListener('submit', function (event) {
        event.preventDefault();
        saveBuyerProfile();
    });

    // cierra la sesion del comprador
    buyerLogoutBtn.addEventListener('click', function () {
        localStorage.removeItem(sessionKey);
        window.location.href = 'account-type.html';
    });

    // carga inicial del dashboard
    renderProducts();
    renderPurchases();
    renderCart();
    fillCheckoutForm();
}

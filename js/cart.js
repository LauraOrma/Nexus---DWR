// Cart flyout logic
(function () {
  const CART_KEY = 'nexus_cart_v1';
  let cart = [];

  // Utilities
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  function save() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount();
  }

  function load() {
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      cart = [];
    }
    renderCartCount();
  }

  function formatPrice(n) {
    return '$' + Number(n).toFixed(2);
  }

  function renderCartCount() {
    const countEl = document.getElementById('cart-count');
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    if (countEl) countEl.textContent = totalQty;
  }

  function openCart() {
    let fly = document.getElementById('cart-flyout');
    if (!fly) return;
    fly.classList.add('open');
    fly.setAttribute('aria-hidden', 'false');
    renderCart();
  }

  function closeCart() {
    let fly = document.getElementById('cart-flyout');
    if (!fly) return;
    fly.classList.remove('open');
    fly.setAttribute('aria-hidden', 'true');
  }

  function findItemIndex(id) {
    return cart.findIndex(i => i.id === id);
  }

  function addToCart(product) {
    const id = product.id || slugify(product.title);
    const idx = findItemIndex(id);
    if (idx > -1) {
      cart[idx].qty += 1;
    } else {
      cart.push({ id, title: product.title, author: product.author, price: product.price, qty: 1 });
    }
    save();
  }

  function updateQty(id, qty) {
    const idx = findItemIndex(id);
    if (idx === -1) return;
    cart[idx].qty = qty;
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    save();
    renderCart();
  }

  function removeItem(id) {
    const idx = findItemIndex(id);
    if (idx === -1) return;
    cart.splice(idx, 1);
    save();
    renderCart();
  }

  function slugify(str) {
    return str.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const emptyMsg = document.getElementById('cart-empty');
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (subtotalEl) subtotalEl.textContent = formatPrice(0);
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      row.innerHTML = `
        <div class="cart-item__meta">
          <div class="cart-item__title">${escapeHtml(item.title)}</div>
          <div class="cart-item__author">${escapeHtml(item.author || '')}</div>
        </div>
        <div class="cart-item__controls">
          <div class="cart-item__price">${formatPrice(item.price)}</div>
          <div class="qty-controls">
            <button class="qty-decrease" data-id="${item.id}" aria-label="Disminuir">-</button>
            <span class="qty-number">${item.qty}</span>
            <button class="qty-increase" data-id="${item.id}" aria-label="Aumentar">+</button>
          </div>
          <button class="remove-item" data-id="${item.id}" aria-label="Eliminar">Eliminar</button>
        </div>
      `;

      container.appendChild(row);
    });

    // Attach listeners
    qsa('.qty-increase', container).forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        const idx = findItemIndex(id);
        if (idx > -1) {
          updateQty(id, cart[idx].qty + 1);
        }
      });
    });

    qsa('.qty-decrease', container).forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        const idx = findItemIndex(id);
        if (idx > -1) {
          updateQty(id, cart[idx].qty - 1);
        }
      });
    });

    qsa('.remove-item', container).forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        removeItem(id);
      });
    });

    // subtotal
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  // Wire add buttons
  function wireAddButtons() {
    const addBtns = document.querySelectorAll('.info__container-button');
    addBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const card = e.currentTarget.closest('.card__info');
        if (!card) return;
        const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Sin título';
        // author is first <p> inside card (but there may be multiple). We assume first <p> is author
        const pEls = card.querySelectorAll('p');
        const author = pEls.length ? pEls[0].textContent.trim() : '';
        // price is inside the .info__container p
        const priceNode = card.querySelector('.info__container p');
        let price = 0;
        if (priceNode) {
          price = parseFloat(priceNode.textContent.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }

        addToCart({ title, author, price });
        // Optionally open cart to show user
        openCart();
      });
    });
  }

  // Wire cart toggle
  function wireCartToggle() {
    const toggle = document.getElementById('cart-toggle');
    const fly = document.getElementById('cart-flyout');
    if (!toggle || !fly) return;
    toggle.addEventListener('click', e => {
      e.preventDefault();
      if (fly.classList.contains('open')) closeCart(); else openCart();
    });

    // Close when clicking the overlay or close button
    const closeBtn = fly.querySelector('.cart-flyout__close');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    fly.addEventListener('click', e => {
      if (e.target === fly) closeCart();
    });
  }

  // Initialize: insert flyout HTML into DOM if not present
  function ensureFlyoutMarkup() {
    if (document.getElementById('cart-flyout')) return;

    const fly = document.createElement('aside');
    fly.id = 'cart-flyout';
    fly.className = 'cart-flyout';
    fly.setAttribute('aria-hidden', 'true');
    fly.innerHTML = `
      <div class="cart-flyout__inner">
        <header class="cart-flyout__header">
          <h3>Tu carrito</h3>
          <button class="cart-flyout__close" aria-label="Cerrar">×</button>
        </header>
        <div id="cart-items" class="cart-flyout__items"></div>
        <div id="cart-empty" class="cart-empty">Tu carrito está vacío</div>
        <div class="cart-flyout__footer">
          <div class="cart-flyout__subtotal">Subtotal: <strong id="cart-subtotal">$0.00</strong></div>
          <div class="cart-flyout__actions">
            <button class="btn-checkout">Ir a pagar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fly);
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    ensureFlyoutMarkup();
    load();
    wireAddButtons();
    wireCartToggle();
    renderCart();
  });

})();

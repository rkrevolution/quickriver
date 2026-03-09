// ============================================
// THE TACKLE SHOP - App Logic
// ============================================

// All product paths matching our FastSpring dashboard.
// Used by the preload pattern to fetch live data on page load.
var ALL_PRODUCTS = [
  'guppy-6-pack', 'squid-bait', 'fishing-rod', 'fishing-line', 'sun-hat-subscription', 'gatorade-subscription'
];

// --- Tab Switching ---
// Simple tab navigation — toggles active class on tabs and content panels.
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ============================================
// PRODUCT DATA CACHE
// SBL only populates directives for products in the active session.
// When we reset the cart, SBL clears the DOM. This cache preserves
// the product data so we can re-apply it after reset.
// ============================================
var _productCache = {};

// Extracts product data from the SBL data-callback payload
// and stores it in _productCache keyed by product path.
function cacheProducts(data) {
  if (!data || !data.groups) return;
  data.groups.forEach(function(group) {
    if (!group.items) return;
    group.items.forEach(function(item) {
      if (item.path && item.display) {
        _productCache[item.path] = {
          display: item.display,
          price: item.price,
          description: item.description,
          image: item.image
        };
      }
    });
  });
}

// Re-applies cached product data to the DOM.
// Finds elements by their data-fsc-item-path and updates
// display, price, description, and image from the cache.
function applyProductCache() {
  Object.keys(_productCache).forEach(function(path) {
    var item = _productCache[path];
    document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-display]').forEach(function(el) {
      if (item.display) el.textContent = item.display;
    });
    document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-price]').forEach(function(el) {
      if (item.price) el.textContent = item.price;
    });
    document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-description-summary]').forEach(function(el) {
      if (item.description && item.description.summary) {
        // FastSpring returns descriptions wrapped in HTML (e.g. <p>...</p>).
        // Strip the tags and display plain text only.
        var tmp = document.createElement('div');
        tmp.innerHTML = item.description.summary;
        el.textContent = tmp.textContent || tmp.innerText || '';
      }
    });
    document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-image]').forEach(function(el) {
      if (item.image) el.src = item.image;
    });
  });
}

// ============================================
// CART RENDERING
// Called by the SBL data-data-callback on every session change.
// Caches product data, re-applies it to the DOM, and renders
// the custom cart UI ("Tackle Box") with selected items.
// ============================================
window.renderCart = renderCart;
function renderCart(data) {
  cacheProducts(data);
  applyProductCache();

  var container = document.getElementById('cart-contents');
  if (!container) return;

  // Filter to only selected (in-cart) items from the SBL session
  var items = [];
  if (data && data.groups) {
    data.groups.forEach(function(group) {
      if (group.items) {
        group.items.forEach(function(item) {
          if (item.selected) items.push(item);
        });
      }
    });
  }

  if (items.length === 0) {
    container.innerHTML = '<p class="cart-empty">Empty - add some gear!</p>';
    return;
  }

  // Build cart HTML — each item gets a Remove button using
  // data-fsc-action="Remove" so SBL handles the removal.
  var html = '';
  items.forEach(function(item) {
    html += '<div class="cart-item">';
    html += '<span class="cart-item-name">' + escapeHtml(item.display) + '</span>';
    html += '<span class="cart-item-qty">x' + item.quantity + '</span>';
    html += '<span class="cart-item-price">' + item.priceTotal + '</span>';
    html += '<button class="cart-item-remove" data-fsc-item-path-value="' + item.path + '" data-fsc-action="Remove">X</button>';
    html += '</div>';
  });
  container.innerHTML = html;
}

// Sanitize product names for safe HTML insertion
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// CHECKOUT VIEW
// Hides the shop UI and triggers FastSpring's embedded checkout
// using fastspring.builder.checkout(). The checkout renders inside
// #fsc-embedded-checkout-container in index.html.
// ============================================
document.getElementById('checkout-btn').addEventListener('click', function() {
  document.querySelector('.shop-header').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';
  document.querySelector('.shop-panel').style.display = 'none';
  document.getElementById('shop-view-cart').style.display = 'none';
  document.getElementById('checkout-view').classList.add('active');
  if (typeof fastspring !== 'undefined' && fastspring.builder) {
    fastspring.builder.checkout();
  }
});

// Back button — restores the shop view and hides checkout
document.getElementById('back-to-shop').addEventListener('click', function() {
  document.getElementById('checkout-view').classList.remove('active');
  document.querySelector('.shop-header').style.display = '';
  document.querySelector('.tabs').style.display = '';
  document.querySelector('.shop-panel').style.display = '';
  document.getElementById('shop-view-cart').style.display = '';
});

// ============================================
// CURRENCY SWITCHER
// Calls fastspring.builder.country() with an ISO country code.
// This overrides geolocation and re-renders all prices in the
// selected country's local currency. FastSpring handles the
// conversion, formatting, and tax calculation automatically.
// ============================================
document.getElementById('currency-select').addEventListener('change', function() {
  if (typeof fastspring !== 'undefined' && fastspring.builder) {
    fastspring.builder.country(this.value);
  }
});

// ============================================
// PRELOAD PATTERN
// SBL only populates directives for products in the session.
// Problem: on a fresh page load, the cart is empty so no
// product data appears.
//
// Solution:
// 1. Wait for SBL to initialize
// 2. Push all products into the session (fastspring.builder.push)
//    — this triggers data-callback with full product data
// 3. Cache that data via cacheProducts()
// 4. Reset the cart (fastspring.builder.reset) so user starts clean
// 5. Re-apply cached data to the DOM (applyProductCache)
//
// Result: every product shows live name, price, description,
// and image — even before the customer adds anything to the cart.
// ============================================
function preloadAllProducts() {
  if (typeof fastspring === 'undefined' || !fastspring.builder || !fastspring.builder.push) {
    setTimeout(preloadAllProducts, 300);
    return;
  }
  var session = { products: ALL_PRODUCTS.map(function(p) { return { path: p, quantity: 1 }; }) };
  fastspring.builder.push(session);
  setTimeout(function() {
    fastspring.builder.reset();
    setTimeout(applyProductCache, 500);
  }, 2000);
}
preloadAllProducts();

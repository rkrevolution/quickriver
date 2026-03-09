// ============================================
// THE TACKLE SHOP - App Logic
// ============================================

var ALL_PRODUCTS = [
  'guppy-6-pack', 'squid-bait', 'fishing-rod', 'fishing-line', 'sun-hat', 'sun-hat-subscription', 'gatorade-subscription'
];

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// --- Product data cache ---
var _productCache = {};

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
      if (item.description && item.description.summary) el.textContent = item.description.summary;
    });
    document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-image]').forEach(function(el) {
      if (item.image) el.src = item.image;
    });
  });
}

// --- Render on-page cart ---
window.renderCart = renderCart;
function renderCart(data) {
  cacheProducts(data);
  applyProductCache();

  var container = document.getElementById('cart-contents');
  if (!container) return;

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

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Checkout view toggle ---
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

document.getElementById('back-to-shop').addEventListener('click', function() {
  document.getElementById('checkout-view').classList.remove('active');
  document.querySelector('.shop-header').style.display = '';
  document.querySelector('.tabs').style.display = '';
  document.querySelector('.shop-panel').style.display = '';
  document.getElementById('shop-view-cart').style.display = '';
});

// --- Preload all products, then reset cart ---
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

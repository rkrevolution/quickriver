// ============================================
// THE TACKLE SHOP - App Logic
// ============================================

var ALL_PRODUCTS = [
  'guppy-6-pack', 'squid-bait', 'fishing-rod', 'fishing-line', 'sun-hat', 'gatorade-subscription'
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

// --- Populate product display from SBL data ---
function populateProducts(data) {
  if (!data || !data.groups) return;
  data.groups.forEach(function(group) {
    if (!group.items) return;
    group.items.forEach(function(item) {
      var path = item.path;
      // Display name
      document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-display]').forEach(function(el) {
        if (item.display) el.textContent = item.display;
      });
      // Price
      document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-price]').forEach(function(el) {
        if (item.price) el.textContent = item.price;
      });
      // Description summary
      document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-description-summary]').forEach(function(el) {
        if (item.description && item.description.summary) el.textContent = item.description.summary;
      });
      // Image
      document.querySelectorAll('[data-fsc-item-path="' + path + '"][data-fsc-item-image]').forEach(function(el) {
        if (item.image) el.src = item.image;
      });
    });
  });
}

// --- Render on-page cart ---
window.renderCart = renderCart;
function renderCart(data) {
  // Populate product info on every callback
  populateProducts(data);

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

// --- Preload: add all products to fetch descriptions, then reset cart ---
var _preloadDone = false;
function preloadAllProducts() {
  if (typeof fastspring === 'undefined' || !fastspring.builder || !fastspring.builder.push) {
    setTimeout(preloadAllProducts, 300);
    return;
  }
  var session = { items: ALL_PRODUCTS.map(function(p) { return { product: p, quantity: 1 }; }) };
  fastspring.builder.push(session);
  // Reset cart after descriptions are captured
  setTimeout(function() {
    _preloadDone = true;
    fastspring.builder.reset();
  }, 1500);
}
preloadAllProducts();

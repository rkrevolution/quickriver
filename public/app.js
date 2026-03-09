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

// --- Render on-page cart from SBL data callback ---
window.renderCart = renderCart;
function renderCart(data) {
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

// --- Preload: add all products so SBL populates display info ---
function preloadAllProducts() {
  if (typeof fastspring === 'undefined' || !fastspring.builder || !fastspring.builder.push) {
    setTimeout(preloadAllProducts, 300);
    return;
  }
  var session = { items: ALL_PRODUCTS.map(function(p) { return { product: p, quantity: 1 }; }) };
  fastspring.builder.push(session);
}
preloadAllProducts();

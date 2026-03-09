// ============================================
// THE TACKLE SHOP - App Logic
// ============================================

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// --- FastSpring data callback ---
function dataCallback(data) {
  console.log('FastSpring data:', data);
  renderCart(data);
}
window.dataCallback = dataCallback;

// --- Render on-page cart ---
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

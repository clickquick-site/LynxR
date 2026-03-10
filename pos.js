/**
 * R.Lynx™ RestFast — POS Terminal (pos.js)
 * Handles: table selection, item browsing, cart, payment
 */

// State
let state = {
  session: null,
  currentTable: null,
  currentOrder: null,
  activeCategory: 'all',
  searchQuery: '',
};

// ——— Init ——————————————————————————————————————————————————— //
document.addEventListener('DOMContentLoaded', () => {
  state.session = Auth.requireRole('cashier');
  if (!state.session) return;

  // Render top bar
  document.getElementById('topbar-cashier-name').textContent = state.session.name;
  Clock.start(document.getElementById('topbar-clock'));

  renderCategories();
  renderItems();
  renderCartEmpty();

  // Events
  document.getElementById('menu-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderItems();
  });

  document.getElementById('btn-select-table').addEventListener('click', openTableModal);
  document.getElementById('btn-clear-cart').addEventListener('click', clearCart);
  document.getElementById('btn-pay').addEventListener('click', openPaymentModal);
  document.getElementById('btn-new-order').addEventListener('click', openTableModal);
  document.getElementById('task-panel-toggle').addEventListener('click', toggleTaskPanel);
  document.getElementById('btn-logout').addEventListener('click', Auth.logout);

  // Gesture mode (swipe up on items panel)
  setupGestureMode();
});

// ——— Categories ——————————————————————————————————————————— //
const renderCategories = () => {
  const cats = DB.getAll('categories');
  const bar = document.getElementById('category-bar');
  bar.innerHTML = `
    <button class="cat-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">
      <span class="cat-icon">🍽</span>
      <span class="cat-name">Tout</span>
    </button>
    ${cats.map(c => `
      <button class="cat-btn ${state.activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
        <span class="cat-icon">${c.icon}</span>
        <span class="cat-name">${c.name}</span>
      </button>
    `).join('')}
  `;

  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.cat;
      state.activeCategory = raw === 'all' ? 'all' : parseInt(raw);
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.searchQuery = '';
      document.getElementById('menu-search').value = '';
      renderItems();
    });
  });
};

// ——— Items Grid ————————————————————————————————————————————— //
const renderItems = () => {
  let items = DB.getAll('items').filter(i => i.active);

  if (state.activeCategory !== 'all') {
    items = items.filter(i => i.catId === state.activeCategory);
  }
  if (state.searchQuery) {
    items = items.filter(i => i.name.toLowerCase().includes(state.searchQuery));
  }

  const grid = document.getElementById('items-grid');
  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-display)">Aucun article trouvé</div>`;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="item-card ${!item.stock ? 'out-of-stock' : ''}"
         data-id="${item.id}"
         title="${item.name} — ${Fmt.currency(item.price)}">
      <div class="item-img">${item.icon}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-price">${Fmt.currency(item.price)}</div>
      ${!item.stock ? '<div class="item-stock-badge">ÉPUISÉ</div>' : ''}
    </div>
  `).join('');

  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const itemId = parseInt(card.dataset.id);
      addToCart(itemId);
    });
  });
};

// ——— Cart ——————————————————————————————————————————————————— //
const addToCart = (itemId) => {
  if (!state.currentOrder) {
    // Auto-create order for takeaway if no table
    if (!state.currentTable) {
      Toast.show('Sélectionnez une table d\'abord', 'error');
      openTableModal();
      return;
    }
  }

  const item = DB.getById('items', itemId);
  if (!item) return;

  state.currentOrder = DB.addItemToOrder(state.currentOrder.id, item);
  Sound.play('add');
  renderCart();
};

const renderCart = () => {
  const order = state.currentOrder;
  if (!order || order.items.length === 0) {
    renderCartEmpty();
    return;
  }

  document.getElementById('cart-items').innerHTML = order.items.map(item => `
    <div class="cart-item" data-item-id="${item.itemId}">
      <div class="ci-icon">${item.icon}</div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        ${item.note ? `<div class="ci-note">📝 ${item.note}</div>` : ''}
      </div>
      <div class="qty-control">
        <button class="qty-btn remove" data-action="dec" data-id="${item.itemId}">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.itemId}">+</button>
      </div>
      <div class="ci-price">${Fmt.currency(item.lineTotal)}</div>
    </div>
  `).join('');

  // Qty buttons
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      const cartItem = order.items.find(i => i.itemId === itemId);
      if (!cartItem) return;
      const newQty = action === 'inc' ? cartItem.qty + 1 : cartItem.qty - 1;
      state.currentOrder = DB.updateItemQty(order.id, itemId, newQty);
      Sound.play(action === 'inc' ? 'add' : 'remove');
      renderCart();
    });
  });

  // Summary
  document.getElementById('summary-subtotal').textContent = Fmt.currency(order.subtotal);
  const settings = DB.get('settings', {});
  document.getElementById('summary-tva-label').textContent = `TVA (${settings.tva || 9}%)`;
  document.getElementById('summary-tva').textContent = Fmt.currency(order.tva);
  document.getElementById('summary-total').textContent = Fmt.currency(order.total);

  // Enable pay button
  document.getElementById('btn-pay').disabled = false;
  document.getElementById('cart-items').style.display = '';
  document.getElementById('cart-empty-state').style.display = 'none';
  document.getElementById('cart-footer').style.display = '';
};

const renderCartEmpty = () => {
  document.getElementById('cart-items').innerHTML = '';
  document.getElementById('cart-empty-state').style.display = 'flex';
  document.getElementById('cart-footer').style.display = 'none';
};

const clearCart = async () => {
  if (!state.currentOrder || state.currentOrder.items.length === 0) return;
  const ok = await Confirm('Vider la commande en cours ?', 'Vider la commande');
  if (!ok) return;
  DB.update('orders', state.currentOrder.id, { status: 'cancelled' });
  _freeTable();
  state.currentOrder = null;
  state.currentTable = null;
  updateTableInfo();
  renderCartEmpty();
  Toast.show('Commande annulée', 'info');
};

// ——— Table Selection ———————————————————————————————————————— //
const openTableModal = () => {
  const tables = DB.getAll('tables');
  const grid = tables.map(t => `
    <div class="table-cell ${t.status === 'occupied' ? 'occupied' : ''}"
         data-table-id="${t.id}">
      <div class="t-num">${t.id}</div>
      <div class="t-label">${t.status === 'occupied' ? 'Occupée' : `${t.capacity} pers.`}</div>
    </div>
  `).join('');

  const id = Modal.open(`
    <div class="modal-title"><span class="icon">🪑</span> Sélection de Table</div>
    <div class="table-grid">${grid}</div>
    <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="Modal.close('${id}')">Annuler</button>
    </div>
  `, { width: '560px' });

  document.querySelectorAll('.table-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const tableId = parseInt(cell.dataset.tableId);
      selectTable(tableId);
      Modal.closeAll();
    });
  });
};

const selectTable = (tableId) => {
  const table = DB.getById('tables', tableId);
  if (!table) return;

  // If table already has an open order, resume it
  if (table.status === 'occupied' && table.currentOrderId) {
    state.currentOrder = DB.getById('orders', table.currentOrderId);
    state.currentTable = table;
    updateTableInfo();
    renderCart();
    Toast.show(`Reprise table ${tableId}`, 'info');
    return;
  }

  // Create new order
  state.currentTable = table;
  state.currentOrder = DB.createOrder(tableId, state.session.userId);
  DB.update('tables', tableId, { status: 'occupied', currentOrderId: state.currentOrder.id });
  updateTableInfo();
  document.getElementById('cart-order-num').textContent = `#${state.currentOrder.number}`;
  renderCartEmpty();
  Toast.show(`Table ${tableId} sélectionnée`, 'success');
  Sound.play('success');
};

const updateTableInfo = () => {
  const el = document.getElementById('topbar-table-info');
  if (state.currentTable) {
    el.textContent = `🪑 Table ${state.currentTable.id}`;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
};

const _freeTable = () => {
  if (state.currentTable) {
    DB.update('tables', state.currentTable.id, { status: 'free', currentOrderId: null });
  }
};

// ——— Payment ———————————————————————————————————————————————— //
let payState = { method: 'cash', entered: '' };

const openPaymentModal = () => {
  if (!state.currentOrder || state.currentOrder.items.length === 0) return;
  const order = state.currentOrder;
  payState = { method: 'cash', entered: '' };

  const id = Modal.open(`
    <div class="modal-title"><span class="icon">💳</span> Paiement</div>

    <div class="payment-methods">
      <div class="pay-method active" data-method="cash">
        <div class="pm-icon">💵</div>
        <div class="pm-name">Espèces</div>
      </div>
      <div class="pay-method" data-method="card">
        <div class="pm-icon">💳</div>
        <div class="pm-name">Carte</div>
      </div>
      <div class="pay-method" data-method="mobile">
        <div class="pm-icon">📱</div>
        <div class="pm-name">Mobile</div>
      </div>
    </div>

    <div class="payment-amount-display">
      <div class="pad-total-label">Montant à payer</div>
      <div class="pad-total-amount" id="pad-total">${Fmt.currency(order.total)}</div>
    </div>

    <div class="numpad">
      ${['1','2','3','4','5','6','7','8','9','⌫','0','00'].map(k =>
        `<button class="numpad-btn ${k==='⌫'?'backspace':''} ${k==='0'?'':''}" data-key="${k}">${k}</button>`
      ).join('')}
    </div>

    <div class="change-display" id="change-row" style="display:none">
      <span class="label">Monnaie à rendre</span>
      <span class="value" id="change-amount">—</span>
    </div>

    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost w-full" onclick="Modal.close('${id}')">Annuler</button>
      <button class="btn btn-success w-full btn-lg" id="btn-confirm-pay">
        ✓ Valider le paiement
      </button>
    </div>
  `, { width: '460px', persistent: true });

  // Method selection
  document.querySelectorAll('.pay-method').forEach(m => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.pay-method').forEach(x => x.classList.remove('active'));
      m.classList.add('active');
      payState.method = m.dataset.method;
      payState.entered = '';
      updatePayDisplay(order.total);
    });
  });

  // Numpad
  document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (k === '⌫') {
        payState.entered = payState.entered.slice(0, -1);
      } else {
        if (payState.entered.length < 7) payState.entered += k;
      }
      updatePayDisplay(order.total);
      Sound.play('add');
    });
  });

  // Confirm
  document.getElementById('btn-confirm-pay').addEventListener('click', () => {
    confirmPayment(order, id);
  });
};

const updatePayDisplay = (total) => {
  const entered = parseInt(payState.entered) || 0;
  const change = entered - total;
  const changeRow = document.getElementById('change-row');
  const changeEl = document.getElementById('change-amount');
  if (entered >= total && payState.method === 'cash') {
    changeRow.style.display = 'flex';
    changeEl.textContent = Fmt.currency(change);
  } else {
    changeRow.style.display = 'none';
  }
};

const confirmPayment = async (order, modalId) => {
  const closedOrder = DB.closeOrder(order.id, payState.method);
  if (!closedOrder) { Toast.show('Erreur lors du paiement', 'error'); return; }

  _freeTable();
  state.currentOrder = null;
  state.currentTable = null;

  Modal.close(modalId);
  updateTableInfo();
  renderCartEmpty();
  document.getElementById('cart-order-num').textContent = '#—';

  Sound.play('pay');
  Toast.show(`Paiement validé — ${Fmt.currency(closedOrder.total)}`, 'success');

  // Print ticket
  const settings = DB.get('settings', {});
  if (settings.printerEnabled !== false) {
    setTimeout(() => Ticket.print(closedOrder), 300);
  }
};

// ——— Task Panel / Gesture ——————————————————————————————————— //
const toggleTaskPanel = () => {
  const panel = document.getElementById('task-panel');
  const toggle = document.getElementById('task-panel-toggle');
  const visible = panel.classList.toggle('visible');
  toggle.textContent = visible ? '▼ TÂCHES' : '▲ TÂCHES';
  if (visible) renderTaskPanel();
};

const renderTaskPanel = () => {
  const orders = DB.getAll('orders').filter(o => o.status === 'open');
  const panel = document.getElementById('task-panel');
  if (orders.length === 0) {
    panel.innerHTML = `<p style="color:var(--text-muted);font-family:var(--font-display);font-size:0.9rem">Aucune commande en cours</p>`;
    return;
  }
  panel.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${orders.map(o => `
        <div style="padding:10px 16px;background:var(--bg-surface);border:1px solid var(--border-amber);border-radius:var(--radius);cursor:pointer;font-family:var(--font-display)"
             onclick="resumeOrderFromTask(${o.id})">
          <div style="font-weight:700;color:var(--amber)">Table ${o.tableId}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">#${o.number} — ${o.items.length} art. — ${Fmt.currency(o.total)}</div>
        </div>
      `).join('')}
    </div>
  `;
};

const resumeOrderFromTask = (orderId) => {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const table = DB.getById('tables', order.tableId);
  state.currentOrder = order;
  state.currentTable = table;
  updateTableInfo();
  renderCart();
  document.getElementById('cart-order-num').textContent = `#${order.number}`;
  toggleTaskPanel();
  Toast.show(`Reprise table ${order.tableId}`, 'info');
};

const setupGestureMode = () => {
  const settings = DB.get('settings', {});
  if (!settings.gestureMode) return;

  let startY = 0;
  const menuPanel = document.getElementById('pos-menu');
  menuPanel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  menuPanel.addEventListener('touchend', e => {
    const diff = startY - e.changedTouches[0].clientY;
    if (diff > 60) { /* swipe up: toggle task */ toggleTaskPanel(); }
  }, { passive: true });
};

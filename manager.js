/**
 * R.Lynx™ RestFast — Manager Back-Office (manager.js)
 * Dashboard, Items, Categories, Reports, Users, Settings
 */

let mgr = {
  session: null,
  activePage: 'dashboard',
};

// ——— Init ——————————————————————————————————————————————————— //
document.addEventListener('DOMContentLoaded', () => {
  mgr.session = Auth.requireRole('manager');
  if (!mgr.session) return;

  // Nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  document.getElementById('btn-logout-mgr').addEventListener('click', Auth.logout);
  document.getElementById('btn-launch-pos').addEventListener('click', () => {
    window.open('pos.html', '_blank');
  });

  navigateTo('dashboard');
});

// ——— Navigation ———————————————————————————————————————————— //
const navigateTo = (page) => {
  mgr.activePage = page;

  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === page);
  });
  document.querySelectorAll('.page-body').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
  document.getElementById('page-header-title').textContent = PAGE_TITLES[page] || page;
  document.getElementById('page-header-icon').textContent = PAGE_ICONS[page] || '◆';

  // Render page content
  const render = PAGE_RENDERS[page];
  if (render) render();
};

const PAGE_TITLES = {
  dashboard: 'Tableau de Bord',
  orders:    'Commandes',
  items:     'Carte / Articles',
  categories:'Catégories',
  tables:    'Tables',
  reports:   'Rapports',
  users:     'Utilisateurs',
  settings:  'Paramètres',
};
const PAGE_ICONS = {
  dashboard: '📊',
  orders:    '🧾',
  items:     '🍽',
  categories:'📂',
  tables:    '🪑',
  reports:   '📈',
  users:     '👤',
  settings:  '⚙',
};

// ——— Dashboard ————————————————————————————————————————————— //
const renderDashboard = () => {
  const summary = DB.getDailySalesSummary();
  const orders = DB.getTodayOrders();
  const allOrders = DB.getAll('orders');
  const openOrders = allOrders.filter(o => o.status === 'open');

  // Stats
  document.getElementById('stat-revenue').textContent   = Fmt.currency(summary.revenue);
  document.getElementById('stat-orders').textContent    = summary.count;
  document.getElementById('stat-avg').textContent       = Fmt.currency(summary.avgTicket);
  document.getElementById('stat-open').textContent      = openOrders.length;

  // Bar chart (last 7 days)
  renderWeeklyChart();

  // Top items
  renderTopItems(orders);

  // Recent orders
  renderRecentOrders(orders.slice(-10).reverse());
};

const renderWeeklyChart = () => {
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const today = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const orders = DB.getAll('orders').filter(o => {
      if (o.status !== 'paid') return false;
      return new Date(o.closedAt).toDateString() === d.toDateString();
    });
    data.push({
      label: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
      value: orders.reduce((s, o) => s + o.total, 0)
    });
  }
  const max = Math.max(...data.map(d => d.value), 1);

  document.getElementById('weekly-chart').innerHTML = data.map(d => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.round((d.value/max)*100)}%;min-height:4px"
           title="${Fmt.currency(d.value)}"></div>
      <div class="bar-label">${d.label}</div>
    </div>
  `).join('');
};

const renderTopItems = (orders) => {
  const counter = {};
  orders.forEach(o => o.items.forEach(i => {
    counter[i.name] = (counter[i.name] || 0) + i.qty;
  }));
  const sorted = Object.entries(counter).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const total = sorted.reduce((s,[,v]) => s+v, 0) || 1;

  const colors = ['#f59e0b','#22c55e','#3b82f6','#a855f7','#ef4444'];
  document.getElementById('top-items-legend').innerHTML = sorted.map(([name, qty], i) => `
    <div class="legend-item">
      <div class="legend-label">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        ${name}
      </div>
      <div class="legend-value">${qty}</div>
    </div>
  `).join('');

  // Simple SVG donut
  if (sorted.length === 0) return;
  let offset = 0;
  const cx = 70, cy = 70, r = 55, strokeW = 22;
  const circ = 2 * Math.PI * r;
  const arcs = sorted.map(([,qty], i) => {
    const pct = qty / total;
    const arc = `
      <circle cx="${cx}" cy="${cy}" r="${r}"
        fill="none" stroke="${colors[i]}" stroke-width="${strokeW}"
        stroke-dasharray="${circ * pct} ${circ * (1 - pct)}"
        stroke-dashoffset="${-circ * offset}"
        transform="rotate(-90 ${cx} ${cy})"/>
    `;
    offset += pct;
    return arc;
  }).join('');

  document.getElementById('donut-svg').innerHTML = `
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-raised)" stroke-width="${strokeW}"/>
      ${arcs}
      <text x="${cx}" y="${cy+5}" text-anchor="middle" fill="var(--text-primary)"
            font-family="var(--font-mono)" font-size="14" font-weight="700">${total}</text>
    </svg>`;
};

const renderRecentOrders = (orders) => {
  const tbody = document.getElementById('recent-orders-body');
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">Aucune commande aujourd'hui</td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="td-name font-mono">#${o.number}</td>
      <td>Table ${o.tableId}</td>
      <td>${o.items.length} articles</td>
      <td class="td-amount">${Fmt.currency(o.total)}</td>
      <td>${_payIcon(o.paymentMethod)}</td>
      <td style="color:var(--text-muted);font-size:0.8rem">${Fmt.time(o.closedAt)}</td>
    </tr>
  `).join('');
};

const _payIcon = (m) => ({ cash:'💵 Espèces', card:'💳 Carte', mobile:'📱 Mobile' }[m] || m || '—');

// ——— Orders ———————————————————————————————————————————————— //
const renderOrders = () => {
  const orders = DB.getAll('orders').slice().reverse();
  const tbody = document.getElementById('orders-body');

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">Aucune commande</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="font-mono" style="color:var(--amber)">#${o.number}</td>
      <td class="td-name">Table ${o.tableId}</td>
      <td>${o.items.length} art.</td>
      <td class="td-amount">${Fmt.currency(o.total)}</td>
      <td>
        <span class="badge ${o.status==='paid'?'badge-green':o.status==='open'?'badge-amber':'badge-red'}">
          ${o.status==='paid'?'Payée':o.status==='open'?'En cours':'Annulée'}
        </span>
      </td>
      <td>${_payIcon(o.paymentMethod)}</td>
      <td style="font-size:0.8rem;color:var(--text-muted)">${Fmt.datetime(o.createdAt)}</td>
    </tr>
  `).join('');
};

// ——— Items / Carte ————————————————————————————————————————— //
const renderItems = () => {
  const items = DB.getAll('items');
  const cats = DB.getAll('categories');
  const grid = document.getElementById('items-manager-grid');

  grid.innerHTML = items.map(item => {
    const cat = cats.find(c => c.id === item.catId);
    return `
      <div class="item-manager-card">
        <div class="item-card-img">${item.icon}</div>
        <div class="item-card-body">
          <div class="item-card-name">${item.name}</div>
          <div class="item-card-cat">${cat ? cat.name : '—'}</div>
          <div class="item-card-footer">
            <span class="td-price font-mono">${Fmt.currency(item.price)}</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="editItem(${item.id})">✏</button>
              <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">🗑</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

const openAddItemModal = () => {
  const cats = DB.getAll('categories');
  const id = Modal.open(`
    <div class="modal-title"><span class="icon">+</span> Nouvel Article</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nom</label>
        <input class="input" id="item-name" placeholder="Ex: Poulet Rôti">
      </div>
      <div class="form-group">
        <label class="form-label">Icône</label>
        <input class="input" id="item-icon" placeholder="🍗" maxlength="2" value="🍽">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prix (DZD)</label>
        <input class="input" id="item-price" type="number" min="0" placeholder="0">
      </div>
      <div class="form-group">
        <label class="form-label">Catégorie</label>
        <select class="input" id="item-cat">
          ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.close()">Annuler</button>
      <button class="btn btn-primary" id="btn-save-item">Enregistrer</button>
    </div>
  `);

  document.getElementById('btn-save-item').onclick = () => {
    const name = document.getElementById('item-name').value.trim();
    const icon = document.getElementById('item-icon').value.trim() || '🍽';
    const price = parseInt(document.getElementById('item-price').value) || 0;
    const catId = parseInt(document.getElementById('item-cat').value);
    if (!name || !price) { Toast.show('Remplissez tous les champs', 'error'); return; }
    DB.insert('items', { catId, name, price, icon, active: true, stock: true });
    Modal.closeAll();
    renderItems();
    Toast.show('Article ajouté', 'success');
  };
};

const editItem = (itemId) => {
  const item = DB.getById('items', itemId);
  if (!item) return;
  const cats = DB.getAll('categories');

  const id = Modal.open(`
    <div class="modal-title"><span class="icon">✏</span> Modifier Article</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nom</label>
        <input class="input" id="edit-name" value="${item.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Icône</label>
        <input class="input" id="edit-icon" maxlength="2" value="${item.icon}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prix</label>
        <input class="input" id="edit-price" type="number" value="${item.price}">
      </div>
      <div class="form-group">
        <label class="form-label">Catégorie</label>
        <select class="input" id="edit-cat">
          ${cats.map(c => `<option value="${c.id}" ${c.id===item.catId?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Statut</label>
        <select class="input" id="edit-active">
          <option value="1" ${item.active?'selected':''}>Actif</option>
          <option value="0" ${!item.active?'selected':''}>Inactif</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Stock</label>
        <select class="input" id="edit-stock">
          <option value="1" ${item.stock?'selected':''}>Disponible</option>
          <option value="0" ${!item.stock?'selected':''}>Épuisé</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.closeAll()">Annuler</button>
      <button class="btn btn-primary" id="btn-update-item">Mettre à jour</button>
    </div>
  `);

  document.getElementById('btn-update-item').onclick = () => {
    DB.update('items', itemId, {
      name: document.getElementById('edit-name').value.trim(),
      icon: document.getElementById('edit-icon').value.trim(),
      price: parseInt(document.getElementById('edit-price').value),
      catId: parseInt(document.getElementById('edit-cat').value),
      active: document.getElementById('edit-active').value === '1',
      stock: document.getElementById('edit-stock').value === '1',
    });
    Modal.closeAll();
    renderItems();
    Toast.show('Article mis à jour', 'success');
  };
};

const deleteItem = async (itemId) => {
  const item = DB.getById('items', itemId);
  if (!item) return;
  const ok = await Confirm(`Supprimer "${item.name}" ?`, 'Supprimer Article');
  if (!ok) return;
  DB.del('items', itemId);
  renderItems();
  Toast.show('Article supprimé', 'info');
};

// ——— Categories ———————————————————————————————————————————— //
const renderCategories = () => {
  const cats = DB.getAll('categories');
  const tbody = document.getElementById('cats-body');
  tbody.innerHTML = cats.map(c => `
    <tr>
      <td style="font-size:1.4rem">${c.icon}</td>
      <td class="td-name">${c.name}</td>
      <td>${DB.getAll('items').filter(i=>i.catId===c.id).length} articles</td>
      <td>
        <div style="width:16px;height:16px;border-radius:50%;background:${c.color}"></div>
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editCategory(${c.id})">✏</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">🗑</button>
      </td>
    </tr>
  `).join('');
};

const openAddCategoryModal = () => {
  const id = Modal.open(`
    <div class="modal-title"><span class="icon">+</span> Nouvelle Catégorie</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nom</label>
        <input class="input" id="cat-name" placeholder="Ex: Desserts">
      </div>
      <div class="form-group">
        <label class="form-label">Icône</label>
        <input class="input" id="cat-icon" placeholder="🍰" maxlength="2">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Couleur</label>
      <input class="input" id="cat-color" type="color" value="#f59e0b" style="height:42px;padding:4px 8px;cursor:pointer">
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.closeAll()">Annuler</button>
      <button class="btn btn-primary" id="btn-save-cat">Enregistrer</button>
    </div>
  `);
  document.getElementById('btn-save-cat').onclick = () => {
    const name = document.getElementById('cat-name').value.trim();
    const icon = document.getElementById('cat-icon').value.trim() || '📂';
    const color = document.getElementById('cat-color').value;
    if (!name) { Toast.show('Entrez un nom', 'error'); return; }
    const cats = DB.getAll('categories');
    DB.insert('categories', { name, icon, color, sort: cats.length + 1 });
    Modal.closeAll();
    renderCategories();
    Toast.show('Catégorie ajoutée', 'success');
  };
};

const editCategory = (catId) => {
  const cat = DB.getById('categories', catId);
  if (!cat) return;
  Modal.open(`
    <div class="modal-title"><span class="icon">✏</span> Modifier Catégorie</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nom</label>
        <input class="input" id="ecat-name" value="${cat.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Icône</label>
        <input class="input" id="ecat-icon" maxlength="2" value="${cat.icon}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Couleur</label>
      <input class="input" id="ecat-color" type="color" value="${cat.color}" style="height:42px;padding:4px 8px;cursor:pointer">
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.closeAll()">Annuler</button>
      <button class="btn btn-primary" id="btn-update-cat">Mettre à jour</button>
    </div>
  `);
  document.getElementById('btn-update-cat').onclick = () => {
    DB.update('categories', catId, {
      name: document.getElementById('ecat-name').value.trim(),
      icon: document.getElementById('ecat-icon').value.trim(),
      color: document.getElementById('ecat-color').value,
    });
    Modal.closeAll();
    renderCategories();
    Toast.show('Catégorie mise à jour', 'success');
  };
};

const deleteCategory = async (catId) => {
  const cat = DB.getById('categories', catId);
  if (!cat) return;
  const itemCount = DB.getAll('items').filter(i => i.catId === catId).length;
  const ok = await Confirm(
    `Supprimer "${cat.name}"${itemCount ? ` (${itemCount} articles seront supprimés)` : ''} ?`,
    'Supprimer Catégorie'
  );
  if (!ok) return;
  DB.del('categories', catId);
  if (itemCount) DB.getAll('items').filter(i => i.catId === catId).forEach(i => DB.del('items', i.id));
  renderCategories();
  Toast.show('Catégorie supprimée', 'info');
};

// ——— Tables ———————————————————————————————————————————————— //
const renderTables = () => {
  const tables = DB.getAll('tables');
  const tbody = document.getElementById('tables-body');
  tbody.innerHTML = tables.map(t => `
    <tr>
      <td class="td-name">Table ${t.id}</td>
      <td>${t.capacity} pers.</td>
      <td>
        <span class="badge ${t.status==='occupied'?'badge-red':'badge-green'}">
          ${t.status==='occupied'?'Occupée':'Libre'}
        </span>
      </td>
      <td style="color:var(--text-muted);font-size:0.85rem">${t.currentOrderId ? `Commande #${DB.getById('orders',t.currentOrderId)?.number||'?'}` : '—'}</td>
      <td>
        ${t.status==='occupied'
          ? `<button class="btn btn-ghost btn-sm" onclick="freeTable(${t.id})">🔓 Libérer</button>`
          : '—'
        }
      </td>
    </tr>
  `).join('');
};

const freeTable = async (tableId) => {
  const ok = await Confirm(`Libérer la table ${tableId} ?`, 'Libérer Table');
  if (!ok) return;
  DB.update('tables', tableId, { status: 'free', currentOrderId: null });
  renderTables();
  Toast.show(`Table ${tableId} libérée`, 'success');
};

// ——— Reports ——————————————————————————————————————————————— //
const renderReports = () => {
  // Default: today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('report-from').value = today;
  document.getElementById('report-to').value = today;
  loadReport();
};

const loadReport = () => {
  const from = document.getElementById('report-from').value;
  const to   = document.getElementById('report-to').value;
  const orders = DB.getOrdersByDate(from, to);

  const revenue = orders.reduce((s,o) => s+o.total, 0);
  const avgTicket = orders.length ? Math.round(revenue / orders.length) : 0;

  document.getElementById('rep-count').textContent   = orders.length;
  document.getElementById('rep-revenue').textContent  = Fmt.currency(revenue);
  document.getElementById('rep-avg').textContent      = Fmt.currency(avgTicket);

  // Payment breakdown
  const byMethod = {};
  orders.forEach(o => {
    byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] || 0) + o.total;
  });
  document.getElementById('rep-pay-breakdown').innerHTML = Object.entries(byMethod).map(([m,v]) =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.875rem">
      <span>${_payIcon(m)}</span>
      <span class="font-mono" style="color:var(--amber)">${Fmt.currency(v)}</span>
    </div>`
  ).join('') || `<p style="color:var(--text-muted);font-size:0.875rem">Aucune donnée</p>`;

  // Top items
  const itemSales = {};
  orders.forEach(o => o.items.forEach(i => {
    if (!itemSales[i.name]) itemSales[i.name] = { qty: 0, revenue: 0 };
    itemSales[i.name].qty += i.qty;
    itemSales[i.name].revenue += i.lineTotal;
  }));
  const sorted = Object.entries(itemSales).sort((a,b) => b[1].revenue-a[1].revenue).slice(0,10);
  document.getElementById('rep-items-body').innerHTML = sorted.map(([name, d]) =>
    `<tr>
      <td class="td-name">${name}</td>
      <td>${d.qty}</td>
      <td class="td-amount">${Fmt.currency(d.revenue)}</td>
    </tr>`
  ).join('') || `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px">Aucune donnée</td></tr>`;
};

// ——— Users ————————————————————————————————————————————————— //
const renderUsers = () => {
  const users = DB.getAll('users');
  const tbody = document.getElementById('users-body');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td class="td-name">${u.name}</td>
      <td style="font-family:var(--font-mono)">${u.username}</td>
      <td><span class="badge ${u.role==='manager'?'badge-amber':u.role==='cashier'?'badge-blue':'badge-green'}">${u.role}</span></td>
      <td><span class="badge ${u.active?'badge-green':'badge-red'}">${u.active?'Actif':'Inactif'}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="toggleUser(${u.id})">${u.active?'Désactiver':'Activer'}</button>
        <button class="btn btn-ghost btn-sm" onclick="editUser(${u.id})">✏</button>
      </td>
    </tr>
  `).join('');
};

const openAddUserModal = () => {
  Modal.open(`
    <div class="modal-title"><span class="icon">👤</span> Nouvel Utilisateur</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nom complet</label>
        <input class="input" id="usr-name" placeholder="Prénom Nom">
      </div>
      <div class="form-group">
        <label class="form-label">Identifiant</label>
        <input class="input" id="usr-username" placeholder="login">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input class="input" id="usr-pwd" type="password" placeholder="••••">
      </div>
      <div class="form-group">
        <label class="form-label">Rôle</label>
        <select class="input" id="usr-role">
          <option value="cashier">Caissier</option>
          <option value="waiter">Serveur</option>
          <option value="manager">Manager</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.closeAll()">Annuler</button>
      <button class="btn btn-primary" id="btn-save-usr">Enregistrer</button>
    </div>
  `);
  document.getElementById('btn-save-usr').onclick = () => {
    const name = document.getElementById('usr-name').value.trim();
    const username = document.getElementById('usr-username').value.trim();
    const password = document.getElementById('usr-pwd').value;
    const role = document.getElementById('usr-role').value;
    if (!name || !username || !password) { Toast.show('Remplissez tous les champs', 'error'); return; }
    DB.insert('users', { name, username, password, role, active: true });
    Modal.closeAll();
    renderUsers();
    Toast.show('Utilisateur créé', 'success');
  };
};

const editUser = (userId) => {
  const user = DB.getById('users', userId);
  if (!user) return;
  Modal.open(`
    <div class="modal-title"><span class="icon">✏</span> Modifier Utilisateur</div>
    <div class="form-group">
      <label class="form-label">Nom complet</label>
      <input class="input" id="eusr-name" value="${user.name}">
    </div>
    <div class="form-group">
      <label class="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
      <input class="input" id="eusr-pwd" type="password" placeholder="••••">
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="Modal.closeAll()">Annuler</button>
      <button class="btn btn-primary" id="btn-upd-usr">Mettre à jour</button>
    </div>
  `);
  document.getElementById('btn-upd-usr').onclick = () => {
    const updates = { name: document.getElementById('eusr-name').value.trim() };
    const pwd = document.getElementById('eusr-pwd').value;
    if (pwd) updates.password = pwd;
    DB.update('users', userId, updates);
    Modal.closeAll();
    renderUsers();
    Toast.show('Utilisateur mis à jour', 'success');
  };
};

const toggleUser = (userId) => {
  const user = DB.getById('users', userId);
  if (!user) return;
  DB.update('users', userId, { active: !user.active });
  renderUsers();
};

// ——— Settings ————————————————————————————————————————————— //
const renderSettings = () => {
  const s = DB.get('settings', {});
  document.getElementById('set-resto-name').value   = s.restaurantName || '';
  document.getElementById('set-currency').value     = s.currency || 'DZD';
  document.getElementById('set-tva').value          = s.tva || 9;
  document.getElementById('set-footer').value       = s.ticketFooter || '';
  document.getElementById('set-tables').value       = s.tableCount || 20;
  document.getElementById('set-sound').checked      = s.soundEnabled !== false;
  document.getElementById('set-gesture').checked    = s.gestureMode !== false;
  document.getElementById('set-printer').checked    = !!s.printerEnabled;
};

const saveSettings = () => {
  const s = {
    restaurantName: document.getElementById('set-resto-name').value.trim(),
    currency:       document.getElementById('set-currency').value,
    tva:            parseFloat(document.getElementById('set-tva').value) || 9,
    ticketFooter:   document.getElementById('set-footer').value,
    tableCount:     parseInt(document.getElementById('set-tables').value) || 20,
    soundEnabled:   document.getElementById('set-sound').checked,
    gestureMode:    document.getElementById('set-gesture').checked,
    printerEnabled: document.getElementById('set-printer').checked,
  };
  DB.set('settings', s);
  Toast.show('Paramètres enregistrés', 'success');
};

const resetDatabase = async () => {
  const ok = await Confirm('RÉINITIALISER toutes les données? Cette action est irréversible!', 'Réinitialisation');
  if (!ok) return;
  localStorage.clear();
  DB.init();
  Toast.show('Base de données réinitialisée', 'success');
  setTimeout(() => location.reload(), 1000);
};

// ——— Page Render Map ———————————————————————————————————————— //
const PAGE_RENDERS = {
  dashboard:  renderDashboard,
  orders:     renderOrders,
  items:      renderItems,
  categories: renderCategories,
  tables:     renderTables,
  reports:    renderReports,
  users:      renderUsers,
  settings:   renderSettings,
};

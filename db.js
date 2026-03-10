/**
 * R.Lynx™ RestFast — Database Layer (db.js)
 * Persistent local storage with demo data initialization
 */

const DB = (() => {
  const PREFIX = 'rlpos_';

  const get = (key, fallback = null) => {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };

  const set = (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch { return false; }
  };

  const remove = (key) => localStorage.removeItem(PREFIX + key);

  // ——— Schema initialization ——— //
  const init = () => {
    if (!get('initialized')) {
      _seedData();
      set('initialized', true);
    }
  };

  const _seedData = () => {
    // Categories
    set('categories', [
      { id: 1, name: 'Entrées',      icon: '🥗', color: '#22c55e', sort: 1 },
      { id: 2, name: 'Grillades',    icon: '🥩', color: '#ef4444', sort: 2 },
      { id: 3, name: 'Poulet',       icon: '🍗', color: '#f59e0b', sort: 3 },
      { id: 4, name: 'Pizzas',       icon: '🍕', color: '#f97316', sort: 4 },
      { id: 5, name: 'Sandwichs',    icon: '🥪', color: '#84cc16', sort: 5 },
      { id: 6, name: 'Pasta',        icon: '🍝', color: '#a855f7', sort: 6 },
      { id: 7, name: 'Desserts',     icon: '🍰', color: '#ec4899', sort: 7 },
      { id: 8, name: 'Boissons',     icon: '🥤', color: '#06b6d4', sort: 8 },
      { id: 9, name: 'Extras',       icon: '🧂', color: '#94a3b8', sort: 9 },
    ]);

    // Menu items
    set('items', [
      // Entrées
      { id: 101, catId: 1, name: 'Salade Fraîche',    price: 350,  icon: '🥗', active: true, stock: true },
      { id: 102, catId: 1, name: 'Soupe du Jour',      price: 250,  icon: '🍲', active: true, stock: true },
      { id: 103, catId: 1, name: 'Beignets de Crevette',price: 650, icon: '🍤', active: true, stock: true },
      { id: 104, catId: 1, name: 'Assiette Chorba',    price: 300,  icon: '🥣', active: true, stock: true },
      // Grillades
      { id: 201, catId: 2, name: 'Entrecôte 250g',    price: 1800, icon: '🥩', active: true, stock: true },
      { id: 202, catId: 2, name: 'Kefta Grillée',     price: 950,  icon: '🍢', active: true, stock: true },
      { id: 203, catId: 2, name: 'Côtelettes d\'Agneau',price:1600, icon: '🍖', active: true, stock: true },
      { id: 204, catId: 2, name: 'Merguez x4',        price: 750,  icon: '🌭', active: true, stock: true },
      // Poulet
      { id: 301, catId: 3, name: 'Poulet Rôti',       price: 1200, icon: '🍗', active: true, stock: true },
      { id: 302, catId: 3, name: 'Cuisse Grillée',    price: 850,  icon: '🍗', active: true, stock: true },
      { id: 303, catId: 3, name: 'Poulet FFR',        price: 750,  icon: '🍗', active: true, stock: true },
      { id: 304, catId: 3, name: 'Filet de Poulet',   price: 950,  icon: '🍗', active: true, stock: true },
      // Pizzas
      { id: 401, catId: 4, name: 'Margherita',        price: 1100, icon: '🍕', active: true, stock: true },
      { id: 402, catId: 4, name: 'Reine',             price: 1300, icon: '🍕', active: true, stock: true },
      { id: 403, catId: 4, name: 'Calzone',           price: 1400, icon: '🫓', active: true, stock: true },
      { id: 404, catId: 4, name: 'Forestière',        price: 1350, icon: '🍕', active: true, stock: true },
      // Sandwichs
      { id: 501, catId: 5, name: 'Sandwich Kefta',    price: 350,  icon: '🥙', active: true, stock: true },
      { id: 502, catId: 5, name: 'Sandwich Poulet',   price: 380,  icon: '🥪', active: true, stock: true },
      { id: 503, catId: 5, name: 'Sandwich Thon',     price: 320,  icon: '🥪', active: true, stock: true },
      { id: 504, catId: 5, name: 'Burger Spécial',    price: 550,  icon: '🍔', active: true, stock: true },
      // Pasta
      { id: 601, catId: 6, name: 'Spaghetti Bolognaise',price: 950, icon: '🍝', active: true, stock: true },
      { id: 602, catId: 6, name: 'Pasta Carbonara',   price: 1050, icon: '🍝', active: true, stock: true },
      { id: 603, catId: 6, name: 'Penne Arrabbiata',  price: 900,  icon: '🍜', active: true, stock: true },
      // Desserts
      { id: 701, catId: 7, name: 'Tiramisu',          price: 450,  icon: '☕', active: true, stock: true },
      { id: 702, catId: 7, name: 'Crème Brûlée',      price: 400,  icon: '🍮', active: true, stock: true },
      { id: 703, catId: 7, name: 'Baklava',           price: 300,  icon: '🍯', active: true, stock: true },
      { id: 704, catId: 7, name: 'Glace 2 boules',    price: 250,  icon: '🍨', active: true, stock: true },
      // Boissons
      { id: 801, catId: 8, name: 'Eau Minérale',      price: 100,  icon: '💧', active: true, stock: true },
      { id: 802, catId: 8, name: 'Soda 33cl',         price: 200,  icon: '🥤', active: true, stock: true },
      { id: 803, catId: 8, name: 'Jus d\'Orange',     price: 300,  icon: '🍊', active: true, stock: true },
      { id: 804, catId: 8, name: 'Café Express',      price: 150,  icon: '☕', active: true, stock: true },
      { id: 805, catId: 8, name: 'Thé à la Menthe',   price: 120,  icon: '🍵', active: true, stock: true },
      // Extras
      { id: 901, catId: 9, name: 'Pain',              price: 50,   icon: '🍞', active: true, stock: true },
      { id: 902, catId: 9, name: 'Frites',            price: 250,  icon: '🍟', active: true, stock: true },
      { id: 903, catId: 9, name: 'Salade de Riz',     price: 150,  icon: '🍚', active: true, stock: true },
    ]);

    // Tables
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      tables.push({ id: i, label: `Table ${i}`, capacity: i % 4 === 0 ? 6 : 4, status: 'free', currentOrderId: null });
    }
    set('tables', tables);

    // Users / Staff
    set('users', [
      { id: 1, name: 'Admin',       username: 'admin',   password: '1234', role: 'manager', active: true },
      { id: 2, name: 'Caissier 1',  username: 'caisse1', password: '1111', role: 'cashier', active: true },
      { id: 3, name: 'Caissier 2',  username: 'caisse2', password: '2222', role: 'cashier', active: true },
      { id: 4, name: 'Serveur A',   username: 'serv1',   password: '3333', role: 'waiter',  active: true },
    ]);

    // Orders (empty initially)
    set('orders', []);
    set('order_counter', 1000);

    // Settings
    set('settings', {
      restaurantName: "R.Lynx™ RestFast",
      currency: 'DZD',
      tva: 9,
      ticketFooter: 'Merci de votre visite!',
      printerEnabled: false,
      soundEnabled: true,
      gestureMode: true,
      tableCount: 20,
    });
  };

  // ——— CRUD helpers ——— //
  const getAll = (table) => get(table, []);

  const getById = (table, id) => getAll(table).find(r => r.id === id) || null;

  const insert = (table, record) => {
    const rows = getAll(table);
    const id = record.id || (Date.now());
    const newRecord = { ...record, id };
    rows.push(newRecord);
    set(table, rows);
    return newRecord;
  };

  const update = (table, id, updates) => {
    const rows = getAll(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...updates };
    set(table, rows);
    return rows[idx];
  };

  const del = (table, id) => {
    const rows = getAll(table).filter(r => r.id !== id);
    set(table, rows);
    return true;
  };

  // ——— Order-specific helpers ——— //
  const nextOrderNumber = () => {
    const n = get('order_counter', 1000) + 1;
    set('order_counter', n);
    return n;
  };

  const createOrder = (tableId, cashierId) => {
    const num = nextOrderNumber();
    const order = {
      id: Date.now(),
      number: num,
      tableId,
      cashierId,
      items: [],
      status: 'open',          // open | paid | cancelled
      paymentMethod: null,
      subtotal: 0,
      tva: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      closedAt: null,
      note: '',
    };
    return insert('orders', order);
  };

  const addItemToOrder = (orderId, item, qty = 1) => {
    const order = getById('orders', orderId);
    if (!order) return null;
    const existingIdx = order.items.findIndex(i => i.itemId === item.id);
    if (existingIdx > -1) {
      order.items[existingIdx].qty += qty;
      order.items[existingIdx].lineTotal = order.items[existingIdx].qty * item.price;
    } else {
      order.items.push({
        itemId: item.id,
        name: item.name,
        icon: item.icon,
        price: item.price,
        qty,
        lineTotal: item.price * qty,
        note: '',
      });
    }
    _recalcOrder(order);
    return update('orders', orderId, order);
  };

  const removeItemFromOrder = (orderId, itemId) => {
    const order = getById('orders', orderId);
    if (!order) return null;
    order.items = order.items.filter(i => i.itemId !== itemId);
    _recalcOrder(order);
    return update('orders', orderId, order);
  };

  const updateItemQty = (orderId, itemId, qty) => {
    if (qty <= 0) return removeItemFromOrder(orderId, itemId);
    const order = getById('orders', orderId);
    if (!order) return null;
    const item = order.items.find(i => i.itemId === itemId);
    if (!item) return null;
    item.qty = qty;
    item.lineTotal = qty * item.price;
    _recalcOrder(order);
    return update('orders', orderId, order);
  };

  const closeOrder = (orderId, paymentMethod) => {
    const settings = get('settings', {});
    const tvaRate = (settings.tva || 9) / 100;
    const order = getById('orders', orderId);
    if (!order) return null;
    const subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);
    const tva = Math.round(subtotal * tvaRate);
    return update('orders', orderId, {
      status: 'paid',
      paymentMethod,
      subtotal,
      tva,
      total: subtotal + tva,
      closedAt: new Date().toISOString(),
    });
  };

  const _recalcOrder = (order) => {
    const settings = get('settings', {});
    const tvaRate = (settings.tva || 9) / 100;
    order.subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);
    order.tva = Math.round(order.subtotal * tvaRate);
    order.total = order.subtotal + order.tva;
  };

  // ——— Report queries ——— //
  const getTodayOrders = () => {
    const today = new Date().toDateString();
    return getAll('orders').filter(o =>
      o.status === 'paid' && new Date(o.closedAt).toDateString() === today
    );
  };

  const getOrdersByDate = (from, to) => {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime() + 86400000;
    return getAll('orders').filter(o =>
      o.status === 'paid' &&
      new Date(o.closedAt).getTime() >= f &&
      new Date(o.closedAt).getTime() <= t
    );
  };

  const getDailySalesSummary = () => {
    const orders = getTodayOrders();
    return {
      count: orders.length,
      revenue: orders.reduce((s, o) => s + o.total, 0),
      avgTicket: orders.length ? Math.round(orders.reduce((s,o)=>s+o.total,0)/orders.length) : 0,
    };
  };

  return {
    init, get, set, remove, getAll, getById, insert, update, del,
    createOrder, addItemToOrder, removeItemFromOrder, updateItemQty,
    closeOrder, nextOrderNumber,
    getTodayOrders, getOrdersByDate, getDailySalesSummary,
  };
})();

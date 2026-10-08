const API_BASE = (window.HOTEL_API_BASE_URL || localStorage.getItem("hotelApiBaseUrl") || "http://localhost:8080/api").replace(/\/$/, "");
const app = document.getElementById("app");
const toastRegion = document.getElementById("toast-region");
const page = document.body.dataset.page || "welcome";
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = "assets/hotel-mark.svg";
document.head.append(favicon);
const navItems = [
  ["dashboard", "Dashboard", "▦"], ["rooms", "Rooms", "⌂"], ["bookings", "Bookings", "▤"],
  ["customers", "Customers", "♧"], ["food", "Food & orders", "◇"],
  ["check-in", "Check-in", "↘"], ["check-out", "Check-out", "↗"], ["billing", "Billing", "₹"],
  ["about", "About", "i"]
];
const pageTitles = {
  dashboard: ["Good to see you", "A clear view of today's hotel operations."],
  rooms: ["Rooms", "Room inventory, categories and live availability."],
  bookings: ["Bookings", "Guest stays, reservations and room assignment."],
  customers: ["Customers", "Guest profiles gathered from hotel reservations."],
  food: ["Dining & room service", "Menu, room orders and live food subtotals."],
  "check-in": ["Guest check-in", "Welcome arriving guests and assign occupied rooms."],
  "check-out": ["Guest check-out", "Settle room service, services and the final bill."],
  billing: ["Billing", "Completed stays and their itemized invoices."],
  invoice: ["Invoice", "A printable statement for a completed stay."],
  about: ["The Grand Hotel", "Thoughtful stays, carefully looked after." ]
};
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
const dateText = value => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "—";
const todayOffset = days => { const date = new Date(); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
  } catch {
    throw new Error(`Can't reach the hotel API at ${API_BASE}. Start the Spring Boot backend and try again.`);
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || payload?.message || `Request failed (${response.status}).`);
  return payload;
}
function toast(message, error = false) {
  const node = document.createElement("div");
  node.className = `toast${error ? " error" : ""}`;
  node.textContent = message;
  toastRegion.append(node);
  setTimeout(() => node.remove(), 4200);
}
function navHref(key) { return key === "dashboard" ? "dashboard.html" : `${key}.html`; }
function shell(content, active = page) {
  const user = JSON.parse(localStorage.getItem("hotelUser") || "null");
  return `<div class="app-frame">
    <header class="topbar"><a class="brand" href="dashboard.html"><span class="brand-mark">G</span><span><span class="brand-name">Grand Hotel</span><br><span class="brand-sub">Guest services</span></span></a>
      <div class="topbar-right"><span class="api-indicator">Live hotel system</span><div class="user-chip"><span class="user-avatar">${esc((user?.name || "H").slice(0, 1).toUpperCase())}</span><span><span class="user-name">${esc(user?.name || "Hotel team")}</span><br><span class="user-role">${esc(user?.role || "Staff")}</span></span></div></div>
    </header>
    <div class="workspace"><aside class="sidebar"><div class="side-label">Hotel operations</div><nav class="nav-list">${navItems.map(([key, label, icon]) => `<a class="nav-link${active === key ? " active" : ""}" href="${navHref(key)}"><span class="nav-icon">${icon}</span>${label}</a>`).join("")}</nav><div class="sidebar-bottom"><button class="nav-link" data-action="logout" style="width:100%;border:0;background:transparent;text-align:left"><span class="nav-icon">↪</span>Log out</button><div style="padding:10px 12px 0">In-memory edition · v1.0</div></div></aside>
    <main class="main">${content}</main></div></div>`;
}
function heading(title, description, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">Grand Hotel · Operations</div><h1>${title}</h1><p class="page-description">${description}</p></div>${action}</div>`;
}
function empty(title, description) { return `<div class="empty-state"><strong>${title}</strong>${description}</div>`; }
function statusTag(status) { return `<span class="status ${esc(status)}">${esc(String(status).replaceAll("_", " "))}</span>`; }
function table(headers, rows, emptyMessage = "No records to show yet.") {
  return rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map(item => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>` : empty("Nothing here yet", emptyMessage);
}
function dialog(id, title, body) {
  return `<dialog id="${id}"><div class="dialog-head"><h2>${title}</h2><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close">×</button></div><div class="dialog-body">${body}</div></dialog>`;
}
async function renderWelcome() {
  app.innerHTML = `<div class="welcome"><nav class="welcome-nav"><a class="brand" href="index.html"><span class="brand-mark">G</span><span class="brand-name">Grand Hotel</span></a><div class="welcome-links"><a href="about.html">Our hotel</a><a class="button secondary" style="color:white;border-color:rgba(255,255,255,.45)" href="login.html">Staff sign in</a></div></nav><section class="welcome-content"><div class="eyebrow">A considered stay, every time</div><h1>Welcome to<br>Grand Hotel.</h1><p>Warm hospitality, thoughtful details and a team that makes every arrival feel easy.</p><a class="button" href="login.html">Enter hotel operations <span aria-hidden="true">→</span></a></section></div>`;
}
function renderAuth(signup = false) {
  const form = signup ? `<form class="form-grid" data-form="signup"><div class="field full"><label for="name">Your name</label><input id="name" name="name" required autocomplete="name"></div><div class="field full"><label for="email">Work email</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="field full"><label for="password">Password</label><input id="password" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="form-actions"><button class="button" type="submit">Create staff account</button></div></form>` : `<form class="form-grid" data-form="login"><div class="field full"><label for="email">Email address</label><input id="email" name="email" type="email" required autocomplete="username" value="manager@grandhotel.com"></div><div class="field full"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password" value="Hotel@123"></div><div class="form-actions"><button class="button" type="submit">Sign in</button></div></form>`;
  app.innerHTML = `<div class="auth-page"><section class="auth-visual"><a class="brand" href="index.html"><span class="brand-mark">G</span><span class="brand-name">Grand Hotel</span></a><div><div class="eyebrow">The art of looking after people</div><h1>${signup ? "A good stay starts with a good team." : "Every detail, in good hands."}</h1><p>One calm place to keep arrivals, rooms, dining and guest accounts in step.</p></div><div style="font-size:11px;color:rgba(255,255,255,.65)">GRAND HOTEL · HOSPITALITY, MADE PERSONAL</div></section><section class="auth-form-wrap"><div class="eyebrow">Staff portal</div><h1>${signup ? "Create your account" : "Welcome back"}</h1><p class="page-description">${signup ? "Set up access to hotel operations." : "Sign in to manage today's stay."}</p>${form}<p class="auth-switch">${signup ? "Already on the team?" : "New to the hotel team?"} <a href="${signup ? "login.html" : "signup.html"}">${signup ? "Sign in" : "Create account"}</a></p></section></div>`;
}
async function renderDashboard() {
  const data = await api("/dashboard");
  const stats = [["Rooms", data.rooms, `${data.availableRooms} available`], ["Occupied", data.occupiedRooms, `${data.rooms ? Math.round(data.occupiedRooms / data.rooms * 100) : 0}% occupancy`], ["Active stays", data.activeBookings, "Reserved or checked in"], ["Revenue", money(data.revenue), "Completed invoices"]];
  const cards = stats.map(([label, value, note]) => `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`).join("");
  const rows = data.recentBookings.map(booking => `<tr><td><span class="cell-primary">${esc(booking.name)}</span><div class="cell-secondary">${esc(booking.id)}</div></td><td>${esc(booking.roomId)}</td><td>${dateText(booking.checkIn)} – ${dateText(booking.checkOut)}</td><td>${statusTag(booking.status)}</td><td>${money(booking.totalRoomCharge)}</td></tr>`);
  app.innerHTML = shell(`${heading("Good to see you", "A clear view of today's hotel operations.", `<a class="button" href="bookings.html">＋ New booking</a>`)}<section class="stats-grid">${cards}</section><section class="panel"><div class="panel-header"><h2>Recent reservations</h2><a class="button secondary small" href="bookings.html">All bookings →</a></div>${table(["Guest", "Room", "Stay", "Status", "Room total"], rows, "New reservations will appear here.")}</section><section class="stats-grid" style="margin-top:15px;margin-bottom:0"><div class="stat-card"><div class="stat-label">Arrivals today</div><div class="stat-value">${data.todayArrivals}</div><a class="stat-note" href="check-in.html">Open check-in →</a></div><div class="stat-card"><div class="stat-label">Departures today</div><div class="stat-value">${data.todayDepartures}</div><a class="stat-note" href="check-out.html">Open check-out →</a></div><div class="stat-card"><div class="stat-label">Guest profiles</div><div class="stat-value">${data.customers}</div><a class="stat-note" href="customers.html">View customers →</a></div><div class="stat-card"><div class="stat-label">Service</div><div class="stat-value" style="font-size:18px">Connected</div><div class="stat-note">Spring Boot · In-memory</div></div></section>`);
}
async function renderRooms() {
  const rooms = await api("/rooms");
  const roomCards = rooms.map(room => `<article class="room-card" data-category="${esc(room.category)}"><div class="room-band"></div><div class="room-card-body"><div class="room-card-top"><span class="room-number">${esc(room.number)}</span>${statusTag(room.status)}</div><div class="room-details">${esc(room.category)} · ${esc(room.type)}<br>Room ${esc(room.id)}</div><div class="room-price">${money(room.price)} <span style="font-size:10px;font-weight:400;color:var(--muted)">/ night</span></div></div></article>`).join("");
  const modal = dialog("room-dialog", "Add a room", `<form class="form-grid inline-form" data-form="room"><div class="field"><label>Room number</label><input name="number" type="number" min="1" placeholder="Auto assign"></div><div class="field"><label>Category</label><select name="category" required><option>Platinum</option><option>Golden</option><option>Silver</option></select></div><div class="field"><label>Room type</label><select name="type"><option>AC</option><option>Non-AC</option></select></div><div class="field"><label>Rate per night (₹)</label><input name="price" type="number" min="1" step="0.01" required></div><div class="form-actions"><button class="button" type="submit">Save room</button></div></form>`);
  app.innerHTML = shell(`${heading("Rooms", "Room inventory, categories and live availability.", `<button class="button" data-action="open-dialog" data-dialog="room-dialog">＋ Add room</button>`)}<div class="filters" style="margin-bottom:16px"><select class="filter-select" data-filter-category><option value="">All categories</option><option>Platinum</option><option>Golden</option><option>Silver</option></select><select class="filter-select" data-filter-status><option value="">All statuses</option><option>AVAILABLE</option><option>RESERVED</option><option>OCCUPIED</option><option>CLEANING</option><option>MAINTENANCE</option></select><span class="page-description" style="align-self:center">${rooms.length} rooms in inventory</span></div><section class="room-grid">${roomCards || empty("No rooms found", "Add a room to begin.")}</section>${modal}`);
}
function bookingForm(rooms) {
  const options = rooms.filter(room => !["MAINTENANCE", "CLEANING", "OCCUPIED"].includes(room.status)).map(room => `<option value="${esc(room.id)}">${esc(room.number)} · ${esc(room.category)} ${esc(room.type)} · ${money(room.price)}/night</option>`).join("");
  return `<form class="form-grid inline-form" data-form="booking"><div class="field"><label>Guest name</label><input name="name" required autocomplete="name"></div><div class="field"><label>Mobile number</label><input name="mobile" required type="tel" autocomplete="tel"></div><div class="field"><label>Email address</label><input name="email" required type="email" autocomplete="email"></div><div class="field"><label>Home town</label><input name="homeTown" required></div><div class="field full"><label>Home address</label><textarea name="address" required></textarea></div><div class="field"><label>Government ID</label><input name="governmentId" required></div><div class="field"><label>Number of guests</label><input name="guests" type="number" min="1" max="12" value="1" required></div><div class="field"><label>Check-in</label><input name="checkIn" type="date" min="${todayOffset(0)}" value="${todayOffset(1)}" required></div><div class="field"><label>Check-out</label><input name="checkOut" type="date" min="${todayOffset(1)}" value="${todayOffset(2)}" required></div><div class="field full"><label>Room</label><select name="roomId" required><option value="">Select a room</option>${options}</select></div><div class="form-actions"><button class="button" type="submit">Create reservation</button><span class="page-description">Nights and room total are calculated on save.</span></div></form>`;
}
async function renderBookings() {
  const [bookings, rooms] = await Promise.all([api("/bookings"), api("/rooms")]);
  const rows = bookings.map(b => `<tr><td><span class="cell-primary">${esc(b.name)}</span><div class="cell-secondary">${esc(b.id)} · ${esc(b.mobile)}</div></td><td>${esc(b.roomId)}<div class="cell-secondary">${b.guests} guest${b.guests === 1 ? "" : "s"}</div></td><td>${dateText(b.checkIn)} – ${dateText(b.checkOut)}<div class="cell-secondary">${b.nights} night${b.nights === 1 ? "" : "s"}</div></td><td>${statusTag(b.status)}</td><td>${money(b.totalRoomCharge)}</td><td>${b.status === "RESERVED" ? `<button class="button small" data-action="checkin" data-id="${esc(b.id)}">Check in</button>` : b.status === "CHECKED_IN" ? `<button class="button small" data-action="checkout" data-id="${esc(b.id)}">Check out</button>` : `<button class="button secondary small" data-action="invoice" data-id="${esc(b.id)}">Invoice</button>`}</td></tr>`);
  const modal = dialog("booking-dialog", "New reservation", bookingForm(rooms));
  app.innerHTML = shell(`${heading("Bookings", "Guest stays, reservations and room assignment.", `<button class="button" data-action="open-dialog" data-dialog="booking-dialog">＋ New booking</button>`)}<section class="panel"><div class="panel-header"><h2>All reservations</h2><span class="page-description">${bookings.length} total</span></div>${table(["Guest", "Room", "Stay", "Status", "Room total", "Action"], rows, "Create a reservation to see it here.")}</section>${modal}`);
}
async function renderCustomers() {
  const customers = await api("/customers");
  const rows = customers.map(c => `<tr><td><span class="cell-primary">${esc(c.name)}</span><div class="cell-secondary">${esc(c.id)}</div></td><td>${esc(c.mobile)}</td><td>${esc(c.email)}</td><td>${esc(c.homeTown || "—")}</td><td>${c.bookings}</td><td>${esc(c.governmentId)}</td></tr>`);
  app.innerHTML = shell(`${heading("Customers", "Guest profiles gathered from hotel reservations.")}<section class="panel"><div class="panel-header"><h2>Guest directory</h2><span class="page-description">${customers.length} profiles</span></div>${table(["Guest", "Mobile", "Email", "Home town", "Stays", "Government ID"], rows, "Guest profiles will appear after the first reservation.")}</section>`);
}
function foodCard(item, orderForm = false) {
  return `<article class="food-card"><div class="food-card-body"><span class="food-category">${esc(item.category)}</span><h3>${esc(item.name)}</h3><p class="food-description">${esc(item.description || "Prepared fresh by our kitchen.")}</p><div class="food-card-bottom"><span class="food-price">${money(item.price)}</span>${orderForm ? `<label class="qty-control"><input class="food-order-check" type="checkbox" data-food="${esc(item.id)}" aria-label="Add ${esc(item.name)} to order"><input class="filter-select food-order-quantity" id="qty-${esc(item.id)}" type="number" min="1" max="99" value="1" style="min-width:65px;width:65px;min-height:30px;padding:4px" aria-label="Quantity"></label>` : ""}</div></div></article>`;
}
async function renderFood() {
  const [menu, bookings, orders] = await Promise.all([api("/food"), api("/bookings"), api("/food/orders")]);
  const options = bookings.filter(b => b.status !== "CHECKED_OUT").map(b => `<option value="${esc(b.id)}">${esc(b.name)} · ${esc(b.id)} · ${esc(b.status)}</option>`).join("");
  const menuDialog = dialog("food-dialog", "Add to menu", `<form class="form-grid inline-form" data-form="food"><div class="field"><label>Item name</label><input name="name" required></div><div class="field"><label>Category</label><select name="category"><option>Chinese</option><option>South Indian</option><option>North Indian</option><option>Snacks</option><option>Beverages</option><option>Desserts</option></select></div><div class="field full"><label>Description</label><input name="description"></div><div class="field"><label>Price (₹)</label><input name="price" type="number" min="1" step="0.01" required></div><div class="form-actions"><button class="button" type="submit">Add menu item</button></div></form>`);
  const foodSelect = `<select class="filter-select" name="bookingId" required><option value="">Select guest booking</option>${options}</select>`;
  const menuCards = menu.map(item => foodCard(item, true)).join("");
  const orderRows = orders.map(order => {
    const lines = Object.entries(order.items).map(([foodId, quantity]) => { const item = menu.find(entry => entry.id === foodId); return `<div class="order-line"><div class="order-info"><div class="cell-primary">${esc(item?.name || "Menu item")}</div><div class="cell-secondary">${quantity} × ${money(item?.price || 0)}</div></div><div class="qty-control"><button data-action="quantity" data-order="${esc(order.id)}" data-food="${esc(foodId)}" data-quantity="${quantity - 1}" aria-label="Decrease quantity">−</button><span class="qty">${quantity}</span><button data-action="quantity" data-order="${esc(order.id)}" data-food="${esc(foodId)}" data-quantity="${quantity + 1}" aria-label="Increase quantity">+</button></div></div>`; }).join("");
    return `<article class="panel" style="margin-bottom:12px"><div class="panel-header"><div><h3 style="margin:0">${esc(order.bookingId)}</h3><div class="cell-secondary">Order ${esc(order.id)}</div></div><button class="button danger small" data-action="delete-order" data-id="${esc(order.id)}">Remove order</button></div><div class="panel-body">${lines || `<p class="page-description">No items on this order.</p>`}<div class="order-footer"><span class="page-description">Subtotal</span><strong>${money(order.total)}</strong></div></div></article>`;
  }).join("");
  app.innerHTML = shell(`${heading("Dining & room service", "Menu, room orders and live food subtotals.", `<button class="button secondary" data-action="open-dialog" data-dialog="food-dialog">＋ Add menu item</button>`)}<div class="two-column"><section><div class="panel" style="margin-bottom:18px"><div class="panel-header"><h2>Create food order</h2></div><form class="inline-form" data-form="order"><div class="field" style="margin-bottom:16px"><label>Associate with booking</label>${foodSelect}</div><div class="food-grid">${menuCards || empty("Menu is empty", "Add food items to begin.")}</div><div class="form-actions" style="margin-top:14px"><button class="button" type="submit">Add selected items</button><span class="page-description">Subtotal is calculated by the API.</span></div></form></div></section><aside><div class="panel"><div class="panel-header"><h2>Room orders</h2><span class="page-description">${orders.length}</span></div><div class="panel-body">${orderRows || empty("No food orders", "Orders placed for a booking appear here.")}</div></div></aside></div>${menuDialog}`);
}
async function renderCheck(pageMode) {
  const bookings = await api("/bookings");
  const desired = pageMode === "check-in" ? "RESERVED" : "CHECKED_IN";
  const list = bookings.filter(b => b.status === desired);
  const rows = list.map(b => `<tr><td><span class="cell-primary">${esc(b.name)}</span><div class="cell-secondary">${esc(b.id)} · ${esc(b.mobile)}</div></td><td>${esc(b.roomId)}</td><td>${dateText(b.checkIn)} – ${dateText(b.checkOut)}<div class="cell-secondary">${b.nights} night${b.nights === 1 ? "" : "s"}</div></td><td>${statusTag(b.status)}</td><td>${pageMode === "check-in" ? `<button class="button small" data-action="checkin" data-id="${esc(b.id)}">Complete check-in</button>` : `<button class="button small" data-action="checkout" data-id="${esc(b.id)}">Review & check out</button>`}</td></tr>`);
  const checkoutDialog = pageMode === "check-out" ? dialog("checkout-dialog", "Complete checkout", `<form class="form-grid inline-form" data-form="checkout"><input type="hidden" name="bookingId"><p class="field full page-description" data-checkout-guest></p><div class="field"><label>Additional services (₹)</label><input name="services" type="number" min="0" step="0.01" value="0"></div><div class="field"><label>Discount (₹)</label><input name="discount" type="number" min="0" step="0.01" value="0"></div><div class="field full"><p class="page-description">Room service is included automatically. Tax is calculated at 10% of the discounted subtotal.</p></div><div class="form-actions"><button class="button" type="submit">Generate invoice & check out</button></div></form>`) : "";
  app.innerHTML = shell(`${heading(pageMode === "check-in" ? "Guest check-in" : "Guest check-out", pageMode === "check-in" ? "Welcome arriving guests and assign occupied rooms." : "Settle room service, services and the final bill.", `<a class="button secondary" href="bookings.html">All bookings</a>`)}<section class="panel"><div class="panel-header"><h2>${pageMode === "check-in" ? "Reserved arrivals" : "Guests ready to depart"}</h2><span class="page-description">${list.length} guest${list.length === 1 ? "" : "s"}</span></div>${table(["Guest", "Room", "Stay", "Status", "Action"], rows, pageMode === "check-in" ? "No reservations are awaiting check-in." : "No checked-in guests are awaiting checkout.")}</section>${checkoutDialog}`);
}
async function renderBilling() {
  const bookings = await api("/bookings");
  const complete = await Promise.all(bookings.filter(b => b.status === "CHECKED_OUT").map(b => api(`/bookings/${encodeURIComponent(b.id)}/invoice`).catch(() => null)));
  const invoices = complete.filter(Boolean);
  const rows = invoices.map(invoice => `<tr><td><span class="cell-primary">${esc(invoice.invoiceId)}</span><div class="cell-secondary">${esc(invoice.bookingId)}</div></td><td>${esc(invoice.guestName)}</td><td>${dateText(invoice.checkIn)} – ${dateText(invoice.checkOut)}</td><td>${money(invoice.grandTotal)}</td><td><a class="button secondary small" href="invoice.html?bookingId=${encodeURIComponent(invoice.bookingId)}">View invoice</a></td></tr>`);
  app.innerHTML = shell(`${heading("Billing", "Completed stays and their itemized invoices.")}<section class="panel"><div class="panel-header"><h2>Completed invoices</h2><span class="page-description">${invoices.length} invoices</span></div>${table(["Invoice", "Guest", "Stay", "Grand total", ""], rows, "Invoices are created when a checked-in guest checks out.")}</section>`);
}
function invoiceMarkup(invoice) {
  const lines = [["Room charges", invoice.roomCharges], ["Food & room service", invoice.foodCharges], ["Additional services", invoice.services], ["Tax", invoice.tax], ["Discount", -invoice.discount]];
  return `<section class="invoice-sheet" id="print-invoice"><div class="invoice-brand"><div><div class="brand" style="min-width:0"><span class="brand-mark">G</span><span><span class="brand-name">Grand Hotel</span><br><span class="brand-sub">Guest services</span></span></div><p class="page-description" style="margin-top:15px">A memorable stay, thoughtfully delivered.</p></div><div class="invoice-title"><div class="eyebrow">Guest folio</div><h2 style="margin:7px 0;color:var(--ink)">${esc(invoice.invoiceId)}</h2><div>Issued ${new Date(invoice.generatedAt).toLocaleDateString("en-IN")}</div></div></div><div class="invoice-meta"><div><div class="eyebrow">Billed to</div><div class="cell-primary" style="margin-top:7px">${esc(invoice.guestName)}</div><div class="cell-secondary">Booking ${esc(invoice.bookingId)}</div></div><div><div class="eyebrow">Stay details</div><div class="cell-primary" style="margin-top:7px">Room ${esc(invoice.roomId)}</div><div class="cell-secondary">${dateText(invoice.checkIn)} – ${dateText(invoice.checkOut)} · ${invoice.nights} night${invoice.nights === 1 ? "" : "s"}</div></div></div><div class="table-wrap"><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>${lines.map(([label, value]) => `<tr><td>${label}</td><td>${money(value)}</td></tr>`).join("")}</tbody></table></div><div class="invoice-total"><div class="grand"><span>Grand total</span><span>${money(invoice.grandTotal)}</span></div></div><p class="page-description" style="margin-top:35px">Thank you for choosing Grand Hotel. We hope to welcome you again soon.</p></section>`;
}
async function renderInvoice() {
  const queryId = new URLSearchParams(location.search).get("bookingId") || "";
  let invoice = null;
  let lookupError = "";
  if (queryId) { try { invoice = await api(`/bookings/${encodeURIComponent(queryId)}/invoice`); } catch (error) { lookupError = error.message; } }
  const form = `<form class="filters print-hide" data-form="invoice-search"><label class="field"><span class="page-description">Booking ID</span><input class="filter-select" name="bookingId" placeholder="BK-..." value="${esc(queryId)}" required></label><button class="button" type="submit">Find invoice</button>${invoice ? `<button class="button secondary" type="button" data-action="print">Print bill</button>` : ""}</form>`;
  const content = invoice ? invoiceMarkup(invoice) : `<section class="panel"><div class="panel-body">${lookupError ? empty("Invoice not available", esc(lookupError)) : empty("Find an invoice", "Enter a booking ID after checkout to view the printable bill.")}</div></section>`;
  app.innerHTML = shell(`${heading("Invoice", "A printable statement for a completed stay.", form)}${content}`);
}
function renderAbout() {
  app.innerHTML = shell(`${heading("The Grand Hotel", "Thoughtful stays, carefully looked after.")}<section class="about-grid"><div class="about-copy"><div class="eyebrow">Hospitality, made personal</div><h2 style="font-size:28px">A little more considered.</h2><p class="page-description" style="line-height:1.9">Grand Hotel brings warm, attentive service to every part of a stay. This operations desk keeps the details together, from the first reservation through a fond farewell.</p><p class="page-description" style="line-height:1.9">Manage guest profiles, room inventory, dining orders and clear, itemized bills from one place.</p><span class="status">In-memory edition</span></div><div class="about-image" role="img" aria-label="Grand hotel exterior"></div></section>`);
}
async function loadPage() {
  if (page === "welcome") return renderWelcome();
  if (page === "login") return renderAuth(false);
  if (page === "signup") return renderAuth(true);
  if (page === "dashboard") return renderDashboard();
  if (page === "rooms") return renderRooms();
  if (page === "bookings") return renderBookings();
  if (page === "customers") return renderCustomers();
  if (page === "food") return renderFood();
  if (page === "check-in" || page === "check-out") return renderCheck(page);
  if (page === "billing") return renderBilling();
  if (page === "invoice") return renderInvoice();
  if (page === "about") return renderAbout();
  return renderWelcome();
}
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
function jsonOptions(method, body) { return { method, body: JSON.stringify(body) }; }
app.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  try {
    if (action === "logout") { localStorage.removeItem("hotelToken"); localStorage.removeItem("hotelUser"); location.href = "index.html"; }
    if (action === "open-dialog") document.getElementById(button.dataset.dialog)?.showModal();
    if (action === "close-dialog") button.closest("dialog")?.close();
    if (action === "print") window.print();
    if (action === "checkin") { button.disabled = true; await api(`/bookings/${encodeURIComponent(button.dataset.id)}/check-in`, { method: "POST" }); toast("Guest checked in. Room marked occupied."); await loadPage(); }
    if (action === "checkout") {
      const booking = await api(`/bookings/${encodeURIComponent(button.dataset.id)}`);
      const form = document.querySelector('[data-form="checkout"]');
      if (form) { form.elements.bookingId.value = booking.id; document.querySelector("[data-checkout-guest]").textContent = `${booking.name} · Room ${booking.roomId} · ${booking.nights} nights · Room charges ${money(booking.totalRoomCharge)}.`; document.getElementById("checkout-dialog").showModal(); }
    }
    if (action === "invoice") location.href = `invoice.html?bookingId=${encodeURIComponent(button.dataset.id)}`;
    if (action === "quantity") { button.disabled = true; await api(`/food/orders/${encodeURIComponent(button.dataset.order)}/items/${encodeURIComponent(button.dataset.food)}`, jsonOptions("PATCH", { quantity: Number(button.dataset.quantity) })); await renderFood(); }
    if (action === "delete-order") { if (confirm("Remove this food order?")) { await api(`/food/orders/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" }); toast("Food order removed."); await renderFood(); } }
  } catch (error) { toast(error.message, true); button.disabled = false; }
});
app.addEventListener("change", event => {
  if (event.target.matches("[data-filter-category], [data-filter-status]")) {
    const category = document.querySelector("[data-filter-category]")?.value;
    const status = document.querySelector("[data-filter-status]")?.value;
    document.querySelectorAll(".room-card").forEach(card => {
      const categoryMatch = !category || card.dataset.category === category;
      const statusMatch = !status || card.querySelector(".status")?.textContent === status.replaceAll("_", " ");
      card.hidden = !(categoryMatch && statusMatch);
    });
  }
});
app.addEventListener("submit", async event => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  const values = formData(form);
  try {
    switch (form.dataset.form) {
      case "login":
      case "signup": {
        const result = await api(form.dataset.form === "login" ? "/auth/login" : "/auth/signup", jsonOptions("POST", values));
        localStorage.setItem("hotelToken", result.token);
        localStorage.setItem("hotelUser", JSON.stringify(result.user));
        location.href = "dashboard.html";
        return;
      }
      case "room":
        await api("/rooms", jsonOptions("POST", { ...values, number: Number(values.number || 0), price: Number(values.price) }));
        toast("Room added to inventory.");
        await renderRooms();
        return;
      case "booking": {
        const booking = await api("/bookings", jsonOptions("POST", { ...values, guests: Number(values.guests) }));
        toast(`Reservation ${booking.id} created for ${booking.nights} nights.`);
        await renderBookings();
        return;
      }
      case "food":
        await api("/food", jsonOptions("POST", { ...values, price: Number(values.price) }));
        toast("Menu item added.");
        await renderFood();
        return;
      case "order": {
        const items = Object.fromEntries([...form.querySelectorAll(".food-order-check:checked")].map(check => [check.dataset.food, Number(form.querySelector(`#qty-${CSS.escape(check.dataset.food)}`).value)]));
        await api("/food/orders", jsonOptions("POST", { bookingId: values.bookingId, items }));
        toast("Food order added to the booking.");
        await renderFood();
        return;
      }
      case "checkout": {
        const invoice = await api(`/bookings/${encodeURIComponent(values.bookingId)}/check-out`, jsonOptions("POST", { services: Number(values.services || 0), discount: Number(values.discount || 0) }));
        toast("Checkout complete. Invoice generated.");
        location.href = `invoice.html?bookingId=${encodeURIComponent(invoice.bookingId)}`;
        return;
      }
      case "invoice-search":
        location.href = `invoice.html?bookingId=${encodeURIComponent(values.bookingId.trim())}`;
        return;
    }
  } catch (error) { toast(error.message, true); }
  finally { if (submit?.isConnected) submit.disabled = false; }
});

loadPage().catch(error => {
  app.innerHTML = shell(`${heading(pageTitles[page]?.[0] || "Hotel operations", pageTitles[page]?.[1] || "") }<section class="panel"><div class="error-state"><strong>We couldn't load this page.</strong><p>${esc(error.message)}</p><button class="button secondary" data-action="reload">Try again</button></div></section>`);
});
app.addEventListener("click", event => { if (event.target.closest('[data-action="reload"]')) loadPage().catch(error => toast(error.message, true)); });

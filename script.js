// =======================================================
// Reunite (FBLA School Lost-and-Found) - State Ready Build
// Offline-first Demo Mode + Role-based Login + Admin Review
// AI-assisted matching uses offline perceptual hashing (dHash)
// =======================================================

/**
 * ✅ FBLA reliability strategy:
 * - DEMO_MODE = true (recommended for state judging)
 * - Everything works offline via localStorage.
 * - If you later want to wire Supabase, you can add it behind DEMO_MODE = false.
 */
const DEMO_MODE = true;
const ADMIN_ACCESS_CODE = "FBLA2025"; // change if desired

// ------------------------------
// Storage Keys
// ------------------------------
const LS_KEYS = {
  session: "reunite_session",
  items: "reunite_items",
  claims: "reunite_claims",
  audit: "reunite_audit"
};

// ------------------------------
// In-memory state
// ------------------------------
let currentUser = null; // { role, name, email }
let items = [];         // item objects
let claims = [];        // claim objects

// ------------------------------
// Helpers
// ------------------------------
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function setGlobalStatus(msg) {
  const el = document.getElementById("globalStatus");
  if (el) el.textContent = msg || "";
}

function saveAll() {
  localStorage.setItem(LS_KEYS.items, JSON.stringify(items));
  localStorage.setItem(LS_KEYS.claims, JSON.stringify(claims));
}

function loadAll() {
  items = JSON.parse(localStorage.getItem(LS_KEYS.items) || "[]");
  claims = JSON.parse(localStorage.getItem(LS_KEYS.claims) || "[]");
}

function saveSession() {
  localStorage.setItem(LS_KEYS.session, JSON.stringify(currentUser));
}

function loadSession() {
  const s = localStorage.getItem(LS_KEYS.session);
  currentUser = s ? JSON.parse(s) : null;
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------------------------------
// Navigation
// ------------------------------
function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach(sec => {
    sec.style.display = "none";
  });
  const target = document.getElementById(`page-${sectionId}`);
  if (target) target.style.display = "block";
}

function updateActiveNavLink(sectionId) {
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });
}

function navigateToSection(sectionId) {
  showSection(sectionId);
  updateActiveNavLink(sectionId);

  // refresh screens on entry
  if (sectionId === "found") renderFound();
  if (sectionId === "claim") renderClaimSelect();
  if (sectionId === "dashboard") renderDashboard();
  renderFound();
  if (sectionId === "admin") renderAdmin(); renderAudit();
}

// expose for onclick
window.navigateToSection = navigateToSection;

// ------------------------------
// Modals
// ------------------------------
function openLoginModal() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modal.classList.add("show"));
  document.getElementById("loginStatus").textContent = "";
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }, 250);
}

window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

// ------------------------------
// Role Login
// ------------------------------
function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
    const dashboardBtn = document.getElementById("dashboardBtn");
  const adminBtn = document.getElementById("adminBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (currentUser) {
    loginBtn.style.display = "none";
        dashboardBtn.style.display = (currentUser.role === "student") ? "block" : "none";
    logoutBtn.style.display = "block";
    adminBtn.style.display = isAdmin() ? "block" : "none";
    setGlobalStatus(`Signed in as ${currentUser.role}: ${currentUser.name || currentUser.email || "User"}`);
  } else {
    loginBtn.style.display = "block";
        dashboardBtn.style.display = "none";
    adminBtn.style.display = "none";
    logoutBtn.style.display = "none";
    setGlobalStatus("");
  }
}

function handleLogin() {
  const role = document.getElementById("loginRole").value;
  const name = document.getElementById("loginName").value.trim();
  const email = document.getElementById("loginEmail").value.trim();
  const code = document.getElementById("adminCode").value;

  const status = document.getElementById("loginStatus");

  if (!email || !email.includes("@")) {
    status.textContent = "Please enter a valid school email.";
    return;
  }

  if (role === "admin") {
    if (code !== ADMIN_ACCESS_CODE) {
      status.textContent = "Incorrect admin access code.";
      return;
    }
  }

  currentUser = { role, name, email };
  saveSession();
  updateAuthUI();
  closeLoginModal();

  navigateToSection(role === "admin" ? "admin" : "dashboard");
}

window.handleLogin = handleLogin;

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(LS_KEYS.session);
  updateAuthUI();
  navigateToSection("hero");
}

window.handleLogout = handleLogout;

// toggle admin code field
function handleRoleChange() {
  const role = document.getElementById("loginRole").value;
  const wrap = document.getElementById("adminCodeWrap");
  wrap.style.display = role === "admin" ? "block" : "none";
}
window.handleRoleChange = handleRoleChange;

// ------------------------------
// AI-Assisted Offline Image Matching (dHash)
// ------------------------------
function resizeImageToCanvas(file, w=9, h=8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dHashFromCanvas(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  // grayscale luminance array
  const lum = [];
  for (let y=0; y<height; y++) {
    for (let x=0; x<width; x++) {
      const i = (y*width + x)*4;
      const r = data[i], g = data[i+1], b = data[i+2];
      lum.push(0.299*r + 0.587*g + 0.114*b);
    }
  }

  // compare adjacent pixels horizontally
  let bits = "";
  for (let y=0; y<height; y++) {
    for (let x=0; x<width-1; x++) {
      const left = lum[y*width + x];
      const right = lum[y*width + (x+1)];
      bits += left > right ? "1" : "0";
    }
  }

  // bits length = height*(width-1) = 8*8 = 64
  // convert to hex
  let hex = "";
  for (let i=0; i<bits.length; i+=4) {
    hex += parseInt(bits.slice(i, i+4), 2).toString(16);
  }
  return hex;
}

function hammingHex(a, b) {
  if (!a || !b || a.length !== b.length) return 999;
  const nibbleBits = [
    0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4
  ];
  let dist = 0;
  for (let i=0; i<a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += nibbleBits[x];
  }
  return dist;
}

async function getImageHash(file) {
  if (!file) return null;
  const canvas = await resizeImageToCanvas(file, 9, 8);
  return dHashFromCanvas(canvas);
}

function aiMatchItem(hash) {
  // Compare against approved items that have hashes
  const approved = items.filter(it => it.is_approved && it.image_hash);
  if (!hash || approved.length === 0) return [];

  const scored = approved.map(it => {
    const dist = hammingHex(hash, it.image_hash);
    const similarity = Math.max(0, 100 - Math.round((dist/64)*100));
    return { item: it, dist, similarity };
  }).sort((a,b) => a.dist - b.dist);

  return scored.slice(0, 3);
}

// ------------------------------
// Items CRUD (Offline)
// ------------------------------
async function handleReportSubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById("reportStatus");
  const aiEl = document.getElementById("aiMatchStatus");
  statusEl.textContent = "";
  aiEl.textContent = "";

  // basic validation
  const title = document.getElementById("itemTitle").value.trim();
  const category = document.getElementById("itemCategory").value;
  const otherCat = document.getElementById("otherCategory").value.trim();
  const location = document.getElementById("itemLocation").value.trim();
  const dateFound = document.getElementById("itemDate").value;
  const desc = document.getElementById("itemDescription").value.trim();
  const cName = document.getElementById("contactName").value.trim();
  const cEmail = document.getElementById("contactEmail").value.trim();
  const cPhone = document.getElementById("contactPhone").value.trim();
  const file = document.getElementById("itemPhoto").files[0] || null;

  if (!title || !category || !location || !dateFound || !cName || !cEmail) {
    statusEl.textContent = "Please fill out all required fields.";
    return;
  }
  if (category === "Other" && !otherCat) {
    statusEl.textContent = "Please describe the category for “Other”.";
    return;
  }

  // AI hash (offline)
  let imgHash = null;
  try {
    imgHash = await getImageHash(file);
  } catch (err) {
    // Non-fatal
    imgHash = null;
  }

  // store small image preview for demo (optional)
  let photoDataUrl = null;
  if (file) {
    photoDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  const item = {
    id: uid("item"),
    title,
    category: category === "Other" ? `Other: ${otherCat}` : category,
    category_raw: category,
    other_category: otherCat || null,
    location,
    date_found: dateFound,
    description: desc,
    contact_name: cName,
    contact_email: cEmail,
    contact_phone: cPhone || null,
    status: "pending",
    is_approved: false,
    is_claimed: false,
    created_at: new Date().toISOString(),
    created_by: currentUser?.email || cEmail,
    image_hash: imgHash,
    photo_data_url: photoDataUrl
  };

  items.unshift(item);
  saveAll();

  statusEl.textContent = "Report submitted! It will appear after admin approval.";

  // show AI suggestions (if photo)
  const matches = aiMatchItem(imgHash);
  if (matches.length > 0) {
    aiEl.textContent = `AI-assisted matches: ${matches.map(m => `${m.item.title} (${m.similarity}%)`).join(", ")}`;
  } else if (file) {
    aiEl.textContent = "AI-assisted matching: no close matches found (yet).";
  }

  e.target.reset();
  document.getElementById("otherCategoryWrap").style.display = "none";
  renderAdmin(); renderAudit(); // if an admin is logged in and on admin page, refresh
}

function getFilteredApprovedItems() {
  const search = (document.getElementById("searchFilter")?.value || "").trim().toLowerCase();
  const category = document.getElementById("categoryFilter")?.value || "";
  const location = (document.getElementById("locationFilter")?.value || "").trim().toLowerCase();
  const date = document.getElementById("dateFilter")?.value || "";
  const sort = document.getElementById("sortFilter")?.value || "newest";

  let list = items.filter(it => it.is_approved && !it.is_claimed);

  if (search) {
    list = list.filter(it =>
      (it.title || "").toLowerCase().includes(search) ||
      (it.description || "").toLowerCase().includes(search)
    );
  }
  if (category) {
    if (category === "Other") {
      list = list.filter(it => (it.category_raw === "Other") || (it.category || "").startsWith("Other"));
    } else {
      list = list.filter(it => it.category_raw === category || it.category === category);
    }
  }
  if (location) {
    list = list.filter(it => (it.location || "").toLowerCase().includes(location));
  }
  if (date) {
    list = list.filter(it => it.date_found === date);
  }

  if (sort === "newest") list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  if (sort === "oldest") list.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  if (sort === "category") list.sort((a,b) => (a.category || "").localeCompare(b.category || ""));

  return list;
}

function renderFound(highlightIds = []) {
  const grid = document.getElementById("itemsGrid");
  const count = document.getElementById("itemsCount");
  if (!grid) return;

  const list = getFilteredApprovedItems();
  count.textContent = String(list.length);

  if (list.length === 0) {
    grid.innerHTML = '<div class="no-items">No items found matching your criteria.</div>';
    return;
  }

  grid.innerHTML = list.map((item, idx) => {
    const iconLetter = (item.category_raw || item.category || "I")[0];
    const dateStr = new Date(item.created_at).toLocaleDateString();
    return `
      <div class="item-card ${highlightIds.includes(item.id) ? "highlight" : ""}" onclick="openModal('${item.id}')" onmousemove="handleCardMouseMove(event, this)" onmouseleave="handleCardMouseLeave(this)" style="animation-delay:${idx*0.07}s">
        <div class="item-header">
          <div class="item-icon">${escapeHtml(iconLetter)}</div>
          <span class="status-badge status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        ${item.photo_data_url ? `<img class="item-thumb" src="${item.photo_data_url}" alt="Photo of ${escapeHtml(item.title)}">` : ``}
        <h3 class="item-title">${escapeHtml(item.title)}</h3>
        <div class="item-meta">Category: ${escapeHtml(item.category)}</div>
        <p class="item-description">${escapeHtml(item.description || "No description available")}</p>
        <div class="item-footer">
          <span>${escapeHtml(item.location)}</span>
          <span>${escapeHtml(dateStr)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function openModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById("modalTitle").textContent = item.title || "Unknown Item";
  document.getElementById("modalLocation").textContent = `Found at ${item.location || "Unknown location"}`;
  document.getElementById("modalDescription").textContent = item.description || "No description available";
  document.getElementById("modalContactName").textContent = item.contact_name || "Not provided";
  document.getElementById("modalContactEmail").textContent = item.contact_email || "Not provided";
  document.getElementById("modalContactPhone").textContent = item.contact_phone || "Not provided";
  document.getElementById("modalDate").textContent = item.date_found || new Date(item.created_at).toLocaleDateString();

  // Preselect claim dropdown if open later
  sessionStorage.setItem("reunite_last_item", item.id);

  const modal = document.getElementById("itemModal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modal.classList.add("show"));
}
window.openModal = openModal;

function closeModal() {
  const modal = document.getElementById("itemModal");
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }, 250);
}
window.closeModal = closeModal;

function handleCardMouseMove(event, card) {
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--mouse-x', `${x}%`);
  card.style.setProperty('--mouse-y', `${y}%`);
}
window.handleCardMouseMove = handleCardMouseMove;

function handleCardMouseLeave(card) {
  card.style.setProperty('--mouse-x', '50%');
  card.style.setProperty('--mouse-y', '50%');
}
window.handleCardMouseLeave = handleCardMouseLeave;

// ------------------------------
// Claim Form
// ------------------------------
function renderClaimSelect() {
  const sel = document.getElementById("claimItemId");
  if (!sel) return;

  const approved = items.filter(it => it.is_approved && !it.is_claimed);
  sel.innerHTML = approved.length
    ? approved.map(it => `<option value="${escapeHtml(it.id)}">${escapeHtml(it.title)} — ${escapeHtml(it.location)}</option>`).join("")
    : `<option value="">No approved items available</option>`;

  const last = sessionStorage.getItem("reunite_last_item");
  if (last && approved.some(i => i.id === last)) sel.value = last;
}

function handleClaimSubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById("claimStatus");
  statusEl.textContent = "";

  const itemId = document.getElementById("claimItemId").value;
  const name = document.getElementById("claimName").value.trim();
  const email = document.getElementById("claimEmail").value.trim();
  const msg = document.getElementById("claimMessage").value.trim();

  if (!itemId || !name || !email || !msg) {
    statusEl.textContent = "Please complete all required fields.";
    return;
  }

  const claim = {
    id: uid("claim"),
    item_id: itemId,
    claimant_name: name,
    claimant_email: email,
    message: msg,
    status: "pending",
    created_at: new Date().toISOString()
  };
  claims.unshift(claim);
  saveAll();

  statusEl.textContent = "Claim submitted. Admin will review shortly.";
  e.target.reset();

  renderAdmin(); renderAudit();
}

// ------------------------------
// Dashboard (Student)
// ------------------------------
function renderDashboard() {
  const reportsEl = document.getElementById("myReports");
  const claimsEl = document.getElementById("myClaims");
  if (!reportsEl || !claimsEl) return;

  if (!currentUser) {
    reportsEl.innerHTML = '<div class="no-items">Sign in to view your dashboard.</div>';
    claimsEl.innerHTML = '<div class="no-items">Sign in to view your dashboard.</div>';
    return;
  }

  const myEmail = currentUser.email;
  const myReports = items.filter(it => it.created_by === myEmail || it.contact_email === myEmail);
  const myClaims = claims.filter(c => c.claimant_email === myEmail);

  reportsEl.innerHTML = myReports.length ? myReports.map(it => `
    <div class="admin-row">
      <strong>${escapeHtml(it.title)}</strong><br/>
      <span>Status: ${escapeHtml(it.is_approved ? (it.is_claimed ? "claimed" : "approved") : "pending approval")}</span><br/>
      <span>Location: ${escapeHtml(it.location)}</span>
    </div>
  `).join("") : '<div class="no-items">No reports yet.</div>';

  claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
    const item = items.find(i => i.id === c.item_id);
    return `
      <div class="admin-row">
        <strong>${escapeHtml(item?.title || "Item")}</strong><br/>
        <span>Claim Status: ${escapeHtml(c.status)}</span>
      </div>
    `;
  }).join("") : '<div class="no-items">No claims yet.</div>';
}

// ------------------------------
// Admin Review
// ------------------------------
function audit(action, meta = {}) {
  const adminEmail = currentUser?.email || "unknown-admin";
  const entry = {
    action,
    admin: adminEmail,
    claim_id: meta.claim_id || null,
    item_id: meta.item_id || null,
    msg: meta.msg || null,
    at: new Date().toISOString()
  };
  const log = JSON.parse(localStorage.getItem(LS_KEYS.audit) || "[]");
  log.unshift(entry);
  localStorage.setItem(LS_KEYS.audit, JSON.stringify(log.slice(0, 75)));
}

function renderAdmin() {
  const pendingEl = document.getElementById("adminPendingItems");
  const claimsEl = document.getElementById("adminClaims");
  if (!pendingEl || !claimsEl) return;

  if (!isAdmin()) {
    pendingEl.innerHTML = '<div class="no-items">Admin access required.</div>';
    claimsEl.innerHTML = '<div class="no-items">Admin access required.</div>';
    return;
  }

  const pending = items.filter(it => !it.is_approved && it.status === "pending");
  pendingEl.innerHTML = pending.length ? pending.map(it => `
    <div class="admin-row">
      <strong>${escapeHtml(it.title)}</strong><br/>
      <span>Category: ${escapeHtml(it.category)}</span><br/>
      <span>Location: ${escapeHtml(it.location)}</span><br/>
      <span>Date Found: ${escapeHtml(it.date_found || "")}</span>
      <div class="admin-actions">
        <button class="btn-secondary btn-small" type="button" onclick="adminApproveItem('${it.id}')">Approve</button>
        <button class="btn-secondary btn-small" type="button" onclick="adminRejectItem('${it.id}')">Reject</button>
      </div>
    </div>
  `).join("") : '<div class="no-items">No pending reports.</div>';

  // Show claims (pending + approved) so admin can approve first, then mark picked up.
  const relevantClaims = claims.filter(c => c.status === "pending" || c.status === "approved");
  claimsEl.innerHTML = relevantClaims.length ? relevantClaims.map(c => {
    const it = items.find(i => i.id === c.item_id);
    const isApproved = c.status === "approved";
    return `
      <div class="admin-row">
        <strong>${escapeHtml(it?.title || "Item")}</strong><br/>
        <span><b>Claim ID:</b> ${escapeHtml(c.id)}</span><br/>
        <span>Claimant: ${escapeHtml(c.claimant_name)} (${escapeHtml(c.claimant_email)})</span><br/>
        <span>Status: ${escapeHtml(c.status)}</span><br/>
        <span>Message: ${escapeHtml(c.message)}</span>
        <div class="admin-actions">
          ${!isApproved ? `<button class="btn-secondary btn-small" type="button" onclick="adminApproveClaim('${c.id}')">Approve Claim</button>` : ``}
          ${!isApproved ? `<button class="btn-secondary btn-small" type="button" onclick="adminRejectClaim('${c.id}')">Reject Claim</button>` : ``}
          ${isApproved ? `<button class="btn-secondary btn-small" type="button" onclick="adminMarkPickedUp('${c.id}')">Mark Picked Up</button>` : ``}
          ${isApproved ? `<button class="btn-secondary btn-small" type="button" onclick="printClaimReceipt('${c.id}')">Print Receipt</button>` : ``}
        </div>
      </div>
    `;
  }).join("") : '<div class="no-items">No pending/approved claims.</div>';

  renderAudit();
}

function adminApproveItem(itemId) {
  const it = items.find(i => i.id === itemId);
  if (!it) return;
  it.is_approved = true;
  it.status = "approved";
  audit("approve_item", { item_id: it.id, msg: `Approved item: ${it.title}` });
  saveAll();
  renderAdmin(); renderAudit();
  renderFound();
}

function adminRejectItem(itemId) {
  const it = items.find(i => i.id === itemId);
  if (!it) return;
  it.status = "rejected";
  it.is_approved = false;
  audit("reject_item", { item_id: it.id, msg: `Rejected item: ${it.title}` });
  saveAll();
  renderAdmin(); renderAudit();
}

function adminApproveClaim(claimId) {
  const c = claims.find(x => x.id === claimId);
  if (!c) return;
  c.status = "approved";
  audit("approve_claim", { claim_id: claimId, item_id: c.item_id, msg: `Approved claim ${claimId}` });
  saveAll();
  renderAdmin();
  renderDashboard();
  renderFound();
}

function adminRejectClaim(claimId) {
  const c = claims.find(x => x.id === claimId);
  if (!c) return;
  c.status = "rejected";
  audit("reject_claim", { claim_id: claimId, item_id: c.item_id, msg: `Rejected claim ${claimId}` });
  saveAll();
  renderAdmin();
  renderDashboard();
  renderFound();
}

function adminMarkClaimed(itemId) {
  const it = items.find(i => i.id === itemId);
  if (!it) return;
  it.is_claimed = true;
  it.status = "claimed";
  audit("mark_claimed", { item_id: it.id, msg: `Marked item claimed: ${it.title}` });
  saveAll();
  renderAdmin(); renderAudit();
  renderFound();
  renderDashboard();
  renderFound();
}

window.adminApproveItem = adminApproveItem;
window.adminRejectItem = adminRejectItem;
window.adminApproveClaim = adminApproveClaim;
window.adminRejectClaim = adminRejectClaim;
window.adminMarkClaimed = adminMarkClaimed;

// ------------------------------
// Filter handlers
// ------------------------------
function setupFilters() {
  document.getElementById("searchFilter")?.addEventListener("input", renderFound);
  // categoryFilter removed in v6
/*    const v = document.getElementById("categoryFilter").value;
    const help = document.getElementById("categoryOtherHelp");
    help.style.display = v === "Other" ? "block" : "none";
    renderFound();
  });*/
  document.getElementById("locationFilter")?.addEventListener("input", renderFound);
  document.getElementById("dateFilter")?.addEventListener("change", renderFound);
}

// "Other category" reveal on report form
function setupReportCategoryOther() {
  const sel = document.getElementById("itemCategory");
  const wrap = document.getElementById("otherCategoryWrap");
  sel?.addEventListener("change", () => {
    wrap.style.display = sel.value === "Other" ? "block" : "none";
  });
}

// ------------------------------
// Seed Data (for demo)
// ------------------------------
function seedIfEmpty() {
  if (items.length > 0) return;

  items = [
    {
      id: uid("item"),
      title: "Black Wallet",
      category: "Wallet",
      category_raw: "Wallet",
      location: "Cafeteria",
      date_found: new Date().toISOString().slice(0,10),
      description: "Black leather wallet with student ID inside.",
      contact_name: "Front Office",
      contact_email: "frontoffice@school.edu",
      contact_phone: "",
      status: "approved",
      is_approved: true,
      is_claimed: false,
      created_at: new Date().toISOString(),
      created_by: "frontoffice@school.edu",
      image_hash: null,
      photo_data_url: null
    },
    {
      id: uid("item"),
      title: "Silver Keys (3 keys)",
      category: "Keys",
      category_raw: "Keys",
      location: "Library",
      date_found: new Date().toISOString().slice(0,10),
      description: "Three keys on a blue keychain.",
      contact_name: "Library Desk",
      contact_email: "library@school.edu",
      contact_phone: "",
      status: "approved",
      is_approved: true,
      is_claimed: false,
      created_at: new Date().toISOString(),
      created_by: "library@school.edu",
      image_hash: null,
      photo_data_url: null
    }
  ];
  saveAll();
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  loadSession();
  seedIfEmpty();
  updateAuthUI();

  // listeners
  setupFilters();
  setupReportCategoryOther();

  document.getElementById("reportForm")?.addEventListener("submit", handleReportSubmit);
  document.getElementById("claimForm")?.addEventListener("submit", handleClaimSubmit);

  // Photo previews
  document.getElementById("itemPhoto")?.addEventListener("change", () => setPreview("itemPhoto", "reportPhotoPreview"));
  
  // Sort filter
  document.getElementById("sortFilter")?.addEventListener("change", renderFound);
  document.getElementById("findPhoto")?.addEventListener("change", handleFindPhotoChange);


  document.getElementById("loginRole")?.addEventListener("change", handleRoleChange);
  handleRoleChange();

  // default view
  navigateToSection("hero");
});

// Also expose modal close if user clicks backdrop (already in HTML)

function renderAudit() {
  const el = document.getElementById("adminAudit");
  if (!el) return;
  const log = JSON.parse(localStorage.getItem(LS_KEYS.audit) || "[]");
  el.innerHTML = log.length
    ? log.map(l => {
        const when = new Date(l.at).toLocaleString();
        const claim = l.claim_id ? ` • Claim: ${escapeHtml(l.claim_id)}` : "";
        const item = l.item_id ? ` • Item: ${escapeHtml(l.item_id)}` : "";
        return `<div class="admin-row">
          <strong>${escapeHtml(l.action)}</strong><br/>
          <small>Admin: ${escapeHtml(l.admin || "unknown")}${claim}${item}</small><br/>
          <small>${escapeHtml(l.msg || "")}</small><br/>
          <small>${escapeHtml(when)}</small>
        </div>`;
      }).join("")
    : "<div class='no-items'>No audit activity yet.</div>";
}

function printClaimReceipt(claimId) {
  const c = claims.find(x=>x.id===claimId);
  const it = items.find(i=>i.id===c.item_id);
  document.getElementById("receiptItem").textContent = "Item: " + it.title;
  document.getElementById("receiptClaimant").textContent = "Claimant: " + c.claimant_name;
  document.getElementById("receiptDate").textContent = "Date: " + new Date().toLocaleDateString();
  window.print();
}


function setPreview(fileInputId, imgId) {
  const input = document.getElementById(fileInputId);
  const img = document.getElementById(imgId);
  if (!input || !img) return;
  const file = input.files && input.files[0];
  if (!file) {
    img.style.display = "none";
    img.removeAttribute("src");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
}



async function handleFindPhotoChange() {
  const input = document.getElementById("findPhoto");
  const status = document.getElementById("findAiStatus");
  if (!input || !status) return;

  setPreview("findPhoto", "findPhotoPreview");
  const file = input.files && input.files[0];
  if (!file) {
    status.textContent = "";
    renderFound();
    return;
  }

  let hash = null;
  try {
    hash = await getImageHash(file);
  } catch (e) {
    status.textContent = "Could not process image.";
    return;
  }

  const matches = aiMatchItem(hash);
  if (!matches.length) {
    status.textContent = "AI-assisted matching: no close matches found.";
    renderFound();
    return;
  }

  status.textContent = `AI-assisted matches: ${matches.map(m => `${m.item.title} (${m.similarity}%)`).join(", ")}`;
  renderFound(matches.map(m => m.item.id));
}

window.printClaimReceipt = printClaimReceipt;

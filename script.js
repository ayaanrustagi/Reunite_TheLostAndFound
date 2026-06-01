// =======================================================
// REUNITE - Lost & Found System Logic
// =======================================================

const DEMO_MODE = (typeof window !== "undefined" && typeof window.DEMO_MODE === "boolean")
  ? window.DEMO_MODE
  : true;
const ADMIN_ACCESS_CODE = "FBLA2025";

const LS_KEYS = {
  session: "reunite_session",
  items: "reunite_items",
  claims: "reunite_claims"
};

// ------------------------------
// Supabase (safe, optional)
// ------------------------------
const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const supabaseClient = (typeof window.supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const SUPABASE_ENABLED = !!supabaseClient;

let currentUser = null;
let items = [];
let claims = [];

// ------------------------------
// Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  loadSession();
  updateAuthUI();
  // If Supabase is configured and demo mode is off, hydrate from backend
  syncFromSupabase();

  // Check for initial hash/section
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    navigateToSection(hash);
  } else {
    navigateToSection('hero');
  }

  // Scroll listener for "How It Works" split section
  const howSection = document.getElementById('page-how');
  if (howSection) {
    window.addEventListener('scroll', handleSplitScroll);
  }

  // Form Submissions
  document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit);
  document.getElementById('claimForm')?.addEventListener('submit', handleClaimSubmit);

  // Hero Text Rotation
  initHeroRotation();
});

// ------------------------------
// Navigation
// ------------------------------
function navigateToSection(sectionId) {
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(`page-${sectionId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }

  // Nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(sectionId));
  });

  if (sectionId === 'found') renderFound();
  if (sectionId === 'claim') renderClaimSelect();
  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'admin') renderAdmin();

  // Store in location for browser back button
  window.history.pushState(null, null, `#${sectionId}`);
}

window.navigateToSection = navigateToSection;

// ------------------------------
// Hero Text Rotation
// ------------------------------
function initHeroRotation() {
  const titles = [
    "CAN'T FIND IT",
    "LOST VALUABLES",
    "WHERE DID IT GO",
    "MISSING BELONGINGS",
    "LOST AN ITEM",
    "MISPLACED SOMETHING"
  ];
  const subs = [
    "REUNITE YOUR WORLD FASTER",
    "BRING BACK WHAT'S YOURS",
    "FIND YOUR LOST ITEMS",
    "CONNECT WITH FINDERS",
    "RECOVER YOUR BELONGINGS"
  ];

  let tIndex = 0;
  let sIndex = 0;
  const titleEl = document.getElementById('hero-title');
  const subEl = document.getElementById('hero-subtitle');

  if (!titleEl || !subEl) return;

  setInterval(() => {
    tIndex = (tIndex + 1) % titles.length;
    sIndex = (sIndex + 1) % subs.length;

    // Apply glitch effect
    titleEl.classList.add('glitch-active');
    subEl.classList.add('glitch-active');

    // Swap text halfway through the quick glitch
    setTimeout(() => {
      titleEl.textContent = titles[tIndex];
      subEl.textContent = subs[sIndex];
    }, 200);

    // Remove class to reset for next cycle
    setTimeout(() => {
      titleEl.classList.remove('glitch-active');
      subEl.classList.remove('glitch-active');
    }, 400);

  }, 4000);
}

// ------------------------------
// "How It Works" Interaction
// ------------------------------
function handleSplitScroll() {
  const section = document.getElementById('page-how');
  if (!section || !section.classList.contains('active')) return;

  const stepItems = document.querySelectorAll('.step-item');
  const previewTitle = document.getElementById('preview-title');
  const previewDesc = document.getElementById('preview-desc');

  const stepData = [
    { title: "INITIATE", desc: "Begin the recovery process by logging the details into our secure network." },
    { title: "ANALYZE", desc: "Our algorithm scans existing inventory using perceptual hashing to find potential matches." },
    { title: "RESOLVE", desc: "Verify ownership through our secure claim portal and arrange for item retrieval." }
  ];

  let currentStep = 0;
  stepItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
      item.classList.add('active');
      currentStep = index;
    } else {
      item.classList.remove('active');
    }
  });

  if (previewTitle && stepData[currentStep]) {
    previewTitle.textContent = stepData[currentStep].title;
    previewDesc.textContent = stepData[currentStep].desc;
  }
}

// ------------------------------
// Auth & Sessions
// ------------------------------
function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

function handleLogin() {
  const role = document.getElementById('loginRole').value;
  const name = document.getElementById('loginName').value.trim();
  const email = document.getElementById('loginEmail').value.trim();
  const code = document.getElementById('adminCode').value;
  const status = document.getElementById('loginStatus');

  if (!name || !email) {
    status.textContent = "REQUIRED FIELDS MISSING";
    return;
  }

  if (role === 'admin' && code !== ADMIN_ACCESS_CODE) {
    status.textContent = "INVALID ACCESS CODE";
    return;
  }

  currentUser = { role, name, email };
  localStorage.setItem(LS_KEYS.session, JSON.stringify(currentUser));
  updateAuthUI();
  closeLoginModal();
  navigateToSection(role === 'admin' ? 'admin' : 'dashboard');
}
window.handleLogin = handleLogin;

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(LS_KEYS.session);
  updateAuthUI();
  navigateToSection('hero');
}
window.handleLogout = handleLogout;

function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const adminBtn = document.getElementById('adminBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    if (currentUser.role === 'admin') {
      adminBtn.classList.remove('hidden');
      dashboardBtn.classList.add('hidden');
    } else {
      dashboardBtn.classList.remove('hidden');
      adminBtn.classList.add('hidden');
    }
  } else {
    loginBtn.classList.remove('hidden');
    dashboardBtn.classList.add('hidden');
    adminBtn.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

function handleRoleChange() {
  const role = document.getElementById('loginRole').value;
  document.getElementById('adminCodeWrap').classList.toggle('hidden', role !== 'admin');
}
window.handleRoleChange = handleRoleChange;

// ------------------------------
// Data Handling
// ------------------------------
function loadAll() {
  items = JSON.parse(localStorage.getItem(LS_KEYS.items) || "[]");
  claims = JSON.parse(localStorage.getItem(LS_KEYS.claims) || "[]");
}

function saveAll() {
  localStorage.setItem(LS_KEYS.items, JSON.stringify(items));
  localStorage.setItem(LS_KEYS.claims, JSON.stringify(claims));
}

function loadSession() {
  const s = localStorage.getItem(LS_KEYS.session);
  currentUser = s ? JSON.parse(s) : null;
}

// ------------------------------
// Supabase sync helpers (safe + optional)
// ------------------------------
async function syncFromSupabase() {
  if (!SUPABASE_ENABLED || DEMO_MODE) return;
  try {
    const { data: itemsData, error: itemsErr } = await supabaseClient
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!itemsErr && Array.isArray(itemsData)) {
      items = itemsData;
    }
    const { data: claimsData, error: claimsErr } = await supabaseClient
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false });
    if (!claimsErr && Array.isArray(claimsData)) {
      claims = claimsData;
    }
    saveAll();
    renderFound();
    renderClaimSelect();
    renderDashboard();
    renderAdmin();
  } catch (err) {
    console.warn('Supabase sync failed, using local data fallback.', err);
  }
}

async function supabaseUpsert(table, record) {
  if (!SUPABASE_ENABLED || DEMO_MODE) return;
  try {
    await supabaseClient.from(table).upsert(record);
  } catch (err) {
    console.warn(`Supabase upsert failed for ${table}`, err);
  }
}

async function supabaseDelete(table, id) {
  if (!SUPABASE_ENABLED || DEMO_MODE) return;
  try {
    await supabaseClient.from(table).delete().eq('id', id);
  } catch (err) {
    console.warn(`Supabase delete failed for ${table}`, err);
  }
}

// ------------------------------
// Rendering
// ------------------------------
function renderFound() {
  const grid = document.getElementById('itemsGrid');
  const search = document.getElementById('searchFilter').value.toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const loc = document.getElementById('locationFilter').value.toLowerCase();
  const sort = document.getElementById('sortFilter').value;

  let filtered = items.filter(it => it.status === 'approved'); // Only show approved items

  if (search) filtered = filtered.filter(i => i.title.toLowerCase().includes(search) || i.description.toLowerCase().includes(search));
  if (cat) filtered = filtered.filter(i => i.category === cat);
  if (loc) filtered = filtered.filter(i => i.location.toLowerCase().includes(loc));

  if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  document.getElementById('itemsCount').textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="status-msg">NO ITEMS FOUND IN DATABASE</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => `
        <div class="item-card" onclick="openItemModal('${item.id}')">
            ${item.image ? `<div class="card-image-wrap"><img src="${item.image}" class="card-thumb" alt="${item.title}"></div>` : ''}
            <div class="card-content-wrap">
              <div class="card-meta">${item.category} / FOUND ${new Date(item.date_found).toLocaleDateString()}</div>
              <h3 class="card-title">${item.title}</h3>
              <p class="card-desc">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
              <div class="card-footer">
                  <span>${item.location}</span>
                  <span>ID: ${item.id.substring(5, 13)}</span>
              </div>
            </div>
        </div>
    `).join('');
}

function openItemModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalLocation').textContent = item.location;
  document.getElementById('modalDescription').textContent = item.description;
  document.getElementById('modalContactName').textContent = item.contact_name;
  document.getElementById('modalDate').textContent = item.date_found;

  const modalImg = document.getElementById('modalImage');
  if (item.image) {
    modalImg.src = item.image;
    modalImg.classList.remove('hidden');
  } else {
    modalImg.classList.add('hidden');
  }

  sessionStorage.setItem('reunite_selected_id', id);
  document.getElementById('itemModal').classList.remove('hidden');
}
window.openItemModal = openItemModal;

function closeModal() { document.getElementById('itemModal').classList.add('hidden'); }
window.closeModal = closeModal;

// ------------------------------
// AI Scanning Simulation
// ------------------------------
function previewFileFind() {
  const fileInput = document.getElementById('findItemPhoto');
  const file = fileInput.files[0];
  const preview = document.getElementById('findPhotoPreview');
  const parent = fileInput.parentElement;

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      parent.classList.add('has-image');
      simulateAiScan();
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('hidden');
    parent.classList.remove('has-image');
  }
}
window.previewFileFind = previewFileFind;

function previewFileReport() {
  const fileInput = document.getElementById('reportItemPhoto');
  const file = fileInput.files[0];
  const preview = document.getElementById('reportPhotoPreview');
  const parent = fileInput.parentElement;

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      parent.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('hidden');
    parent.classList.remove('has-image');
  }
}
window.previewFileReport = previewFileReport;

// ------------------------------
// dHash (Perceptual Hashing)
// ------------------------------
function computeDHash(imgElement) {
  return new Promise((resolve) => {
    const process = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 8;
      canvas.width = size + 1;
      canvas.height = size;

      ctx.drawImage(imgElement, 0, 0, size + 1, size);
      const imgData = ctx.getImageData(0, 0, size + 1, size).data;

      const grays = [];
      for (let i = 0; i < imgData.length; i += 4) {
        grays.push(imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114);
      }

      let hash = "";
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const left = grays[y * (size + 1) + x];
          const right = grays[y * (size + 1) + x + 1];
          hash += left > right ? "1" : "0";
        }
      }
      resolve(hash);
    };

    if (imgElement.complete && imgElement.naturalWidth !== 0) {
      process();
    } else {
      imgElement.onload = process;
    }
  });
}

function hammingDistance(h1, h2) {
  if (!h1 || !h2) return 64;
  let dist = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) dist++;
  }
  return dist;
}

// ------------------------------
// AI Scanning Simulation
// ------------------------------
async function simulateAiScan() {
  const fileInput = document.getElementById('findItemPhoto');
  const preview = document.getElementById('findPhotoPreview');
  const container = document.getElementById('aiMatchContainer');
  const label = document.getElementById('aiMatchLabel');
  const progress = document.getElementById('aiScanProgress');
  const results = document.getElementById('aiMatchResults');

  container.classList.add('active');
  results.innerHTML = '';

  const steps = [
    "PARSING IMAGE DATA...",
    "EXTRACTING FEATURE VECTORS...",
    "COMPUTING PERCEPTUAL HASH (dHash)...",
    "COMPARING AGAINST NETWORK INVENTORY...",
    "SCAN COMPLETE."
  ];

  for (let i = 0; i < steps.length; i++) {
    label.textContent = steps[i];
    let p = ((i + 1) / steps.length) * 100;
    progress.style.width = p + "%";
    await new Promise(r => setTimeout(r, 600));
  }

  // Compute hash of the uploaded image
  const currentHash = await computeDHash(preview);

  // Sort items by similarity
  const scoredMatches = items
    .filter(it => it.status === 'approved' && it.dhash)
    .map(it => {
      const dist = hammingDistance(currentHash, it.dhash);
      const confidence = Math.max(0, Math.floor(((64 - dist) / 64) * 100));
      return { ...it, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .filter(it => it.confidence > 50) // Only show reasonable matches
    .slice(0, 3);

  if (scoredMatches.length > 0) {
    results.innerHTML = '<div style="margin-top: 1.5rem; color: #fff; font-size: 0.6rem; letter-spacing: 0.1em;">PROBABLE MATCHES DETECTED:</div>' +
      scoredMatches.map(m => `
                <div class="match-item" onclick="openItemModal('${m.id}')" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: rgba(0,255,0,0.05); border: 1px solid rgba(0,255,0,0.2); margin-top: 0.5rem; cursor: pointer;">
                    ${m.image ? `<img src="${m.image}" style="width: 40px; height: 40px; object-fit: cover; border: 1px solid #0f0;">` : '<div style="width: 40px; height: 40px; background: #222; border: 1px solid #333;"></div>'}
                    <div style="flex: 1;">
                        <div style="color: #0f0; font-weight: bold;">> ${m.title}</div>
                        <div style="font-size: 0.55rem; opacity: 0.7;">MATCH CONFIDENCE: ${m.confidence}%</div>
                    </div>
                </div>
            `).join('');
  } else {
    results.innerHTML = '<div class="match-item" style="color: #ff4d4d; margin-top: 1rem;">> NO MATCHES DETECTED IN SYSTEM INVENTORY.</div>';
  }
}

// ------------------------------
// Forms
// ------------------------------
async function handleReportSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('itemTitle').value;
  const category = document.getElementById('itemCategory').value;
  const location = document.getElementById('itemLocation').value;
  const date = document.getElementById('itemDate').value;
  const description = document.getElementById('itemDescription').value;
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const preview = document.getElementById('reportPhotoPreview');
  const photoBase64 = preview.src;

  let dhash = null;
  if (photoBase64 && !preview.classList.contains('hidden')) {
    dhash = await computeDHash(preview);
  }

  const newItem = {
    id: "item_" + Math.random().toString(36).substr(2, 9),
    title, category, location, date_found: date, description,
    contact_name: name, contact_email: email,
    image: dhash ? photoBase64 : null,
    dhash: dhash,
    status: 'pending',
    created_at: new Date().toISOString(),
    created_by: email
  };

  items.unshift(newItem);
  saveAll();
  supabaseUpsert('items', newItem);
  document.getElementById('reportStatus').textContent = "REPORT LOGGED SUCCESSFULLY - PENDING REVIEW";

  // Clear preview
  document.getElementById('reportPhotoPreview').classList.add('hidden');
  document.getElementById('reportItemPhoto').parentElement.classList.remove('has-image');

  e.target.reset();
}

function handleClaimSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('claimItemId').value;
  const name = document.getElementById('claimName').value;
  const email = document.getElementById('claimEmail').value;
  const message = document.getElementById('claimMessage').value;

  const newClaim = {
    id: "claim_" + Math.random().toString(36).substr(2, 9),
    item_id: itemId,
    claimant_name: name,
    claimant_email: email,
    message,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  claims.unshift(newClaim);
  saveAll();
  supabaseUpsert('claims', newClaim);
  document.getElementById('claimStatus').textContent = "CLAIM DATA RECEIVED - AWAITING VERIFICATION";
  e.target.reset();
}

function renderClaimSelect() {
  const select = document.getElementById('claimItemId');
  if (!select) return;
  const approved = items.filter(i => i.status === 'approved');
  select.innerHTML = approved.map(i => `<option value="${i.id}">${i.title} (${i.location})</option>`).join('');

  const pre = sessionStorage.getItem('reunite_selected_id');
  if (pre) select.value = pre;
}

// ------------------------------
// Dashboards
// ------------------------------
function renderDashboard() {
  if (!currentUser) return;
  const reportsEl = document.getElementById('myReports');
  const claimsEl = document.getElementById('myClaims');

  const myReports = items.filter(i => i.contact_email === currentUser.email);
  const myClaims = claims.filter(c => c.claimant_email === currentUser.email);

  reportsEl.innerHTML = myReports.length ? myReports.map(r => `
        <div class="list-item">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">REF: ${r.id.substring(5, 13).toUpperCase()}</div>
              <strong>${r.title}</strong>
            </div>
            <span class="status-tag" style="border-color:${r.status === 'approved' ? '#0f0' : r.status === 'rejected' ? '#f00' : 'var(--border-color)'}">
              ${r.status.toUpperCase()}
            </span>
        </div>
    `).join('') : '<div class="status-msg">NO REPORTS LOGGED</div>';

  claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
    const item = items.find(i => i.id === c.item_id);
    return `
            <div class="list-item">
                <div>
                  <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">CLAIM ID: ${c.id.substring(6, 14).toUpperCase()}</div>
                  <strong>${item?.title || 'Unknown Item'}</strong>
                </div>
                <span class="status-tag" style="border-color:${c.status === 'approved' ? '#0f0' : 'var(--border-color)'}">
                  ${c.status.toUpperCase()}
                </span>
            </div>
        `;
  }).join('') : '<div class="status-msg">NO CLAIMS IN PROGRESS</div>';
}

function renderAdmin() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const pendingEl = document.getElementById('adminPendingItems');
  const claimsEl = document.getElementById('adminClaims');

  const pending = items.filter(i => i.status === 'pending');
  pendingEl.innerHTML = pending.length ? pending.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <div>
                <button onclick="approveItem('${i.id}')" class="btn-sm btn-outline">APPROVE</button>
                <button onclick="rejectItem('${i.id}')" class="btn-sm btn-outline">REJECT</button>
                <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
            </div>
        </div>
    `).join('') : 'ALL CLEAR';

  const pendingClaims = claims.filter(c => c.status === 'pending');
  claimsEl.innerHTML = pendingClaims.length ? pendingClaims.map(c => {
    const item = items.find(it => it.id === c.item_id);
    return `
            <div class="list-item">
                <strong>${item?.title} / BY ${c.claimant_name}</strong>
                <button onclick="approveClaim('${c.id}')" class="btn-sm btn-outline">VERIFY</button>
            </div>
        `;
  }).join('') : 'NO PENDING CLAIMS';

  // Approved Inventory
  const approvedEl = document.getElementById('adminApprovedItems');
  const approved = items.filter(i => i.status === 'approved');
  approvedEl.innerHTML = approved.length ? approved.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
        </div>
    `).join('') : 'EMPTY';

  // Verified Claims
  const verifiedEl = document.getElementById('adminVerifiedClaims');
  const verified = claims.filter(c => c.status === 'approved');
  verifiedEl.innerHTML = verified.length ? verified.map(c => {
    const item = items.find(it => it.id === c.item_id);
    return `
            <div class="list-item">
                <strong>${item?.title} / BY ${c.claimant_name}</strong>
                <button onclick="deleteClaim('${c.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE ENTRY</button>
            </div>
        `;
  }).join('') : 'EMPTY';
}

function approveItem(id) {
  const item = items.find(i => i.id === id);
  if (item) item.status = 'approved';
  saveAll(); renderAdmin();
}
window.approveItem = approveItem;

function rejectItem(id) {
  const item = items.find(i => i.id === id);
  if (item) item.status = 'rejected';
  saveAll(); renderAdmin();
}
window.rejectItem = rejectItem;

function approveClaim(id) {
  const claim = claims.find(c => c.id === id);
  if (claim) claim.status = 'approved';
  saveAll(); renderAdmin();
}
window.approveClaim = approveClaim;

function deleteItem(id) {
  if (!confirm("PERMANENTLY DELETE THIS ITEM FROM DATABASE?")) return;
  items = items.filter(i => i.id !== id);
  saveAll(); renderAdmin();
}
window.deleteItem = deleteItem;

function deleteClaim(id) {
  if (!confirm("PERMANENTLY DELETE THIS CLAIM RECORD?")) return;
  claims = claims.filter(c => c.id !== id);
  saveAll(); renderAdmin();
}
window.deleteClaim = deleteClaim;

function toggleOtherCat() {
  const cat = document.getElementById('itemCategory').value;
  document.getElementById('otherCategoryWrap').classList.toggle('hidden', cat !== 'Other');
}
window.toggleOtherCat = toggleOtherCat;

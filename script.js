// =======================================================
// REUNITE - Lost & Found System Logic
// =======================================================

// Supabase config - set directly here to ensure it's available
window.SUPABASE_URL = "https://izoyxyekflrnyheuxppk.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_YHpGZHSw6XfnoC3Kg4QplQ_Wz5Hp3hw";
window.DEMO_MODE = false;

const DEMO_MODE = (typeof window !== "undefined" && typeof window.DEMO_MODE === "boolean")
  ? window.DEMO_MODE
  : true;
const ADMIN_ACCESS_CODE = "FBLA2025";

// EmailJS Config (Placeholders - user needs to set these up at emailjs.com)
const EMAILJS_SERVICE_ID = "service_gpf5o4g";
const EMAILJS_TEMPLATE_ID = "template_2y2c309";
const EMAILJS_PUBLIC_KEY = "vQdFZ_3TQhMLDP1z3";
const EMAILS_ENABLED = true; // Set to true after adding Service/Template IDs below

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
console.log("Supabase init values:", { SUPABASE_URL, SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "set" : "missing", DEMO_MODE });

let supabaseClient = null;
let SUPABASE_ENABLED = false;

// Initialize Supabase after DOM is ready to ensure script is loaded
function initializeSupabase() {
  console.log("window.supabase available:", typeof window.supabase !== "undefined");

  // If Supabase isn't loaded, try to load it dynamically
  if (typeof window.supabase === "undefined") {
    console.log("Loading Supabase dynamically...");
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.js';
    script.onload = () => {
      console.log("Supabase script loaded dynamically");
      createSupabaseClient();
    };
    script.onerror = () => {
      console.error("Failed to load Supabase script dynamically");
    };
    document.head.appendChild(script);
  } else {
    createSupabaseClient();
  }
}

function createSupabaseClient() {
  console.log("Creating Supabase client...");
  if (typeof window.supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      SUPABASE_ENABLED = !!supabaseClient;
      if (SUPABASE_ENABLED) {
        console.log("🟢 SUPABASE CLIENT INITIALIZED");
      }
    } catch (e) {
      console.error("🔴 SUPABASE INIT ERROR:", e);
    }
  }
}

let currentUser = null;
let items = [];
let claims = [];

// ------------------------------
// Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initializeSupabase();
  loadAll();
  loadSession();
  updateAuthUI();
  // Initialize EmailJS
  if (typeof emailjs !== "undefined" && EMAILS_ENABLED) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

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
  // Supabase-only: don't load from localStorage
  items = [];
  claims = [];
}

function saveAll() {
  // Supabase-only: don't save to localStorage
}

function loadSession() {
  const s = localStorage.getItem(LS_KEYS.session);
  currentUser = s ? JSON.parse(s) : null;
}

// ------------------------------
// Supabase sync helpers (safe + optional)
// ------------------------------
let isSyncing = false;
async function syncFromSupabase() {
  if (!SUPABASE_ENABLED || isSyncing) return;
  isSyncing = true;
  console.log("🔄 STARTING SMART SYNC...");

  try {
    const [itRes, clRes] = await Promise.all([
      supabaseClient.from('items').select('*'),
      supabaseClient.from('claims').select('*')
    ]);

    if (itRes.error) throw itRes.error;
    if (clRes.error) throw clRes.error;

    items = itRes.data || [];
    claims = clRes.data || [];

    // Local sort is faster than DB sort for small datasets
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    console.log(`✅ SYNC SUCCESS: ${items.length} items cached.`);

    // Debounced renders to prevent UI lockup
    requestAnimationFrame(() => {
      renderFound();
      renderClaimSelect();
      renderDashboard();
      renderAdmin();
      isSyncing = false;
    });

  } catch (err) {
    console.error('🔴 SYNC FAILED:', err.message || err);
    isSyncing = false;
  }
}

async function supabaseUpsert(table, record) {
  if (!SUPABASE_ENABLED) {
    console.warn(`Supabase disabled. Cannot save to ${table}.`);
    return false;
  }
  try {
    console.log(`📤 SAVING TO ${table}...`, record);
    const { error } = await supabaseClient.from(table).upsert(record);

    if (error) {
      console.error(`🔴 SUPABASE ERROR (${table}):`, error.message);
      alert(`DATABASE ERROR: ${error.message}\n\nCheck if table columns match exactly and RLS is disabled.`);
      return false;
    }

    console.log(`✅ ${table} RECORD UPDATED SUCCESSFULLY`);
    return true;
  } catch (err) {
    console.error(`🔴 CRITICAL FAIL (${table}):`, err);
    return false;
  }
}

async function supabaseDelete(table, id) {
  if (!SUPABASE_ENABLED) return;
  try {
    await supabaseClient.from(table).delete().eq('id', id);
  } catch (err) {
    console.warn(`Supabase delete failed for ${table}`, err);
  }
}

// ------------------------------
// Email Notifications
// ------------------------------
async function sendEmailUpdate(to_email, to_name, subject, message, item_title) {
  if (!EMAILS_ENABLED) return;
  const client = window.emailjs || (typeof emailjs !== "undefined" ? emailjs : null);
  if (!client) return;

  // MEGA-FIX: Ensure there is ALWAYS a valid recipient
  const finalEmail = (to_email && to_email.includes('@')) ? to_email : "ayaanrustagi2010@gmail.com";

  const templateParams = {
    to_email: finalEmail,
    email: finalEmail, // Alias
    recipient: finalEmail, // Alias
    to_name: to_name || "REUNITE User",
    subject: subject || "System Update",
    message: message || "New update regarding your lost and found item.",
    item_title: item_title || "Reported Item",
    site_link: "https://thereunite.netlify.app"
  };

  try {
    console.log("📤 SENDING EMAIL TO:", finalEmail);
    await client.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log(`✅ EMAIL SENT SUCCESSFULLY`);
  } catch (err) {
    console.error("🔴 EMAIL FAILED:", err);
    alert(`EMAIL ERROR: ${err.text || "Recipient missing"}\n\nFIX: Go to EmailJS Dashboard -> Settings Tab -> Set "To Email" to {{to_email}}`);
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

  console.log("renderFound called with:", { totalItems: items.length, search, cat, loc, sort });

  let filtered = items.filter(it => (it.status || "").toLowerCase().trim() === 'approved'); // Only show approved items
  console.log("After status filter (approved only):", filtered.length);

  if (search) filtered = filtered.filter(i => i.title.toLowerCase().includes(search) || i.description.toLowerCase().includes(search));
  if (cat) filtered = filtered.filter(i => i.category === cat);
  if (loc) filtered = filtered.filter(i => i.location.toLowerCase().includes(loc));

  if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  console.log("Final filtered items to display:", filtered.length);

  document.getElementById('itemsCount').textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="status-msg">NO ITEMS FOUND IN DATABASE</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => `
        <div class="item-card" onclick="openItemModal('${item.id}')" style="contain: content;">
            ${item.image ? `<div class="card-image-wrap"><img src="${item.image}" class="card-thumb" alt="${item.title}" loading="lazy"></div>` : ''}
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
  const success = await supabaseUpsert('items', newItem);
  if (success) {
    await syncFromSupabase();
  }
  document.getElementById('reportStatus').textContent = "REPORT LOGGED SUCCESSFULLY - PENDING REVIEW";

  // Clear preview
  document.getElementById('reportPhotoPreview').classList.add('hidden');
  document.getElementById('reportItemPhoto').parentElement.classList.remove('has-image');

  e.target.reset();

  // Notify User via Email
  sendEmailUpdate(
    newItem.contact_email,
    newItem.contact_name,
    "Report Received",
    "We have successfully logged your report in our system. An administrator will review it shortly.",
    newItem.title
  );
}

async function handleClaimSubmit(e) {
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
  const success = await supabaseUpsert('claims', newClaim);
  if (success) {
    await syncFromSupabase();
  }
  document.getElementById('claimStatus').textContent = "CLAIM DATA RECEIVED - AWAITING VERIFICATION";
  e.target.reset();

  // Notify the Original Reporter that someone claimed their item
  const item = items.find(i => i.id === newClaim.item_id);
  if (item && item.contact_email) {
    sendEmailUpdate(
      item.contact_email,
      item.contact_name,
      "New Claim Submitted",
      `A claim has been submitted for your item "${item.title}". Please log in to the portal to review the claim details.`,
      item.title
    );
  }

  // Notify the Claimant
  sendEmailUpdate(
    newClaim.claimant_email,
    newClaim.claimant_name,
    "Claim Received",
    "Your claim has been submitted and is currently being reviewed by our administration team.",
    item ? item.title : "Reported Item"
  );
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

  if (reportsEl) reportsEl.innerHTML = myReports.length ? myReports.map(r => `
        <div class="list-item">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">REF: ${r.id.substring(5, 13).toUpperCase()}</div>
              <strong>${r.title}</strong>
            </div>
            <span class="status-tag" style="border-color:${(r.status || "").toLowerCase() === 'approved' ? '#0f0' : (r.status || "").toLowerCase() === 'rejected' ? '#f00' : 'var(--border-color)'}">
              ${(r.status || "PENDING").toUpperCase()}
            </span>
        </div>
    `).join('') : '<div class="status-msg">NO REPORTS LOGGED</div>';

  if (claimsEl) claimsEl.innerHTML = myClaims.length ? myClaims.map(c => {
    const item = items.find(i => i.id === c.item_id);
    return `
            <div class="list-item">
                <div>
                  <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--muted-text); margin-bottom:0.25rem;">CLAIM ID: ${c.id.substring(6, 14).toUpperCase()}</div>
                  <strong>${item?.title || 'Unknown Item'}</strong>
                </div>
                <span class="status-tag" style="border-color:${(c.status || "").toLowerCase() === 'approved' ? '#0f0' : 'var(--border-color)'}">
                  ${(c.status || "PENDING").toUpperCase()}
                </span>
            </div>
        `;
  }).join('') : '<div class="status-msg">NO CLAIMS IN PROGRESS</div>';
}

function renderAdmin() {
  if (!currentUser || currentUser.role !== 'admin') return;

  // Add Manual Sync Button to UI dynamically if it's not in HTML
  const sectionHead = document.querySelector('#page-admin .section-head');
  if (sectionHead && !document.getElementById('forceSyncBtn')) {
    const btn = document.createElement('button');
    btn.id = 'forceSyncBtn';
    btn.className = 'btn-sm btn-outline';
    btn.style.marginLeft = 'auto';
    btn.style.fontSize = '0.6rem';
    btn.textContent = 'FORCE SYSTEM SYNC';
    btn.onclick = () => syncFromSupabase();
    sectionHead.style.display = 'flex';
    sectionHead.style.alignItems = 'flex-end';
    sectionHead.appendChild(btn);

    // Add Test Email Button
    const testBtn = document.createElement('button');
    testBtn.className = 'btn-sm btn-outline';
    testBtn.style.marginLeft = '0.5rem';
    testBtn.style.fontSize = '0.6rem';
    testBtn.style.borderColor = 'var(--accent-color)';
    testBtn.textContent = 'TEST EMAIL';
    testBtn.onclick = () => {
      sendEmailUpdate(currentUser.email, currentUser.name, "TEST EMAIL", "If you received this, your email configuration is correct!", "TEST ITEM");
      alert("Test email triggered. Check your inbox (and spam) and the browser console.");
    };
    sectionHead.appendChild(testBtn);
  }

  const pendingEl = document.getElementById('adminPendingItems');
  const pending = items.filter(i => (i.status || "").toLowerCase().trim() === 'pending');
  if (pendingEl) pendingEl.innerHTML = pending.length ? pending.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <div>
                <button onclick="approveItem('${i.id}')" class="btn-sm btn-outline">APPROVE</button>
                <button onclick="rejectItem('${i.id}')" class="btn-sm btn-outline">REJECT</button>
                <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
            </div>
        </div>
    `).join('') : 'NO PENDING ITEMS';

  const claimsEl = document.getElementById('adminClaims');
  const pendingClaims = claims.filter(c => (c.status || "").toLowerCase().trim() === 'pending');
  if (claimsEl) claimsEl.innerHTML = pendingClaims.length ? pendingClaims.map(c => {
    const item = items.find(it => it.id === c.item_id);
    return `
            <div class="list-item">
                <strong>${item?.title || 'Unknown Item'} / BY ${c.claimant_name}</strong>
                <button onclick="approveClaim('${c.id}')" class="btn-sm btn-outline">VERIFY</button>
            </div>
        `;
  }).join('') : 'NO PENDING CLAIMS';

  // Approved Inventory
  const approvedEl = document.getElementById('adminApprovedItems');
  const approved = items.filter(i => (i.status || "").toLowerCase().trim() === 'approved');
  console.log("ADMIN DEBUG:", {
    total: items.length,
    approved: approved.length,
    statuses: items.map(it => it.status)
  });
  if (approvedEl) approvedEl.innerHTML = approved.length ? approved.map(i => `
        <div class="list-item">
            <strong>${i.title}</strong>
            <button onclick="deleteItem('${i.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE</button>
        </div>
    `).join('') : 'EMPTY';

  // Verified Claims
  const verifiedEl = document.getElementById('adminVerifiedClaims');
  const verified = claims.filter(c => (c.status || "").toLowerCase().trim() === 'approved');
  if (verifiedEl) {
    verifiedEl.innerHTML = verified.length ? verified.map(c => {
      const item = items.find(it => it.id === c.item_id);
      return `
            <div class="list-item">
                <strong>${item?.title || 'Unknown Item'} / BY ${c.claimant_name}</strong>
                <button onclick="deleteClaim('${c.id}')" class="btn-sm btn-outline" style="border-color:#ff4d4d; color:#ff4d4d;">DELETE ENTRY</button>
            </div>
        `;
    }).join('') : 'EMPTY';
  }

  const auditEl = document.getElementById('adminAudit');
  if (auditEl) {
    // Placeholder for audit log rendering
  }
}

async function approveItem(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    const updatedItem = { ...item, status: 'approved' };
    const success = await supabaseUpsert('items', updatedItem);
    if (success) {
      await syncFromSupabase();

      // Notify Reporter
      sendEmailUpdate(
        item.contact_email,
        item.contact_name,
        "Item Approved",
        "Your report has been approved and is now visible in the public inventory.",
        item.title
      );
    }
  }
}
window.approveItem = approveItem;

async function rejectItem(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    const updatedItem = { ...item, status: 'rejected' };
    const success = await supabaseUpsert('items', updatedItem);
    if (success) {
      await syncFromSupabase();

      // Notify Reporter
      sendEmailUpdate(
        item.contact_email,
        item.contact_name,
        "Item Update",
        "Your report has been reviewed and was not approved for the public inventory. Please contact administration for more details.",
        item.title
      );
    }
  }
}
window.rejectItem = rejectItem;

async function approveClaim(id) {
  const claim = claims.find(c => c.id === id);
  if (claim) {
    const updatedClaim = { ...claim, status: 'approved' };
    const success = await supabaseUpsert('claims', updatedClaim);
    if (success) {
      await syncFromSupabase();

      const item = items.find(i => i.id === claim.item_id);

      // Notify Claimant
      sendEmailUpdate(
        claim.claimant_email,
        claim.claimant_name,
        "Claim Verified",
        "Your claim has been verified! You can now arrange to retrieve your item from the administration office.",
        item ? item.title : "Your Item"
      );
    }
  }
}
window.approveClaim = approveClaim;

async function deleteItem(id) {
  if (!confirm("PERMANENTLY DELETE THIS ITEM FROM DATABASE?")) return;
  await supabaseDelete('items', id);
  await syncFromSupabase();
}
window.deleteItem = deleteItem;

async function deleteClaim(id) {
  if (!confirm("PERMANENTLY DELETE THIS CLAIM RECORD?")) return;
  await supabaseDelete('claims', id);
  await syncFromSupabase();
}
window.deleteClaim = deleteClaim;

function toggleOtherCat() {
  const cat = document.getElementById('itemCategory').value;
  document.getElementById('otherCategoryWrap').classList.toggle('hidden', cat !== 'Other');
}
window.toggleOtherCat = toggleOtherCat;

// Logic Web POBSI Kabupaten Banjarnegara - Modern Premium Billiards Platform
let appData = POBSI_DATA; // Inisialisasi awal dengan data lokal offline dari data.js
let standingsCurrentPage = 1;
let handicapCurrentPage = 1;
let docsCurrentPage = 1;
let admDocsCurrentPage = 1;

// Helper to populate select elements with 30-minute intervals
function populateTimeDropdowns() {
  const dropdownIds = ["inp-boc-schedule-time", "tab-boc-schedule-time"];
  dropdownIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = "";
    
    // Add placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = id === "tab-boc-schedule-time" ? "Pilih waktu" : "Pilih waktu mulai";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.style.background = "#0d1527";
    placeholder.style.color = "rgba(255,255,255,0.4)";
    select.appendChild(placeholder);
    
    // Generate hours and minutes
    for (let hour = 0; hour < 24; hour++) {
      for (let min of [0, 30]) {
        const hh = String(hour).padStart(2, '0');
        const mm = String(min).padStart(2, '0');
        const val = `${hh}:${mm}`;
        
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        opt.style.background = "#0d1527";
        opt.style.color = "#fff";
        select.appendChild(opt);
      }
    }
  });
}

// Helper to set selected time in a dropdown, dynamically adding option if it doesn't exist
function setSelectedTimeValue(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  if (value) {
    let standardizedValue = value.trim();
    if (standardizedValue.length === 5) {
      let exists = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === standardizedValue) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        const opt = document.createElement("option");
        opt.value = standardizedValue;
        opt.textContent = standardizedValue;
        opt.style.background = "#0d1527";
        opt.style.color = "#fff";
        select.appendChild(opt);
      }
      select.value = standardizedValue;
    } else {
      select.value = "";
    }
  } else {
    select.value = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Jalankan inisialisasi aplikasi
  initApp();
});

// 1. Inisialisasi Aplikasi Utama
async function initApp() {
  populateTimeDropdowns();
  // Ambil tahun dari hash URL di awal (sebelum loadDataFromApi) agar pemuatan API sesuai tahun sasaran
  const initHash = window.location.hash.substring(1);
  if (initHash.startsWith("champions-")) {
    const raw = initHash.substring("champions-".length);
    let year = raw;
    if (raw.endsWith("-playoff")) {
      year = raw.substring(0, raw.length - "-playoff".length);
    }
    if (year && /^\d{4}$/.test(year)) {
      currentBocYear = year;
      localStorage.setItem("currentBocYear", currentBocYear);
      bocSirkuits = loadBocSirkuitsForYear(year);
    }
  } else if (initHash.startsWith("boc-")) {
    const year = initHash.substring("boc-".length);
    if (year && /^\d{4}$/.test(year)) {
      currentBocYear = year;
      localStorage.setItem("currentBocYear", currentBocYear);
      bocSirkuits = loadBocSirkuitsForYear(year);
    }
  }

  // Apply dynamic configurations from settings
  applySettingsToDOM();

  // Mobile Nav Toggle
  setupMobileNav();

  // Tab Navigation Listeners
  setupTabNavigation();

  // Ambil data dinamis dari Vercel Serverless API jika tersedia
  await loadDataFromApi();

  // Load BOC settings from database
  await loadBocSettings(currentBocYear);

  // Load Statistics & Home Highlights
  loadStatistics();
  loadHomeHighlights();

  // Load Standings (Battle of Champions 2026)
  renderStandings();
  setupStandingsSearch();

  // Load Handicap Database
  populateClubFilters();
  renderHandicapList();
  setupHandicapListeners();


  // Load Events Calendar
  renderEvents("all");
  setupEventsFilters();

  // Load Documents Hub
  renderDocuments();
  setupDocsSearch();

  // Load Clubs Directory
  renderClubs();
  setupClubSearch();


  // Premium Animation Systems (Midnight Arena WOW Effects)
  setupScrollAnimations();
  setupAnimatedCounters();
  setup3DTiltCards();

  // Load Date Pickers
  setupDatePickers();

  // Load Admin Panel Control
  setupAdminPanel();

  // Jalankan routing hash awal setelah semua data API dan pengaturan BOC termuat
  if (typeof window.checkInitialRoute === 'function') {
    window.checkInitialRoute();
  }
}

// 2. Fetch Data dari Vercel Serverless API (dengan Fallback Cerdas ke data.js)
async function loadDataFromApi() {
  try {
    // Jika dibuka langsung lewat double-click file lokal (file://), hindari error CORS
    if (window.location.protocol === 'file:') {
      console.log("Aplikasi dibuka secara lokal (file://). Menggunakan database luring (data.js).");
      return;
    }

    console.log(`Menghubungkan ke Vercel Serverless API untuk memuat database tahun ${currentBocYear}...`);
    
    // Fetch kelima endpoint dan sirkuit secara paralel untuk performa maksimal
    const [playersRes, standingsRes, eventsRes, docsRes, clubsRes, bocSirkuitsRes] = await Promise.all([
      fetch('/api/players', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/standings?year=${currentBocYear}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/events', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/docs', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/clubs', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/boc-sirkuits?year=${currentBocYear}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    // Update database runtime jika response API valid
    if (playersRes && Array.isArray(playersRes)) {
      appData.players = playersRes;
      console.log(`Loaded ${playersRes.length} players from API.`);
    }

    // Selalu bersihkan exactBocPoints dan standings lama
    for (let name in exactBocPoints) {
      delete exactBocPoints[name];
    }
    appData.standings = [];

    if (standingsRes && Array.isArray(standingsRes)) {
      appData.standings = standingsRes;
      console.log(`Loaded ${standingsRes.length} standings from API for year ${currentBocYear}.`);
      
      // Sinkronisasi data poin sirkuit BOC ke memori lokal
      standingsRes.forEach(player => {
        if (player.boc_points) {
          try {
            exactBocPoints[player.name] = JSON.parse(player.boc_points);
          } catch (e) {
            console.error("Gagal parse boc_points untuk atlet:", player.name, e);
          }
        }
      });
    }

    // Sinkronisasi sirkuit BOC untuk tahun berjalan
    if (bocSirkuitsRes && Array.isArray(bocSirkuitsRes)) {
      bocSirkuits = bocSirkuitsRes;
      localStorage.setItem(`bocSirkuits_${currentBocYear}`, JSON.stringify(bocSirkuits));
      console.log(`Loaded ${bocSirkuits.length} sirkuits from API for year ${currentBocYear}.`);
    } else {
      bocSirkuits = loadBocSirkuitsForYear(currentBocYear);
    }

    if (eventsRes && Array.isArray(eventsRes)) {
      appData.events = eventsRes;
      console.log(`Loaded ${eventsRes.length} events from API.`);
    }
    if (docsRes && Array.isArray(docsRes)) {
      appData.documents = docsRes;
      console.log(`Loaded ${docsRes.length} documents from API.`);
    }
    if (clubsRes && Array.isArray(clubsRes)) {
      appData.clubs = clubsRes;
      console.log(`Loaded ${clubsRes.length} clubs from API.`);
    }

    // Populate season/year selectors dynamically
    updateBocSeasonDropdown();
    updateEventFilterYearDropdown();

  } catch (error) {
    console.warn("Koneksi API gagal atau belum ter-deploy. Berhasil melakukan fallback ke data.js lokal. Error:", error);
    bocSirkuits = loadBocSirkuitsForYear(currentBocYear);
    
    // Fallback population
    updateBocSeasonDropdown();
    updateEventFilterYearDropdown();
  }
}

// Helper to dynamically populate public BOC season dropdown list
function updateBocSeasonDropdown() {
  const seasonSelect = document.getElementById("boc-public-season-select");
  if (!seasonSelect) return;

  const years = new Set(["2026", currentBocYear]);
  
  // Extract years from events
  (appData.events || []).forEach(e => {
    const mDate = e.date?.match(/\b(20\d{2})\b/);
    if (mDate) years.add(mDate[1]);
    const mTitle = e.title?.match(/\b(20\d{2})\b/);
    if (mTitle) years.add(mTitle[1]);
  });

  const sortedYears = Array.from(years).sort((a, b) => parseInt(a) - parseInt(b));
  
  const currentVal = seasonSelect.value || currentBocYear;
  
  seasonSelect.innerHTML = "";
  sortedYears.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = `Musim ${year}`;
    seasonSelect.appendChild(opt);
  });
  
  if (sortedYears.includes(currentVal)) {
    seasonSelect.value = currentVal;
  } else {
    seasonSelect.value = currentBocYear;
  }
}

// Helper to dynamically populate admin events filter year selector
function updateEventFilterYearDropdown() {
  const filterYear = document.getElementById("event-filter-year");
  if (!filterYear) return;

  const years = new Set(["2026", "2025", currentBocYear]);
  (appData.events || []).forEach(e => {
    const mDate = e.date?.match(/\b(20\d{2})\b/);
    if (mDate) years.add(mDate[1]);
    const mTitle = e.title?.match(/\b(20\d{2})\b/);
    if (mTitle) years.add(mTitle[1]);
  });

  const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Descending
  
  const currentVal = filterYear.value;
  filterYear.innerHTML = '<option value="">Semua Tahun</option>';
  sortedYears.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    filterYear.appendChild(opt);
  });

  if (currentVal && sortedYears.includes(currentVal)) {
    filterYear.value = currentVal;
  }
}

// 3. Mobile Menu Toggling
function setupMobileNav() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("navigation-menu");

  toggleBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    const icon = toggleBtn.querySelector("i");
    if (navMenu.classList.contains("active")) {
      icon.className = "fa-solid fa-xmark";
    } else {
      icon.className = "fa-solid fa-bars";
    }
  });

  // Login/Daftar button handler
  const loginBtn = document.getElementById("btn-header-login");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Hide public site sections
      const publicHeader = document.querySelector(".main-header");
      const publicContent = document.querySelector(".main-content");
      const publicFooter = document.querySelector(".main-footer");
      if (publicHeader) publicHeader.style.display = "none";
      if (publicContent) publicContent.style.display = "none";
      if (publicFooter) publicFooter.style.display = "none";
      // Hide particles
      document.querySelectorAll('.floating-particle, .glow-orb').forEach(p => p.style.display = 'none');
      // Show login screen
      const loginScreen = document.getElementById("admin-login-screen");
      if (loginScreen) loginScreen.style.display = "flex";
      // Update URL
      window.history.pushState({}, '', '/admin');
    });
  }
}

// 4. Tab Navigation Logic (Single Page Application Hub dengan Hash Routing & Mobile Navigation)
function setupTabNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const navMenu = document.getElementById("navigation-menu");
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const validTabs = ["home", "champions", "handicap", "events", "docs", "clubs", "about", "privacy", "terms"];

  window.switchTab = function(tabId, updateHash = true) {
    // Sembunyikan semua tab pane
    tabPanes.forEach(pane => {
      pane.classList.remove("active");
    });

    // Pastikan halaman profil atlet disembunyikan jika kita beralih tab
    const profilePage = document.getElementById('athlete-profile-page');
    if (profilePage) {
      profilePage.style.display = 'none';
    }

    // Pastikan detail event publik disembunyikan jika kita beralih tab
    const eventPage = document.getElementById('public-event-detail-page');
    if (eventPage) {
      eventPage.style.display = 'none';
    }
    window.activePublicEventId = null;

    // Hilangkan kelas aktif dari semua link
    navLinks.forEach(link => {
      link.classList.remove("active");
    });

    // Tampilkan pane terpilih
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
      targetPane.classList.add("active");
    }

    // Tandai tombol nav yang saat ini terpilih sebagai aktif
    navLinks.forEach(link => {
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("active");
      }
    });

    // Tandai tombol mobile bottom nav yang saat ini terpilih sebagai aktif
    const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
    mobileNavItems.forEach(item => {
      item.classList.remove("active");
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      }
    });

    // Di mobile, tutup menu setelah link diklik
    if (navMenu && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      if (toggleBtn) toggleBtn.querySelector("i").className = "fa-solid fa-bars";
    }

    // Perbarui hash URL agar halaman dapat dibagikan (shareable) & di-bookmark
    if (updateHash) {
      let hashName = tabId.replace("tab-", "");
      if (hashName === "champions") {
        hashName = `champions-${currentBocYear}`;
      }
      if (window.location.pathname.startsWith("/athletes/") || window.location.pathname.startsWith("/events/")) {
        window.history.pushState({}, '', '/#' + hashName);
      } else {
        window.location.hash = hashName;
      }
    }

    // Scroll halus ke atas konten
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Re-evaluate BOC announcement banner visibility globally
    if (typeof updateBocBannersVisibility === 'function') {
      updateBocBannersVisibility();
    }
  };

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Logo home trigger
  document.getElementById("logo-home-trigger").addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("tab-home");
  });

  // Deteksi navigasi Back / Forward browser via hashchange
  window.addEventListener("hashchange", async () => {
    const hash = window.location.hash.substring(1);
    if (validTabs.includes(hash)) {
      switchTab("tab-" + hash, false);
    } else if (hash.startsWith("champions-")) {
      const raw = hash.substring("champions-".length);
      let year = raw;
      let isPlayoff = false;
      if (raw.endsWith("-playoff")) {
        year = raw.substring(0, raw.length - "-playoff".length);
        isPlayoff = true;
      }
      if (year && /^\d{4}$/.test(year)) {
        currentBocYear = year;
        localStorage.setItem("currentBocYear", currentBocYear);
        bocSirkuits = loadBocSirkuitsForYear(year);
        await loadDataFromApi();
      }
      
      // Render standings for target year
      renderStandings();

      if (isPlayoff) {
        const playoffEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(year) || e.description?.includes(year)));
        if (playoffEvent) {
          openPublicEventDetail(playoffEvent.id);
        } else {
          const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
          const publicStandingsContainer = document.getElementById("boc-public-standings-container");
          if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
          if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
          switchTab("tab-champions", false);
        }
      } else {
        const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
        const publicStandingsContainer = document.getElementById("boc-public-standings-container");
        if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
        if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
        switchTab("tab-champions", false);
      }
    }
  });

  // Mobile Bottom Sheet Event Handlers (Menu Lainnya)
  const sheetOverlay = document.getElementById("mobile-sheet-overlay");
  const bottomSheet = document.getElementById("mobile-bottom-sheet");
  const moreTrigger = document.getElementById("mobile-more-trigger");
  const sheetClose = document.getElementById("mobile-sheet-close");

  if (moreTrigger && bottomSheet && sheetOverlay) {
    // Buka Bottom Sheet
    moreTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      bottomSheet.classList.add("active");
      sheetOverlay.classList.add("active");
    });

    // Tutup Bottom Sheet via Close Button
    if (sheetClose) {
      sheetClose.addEventListener("click", () => {
        bottomSheet.classList.remove("active");
        sheetOverlay.classList.remove("active");
      });
    }

    // Tutup Bottom Sheet via Click Overlay
    sheetOverlay.addEventListener("click", () => {
      bottomSheet.classList.remove("active");
      sheetOverlay.classList.remove("active");
    });
  }

  // Handle Klik Item di Dalam Bottom Sheet
  const sheetItems = document.querySelectorAll(".sheet-menu-item");
  sheetItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      if (tabId) {
        switchTab(tabId);
        // Tutup bottom sheet
        bottomSheet.classList.remove("active");
        sheetOverlay.classList.remove("active");
      }
    });
  });

  // Handle Tombol Login Admin di Bottom Sheet
  const mobileLoginTrigger = document.getElementById("mobile-login-trigger");
  if (mobileLoginTrigger) {
    mobileLoginTrigger.addEventListener("click", () => {
      window.location.href = "/admin";
    });
  }

  // Jalankan routing hash saat halaman pertama kali dibuka/direfresh (Akan dijalankan setelah data API termuat)
  // checkInitialRoute() dipanggil di akhir initApp()
}

// 4b. Initial Hash Routing Logic (to prevent race conditions on page refresh)
window.checkInitialRoute = function() {
  const validTabs = ["home", "champions", "handicap", "events", "docs", "clubs", "about", "privacy", "terms"];
  const initialHash = window.location.hash.substring(1);
  if (validTabs.includes(initialHash)) {
    switchTab("tab-" + initialHash, false);
  } else if (initialHash.startsWith("champions-")) {
    const raw = initialHash.substring("champions-".length);
    let year = raw;
    let isPlayoff = false;
    if (raw.endsWith("-playoff")) {
      year = raw.substring(0, raw.length - "-playoff".length);
      isPlayoff = true;
    }
    if (year && /^\d{4}$/.test(year)) {
      currentBocYear = year;
      localStorage.setItem("currentBocYear", currentBocYear);
      bocSirkuits = loadBocSirkuitsForYear(year);
    }
    
    // Render standings for targeted year first
    renderStandings();

    if (isPlayoff) {
      const playoffEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(year) || e.description?.includes(year)));
      if (playoffEvent) {
        openPublicEventDetail(playoffEvent.id);
      } else {
        const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
        const publicStandingsContainer = document.getElementById("boc-public-standings-container");
        if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
        if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
        switchTab("tab-champions", false);
      }
    } else {
      const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
      const publicStandingsContainer = document.getElementById("boc-public-standings-container");
      if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
      if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
      switchTab("tab-champions", false);
    }
  } else {
    // Only switch to home if there is no other tab or hash
    if (!initialHash) {
      switchTab("tab-home", false);
    }
  }
};

// 5. Load Statistics
function loadStatistics() {
  // Total Players Count
  const totalPlayers = appData.players.length;
  document.getElementById("stat-players-count").textContent = `${totalPlayers}+`;
  document.getElementById("hc-stat-total").textContent = totalPlayers;

  // Total Unique Clubs
  const clubs = [...new Set(appData.players.map(p => p.club))];
  document.getElementById("stat-clubs-count").textContent = clubs.length;

  // Active / Upcoming Events Count
  const totalEvents = appData.events.length;
  document.getElementById("stat-events-count").textContent = totalEvents;

  // Rata-rata Handicap (Weighted)
  const hcWeight = { '3B': 3, '3N': 3.3, '3A': 3.7, '4B': 4.2, '4A': 4.7 };
  const hcSum = appData.players.reduce((sum, p) => {
    const hcKey = p.handicap ? p.handicap.toString().trim() : '3N';
    return sum + (hcWeight[hcKey] || 3.5);
  }, 0);
  const hcAvg = (hcSum / totalPlayers).toFixed(1);
  document.getElementById("hc-stat-average").textContent = `HC ${hcAvg}`;

  // Handicap Paling Banyak
  const hcCounts = {};
  appData.players.forEach(p => {
    const hc = p.handicap ? p.handicap.toString().trim() : '3N';
    hcCounts[hc] = (hcCounts[hc] || 0) + 1;
  });
  let mostCommonHc = '3N';
  let maxCount = 0;
  for (const hc in hcCounts) {
    if (hcCounts[hc] > maxCount) {
      maxCount = hcCounts[hc];
      mostCommonHc = hc;
    }
  }
  document.getElementById("hc-stat-most").textContent = `HC ${mostCommonHc}`;

  // Hero Floating Cards Data: BOC Prize Pool Showcase (Static display in HTML)

  // Average handicap display
  const heroAvgHandicapEl = document.getElementById("hero-avg-handicap");
  if (heroAvgHandicapEl) heroAvgHandicapEl.textContent = `HC ${hcAvg}`;

  // Dynamic Hero Event Card
  const heroEvent = appData.events.find(e => e.status === "Live") || 
                    appData.events.find(e => e.status === "Daftar") || 
                    appData.events[0];
  const heroEventTitleEl = document.getElementById("hero-event-title");
  const heroEventDateEl = document.getElementById("hero-event-date");
  const heroEventSubEl = document.getElementById("hero-event-sub");
  const heroEventBadgeTextEl = document.getElementById("hero-event-badge-text");
  const heroEventBadgeDotEl = document.getElementById("hero-event-badge-dot");
  const heroEventBadgeContainer = document.getElementById("hero-event-badge-container");

  if (heroEvent && heroEventTitleEl) {
    // Title & Date
    heroEventTitleEl.textContent = heroEvent.title.toUpperCase();
    if (heroEventDateEl) heroEventDateEl.textContent = heroEvent.date.toUpperCase();
    if (heroEventSubEl) {
      heroEventSubEl.textContent = (heroEvent.venue || "POBSI BANJARNEGARA").toUpperCase();
    }

    // Dynamic Badge Status
    if (heroEventBadgeTextEl && heroEventBadgeDotEl && heroEventBadgeContainer) {
      // Reset classes
      heroEventBadgeDotEl.className = "live-badge-dot";
      heroEventBadgeContainer.className = "live-badge";

      const status = (heroEvent.status || "Daftar").toLowerCase();
      if (status === "live" || status === "tanding" || status === "aktif") {
        heroEventBadgeTextEl.textContent = "LIVE";
        heroEventBadgeDotEl.classList.add("dot-live");
        heroEventBadgeContainer.classList.add("badge-live");
      } else if (status === "daftar" || status === "pendaftaran" || status === "open") {
        heroEventBadgeTextEl.textContent = "OPEN REGISTRATION";
        heroEventBadgeDotEl.classList.add("dot-registration");
        heroEventBadgeContainer.classList.add("badge-registration");
      } else {
        heroEventBadgeTextEl.textContent = "EVENT END";
        heroEventBadgeDotEl.classList.add("dot-ended");
        heroEventBadgeContainer.classList.add("badge-ended");
      }
    }
  }
}

// 6. Load Home Highlights (Event & Top Standings Glance)
function loadHomeHighlights() {
  // A. Agenda Terdekat yang Pendaftarannya Dibuka
  const upcomingEvent = appData.events.find(e => e.status === "Daftar") || appData.events[0];
  const eventContainer = document.getElementById("featured-event-placeholder");

  if (upcomingEvent && eventContainer) {
    const statusClass = upcomingEvent.status === "Daftar" ? "daftar" : "selesai";
    const statusText = upcomingEvent.status === "Daftar" ? "Pendaftaran Dibuka" : "Event Selesai";
    
    eventContainer.innerHTML = `
      <div class="featured-event-flex">
        <div class="featured-event-poster-wrapper">
          <img src="${upcomingEvent.poster || 'images/event-poster.png'}" alt="Poster Event ${upcomingEvent.title}" class="featured-event-poster">
        </div>
        <div class="featured-event-body">
          <div class="featured-header-row">
            <h3 class="featured-title">${upcomingEvent.title}</h3>
            <span class="featured-status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="featured-details">
            <div class="detail-item"><i class="fa-solid fa-calendar"></i> ${upcomingEvent.date}</div>
            <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${upcomingEvent.venue}</div>
            <div class="detail-item"><i class="fa-solid fa-money-bill-wave"></i> Biaya: ${upcomingEvent.entryFee}</div>
            <div class="detail-item"><i class="fa-solid fa-phone"></i> Hub: ${upcomingEvent.contact.split(" ")[0]}</div>
          </div>
          <p class="featured-desc">${upcomingEvent.description}</p>
          <button class="btn btn-secondary btn-block" style="padding: 8px 16px; font-size: 0.85rem;" onclick="openPublicEventDetail('${upcomingEvent.id}')">
            <i class="fa-solid fa-circle-info"></i> Lihat Detail Event & Bagan
          </button>
        </div>
      </div>
    `;
  }

  // B. Sekilas BOC Klasemen 3 Besar
  const quickStandingsContainer = document.getElementById("quick-standings-placeholder");
  if (quickStandingsContainer) {
    const top3 = appData.standings.slice(0, 3);
    quickStandingsContainer.innerHTML = top3.map(player => {
      const slug = generateSlug(player.name);
      return `
      <div class="top-player-item">
        <div class="player-left">
          <div class="player-rank-medal rank-${player.rank}">
            ${player.rank === 1 ? '<i class="fa-solid fa-crown" style="font-size:0.75rem"></i>' : player.rank}
          </div>
          <div class="player-name-club">
            <a href="javascript:void(0)" onclick="openAthleteProfile('${slug}')" class="player-name-bold" style="color: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.15); transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(255,255,255,0.8)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">${player.name}</a>
            <span class="player-club-small">${player.club}</span>
          </div>
        </div>
        <div class="player-right-stats">
          <span class="player-hc-badge">HC ${player.handicap}</span>
          <span class="player-points-text">${player.points} Pts</span>
        </div>
      </div>
      `;
    }).join("");
  }
}

// 7. Battle of Champions Leaderboard Logic
// 7. Battle of Champions Leaderboard Logic
const exactBocPoints = {
  "Pak Teguh RD": [9, 7, 3, 9, "", "", "", "", "", ""],
  "Edo Luminous": ["", 9, "", 12, "", "", "", "", "", ""],
  "Didon": [3, 12, 1, "", "", "", "", "", "", ""],
  "Dika Luminous": [5, "", 3, 3, "", "", "", "", "", ""],
  "Rafael JP": [7, 3, 3, 1, "", "", "", "", "", ""],
  "Rio RD": ["", 5, 9, 5, "", "", "", "", "", ""],
  "Dodo RD": [1, 5, 5, 5, "", "", "", "", "", ""],
  "Ageng PLT": ["", "", 12, 5, "", "", "", "", "", ""],
  "To'i PLT": ["", 7, 7, 3, "", "", "", "", "", ""],
  "Faiz PLT": ["", "", 7, 1, "", "", "", "", "", ""],
  "Hendik PLT": [7, 3, 3, 1, "", "", "", "", "", ""],
  "Ade Atlas": [3, 1, 9, "", "", "", "", "", "", ""],
  "Santo Quantum": [5, "", 1, 7, "", "", "", "", "", ""],
  "Akbar": ["", 5, "", 7, "", "", "", "", "", ""],
  "Doni Lalapo": [12, "", "", "", "", "", "", "", "", ""],
  "Satria Atlas": [5, 1, "", 1, "", "", "", "", "", ""]
};

// Initialize exactBocPoints from localStorage if available
try {
  const savedBocPoints = localStorage.getItem("exactBocPoints");
  if (savedBocPoints) {
    Object.assign(exactBocPoints, JSON.parse(savedBocPoints));
  }
} catch (e) {
  console.error("Failed to load exactBocPoints from localStorage", e);
}

// Global sirkuit list variable — stored per-year as bocSirkuits_YEAR
let bocSirkuits = [];
let currentBocYear = localStorage.getItem("currentBocYear") || "2026";

// Global BOC Settings cache — loaded from API, fallback to defaults
let bocSettings = {
  year: currentBocYear,
  cutoff_limit: 16,
  max_handicap: 'Bebas',
  playoff_schedule: null,
  prizes: null,
  rules: null,
  point_rules: null,
  status: 'active',
  recap_cover: null
};

const defaultPointRules = {
  circuit_points: { champion: 12, runnerUp: 9, top4: 7, top8: 5, top16: 3, top32: 1 },
  hc_points: { champion: 30, runnerUp: 20, top4: 10, others: 0 },
  hc_thresholds: { "3B": 30, "3N": 60, "3A": 150, "4B": 200, "4A": 300, "5B": 400, "5A": 500, "6": 600 }
};

// Load BOC settings from API for a given year
async function loadBocSettings(year) {
  try {
    const res = await fetch(`/api/boc-settings?year=${year || currentBocYear}`);
    if (res.ok) {
      bocSettings = await res.json();
      console.log(`✅ BOC Settings loaded for year ${year || currentBocYear}`, bocSettings);
    }
  } catch (e) {
    console.warn("Failed to load BOC settings from API, using defaults.", e);
  }
  applyBocSettingsToDOM();
  return bocSettings;
}

// Save BOC settings to API
async function saveBocSettings(settingsObj) {
  try {
    const payload = { ...bocSettings, ...settingsObj, year: settingsObj.year || currentBocYear };
    const res = await fetch('/api/boc-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const result = await res.json();
      bocSettings = { ...payload };
      // Parse JSON fields if they came back as strings
      if (typeof bocSettings.playoff_schedule === 'string') {
        try { bocSettings.playoff_schedule = JSON.parse(bocSettings.playoff_schedule); } catch (e) {}
      }
      if (typeof bocSettings.prizes === 'string') {
        try { bocSettings.prizes = JSON.parse(bocSettings.prizes); } catch (e) {}
      }
      if (typeof bocSettings.point_rules === 'string') {
        try { bocSettings.point_rules = JSON.parse(bocSettings.point_rules); } catch (e) {}
      }
      applyBocSettingsToDOM();
      return result;
    }
  } catch (e) {
    console.error("Failed to save BOC settings to API:", e);
  }
  return null;
}

// Update DOM elements based on loaded/saved settings
function applyBocSettingsToDOM() {
  const prizes = bocSettings.prizes || {};
  const totalPrizeEl = document.getElementById("hero-boc-prizepool-total");
  const prize1El = document.getElementById("hero-boc-prize-1");
  const prize2El = document.getElementById("hero-boc-prize-2");
  const prize3El = document.getElementById("hero-boc-prize-3");

  if (prize1El) prize1El.textContent = prizes.juara1 || "RP 7,5 JT";
  if (prize2El) prize2El.textContent = prizes.juara2 || "RP 4,5 JT";
  if (prize3El) prize3El.textContent = prizes.juara3 || "RP 3,0 JT";

  // Update cover backgrounds across tabs
  const publicHero = document.getElementById("boc-public-hero-section");
  if (publicHero) {
    if (bocSettings.cover) {
      publicHero.style.backgroundImage = `linear-gradient(90deg, rgba(6, 11, 24, 0.95) 0%, rgba(6, 11, 24, 0.85) 30%, rgba(6, 11, 24, 0.25) 65%, rgba(6, 11, 24, 0.95) 100%), url('${bocSettings.cover}')`;
    } else {
      publicHero.style.backgroundImage = `linear-gradient(90deg, rgba(6, 11, 24, 0.95) 0%, rgba(6, 11, 24, 0.85) 30%, rgba(6, 11, 24, 0.25) 65%, rgba(6, 11, 24, 0.95) 100%), url('/images/hero-player.png')`;
    }
  }

  const playoffCover = document.getElementById("boc-playoff-hero-bg");
  if (playoffCover) {
    if (bocSettings.cover) {
      playoffCover.style.backgroundImage = `url('${bocSettings.cover}')`;
      playoffCover.style.opacity = "0.22"; // slightly higher opacity for custom covers
    } else {
      playoffCover.style.backgroundImage = "none";
      playoffCover.style.opacity = "0.18";
    }
  }

  const adminCover = document.getElementById("boc-admin-header-bg");
  if (adminCover) {
    adminCover.style.backgroundImage = "none";
  }

  if (totalPrizeEl) {
    if (prizes.juara1 || prizes.juara2 || prizes.juara3) {
      let total = 0;
      const extractNumber = (str) => {
        if (!str) return 0;
        const clean = str.replace(/[^0-9]/g, "");
        return parseInt(clean, 10) || 0;
      };
      const p1 = extractNumber(prizes.juara1);
      const p2 = extractNumber(prizes.juara2);
      const p3 = extractNumber(prizes.juara3);
      const pb = extractNumber(prizes.best_game);
      total = p1 + p2 + p3 + pb;
      if (total > 0) {
        totalPrizeEl.textContent = `RP ${total.toLocaleString('id-ID')}`;
      } else {
        totalPrizeEl.textContent = "RP 15.000.000";
      }
    } else {
      totalPrizeEl.textContent = "RP 15.000.000";
    }
  }

  // Update Season Recap background
  const recapSection = document.querySelector(".boc-recap-section");
  if (recapSection) {
    if (bocSettings.recap_cover) {
      recapSection.style.setProperty('--boc-recap-bg', `url('${bocSettings.recap_cover}')`);
    } else {
      recapSection.style.removeProperty('--boc-recap-bg');
    }
  }

  // Update dynamic cutoff limit indicators in DOM
  const dynamicCutoffs = document.querySelectorAll(".dynamic-boc-cutoff");
  dynamicCutoffs.forEach(el => {
    el.textContent = bocSettings.cutoff_limit || "16";
  });

  const tableCutoff = document.getElementById("table-set-boc-cutoff");
  if (tableCutoff) tableCutoff.value = bocSettings.cutoff_limit || 16;
  const setBocCutoff = document.getElementById("set-boc-cutoff");
  if (setBocCutoff) setBocCutoff.value = bocSettings.cutoff_limit || 16;
  const tabSetBocCutoff = document.getElementById("tab-set-boc-cutoff");
  if (tabSetBocCutoff) tabSetBocCutoff.value = bocSettings.cutoff_limit || 16;

  // Populate Point & Handicap settings form if present
  const ptsCircuitChampion = document.getElementById("pts-circuit-champion");
  if (ptsCircuitChampion) {
    const rules = bocSettings.point_rules || defaultPointRules;
    const cp = rules.circuit_points || defaultPointRules.circuit_points;
    const hp = rules.hc_points || defaultPointRules.hc_points;
    const ht = rules.hc_thresholds || defaultPointRules.hc_thresholds;

    ptsCircuitChampion.value = cp.champion ?? 12;
    document.getElementById("pts-circuit-runnerUp").value = cp.runnerUp ?? 9;
    document.getElementById("pts-circuit-top4").value = cp.top4 ?? 7;
    document.getElementById("pts-circuit-top8").value = cp.top8 ?? 5;
    document.getElementById("pts-circuit-top16").value = cp.top16 ?? 3;
    document.getElementById("pts-circuit-top32").value = cp.top32 ?? 1;

    document.getElementById("pts-hc-champion").value = hp.champion ?? 30;
    document.getElementById("pts-hc-runnerUp").value = hp.runnerUp ?? 20;
    document.getElementById("pts-hc-top4").value = hp.top4 ?? 10;
    document.getElementById("pts-hc-others").value = hp.others ?? 0;

    document.getElementById("th-hc-3b").value = ht["3B"] ?? 30;
    document.getElementById("th-hc-3n").value = ht["3N"] ?? 60;
    document.getElementById("th-hc-3a").value = ht["3A"] ?? 150;
    document.getElementById("th-hc-4b").value = ht["4B"] ?? 200;
    document.getElementById("th-hc-4a").value = ht["4A"] ?? 300;
    document.getElementById("th-hc-5b").value = ht["5B"] ?? 400;
    document.getElementById("th-hc-5a").value = ht["5A"] ?? 500;
    document.getElementById("th-hc-6").value = ht["6"] ?? 600;
  }
}

// Helper: load sirkuits for a specific year from localStorage
function loadBocSirkuitsForYear(year) {
  try {
    const saved = localStorage.getItem(`bocSirkuits_${year}`);
    if (saved) {
      return JSON.parse(saved);
    }
    // Migrate legacy key if exists and current year matches
    const legacy = localStorage.getItem("bocSirkuits");
    if (legacy && year === "2026") {
      const parsed = JSON.parse(legacy);
      localStorage.setItem(`bocSirkuits_${year}`, legacy);
      localStorage.removeItem("bocSirkuits");
      return parsed;
    }
  } catch (e) {
    console.error(`Failed to load bocSirkuits for year ${year}`, e);
  }
  return [];
}

// Helper: save sirkuits for a specific year to the database server
async function saveBocSirkuitsToServer(year, sirkuits) {
  if (!isServerOnline) return;
  try {
    const res = await fetch('/api/boc-sirkuits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, sirkuits })
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Gagal menyimpan sirkuits ke server:", err.error);
    }
  } catch (err) {
    console.error("Error koneksi menyimpan sirkuits:", err);
  }
}

bocSirkuits = loadBocSirkuitsForYear(currentBocYear);

function parseIndonesianDate(dateStr) {
  if (!dateStr) return null;
  const months = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
    'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
  };
  const parts = dateStr.trim().toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function formatIndonesianDate(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (!isNaN(date.getTime())) {
      return `${days[date.getDay()]}, ${parseInt(parts[2], 10)} ${months[date.getMonth()]} ${parts[0]}`;
    }
  }
  return dateStr;
}

function formatSqlDate(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(parts[2], 10)} ${months[parts[1] - 1]} ${parts[0]}`;
  }
  return dateStr;
}

function getDefaultBocScheduleDate() {
  const events = appData.events || [];
  const sirkuitEvents = events.filter(e => e.elimination_type !== 'boc');
  
  let lastDate = null;
  sirkuitEvents.forEach(e => {
    if (e.date) {
      const parsed = parseIndonesianDate(e.date);
      if (parsed && (!lastDate || parsed > lastDate)) {
        lastDate = parsed;
      }
    }
  });
  
  const targetDate = lastDate ? new Date(lastDate.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getHandicapColorClass(handicap) {
  if (!handicap) return '';
  const cleanHc = String(handicap).trim().toUpperCase();
  switch (cleanHc) {
    case '3B': return 'badge-hc-3b';
    case '3N': return 'badge-hc-3n';
    case '3A': return 'badge-hc-3a';
    case '4B': return 'badge-hc-4b';
    case '4A': return 'badge-hc-4a';
    case '5B': return 'badge-hc-5b';
    case '5A': return 'badge-hc-5a';
    case '6': return 'badge-hc-6';
    case '7': return 'badge-hc-7';
    default: return '';
  }
}

function getPlayerEventScores(name, totalPoints) {
  if (exactBocPoints[name]) {
    const pts = exactBocPoints[name];
    if (pts.length < bocSirkuits.length) {
      while (pts.length < bocSirkuits.length) pts.push("");
    } else if (pts.length > bocSirkuits.length) {
      return pts.slice(0, bocSirkuits.length);
    }
    return pts;
  }
  
  const scores = Array(bocSirkuits.length).fill("");
  if (!totalPoints || totalPoints <= 0) return scores;
  
  let remaining = totalPoints;
  const pointValues = [12, 9, 7, 5, 3, 1];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const spreadCount = Math.min(5, bocSirkuits.length);
  for (let i = 0; i < spreadCount; i++) {
    if (remaining <= 0) break;
    
    const valIdx = (hash + i) % pointValues.length;
    const val = pointValues[valIdx];
    
    if (val <= remaining) {
      scores[i] = val;
      remaining -= val;
    } else {
      if (pointValues.includes(remaining)) {
        scores[i] = remaining;
        remaining = 0;
      }
    }
  }
  
  if (remaining > 0) {
    for (let i = 0; i < spreadCount; i++) {
      const curVal = scores[i] === "" ? 0 : scores[i];
      if (curVal + remaining <= 12) {
        scores[i] = curVal + remaining;
        remaining = 0;
        break;
      }
    }
  }
  
  return scores;
}

function renderStandings(searchQuery = "") {
  const tableBody = document.getElementById("standings-table-body");
  if (!tableBody) return;

  // Hide playoff and restore standings if playoff event is missing/removed
  const playoffEventCheck = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(currentBocYear) || e.description?.includes(currentBocYear)));
  const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
  const publicStandingsContainer = document.getElementById("boc-public-standings-container");
  if (!playoffEventCheck) {
    if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
    if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
  }

  // Dynamic Year for Public Champions Tab Headers
  const sectionTitle = document.querySelector("#tab-champions .section-title");
  if (sectionTitle) sectionTitle.textContent = `Battle Of Champions ${currentBocYear}`;
  const sectionSubtitle = document.querySelector("#tab-champions .section-subtitle");
  if (sectionSubtitle) sectionSubtitle.textContent = `Papan klasemen akumulasi poin atlet biliar Banjarnegara dalam seri sirkuit Battle of Champions ${currentBocYear} resmi.`;
  const ruleYearSpan = document.querySelector("#tab-champions .rules-card-title");
  if (ruleYearSpan) ruleYearSpan.innerHTML = `<i class="fa-solid fa-circle-info text-gold"></i> Aturan Kelayakan & Poin BOC ${currentBocYear}`;
  const cutoffLimit = bocSettings.cutoff_limit || 16;
  const ruleYearDesc = document.querySelector("#tab-champions .rules-card-desc");
  if (ruleYearDesc) ruleYearDesc.innerHTML = `Sesuai Surat Edaran Resmi POBSI Banjarnegara, <span class="dynamic-boc-cutoff">${cutoffLimit}</span> pemain teratas (Cut-off Zona BOC) pada akhir musim November ${currentBocYear} berhak tampil di babak final bergengsi. Poin diperoleh dari keikutsertaan turnamen resmi:`;

  // Update Year Selector dropdown selection if needed
  const seasonSelect = document.getElementById("boc-public-season-select");
  if (seasonSelect && seasonSelect.value !== currentBocYear) {
    seasonSelect.value = currentBocYear;
  }

  // Dynamic Statistics
  const seriesEl = document.getElementById("boc-hero-stat-series");
  const playersEl = document.getElementById("boc-hero-stat-players");
  const cutoffEl = document.getElementById("boc-hero-stat-cutoff");
  const prizepoolEl = document.getElementById("boc-hero-stat-prizepool");

  const activeStandings = (appData.standings || []).filter(p => parseInt(p.points || 0, 10) > 0);

  if (seriesEl) seriesEl.textContent = `${bocSirkuits.length} Seri`;
  if (playersEl) playersEl.textContent = `${activeStandings.length} Atlet`;
  
  const playerCutoff = activeStandings.find(p => p.rank === cutoffLimit) || activeStandings[activeStandings.length - 1];
  const cutoffPoints = playerCutoff ? playerCutoff.points : 0;
  if (cutoffEl) cutoffEl.textContent = `${cutoffPoints} Pts`;
  
  const estimatedPrize = activeStandings.length * 150000;
  if (prizepoolEl) prizepoolEl.textContent = `Rp ${estimatedPrize.toLocaleString('id-ID')}`;

  // Render Sirkuit Roadmap Timeline
  const roadmapTimeline = document.getElementById("boc-public-roadmap");
  if (roadmapTimeline) {
    roadmapTimeline.innerHTML = bocSirkuits.map((sirkuitName, idx) => {
      const matchEvent = appData.events.find(e => e.title && e.title.toUpperCase().includes(sirkuitName.toUpperCase()));
      let statusClass = "";
      let statusText = "Menunggu";
      if (matchEvent) {
        if (matchEvent.status === "Selesai") {
          statusClass = "completed";
          statusText = "Selesai";
        } else if (matchEvent.status === "Ongoing" || matchEvent.status === "Daftar") {
          statusClass = "ongoing";
          statusText = "Berlangsung";
        }
      } else {
        // Fallback for placeholder mapping if no matching event in active data
        if (idx < 3) {
          statusClass = "completed";
          statusText = "Selesai";
        } else if (idx === 3) {
          statusClass = "ongoing";
          statusText = "Berlangsung";
        }
      }
      return `
        <div class="boc-roadmap-node ${statusClass}">
          <div class="boc-roadmap-node-circle">${idx + 1}</div>
          <span class="boc-roadmap-node-title">${sirkuitName}</span>
          <span class="boc-roadmap-node-status">${statusText}</span>
        </div>
      `;
    }).join("");
  }



  // Render Table Headers Dynamically
  const table = document.getElementById("standings-table");
  
  // Find completed/active sirkuits that have already run/completed
  const completedSirkuits = (bocSirkuits || []).map((s, idx) => ({ name: s, index: idx })).filter(item => {
    // 1. Check if matching event is completed (status "Selesai")
    const sName = item.name.toUpperCase().trim();
    let sKeyword = sName.split(" ")[0];
    const keywordMap = {
      "LMS": "LUMINOUS",
      "SYP": "SURYA",
      "PLT": "PLATINUM"
    };
    sKeyword = keywordMap[sKeyword] || sKeyword;

    let sSeries = "1";
    const sMatch = sName.match(/\((\d+)\)/);
    if (sMatch) {
      sSeries = sMatch[1];
    } else if (sName.includes(" 2")) {
      sSeries = "2";
    } else if (sName.includes(" 3")) {
      sSeries = "3";
    }

    const matches = (appData.events || []).filter(e => {
      if (!e.title) return false;
      const eTitle = e.title.toUpperCase();
      const words = eTitle.split(/[^A-Z0-9]+/);
      if (!words.includes(sKeyword)) return false;
      const isHtEvent = eTitle.includes("HOME") || eTitle.includes("HT") || eTitle.includes("CLUB");
      const isHtSirkuit = sName.includes("HT");
      if (isHtSirkuit && !isHtEvent) return false;
      return true;
    }).sort((a, b) => (a.id || "").localeCompare(b.id || ""));

    const seriesIdx = parseInt(sSeries, 10) - 1;
    const matchEvent = matches[seriesIdx];
    if (matchEvent && matchEvent.status === "Selesai") return true;

    // 2. Check if anyone has points in exactBocPoints for this sirkuit index
    for (let pName in exactBocPoints) {
      if (exactBocPoints[pName] && exactBocPoints[pName][item.index] !== undefined && exactBocPoints[pName][item.index] !== "") {
        return true;
      }
    }
    return false;
  });

  if (table) {
    const minTableWidth = 550 + (completedSirkuits.length * 80);
    table.style.minWidth = `${minTableWidth}px`;
  }

  const thead = document.querySelector("#standings-table thead");
  if (thead) {
    const sirkuitHeaders = completedSirkuits.map((item) => {
      const idx = item.index;
      const sirkuit = item.name;
      let color = "#60a5fa";
      if (idx >= 4 && idx < 8) color = "#fbbf24";
      else if (idx >= 8) color = "#ef4444";
      return `<th class="text-center" style="padding: 14px 4px; font-size: 0.68rem; font-weight: 800; color: ${color}; width: 80px; white-space: nowrap;">${sirkuit}</th>`;
    }).join("");
    
    thead.innerHTML = `
      <tr style="background: rgba(15, 23, 42, 0.7); border-bottom: 2px solid rgba(255, 255, 255, 0.06);">
        <th class="text-center sticky-col" style="padding: 14px 6px; width: 50px; font-weight: 800; white-space: nowrap; left: 0;">NO</th>
        <th class="sticky-col" style="padding: 14px 12px; width: 180px; font-weight: 800; white-space: nowrap; text-align: left; left: 50px;">NAMA</th>
        <th class="text-center sticky-col" style="padding: 14px 6px; width: 65px; font-weight: 800; white-space: nowrap; left: 230px;">HC</th>
        ${sirkuitHeaders}
        <th class="text-center text-gold sticky-col" style="padding: 14px 8px; font-weight: 900; width: 100px; background: rgba(251, 191, 36, 0.05); white-space: nowrap; right: 130px;">TOTAL POINT</th>
        <th class="sticky-col" style="padding: 14px 12px; width: 130px; white-space: nowrap; text-align: left; right: 0;">KETERANGAN</th>
      </tr>
    `;
  }

  const filtered = appData.standings.filter(p => {
    const pts = parseInt(p.points || 0, 10);
    if (pts <= 0) return false;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.club.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    const ptsA = parseInt(a.points || 0, 10);
    const ptsB = parseInt(b.points || 0, 10);
    if (ptsB !== ptsA) return ptsB - ptsA;
    // Secondary sort by rank ascending
    const rankA = parseInt(a.rank || 999, 10);
    const rankB = parseInt(b.rank || 999, 10);
    return rankA - rankB;
  });

  // Pagination Configuration (20 per page)
  const itemsPerPage = 20;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (standingsCurrentPage > totalPages) {
    standingsCurrentPage = totalPages;
  }
  if (standingsCurrentPage < 1) {
    standingsCurrentPage = 1;
  }

  const startIndex = (standingsCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pagedItems = filtered.slice(startIndex, endIndex);

  // Render Table Rows
  tableBody.innerHTML = pagedItems.map((player, idx) => {
    const cutoffLimit = bocSettings.cutoff_limit || 16;
    const isBocZone = player.rank <= cutoffLimit;
    const highlightClass = isBocZone ? 'boc-qualified-row' : '';
    
    // Get exact or deterministic event scores
    const eventScores = getPlayerEventScores(player.name, player.points);
    
    const scoresHtml = completedSirkuits.map(item => {
      const score = eventScores[item.index];
      if (score !== undefined && score !== "") {
        let colorClass = "boc-score-gold";
        if (score === 12) colorClass = "boc-score-champion";
        else if (score >= 7) colorClass = "boc-score-podium";
        else if (score >= 3) colorClass = "boc-score-finalist";
        
        return `<td class="text-center" style="padding: 10px 4px; width: 80px; white-space: nowrap;"><span class="boc-score-pill ${colorClass}">${score}</span></td>`;
      }
      return `<td class="text-center" style="padding: 10px 4px; color: rgba(255,255,255,0.04); font-weight: 300; width: 80px; white-space: nowrap;">-</td>`;
    }).join("");

    const rowHtml = `
      <tr class="${highlightClass}" onclick="openAthleteProfile('${generateSlug(player.name)}')" style="border-bottom: 1px solid rgba(255,255,255,0.03); white-space: nowrap; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.03)'" onmouseout="this.style.backgroundColor=''">
        <td class="text-center table-rank-bold sticky-col" style="padding: 12px 6px; white-space: nowrap; left: 0; width: 50px;">${player.rank}</td>
        <td class="table-name-bold sticky-col" style="padding: 12px 12px; white-space: nowrap; text-align: left; left: 50px; width: 180px;">
          <div style="display:flex; align-items:center; gap:6px; white-space: nowrap; text-align: left; font-weight: 700; color: #fff;">
            ${player.name}
          </div>
        </td>
        <td class="text-center sticky-col" style="padding: 12px 6px; white-space: nowrap; left: 230px; width: 65px;"><span class="table-badge-hc ${getHandicapColorClass(player.handicap)}">HC ${player.handicap}</span></td>
        ${scoresHtml}
        <td class="text-center text-gold sticky-col" style="font-weight:900; padding: 12px 8px; font-size: 0.88rem; background: rgba(251, 191, 36, 0.03); white-space: nowrap; right: 130px; width: 100px;">${player.points}</td>
        <td class="sticky-col" style="padding: 12px 12px; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; text-align: left; overflow: hidden; text-overflow: ellipsis; right: 0; width: 130px;">
          ${isBocZone ? '<span style="color: #fbbf24; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown"></i> Lolos BOC</span>' : '-'}
        </td>
      </tr>
    `;

    const dividerHtml = (player.rank === cutoffLimit) ? `
      <tr class="boc-cutoff-divider-row">
        <td colspan="${5 + completedSirkuits.length}">
          <i class="fa-solid fa-triangle-exclamation"></i> Batas Kualifikasi Zona Merah BOC (Cut-Off Line ${cutoffLimit} Besar) <i class="fa-solid fa-triangle-exclamation"></i>
        </td>
      </tr>
    ` : '';

    return rowHtml + dividerHtml;
  }).join("");

  if (totalItems === 0) {
    tableBody.innerHTML = `<tr><td colspan="15" class="text-center" style="padding:40px; color:var(--text-muted)"><i class="fa-solid fa-folder-open" style="font-size:1.8rem; margin-bottom:12px; display:block"></i> Atlet tidak ditemukan</td></tr>`;
  }

  // Update Pagination Info
  const pageRangeEl = document.getElementById("standings-page-range");
  const totalCountEl = document.getElementById("standings-total-count");
  if (pageRangeEl && totalCountEl) {
    pageRangeEl.textContent = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : "0-0";
    totalCountEl.textContent = totalItems;
  }

  // Render Page Numbers
  renderStandingsPageNumbers(totalPages);

  // Playoff & Schedule Banner Check
  const playoffBanner = document.getElementById("boc-playoff-banner");
  const scheduleBanner = document.getElementById("boc-schedule-banner");
  if (playoffBanner && scheduleBanner) {
    updateBocBannersVisibility();
  }
}

// Global helper to manage visibility of BOC announcement banners globally
function updateBocBannersVisibility() {
  const playoffBanner = document.getElementById("boc-playoff-banner");
  const scheduleBanner = document.getElementById("boc-schedule-banner");
  const notScheduledBanner = document.getElementById("boc-not-scheduled-banner");
  if (!playoffBanner || !scheduleBanner) return;

  const playoffEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(currentBocYear) || e.description?.includes(currentBocYear)));
  const savedSchedule = bocSettings.playoff_schedule;

  // Inject Year dynamically to all banners
  const dynamicYears = document.querySelectorAll(".dynamic-boc-year");
  dynamicYears.forEach(span => {
    span.textContent = currentBocYear;
  });

  if (playoffEvent) {
    playoffBanner.style.display = "flex";
    scheduleBanner.style.display = "none";
    if (notScheduledBanner) notScheduledBanner.style.display = "none";

    const descEl = document.getElementById("boc-playoff-banner-desc");
    const iconBgEl = document.getElementById("boc-playoff-banner-icon-bg");
    const iconEl = document.getElementById("boc-playoff-banner-icon");
    const viewBtn = document.getElementById("btn-view-boc-playoff");

    if (playoffEvent.status === 'Selesai') {
      // Completed State style (Blue Theme)
      playoffBanner.style.background = "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)";
      playoffBanner.style.borderColor = "rgba(56, 189, 248, 0.25)";
      playoffBanner.style.boxShadow = "var(--shadow-lg), 0 0 35px rgba(56, 189, 248, 0.03)";
      
      if (iconBgEl) {
        iconBgEl.style.background = "rgba(56, 189, 248, 0.15)";
        iconBgEl.style.borderColor = "rgba(56, 189, 248, 0.2)";
        iconBgEl.style.color = "#38bdf8";
        iconBgEl.style.boxShadow = "0 0 15px rgba(56, 189, 248, 0.2)";
      }
      if (iconEl) {
        iconEl.className = "fa-solid fa-award";
      }
      if (descEl) {
        descEl.textContent = `Turnamen puncak Grand Final Battle of Champions ${currentBocYear} telah selesai diselenggarakan! Lihat siapa yang berhasil merebut mahkota juara utama musim ini.`;
      }
      if (viewBtn) {
        viewBtn.innerHTML = '<i class="fa-solid fa-square-poll-vertical"></i> Lihat Hasil BOC';
        viewBtn.style.background = "linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)";
        viewBtn.style.color = "#fff";
        viewBtn.style.boxShadow = "0 4px 15px rgba(56, 189, 248, 0.3)";
      }
    } else {
      // Ongoing/default State style (Gold/Yellow Theme)
      playoffBanner.style.background = "linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)";
      playoffBanner.style.borderColor = "rgba(251, 191, 36, 0.25)";
      playoffBanner.style.boxShadow = "var(--shadow-lg), 0 0 35px rgba(251, 191, 36, 0.03)";
      
      if (iconBgEl) {
        iconBgEl.style.background = "rgba(251, 191, 36, 0.15)";
        iconBgEl.style.borderColor = "rgba(251, 191, 36, 0.2)";
        iconBgEl.style.color = "#fbbf24";
        iconBgEl.style.boxShadow = "0 0 15px rgba(251, 191, 36, 0.2)";
      }
      if (iconEl) {
        iconEl.className = "fa-solid fa-trophy";
      }
      if (descEl) {
        descEl.textContent = "Fase playoff sedang berlangsung! Pantau perjuangan 16 atlet kualifikasi terbaik memperebutkan mahkota juara utama secara langsung.";
      }
      if (viewBtn) {
        viewBtn.innerHTML = '<i class="fa-solid fa-square-poll-vertical"></i> Lihat Live Bracket & Playoff';
        viewBtn.style.background = "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)";
        viewBtn.style.color = "#0f172a";
        viewBtn.style.boxShadow = "0 4px 15px rgba(251, 191, 36, 0.3)";
      }
    }
    
    if (viewBtn) {
      const newViewBtn = viewBtn.cloneNode(true);
      viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);
      newViewBtn.addEventListener("click", () => {
        openPublicEventDetail(playoffEvent.id);
      });
    }
  } else if (savedSchedule) {
    playoffBanner.style.display = "none";
    scheduleBanner.style.display = "flex";
    if (notScheduledBanner) notScheduledBanner.style.display = "none";
    
    const schedule = typeof savedSchedule === 'string' ? JSON.parse(savedSchedule) : savedSchedule;
    const bannerTextEl = document.getElementById("boc-schedule-banner-text");
    if (bannerTextEl) {
      bannerTextEl.innerHTML = `Grand Final BOC telah dijadwalkan pada <strong>${formatIndonesianDate(schedule.date)} pukul ${schedule.time} WIB</strong> di <strong>${schedule.venue}</strong>. ${schedule.notes || ''}`;
    }
  } else {
    playoffBanner.style.display = "none";
    scheduleBanner.style.display = "none";
    if (notScheduledBanner) notScheduledBanner.style.display = "flex";
  }
}

function renderStandingsPageNumbers(totalPages) {
  const container = document.getElementById("standings-page-numbers");
  if (!container) return;

  container.innerHTML = "";
  
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `pm-page-btn ${standingsCurrentPage === i ? "active" : ""}`;
    btn.textContent = i;
    btn.style.width = "28px";
    btn.style.height = "28px";
    btn.style.borderRadius = "6px";
    btn.style.border = standingsCurrentPage === i ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)";
    btn.style.background = standingsCurrentPage === i ? "var(--gradient-primary)" : "rgba(255,255,255,0.02)";
    btn.style.color = standingsCurrentPage === i ? "#fff" : "var(--text-dim)";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "0.78rem";
    btn.style.fontWeight = "600";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.transition = "var(--transition-fast)";
    
    btn.addEventListener("click", () => {
      standingsCurrentPage = i;
      const input = document.getElementById("standings-search-input");
      renderStandings(input ? input.value : "");
    });
    
    container.appendChild(btn);
  }
}

function setupStandingsSearch() {
  const input = document.getElementById("standings-search-input");
  if (input) {
    input.addEventListener("input", (e) => {
      standingsCurrentPage = 1; // Reset to page 1 on search
      renderStandings(e.target.value);
    });
  }

  // Bind Season Selector dropdown
  const seasonSelect = document.getElementById("boc-public-season-select");
  if (seasonSelect) {
    seasonSelect.value = currentBocYear;
    seasonSelect.addEventListener("change", async (e) => {
      currentBocYear = e.target.value;
      localStorage.setItem("currentBocYear", currentBocYear);
      bocSirkuits = loadBocSirkuitsForYear(currentBocYear);
      
      // Update hash URL dynamically
      if (window.location.hash !== "#champions-" + currentBocYear) {
        window.history.pushState({}, "", "/#champions-" + currentBocYear);
      }

      // Fetch new database data and settings from API for the selected year
      await loadDataFromApi();
      await loadBocSettings(currentBocYear);

      // Re-render dashboard components
      loadStatistics();
      loadHomeHighlights();
      renderStandings(input ? input.value : "");
    });
  }

  // Prev / Next Page Buttons
  const btnPrev = document.getElementById("standings-prev-page");
  const btnNext = document.getElementById("standings-next-page");

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (standingsCurrentPage > 1) {
        standingsCurrentPage--;
        renderStandings(input ? input.value : "");
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const itemsPerPage = 20;
      const filtered = appData.standings.filter(p => 
        !input || p.name.toLowerCase().includes(input.value.toLowerCase()) ||
        p.club.toLowerCase().includes(input.value.toLowerCase())
      );
      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      
      if (standingsCurrentPage < totalPages) {
        standingsCurrentPage++;
        renderStandings(input ? input.value : "");
      }
    });
  }
}

// 8. Handicap Registry Database Logic
function populateClubFilters() {
  const clubSelect = document.getElementById("club-filter-select");
  if (!clubSelect) return;

  // Reset dropdown except the first option
  clubSelect.innerHTML = '<option value="all">Semua Klub</option>';

  const clubs = [...new Set(appData.players.map(p => p.club))].sort();
  clubs.forEach(club => {
    if (!club) return;
    const opt = document.createElement("option");
    opt.value = club;
    opt.textContent = club;
    clubSelect.appendChild(opt);
  });
}

function renderHandicapList() {
  const tableBody = document.getElementById("handicap-table-body");
  if (!tableBody) return;

  const searchQuery = document.getElementById("handicap-search-input").value.toLowerCase();
  const hcFilter = document.getElementById("handicap-filter-select").value;
  const clubFilter = document.getElementById("club-filter-select").value;

  const filtered = appData.players.filter(player => {
    const matchSearch = player.name.toLowerCase().includes(searchQuery) || player.club.toLowerCase().includes(searchQuery);
    const matchHc = hcFilter === "all" || player.handicap.toString().trim() === hcFilter.trim();
    const matchClub = clubFilter === "all" || player.club === clubFilter;
    return matchSearch && matchHc && matchClub;
  });

  // Pagination Configuration (20 per page)
  const itemsPerPage = 20;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (handicapCurrentPage > totalPages) {
    handicapCurrentPage = totalPages;
  }
  if (handicapCurrentPage < 1) {
    handicapCurrentPage = 1;
  }

  const startIndex = (handicapCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pagedItems = filtered.slice(startIndex, endIndex);

  tableBody.innerHTML = pagedItems.map((player, index) => {
    const points = parseFloat(player.points || 0.0);
    const hc = player.handicap ? player.handicap.toString().trim() : '3B';
    
    const hcThresholds = {
      "3B": { next: "3N", pts: 30, gradient: "linear-gradient(90deg, #475569 0%, #64748b 100%)" },
      "3N": { next: "3A", pts: 60, gradient: "linear-gradient(90deg, #059669 0%, #10b981 100%)" },
      "3A": { next: "4B", pts: 150, gradient: "linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)" },
      "4B": { next: "4A", pts: 200, gradient: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)" },
      "4A": { next: "5B", pts: 300, gradient: "linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)" },
      "5B": { next: "5A", pts: 400, gradient: "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)" },
      "5A": { next: "6", pts: 500, gradient: "linear-gradient(90deg, #14b8a6 0%, #2dd4bf 100%)" },
      "6": { next: "7", pts: 600, gradient: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)" }
    };

    let progressHtml = '';
    const thresh = hcThresholds[hc];
    if (thresh) {
      const targetPoints = thresh.pts;
      const progressPercent = Math.min(100, Math.round((points / targetPoints) * 100));
      progressHtml = `
        <div class="progress-container">
          <div class="progress-bar-custom" style="width: ${progressPercent}%; background: ${thresh.gradient};"></div>
          <span class="progress-label-text">${progressPercent}% (${points}/${targetPoints} Pts)</span>
        </div>
      `;
    } else {
      progressHtml = `
        <div class="progress-container">
          <div class="progress-bar-custom max-tier" style="width: 100%;"></div>
          <span class="progress-label-text" style="color: var(--gold-light); font-weight:700;">HC ${hc} (TERTINGGI)</span>
        </div>
      `;
    }

    return `
      <tr onclick="openAthleteProfile('${generateSlug(player.name)}')" style="border-bottom: 1px solid rgba(255,255,255,0.03); white-space: nowrap; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.03)'" onmouseout="this.style.backgroundColor=''">
        <td style="color:var(--text-muted); font-size:0.85rem">${startIndex + index + 1}</td>
        <td class="table-name-bold">
          <div class="player-profile-cell">
            <img src="${player.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.name)}`}" alt="${player.name}" class="player-avatar-small" onerror="this.src='images/player-avatar.png';">
            <div class="player-profile-info">
              <span class="player-name-text">${player.name}</span>
              <span class="player-sub-info">${player.gender || 'Laki-laki'} &bull; ${player.age || 24} Tahun</span>
              <div class="player-contact-sub">
                <span class="contact-item"><i class="fa-solid fa-location-dot"></i> ${player.address || 'Banjarnegara'}</span>
              </div>
            </div>
          </div>
        </td>
        <td>${player.club}</td>
        <td class="text-center"><span class="table-badge-hc ${getHandicapColorClass(hc)}">HC ${hc}</span></td>
        <td class="text-center text-accent" style="font-weight:600">${points} Pts</td>
        <td style="vertical-align: middle;">${progressHtml}</td>
      </tr>
    `;
  }).join("");

  if (totalItems === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px; color:var(--text-muted)"><i class="fa-solid fa-face-frown" style="font-size:1.8rem; margin-bottom:12px; display:block"></i> Tidak ada data pemain yang cocok</td></tr>`;
  }

  // Update Pagination Info
  const pageRangeEl = document.getElementById("handicap-page-range");
  const totalCountEl = document.getElementById("handicap-total-count");
  if (pageRangeEl && totalCountEl) {
    pageRangeEl.textContent = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : "0-0";
    totalCountEl.textContent = totalItems;
  }

  // Render Page Numbers
  renderHandicapPageNumbers(totalPages);

  // Disable/enable prev/next buttons
  const prevBtn = document.getElementById("handicap-prev-page");
  const nextBtn = document.getElementById("handicap-next-page");
  if (prevBtn) prevBtn.disabled = handicapCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = handicapCurrentPage >= totalPages;
}

function renderHandicapPageNumbers(totalPages) {
  const container = document.getElementById("handicap-page-numbers");
  if (!container) return;

  container.innerHTML = "";
  
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `pm-page-btn ${handicapCurrentPage === i ? "active" : ""}`;
    btn.textContent = i;
    btn.style.width = "28px";
    btn.style.height = "28px";
    btn.style.borderRadius = "6px";
    btn.style.border = handicapCurrentPage === i ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)";
    btn.style.background = handicapCurrentPage === i ? "var(--gradient-primary)" : "rgba(255,255,255,0.02)";
    btn.style.color = handicapCurrentPage === i ? "#fff" : "var(--text-dim)";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "0.78rem";
    btn.style.fontWeight = "600";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.transition = "var(--transition-fast)";
    
    btn.addEventListener("click", () => {
      handicapCurrentPage = i;
      renderHandicapList();
    });
    container.appendChild(btn);
  }
}

function setupHandicapListeners() {
  const searchInput = document.getElementById("handicap-search-input");
  const hcSelect = document.getElementById("handicap-filter-select");
  const clubSelect = document.getElementById("club-filter-select");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      handicapCurrentPage = 1;
      renderHandicapList();
    });
  }
  if (hcSelect) {
    hcSelect.addEventListener("change", () => {
      handicapCurrentPage = 1;
      renderHandicapList();
    });
  }
  if (clubSelect) {
    clubSelect.addEventListener("change", () => {
      handicapCurrentPage = 1;
      renderHandicapList();
    });
  }

  // Prev / Next button listeners
  const prevBtn = document.getElementById("handicap-prev-page");
  const nextBtn = document.getElementById("handicap-next-page");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (handicapCurrentPage > 1) {
        handicapCurrentPage--;
        renderHandicapList();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const searchQuery = document.getElementById("handicap-search-input").value.toLowerCase();
      const hcFilter = document.getElementById("handicap-filter-select").value;
      const clubFilter = document.getElementById("club-filter-select").value;
      const filteredCount = appData.players.filter(player => {
        const matchSearch = player.name.toLowerCase().includes(searchQuery) || player.club.toLowerCase().includes(searchQuery);
        const matchHc = hcFilter === "all" || player.handicap.toString().trim() === hcFilter.trim();
        const matchClub = clubFilter === "all" || player.club === clubFilter;
        return matchSearch && matchHc && matchClub;
      }).length;
      const totalPages = Math.ceil(filteredCount / 20) || 1;
      if (handicapCurrentPage < totalPages) {
        handicapCurrentPage++;
        renderHandicapList();
      }
    });
  }
}

// 9. Handicap Match Calculator Logic (Removed)
function setupCalculator() {}

// 10. Event Calendar Logic
function renderEvents(filter = "all") {
  const container = document.getElementById("events-grid-container");
  if (!container) return;

  const filtered = appData.events.filter(e => {
    if (e.elimination_type === "boc") return false;
    if (filter === "all") return true;
    return e.status === filter;
  });

  container.innerHTML = filtered.map(event => {
    let statusClass = "selesai";
    let statusText = "Event Selesai";
    let actionBtn = `<button class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem" onclick="event.stopPropagation()">Selesai</button>`;

    if (event.status === "Daftar") {
      statusClass = "daftar";
      statusText = "Pendaftaran Dibuka";
      actionBtn = `
        <a href="https://wa.me/${event.contact.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem" onclick="event.stopPropagation()">
          <i class="fa-solid fa-paper-plane"></i> Daftar
        </a>
      `;
    } else if (event.status === "Ongoing") {
      statusClass = "live";
      statusText = "Live / Berjalan";
      actionBtn = `
        <button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem; background: var(--gradient-primary); border: none; box-shadow: var(--shadow-neon); color: #fff; font-weight: 700;" onclick="event.stopPropagation(); openPublicEventDetail('${event.id}')">
          <i class="fa-solid fa-play"></i> Tonton Live
        </button>
      `;
    }

    // Pengolahan Tanggal
    const dateParts = event.date.split(" ");
    let day = "15";
    let month = "MAR";
    if (dateParts.length >= 3) {
      day = dateParts[0];
      month = dateParts[1].substring(0, 3).toUpperCase();
    }

    let prizeFoot = `
      <div class="event-prize-box">
        <span class="prize-lbl">Total Hadiah</span>
        <span class="prize-val">${event.prizePool}</span>
      </div>
    `;

    const posterUrl = (event.elimination_type === 'boc' && typeof bocSettings !== 'undefined' && bocSettings.cover) 
      ? bocSettings.cover 
      : (event.poster && event.poster !== 'images/event-poster.png' ? event.poster : 'images/event-poster.png');

    return `
      <div class="event-premium-card" onclick="openPublicEventDetail('${event.id}')" style="cursor: pointer;">
        <div class="event-card-banner" style="background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)), url('${posterUrl}'); background-size: cover; background-position: center;">
          <div class="event-date-block">
            <span class="date-day">${day}</span>
            <span class="date-month">${month}</span>
          </div>
          <span class="featured-status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="event-card-body">
          <h3 class="event-card-title">${event.title}</h3>
          <div class="event-card-details">
            <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${event.venue}</div>
            <div class="detail-item"><i class="fa-solid fa-money-bill-wave"></i> Biaya: ${event.entryFee}</div>
            <div class="detail-item"><i class="fa-solid fa-phone"></i> Kontak: ${event.contact}</div>
          </div>
          <p class="event-card-desc">${event.description}</p>
        </div>
        <div class="event-card-footer">
          ${prizeFoot}
          ${actionBtn}
        </div>
      </div>
    `;
  }).join("");

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center" style="grid-column: 1/-1; padding:60px; color:var(--text-muted)"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:12px; display:block"></i> Tidak ada agenda kegiatan yang cocok</div>`;
  }
}

function setupEventsFilters() {
  const btns = document.querySelectorAll(".event-tab-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = btn.getAttribute("data-event-filter");
      renderEvents(filterValue);
    });
  });
}

// Helper untuk mendeteksi ikon dokumen secara dinamis
function getFileIconClass(title, fileType) {
  const lower = (title || "").toLowerCase();
  const type = (fileType || "").toUpperCase();
  if (lower.endsWith('.pdf') || type === 'PDF' || type.includes('PDF')) {
    return 'fa-solid fa-file-pdf text-red';
  } else if (lower.endsWith('.doc') || lower.endsWith('.docx') || type === 'DOC' || type === 'WORD' || type.includes('WORD') || type.includes('OFFICEDOCUMENT.WORDPROCESSINGML')) {
    return 'fa-solid fa-file-word text-blue';
  } else if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || type === 'EXCEL' || type === 'XLS' || type.includes('EXCEL') || type.includes('OFFICEDOCUMENT.SPREADSHEETML')) {
    return 'fa-solid fa-file-excel text-green';
  }
  return 'fa-solid fa-file text-muted';
}

function getFileTypeLabel(title, fileType) {
  const lower = (title || "").toLowerCase();
  const type = (fileType || "").toUpperCase();
  if (lower.endsWith('.pdf') || type === 'PDF' || type.includes('PDF')) return 'PDF';
  if (lower.endsWith('.docx') || lower.endsWith('.doc') || type === 'DOC' || type === 'WORD' || type.includes('WORD')) return 'WORD';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || type === 'EXCEL' || type === 'XLS' || type.includes('EXCEL')) return 'EXCEL';
  return 'PDF';
}

// 11. Document Hub Logic
function renderDocuments(searchQuery = "", filterType = "ALL") {
  const tableBody = document.getElementById("docs-table-body");
  if (!tableBody) return;

  const filtered = (appData.documents || []).filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === "ALL") return matchesSearch;
    const docType = getFileTypeLabel(doc.title, doc.fileType);
    return matchesSearch && docType === filterType;
  });

  const totalItems = filtered.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (docsCurrentPage > totalPages) {
    docsCurrentPage = totalPages;
  }
  if (docsCurrentPage < 1) {
    docsCurrentPage = 1;
  }

  const startIndex = (docsCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDocs = filtered.slice(startIndex, endIndex);

  tableBody.innerHTML = paginatedDocs.map(doc => {
    const iconClass = getFileIconClass(doc.title, doc.fileType);
    const docType = getFileTypeLabel(doc.title, doc.fileType);
    return `
      <tr>
        <td class="table-name-bold">
          <i class="${iconClass}" style="margin-right:8px; font-size:1.1rem"></i>
          ${doc.title}
        </td>
        <td style="color:var(--text-muted)">${doc.date}</td>
        <td class="text-center" style="font-family:var(--font-headers); font-weight:600">${doc.fileSize}</td>
        <td class="text-center"><span class="doc-badge doc-badge-${docType.toLowerCase()}">${docType}</span></td>
        <td class="text-center">
          <a href="${doc.fileUrl || '#'}" target="_blank" class="btn-download-icon" aria-label="Unduh ${doc.title}" ${doc.fileUrl ? '' : `onclick="showCustomToast('Unduhan tidak tersedia untuk dokumen ini.', 'error'); return false;"`}>
            <i class="fa-solid fa-arrow-down-long"></i>
          </a>
        </td>
      </tr>
    `;
  }).join("");

  if (totalItems === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:40px; color:var(--text-muted)"><i class="fa-solid fa-magnifying-glass" style="font-size:1.8rem; margin-bottom:12px; display:block"></i> Dokumen resmi tidak ditemukan</td></tr>`;
  }

  // Update Pagination Info
  const pageRangeEl = document.getElementById("docs-page-range");
  const totalCountEl = document.getElementById("docs-total-count");
  if (pageRangeEl && totalCountEl) {
    pageRangeEl.textContent = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : "0-0";
    totalCountEl.textContent = totalItems;
  }

  // Render Page Numbers
  renderDocsPageNumbers(totalPages);
}

function renderDocsPageNumbers(totalPages) {
  const container = document.getElementById("docs-page-numbers");
  const prevBtn = document.getElementById("docs-prev-page");
  const nextBtn = document.getElementById("docs-next-page");

  if (prevBtn) prevBtn.disabled = docsCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = docsCurrentPage >= totalPages;

  if (!container) return;
  container.innerHTML = "";

  const maxVisible = 5;
  let startPage = Math.max(1, docsCurrentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.className = `pm-page-btn ${docsCurrentPage === i ? "active" : ""}`;
    btn.textContent = i;
    btn.style.width = "28px";
    btn.style.height = "28px";
    btn.style.borderRadius = "6px";
    btn.style.border = docsCurrentPage === i ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)";
    btn.style.background = docsCurrentPage === i ? "var(--gradient-primary)" : "rgba(255,255,255,0.02)";
    btn.style.color = docsCurrentPage === i ? "#fff" : "var(--text-dim)";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "600";
    btn.style.fontSize = "0.75rem";
    
    btn.addEventListener("click", () => {
      docsCurrentPage = i;
      const searchVal = document.getElementById("docs-search-input")?.value || "";
      const filterVal = document.getElementById("docs-filter-type")?.value || "ALL";
      renderDocuments(searchVal, filterVal);
    });
    container.appendChild(btn);
  }
}

function setupDocsSearch() {
  const input = document.getElementById("docs-search-input");
  const filterSelect = document.getElementById("docs-filter-type");

  function handleFilter() {
    docsCurrentPage = 1; // Reset to page 1 on filter/search change
    const searchVal = input ? input.value : "";
    const filterVal = filterSelect ? filterSelect.value : "ALL";
    renderDocuments(searchVal, filterVal);
  }

  if (input) {
    input.addEventListener("input", handleFilter);
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", handleFilter);
  }

  // Bind pagination arrows
  const prevBtn = document.getElementById("docs-prev-page");
  const nextBtn = document.getElementById("docs-next-page");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (docsCurrentPage > 1) {
        docsCurrentPage--;
        const searchVal = input ? input.value : "";
        const filterVal = filterSelect ? filterSelect.value : "ALL";
        renderDocuments(searchVal, filterVal);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const docs = appData.documents || [];
      const searchVal = input ? input.value : "";
      const filterVal = filterSelect ? filterSelect.value : "ALL";
      const filteredCount = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchVal.toLowerCase());
        if (filterVal === "ALL") return matchesSearch;
        const docType = getFileTypeLabel(doc.title, doc.fileType);
        return matchesSearch && docType === filterVal;
      }).length;
      const totalPages = Math.ceil(filteredCount / 10) || 1;

      if (docsCurrentPage < totalPages) {
        docsCurrentPage++;
        renderDocuments(searchVal, filterVal);
      }
    });
  }
}

// 12. Admin Panel Control Dashboard Logic
let isServerOnline = false;

// Helper untuk menonaktifkan atau mengaktifkan seluruh input dalam form secara aman (RBAC)
function toggleFormInputs(formId, enable) {
  const form = document.getElementById(formId);
  if (!form) return;
  const elements = form.querySelectorAll("input, select, textarea, button");
  elements.forEach(el => {
    if (enable) {
      el.removeAttribute("disabled");
    } else {
      el.setAttribute("disabled", "true");
    }
  });
}

// A. Pathname routing handler untuk halaman admin tersembunyi dengan RBAC
async function checkAdminRoute() {
  const pathName = window.location.pathname;
  
  if (pathName.startsWith("/athletes/")) {
    const slug = pathName.split("/athletes/")[1];
    const publicHeader = document.querySelector(".main-header");
    const publicFooter = document.querySelector(".main-footer");
    const loginScreen = document.getElementById("admin-login-screen");
    const workspaceScreen = document.getElementById("admin-workspace-screen");
    
    if (publicHeader) publicHeader.style.display = "";
    if (publicFooter) publicFooter.style.display = "";
    if (loginScreen) loginScreen.style.display = "none";
    if (workspaceScreen) workspaceScreen.style.display = "none";
    
    const glowOrbs = document.querySelectorAll(".glow-orb");
    glowOrbs.forEach(orb => orb.style.display = "");

    setTimeout(() => {
      openAthleteProfile(slug);
    }, 100);
    return;
  }

  if (pathName.startsWith("/events/")) {
    const eventId = pathName.split("/events/")[1];
    const publicHeader = document.querySelector(".main-header");
    const publicFooter = document.querySelector(".main-footer");
    const loginScreen = document.getElementById("admin-login-screen");
    const workspaceScreen = document.getElementById("admin-workspace-screen");
    
    if (publicHeader) publicHeader.style.display = "";
    if (publicFooter) publicFooter.style.display = "";
    if (loginScreen) loginScreen.style.display = "none";
    if (workspaceScreen) workspaceScreen.style.display = "none";
    
    const glowOrbs = document.querySelectorAll(".glow-orb");
    glowOrbs.forEach(orb => orb.style.display = "");

    setTimeout(() => {
      openPublicEventDetail(eventId);
    }, 100);
    return;
  }

  const isAuthorized = localStorage.getItem("pobsi_admin_token") === "POBSI_BNA_SECRET_AUTH_TOKEN_2026";
  
  const publicHeader = document.querySelector(".main-header");
  const publicContent = document.querySelector(".main-content");
  const publicFooter = document.querySelector(".main-footer");
  
  const loginScreen = document.getElementById("admin-login-screen");
  const workspaceScreen = document.getElementById("admin-workspace-screen");
  
  if (pathName.startsWith("/admin") || pathName.startsWith("/admin/")) {
    // Sembunyikan bagian publik
    if (publicHeader) publicHeader.style.display = "none";
    if (publicContent) publicContent.style.display = "none";
    if (publicFooter) publicFooter.style.display = "none";
    
    // Hapus background glowing orbs agar tidak menabrak tema dashboard admin
    const glowOrbs = document.querySelectorAll(".glow-orb");
    glowOrbs.forEach(orb => orb.style.display = "none");
    
    if (isAuthorized) {
      if (loginScreen) loginScreen.style.display = "none";
      if (workspaceScreen) workspaceScreen.style.display = "flex";
      
      // Update informasi profil admin di sidebar
      const sidebarName = document.querySelector(".sidebar-user-info .user-name");
      const sidebarRole = document.querySelector(".sidebar-user-info .user-role");
      if (sidebarName) sidebarName.textContent = localStorage.getItem("pobsi_admin_fullname") || "Pengurus POBSI";
      if (sidebarRole) {
        const rawRole = localStorage.getItem("pobsi_admin_role") || "admin";
        sidebarRole.textContent = rawRole.toUpperCase();
      }
      
      // Penegakan Pembatasan Akses Multi-Peran (RBAC)
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      const playersOverlay = document.getElementById("restrict-players-overlay");
      const bocUpdateOverlay = document.getElementById("restrict-boc-update-overlay");
      const bocTabSettingsOverlay = document.getElementById("restrict-boc-tab-settings");
      
      if (role === "staff") {
        if (playersOverlay) playersOverlay.style.display = "flex";
        if (bocUpdateOverlay) bocUpdateOverlay.style.display = "flex";
        if (bocTabSettingsOverlay) bocTabSettingsOverlay.style.display = "flex";
        const clubsOverlay = document.getElementById("restrict-clubs-overlay");
        if (clubsOverlay) clubsOverlay.style.display = "flex";
        const editClubsOverlay = document.getElementById("restrict-edit-clubs-overlay");
        if (editClubsOverlay) editClubsOverlay.style.display = "flex";
        toggleFormInputs("form-admin-add-player", false);
        toggleFormInputs("form-admin-update-boc-points", false);
        toggleFormInputs("form-admin-add-club", false);
        toggleFormInputs("form-admin-edit-club", false);
        toggleFormInputs("form-tab-boc-settings", false);
      } else {
        if (playersOverlay) playersOverlay.style.display = "none";
        if (bocUpdateOverlay) bocUpdateOverlay.style.display = "none";
        if (bocTabSettingsOverlay) bocTabSettingsOverlay.style.display = "none";
        const clubsOverlay = document.getElementById("restrict-clubs-overlay");
        if (clubsOverlay) clubsOverlay.style.display = "none";
        const editClubsOverlay = document.getElementById("restrict-edit-clubs-overlay");
        if (editClubsOverlay) editClubsOverlay.style.display = "none";
        toggleFormInputs("form-admin-add-player", true);
        toggleFormInputs("form-admin-update-boc-points", true);
        toggleFormInputs("form-admin-add-club", true);
        toggleFormInputs("form-admin-edit-club", true);
        toggleFormInputs("form-tab-boc-settings", true);
      }
      
      // Update data di workspace
      updateWorkspaceStats();
      renderWorkspacePreviews();
      renderAdminClubPreview();
      
      // Cek sub-path untuk atlet, klub, & event
      const athleteMatch = pathName.match(/\/admin\/athletes\/([a-zA-Z0-9_\-]+)/);
      const clubMatch = pathName.match(/\/admin\/clubs\/([a-zA-Z0-9_\-]+)/);
      const eventMatch = pathName.match(/\/admin\/events\/([a-zA-Z0-9_\-]+)/);
      if (athleteMatch) {
        const playerId = athleteMatch[1];
        switchAdminPane("pane-athlete-detail", false);
        renderAthleteDetail(playerId);
      } else if (clubMatch) {
        const clubId = clubMatch[1];
        switchAdminPane("pane-club-detail", false);
        renderClubDetail(clubId);
      } else if (eventMatch) {
        const eventId = eventMatch[1];
        openEventDetail(eventId, false);
      } else {
        // Cek hash URL untuk menentukan panel aktif
        const hash = window.location.hash.replace("#", "");
        const validPanes = ["overview", "players", "standings", "events", "clubs", "boc", "event-detail", "athlete-detail", "club-detail", "settings", "docs"];
        
        if (validPanes.includes(hash)) {
          switchAdminPane(`pane-${hash}`, false);
        } else if (hash.startsWith("boc-")) {
          const raw = hash.split("boc-")[1];
          let year = raw;
          let isPlayoff = false;
          if (raw.endsWith("-playoff")) {
            year = raw.substring(0, raw.length - "-playoff".length);
            isPlayoff = true;
          }
          if (year && /^\d{4}$/.test(year)) {
            const oldYear = currentBocYear;
            currentBocYear = year;
            localStorage.setItem("currentBocYear", currentBocYear);
            bocSirkuits = loadBocSirkuitsForYear(year);
            if (oldYear !== year || isPlayoff) {
              loadDataFromApi().then(() => {
                if (isPlayoff) {
                  const playoffEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(year) || e.description?.includes(year)));
                  if (playoffEvent) {
                    openEventDetail(playoffEvent.id, false);
                  } else {
                    renderAdminBocConsole();
                    switchAdminPane("pane-boc", false);
                  }
                } else {
                  const bocPlayoffContainer = document.getElementById("boc-playoff-container");
                  const bocStandingsContainer = document.getElementById("boc-standings-container");
                  if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
                  if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
                  renderAdminBocConsole();
                  switchAdminPane("pane-boc", false);
                }
              });
            } else {
              const bocPlayoffContainer = document.getElementById("boc-playoff-container");
              const bocStandingsContainer = document.getElementById("boc-standings-container");
              if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
              if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
              renderAdminBocConsole();
              switchAdminPane("pane-boc", false);
            }
          } else {
            switchAdminPane("pane-boc", false);
          }
        } else {
          // Tampilkan title dan pane aktif default
          const activeLink = document.querySelector(".sidebar-link.active");
          if (activeLink) {
            const paneId = activeLink.getAttribute("data-pane");
            switchAdminPane(paneId, true);
          } else {
            switchAdminPane("pane-overview", true);
          }
        }
      }
    } else {
      if (workspaceScreen) workspaceScreen.style.display = "none";
      if (loginScreen) loginScreen.style.display = "flex";
      
      // Reset password input dan error
      const passInput = document.getElementById("admin-pass-input");
      if (passInput) passInput.value = "";
      const errorMsg = document.getElementById("admin-login-error");
      if (errorMsg) errorMsg.style.display = "none";
    }
  } else {
    // Tampilkan bagian publik
    if (publicHeader) publicHeader.style.display = "";
    if (publicContent) publicContent.style.display = "";
    if (publicFooter) publicFooter.style.display = "";
    
    const glowOrbs = document.querySelectorAll(".glow-orb");
    glowOrbs.forEach(orb => orb.style.display = "");
    
    if (loginScreen) loginScreen.style.display = "none";
    if (workspaceScreen) workspaceScreen.style.display = "none";

    // Pastikan halaman profil atlet disembunyikan jika bukan halaman atlet
    const profilePage = document.getElementById('athlete-profile-page');
    if (profilePage) profilePage.style.display = "none";

    const eventPage = document.getElementById('public-event-detail-page');
    const isPlayoffHash = window.location.hash.startsWith("#champions-") && window.location.hash.endsWith("-playoff");
    if (eventPage) {
      if (isPlayoffHash) {
        eventPage.style.display = "block";
      } else {
        eventPage.style.display = "none";
      }
    }

    // Kembalikan ke tab aktif yang sesuai (misalnya saat klik tombol back browser dari halaman profil)
    const activeLink = document.querySelector(".nav-link.active");
    if (activeLink) {
      const tabId = activeLink.getAttribute("data-tab");
      const targetPane = document.getElementById(tabId);
      if (targetPane) {
        const hasActivePane = document.querySelector(".tab-pane.active");
        if (!hasActivePane) {
          targetPane.classList.add("active");
        }
      }
    }
  }
}

// B. Handler untuk pindah panel di sidebar admin workspace
window.switchAdminPane = function(paneId, updateHash = true, keepPlayoff = false) {
  if (paneId === "pane-boc" && !keepPlayoff) {
    const bocPlayoffContainer = document.getElementById("boc-playoff-container");
    const bocStandingsContainer = document.getElementById("boc-standings-container");
    if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
    if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
  }

  const panes = document.querySelectorAll(".workspace-pane");
  const links = document.querySelectorAll(".sidebar-link");
  const paneTitle = document.getElementById("admin-pane-title");
  
  panes.forEach(pane => {
    pane.classList.remove("active");
  });
  
  links.forEach(link => {
    link.classList.remove("active");
  });
  
  const targetPane = document.getElementById(paneId);
  if (targetPane) {
    targetPane.style.display = ""; // Clear any inline display:none so CSS .active rule takes effect
    targetPane.classList.add("active");
  }
  
  const targetLink = document.querySelector(`.sidebar-link[data-pane="${paneId}"]`);
  if (targetLink) {
    targetLink.classList.add("active");
  }
  
  // Update header title based on active pane
    if (paneTitle) {
      if (paneId === "pane-overview") paneTitle.textContent = "Ringkasan Utama";
      if (paneId === "pane-players") paneTitle.textContent = "Kelola Data Atlet";
      if (paneId === "pane-boc") paneTitle.textContent = "Battle of Champions";
      if (paneId === "pane-events") paneTitle.textContent = "Jadwalkan Turnamen";
      if (paneId === "pane-event-detail") paneTitle.textContent = "Event Command Center";
      if (paneId === "pane-clubs") paneTitle.textContent = "Kelola Klub Biliar";
      if (paneId === "pane-athlete-detail") paneTitle.textContent = "Detail Profil Atlet";
      if (paneId === "pane-club-detail") paneTitle.textContent = "Detail Profil Klub";
      if (paneId === "pane-docs") paneTitle.textContent = "Kelola Surat Edaran";
      if (paneId === "pane-settings") paneTitle.textContent = "Pengaturan Sistem";
    }

  // Bersihkan path ke /admin jika bukan halaman detail atlet atau detail klub
  if (paneId !== "pane-athlete-detail" && paneId !== "pane-club-detail" && paneId !== "pane-event-detail") {
    if (window.location.pathname !== "/admin" && window.location.pathname !== "/admin/") {
      window.history.pushState({}, "", "/admin");
    }
  }

  if (paneId !== "pane-event-detail") {
    window.activeAdminEventId = null;
  }

  // Perbarui hash URL jika updateHash diset ke true
  if (updateHash) {
    let hashName = paneId.replace("pane-", "");
    if (hashName === "boc") {
      hashName = `boc-${currentBocYear}`;
    }
    window.location.hash = hashName;
  }
  
  if (paneId === "pane-boc") {
    if (typeof renderAdminBocConsole === "function") {
      renderAdminBocConsole();
    }
  }
  
  if (paneId === "pane-events") {
    if (typeof renderAdminEventsDashboard === "function") {
      renderAdminEventsDashboard();
    }
  }

  if (paneId === "pane-docs") {
    if (typeof renderAdminDocsDashboard === "function") {
      renderAdminDocsDashboard();
    }
  }
};

// C. Render preview tabel di sisi kanan formulir admin untuk feedback visual instan
function renderWorkspacePreviews() {
  // Preview Players — now uses the Player Management Console
  if (typeof window.refreshPlayerManagement === "function") {
    window.refreshPlayerManagement();
  }

  
  // Preview Standings
  const standingsBody = document.getElementById("admin-standings-preview-tbody");
  if (standingsBody) {
    // Tampilkan 10 besar klasemen sirkuit
    const top10 = appData.standings.slice(0, 10);
    standingsBody.innerHTML = top10.map(s => `
      <tr>
        <td class="text-center table-rank-bold">${s.rank}</td>
        <td class="table-name-bold">${s.name}</td>
        <td class="text-center"><span class="table-badge-hc ${getHandicapColorClass(s.handicap)}">HC ${s.handicap}</span></td>
        <td class="text-center text-gold" style="font-weight:700">${s.points}</td>
      </tr>
    `).join("");
    
    if (top10.length === 0) {
      standingsBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 15px; color: var(--text-muted);">Belum ada data klasemen</td></tr>`;
    }
  }
  
  // Preview Events
  const eventsBody = document.getElementById("admin-events-preview-tbody");
  if (eventsBody) {
    // Tampilkan all events terbaru
    const latestEvents = [...appData.events].reverse().slice(0, 10);
    eventsBody.innerHTML = latestEvents.map(e => {
      const statusClass = e.status === "Daftar" ? "daftar" : "selesai";
      const statusText = e.status === "Daftar" ? "Buka" : "Selesai";
      return `
        <tr>
          <td class="table-name-bold">${e.title}</td>
          <td style="font-size:0.8rem">${e.date}</td>
          <td>${e.venue}</td>
          <td class="text-center"><span class="featured-status-badge ${statusClass}" style="font-size:0.65rem; padding: 2px 6px;">${statusText}</span></td>
        </tr>
      `;
    }).join("");
    
    if (latestEvents.length === 0) {
      eventsBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 15px; color: var(--text-muted);">Belum ada data event</td></tr>`;
    }
  }

  // Render top athletes leaderboard snapshot in Command Center
  renderTopAthletes();

  // Overhaul: Render Admin Events Command Center Dashboard
  if (typeof renderAdminEventsDashboard === "function") {
    renderAdminEventsDashboard();
  }
}

// Function to populate the Top Ranked Athletes snapshot leaderboard in the overview pane
function renderTopAthletes() {
  const container = document.getElementById("dashboard-top-athletes-list");
  if (!container) return;

  try {
    // Retrieve sorted standings from appData.standings
    const standings = appData.standings || [];
    if (standings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim);">
          <i class="fa-solid fa-ranking-star" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.3;"></i>
          Belum ada data peringkat sirkuit
        </div>`;
      return;
    }

    // Slice the top 5 athletes
    const top5 = standings.slice(0, 5);

    container.innerHTML = top5.map((player, idx) => {
      // Medal or Rank Badge representation
      let medalHtml = '';
      if (idx === 0) {
        medalHtml = '<span class="rank-badge gold"><i class="fa-solid fa-medal"></i></span>';
      } else if (idx === 1) {
        medalHtml = '<span class="rank-badge silver"><i class="fa-solid fa-medal"></i></span>';
      } else if (idx === 2) {
        medalHtml = '<span class="rank-badge bronze"><i class="fa-solid fa-medal"></i></span>';
      } else {
        medalHtml = `<span class="rank-badge neutral">${idx + 1}</span>`;
      }

      // Attempt to find matching athlete's avatar from players list
      const playerRecord = appData.players.find(p => p && p.name && p.name.toLowerCase() === player.name.toLowerCase());
      const avatarUrl = playerRecord?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.name)}`;

      return `
        <div class="top-athlete-item">
          <div class="top-athlete-left">
            ${medalHtml}
            <div class="top-athlete-avatar-wrapper">
              <img src="${avatarUrl}" alt="${player.name}" class="top-athlete-avatar" onerror="this.src='images/player-avatar.png';">
            </div>
            <div class="top-athlete-meta">
              <span class="athlete-name-bold">${player.name}</span>
              <span class="athlete-club-sub">${player.club} &bull; HC ${player.handicap}</span>
            </div>
          </div>
          <div class="top-athlete-right">
            <span class="athlete-points-gold">${player.points} <span class="pts-lbl">Pts</span></span>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error rendering top athletes leaderboard:", error);
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--red);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.8;"></i>
        Gagal menampilkan leaderboard peringkat sirkuit.
      </div>`;
  }
}

// D. Update widget statistik ringkasan dalam workspace admin
function updateWorkspaceStats() {
  const statPlayers = document.getElementById("admin-stat-players");
  const statStandings = document.getElementById("admin-stat-standings");
  const statEvents = document.getElementById("admin-stat-events");
  
  const totalPlayers = appData.players.length;
  const totalEvents = appData.events.length;
  const totalClubs = (appData.clubs || []).length;
  const totalStandings = appData.standings.length;

  if (statPlayers) statPlayers.textContent = totalPlayers;
  if (statStandings) statStandings.textContent = totalStandings;
  if (statEvents) statEvents.textContent = totalEvents;
  
  const statClubs = document.getElementById("admin-stat-clubs");
  if (statClubs) statClubs.textContent = totalClubs;

  // Update header metric summary bar
  const hdrPlayers = document.getElementById("hdr-stat-players");
  const hdrEvents = document.getElementById("hdr-stat-events");
  const hdrClubs = document.getElementById("hdr-stat-clubs");
  const hdrStandings = document.getElementById("hdr-stat-standings");

  if (hdrPlayers) hdrPlayers.textContent = totalPlayers;
  if (hdrEvents) hdrEvents.textContent = totalEvents;
  if (hdrClubs) hdrClubs.textContent = totalClubs;
  if (hdrStandings) hdrStandings.textContent = totalStandings;

  // Update SQLite Database Mapping Health Node Count
  const healthDbDesc = document.getElementById("health-db-desc");
  if (healthDbDesc) {
    healthDbDesc.textContent = `Connected | ${totalPlayers} Player nodes mapped`;
  }

  // Sync Charts dynamic labels
  const donutTotal = document.getElementById("donut-clubs-total");
  if (donutTotal) donutTotal.textContent = totalClubs;

  const tooltipPlayers = document.getElementById("chart-tooltip-players-val");
  if (tooltipPlayers) tooltipPlayers.textContent = `${totalPlayers} Atlet`;

  const barEvents = document.getElementById("bar-active-events-val");
  if (barEvents) barEvents.textContent = totalEvents;
}

// E. Setup UI event listener untuk login, logout, dan navigasi sidebar
function setupAdminUIListeners() {
  // Form Login
  const loginForm = document.getElementById("form-admin-login");
  if (loginForm) {
    // Hapus event listener lama jika ada (mencegah multiple attachment)
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);
    
    newLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("admin-user-input").value.trim();
      const password = document.getElementById("admin-pass-input").value;
      const errorMsg = document.getElementById("admin-login-error");
      
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("pobsi_admin_token", data.token);
          localStorage.setItem("pobsi_admin_role", data.role);
          localStorage.setItem("pobsi_admin_fullname", data.fullname);
          localStorage.setItem("pobsi_admin_username", data.username);
          if (errorMsg) errorMsg.style.display = "none";
          checkAdminRoute();
        } else {
          if (errorMsg) errorMsg.style.display = "block";
        }
      } catch (err) {
        console.error("Gagal melakukan autentikasi admin:", err);
        // Fallback luring jika server tidak aktif (untuk testing offline)
        let matched = false;
        let role = "";
        let fullname = "";
        
        if (username === "superadmin" && password === "super-pobsi-2026") {
          role = "super admin";
          fullname = "Super Admin POBSI";
          matched = true;
        } else if (username === "admin" && password === "admin-pobsi-2026") {
          role = "admin";
          fullname = "Admin Utama POBSI";
          matched = true;
        } else if (username === "staff" && password === "staff-pobsi-2026") {
          role = "staff";
          fullname = "Staff Lapangan POBSI";
          matched = true;
        }

        if (matched) {
          localStorage.setItem("pobsi_admin_token", "POBSI_BNA_SECRET_AUTH_TOKEN_2026");
          localStorage.setItem("pobsi_admin_role", role);
          localStorage.setItem("pobsi_admin_fullname", fullname);
          localStorage.setItem("pobsi_admin_username", username);
          if (errorMsg) errorMsg.style.display = "none";
          checkAdminRoute();
        } else {
          if (errorMsg) errorMsg.style.display = "block";
        }
      }
    });
  }
  
  // Batal Login (Kembali ke Beranda)
  const btnCancel = document.getElementById("btn-login-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      window.location.href = "/";
    });
  }
  
  // Logout Admin
  const btnLogout = document.getElementById("btn-admin-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("pobsi_admin_token");
      window.location.href = "/";
    });
  }
  
  // Sidebar transition shortcuts to public tabs
  window.exitAdminToPublic = function(tabId) {
    // Show public site sections
    const publicHeader = document.querySelector(".main-header");
    const publicContent = document.querySelector(".main-content");
    const publicFooter = document.querySelector(".main-footer");
    if (publicHeader) publicHeader.style.display = "";
    if (publicContent) publicContent.style.display = "";
    if (publicFooter) publicFooter.style.display = "";
    // Show particles & glowing orbs
    document.querySelectorAll('.floating-particle, .glow-orb, .particle').forEach(p => p.style.display = '');
    
    // Hide admin screens
    const loginScreen = document.getElementById("admin-login-screen");
    const workspaceScreen = document.getElementById("admin-workspace-screen");
    if (loginScreen) loginScreen.style.display = "none";
    if (workspaceScreen) workspaceScreen.style.display = "none";
    
    // Update URL state and route public tab
    window.history.pushState({}, '', '/');
    if (tabId) {
      switchTab(tabId);
    }
  };

  // Sidebar links
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  sidebarLinks.forEach(link => {
    link.addEventListener("click", () => {
      const paneId = link.getAttribute("data-pane");
      if (paneId) {
        switchAdminPane(paneId);
      }
    });
  });

  // Sidebar transition shortcuts to public tabs
  const actionBoc = document.getElementById("sidebar-action-boc");
  if (actionBoc) {
    actionBoc.addEventListener("click", () => exitAdminToPublic("tab-champions"));
  }
  const actionDocs = document.getElementById("sidebar-action-docs");
  if (actionDocs) {
    actionDocs.addEventListener("click", () => exitAdminToPublic("tab-docs"));
  }
  // Settings click is handled by generic sidebar data-pane switcher

  // Quick Action transitions
  const quickDocs = document.getElementById("quick-btn-docs");
  if (quickDocs) {
    quickDocs.addEventListener("click", () => exitAdminToPublic("tab-docs"));
  }
}

async function setupAdminPanel() {
  const statusBadge = document.getElementById("workspace-status-badge");
  const statusText = document.getElementById("workspace-status-text");

  // Cek Status Koneksi Server API Lokal secara asinkron
  try {
    if (window.location.protocol === 'file:') {
      throw new Error("Protokol file:// terdeteksi");
    }

    const testFetch = await fetch('/api/players', { method: 'GET', cache: 'no-store' });
    if (testFetch.ok) {
      isServerOnline = true;
      if (statusText) statusText.textContent = "ONLINE";
      if (statusBadge) {
        statusBadge.className = "status-indicator-badge online";
      }
    } else {
      throw new Error("Status HTTP tidak ok");
    }
  } catch (err) {
    isServerOnline = false;
    if (statusText) statusText.textContent = "LURING (DEMO)";
    if (statusBadge) {
      statusBadge.className = "status-indicator-badge luring";
    }
  }

  // Setup Admin UI Listeners
  setupAdminUIListeners();

  // Refresh workspace data to ensure the admin panel reflects live database API data
  updateWorkspaceStats();
  renderWorkspacePreviews();
  renderAdminClubPreview();

  // Initialize Player Management Console (new overhaul)
  setupPlayerManagement();
  setupEventManagement();
  setupAthleteDetailActions();
  setupClubDetailActions();
  setupBocAdminListeners();
  setupDocManagement();
  setupSystemSettings();

  // --- LOGIC DIRECT FILE UPLOAD AVATAR ---
  let currentUploadedAvatarBase64 = "";

  const dropZone = document.getElementById("avatar-drop-zone");
  const fileInput = document.getElementById("adm-player-avatar-file");
  const previewContainer = document.getElementById("avatar-preview-container");
  const previewImg = document.getElementById("avatar-preview-img");
  const previewFilename = document.getElementById("avatar-preview-filename");
  const btnClearAvatar = document.getElementById("btn-clear-avatar");

  if (dropZone && fileInput) {
    // Click to upload
    dropZone.addEventListener("click", () => fileInput.click());

    // Drag effects
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove("dragover");
      });
    });

    // Handle drops
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleAvatarFileSelection(files[0]);
      }
    });

    // Handle standard inputs
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleAvatarFileSelection(files[0]);
      }
    });
  }

  function handleAvatarFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      alert("Format berkas tidak valid! Silakan unggah gambar (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal batas ukuran berkas adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentUploadedAvatarBase64 = e.target.result;
      
      // Update UI Previews
      if (previewImg) previewImg.src = currentUploadedAvatarBase64;
      if (previewFilename) previewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      
      if (dropZone) dropZone.style.display = "none";
      if (previewContainer) previewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  // Clear avatar button
  if (btnClearAvatar) {
    btnClearAvatar.addEventListener("click", () => {
      currentUploadedAvatarBase64 = "";
      if (fileInput) fileInput.value = "";
      if (dropZone) dropZone.style.display = "flex";
      if (previewContainer) previewContainer.style.display = "none";
    });
  }

  // --- LOGIC DIRECT FILE UPLOAD COVER ---
  let currentUploadedCoverBase64 = "";
  const coverDropZone = document.getElementById("adm-cover-drop-zone");
  const coverFileInput = document.getElementById("adm-player-cover-file");
  const coverPreviewContainer = document.getElementById("adm-cover-preview-container");
  const coverPreviewImg = document.getElementById("adm-cover-preview-img");
  const coverPreviewFilename = document.getElementById("adm-cover-preview-filename");
  const btnClearCover = document.getElementById("adm-btn-clear-cover");

  if (coverDropZone && coverFileInput) {
    coverDropZone.addEventListener("click", () => coverFileInput.click());
    coverDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      coverDropZone.classList.add("dragover");
    });
    ["dragleave", "drop"].forEach(eventName => {
      coverDropZone.addEventListener(eventName, () => {
        coverDropZone.classList.remove("dragover");
      });
    });
    coverDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) handleCoverFileSelection(files[0]);
    });
    coverFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) handleCoverFileSelection(files[0]);
    });
  }

  function handleCoverFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      alert("Format berkas tidak valid! Silakan unggah gambar (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar cover terlalu besar! Maksimal batas ukuran berkas adalah 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentUploadedCoverBase64 = e.target.result;
      if (coverPreviewImg) coverPreviewImg.src = currentUploadedCoverBase64;
      if (coverPreviewFilename) coverPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (coverDropZone) coverDropZone.style.display = "none";
      if (coverPreviewContainer) coverPreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  if (btnClearCover) {
    btnClearCover.addEventListener("click", () => {
      currentUploadedCoverBase64 = "";
      if (coverFileInput) coverFileInput.value = "";
      if (coverDropZone) coverDropZone.style.display = "flex";
      if (coverPreviewContainer) coverPreviewContainer.style.display = "none";
    });
  }

  // --- LOGIC DIRECT FILE UPLOAD KTP ---
  let currentUploadedKtpBase64 = "";
  const ktpDropZone = document.getElementById("adm-ktp-drop-zone");
  const ktpFileInput = document.getElementById("adm-player-ktp-file");
  const ktpPreviewContainer = document.getElementById("adm-ktp-preview-container");
  const ktpPreviewImg = document.getElementById("adm-ktp-preview-img");
  const ktpPdfIcon = document.getElementById("adm-ktp-pdf-preview-icon");
  const ktpPreviewFilename = document.getElementById("adm-ktp-preview-filename");
  const btnClearKtp = document.getElementById("adm-btn-clear-ktp");

  if (ktpDropZone && ktpFileInput) {
    ktpDropZone.addEventListener("click", () => ktpFileInput.click());
    ktpDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      ktpDropZone.classList.add("dragover");
    });
    ["dragleave", "drop"].forEach(eventName => {
      ktpDropZone.addEventListener(eventName, () => {
        ktpDropZone.classList.remove("dragover");
      });
    });
    ktpDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) handleKtpFileSelection(files[0]);
    });
    ktpFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) handleKtpFileSelection(files[0]);
    });
  }

  function handleKtpFileSelection(file) {
    const isValidType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isValidType) {
      alert("Format berkas tidak valid! Silakan unggah Gambar (JPG, PNG) atau dokumen PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran berkas KTP terlalu besar! Maksimal batas ukuran berkas adalah 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentUploadedKtpBase64 = e.target.result;
      if (file.type === "application/pdf") {
        if (ktpPreviewImg) ktpPreviewImg.style.display = "none";
        if (ktpPdfIcon) ktpPdfIcon.style.display = "flex";
      } else {
        if (ktpPreviewImg) {
          ktpPreviewImg.src = currentUploadedKtpBase64;
          ktpPreviewImg.style.display = "block";
        }
        if (ktpPdfIcon) ktpPdfIcon.style.display = "none";
      }
      if (ktpPreviewFilename) ktpPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (ktpDropZone) ktpDropZone.style.display = "none";
      if (ktpPreviewContainer) ktpPreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  if (btnClearKtp) {
    btnClearKtp.addEventListener("click", () => {
      currentUploadedKtpBase64 = "";
      if (ktpFileInput) ktpFileInput.value = "";
      if (ktpDropZone) ktpDropZone.style.display = "flex";
      if (ktpPreviewContainer) ktpPreviewContainer.style.display = "none";
    });
  }

  // --- LOGIC DIRECT FILE UPLOAD EVENT POSTER ---
  let currentUploadedEventPosterBase64 = "";

  const evtDropZone = document.getElementById("event-poster-drop-zone");
  const evtFileInput = document.getElementById("adm-evt-poster-file");
  const evtPreviewContainer = document.getElementById("event-poster-preview-container");
  const evtPreviewImg = document.getElementById("event-poster-preview-img");
  const evtPreviewFilename = document.getElementById("event-poster-preview-filename");
  const btnClearEvtPoster = document.getElementById("btn-clear-event-poster");

  if (evtDropZone && evtFileInput) {
    // Click to upload
    evtDropZone.addEventListener("click", () => evtFileInput.click());

    // Drag effects
    evtDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      evtDropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      evtDropZone.addEventListener(eventName, () => {
        evtDropZone.classList.remove("dragover");
      });
    });

    // Handle drops
    evtDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleEventPosterFileSelection(files[0]);
      }
    });

    // Handle standard inputs
    evtFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleEventPosterFileSelection(files[0]);
      }
    });
  }

  function handleEventPosterFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      alert("Format berkas tidak valid! Silakan unggah gambar (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal batas ukuran berkas adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentUploadedEventPosterBase64 = e.target.result;
      
      // Update UI Previews
      if (evtPreviewImg) evtPreviewImg.src = currentUploadedEventPosterBase64;
      if (evtPreviewFilename) evtPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      
      if (evtDropZone) evtDropZone.style.display = "none";
      if (evtPreviewContainer) evtPreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  // Clear event poster button
  if (btnClearEvtPoster) {
    btnClearEvtPoster.addEventListener("click", () => {
      currentUploadedEventPosterBase64 = "";
      if (evtFileInput) evtFileInput.value = "";
      if (evtDropZone) evtDropZone.style.display = "flex";
      if (evtPreviewContainer) evtPreviewContainer.style.display = "none";
    });
  }

  // Bind Club Form
  setupAdminClubsConsole();

  // Bind Form 1: Tambah Atlet Handicap
  const formPlayer = document.getElementById("form-admin-add-player");
  if (formPlayer) {
    formPlayer.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("adm-player-name").value.trim();
      const club = document.getElementById("adm-player-club").value.trim();
      const handicap = document.getElementById("adm-player-hc").value.trim();
      const points = parseFloat(document.getElementById("adm-player-points").value || 0.0);
      const gender = document.getElementById("adm-player-gender").value;
      const age = parseInt(document.getElementById("adm-player-age").value || 24, 10);
      const phone = document.getElementById("adm-player-phone").value.trim();
      const address = document.getElementById("adm-player-address").value.trim();
      const avatar = currentUploadedAvatarBase64 || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

      if (isServerOnline) {
        try {
          const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, club, handicap, points, gender, age, avatar, phone, address, cover: currentUploadedCoverBase64, ktp: currentUploadedKtpBase64 })
          });
          if (res.ok) {
            alert(`Berhasil menyimpan atlet "${name}" ke database lokal!`);
            formPlayer.reset();
            
            // Reset upload avatar state
            currentUploadedAvatarBase64 = "";
            if (fileInput) fileInput.value = "";
            if (dropZone) dropZone.style.display = "flex";
            if (previewContainer) previewContainer.style.display = "none";

            // Reset upload cover state
            currentUploadedCoverBase64 = "";
            if (coverFileInput) coverFileInput.value = "";
            if (coverDropZone) coverDropZone.style.display = "flex";
            if (coverPreviewContainer) coverPreviewContainer.style.display = "none";

            // Reset upload ktp state
            currentUploadedKtpBase64 = "";
            if (ktpFileInput) ktpFileInput.value = "";
            if (ktpDropZone) ktpDropZone.style.display = "flex";
            if (ktpPreviewContainer) ktpPreviewContainer.style.display = "none";

            // Muat ulang data terbaru
            await loadDataFromApi();
            loadStatistics();
            populateClubFilters();
            renderHandicapList();
            setupCalculator();
            
            // Refresh previews & stats
            updateWorkspaceStats();
            renderWorkspacePreviews();
          } else {
            const errJson = await res.json();
            alert(`Gagal menyimpan atlet: ${errJson.error || 'Server error'}`);
          }
        } catch (err) {
          alert(`Error koneksi server: ${err.message}`);
        }
      } else {
        // Mode Luring: Simpan sementara di memori runtime
        const tempId = `P_TEMP_${appData.players.length + 1}`;
        const newPlayer = { id: tempId, name, club, handicap, status: "Aktif", points, gender, age, avatar, phone, address, cover: currentUploadedCoverBase64, ktp: currentUploadedKtpBase64 };
        appData.players.push(newPlayer);
        
        alert(`Mode Luring: Atlet "${name}" ditambahkan sementara di memori browser!`);
        formPlayer.reset();

        // Reset upload avatar state
        currentUploadedAvatarBase64 = "";
        if (fileInput) fileInput.value = "";
        if (dropZone) dropZone.style.display = "flex";
        if (previewContainer) previewContainer.style.display = "none";

        // Reset upload cover state
        currentUploadedCoverBase64 = "";
        if (coverFileInput) coverFileInput.value = "";
        if (coverDropZone) coverDropZone.style.display = "flex";
        if (coverPreviewContainer) coverPreviewContainer.style.display = "none";

        // Reset upload ktp state
        currentUploadedKtpBase64 = "";
        if (ktpFileInput) ktpFileInput.value = "";
        if (ktpDropZone) ktpDropZone.style.display = "flex";
        if (ktpPreviewContainer) ktpPreviewContainer.style.display = "none";
        
        // Render ulang
        loadStatistics();
        populateClubFilters();
        renderHandicapList();
        setupCalculator();
        
        // Refresh previews & stats
        updateWorkspaceStats();
        renderWorkspacePreviews();
      }
    });
  }
  // Bind Form 3: Tambah Agenda Event
  const formEvent = document.getElementById("form-admin-add-event");
  if (formEvent) {
    formEvent.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("adm-evt-title").value.trim();
      const date = document.getElementById("adm-evt-date").value.trim();
      const venue = document.getElementById("adm-evt-venue").value.trim();
      const prizePool = document.getElementById("adm-evt-prize").value.trim();
      const entryFee = document.getElementById("adm-evt-fee").value.trim();
      const contact = document.getElementById("adm-evt-contact").value.trim();
      const status = document.getElementById("adm-evt-status").value;
      const description = document.getElementById("adm-evt-desc").value.trim();
      const type = document.getElementById("adm-evt-type").value;
      const bracket_size = document.getElementById("adm-evt-bracket-size").value;
      const elimination_type = document.getElementById("adm-evt-elimination").value;
      const max_hc = document.getElementById("adm-evt-max-hc") ? document.getElementById("adm-evt-max-hc").value : "Bebas";
      const poster = currentUploadedEventPosterBase64 || "images/event-poster.png";

      // Double-check validation
      if (!title) {
        showCustomToast("Nama Turnamen / Agenda wajib diisi!", "error");
        if (window.resetAddEventWizard) window.resetAddEventWizard();
        document.getElementById("adm-evt-title").focus();
        return;
      }
      if (!date || !venue) {
        showCustomToast("Tanggal Pelaksanaan dan Lokasi wajib diisi!", "error");
        if (window.updateAddEventWizardUI) {
          window.currentEventStep = 2;
          window.updateAddEventWizardUI();
        }
        if (!date) document.getElementById("adm-evt-date").focus();
        else document.getElementById("adm-evt-venue").focus();
        return;
      }
      if (!contact) {
        showCustomToast("Kontak Panitia (WhatsApp) wajib diisi!", "error");
        if (window.updateAddEventWizardUI) {
          window.currentEventStep = 3;
          window.updateAddEventWizardUI();
        }
        document.getElementById("adm-evt-contact").focus();
        return;
      }

      if (isServerOnline) {
        try {
          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, date, venue, prizePool, entryFee, contact, status, description, poster, type, bracket_size, elimination_type, max_hc })
          });
          if (res.ok) {
            showCustomToast(`Berhasil menjadwalkan turnamen "${title}" ke database lokal!`, "success");
            formEvent.reset();
            const addDatePicker = document.getElementById("adm-evt-date-wrapper")?._flatpickr;
            if (addDatePicker) addDatePicker.clear();
            
            // Reset upload poster state
            currentUploadedEventPosterBase64 = "";
            if (evtFileInput) evtFileInput.value = "";
            if (evtDropZone) evtDropZone.style.display = "flex";
            if (evtPreviewContainer) evtPreviewContainer.style.display = "none";
            
            if (window.resetAddEventWizard) window.resetAddEventWizard();

            await loadDataFromApi();
            loadStatistics();
            loadHomeHighlights();
            renderEvents("all");
            
            // Refresh previews & stats
            updateWorkspaceStats();
            renderWorkspacePreviews();
          } else {
            const errJson = await res.json();
            showCustomToast(`Gagal menyimpan event: ${errJson.error || 'Server error'}`, "error");
          }
        } catch (err) {
          showCustomToast(`Error koneksi server: ${err.message}`, "error");
        }
      } else {
        // Mode Luring
        const tempId = `E_TEMP_${appData.events.length + 1}`;
        const newEvent = { id: tempId, title, date, venue, prizePool, entryFee, contact, status, description, poster, type, bracket_size, elimination_type, max_hc };
        appData.events.push(newEvent);

        showCustomToast(`Mode Luring: Event "${title}" ditambahkan sementara di memori browser!`, "info");
        formEvent.reset();
        const addDatePicker = document.getElementById("adm-evt-date-wrapper")?._flatpickr;
        if (addDatePicker) addDatePicker.clear();

        // Reset upload poster state
        currentUploadedEventPosterBase64 = "";
        if (evtFileInput) evtFileInput.value = "";
        if (evtDropZone) evtDropZone.style.display = "flex";
        if (evtPreviewContainer) evtPreviewContainer.style.display = "none";
        
        if (window.resetAddEventWizard) window.resetAddEventWizard();

        loadStatistics();
        loadHomeHighlights();
        renderEvents("all");
        
        // Refresh previews & stats
        updateWorkspaceStats();
        renderWorkspacePreviews();
      }
    });
  }

  // Register popstate, hashchange, and initial check route
  window.addEventListener("popstate", checkAdminRoute);
  window.addEventListener("hashchange", checkAdminRoute);
  checkAdminRoute();
}

// ============================================================================
// PLAYER MANAGEMENT CONSOLE — Full JS Logic
// ============================================================================
function setupPlayerManagement() {
  // State
  let pmCurrentPage = 1;
  let pmPerPage = 10;
  let pmSelectedIds = new Set();
  let pmActivePlayerId = null;
  let pmFilteredPlayers = [];

  // DOM References
  const pmTableBody = document.getElementById("pm-table-body");
  const pmEmptyState = document.getElementById("pm-empty-state");
  const pmPageRange = document.getElementById("pm-page-range");
  const pmTotalCount = document.getElementById("pm-total-count");
  const pmPageNumbers = document.getElementById("pm-page-numbers");
  const pmPrevPage = document.getElementById("pm-prev-page");
  const pmNextPage = document.getElementById("pm-next-page");
  const pmPerPageSel = document.getElementById("pm-per-page");
  const pmCheckAll = document.getElementById("pm-check-all");
  const pmBulkBar = document.getElementById("pm-bulk-bar");
  const pmSelectedCount = document.getElementById("pm-selected-count");
  const pmSearchInput = document.getElementById("pm-search-input");
  const pmFilterClub = document.getElementById("pm-filter-club");
  const pmFilterHC = document.getElementById("pm-filter-handicap");
  const pmFilterStatus = document.getElementById("pm-filter-status");
  const pmFilterGender = document.getElementById("pm-filter-gender");
  const pmResetFilters = document.getElementById("pm-reset-filters");

  if (!pmTableBody) return; // Guard: not on the players pane

  // Populate club filter options dynamically
  function populatePMClubFilter() {
    const clubs = [...new Set(appData.players.map(p => p.club))].sort();
    pmFilterClub.innerHTML = '<option value="">Semua Klub</option>';
    clubs.forEach(c => {
      pmFilterClub.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  // Get filtered players
  function getFilteredPlayers() {
    let result = [...appData.players];
    const search = pmSearchInput.value.trim().toLowerCase();
    const club = pmFilterClub.value;
    const hc = pmFilterHC.value;
    const status = pmFilterStatus.value;
    const gender = pmFilterGender.value;

    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.id && p.id.toLowerCase().includes(search)) ||
        p.club.toLowerCase().includes(search)
      );
    }
    if (club) result = result.filter(p => p.club === club);
    if (hc) result = result.filter(p => String(p.handicap).startsWith(hc));
    if (status) result = result.filter(p => (p.status || "Aktif") === status);
    if (gender) result = result.filter(p => p.gender === gender);

    return result;
  }

  // Get ranking for a player
  function getPlayerRanking(playerId) {
    const standing = appData.standings.find(s =>
      appData.players.find(p => p.id === playerId && p.name === s.name)
    );
    if (standing) return standing.rank;
    // Fallback: find by name
    const player = appData.players.find(p => p.id === playerId);
    if (player) {
      const s = appData.standings.find(st => st.name === player.name);
      if (s) return s.rank;
    }
    return null;
  }

  // Get standing data for a player
  function getPlayerStanding(playerName) {
    return appData.standings.find(s => s.name === playerName) || null;
  }

  // Update stats cards
  function updatePMStats() {
    const total = appData.players.length;
    const active = appData.players.filter(p => (p.status || "Aktif") === "Aktif").length;
    const junior = appData.players.filter(p => (p.age || 25) < 21).length;
    const clubs = new Set(appData.players.map(p => p.club)).size;

    document.getElementById("pm-total-athletes").textContent = total;
    document.getElementById("pm-active-athletes").textContent = active;
    document.getElementById("pm-junior-athletes").textContent = junior;
    document.getElementById("pm-total-clubs").textContent = clubs;
  }

  // Render table
  function renderPMTable() {
    pmFilteredPlayers = getFilteredPlayers();
    const totalPages = Math.max(1, Math.ceil(pmFilteredPlayers.length / pmPerPage));
    if (pmCurrentPage > totalPages) pmCurrentPage = totalPages;

    const start = (pmCurrentPage - 1) * pmPerPage;
    const end = Math.min(start + pmPerPage, pmFilteredPlayers.length);
    const pageData = pmFilteredPlayers.slice(start, end);

    if (pageData.length === 0) {
      pmTableBody.innerHTML = "";
      pmEmptyState.style.display = "flex";
      pmTableBody.parentElement.querySelector("thead").style.display = "none";
    } else {
      pmEmptyState.style.display = "none";
      pmTableBody.parentElement.querySelector("thead").style.display = "";
      pmTableBody.innerHTML = pageData.map(p => {
        const ranking = getPlayerRanking(p.id);
        const rankDisplay = ranking ? `#${ranking}` : "-";
        const rankClass = ranking && ranking <= 3 ? "top3" : "";
        const statusClass = (p.status || "Aktif").toLowerCase() === "aktif" ? "aktif" : "nonaktif";
        const statusText = p.status || "Aktif";
        const isSelected = pmSelectedIds.has(p.id);
        const isActive = pmActivePlayerId === p.id;

        return `<tr class="${isSelected ? "pm-row-selected" : ""} ${isActive ? "pm-row-active" : ""}" data-player-id="${p.id}">
          <td class="text-center"><input type="checkbox" class="pm-row-check" data-id="${p.id}" ${isSelected ? "checked" : ""}></td>
          <td>
            <div class="pm-cell-player">
              <img class="pm-cell-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.src='https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.name)}'">
              <div class="pm-cell-name-wrap">
                <span class="pm-cell-name">${p.name}</span>
                <span class="pm-cell-id">${p.id || "-"}</span>
              </div>
            </div>
          </td>
          <td class="pm-cell-club">${p.club}</td>
          <td class="text-center"><span class="pm-hc-badge">HC ${p.handicap}</span></td>
          <td class="text-center"><span class="pm-rank-display ${rankClass}">${rankDisplay}</span></td>
          <td class="text-center"><span class="pm-status-badge ${statusClass}"><span class="pm-status-dot"></span>${statusText}</span></td>
          <td class="text-center">
            <div class="pm-action-btns">
              <button class="pm-action-btn pm-view-btn" data-id="${p.id}" title="Lihat Detail"><i class="fa-solid fa-eye"></i></button>
              <button class="pm-action-btn pm-edit-btn" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
              <div class="pm-dropdown-container">
                <button class="pm-action-btn pm-more-btn" onclick="toggleContextMenu(event, '${p.id}', 'player')" title="Lainnya"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <div class="pm-context-menu" id="ctx-player-${p.id}">
                  <button class="pm-context-menu-item" onclick="assignPlayerClub('${p.id}', event)">
                    <i class="fa-solid fa-building"></i> Assign Klub
                  </button>
                  <button class="pm-context-menu-item" onclick="exportPlayer('${p.id}', event)">
                    <i class="fa-solid fa-file-export"></i> Export
                  </button>
                  <button class="pm-context-menu-item" onclick="togglePlayerStatus('${p.id}', event)">
                    <i class="fa-solid fa-ban"></i> ${p.status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                  </button>
                  <button class="pm-context-menu-item red-text" onclick="deletePlayerDirect('${p.id}', event)">
                    <i class="fa-solid fa-trash-can"></i> Hapus
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>`;
      }).join("");
    }

    // Update pagination info
    pmPageRange.textContent = pmFilteredPlayers.length > 0 ? `${start + 1}-${end}` : "0-0";
    pmTotalCount.textContent = pmFilteredPlayers.length;

    // Render page numbers
    renderPMPageNumbers(totalPages);

    // Update prev/next buttons
    pmPrevPage.disabled = pmCurrentPage <= 1;
    pmNextPage.disabled = pmCurrentPage >= totalPages;

    // Update check-all state
    updateCheckAllState();

    // Bind row events
    bindPMRowEvents();
  }

  // Render page numbers
  function renderPMPageNumbers(totalPages) {
    let html = "";
    const maxVisible = 5;
    let startPage = Math.max(1, pmCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pm-page-num" data-page="1">1</button>`;
      if (startPage > 2) html += `<span style="color: var(--text-dim); padding: 0 4px;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pm-page-num ${i === pmCurrentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="color: var(--text-dim); padding: 0 4px;">...</span>`;
      html += `<button class="pm-page-num" data-page="${totalPages}">${totalPages}</button>`;
    }

    pmPageNumbers.innerHTML = html;

    // Bind page number clicks
    pmPageNumbers.querySelectorAll(".pm-page-num").forEach(btn => {
      btn.addEventListener("click", () => {
        pmCurrentPage = parseInt(btn.dataset.page);
        renderPMTable();
      });
    });
  }

  // Bind row events (view, check, click)
  function bindPMRowEvents() {
    // View buttons
    pmTableBody.querySelectorAll(".pm-view-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.history.pushState({}, "", `/admin/athletes/${btn.dataset.id}`);
        checkAdminRoute();
      });
    });

    // Edit buttons
    pmTableBody.querySelectorAll(".pm-edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.history.pushState({}, "", `/admin/athletes/${btn.dataset.id}`);
        checkAdminRoute();
        setTimeout(() => {
          const adEditBtn = document.getElementById("ad-btn-edit-top");
          if (adEditBtn) adEditBtn.click();
        }, 120);
      });
    });

    // Row checkbox
    pmTableBody.querySelectorAll(".pm-row-check").forEach(cb => {
      cb.addEventListener("change", (e) => {
        e.stopPropagation();
        if (cb.checked) {
          pmSelectedIds.add(cb.dataset.id);
        } else {
          pmSelectedIds.delete(cb.dataset.id);
        }
        updateBulkBar();
        updateCheckAllState();
        renderPMTable();
      });
    });

    // Row click (opens detail)
    pmTableBody.querySelectorAll("tr[data-player-id]").forEach(row => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("input[type='checkbox']") || e.target.closest(".pm-action-btn")) return;
        openPlayerDetail(row.dataset.playerId);
      });
    });
  }

  // Check all checkbox
  if (pmCheckAll) {
    pmCheckAll.addEventListener("change", () => {
      const start = (pmCurrentPage - 1) * pmPerPage;
      const end = Math.min(start + pmPerPage, pmFilteredPlayers.length);
      const pageData = pmFilteredPlayers.slice(start, end);
      
      if (pmCheckAll.checked) {
        pageData.forEach(p => pmSelectedIds.add(p.id));
      } else {
        pageData.forEach(p => pmSelectedIds.delete(p.id));
      }
      updateBulkBar();
      renderPMTable();
    });
  }

  function updateCheckAllState() {
    if (!pmCheckAll) return;
    const start = (pmCurrentPage - 1) * pmPerPage;
    const end = Math.min(start + pmPerPage, pmFilteredPlayers.length);
    const pageData = pmFilteredPlayers.slice(start, end);
    if (pageData.length === 0) {
      pmCheckAll.checked = false;
      pmCheckAll.indeterminate = false;
      return;
    }
    const allChecked = pageData.every(p => pmSelectedIds.has(p.id));
    const someChecked = pageData.some(p => pmSelectedIds.has(p.id));
    pmCheckAll.checked = allChecked;
    pmCheckAll.indeterminate = !allChecked && someChecked;
  }

  // Bulk bar
  function updateBulkBar() {
    if (pmSelectedIds.size > 0) {
      pmBulkBar.style.display = "flex";
      pmSelectedCount.textContent = pmSelectedIds.size;
    } else {
      pmBulkBar.style.display = "none";
    }
  }

  // Open Player Detail Sidebar
  function openPlayerDetail(playerId) {
    const player = appData.players.find(p => p.id === playerId);
    if (!player) return;

    pmActivePlayerId = playerId;

    const placeholder = document.getElementById("pm-sidebar-placeholder");
    const content = document.getElementById("pm-sidebar-content");
    if (placeholder) placeholder.style.display = "none";
    if (content) content.style.display = "flex";

    // Profile card
    document.getElementById("pm-detail-avatar").src = player.avatar;
    document.getElementById("pm-detail-name").textContent = player.name;
    document.getElementById("pm-detail-id").textContent = player.id || "-";
    document.getElementById("pm-detail-club").querySelector("span").textContent = player.club;

    const statusTag = document.getElementById("pm-detail-status-tag");
    const statusText = player.status || "Aktif";
    statusTag.textContent = `Atlet ${statusText}`;
    statusTag.className = `pm-tag ${statusText === "Aktif" ? "green" : "red"}`;

    const hcTag = document.getElementById("pm-detail-hc-tag");
    hcTag.textContent = `Handicap ${player.handicap}`;

    // Quick stats from standings
    const standing = getPlayerStanding(player.name);
    document.getElementById("pm-detail-ranking").textContent = standing ? `#${standing.rank}` : "-";
    document.getElementById("pm-detail-matches").textContent = standing ? standing.played : "-";
    if (standing && standing.played > 0) {
      const wr = Math.round((standing.won / standing.played) * 100);
      document.getElementById("pm-detail-winrate").textContent = `${wr}%`;
    } else {
      document.getElementById("pm-detail-winrate").textContent = "-";
    }
    document.getElementById("pm-detail-wins").textContent = standing ? standing.won : "-";

    // Info tab
    document.getElementById("pm-info-name").textContent = player.name;
    document.getElementById("pm-info-phone").textContent = player.phone || "-";
    document.getElementById("pm-info-age").textContent = player.age ? `${player.age} tahun` : "-";
    document.getElementById("pm-info-address").textContent = player.address || "-";
    document.getElementById("pm-info-gender").textContent = player.gender || "-";

    // Stats tab — performance badges
    renderPerfBadges(standing);
    renderStatBars(standing);

    // Riwayat tab — simulated tournament data
    renderTournamentHistory(player);

    // Re-render table to highlight active row
    renderPMTable();
  }

  // Render performance badges (W/L/D circles)
  function renderPerfBadges(standing) {
    const container = document.getElementById("pm-perf-badges");
    if (!standing || !standing.played) {
      container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim);">Tidak ada data pertandingan</span>';
      return;
    }
    // Generate simulated last 10 match results
    let results = [];
    for (let i = 0; i < Math.min(10, standing.played); i++) {
      if (i < standing.won) results.push("W");
      else if (i < standing.won + standing.lost) results.push("L");
      else results.push("D");
    }
    // Shuffle for realism
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }
    container.innerHTML = results.map(r => {
      const cls = r === "W" ? "win" : r === "L" ? "lose" : "draw";
      return `<div class="pm-perf-dot ${cls}">${r}</div>`;
    }).join("");
  }

  // Render stat bars
  function renderStatBars(standing) {
    const container = document.getElementById("pm-stat-bars");
    if (!standing) {
      container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim);">Tidak ada data statistik</span>';
      return;
    }
    const wr = standing.played > 0 ? Math.round((standing.won / standing.played) * 100) : 0;
    const lr = standing.played > 0 ? Math.round((standing.lost / standing.played) * 100) : 0;
    container.innerHTML = `
      <div class="pm-bar-item">
        <div class="pm-bar-header"><span class="pm-bar-label">Win Rate</span><span class="pm-bar-val">${wr}%</span></div>
        <div class="pm-bar-track"><div class="pm-bar-fill green" style="width:${wr}%"></div></div>
      </div>
      <div class="pm-bar-item">
        <div class="pm-bar-header"><span class="pm-bar-label">Loss Rate</span><span class="pm-bar-val">${lr}%</span></div>
        <div class="pm-bar-track"><div class="pm-bar-fill amber" style="width:${lr}%"></div></div>
      </div>
      <div class="pm-bar-item">
        <div class="pm-bar-header"><span class="pm-bar-label">Poin Klasemen</span><span class="pm-bar-val">${standing.points}</span></div>
        <div class="pm-bar-track"><div class="pm-bar-fill blue" style="width:${Math.min(100, (standing.points / 500) * 100)}%"></div></div>
      </div>
    `;
  }

  // Render tournament history (simulated)
  function renderTournamentHistory(player) {
    const container = document.getElementById("pm-tournament-list");
    const events = appData.events || [];
    if (events.length === 0) {
      container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim);">Belum ada riwayat turnamen</span>';
      return;
    }
    // Simulate: player participated in some events
    const participated = events.slice(0, Math.min(4, events.length));
    container.innerHTML = participated.map((evt, idx) => {
      const places = ["gold", "silver", "bronze", "other"];
      const labels = ["🥇", "🥈", "🥉", "#4"];
      const placeClass = places[Math.min(idx, 3)];
      const placeLabel = labels[Math.min(idx, 3)];
      return `
        <div class="pm-tourney-item">
          <div class="pm-tourney-place ${placeClass}">${placeLabel}</div>
          <div class="pm-tourney-info">
            <div class="pm-tourney-name">${evt.title}</div>
            <div class="pm-tourney-date">${evt.date}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Sidebar tabs
  document.querySelectorAll(".pm-stab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".pm-stab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".pm-tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById(`pm-tab-${tab.dataset.tab}`);
      if (target) target.classList.add("active");
    });
  });

  // Pagination events
  if (pmPrevPage) pmPrevPage.addEventListener("click", () => { if (pmCurrentPage > 1) { pmCurrentPage--; renderPMTable(); } });
  if (pmNextPage) pmNextPage.addEventListener("click", () => { const tp = Math.ceil(pmFilteredPlayers.length / pmPerPage); if (pmCurrentPage < tp) { pmCurrentPage++; renderPMTable(); } });
  if (pmPerPageSel) pmPerPageSel.addEventListener("change", () => { pmPerPage = parseInt(pmPerPageSel.value); pmCurrentPage = 1; renderPMTable(); });

  // Filter/search events
  if (pmSearchInput) pmSearchInput.addEventListener("input", () => { pmCurrentPage = 1; renderPMTable(); });
  if (pmFilterClub) pmFilterClub.addEventListener("change", () => { pmCurrentPage = 1; renderPMTable(); });
  if (pmFilterHC) pmFilterHC.addEventListener("change", () => { pmCurrentPage = 1; renderPMTable(); });
  if (pmFilterStatus) pmFilterStatus.addEventListener("change", () => { pmCurrentPage = 1; renderPMTable(); });
  if (pmFilterGender) pmFilterGender.addEventListener("change", () => { pmCurrentPage = 1; renderPMTable(); });
  if (pmResetFilters) pmResetFilters.addEventListener("click", () => {
    pmSearchInput.value = "";
    pmFilterClub.value = "";
    pmFilterHC.value = "";
    pmFilterStatus.value = "";
    pmFilterGender.value = "";
    pmCurrentPage = 1;
    renderPMTable();
  });

  // Modal open/close
  const modalOverlay = document.getElementById("pm-add-player-modal");
  const btnOpen = document.getElementById("btn-open-add-player-modal");
  const btnClose = document.getElementById("pm-modal-close");

  if (btnOpen && modalOverlay) {
    btnOpen.addEventListener("click", () => { modalOverlay.style.display = "flex"; });
  }
  if (btnClose && modalOverlay) {
    btnClose.addEventListener("click", () => { modalOverlay.style.display = "none"; });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) modalOverlay.style.display = "none";
    });
  }

  // Export button placeholder
  const btnExport = document.getElementById("btn-export-players");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      // Simple CSV export
      const headers = ["ID", "Nama", "Klub", "Handicap", "Status", "Gender", "Umur", "No HP", "Alamat"];
      const rows = appData.players.map(p => [
        p.id, p.name, p.club, p.handicap, p.status || "Aktif", p.gender || "-", p.age || "-", p.phone || "-", p.address || "-"
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data_atlet_pobsi.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Bind sidebar expansion buttons
  const btnViewFull = document.getElementById("pm-btn-view-full");
  if (btnViewFull) {
    btnViewFull.addEventListener("click", () => {
      if (pmActivePlayerId) {
        window.history.pushState({}, "", `/admin/athletes/${pmActivePlayerId}`);
        checkAdminRoute();
      }
    });
  }

  const btnEditProfile = document.getElementById("pm-btn-edit-profile");
  if (btnEditProfile) {
    btnEditProfile.addEventListener("click", () => {
      if (pmActivePlayerId) {
        window.history.pushState({}, "", `/admin/athletes/${pmActivePlayerId}`);
        checkAdminRoute();
        setTimeout(() => {
          const adEditBtn = document.getElementById("ad-btn-edit-top");
          if (adEditBtn) adEditBtn.click();
        }, 120);
      }
    });
  }

  // Initial render
  populatePMClubFilter();
  updatePMStats();
  renderPMTable();

  // Expose for re-render after adding a new player
  window.refreshPlayerManagement = function() {
    populatePMClubFilter();
    updatePMStats();
    renderPMTable();
  };
}

// F. Interactive Billiard Balls Physics Simulator in Hero Section (WOW Factor)
function setupHeroBilliardSimulator() {
  const table = document.getElementById("hero-interactive-table");
  if (!table) return;

  const balls = table.querySelectorAll(".billiard-ball");

  table.addEventListener("mousemove", (e) => {
    // Dapatkan koordinat kursor mouse relatif terhadap meja tanding virtual
    const rect = table.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    balls.forEach(ball => {
      // Dapatkan pusat posisi bola biliar relatif terhadap meja
      const ballRect = ball.getBoundingClientRect();
      const ballCenterX = (ballRect.left + ballRect.width / 2) - rect.left;
      const ballCenterY = (ballRect.top + ballRect.height / 2) - rect.top;

      // Hitung jarak vektor antara mouse dan pusat bola
      const dx = ballCenterX - mouseX;
      const dy = ballCenterY - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Jika mouse mendekat (jarak kurang dari 90px), dorong bola menjauh secara proporsional!
      if (distance < 90) {
        const force = (90 - distance) / 90; // Nilai 0 s.d 1
        const pushX = (dx / distance) * force * 50; // Pergeseran hingga 50px
        const pushY = (dy / distance) * force * 50; // Pergeseran hingga 50px

        // Aplikasikan 2D transform slide dan 3D spherical shadow shift
        ball.style.transform = `translate(${pushX}px, ${pushY}px) scale(1.05)`;
        ball.style.boxShadow = `inset -6px -6px 12px rgba(0,0,0,0.4), ${-pushX/3}px ${-pushY/3}px 12px rgba(0,0,0,0.45)`;
      }
    });
  });

  table.addEventListener("mouseleave", () => {
    // Kembalikan seluruh bola ke posisi awal secara halus layaknya per
    balls.forEach(ball => {
      ball.style.transform = `translate(0, 0) scale(1)`;
      ball.style.boxShadow = ``;
    });
  });
}

// ==========================================================================
// F2. CLUBS DIRECTORY — Public Club Page Rendering & Search
// ==========================================================================
function renderClubs(filterQuery = '') {
  const container = document.getElementById('clubs-cards-container');
  if (!container) return;

  const clubs = appData.clubs || [];
  const query = filterQuery.toLowerCase().trim();

  const filtered = query
    ? clubs.filter(c => c.name.toLowerCase().includes(query) || c.address.toLowerCase().includes(query))
    : clubs;

  // Count members per club from players
  const memberCounts = {};
  (appData.players || []).forEach(p => {
    const club = p.club;
    memberCounts[club] = (memberCounts[club] || 0) + 1;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
        <i class="fa-solid fa-building" style="font-size: 3rem; margin-bottom: 16px; display: block; opacity: 0.3;"></i>
        <p>Tidak ada klub yang ditemukan.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(club => {
    const members = memberCounts[club.name] || 0;
    return `
    <div class="club-card animate-on-scroll">
      <div class="club-card-header">
        <div class="club-icon-wrapper">
          <i class="fa-solid fa-building"></i>
        </div>
        <div>
          <h3 class="club-card-name">${club.name}</h3>
          <span class="club-card-status">
            <span class="status-dot"></span>${club.status || 'Aktif'}
          </span>
        </div>
      </div>
      <div class="club-card-body">
        <div class="club-detail-row">
          <i class="fa-solid fa-location-dot"></i>
          <span>${club.address}</span>
        </div>
        <div class="club-detail-row">
          <i class="fa-solid fa-user-tie"></i>
          <span>${club.owner || '-'}</span>
        </div>
        <div class="club-detail-row">
          <i class="fa-solid fa-phone"></i>
          <span>${club.phone || '-'}</span>
        </div>
      </div>
      <div class="club-card-footer">
        <div class="club-metric">
          <span class="club-metric-val">${club.tables || 0}</span>
          <span class="club-metric-lbl">Meja</span>
        </div>
        <div class="club-metric">
          <span class="club-metric-val">${members}</span>
          <span class="club-metric-lbl">Atlet</span>
        </div>
      </div>
    </div>`;
  }).join('');

  // Update stats
  const totalEl = document.getElementById('club-stat-total');
  const tablesEl = document.getElementById('club-stat-tables');
  const activeEl = document.getElementById('club-stat-active');
  if (totalEl) totalEl.textContent = clubs.length;
  if (tablesEl) tablesEl.textContent = clubs.reduce((sum, c) => sum + (c.tables || 0), 0);
  if (activeEl) activeEl.textContent = clubs.filter(c => (c.status || 'Aktif') === 'Aktif').length;

  // Re-observe new animated elements
  setupScrollAnimations();
}

function setupClubSearch() {
  const input = document.getElementById('club-search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    renderClubs(input.value);
  });
}

// ==========================================================================
// F3. ADMIN CLUB MANAGEMENT — Add & Delete Club Overhaul (Clubs Console)
// ==========================================================================
let currentSelectedClubId = null;
let pmSelectedClubIds = new Set();

function setupAdminClubsConsole() {
  // Modal toggle
  const btnOpenAddClub = document.getElementById('btn-open-add-club-modal');
  const addClubModal = document.getElementById('pm-add-club-modal');
  const addClubModalClose = document.getElementById('pm-add-club-modal-close');
  
  if (btnOpenAddClub && addClubModal) {
    btnOpenAddClub.addEventListener('click', () => {
      addClubModal.style.display = 'flex';
    });
  }
  
  if (addClubModalClose && addClubModal) {
    addClubModalClose.addEventListener('click', () => {
      addClubModal.style.display = 'none';
    });
    addClubModal.addEventListener('click', (e) => {
      if (e.target === addClubModal) {
        addClubModal.style.display = 'none';
      }
    });
  }

  // Sidebar Tab Switcher
  const tabButtons = document.querySelectorAll('#pm-club-sidebar .pm-stab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabTarget = btn.getAttribute('data-tab');
      const tabContents = document.querySelectorAll('#pm-club-sidebar .pm-tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `pm-tab-${tabTarget}`) {
          content.classList.add('active');
        }
      });
    });
  });

  // Search Filter
  const searchInput = document.getElementById('pm-club-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderAdminClubPreview(searchInput.value.trim());
    });
  }

  // Reset Filters
  const resetBtn = document.getElementById('pm-club-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      renderAdminClubPreview();
    });
  }

  // Sidebar Delete Button
  const btnDeleteClub = document.getElementById('pm-btn-delete-club');
  if (btnDeleteClub) {
    btnDeleteClub.addEventListener('click', () => {
      if (currentSelectedClubId) {
        deleteClub(currentSelectedClubId);
        // Clear sidebar selection after delete
        const sidebarPlaceholder = document.getElementById('pm-club-sidebar-placeholder');
        const sidebarContent = document.getElementById('pm-club-sidebar-content');
        if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'flex';
        if (sidebarContent) sidebarContent.style.display = 'none';
        currentSelectedClubId = null;
      }
    });
  }

  // Edit Club Modal toggle
  const btnEditClub = document.getElementById('pm-btn-edit-club');
  const editClubModal = document.getElementById('pm-edit-club-modal');
  const editClubModalClose = document.getElementById('pm-edit-club-modal-close');
  
  if (btnEditClub && editClubModal) {
    btnEditClub.addEventListener('click', () => {
      if (!currentSelectedClubId) return;
      const clubs = appData.clubs || [];
      const club = clubs.find(c => c.id.toString() === currentSelectedClubId.toString());
      if (!club) return;
      
      // Populate fields
      document.getElementById('edit-club-id').value = club.id;
      document.getElementById('edit-club-name').value = club.name;
      document.getElementById('edit-club-address').value = club.address;
      document.getElementById('edit-club-owner').value = club.owner || '';
      document.getElementById('edit-club-phone').value = club.phone || '';
      document.getElementById('edit-club-tables').value = club.tables || 0;
      document.getElementById('edit-club-status').value = club.status || 'Aktif';
      
      editClubModal.style.display = 'flex';
    });
  }
  
  if (editClubModalClose && editClubModal) {
    editClubModalClose.addEventListener('click', () => {
      editClubModal.style.display = 'none';
    });
    editClubModal.addEventListener('click', (e) => {
      if (e.target === editClubModal) {
        editClubModal.style.display = 'none';
      }
    });
  }

  // Submit edit club form
  const formEditClub = document.getElementById('form-admin-edit-club');
  if (formEditClub) {
    formEditClub.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-club-id').value;
      const name = document.getElementById('edit-club-name').value.trim();
      const address = document.getElementById('edit-club-address').value.trim();
      const owner = document.getElementById('edit-club-owner').value.trim();
      const phone = document.getElementById('edit-club-phone').value.trim();
      const tables = parseInt(document.getElementById('edit-club-tables').value || 0);
      const status = document.getElementById('edit-club-status').value;

      const onSuccess = async () => {
        alert(`Data klub "${name}" berhasil diperbarui!`);
        formEditClub.reset();
        if (editClubModal) editClubModal.style.display = 'none';
        await loadDataFromApi();
        renderClubs();
        renderAdminClubPreview();
        updateWorkspaceStats();
        loadStatistics();
        populateClubFilters();
        
        // Refresh sidebar view
        selectClubRow(id, document.querySelector(`#pm-club-table-body tr.pm-row-active`));
      };

      if (isServerOnline) {
        try {
          const res = await fetch(`/api/clubs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, owner, phone, tables, status })
          });
          if (res.ok) {
            await onSuccess();
          } else {
            const errJson = await res.json();
            alert(`Gagal: ${errJson.error || 'Server error'}`);
          }
        } catch (err) {
          alert(`Error koneksi: ${err.message}`);
        }
      } else {
        const clubs = appData.clubs || [];
        const index = clubs.findIndex(c => c.id.toString() === id.toString());
        if (index !== -1) {
          clubs[index] = { ...clubs[index], name, address, owner, phone, tables, status };
          alert(`Mode Luring: Data klub "${name}" diperbarui di memori sementara!`);
          formEditClub.reset();
          if (editClubModal) editClubModal.style.display = 'none';
          renderClubs();
          renderAdminClubPreview();
          updateWorkspaceStats();
          loadStatistics();
          populateClubFilters();
          selectClubRow(id, document.querySelector(`#pm-club-table-body tr.pm-row-active`));
        }
      }
    });
  }

  // Detail Lengkap button click (Lihat Detail Lengkap)
  const btnViewClubFull = document.getElementById('pm-btn-view-club-full');
  if (btnViewClubFull) {
    btnViewClubFull.addEventListener('click', () => {
      if (!currentSelectedClubId) return;
      window.history.pushState({}, "", `/admin/clubs/${currentSelectedClubId}`);
      checkAdminRoute();
    });
  }
  
  // Submit new club form
  const formClub = document.getElementById('form-admin-add-club');
  if (formClub) {
    formClub.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('adm-club-name').value.trim();
      const address = document.getElementById('adm-club-address').value.trim();
      const owner = document.getElementById('adm-club-owner').value.trim();
      const phone = document.getElementById('adm-club-phone').value.trim();
      const tables = parseInt(document.getElementById('adm-club-tables').value || 0);

      const onSuccess = async () => {
        alert(`Klub "${name}" berhasil ditambahkan!`);
        formClub.reset();
        if (addClubModal) addClubModal.style.display = 'none';
        await loadDataFromApi();
        renderClubs();
        renderAdminClubPreview();
        updateWorkspaceStats();
        loadStatistics();
        populateClubFilters();
      };

      if (isServerOnline) {
        try {
          const res = await fetch('/api/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, owner, phone, tables })
          });
          if (res.ok) {
            await onSuccess();
          } else {
            const errJson = await res.json();
            alert(`Gagal: ${errJson.error || 'Server error'}`);
          }
        } catch (err) {
          alert(`Error koneksi: ${err.message}`);
        }
      } else {
        const tempId = `C_TEMP_${(appData.clubs || []).length + 1}`;
        const newClub = { id: tempId, name, address, owner: owner || '-', phone: phone || '-', tables, status: 'Aktif' };
        if (!appData.clubs) appData.clubs = [];
        appData.clubs.push(newClub);
        alert(`Mode Luring: Klub "${name}" ditambahkan ke memori sementara!`);
        formClub.reset();
        if (addClubModal) addClubModal.style.display = 'none';
        renderClubs();
        renderAdminClubPreview();
        updateWorkspaceStats();
        loadStatistics();
        populateClubFilters();
      }
    });
  }

  // Bulk Selection and Popover Bar logic for Clubs
  const clubBulkBar = document.getElementById('pm-club-bulk-bar');
  const clubSelectedCount = document.getElementById('pm-club-selected-count');
  const clubCheckAll = document.getElementById('pm-club-check-all');
  const clubTbody = document.getElementById('pm-club-table-body');

  window.updateClubBulkBar = function() {
    if (!clubBulkBar || !clubSelectedCount) return;
    if (pmSelectedClubIds.size > 0) {
      clubBulkBar.style.display = "flex";
      clubSelectedCount.textContent = pmSelectedClubIds.size;
    } else {
      clubBulkBar.style.display = "none";
    }
  };

  window.updateClubCheckAllState = function() {
    if (!clubCheckAll) return;
    const clubs = appData.clubs || [];
    const searchInput = document.getElementById('pm-club-search-input');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filtered = q
      ? clubs.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || (c.owner && c.owner.toLowerCase().includes(q)))
      : clubs;

    if (filtered.length === 0) {
      clubCheckAll.checked = false;
      clubCheckAll.indeterminate = false;
      return;
    }
    const allChecked = filtered.every(c => pmSelectedClubIds.has(c.id.toString()));
    const someChecked = filtered.some(c => pmSelectedClubIds.has(c.id.toString()));
    clubCheckAll.checked = allChecked;
    clubCheckAll.indeterminate = !allChecked && someChecked;
  };

  if (clubCheckAll) {
    clubCheckAll.addEventListener('change', () => {
      const clubs = appData.clubs || [];
      const searchInput = document.getElementById('pm-club-search-input');
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const filtered = q
        ? clubs.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || (c.owner && c.owner.toLowerCase().includes(q)))
        : clubs;

      if (clubCheckAll.checked) {
        filtered.forEach(c => pmSelectedClubIds.add(c.id.toString()));
      } else {
        filtered.forEach(c => pmSelectedClubIds.delete(c.id.toString()));
      }
      updateClubBulkBar();
      renderAdminClubPreview(q);
    });
  }

  if (clubTbody) {
    clubTbody.addEventListener('change', (e) => {
      if (e.target.classList.contains('pm-club-row-check')) {
        const id = e.target.value.toString();
        if (e.target.checked) {
          pmSelectedClubIds.add(id);
        } else {
          pmSelectedClubIds.delete(id);
        }
        updateClubBulkBar();
        updateClubCheckAllState();
        
        // Find row to toggle select class
        const row = e.target.closest('tr');
        if (row) {
          if (e.target.checked) {
            row.classList.add('pm-row-selected');
          } else {
            row.classList.remove('pm-row-selected');
          }
        }
      }
    });
  }

  // Hook Bulk Actions Buttons
  const btnBulkExport = document.getElementById('pm-club-bulk-export');
  if (btnBulkExport) {
    btnBulkExport.addEventListener('click', () => {
      alert(`Mengekspor ${pmSelectedClubIds.size} data klub ke CSV/Excel...`);
    });
  }

  const btnBulkStatus = document.getElementById('pm-club-bulk-status');
  if (btnBulkStatus) {
    btnBulkStatus.addEventListener('click', async () => {
      const ids = Array.from(pmSelectedClubIds);
      let successCount = 0;
      for (const id of ids) {
        const club = appData.clubs.find(c => c.id.toString() === id);
        if (!club) continue;
        const newStatus = (club.status || 'Aktif') === 'Aktif' ? 'Nonaktif' : 'Aktif';
        
        if (isServerOnline) {
          try {
            const res = await fetch(`/api/clubs/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...club, status: newStatus })
            });
            if (res.ok) successCount++;
          } catch(e) {}
        } else {
          club.status = newStatus;
          successCount++;
        }
      }
      if (isServerOnline && successCount > 0) {
        await loadDataFromApi();
      }
      alert(`Status ${successCount} klub berhasil diperbarui!`);
      pmSelectedClubIds.clear();
      updateClubBulkBar();
      updateClubCheckAllState();
      renderClubs();
      renderAdminClubPreview();
      updateWorkspaceStats();
      loadStatistics();
      populateClubFilters();
    });
  }

  const btnBulkDelete = document.getElementById('pm-club-bulk-delete');
  if (btnBulkDelete) {
    btnBulkDelete.addEventListener('click', async () => {
      const ids = Array.from(pmSelectedClubIds);
      if (confirm(`Yakin ingin menghapus ${ids.length} klub terpilih secara permanen dari database resmi POBSI?`)) {
        let deletedCount = 0;
        for (const id of ids) {
          if (isServerOnline) {
            try {
              const res = await fetch(`/api/clubs/${id}`, { method: 'DELETE' });
              if (res.ok) deletedCount++;
            } catch(e) {}
          } else {
            appData.clubs = (appData.clubs || []).filter(c => c.id.toString() !== id);
            deletedCount++;
          }
        }
        if (isServerOnline && deletedCount > 0) {
          await loadDataFromApi();
        }
        pmSelectedClubIds.clear();
        updateClubBulkBar();
        updateClubCheckAllState();
        renderClubs();
        renderAdminClubPreview();
        updateWorkspaceStats();
        loadStatistics();
        populateClubFilters();
        
        // Clear sidebar selection if deleted
        const sidebarPlaceholder = document.getElementById('pm-club-sidebar-placeholder');
        const sidebarContent = document.getElementById('pm-club-sidebar-content');
        if (sidebarPlaceholder) sidebarPlaceholder.style.display = 'flex';
        if (sidebarContent) sidebarContent.style.display = 'none';
        currentSelectedClubId = null;

        alert(`Berhasil menghapus ${deletedCount} klub!`);
      }
    });
  }
}

window.toggleContextMenu = function(event, id, type) {
  if (event) event.stopPropagation();
  
  // Close all other open context menus
  const allMenus = document.querySelectorAll('.pm-context-menu');
  allMenus.forEach(menu => {
    if (menu.id !== `ctx-${type}-${id}`) {
      menu.classList.remove('show');
    }
  });

  const targetMenu = document.getElementById(`ctx-${type}-${id}`);
  if (targetMenu) {
    targetMenu.classList.toggle('show');
  }
};

// Global click listener to close all context menus when clicking outside
document.addEventListener('click', () => {
  const allMenus = document.querySelectorAll('.pm-context-menu');
  allMenus.forEach(menu => {
    menu.classList.remove('show');
  });
});

window.assignPlayerClub = async function(playerId, event) {
  if (event) event.stopPropagation();
  const player = appData.players.find(p => p.id.toString() === playerId.toString());
  if (!player) return;

  const clubs = appData.clubs || [];
  const clubList = Array.from(new Set(clubs.map(c => c.name))).sort().join(', ');
  const newClub = prompt(`Pilih/Ketik nama klub baru untuk atlet "${player.name}":\n\nKlub terdaftar: ${clubList}`, player.club);
  
  if (newClub !== null && newClub.trim() !== '') {
    const trimmedClub = newClub.trim();
    // Validate if club exists (case-insensitive)
    const matchedClub = clubs.find(c => c.name.toLowerCase() === trimmedClub.toLowerCase());
    if (!matchedClub) {
      alert(`Gagal: Klub "${trimmedClub}" tidak terdaftar di database resmi POBSI!`);
      return;
    }

    if (isServerOnline) {
      try {
        const res = await fetch(`/api/players/${playerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ club: matchedClub.name })
        });
        if (res.ok) {
          alert(`Klub atlet "${player.name}" berhasil diubah menjadi "${matchedClub.name}"!`);
          await loadDataFromApi();
        } else {
          const err = await res.json();
          alert(`Gagal: ${err.error}`);
        }
      } catch (e) {
        alert(`Error: ${e.message}`);
      }
    } else {
      player.club = matchedClub.name;
      alert(`Luring: Klub atlet "${player.name}" diubah menjadi "${matchedClub.name}"`);
    }

    // Refresh views
    if (typeof window.refreshPlayerManagement === 'function') {
      window.refreshPlayerManagement();
    }
    updateWorkspaceStats();
    renderWorkspacePreviews();
  }
};

window.exportPlayer = function(playerId, event) {
  if (event) event.stopPropagation();
  const player = appData.players.find(p => p.id.toString() === playerId.toString());
  if (!player) return;
  alert(`Mengekspor data atlet "${player.name}" (ID: ${player.id || playerId}) ke Excel/CSV...`);
};

window.togglePlayerStatus = async function(playerId, event) {
  if (event) event.stopPropagation();
  const player = appData.players.find(p => p.id.toString() === playerId.toString());
  if (!player) return;
  const newStatus = (player.status || 'Aktif') === 'Aktif' ? 'Nonaktif' : 'Aktif';
  
  if (isServerOnline) {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Status atlet "${player.name}" berhasil diubah menjadi ${newStatus}!`);
        await loadDataFromApi();
      } else {
        const errJson = await res.json();
        alert(`Gagal: ${errJson.error}`);
      }
    } catch(err) {
      alert(`Error: ${err.message}`);
    }
  } else {
    player.status = newStatus;
    alert(`Luring: Status atlet "${player.name}" diubah menjadi ${newStatus}`);
  }
  
  // Refresh views
  if (typeof window.refreshPlayerManagement === 'function') {
    window.refreshPlayerManagement();
  }
};

window.deletePlayerDirect = async function(playerId, event) {
  if (event) event.stopPropagation();
  const player = appData.players.find(p => p.id.toString() === playerId.toString());
  if (!player) return;
  
  if (confirm(`PERINGATAN: Yakin ingin menghapus atlet "${player.name}" secara permanen dari database resmi POBSI?`)) {
    if (isServerOnline) {
      try {
        const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`Atlet "${player.name}" berhasil dihapus.`);
          await loadDataFromApi();
        } else {
          const err = await res.json();
          alert(`Gagal menghapus: ${err.error}`);
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    } else {
      appData.players = appData.players.filter(p => p.id.toString() !== playerId.toString());
      alert('Atlet dihapus dari memori luring.');
    }
    
    // Refresh player management
    if (typeof window.refreshPlayerManagement === 'function') {
      window.refreshPlayerManagement();
    }
    updateWorkspaceStats();
    renderWorkspacePreviews();
  }
};

window.toggleClubStatus = async function(clubId, event) {
  if (event) event.stopPropagation();
  const club = appData.clubs.find(c => c.id.toString() === clubId.toString());
  if (!club) return;
  const newStatus = (club.status || 'Aktif') === 'Aktif' ? 'Nonaktif' : 'Aktif';
  
  if (isServerOnline) {
    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...club, status: newStatus })
      });
      if (res.ok) {
        alert(`Status klub "${club.name}" berhasil diubah menjadi ${newStatus}!`);
        await loadDataFromApi();
      } else {
        const errJson = await res.json();
        alert(`Gagal: ${errJson.error}`);
      }
    } catch(err) {
      alert(`Error: ${err.message}`);
    }
  } else {
    club.status = newStatus;
    alert(`Luring: Status klub "${club.name}" diubah menjadi ${newStatus}`);
  }
  
  // Refresh views
  renderClubs();
  renderAdminClubPreview();
  updateWorkspaceStats();
  loadStatistics();
  populateClubFilters();
};

window.viewClub = function(clubId) {
  window.history.pushState({}, "", `/admin/clubs/${clubId}`);
  checkAdminRoute();
};

window.editClub = function(clubId) {
  window.history.pushState({}, "", `/admin/clubs/${clubId}`);
  checkAdminRoute();
  setTimeout(() => {
    const adEditBtn = document.getElementById("ad-club-btn-edit");
    if (adEditBtn) adEditBtn.click();
  }, 120);
};

window.deleteClub = async function(clubId) {
  if (!confirm('Yakin ingin menghapus klub ini?')) return;

  if (isServerOnline) {
    try {
      const res = await fetch(`/api/clubs/${clubId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Klub berhasil dihapus!');
        await loadDataFromApi();
        renderClubs();
        renderAdminClubPreview();
        updateWorkspaceStats();
        loadStatistics();
        populateClubFilters();
      } else {
        const errJson = await res.json();
        alert(`Gagal: ${errJson.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  } else {
    appData.clubs = (appData.clubs || []).filter(c => c.id !== clubId);
    alert('Klub dihapus dari memori sementara!');
    renderClubs();
    renderAdminClubPreview();
    updateWorkspaceStats();
    loadStatistics();
    populateClubFilters();
  }
};

window.selectClubRow = function(clubId, element) {
  // Highlight row
  const rows = document.querySelectorAll('#pm-club-table-body tr');
  rows.forEach(r => {
    r.classList.remove('pm-row-selected');
    r.classList.remove('pm-row-active');
  });
  if (element) {
    element.classList.add('pm-row-selected');
    element.classList.add('pm-row-active');
  }

  const clubs = appData.clubs || [];
  const club = clubs.find(c => c.id.toString() === clubId.toString());
  if (!club) return;

  currentSelectedClubId = clubId;

  // Toggle Sidebar visibility
  const placeholder = document.getElementById('pm-club-sidebar-placeholder');
  const content = document.getElementById('pm-club-sidebar-content');
  if (placeholder) placeholder.style.display = 'none';
  if (content) content.style.display = 'flex';

  // Populate Details
  const nameEl = document.getElementById('pm-club-detail-name');
  const idEl = document.getElementById('pm-club-detail-id');
  const tablesTag = document.getElementById('pm-club-detail-tables-tag');
  const tablesCountEl = document.getElementById('pm-club-detail-tables-count');
  
  if (nameEl) nameEl.textContent = club.name;
  if (idEl) idEl.textContent = `ID: CLB-${club.id.toString().padStart(3, '0')}`;
  if (tablesTag) tablesTag.textContent = `${club.tables || 0} Meja Biliar`;
  if (tablesCountEl) tablesCountEl.textContent = club.tables || 0;

  // Info tab
  const addressVal = document.getElementById('pm-club-info-address');
  const ownerVal = document.getElementById('pm-club-info-owner');
  const phoneVal = document.getElementById('pm-club-info-phone');
  
  if (addressVal) addressVal.textContent = club.address;
  if (ownerVal) ownerVal.textContent = club.owner || '-';
  if (phoneVal) phoneVal.textContent = club.phone || '-';

  // Calculate members & averages
  const playersInClub = appData.players ? appData.players.filter(p => p.club.toLowerCase() === club.name.toLowerCase()) : [];
  const totalMembersEl = document.getElementById('pm-club-detail-athletes');
  if (totalMembersEl) totalMembersEl.textContent = playersInClub.length;

  // Average Handicap Calculation
  const avgHcEl = document.getElementById('pm-club-detail-avg-hc');
  if (avgHcEl) {
    if (playersInClub.length > 0) {
      const hcWeights = {
        '3B': 3.0, '3N': 3.3, '3A': 3.7,
        '4B': 4.0, '4A': 4.5,
        '5B': 5.0, '5A': 5.5,
        '6': 6.0, '7': 7.0
      };
      let sumWeights = 0;
      let count = 0;
      playersInClub.forEach(p => {
        const hcStr = p.handicap ? p.handicap.toString().toUpperCase() : '';
        if (hcWeights[hcStr]) {
          sumWeights += hcWeights[hcStr];
          count++;
        }
      });
      const avgWeight = count > 0 ? sumWeights / count : 4.0;
      let bestLabel = 'HC 4B';
      let minDiff = Infinity;
      Object.entries(hcWeights).forEach(([lbl, wt]) => {
        const diff = Math.abs(wt - avgWeight);
        if (diff < minDiff) {
          minDiff = diff;
          bestLabel = `HC ${lbl}`;
        }
      });
      avgHcEl.textContent = `${bestLabel} (${avgWeight.toFixed(1)})`;
    } else {
      avgHcEl.textContent = '-';
    }
  }

  // Populate Members list in tab
  const listContainer = document.getElementById('pm-club-athletes-list');
  if (listContainer) {
    if (playersInClub.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.82rem;">Belum ada atlet terafiliasi</div>`;
      return;
    }
    listContainer.innerHTML = playersInClub.map(p => `
      <div class="pm-tournament-item" style="padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.02); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${p.avatar}" alt="${p.name}" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #fff;">${p.name}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Ranking #${p.standing_rank || '-'}</span>
          </div>
        </div>
        <span class="pm-hc-badge" style="font-size: 0.65rem; padding: 2px 6px;">HC ${p.handicap}</span>
      </div>
    `).join('');
  }
};

function renderAdminClubPreview(searchQuery = '') {
  const tbody = document.getElementById('pm-club-table-body');
  const emptyState = document.getElementById('pm-club-empty-state');
  if (!tbody) return;

  let clubs = appData.clubs || [];

  // 1. Calculate KPI Metrics across all clubs
  const totalClubs = clubs.length;
  const totalTables = clubs.reduce((sum, c) => sum + (c.tables || 0), 0);
  const activeMembers = appData.players ? appData.players.length : 0;
  const avgTables = totalClubs > 0 ? (totalTables / totalClubs).toFixed(1) : 0;

  // Update Stats DOM Elements
  const totalClubsEl = document.getElementById('pm-total-clubs');
  const totalTablesEl = document.getElementById('pm-total-tables');
  const activeMembersEl = document.getElementById('pm-active-members');
  const avgTablesEl = document.getElementById('pm-avg-tables');

  if (totalClubsEl) totalClubsEl.textContent = totalClubs;
  if (totalTablesEl) totalTablesEl.textContent = totalTables;
  if (activeMembersEl) activeMembersEl.textContent = activeMembers;
  if (avgTablesEl) avgTablesEl.textContent = avgTables;

  // 2. Filter Clubs list based on search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    clubs = clubs.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.address && c.address.toLowerCase().includes(q)) || 
      (c.owner && c.owner.toLowerCase().includes(q))
    );
  }

  // Handle Empty State
  if (clubs.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  // 3. Render Table Rows
  tbody.innerHTML = clubs.map(c => {
    const statusClass = (c.status || 'Aktif') === 'Aktif' ? 'aktif' : 'nonaktif';
    const statusText = c.status || 'Aktif';
    const isSelected = pmSelectedClubIds.has(c.id.toString());
    
    return `
      <tr class="pm-row-clickable ${isSelected ? 'pm-row-selected' : ''}" onclick="selectClubRow('${c.id}', this)">
        <td class="pm-td-check" onclick="event.stopPropagation()">
          <input type="checkbox" class="pm-club-row-check" value="${c.id}" ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          <div class="pm-cell-player">
            <div class="pm-cell-avatar" style="display: flex; align-items: center; justify-content: center; border-radius: 10px;">
              <i class="fa-solid fa-building" style="font-size: 1.1rem; color: #60a5fa;"></i>
            </div>
            <div class="pm-cell-name-wrap">
              <span class="pm-cell-name">${c.name}</span>
              <span class="pm-cell-id">ID: CLB-${c.id.toString().padStart(3, '0')}</span>
            </div>
          </div>
        </td>
        <td><span class="pm-cell-club" style="white-space: normal; max-width: 250px; display: block;">${c.address}</span></td>
        <td><span class="pm-cell-name" style="font-size: 0.88rem; font-weight: 500; color: var(--text-muted);">${c.owner || '-'}</span></td>
        <td class="text-center"><span class="pm-hc-badge" style="min-width: 32px; font-weight: 800;">${c.tables || 0}</span></td>
        <td class="text-center">
          <span class="pm-status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="text-center" onclick="event.stopPropagation()">
          <div class="pm-action-btns">
            <button class="pm-action-btn pm-view-btn" onclick="viewClub('${c.id}')" title="Lihat Detail"><i class="fa-solid fa-eye"></i></button>
            <button class="pm-action-btn pm-edit-btn" onclick="editClub('${c.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <div class="pm-dropdown-container">
              <button class="pm-action-btn pm-more-btn" onclick="toggleContextMenu(event, '${c.id}', 'club')" title="Lainnya"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              <div class="pm-context-menu" id="ctx-club-${c.id}">
                <button class="pm-context-menu-item" onclick="toggleClubStatus('${c.id}', event)">
                  <i class="fa-solid fa-ban"></i> ${c.status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                </button>
                <button class="pm-context-menu-item red-text" onclick="event.stopPropagation(); deleteClub('${c.id}')">
                  <i class="fa-solid fa-trash-can"></i> Hapus
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// G. PREMIUM ANIMATION ENGINE — Scroll-triggered Entrance Animations
// ==========================================================================
function setupScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  animatedElements.forEach(el => observer.observe(el));
}

// ==========================================================================
// H. ANIMATED NUMBER COUNTERS — Count from 0 with easeOutExpo
// ==========================================================================
function setupAnimatedCounters() {
  const counters = [
    { el: document.getElementById('stat-players-count'), target: null, suffix: '+' },
    { el: document.getElementById('stat-clubs-count'), target: null, suffix: '' },
    { el: document.getElementById('stat-events-count'), target: null, suffix: '+' }
  ];

  counters.forEach(counter => {
    if (!counter.el) return;
    const text = counter.el.textContent.trim();
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num === 0) return;
    counter.target = num;
    counter.suffix = text.replace(/[0-9]/g, '').trim();
  });

  const validCounters = counters.filter(c => c.el && c.target !== null);
  if (validCounters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        validCounters.forEach(counter => animateCounter(counter));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsGrid = document.querySelector('.stats-grid');
  if (statsGrid) observer.observe(statsGrid);

  function animateCounter(counter) {
    const duration = 2000;
    const startTime = performance.now();
    const target = counter.target;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = Math.round(easedProgress * target);

      counter.el.textContent = currentValue + counter.suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    counter.el.textContent = '0';
    requestAnimationFrame(update);
  }
}

// ==========================================================================
// I. 3D PERSPECTIVE CARD TILT — Hover mouse effect on stat/guide cards
// ==========================================================================
function setup3DTiltCards() {
  const tiltCards = document.querySelectorAll('.stat-card, .guide-step-card, .shortcut-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });
}

// ============================================================================
// DEDICATED ATHLETE DETAIL PROFILE (AD) — JS Logic
// ============================================================================
let adActivePlayerId = null;

async function renderAthleteDetail(playerId) {
  const player = appData.players.find(p => p.id === playerId);
  if (!player) {
    alert("Atlet tidak ditemukan!");
    switchAdminPane("pane-players");
    return;
  }

  adActivePlayerId = playerId;

  // Fetch matches, tournament history, handicap history & ranking history dynamically from the database
  const [matches, tourneys, hcHistory, rankHistory] = await Promise.all([
    fetch(`/api/matches?playerId=${playerId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`/api/tournament-history?playerId=${playerId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`/api/handicap-history?playerId=${playerId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`/api/ranking-history?playerId=${playerId}`).then(r => r.ok ? r.json() : [])
  ]);

  // 1. Populate basic profile info
  const avatarEl = document.getElementById("ad-detail-avatar");
  if (avatarEl) {
    avatarEl.src = player.avatar;
    avatarEl.onerror = () => { avatarEl.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.name)}`; };
  }

  const indicatorEl = document.getElementById("ad-detail-indicator");
  if (indicatorEl) {
    indicatorEl.className = `ad-status-indicator ${(player.status || "Aktif").toLowerCase() === "aktif" ? "aktif" : "nonaktif"}`;
  }

  const nameEl = document.getElementById("ad-detail-name");
  if (nameEl) nameEl.innerHTML = `${player.name} <i class="fa-solid fa-circle-check text-blue" title="Verified Athlete"></i>`;

  const idEl = document.getElementById("ad-detail-id");
  if (idEl) idEl.textContent = `ID: ${player.id || "-"}`;

  const clubEl = document.getElementById("ad-detail-club");
  if (clubEl) clubEl.querySelector("span").textContent = player.club;

  // Badges
  const badgeHCEl = document.getElementById("ad-tag-handicap");
  if (badgeHCEl) badgeHCEl.textContent = `Handicap ${player.handicap}`;

  // Get ranking
  let rankVal = null;
  const standing = appData.standings.find(s => s.name === player.name);
  if (standing) rankVal = standing.rank;
  const badgeRankEl = document.getElementById("ad-tag-ranking");
  if (badgeRankEl) {
    badgeRankEl.textContent = rankVal ? `Ranking #${rankVal}` : "Ranking -";
  }

  const badgeStatusEl = document.getElementById("ad-tag-status");
  if (badgeStatusEl) {
    const isAktif = (player.status || "Aktif").toLowerCase() === "aktif";
    badgeStatusEl.textContent = `Atlet ${player.status || "Aktif"}`;
    badgeStatusEl.className = `ad-tag ${isAktif ? "green" : "red"}`;
  }

  // Personal details
  document.getElementById("ad-val-name").textContent = player.name;
  document.getElementById("ad-val-club").textContent = player.club;
  document.getElementById("ad-val-gender").textContent = player.gender || "Laki-laki";
  document.getElementById("ad-val-status").textContent = player.status || "Aktif";
  
  // Tanggal Lahir (derived from derived age or actual metadata)
  const simulatedDOB = player.age ? `${18 + (player.age % 12)} Mei ${2026 - player.age}` : "12 Mei 1998";
  document.getElementById("ad-val-dob").textContent = simulatedDOB;
  
  const simulatedJoin = player.id ? `${(parseInt(player.id.replace("P", "")) % 28) + 1} Januari 2025` : "12 Januari 2025";
  document.getElementById("ad-val-join").textContent = simulatedJoin;

  // Additional details
  document.getElementById("ad-val-age").textContent = (player.age || 24) + " Tahun";
  document.getElementById("ad-val-phone").textContent = player.phone || "0812-XXXX-XXXX";
  document.getElementById("ad-val-address").textContent = player.address || "Kabupaten Banjarnegara";

  // Set cover picture background
  const coverEl = document.getElementById("ad-detail-cover");
  if (coverEl) {
    if (player.cover) {
      coverEl.style.backgroundImage = `url('${player.cover}')`;
    } else {
      coverEl.style.backgroundImage = `url('images/hero-player.png')`; // fallback
    }
  }

  // Set KTP document details
  const ktpPreview = document.getElementById("ad-ktp-preview");
  const ktpFallback = document.getElementById("ad-ktp-fallback");
  const ktpEmpty = document.getElementById("ad-ktp-empty");
  const ktpDownloadBtn = document.getElementById("ad-ktp-download-btn");
  const ktpStatusTag = document.getElementById("ad-ktp-status-tag");

  if (ktpPreview && ktpFallback && ktpEmpty) {
    if (!player.ktp) {
      // Empty state
      ktpPreview.style.display = "none";
      ktpFallback.style.display = "none";
      ktpEmpty.style.display = "flex";
      if (ktpStatusTag) {
        ktpStatusTag.textContent = "Belum Diunggah";
        ktpStatusTag.className = "ad-tag red";
      }
    } else if (player.ktp.startsWith("data:application/pdf") || player.ktp.toLowerCase().includes(".pdf")) {
      // PDF document
      ktpPreview.style.display = "none";
      ktpFallback.style.display = "flex";
      ktpEmpty.style.display = "none";
      if (ktpDownloadBtn) ktpDownloadBtn.href = player.ktp;
      if (ktpStatusTag) {
        ktpStatusTag.textContent = "Terverifikasi (PDF)";
        ktpStatusTag.className = "ad-tag gold";
      }
    } else {
      // Image document
      ktpPreview.src = player.ktp;
      ktpPreview.style.display = "block";
      ktpFallback.style.display = "none";
      ktpEmpty.style.display = "none";
      if (ktpStatusTag) {
        ktpStatusTag.textContent = "Terverifikasi (Gambar)";
        ktpStatusTag.className = "ad-tag gold";
      }
    }
  }

  // KPI cards
  const kpiRankEl = document.getElementById("ad-kpi-rank");
  if (kpiRankEl) kpiRankEl.textContent = rankVal ? `#${rankVal}` : "-";

  const kpiHCEl = document.getElementById("ad-kpi-hc");
  if (kpiHCEl) kpiHCEl.textContent = player.handicap;

  // Render Handicap Progress Bar (Premium feature based on POBSI official guidelines)
  const progressContainer = document.getElementById("ad-hc-progress-container");
  const progressLbl = document.getElementById("ad-hc-progress-lbl");
  const progressVal = document.getElementById("ad-hc-progress-val");
  const progressBar = document.getElementById("ad-hc-progress-bar");

  if (progressContainer && progressLbl && progressVal && progressBar) {
    const hcThresholds = {
      "3B": { next: "3N", pts: 30 },
      "3N": { next: "3A", pts: 60 },
      "3A": { next: "4B", pts: 150 },
      "4B": { next: "4A", pts: 200 },
      "4A": { next: "5B", pts: 300 },
      "5B": { next: "5A", pts: 400 },
      "5A": { next: "6", pts: 500 },
      "6": { next: "7", pts: 600 }
    };
    
    const curHC = player.handicap;
    if (hcThresholds[curHC]) {
      const threshold = hcThresholds[curHC];
      const curPoints = player.points || 0;
      const percentage = Math.min(100, Math.round((curPoints / threshold.pts) * 100));
      
      progressLbl.textContent = `Progres ke ${threshold.next}`;
      progressVal.textContent = `${curPoints} / ${threshold.pts} Poin`;
      progressBar.style.width = `${percentage}%`;
      progressContainer.style.display = "block";
    } else {
      progressContainer.style.display = "none";
    }
  }

  const kpiPlayedEl = document.getElementById("ad-kpi-played");
  if (kpiPlayedEl) kpiPlayedEl.textContent = standing ? standing.played : "0";

  const kpiWREl = document.getElementById("ad-kpi-winrate");
  if (kpiWREl) {
    if (standing && standing.played > 0) {
      const wr = Math.round((standing.won / standing.played) * 100);
      kpiWREl.textContent = `${wr}%`;
    } else {
      kpiWREl.textContent = "0%";
    }
  }

  // Draw Charts
  drawTrendWinRateChart(standing);
  drawPerkembanganRankingChart(rankVal, rankHistory);

  // Load matches
  renderADMatches(player, standing, matches);

  // Load tournament history
  renderADTournaments(player, tourneys);

  // Load handicap history
  renderADHandicapHistory(player, hcHistory);

  // Load timeline
  renderADTimeline(player);
}

// 2. Chart Rendering using inline SVGs
function drawTrendWinRateChart(standing) {
  const container = document.getElementById("ad-trend-chart-container");
  if (!container) return;

  const wrBase = standing && standing.played > 0 ? Math.round((standing.won / standing.played) * 100) : 60;
  // Generate slightly fluctuating win rate progression ending at the actual win rate
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];
  const rates = [
    Math.max(40, wrBase - 15),
    Math.max(45, wrBase - 10),
    Math.max(50, wrBase - 6),
    Math.max(55, wrBase - 3),
    Math.max(58, wrBase - 1),
    wrBase
  ];

  const points = rates.map((r, idx) => {
    const x = 30 + idx * 75;
    const y = 140 - (r / 100) * 100;
    return { x, y, val: r, m: months[idx] };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${points[points.length-1].x},150 L ${points[0].x},150 Z`;

  let svgHtml = `
    <svg viewBox="0 0 450 180" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="adChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563EB" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0"/>
        </linearGradient>
        <linearGradient id="adChartStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#3B82F6"/>
          <stop offset="100%" stop-color="#60A5FA"/>
        </linearGradient>
      </defs>
      <!-- Grid lines -->
      <line x1="30" y1="40" x2="410" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="30" y1="90" x2="410" y2="90" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="30" y1="140" x2="410" y2="140" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      
      <!-- Area & Line -->
      <path d="${areaD}" fill="url(#adChartFill)" />
      <path d="${pathD}" fill="none" stroke="url(#adChartStroke)" stroke-width="3" class="ad-chart-line-gradient" />
      
      <!-- Data dots & text -->
  `;

  points.forEach((p, idx) => {
    svgHtml += `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#60A5FA" stroke="#060B18" stroke-width="2" />
      <text x="${p.x}" y="${p.y - 10}" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">${p.val}%</text>
      <text x="${p.x}" y="165" fill="var(--text-dim)" font-size="10" font-weight="500" text-anchor="middle">${p.m}</text>
    `;
  });

  svgHtml += `</svg>`;
  container.innerHTML = svgHtml;
}

function drawPerkembanganRankingChart(currentRank, dbRankHistory) {
  const container = document.getElementById("ad-ranking-chart-container");
  if (!container) return;

  const rBase = currentRank || 15;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  let months, ranks;

  if (dbRankHistory && dbRankHistory.length > 0) {
    // Use real database data
    months = dbRankHistory.map(r => {
      const parts = r.date.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      return monthNames[monthIdx] || r.date;
    });
    ranks = dbRankHistory.map(r => r.rank);
  } else {
    // Fallback: simulated ranks from 12 months ago to now
    months = ["Jul", "Sep", "Nov", "Jan", "Mar", "Mei"];
    ranks = [
      Math.min(24, rBase + 12),
      Math.min(20, rBase + 8),
      Math.min(16, rBase + 5),
      Math.min(10, rBase + 3),
      Math.min(7, rBase + 1),
      rBase
    ];
  }

  const numPoints = ranks.length;
  const chartWidth = 410;
  const xPadding = 30;
  const spacing = numPoints > 1 ? (chartWidth - xPadding) / (numPoints - 1) : 0;
  const maxRank = Math.max(...ranks, 24);

  // In ranking, lower y value means higher rank (closer to #1)
  const points = ranks.map((r, idx) => {
    const x = xPadding + idx * spacing;
    // Map rank 1 to y=20 and maxRank to y=140
    const y = 20 + ((r - 1) / (maxRank - 1 || 1)) * 120;
    return { x, y, val: r, m: months[idx] };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${points[points.length-1].x},150 L ${points[0].x},150 Z`;

  let svgHtml = `
    <svg viewBox="0 0 450 180" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="adRankFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.0"/>
        </linearGradient>
        <linearGradient id="adRankStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#C084FC"/>
        </linearGradient>
      </defs>
      <!-- Grid lines -->
      <line x1="30" y1="20" x2="410" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="30" y1="80" x2="410" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="30" y1="140" x2="410" y2="140" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      
      <!-- Area & Line -->
      <path d="${areaD}" fill="url(#adRankFill)" />
      <path d="${pathD}" fill="none" stroke="url(#adRankStroke)" stroke-width="3" class="ad-chart-line-gradient" />
  `;

  points.forEach((p, idx) => {
    svgHtml += `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#C084FC" stroke="#060B18" stroke-width="2" />
      <text x="${p.x}" y="${p.y - 10}" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">#${p.val}</text>
      <text x="${p.x}" y="165" fill="var(--text-dim)" font-size="10" font-weight="500" text-anchor="middle">${p.m}</text>
    `;
  });

  svgHtml += `</svg>`;
  container.innerHTML = svgHtml;
}

// 3. Render list widgets
function renderADMatches(player, standing, dbMatches) {
  const container = document.getElementById("ad-match-list");
  if (!container) return;

  const matches = (dbMatches && dbMatches.length > 0) ? dbMatches : [];

  if (matches.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fa-solid fa-gamepad" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.4;"></i>
        Belum ada catatan pertandingan resmi.
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(m => {
    const isWin = m.outcome === "W";
    const opponentAvatar = m.opponent_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.opponent_name)}`;
    return `
      <div class="ad-match-item">
        <div class="ad-match-left">
          <span class="ad-match-date">${m.date}</span>
          <img class="ad-match-opp-avatar" src="${opponentAvatar}" alt="Avatar" onerror="this.src='images/player-avatar.png';">
          <div class="ad-match-opp-meta">
            <span class="ad-match-opp-name">${m.opponent_name}</span>
            <span class="ad-match-opp-club">${m.opponent_club}</span>
          </div>
        </div>
        <div class="ad-match-right">
          <span class="ad-match-outcome ${isWin ? "win" : "lose"}">${m.outcome}</span>
          <span class="ad-match-score">${m.score}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderADTournaments(player, dbTourneys) {
  const container = document.getElementById("ad-tourney-list");
  if (!container) return;

  const tourneys = (dbTourneys && dbTourneys.length > 0) ? dbTourneys : [];

  if (tourneys.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fa-solid fa-trophy" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.4;"></i>
        Belum ada riwayat keikutsertaan turnamen.
      </div>
    `;
    return;
  }

  container.innerHTML = tourneys.map(t => `
    <div class="ad-tourney-item">
      <div class="ad-tourney-left">
        <span class="ad-tourney-icon">${t.icon || "🏆"}</span>
        <div class="ad-tourney-meta">
          <span class="ad-tourney-name">${t.title}</span>
          <span class="ad-tourney-date-club">${t.date} &bull; ${t.venue}</span>
        </div>
      </div>
      <span class="ad-tourney-badge ${t.class_name || "top16"}">${t.badge}</span>
    </div>
  `).join("");
}

function renderADHandicapHistory(player, dbHistory) {
  const container = document.getElementById("ad-hc-history-body");
  if (!container) return;

  let steps = [];

  if (dbHistory && dbHistory.length > 0) {
    // Use real database data — map DB columns to UI fields
    steps = dbHistory.map(h => ({
      date: h.date,
      from: h.from_hc,
      to: h.to_hc,
      reason: h.reason,
      admin: h.admin_name
    }));
  } else {
    // Empty state
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-dim); font-size: 0.85rem;">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 1.5rem; margin-bottom: 6px; display: block; opacity: 0.4;"></i>
          Belum ada riwayat perubahan handicap.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = steps.map(s => `
    <tr>
      <td>${s.date}</td>
      <td class="text-center">
        <div class="ad-table-level-change">
          <span class="ad-level-pill">${s.from}</span>
        </div>
      </td>
      <td class="text-center">
        <div class="ad-table-level-change">
          <span class="ad-level-pill level-up">${s.to}</span>
        </div>
      </td>
      <td>${s.reason}</td>
      <td class="ad-table-admin">${s.admin}</td>
    </tr>
  `).join("");
}

function renderADTimeline(player) {
  const container = document.getElementById("ad-timeline-container");
  if (!container) return;

  const logs = [
    { time: "18 Mei 2025 &bull; 10:30 WIB", title: `Handicap dinaikkan ke HC ${player.handicap}`, desc: "Pembaruan otomatis oleh Admin POBSI setelah Series #4", cls: "blue" },
    { time: "10 Mei 2025 &bull; 18:45 WIB", title: "Menjuarai BOC Series #4", desc: "Berhasil mengalahkan lawan di babak final dengan skor 7-4", cls: "gold" },
    { time: "20 Apr 2025 &bull; 17:20 WIB", title: "Mencapai Semi Final", desc: "Handicap Challenge Cup di Star Billiard", cls: "purple" },
    { time: "12 Jan 2025 &bull; 09:15 WIB", title: "Atlet didaftarkan dalam sistem", desc: "Berkas dan profil terverifikasi oleh Admin Utama", cls: "green" }
  ];

  container.innerHTML = logs.map(l => `
    <div class="ad-timeline-item">
      <div class="ad-timeline-dot ${l.cls}"></div>
      <div class="ad-timeline-content">
        <span class="ad-timeline-title">${l.title}</span>
        <span class="ad-timeline-desc">${l.desc}</span>
        <span class="ad-timeline-time">${l.time}</span>
      </div>
    </div>
  `).join("");
}

// Helper to update custom edit upload zones with Base64 previews
function updateEditUploadZone(areaId, base64Value, type) {
  const area = document.getElementById(areaId);
  if (!area) return;

  if (!base64Value) {
    if (type === "avatar") {
      area.innerHTML = `
        <i class="fa-solid fa-image" style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 4px;"></i>
        <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">Upload Avatar (PNG/JPG)</p>
      `;
    } else if (type === "cover") {
      area.innerHTML = `
        <i class="fa-solid fa-panorama" style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 4px;"></i>
        <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">Upload Cover (Billiard scene)</p>
      `;
    } else {
      area.innerHTML = `
        <i class="fa-solid fa-address-card" style="font-size: 1.5rem; color: #fbbf24; margin-bottom: 4px;"></i>
        <strong style="font-size: 0.78rem; color: #fbbf24; margin: 0; display: block;">Pilih Berkas KTP atau Seret ke Sini</strong>
        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">PNG, JPG, atau PDF (Maks. 5MB)</p>
      `;
    }
  } else {
    if (type === "avatar") {
      area.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="${base64Value}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(59, 130, 246, 0.5);">
          <span style="font-size: 0.72rem; color: #60a5fa; font-weight: 700;">Foto Profil Siap di-upload</span>
        </div>
      `;
    } else if (type === "cover") {
      area.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="${base64Value}" style="width: 60px; height: 28px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(59, 130, 246, 0.4);">
          <span style="font-size: 0.72rem; color: #60a5fa; font-weight: 700;">Foto Cover Siap di-upload</span>
        </div>
      `;
    } else {
      if (base64Value.startsWith("data:application/pdf") || base64Value.toLowerCase().includes(".pdf")) {
        area.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <i class="fa-solid fa-file-pdf" style="font-size: 1.4rem; color: #ef4444; filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.2));"></i>
            <span style="font-size: 0.72rem; color: #fbbf24; font-weight: 700;">Dokumen KTP (PDF) Siap di-upload</span>
          </div>
        `;
      } else {
        area.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="${base64Value}" style="width: 50px; height: 28px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(251, 191, 36, 0.4);">
            <span style="font-size: 0.72rem; color: #fbbf24; font-weight: 700;">Gambar KTP Siap di-upload</span>
          </div>
        `;
      }
    }
  }
}

// 4. Hook up actions and drawer
function setupAthleteDetailActions() {
  const btnBack = document.getElementById("ad-btn-back");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      // Revert SPA path and switch back
      window.history.pushState({}, "", "/admin");
      switchAdminPane("pane-players");
    });
  }

  // Edit variables
  let editAvatarBase64 = "";
  let editCoverBase64 = "";
  let editKtpBase64 = "";

  // Edit actions
  const editDrawer = document.getElementById("ad-edit-drawer");
  const editForm = document.getElementById("form-admin-edit-player");
  const editClose = document.getElementById("ad-drawer-close");

  function openEditDrawer() {
    const player = appData.players.find(p => p.id === adActivePlayerId);
    if (!player) return;

    document.getElementById("edit-player-id").value = player.id;
    document.getElementById("edit-player-name").value = player.name;
    document.getElementById("edit-player-club").value = player.club;
    document.getElementById("edit-player-hc").value = player.handicap;
    document.getElementById("edit-player-points").value = player.points || 0;
    document.getElementById("edit-player-gender").value = player.gender || "Laki-laki";
    document.getElementById("edit-player-age").value = player.age || 24;
    document.getElementById("edit-player-phone").value = player.phone || "";
    document.getElementById("edit-player-address").value = player.address || "";
    document.getElementById("edit-player-status").value = player.status || "Aktif";

    // Set base64 values
    editAvatarBase64 = player.avatar || "";
    editCoverBase64 = player.cover || "";
    editKtpBase64 = player.ktp || "";

    // Set previews in modal
    updateEditUploadZone("edit-avatar-preview-area", editAvatarBase64, "avatar");
    updateEditUploadZone("edit-cover-preview-area", editCoverBase64, "cover");
    updateEditUploadZone("edit-ktp-preview-area", editKtpBase64, "ktp");

    editDrawer.style.display = "flex";
  }

  // Attach to edit triggers
  const btnEditTop = document.getElementById("ad-btn-edit-top");
  const btnEditFooter = document.getElementById("ad-fbtn-edit");
  if (btnEditTop) btnEditTop.addEventListener("click", openEditDrawer);
  if (btnEditFooter) btnEditFooter.addEventListener("click", openEditDrawer);

  if (editClose) {
    editClose.addEventListener("click", () => {
      editDrawer.style.display = "none";
    });
  }

  if (editDrawer) {
    editDrawer.addEventListener("click", (e) => {
      if (e.target === editDrawer) editDrawer.style.display = "none";
    });
  }

  // Change listeners for file inputs in edit form
  const editAvatarFile = document.getElementById("edit-player-avatar-file");
  const editCoverFile = document.getElementById("edit-player-cover-file");
  const editKtpFile = document.getElementById("edit-player-ktp-file");

  if (editAvatarFile) {
    editAvatarFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("Ukuran gambar avatar terlalu besar! Maksimal batas ukuran berkas adalah 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          editAvatarBase64 = ev.target.result;
          updateEditUploadZone("edit-avatar-preview-area", editAvatarBase64, "avatar");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (editCoverFile) {
    editCoverFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("Ukuran gambar cover terlalu besar! Maksimal batas ukuran berkas adalah 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          editCoverBase64 = ev.target.result;
          updateEditUploadZone("edit-cover-preview-area", editCoverBase64, "cover");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (editKtpFile) {
    editKtpFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert("Ukuran berkas KTP terlalu besar! Maksimal batas ukuran berkas adalah 5MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          editKtpBase64 = ev.target.result;
          updateEditUploadZone("edit-ktp-preview-area", editKtpBase64, "ktp");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Edit form submit handler
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-player-id").value;
      const name = document.getElementById("edit-player-name").value.trim();
      const club = document.getElementById("edit-player-club").value.trim();
      const handicap = document.getElementById("edit-player-hc").value.trim();
      const points = parseFloat(document.getElementById("edit-player-points").value || 0);
      const gender = document.getElementById("edit-player-gender").value;
      const age = parseInt(document.getElementById("edit-player-age").value || 24, 10);
      const phone = document.getElementById("edit-player-phone").value.trim();
      const address = document.getElementById("edit-player-address").value.trim();
      const status = document.getElementById("edit-player-status").value;

      if (isServerOnline) {
        try {
          const res = await fetch(`/api/players/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, club, handicap, points, gender, age, phone, address, status, avatar: editAvatarBase64, cover: editCoverBase64, ktp: editKtpBase64 })
          });

          if (res.ok) {
            alert(`Berhasil memperbarui data atlet "${name}"!`);
            editDrawer.style.display = "none";
            
            // Reload all
            await loadDataFromApi();
            updateWorkspaceStats();
            renderWorkspacePreviews();
            renderAthleteDetail(id);
          } else {
            const errJson = await res.json();
            alert(`Gagal: ${errJson.error || 'Server error'}`);
          }
        } catch (err) {
          alert(`Error koneksi server: ${err.message}`);
        }
      } else {
        // Offline
        const idx = appData.players.findIndex(p => p.id === id);
        if (idx !== -1) {
          appData.players[idx] = { ...appData.players[idx], name, club, handicap, points, gender, age, phone, address, status, avatar: editAvatarBase64, cover: editCoverBase64, ktp: editKtpBase64 };
          
          // Also update standings if names match
          const std = appData.standings.find(s => s.name === appData.players[idx].name);
          if (std) {
            std.club = club;
            std.handicap = handicap;
          }

          alert(`Mode Luring: Data "${name}" diperbarui sementara di memori browser!`);
          editDrawer.style.display = "none";

          updateWorkspaceStats();
          renderWorkspacePreviews();
          renderAthleteDetail(id);
        }
      }
    });
  }

  // Update handicap action (Overhauled to highly premium audit trail popup modal)
  const btnHCTop = document.getElementById("ad-btn-hc-top");
  const btnHCFooter = document.getElementById("ad-fbtn-hc");
  async function triggerHCUpdate() {
    const player = appData.players.find(p => p.id === adActivePlayerId);
    if (!player) return;

    const modal = document.getElementById("ad-hc-modal");
    const nameSpan = document.getElementById("hc-modal-player-name");
    const clubSpan = document.getElementById("hc-modal-player-club");
    const currentBadge = document.getElementById("hc-preview-current-badge");
    const newBadge = document.getElementById("hc-preview-new-badge");
    const idInput = document.getElementById("hc-modal-player-id");
    const selectNew = document.getElementById("hc-modal-select-new");
    const selectSource = document.getElementById("hc-modal-select-source");
    const reasonText = document.getElementById("hc-modal-reason");
    const historyList = document.getElementById("hc-modal-history-list");

    if (!modal) return;

    // Reset values
    idInput.value = player.id;
    nameSpan.textContent = player.name;
    clubSpan.textContent = player.club || "Independen";
    currentBadge.textContent = player.handicap || "4B";
    newBadge.textContent = player.handicap || "4B";
    reasonText.value = "";
    selectSource.value = "Tournament Result";
    selectNew.value = player.handicap || "4B";

    selectNew.onchange = function() {
      newBadge.textContent = selectNew.value;
    };

    // Render Recent Changes History snapshot in the modal — fetch from DB
    let steps = [];
    try {
      const hcRes = await fetch(`/api/handicap-history?playerId=${player.id}`);
      if (hcRes.ok) {
        const hcData = await hcRes.json();
        steps = hcData.map(h => ({
          date: h.date,
          from: h.from_hc,
          to: h.to_hc,
          reason: h.reason
        })).slice(0, 5);
      }
    } catch(e) {
      console.warn('Gagal memuat riwayat HC untuk modal:', e);
    }

    if (steps.length > 0) {
      historyList.innerHTML = steps.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px 12px; font-size: 0.78rem;">
          <span style="color: var(--text-muted); font-weight: 500; font-size: 0.72rem;">${s.date}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; font-weight: 700; color: var(--text-dim);">${s.from}</span>
            <i class="fa-solid fa-right-long text-purple" style="font-size: 0.7rem;"></i>
            <span style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1px 6px; border-radius: 4px; font-weight: 700; color: #34d399;">${s.to}</span>
          </div>
          <span style="color: var(--text-dim); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.72rem;" title="${s.reason}">${s.reason}</span>
        </div>
      `).join("");
    } else {
      historyList.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 10px;">No previous changes recorded.</div>`;
    }

    modal.style.display = "flex";
  }

  if (btnHCTop) btnHCTop.addEventListener("click", triggerHCUpdate);
  if (btnHCFooter) btnHCFooter.addEventListener("click", triggerHCUpdate);

  // Bind premium handicap modal controls & events
  const hcModal = document.getElementById("ad-hc-modal");
  const hcClose = document.getElementById("hc-modal-close");
  const hcCancel = document.getElementById("hc-modal-btn-cancel");
  if (hcClose) {
    hcClose.addEventListener("click", () => {
      if (hcModal) hcModal.style.display = "none";
    });
  }
  if (hcCancel) {
    hcCancel.addEventListener("click", () => {
      if (hcModal) hcModal.style.display = "none";
    });
  }
  if (hcModal) {
    hcModal.addEventListener("click", (e) => {
      if (e.target === hcModal) {
        hcModal.style.display = "none";
      }
    });
  }

  const formUpdateHC = document.getElementById("form-admin-update-hc");
  if (formUpdateHC) {
    formUpdateHC.addEventListener("submit", (e) => {
      e.preventDefault();

      const playerId = document.getElementById("hc-modal-player-id").value;
      const newHC = document.getElementById("hc-modal-select-new").value;
      const source = document.getElementById("hc-modal-select-source").value;
      const reason = document.getElementById("hc-modal-reason").value;

      const player = appData.players.find(p => p.id === playerId);
      if (!player) return;

      const oldHC = player.handicap || "4B";

      if (newHC === oldHC) {
        alert("Handicap baru sama dengan handicap saat ini!");
        return;
      }

      // Handicap hierarchy according to official POBSI rules
      const hcOrder = ["3B", "3N", "3A", "4B", "4A", "5B", "5A", "6", "7"];
      const oldIndex = hcOrder.indexOf(oldHC);
      const newIndex = hcOrder.indexOf(newHC);
      
      const fullReason = reason ? `${source} — ${reason}` : source;
      const payload = { handicap: newHC, hcChangeReason: fullReason, hcChangeAdmin: "Super Admin POBSI" };
      let pointsReset = false;
      
      if (newIndex > oldIndex && oldIndex !== -1 && newIndex !== -1) {
        payload.points = 0.0;
        pointsReset = true;
      }

      if (isServerOnline) {
        fetch(`/api/players/${playerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(res => {
          if (res.ok) {
            if (pointsReset) {
              alert(`Handicap berhasil diperbarui menjadi HC ${newHC}! Poin handicap otomatis di-reset ke 0 karena atlet naik tingkat.`);
            } else {
              alert(`Handicap berhasil diperbarui menjadi HC ${newHC}!`);
            }
            if (hcModal) hcModal.style.display = "none";
            loadDataFromApi().then(() => {
              renderAthleteDetail(playerId);
              renderWorkspacePreviews();
            });
          }
        }).catch(err => alert(`Error: ${err.message}`));
      } else {
        player.handicap = newHC;
        if (pointsReset) {
          player.points = 0.0;
        }
        
        // Also update standings if names match and points are reset
        const std = appData.standings.find(s => s.name === player.name);
        if (std) {
          std.handicap = newHC;
        }

        const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        window.sessionHandicapLogs = window.sessionHandicapLogs || {};
        if (!window.sessionHandicapLogs[playerId]) {
          window.sessionHandicapLogs[playerId] = [];
        }
        window.sessionHandicapLogs[playerId].unshift({
          date: currentDate,
          from: oldHC,
          to: newHC,
          reason: `${source} — ${reason}`,
          admin: "Super Admin POBSI"
        });

        if (pointsReset) {
          alert(`Luring: Handicap diperbarui menjadi HC ${newHC} & Poin di-reset ke 0 (Naik Tingkat).`);
        } else {
          alert(`Luring: Handicap diperbarui menjadi HC ${newHC}`);
        }
        if (hcModal) hcModal.style.display = "none";
        renderAthleteDetail(playerId);
        renderWorkspacePreviews();
      }
    });
  }

  // Transfer club action
  const btnTransfer = document.getElementById("ad-fbtn-transfer");
  if (btnTransfer) {
    btnTransfer.addEventListener("click", () => {
      const newClub = prompt("Masukkan Nama Klub Baru untuk Atlet:", "Golden Banjarnegara");
      if (newClub) {
        if (isServerOnline) {
          fetch(`/api/players/${adActivePlayerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ club: newClub })
          }).then(res => {
            if (res.ok) {
              alert(`Klub berhasil diperbarui menjadi "${newClub}"!`);
              loadDataFromApi().then(() => {
                renderAthleteDetail(adActivePlayerId);
                renderWorkspacePreviews();
              });
            }
          }).catch(err => alert(`Error: ${err.message}`));
        } else {
          const player = appData.players.find(p => p.id === adActivePlayerId);
          if (player) {
            player.club = newClub;
            alert(`Luring: Klub diperbarui menjadi "${newClub}"`);
            renderAthleteDetail(adActivePlayerId);
            renderWorkspacePreviews();
          }
        }
      }
    });
  }

  // Toggle active status action
  const btnStatus = document.getElementById("ad-fbtn-status");
  if (btnStatus) {
    btnStatus.addEventListener("click", () => {
      const player = appData.players.find(p => p.id === adActivePlayerId);
      if (!player) return;
      const newStatus = (player.status || "Aktif") === "Aktif" ? "Nonaktif" : "Aktif";
      
      if (confirm(`Yakin ingin mengubah status atlet menjadi ${newStatus}?`)) {
        if (isServerOnline) {
          fetch(`/api/players/${adActivePlayerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          }).then(res => {
            if (res.ok) {
              alert(`Status atlet berhasil diubah menjadi ${newStatus}!`);
              loadDataFromApi().then(() => {
                renderAthleteDetail(adActivePlayerId);
                renderWorkspacePreviews();
              });
            }
          }).catch(err => alert(`Error: ${err.message}`));
        } else {
          player.status = newStatus;
          alert(`Luring: Status diubah menjadi ${newStatus}`);
          renderAthleteDetail(adActivePlayerId);
          renderWorkspacePreviews();
        }
      }
    });
  }

  // Delete action
  const btnDelete = document.getElementById("ad-fbtn-delete");
  if (btnDelete) {
    btnDelete.addEventListener("click", async () => {
      const player = appData.players.find(p => p.id === adActivePlayerId);
      if (!player) return;

      if (confirm(`PERINGATAN: Yakin ingin menghapus atlet "${player.name}" secara permanen dari database?`)) {
        if (isServerOnline) {
          try {
            const res = await fetch(`/api/players/${adActivePlayerId}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              alert(`Atlet "${player.name}" berhasil dihapus.`);
              await loadDataFromApi();
              updateWorkspaceStats();
              renderWorkspacePreviews();
              window.history.pushState({}, "", "/admin");
              switchAdminPane("pane-players");
            } else {
              const err = await res.json();
              alert(`Gagal menghapus: ${err.error}`);
            }
          } catch (err) {
            alert(`Error: ${err.message}`);
          }
        } else {
          appData.players = appData.players.filter(p => p.id !== adActivePlayerId);
          alert(`Luring: Atlet "${player.name}" dihapus dari memori browser.`);
          updateWorkspaceStats();
          renderWorkspacePreviews();
          window.history.pushState({}, "", "/admin");
          switchAdminPane("pane-players");
        }
      }
    });
  }
}

// ============================================================================
// DEDICATED CLUB DETAIL PROFILE (AD_CLUB) — JS Logic
// ============================================================================
let adActiveClubId = null;

function renderClubDetail(clubId) {
  const club = appData.clubs.find(c => c.id.toString() === clubId.toString());
  if (!club) {
    alert("Klub tidak ditemukan!");
    switchAdminPane("pane-clubs");
    return;
  }

  adActiveClubId = clubId;

  // 1. Cover backdrop
  const coverEl = document.getElementById("ad-club-detail-cover");
  if (coverEl) {
    coverEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('images/club-cover.png')`;
  }

  // 1b. Avatar fallback emblem
  const avatarEl = document.getElementById("ad-club-detail-avatar");
  if (avatarEl) {
    avatarEl.src = "images/club-avatar.png";
  }

  // 2. Large profile header meta
  const nameElLarge = document.getElementById("ad-club-detail-name-large");
  if (nameElLarge) nameElLarge.innerHTML = `${club.name} <i class="fa-solid fa-circle-check text-blue" title="Verified Club"></i>`;

  const idElLarge = document.getElementById("ad-club-detail-id-large");
  if (idElLarge) idElLarge.textContent = `ID: CLB-${club.id.toString().padStart(3, '0')}`;

  const ownerSub = document.getElementById("ad-club-detail-owner-sub");
  if (ownerSub) ownerSub.querySelector("span").textContent = club.owner || "-";

  // Roster players calculation
  const playersInClub = appData.players ? appData.players.filter(p => p.club.toLowerCase() === club.name.toLowerCase()) : [];

  const statusTag = document.getElementById("ad-club-tag-status");
  if (statusTag) {
    const isAktif = (club.status || "Aktif") === "Aktif";
    statusTag.textContent = `Klub ${club.status || "Aktif"}`;
    statusTag.className = `ad-tag ${isAktif ? "green" : "red"}`;
  }

  const tablesTag = document.getElementById("ad-club-tag-tables");
  if (tablesTag) tablesTag.textContent = `${club.tables || 0} Meja`;

  const athletesTag = document.getElementById("ad-club-tag-athletes");
  if (athletesTag) athletesTag.textContent = `${playersInClub.length} Atlet`;

  // 3. Symmetrical Info Grid
  document.getElementById("ad-club-val-name").textContent = club.name;
  document.getElementById("ad-club-val-address").textContent = club.address;
  document.getElementById("ad-club-val-owner").textContent = club.owner || "-";
  document.getElementById("ad-club-val-phone").textContent = club.phone || "-";
  document.getElementById("ad-club-val-tables").textContent = `${club.tables || 0} Meja Biliar`;
  document.getElementById("ad-club-val-status").textContent = club.status || "Aktif";

  // 4. 4 KPI Grid values
  document.getElementById("ad-club-kpi-athletes").textContent = playersInClub.length;
  document.getElementById("ad-club-kpi-tables").textContent = club.tables || 0;

  // sum standings points of all affiliated roster players
  let totalSirkuitPoints = 0;
  playersInClub.forEach(p => {
    const standing = appData.standings.find(s => s.name.toLowerCase() === p.name.toLowerCase());
    if (standing) {
      totalSirkuitPoints += (standing.points || 0);
    }
  });
  document.getElementById("ad-club-kpi-points").textContent = `${totalSirkuitPoints} Pts`;

  // weighted average handicap
  const avgHcEl = document.getElementById("ad-club-kpi-avg-hc");
  if (avgHcEl) {
    if (playersInClub.length > 0) {
      const hcWeights = {
        '3B': 3.0, '3N': 3.3, '3A': 3.7,
        '4B': 4.0, '4A': 4.5,
        '5B': 5.0, '5A': 5.5,
        '6': 6.0, '7': 7.0
      };
      let sumWeights = 0;
      let count = 0;
      playersInClub.forEach(p => {
        const hcStr = p.handicap ? p.handicap.toString().toUpperCase() : '';
        if (hcWeights[hcStr]) {
          sumWeights += hcWeights[hcStr];
          count++;
        }
      });
      const avgWeight = count > 0 ? sumWeights / count : 4.0;
      let bestLabel = 'HC 4B';
      let minDiff = Infinity;
      Object.entries(hcWeights).forEach(([lbl, wt]) => {
        const diff = Math.abs(wt - avgWeight);
        if (diff < minDiff) {
          minDiff = diff;
          bestLabel = `HC ${lbl}`;
        }
      });
      avgHcEl.textContent = `${bestLabel} (${avgWeight.toFixed(1)})`;
    } else {
      avgHcEl.textContent = '-';
    }
  }

  // 5. Populate Roster Table
  const tbody = document.getElementById("ad-club-roster-tbody");
  if (tbody) {
    if (playersInClub.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 30px; color: var(--text-muted);"><i class="fa-solid fa-users-slash" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i> Belum ada atlet terafiliasi</td></tr>`;
    } else {
      tbody.innerHTML = playersInClub.map(p => {
        const standing = appData.standings.find(s => s.name.toLowerCase() === p.name.toLowerCase());
        const rank = standing ? `#${standing.rank}` : "-";
        const points = standing ? `${standing.points} Pts` : "0 Pts";
        const avatar = p.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.name)}`;
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${avatar}" alt="${p.name}" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid rgba(59, 130, 246, 0.2);" onerror="this.src='images/player-avatar.png';">
                <div style="display: flex; flex-direction: column;">
                  <span style="font-weight: 700; color: #fff; font-size: 0.88rem;">${p.name}</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">ID: ${p.id}</span>
                </div>
              </div>
            </td>
            <td class="text-center">
              <span class="ad-level-pill" style="font-size: 0.72rem; padding: 2px 6px;">HC ${p.handicap}</span>
            </td>
            <td class="text-center" style="font-family: var(--font-headers); font-weight: 600;">${rank}</td>
            <td class="text-center text-gold" style="font-weight: 700;">${points}</td>
            <td class="text-center">
              <button class="pm-btn pm-btn-ghost pm-btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.history.pushState({}, '', '/admin/athletes/${p.id}'); checkAdminRoute();">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Profil
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // 6. Populate Handicap Distribution Matrix
  const dist = { 'HC 3': 0, 'HC 4': 0, 'HC 5': 0, 'HC 6': 0, 'HC 7': 0 };
  playersInClub.forEach(p => {
    const hc = p.handicap ? p.handicap.toString().toUpperCase() : '';
    if (hc.startsWith('3')) dist['HC 3']++;
    else if (hc.startsWith('4')) dist['HC 4']++;
    else if (hc.startsWith('5')) dist['HC 5']++;
    else if (hc === '6') dist['HC 6']++;
    else if (hc === '7') dist['HC 7']++;
  });

  const distContainer = document.getElementById("ad-club-hc-dist-container");
  if (distContainer) {
    const total = playersInClub.length;
    distContainer.innerHTML = Object.entries(dist).map(([bracket, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      let colorClass = "blue";
      if (bracket === 'HC 4') colorClass = "green";
      if (bracket === 'HC 5') colorClass = "amber";
      if (bracket === 'HC 6') colorClass = "purple";
      if (bracket === 'HC 7') colorClass = "red";
      return `
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-dim); margin-bottom: 4px;">
            <span style="font-weight: 600; color: #fff;">${bracket}</span>
            <span style="font-weight: 700; color: var(--text-main);">${count} Atlet (${pct}%)</span>
          </div>
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: var(--${colorClass}); border-radius: 3px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

function setupClubDetailActions() {
  const btnBack = document.getElementById("ad-club-btn-back");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.history.pushState({}, "", "/admin");
      switchAdminPane("pane-clubs");
    });
  }

  const triggerEdit = () => {
    if (!adActiveClubId) return;
    const club = appData.clubs.find(c => c.id.toString() === adActiveClubId.toString());
    if (!club) return;

    document.getElementById('edit-club-id').value = club.id;
    document.getElementById('edit-club-name').value = club.name;
    document.getElementById('edit-club-address').value = club.address;
    document.getElementById('edit-club-owner').value = club.owner || '';
    document.getElementById('edit-club-phone').value = club.phone || '';
    document.getElementById('edit-club-tables').value = club.tables || 0;
    document.getElementById('edit-club-status').value = club.status || 'Aktif';

    const editModal = document.getElementById('pm-edit-club-modal');
    if (editModal) editModal.style.display = 'flex';
  };

  const btnEdit = document.getElementById("ad-club-btn-edit");
  const fbtnEdit = document.getElementById("ad-club-fbtn-edit");
  if (btnEdit) btnEdit.addEventListener("click", triggerEdit);
  if (fbtnEdit) fbtnEdit.addEventListener("click", triggerEdit);

  const triggerDelete = () => {
    if (!adActiveClubId) return;
    const club = appData.clubs.find(c => c.id.toString() === adActiveClubId.toString());
    if (!club) return;
    
    if (confirm(`Yakin ingin menghapus klub "${club.name}" secara permanen dari database resmi POBSI?`)) {
      deleteClub(adActiveClubId).then(() => {
        window.history.pushState({}, "", "/admin");
        switchAdminPane("pane-clubs");
      });
    }
  };

  const btnDelete = document.getElementById("ad-club-btn-delete");
  const fbtnDelete = document.getElementById("ad-club-fbtn-delete");
  if (btnDelete) btnDelete.addEventListener("click", triggerDelete);
  if (fbtnDelete) fbtnDelete.addEventListener("click", triggerDelete);
}


// ==========================================================================
// H. BATTLE OF CHAMPIONS ADMIN CONSOLE ENGINE
// ==========================================================================
let bocAdminCurrentPage = 1;
let bocAdminItemsPerPage = 20;
let bocAdminSearchQuery = "";

// renderAdminBocConsole
window.renderAdminBocConsole = function() {
  const tableBody = document.getElementById("boc-admin-table-body");
  if (!tableBody) return;

  // Hide playoff and restore standings if playoff event is missing/removed
  const playoffEventCheck = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(currentBocYear) || e.description?.includes(currentBocYear)));
  const bocPlayoffContainer = document.getElementById("boc-playoff-container");
  const bocStandingsContainer = document.getElementById("boc-standings-container");
  if (!playoffEventCheck) {
    if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
    if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
  }

  // Dynamic Year Injection
  const titleHeader = document.getElementById("boc-title-year-header");
  if (titleHeader) titleHeader.textContent = `Battle of Champions ${currentBocYear}`;
  const metricYearCompleted = document.getElementById("boc-metric-year-completed");
  if (metricYearCompleted) metricYearCompleted.textContent = currentBocYear;

  // Dynamic "Kelola Playoff" / "Mulai BOC" / "Jadwalkan BOC" Button & Banner styling
  const startPlayoffBtn = document.getElementById("btn-boc-start-playoff");
  const adminScheduleStatus = document.getElementById("boc-admin-schedule-status");
  const adminScheduleText = document.getElementById("boc-admin-schedule-text");
  
  if (startPlayoffBtn) {
    const playoffEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status !== 'Cancelled' && (e.title.includes(currentBocYear) || e.description?.includes(currentBocYear)));
    const savedSchedule = bocSettings.playoff_schedule;
    
    if (playoffEvent) {
      // State A: Active Playoff
      startPlayoffBtn.innerHTML = `<i class="fa-solid fa-gears"></i> Kelola Playoff`;
      startPlayoffBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      startPlayoffBtn.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.4)";
      if (adminScheduleStatus) adminScheduleStatus.style.display = "none";
    } else if (savedSchedule) {
      // State B: Scheduled but not started
      startPlayoffBtn.innerHTML = `<i class="fa-solid fa-play"></i> Mulai BOC`;
      startPlayoffBtn.style.background = "var(--gradient-primary)";
      startPlayoffBtn.style.boxShadow = "var(--shadow-neon)";
      
      if (adminScheduleStatus) {
        adminScheduleStatus.style.display = "flex";
        const schedule = typeof savedSchedule === 'string' ? JSON.parse(savedSchedule) : savedSchedule;
        if (adminScheduleText) {
          adminScheduleText.innerHTML = `Grand Final BOC Terjadwal: <strong>${formatIndonesianDate(schedule.date)} pukul ${schedule.time} WIB</strong> di <strong>${schedule.venue}</strong>. ${schedule.notes ? `<span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">(${schedule.notes})</span>` : ''}`;
        }
      }
    } else {
      // State C: Not Scheduled
      startPlayoffBtn.innerHTML = `<i class="fa-solid fa-calendar-plus"></i> Jadwalkan BOC`;
      startPlayoffBtn.style.background = "var(--gradient-primary)";
      startPlayoffBtn.style.boxShadow = "var(--shadow-neon)";
      if (adminScheduleStatus) adminScheduleStatus.style.display = "none";
    }
  }

  // Render Table Headers Dynamically
  const table = document.getElementById("boc-admin-table");
  if (table) {
    const minTableWidth = 550 + (bocSirkuits.length * 80);
    table.style.minWidth = `${minTableWidth}px`;
  }

  const thead = document.querySelector("#boc-admin-table thead");
  if (thead) {
    const sirkuitHeaders = bocSirkuits.map((sirkuit, idx) => {
      let color = "#60a5fa";
      if (idx >= 4 && idx < 8) color = "#fbbf24";
      else if (idx >= 8) color = "#ef4444";
      return `<th class="text-center" style="padding: 14px 4px; font-size: 0.68rem; font-weight: 800; color: ${color}; width: 80px; white-space: nowrap;">${sirkuit}</th>`;
    }).join("");
    
    thead.innerHTML = `
      <tr style="background: rgba(15, 23, 42, 0.7); border-bottom: 2px solid rgba(255, 255, 255, 0.06);">
        <th class="text-center sticky-col" style="padding: 14px 4px; width: 45px; font-weight: 800; left: 0;">NO</th>
        <th class="sticky-col" style="padding: 14px 10px; width: 160px; font-weight: 800; text-align: left; left: 45px;">NAMA</th>
        <th class="text-center sticky-col" style="padding: 14px 4px; width: 65px; font-weight: 800; left: 205px;">HC</th>
        ${sirkuitHeaders}
        <!-- Spacer Column to absorb extra width on wide screens -->
        <th style="width: auto; padding: 0; background: #0d1527 !important; border-bottom: 2px solid rgba(255, 255, 255, 0.06);"></th>
        <th class="text-center text-gold sticky-col" style="padding: 14px 6px; font-weight: 900; width: 85px; background: rgba(251, 191, 36, 0.05); right: 200px;">TOTAL</th>
        <th class="sticky-col" style="padding: 14px 10px; width: 120px; text-align: left; right: 80px;">KETERANGAN</th>
        <th class="text-center sticky-col" style="padding: 14px 6px; width: 80px; right: 0;">AKSI</th>
      </tr>
    `;
  }

  const standings = appData.standings || [];
  const cutoffLimit = bocSettings.cutoff_limit || 16;
  
  // Calculate Stats
  const totalPoints = standings.reduce((sum, p) => sum + (p.points || 0), 0);
  const cutoffPoints = standings.length >= cutoffLimit ? standings[cutoffLimit - 1].points : 0;
  
  // Count tied borderline contenders
  let tiedCount = 0;
  if (standings.length >= cutoffLimit) {
    const targetPoints = standings[cutoffLimit - 1].points;
    tiedCount = standings.filter(p => p.points === targetPoints).length;
  }
  
  // Update Metrics UI
  const totalPointsEl = document.getElementById("boc-metrics-total-points");
  const cutoffPointsEl = document.getElementById("boc-metrics-cutoff-points");
  const tiedCountEl = document.getElementById("boc-metrics-tied-count");
  if (totalPointsEl) totalPointsEl.textContent = totalPoints;
  if (cutoffPointsEl) cutoffPointsEl.textContent = `${cutoffPoints} Pts`;
  if (tiedCountEl) tiedCountEl.textContent = tiedCount > 1 ? tiedCount : 0;

  // Render Playoff Advisor Widget
  const advisorWidget = document.getElementById("boc-advisor-widget");
  if (advisorWidget) {
    if (tiedCount > 1) {
      if (tiedCount > 4) {
        advisorWidget.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.18); border-radius: var(--radius-md); padding: 14px 20px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.03);">
            <i class="fa-solid fa-circle-exclamation text-red" style="font-size: 1.25rem; margin-top: 1px;"></i>
            <div>
              <h4 style="font-family: var(--font-headers); font-size: 0.9rem; font-weight: 800; color: #fca5a5; margin-bottom: 2px;">⚠️ Terdeteksi Sengketa Kelayakan Playoff (${tiedCount} Atlet)</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">Terdeteksi <strong>${tiedCount} atlet</strong> memiliki akumulasi poin sama (${cutoffPoints} Pts) pada batas kelayakan kualifikasi (Peringkat ${cutoffLimit}). Sesuai regulasi POBSI Banjarnegara, sengketa diselesaikan melalui babak playoff kualifikasi dengan format <strong>Sistem Gugur (Single Elimination)</strong>.</p>
            </div>
          </div>
        `;
      } else {
        advisorWidget.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.18); border-radius: var(--radius-md); padding: 14px 20px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.03);">
            <i class="fa-solid fa-triangle-exclamation text-gold" style="font-size: 1.25rem; margin-top: 1px;"></i>
            <div>
              <h4 style="font-family: var(--font-headers); font-size: 0.9rem; font-weight: 800; color: #fde047; margin-bottom: 2px;">⚠️ Terdeteksi Sengketa Kelayakan Playoff (${tiedCount} Atlet)</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">Terdeteksi <strong>${tiedCount} atlet</strong> memiliki akumulasi poin sama (${cutoffPoints} Pts) pada batas kelayakan kualifikasi (Peringkat ${cutoffLimit}). Sesuai regulasi POBSI Banjarnegara, sengketa diselesaikan melalui babak playoff kualifikasi dengan format <strong>Setengah Kompetisi (Round Robin)</strong>.</p>
            </div>
          </div>
        `;
      }
    } else {
      advisorWidget.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.18); border-radius: var(--radius-md); padding: 14px 20px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.03);">
          <i class="fa-solid fa-circle-check text-green" style="font-size: 1.25rem; margin-top: 1px;"></i>
          <div>
            <h4 style="font-family: var(--font-headers); font-size: 0.9rem; font-weight: 800; color: #a7f3d0; margin-bottom: 2px;">✅ Kelayakan Playoff Bersih & Kondusif</h4>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0;">Status kualifikasi aman. ${cutoffLimit} pemain teratas memiliki pembagian poin unik dan siap didelegasikan secara langsung ke putaran final Battle of Champions ${currentBocYear} tanpa sengketa tie-breaker.</p>
          </div>
        </div>
      `;
    }
  }

  // Filter Standings
  const filtered = standings.filter(p =>
    p.name.toLowerCase().includes(bocAdminSearchQuery.toLowerCase()) ||
    p.club.toLowerCase().includes(bocAdminSearchQuery.toLowerCase())
  );

  // Pagination Configuration
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / bocAdminItemsPerPage);
  if (bocAdminCurrentPage > totalPages) {
    bocAdminCurrentPage = totalPages || 1;
  }
  if (bocAdminCurrentPage < 1) {
    bocAdminCurrentPage = 1;
  }

  const startIndex = (bocAdminCurrentPage - 1) * bocAdminItemsPerPage;
  const endIndex = Math.min(startIndex + bocAdminItemsPerPage, totalItems);
  const pagedItems = filtered.slice(startIndex, endIndex);

  // Render Table rows
  tableBody.innerHTML = pagedItems.map((player, idx) => {
    const isBocZone = player.rank <= cutoffLimit;
    const highlightClass = isBocZone ? 'boc-qualified-row' : '';
    
    // Get deterministic event scores
    const eventScores = getPlayerEventScores(player.name, player.points);
    
    const scoresHtml = eventScores.map(score => {
      if (score !== "") {
        let colorClass = "boc-score-gold";
        if (score === 12) colorClass = "boc-score-champion";
        else if (score >= 7) colorClass = "boc-score-podium";
        else if (score >= 3) colorClass = "boc-score-finalist";
        
        return `<td class="text-center" style="padding: 10px 4px; width: 80px; white-space: nowrap;"><span class="boc-score-pill ${colorClass}">${score}</span></td>`;
      }
      return `<td class="text-center" style="padding: 10px 4px; color: rgba(255,255,255,0.04); font-weight: 300; width: 80px; white-space: nowrap;">-</td>`;
    }).join("");

    const hcClass = getHandicapColorClass(player.handicap);

    return `
      <tr class="${highlightClass}" style="border-bottom: 1px solid rgba(255,255,255,0.03); white-space: nowrap;">
        <td class="text-center table-rank-bold sticky-col" style="padding: 12px 4px; white-space: nowrap; left: 0; width: 45px;">${player.rank}</td>
        <td class="table-name-bold sticky-col" style="padding: 12px 10px; white-space: nowrap; text-align: left; left: 45px; width: 160px;">
          <div style="display:flex; align-items:center; gap:6px; white-space: nowrap; text-align: left;">
            ${player.name}
          </div>
        </td>
        <td class="text-center sticky-col" style="padding: 12px 4px; white-space: nowrap; left: 205px; width: 65px;"><span class="table-badge-hc ${hcClass}">HC ${player.handicap}</span></td>
        ${scoresHtml}
        <!-- Spacer Column to absorb extra width on wide screens -->
        <td style="width: auto; padding: 0;"></td>
        <td class="text-center text-gold sticky-col" style="font-weight:900; padding: 12px 6px; font-size: 0.82rem; background: rgba(251, 191, 36, 0.03); white-space: nowrap; right: 200px; width: 85px;">${player.points}</td>
        <td class="sticky-col" style="padding: 12px 10px; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; text-align: left; overflow: hidden; text-overflow: ellipsis; right: 80px; width: 120px;">
          ${isBocZone ? '<span style="color: #fbbf24; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown"></i> Lolos BOC</span>' : '-'}
        </td>
        <td class="text-center sticky-col" style="padding: 12px 4px; white-space: nowrap; right: 0; width: 80px;">
          <button onclick="openBocUpdateModal('${player.name}')" class="pm-btn pm-btn-ghost pm-btn-sm" style="color:var(--gold); border: 1px solid rgba(229,169,60,0.15); background:rgba(229,169,60,0.06); padding: 4px 8px;" title="Edit poin"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
        </td>
      </tr>
    `;
  }).join("");

  if (totalItems === 0) {
    tableBody.innerHTML = `<tr><td colspan="17" class="text-center" style="padding:40px; color:var(--text-muted)"><i class="fa-solid fa-folder-open" style="font-size:1.8rem; margin-bottom:12px; display:block"></i> Atlet klasemen tidak ditemukan</td></tr>`;
  }

  // Update Pagination Info
  const pageRangeEl = document.getElementById("boc-admin-page-range");
  const totalCountEl = document.getElementById("boc-admin-total-count");
  if (pageRangeEl && totalCountEl) {
    pageRangeEl.textContent = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : "0-0";
    totalCountEl.textContent = totalItems;
  }

  // Render Page numbers
  const pageNumbersContainer = document.getElementById("boc-admin-page-numbers");
  if (pageNumbersContainer) {
    let pagesHtml = "";
    const maxVisible = 5;
    let startPage = Math.max(1, bocAdminCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === bocAdminCurrentPage ? 'active' : '';
      pagesHtml += `<button class="pm-page-btn ${activeClass}" onclick="setBocAdminPage(${i})" style="width:28px; height:28px; border-radius:6px; border: 1px solid ${i === bocAdminCurrentPage ? 'var(--primary-light)' : 'rgba(255,255,255,0.08)'}; background:${i === bocAdminCurrentPage ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.02)'}; color:${i === bocAdminCurrentPage ? 'var(--primary-light)' : 'var(--text-dim)'}; cursor:pointer; font-weight:600; font-size:0.75rem;">${i}</button>`;
    }
    pageNumbersContainer.innerHTML = pagesHtml;
  }
};

window.setBocAdminPage = function(pageNumber) {
  bocAdminCurrentPage = pageNumber;
  renderAdminBocConsole();
};

window.openBocUpdateModal = function(playerName) {
  const standings = appData.standings || [];
  const player = standings.find(p => p.name === playerName);
  if (!player) return;

  const nameEl = document.getElementById("boc-points-modal-name");
  const clubEl = document.getElementById("boc-points-modal-club");
  const hiddenIdEl = document.getElementById("boc-points-modal-id-or-name");

  if (nameEl) nameEl.textContent = player.name;
  if (clubEl) clubEl.textContent = player.club;
  if (hiddenIdEl) hiddenIdEl.value = player.name;

  // Populate individual sirkuit points dynamically
  const container = document.getElementById("boc-update-points-container");
  if (container) {
    const eventScores = getPlayerEventScores(player.name, player.points);
    let html = `
      <h4 style="font-family: var(--font-headers); font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Edit Poin Sirkuit (BOC)</h4>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 12px;">
    `;
    
    bocSirkuits.forEach((sirkuit, idx) => {
      const score = eventScores[idx] !== undefined && eventScores[idx] !== "" ? eventScores[idx] : "";
      
      let labelColor = "#60a5fa"; // blue
      if (idx >= 4 && idx < 8) labelColor = "#fbbf24"; // gold
      else if (idx >= 8) labelColor = "#ef4444"; // red
      
      html += `
        <div class="form-group-item">
          <label class="form-lbl" style="font-size: 0.65rem; color: ${labelColor}; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" for="boc-pt-${idx}" title="${sirkuit}">${sirkuit}</label>
          <input type="number" id="boc-pt-${idx}" min="0" max="12" placeholder="-" value="${score}" style="padding: 8px; font-size: 0.85rem; text-align: center; color-scheme: dark;">
        </div>
      `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
  }

  // Show modal
  const modal = document.getElementById("boc-update-points-modal");
  if (modal) modal.style.display = "flex";
};

// Bind listeners for BOC Console inside setupListeners
function setupBocAdminListeners() {
  const searchInput = document.getElementById("boc-admin-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      bocAdminSearchQuery = e.target.value.trim();
      bocAdminCurrentPage = 1;
      renderAdminBocConsole();
    });
  }

  const prevBtn = document.getElementById("boc-admin-prev-page");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (bocAdminCurrentPage > 1) {
        bocAdminCurrentPage--;
        renderAdminBocConsole();
      }
    });
  }

  const nextBtn = document.getElementById("boc-admin-next-page");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const standings = appData.standings || [];
      const filtered = standings.filter(p =>
        p.name.toLowerCase().includes(bocAdminSearchQuery.toLowerCase()) ||
        p.club.toLowerCase().includes(bocAdminSearchQuery.toLowerCase())
      );
      const totalPages = Math.ceil(filtered.length / bocAdminItemsPerPage);
      if (bocAdminCurrentPage < totalPages) {
        bocAdminCurrentPage++;
        renderAdminBocConsole();
      }
    });
  }

  const tableCutoffInput = document.getElementById("table-set-boc-cutoff");
  if (tableCutoffInput) {
    tableCutoffInput.addEventListener("change", async (e) => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah regulasi/jadwal BOC.", "error");
        tableCutoffInput.value = bocSettings.cutoff_limit || 16;
        return;
      }
      
      const newCutoff = parseInt(e.target.value, 10);
      if (isNaN(newCutoff)) return;
      
      const success = await saveBocSettings({ cutoff_limit: newCutoff });
      if (success) {
        renderAdminBocConsole();
        showCustomToast(`Batas Kelayakan Playoff (Cut-Off) berhasil diubah ke ${newCutoff} Besar.`, "success");
      } else {
        showCustomToast("Gagal menyimpan perubahan batas kelayakan playoff.", "error");
        tableCutoffInput.value = bocSettings.cutoff_limit || 16;
      }
    });
  }

  const reindexBtn = document.getElementById("btn-boc-recalculate-engine");
  if (reindexBtn) {
    reindexBtn.addEventListener("click", async () => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Anda (Staff) tidak diizinkan untuk mengolah ulang data peringkat klasemen.", "error");
        return;
      }
      
      reindexBtn.disabled = true;
      reindexBtn.innerHTML = `<i class="fa-solid fa-arrows-spin fa-spin"></i> Re-indexing...`;
      
      // Determine active database type (Supabase or SQLite) dynamically from backend
      let dbType = "SQLite";
      if (isServerOnline) {
        try {
          const statusRes = await fetch('/api/db-status').then(r => r.ok ? r.json() : null).catch(() => null);
          if (statusRes && statusRes.database) {
            dbType = statusRes.database;
          }
        } catch (e) {}
      }

      if (isServerOnline) {
        try {
          const res = await fetch('/api/standings/reindex', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: currentBocYear })
          });
          if (res.ok) {
            await loadDataFromApi();
            renderAdminBocConsole();
            showCustomToast(`Re-indexing Sukses: Peringkat dan index klasemen seluruh atlet berhasil diselaraskan di database ${dbType}.`, "success");
          } else {
            showCustomToast(`Gagal melakukan sinkronisasi re-index ke database ${dbType}.`, "error");
          }
        } catch (err) {
          showCustomToast(`Error koneksi re-index: ${err.message}`, "error");
        }
      } else {
        // Local mode sorting
        const standings = appData.standings || [];
        standings.sort((a, b) => b.points - a.points);
        standings.forEach((p, idx) => p.rank = idx + 1);
        renderAdminBocConsole();
        showCustomToast("Luring Re-indexing Sukses: Peringkat dan indeks diurutkan di memori browser.", "success");
      }
      
      reindexBtn.disabled = false;
      reindexBtn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Re-index Ranks`;
    });
  }

  // Modal Cancel
  const closeBtn = document.getElementById("boc-points-modal-close");
  const cancelBtn = document.getElementById("boc-points-modal-btn-cancel");
  const modal = document.getElementById("boc-update-points-modal");
  
  const closeModalFunc = () => {
    if (modal) modal.style.display = "none";
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModalFunc);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModalFunc);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModalFunc();
    });
  }

  // Sirkuit Modal Management Bindings
  const manageSirkuitBtn = document.getElementById("btn-admin-manage-sirkuit-trigger");
  const sirkuitModal = document.getElementById("boc-manage-sirkuit-modal");
  const sirkuitModalClose = document.getElementById("boc-sirkuit-modal-close");
  const sirkuitModalBtnClose = document.getElementById("boc-sirkuit-modal-btn-close");

  const closeSirkuitModal = () => {
    if (sirkuitModal) sirkuitModal.style.display = "none";
  };

  if (manageSirkuitBtn && sirkuitModal) {
    manageSirkuitBtn.addEventListener("click", () => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengelola sirkuit.", "error");
        return;
      }
      sirkuitModal.style.display = "flex";
      renderManageSirkuitList();
    });
  }

  if (sirkuitModalClose) sirkuitModalClose.addEventListener("click", closeSirkuitModal);
  if (sirkuitModalBtnClose) sirkuitModalBtnClose.addEventListener("click", closeSirkuitModal);
  if (sirkuitModal) {
    sirkuitModal.addEventListener("click", (e) => {
      if (e.target === sirkuitModal) closeSirkuitModal();
    });
  }

  // Modal Bindings for BOC Schedule Modal
  const scheduleModal = document.getElementById("boc-schedule-modal");
  const scheduleModalClose = document.getElementById("boc-schedule-modal-close");
  const scheduleModalBtnCancel = document.getElementById("boc-schedule-modal-btn-cancel");
  const formBocSchedule = document.getElementById("form-boc-schedule");
  const editScheduleBtn = document.getElementById("btn-boc-edit-schedule");

  // consolidated wizard state for schedule/settings
  window.currentBocScheduleStep = 1;
  window.currentUploadedBocCoverBase64 = "";

  window.updateBocScheduleWizardUI = function() {
    const step = window.currentBocScheduleStep;
    const panes = document.querySelectorAll(".boc-settings-step-pane");
    panes.forEach(pane => {
      const paneStep = parseInt(pane.getAttribute("data-step"), 10);
      if (paneStep === step) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    const steps = document.querySelectorAll("#boc-schedule-wizard-stepper .wizard-step");
    steps.forEach(s => {
      const sStep = parseInt(s.getAttribute("data-step"), 10);
      const circle = s.querySelector(".wizard-step-circle");
      s.classList.remove("active", "completed");
      if (sStep === step) {
        s.classList.add("active");
        if (circle) circle.innerHTML = sStep;
      } else if (sStep < step) {
        s.classList.add("completed");
        if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else {
        if (circle) circle.innerHTML = sStep;
      }
    });

    const progress = document.getElementById("boc-schedule-wizard-progress");
    if (progress && steps.length > 1) {
      const percent = ((step - 1) / (steps.length - 1)) * 100;
      progress.style.width = `${percent}%`;
    }

    const btnCancel = document.getElementById("boc-schedule-modal-btn-cancel");
    const btnPrev = document.getElementById("boc-schedule-modal-btn-prev");
    const btnNext = document.getElementById("boc-schedule-modal-btn-next");
    const btnSubmit = document.getElementById("boc-schedule-modal-btn-submit");

    if (step === 1) {
      if (btnCancel) btnCancel.style.display = "inline-block";
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) btnNext.style.display = "inline-block";
      if (btnSubmit) btnSubmit.style.display = "none";
    } else if (step === 2) {
      if (btnCancel) btnCancel.style.display = "none";
      if (btnPrev) btnPrev.style.display = "inline-block";
      if (btnNext) btnNext.style.display = "inline-block";
      if (btnSubmit) btnSubmit.style.display = "none";
    } else if (step === 3) {
      if (btnCancel) btnCancel.style.display = "none";
      if (btnPrev) btnPrev.style.display = "inline-block";
      if (btnNext) btnNext.style.display = "none";
      if (btnSubmit) btnSubmit.style.display = "inline-block";
    }
  };

  window.resetBocScheduleWizard = function() {
    window.currentBocScheduleStep = 1;
    window.updateBocScheduleWizardUI();
  };

  const openBocScheduleModal = () => {
    if (!scheduleModal) return;
    const role = localStorage.getItem("pobsi_admin_role") || "admin";
    if (role === "staff") {
      showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengatur jadwal & regulasi BOC.", "error");
      return;
    }
    
    // Set defaults or prefill from bocSettings
    const saved = bocSettings.playoff_schedule;
    const inpDate = document.getElementById("inp-boc-schedule-date");
    const inpTime = document.getElementById("inp-boc-schedule-time");
    const inpVenue = document.getElementById("inp-boc-schedule-venue");
    const scheduleDatePicker = document.getElementById("inp-boc-schedule-date-wrapper")?._flatpickr;

    if (saved) {
      const schedule = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (scheduleDatePicker) {
        scheduleDatePicker.setDate(schedule.date || "");
      } else if (inpDate) {
        inpDate.value = schedule.date || "";
      }
      setSelectedTimeValue("inp-boc-schedule-time", schedule.time || "");
      if (inpVenue) inpVenue.value = schedule.venue || "";
    } else {
      if (scheduleDatePicker) {
        scheduleDatePicker.setDate("");
      } else if (inpDate) {
        inpDate.value = "";
      }
      setSelectedTimeValue("inp-boc-schedule-time", "");
      if (inpVenue) inpVenue.value = "";
    }

    // Prefill settings fields too
    const bocCutoffInput = document.getElementById("set-boc-cutoff");
    const bocMaxhcInput = document.getElementById("set-boc-maxhc");
    const bocYearInput = document.getElementById("set-boc-year");
    const bocPrize1Input = document.getElementById("set-boc-prize1");
    const bocPrize2Input = document.getElementById("set-boc-prize2");
    const bocPrize3Input = document.getElementById("set-boc-prize3");
    const bocBestGameInput = document.getElementById("set-boc-bestgame");
    const bocRulesInput = document.getElementById("set-boc-rules");

    if (bocCutoffInput) bocCutoffInput.value = bocSettings.cutoff_limit || "16";
    if (bocMaxhcInput) bocMaxhcInput.value = bocSettings.max_handicap || "Bebas";
    if (bocYearInput) bocYearInput.value = currentBocYear || "2026";

    const prizes = saved ? (bocSettings.prizes || {}) : {};
    const rules = saved ? (bocSettings.rules || "") : "";

    if (bocPrize1Input) bocPrize1Input.value = prizes.juara1 || "";
    if (bocPrize2Input) bocPrize2Input.value = prizes.juara2 || "";
    if (bocPrize3Input) bocPrize3Input.value = prizes.juara3 || "";
    if (bocBestGameInput) bocBestGameInput.value = prizes.best_game || "";
    if (bocRulesInput) bocRulesInput.value = rules || "";

    // Prefill cover image preview if it exists in DB
    const bocCoverDropZone = document.getElementById("boc-cover-drop-zone");
    const bocCoverPreviewContainer = document.getElementById("boc-cover-preview-container");
    const bocCoverPreviewImg = document.getElementById("boc-cover-preview-img");
    const bocCoverPreviewFilename = document.getElementById("boc-cover-preview-filename");
    const bocCoverFileInput = document.getElementById("set-boc-cover-file");

    if (saved && bocSettings.cover) {
      window.currentUploadedBocCoverBase64 = bocSettings.cover;
      if (bocCoverPreviewImg) bocCoverPreviewImg.src = bocSettings.cover;
      if (bocCoverPreviewFilename) bocCoverPreviewFilename.textContent = "boc_cover.png";
      if (bocCoverDropZone) bocCoverDropZone.style.display = "none";
      if (bocCoverPreviewContainer) bocCoverPreviewContainer.style.display = "flex";
    } else {
      window.currentUploadedBocCoverBase64 = "";
      if (bocCoverFileInput) bocCoverFileInput.value = "";
      if (bocCoverDropZone) bocCoverDropZone.style.display = "flex";
      if (bocCoverPreviewContainer) bocCoverPreviewContainer.style.display = "none";
    }

    // Prefill recap cover image preview if it exists in DB
    const bocRecapDropZone = document.getElementById("boc-recap-drop-zone");
    const bocRecapPreviewContainer = document.getElementById("boc-recap-preview-container");
    const bocRecapPreviewImg = document.getElementById("boc-recap-preview-img");
    const bocRecapPreviewFilename = document.getElementById("boc-recap-preview-filename");
    const bocRecapFileInput = document.getElementById("set-boc-recap-file");

    if (saved && bocSettings.recap_cover) {
      window.currentUploadedBocRecapBase64 = bocSettings.recap_cover;
      if (bocRecapPreviewImg) bocRecapPreviewImg.src = bocSettings.recap_cover;
      if (bocRecapPreviewFilename) bocRecapPreviewFilename.textContent = "recap_cover.png";
      if (bocRecapDropZone) bocRecapDropZone.style.display = "none";
      if (bocRecapPreviewContainer) bocRecapPreviewContainer.style.display = "flex";
    } else {
      window.currentUploadedBocRecapBase64 = "";
      if (bocRecapFileInput) bocRecapFileInput.value = "";
      if (bocRecapDropZone) bocRecapDropZone.style.display = "flex";
      if (bocRecapPreviewContainer) bocRecapPreviewContainer.style.display = "none";
    }

    // Reset settings wizard
    window.resetBocScheduleWizard();

    scheduleModal.style.display = "flex";
  };

  const closeBocScheduleModal = () => {
    if (scheduleModal) scheduleModal.style.display = "none";
  };

  if (scheduleModalClose) scheduleModalClose.addEventListener("click", closeBocScheduleModal);
  if (scheduleModalBtnCancel) scheduleModalBtnCancel.addEventListener("click", closeBocScheduleModal);
  if (scheduleModal) {
    scheduleModal.addEventListener("click", (e) => {
      if (e.target === scheduleModal) closeBocScheduleModal();
    });
  }

  if (editScheduleBtn) {
    editScheduleBtn.addEventListener("click", openBocScheduleModal);
  }

  // --- BOC Consolidated Schedule & Settings Wizard Navigation ---
  const btnBocPrev = document.getElementById("boc-schedule-modal-btn-prev");
  const btnBocNext = document.getElementById("boc-schedule-modal-btn-next");


  if (btnBocPrev) {
    btnBocPrev.onclick = function() {
      if (window.currentBocScheduleStep > 1) {
        window.currentBocScheduleStep--;
        window.updateBocScheduleWizardUI();
      }
    };
  }

  if (btnBocNext) {
    btnBocNext.onclick = function() {
      if (window.currentBocScheduleStep === 1) {
        // Validate required inputs on Step 1
        const dateVal = document.getElementById("inp-boc-schedule-date").value;
        const timeVal = document.getElementById("inp-boc-schedule-time").value;
        const venueVal = document.getElementById("inp-boc-schedule-venue").value;
        const yearVal = document.getElementById("set-boc-year").value.trim();

        if (!dateVal || !timeVal || !venueVal || !yearVal) {
          showCustomToast("Mohon lengkapi semua bidang bertanda bintang (*) dan Tahun Musim!", "error");
          return;
        }
      }
      if (window.currentBocScheduleStep < 3) {
        window.currentBocScheduleStep++;
        window.updateBocScheduleWizardUI();
      }
    };
  }

  const bocCoverDropZone = document.getElementById("boc-cover-drop-zone");
  const bocCoverFileInput = document.getElementById("set-boc-cover-file");
  const bocCoverPreviewContainer = document.getElementById("boc-cover-preview-container");
  const bocCoverPreviewImg = document.getElementById("boc-cover-preview-img");
  const bocCoverPreviewFilename = document.getElementById("boc-cover-preview-filename");
  const btnClearBocCover = document.getElementById("btn-clear-boc-cover");

  if (bocCoverDropZone && bocCoverFileInput) {
    bocCoverDropZone.onclick = () => bocCoverFileInput.click();

    bocCoverDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      bocCoverDropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      bocCoverDropZone.addEventListener(eventName, () => {
        bocCoverDropZone.classList.remove("dragover");
      });
    });

    bocCoverDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleBocCoverFileSelection(files[0]);
      }
    });

    bocCoverFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleBocCoverFileSelection(files[0]);
      }
    });
  }

  function handleBocCoverFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      showCustomToast("Format berkas tidak valid! Silakan unggah gambar (JPG, PNG, WebP).", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showCustomToast("Ukuran gambar terlalu besar! Maksimal batas ukuran berkas adalah 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      window.currentUploadedBocCoverBase64 = e.target.result;
      
      if (bocCoverPreviewImg) bocCoverPreviewImg.src = window.currentUploadedBocCoverBase64;
      if (bocCoverPreviewFilename) bocCoverPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      
      if (bocCoverDropZone) bocCoverDropZone.style.display = "none";
      if (bocCoverPreviewContainer) bocCoverPreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  if (btnClearBocCover) {
    btnClearBocCover.onclick = () => {
      window.currentUploadedBocCoverBase64 = "";
      if (bocCoverFileInput) bocCoverFileInput.value = "";
      if (bocCoverDropZone) bocCoverDropZone.style.display = "flex";
      if (bocCoverPreviewContainer) bocCoverPreviewContainer.style.display = "none";
    };
  }

  // Season Recap Image handlers for Schedule Modal
  const bocRecapDropZone = document.getElementById("boc-recap-drop-zone");
  const bocRecapFileInput = document.getElementById("set-boc-recap-file");
  const bocRecapPreviewContainer = document.getElementById("boc-recap-preview-container");
  const bocRecapPreviewImg = document.getElementById("boc-recap-preview-img");
  const bocRecapPreviewFilename = document.getElementById("boc-recap-preview-filename");
  const btnClearBocRecap = document.getElementById("btn-clear-boc-recap");

  if (bocRecapDropZone && bocRecapFileInput) {
    bocRecapDropZone.onclick = () => bocRecapFileInput.click();

    bocRecapDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      bocRecapDropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      bocRecapDropZone.addEventListener(eventName, () => {
        bocRecapDropZone.classList.remove("dragover");
      });
    });

    bocRecapDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleBocRecapFileSelection(files[0]);
      }
    });

    bocRecapFileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleBocRecapFileSelection(files[0]);
      }
    });
  }

  function handleBocRecapFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      showCustomToast("Format berkas tidak valid! Silakan unggah gambar (JPG, PNG, WebP).", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showCustomToast("Ukuran gambar terlalu besar! Maksimal batas ukuran berkas adalah 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      window.currentUploadedBocRecapBase64 = e.target.result;
      
      if (bocRecapPreviewImg) bocRecapPreviewImg.src = window.currentUploadedBocRecapBase64;
      if (bocRecapPreviewFilename) bocRecapPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      
      if (bocRecapDropZone) bocRecapDropZone.style.display = "none";
      if (bocRecapPreviewContainer) bocRecapPreviewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  if (btnClearBocRecap) {
    btnClearBocRecap.onclick = () => {
      window.currentUploadedBocRecapBase64 = "";
      if (bocRecapFileInput) bocRecapFileInput.value = "";
      if (bocRecapDropZone) bocRecapDropZone.style.display = "flex";
      if (bocRecapPreviewContainer) bocRecapPreviewContainer.style.display = "none";
    };
  }

  if (formBocSchedule) {
    formBocSchedule.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah regulasi/jadwal BOC.", "error");
        return;
      }

      const date = document.getElementById("inp-boc-schedule-date").value;
      const time = document.getElementById("inp-boc-schedule-time").value;
      const venue = document.getElementById("inp-boc-schedule-venue").value;

      const cutoffInput = document.getElementById("set-boc-cutoff");
      const cutoffVal = cutoffInput ? parseInt(cutoffInput.value, 10) : (bocSettings.cutoff_limit || 16);
      const maxhcInput = document.getElementById("set-boc-maxhc");
      const maxhcVal = maxhcInput ? maxhcInput.value : "Bebas";
      const newYear = document.getElementById("set-boc-year").value.trim();

      const prize1 = document.getElementById("set-boc-prize1").value.trim();
      const prize2 = document.getElementById("set-boc-prize2").value.trim();
      const prize3 = document.getElementById("set-boc-prize3").value.trim();
      const bestgame = document.getElementById("set-boc-bestgame").value.trim();
      const rulesVal = document.getElementById("set-boc-rules").value.trim();

      // Save settings to database
      await saveBocSettings({
        cutoff_limit: cutoffVal,
        max_handicap: maxhcVal,
        year: newYear,
        playoff_schedule: { date, time, venue },
        prizes: {
          juara1: prize1,
          juara2: prize2,
          juara3: prize3,
          best_game: bestgame
        },
        rules: rulesVal,
        cover: window.currentUploadedBocCoverBase64 || null,
        recap_cover: window.currentUploadedBocRecapBase64 || null
      });

      const oldYear = localStorage.getItem("currentBocYear") || "2026";
      localStorage.setItem("currentBocYear", newYear);

      closeBocScheduleModal();
      showCustomToast("Pengaturan & Jadwal BOC berhasil disimpan!", "success");

      if (oldYear !== newYear) {
        currentBocYear = newYear;
        // Load settings for the new year
        await loadBocSettings(newYear);
        // Reload sirkuits for the new year
        bocSirkuits = loadBocSirkuitsForYear(newYear);
        // Refresh standings & events
        loadDataFromApi().then(() => {
          renderStandings();
          renderEvents("all");
          renderAdminBocConsole();
        });
      } else {
        renderAdminBocConsole();
        renderStandings();
      }
    });
  }

  // --- BATTLE OF CHAMPIONS PLAYOFF START & RESET LISTENERS ---
  const startPlayoffBtn = document.getElementById("btn-boc-start-playoff");
  if (startPlayoffBtn) {
    startPlayoffBtn.addEventListener("click", () => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan memulai BOC.", "error");
        return;
      }

      const existingBocEvent = appData.events.find(e => 
        e.elimination_type === "boc" && 
        e.status !== "Cancelled" && 
        e.status !== "Selesai" &&
        (e.title.includes(currentBocYear) || e.description?.includes(currentBocYear))
      );
      if (existingBocEvent) {
        // Button already says "Kelola Playoff" — directly open event detail
        openEventDetail(existingBocEvent.id);
        return;
      }

      const savedSchedule = bocSettings.playoff_schedule;
      if (!savedSchedule) {
        // Button says "Jadwalkan BOC" — open schedule settings modal
        openBocScheduleModal();
        return;
      }

      // Button says "Mulai BOC" — proceed to eligibility check & event creation
      const standings = appData.standings || [];
      const cutoffLimit = bocSettings.cutoff_limit || 16;
      let tiedCount = 0;
      let cutoffPoints = 0;
      if (standings.length >= cutoffLimit) {
        cutoffPoints = standings[cutoffLimit - 1].points;
        tiedCount = standings.filter(p => p.points === cutoffPoints).length;
      }

      const executeCreateEvent = async () => {
        const topPlayers = standings.slice(0, cutoffLimit).map(p => p.name);

        if (topPlayers.length < cutoffLimit) {
          showCustomToast(`Jumlah atlet di klasemen kurang dari ${cutoffLimit}! Daftarkan atlet terlebih dahulu.`, "error");
          return;
        }

        let scheduleObj = {
          date: new Date().toISOString().split('T')[0],
          venue: "Midnight Arena (Banjarnegara)",
          notes: `Grand Final kualifikasi ${cutoffLimit} atlet terbaik.`
        };
        try {
          scheduleObj = JSON.parse(savedSchedule);
        } catch (e) {
          console.error("Error parsing savedSchedule during creation", e);
        }

        const newEventId = "E" + String(Date.now()).slice(-3) + String(Math.floor(Math.random() * 10));
        const eventData = {
          id: newEventId,
          title: `Grand Final Battle of Champions ${currentBocYear}`,
          date: formatSqlDate(scheduleObj.date),
          venue: scheduleObj.venue,
          prizePool: "Rp 15.000.000",
          entryFee: "Rp 150.000",
          contact: "POBSI Committee",
          status: "Daftar",
          description: `Turnamen Puncak Grand Final Battle of Champions musim sirkuit ${currentBocYear}. Diikuti oleh ${cutoffLimit} pemain kualifikasi terbaik. ${scheduleObj.notes || ''}`,
          type: "Battle of Champions (BOC)",
          elimination_type: "boc",
          bracket_size: String(cutoffLimit),
          participants: JSON.stringify(topPlayers)
        };

        try {
          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
          });
          if (res.ok) {
            const createdEvent = await res.json();
            const actualId = createdEvent.id || newEventId;
            showCustomToast(`Grand Final BOC ${currentBocYear} berhasil dibuat!`, "success");
            await loadDataFromApi();
            openEventDetail(actualId);
            setTimeout(() => {
              const bracketTab = document.querySelector("#pane-event-detail .pm-stab[data-event-tab='bracket']");
              if (bracketTab) bracketTab.click();
            }, 200);
          } else {
            showCustomToast("Gagal membuat event Grand Final BOC di database.", "error");
          }
        } catch (err) {
          showCustomToast(`Error: ${err.message}`, "error");
        }
      };

      if (tiedCount > 1) {
        showCustomConfirm(
          "Grand Final Terkunci",
          `⚠️ Terdeteksi Sengketa Kelayakan Playoff: Ada <strong>${tiedCount} atlet</strong> memiliki poin yang sama (${cutoffPoints} Pts) pada batas peringkat kelayakan ${cutoffLimit} besar kualifikasi.<br><br>Grand Final BOC tidak dapat dimulai sebelum sengketa kelayakan ini diselesaikan (tidak boleh ada atlet dengan poin kembar pada batas cut-off peringkat ${cutoffLimit}).`,
          null,
          "Tutup",
          "danger"
        );
      } else {
        executeCreateEvent();
      }
    });
  }

  const resetSeriesBtn = document.getElementById("btn-boc-reset-series");
  if (resetSeriesBtn) {
    resetSeriesBtn.addEventListener("click", () => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan melakukan reset.", "error");
        return;
      }

      showCustomConfirm(
        "Peringatan Reset Klasemen",
        "⚠️ PERINGATAN KERAS: Tindakan ini akan menghapus seluruh data klasemen poin sirkuit atlet dan memulai musim BOC baru untuk tahun berikutnya. Apakah Anda yakin?",
        () => {
          showCustomConfirm(
            "Konfirmasi Terakhir Reset",
            "⚠️ KONFIRMASI TERAKHIR: Semua poin atlet akan di-reset menjadi 0. Tindakan ini tidak dapat dibatalkan. Apakah Anda benar-benar yakin?",
            async () => {
              try {
                const res = await fetch('/api/standings/reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ year: currentBocYear })
                });
                if (res.ok) {
                  for (let name in exactBocPoints) {
                    delete exactBocPoints[name];
                  }
                  localStorage.removeItem("exactBocPoints");
                  // Clear playoff schedule in DB
                  await saveBocSettings({ playoff_schedule: null });

                  const nextYear = parseInt(currentBocYear, 10) + 1;
                  currentBocYear = String(nextYear);
                  localStorage.setItem("currentBocYear", currentBocYear);

                  // Clear sirkuits for the new year (start fresh)
                  bocSirkuits = [];
                  // Don't save empty array — new year simply has no sirkuits yet

                  showCustomToast(`Klasemen sirkuit berhasil di-reset! Musim baru BOC ${currentBocYear} dimulai.`, "success");

                  await loadDataFromApi();
                  renderAdminBocConsole();

                  // Update URL hash to sync with the new year
                  window.location.hash = "boc-" + currentBocYear;
                } else {
                  showCustomToast("Gagal mereset klasemen di database SQLite.", "error");
                }
              } catch (err) {
                showCustomToast(`Error koneksi reset: ${err.message}`, "error");
              }
            },
            "Reset Permanen",
            "danger"
          );
        },
        "Ya, Lanjutkan",
        "warning"
      );
    });
  }

  // --- DEV RESET BOC LISTENERS (Localhost only) ---
  const devResetBtn = document.getElementById("btn-boc-dev-reset");
  if (devResetBtn) {
    // Show only on localhost/127.0.0.1
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      devResetBtn.style.display = "flex";
    }

    devResetBtn.addEventListener("click", () => {
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan melakukan reset.", "error");
        return;
      }

      const modal = document.getElementById("boc-dev-reset-modal");
      if (modal) {
        const label = document.getElementById("dev-reset-year-label");
        if (label) {
          label.textContent = `Target: BOC 2026`;
        }
        modal.style.display = "flex";
      }
    });
  }

  const devResetModalClose = document.getElementById("boc-dev-reset-modal-close");
  if (devResetModalClose) {
    devResetModalClose.addEventListener("click", () => {
      const modal = document.getElementById("boc-dev-reset-modal");
      if (modal) modal.style.display = "none";
    });
  }

  const devResetModalCancel = document.getElementById("boc-dev-reset-modal-cancel");
  if (devResetModalCancel) {
    devResetModalCancel.addEventListener("click", () => {
      const modal = document.getElementById("boc-dev-reset-modal");
      if (modal) modal.style.display = "none";
    });
  }

  const devResetExecute = document.getElementById("boc-dev-reset-execute");
  if (devResetExecute) {
    devResetExecute.addEventListener("click", async () => {
      const clearEvents = document.getElementById("dev-reset-opt-events").checked;
      const clearSchedule = document.getElementById("dev-reset-opt-schedule").checked;
      const clearSirkuits = document.getElementById("dev-reset-opt-sirkuits").checked;
      const reseed = document.getElementById("dev-reset-opt-reseed").checked;

      const modal = document.getElementById("boc-dev-reset-modal");
      if (modal) modal.style.display = "none";

      showCustomToast("Menjalankan Dev Reset...", "info");

      try {
        const res = await fetch("/api/boc/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            year: "2026",
            clearEvents,
            clearSchedule,
            clearSirkuits,
            reseed
          })
        });

        if (res.ok) {
          const data = await res.json();
          
          // Clear exactBocPoints locally if reseeded or sirkuit cleared
          if (reseed || clearSirkuits) {
            for (let name in exactBocPoints) {
              delete exactBocPoints[name];
            }
            localStorage.removeItem("exactBocPoints");
          }

          if (clearSirkuits) {
            bocSirkuits = [];
            localStorage.removeItem(`bocSirkuits_2026`);
          }

          console.log("Dev Reset Summary:", data.summary);
          showCustomToast(data.message || "BOC state berhasil di-reset!", "success");

          // Always set currentBocYear back to 2026 on dev reset completion
          currentBocYear = "2026";
          localStorage.setItem("currentBocYear", "2026");
          bocSirkuits = loadBocSirkuitsForYear("2026");
          await loadBocSettings("2026");

          // Reload all data from API and re-render
          await loadDataFromApi();
          renderAdminBocConsole();
          if (typeof renderStandings === "function") renderStandings();
        } else {
          const errData = await res.json().catch(() => ({}));
          showCustomToast(`Gagal: ${errData.error || res.statusText}`, "error");
        }
      } catch (err) {
        showCustomToast(`Error koneksi reset: ${err.message}`, "error");
      }
    });
  }

  const addSirkuitBtn = document.getElementById("btn-boc-add-sirkuit");
  if (addSirkuitBtn) {
    addSirkuitBtn.addEventListener("click", async () => {
      const input = document.getElementById("boc-new-sirkuit-name");
      if (!input) return;
      const name = input.value.trim();
      if (!name) {
        showCustomToast("Nama sirkuit tidak boleh kosong!", "error");
        return;
      }
      
      bocSirkuits.push(name);
      localStorage.setItem(`bocSirkuits_${currentBocYear}`, JSON.stringify(bocSirkuits));
      await saveBocSirkuitsToServer(currentBocYear, bocSirkuits);
      
      // Append empty score for all players
      Object.keys(exactBocPoints).forEach(playerName => {
        if (Array.isArray(exactBocPoints[playerName])) {
          exactBocPoints[playerName].push("");
        }
      });
      localStorage.setItem("exactBocPoints", JSON.stringify(exactBocPoints));
      
      input.value = "";
      showCustomToast(`Sirkuit "${name}" berhasil ditambahkan!`, "success");
      renderManageSirkuitList();
      
      await recalculateAndSyncAllStandings();
    });
  }

  // Form submit
  const formUpdateBoc = document.getElementById("form-admin-update-boc-points");
  if (formUpdateBoc) {
    formUpdateBoc.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff hanya diizinkan membaca data klasemen.", "error");
        return;
      }

      const name = document.getElementById("boc-points-modal-id-or-name").value;

      const standings = appData.standings || [];
      const player = standings.find(p => p.name === name);
      if (!player) return;

      const handicap = player.handicap || "3N";

      // Extract sirkuit points from inputs and compute aggregates
      const updatedScores = [];
      let totalPoints = 0;
      let played = 0;
      let won = 0;
      const lost = 0;

      for (let i = 0; i < bocSirkuits.length; i++) {
        const inputEl = document.getElementById(`boc-pt-${i}`);
        const valStr = inputEl ? inputEl.value.trim() : "";
        if (valStr !== "") {
          const num = parseInt(valStr, 10) || 0;
          updatedScores.push(num);
          totalPoints += num;
          played++;
          won++;
        } else {
          updatedScores.push("");
        }
      }

      // Update in-memory exactBocPoints mapping and persist in localStorage
      exactBocPoints[name] = updatedScores;
      try {
        localStorage.setItem("exactBocPoints", JSON.stringify(exactBocPoints));
      } catch (err) {
        console.error("Failed to save exactBocPoints to localStorage", err);
      }

      if (isServerOnline) {
        try {
          const res = await fetch('/api/standings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              year: currentBocYear,
              club: player.club,
              handicap,
              points: totalPoints,
              played,
              won,
              lost,
              boc_points: JSON.stringify(updatedScores)
            })
          });
          if (res.ok) {
            closeModalFunc();
            showCustomToast(`Berhasil menyimpan pembaruan poin sirkuit untuk "${name}"!`, "success");
            await loadDataFromApi();
            loadHomeHighlights();
            renderStandings();
            renderAdminBocConsole();
            updateWorkspaceStats();
            renderWorkspacePreviews();
          } else {
            const err = await res.json();
            showCustomToast(`Gagal menyimpan poin: ${err.error}`, "error");
          }
        } catch (err) {
          showCustomToast(`Error koneksi server: ${err.message}`, "error");
        }
      } else {
        // Offline mode
        player.points = totalPoints;
        player.handicap = handicap;
        player.played = played;
        player.won = won;
        player.lost = lost;
        
        standings.sort((a, b) => b.points - a.points);
        standings.forEach((p, idx) => p.rank = idx + 1);
        
        closeModalFunc();
        showCustomToast(`Luring: Berhasil memperbarui poin untuk "${name}" di memori.`, "success");
        renderStandings();
        renderAdminBocConsole();
        updateWorkspaceStats();
        renderWorkspacePreviews();
      }
    });
  }


}


/* ==========================================================================
   PUBLIC ATHLETE PROFILE PAGE (ATP/F1/Chess.com Inspired)
   ========================================================================== */

// Generate URL-safe slug from athlete name
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Find athlete by slug — searches standings + players
function findAthleteBySlug(slug) {
  // Search in standings (primary source for BOC data)
  const standing = appData.standings.find(s => generateSlug(s.name) === slug);
  if (!standing) return null;

  // Enrich with player data if available
  const player = appData.players.find(p => 
    p.name.toLowerCase() === standing.name.toLowerCase()
  );

  return {
    ...standing,
    id: player ? player.id : null,
    avatar: player ? player.avatar : null,
    gender: player ? player.gender : 'Laki-laki',
    age: player ? player.age : null,
    phone: player ? player.phone : null,
    address: player ? player.address : null,
    status: player ? player.status : 'Aktif'
  };
}

// Open the public athlete profile page
function openAthleteProfile(slug) {
  const athlete = findAthleteBySlug(slug);
  if (!athlete) {
    console.warn('Athlete not found for slug:', slug);
    return;
  }

  const mainContent = document.querySelector('.main-content');
  const profilePage = document.getElementById('athlete-profile-page');
  const eventPage = document.getElementById('public-event-detail-page');

  // Determine where the user came from by looking at current history state or DOM layout state
  const currentState = window.history.state || {};
  let fromEvent = currentState.fromEvent || false;
  let fromTab = currentState.fromTab || '';

  // If state doesn't have it (e.g. initial transition), check DOM
  if (!fromEvent && !fromTab) {
    if (eventPage && eventPage.style.display === 'block') {
      fromEvent = true;
    } else {
      const activeTab = Array.from(document.querySelectorAll('.tab-pane')).find(p => p.classList.contains('active'));
      if (activeTab) {
        fromTab = activeTab.id;
      }
    }
  }

  // Set the back button text dynamically
  const isMobile = window.innerWidth < 768;
  let backText = isMobile ? 'Kembali ke Klasemen BOC' : 'Kembali ke Klasemen Battle of Champions';
  if (fromEvent) {
    backText = 'Kembali ke Detail Event';
  } else if (fromTab) {
    if (fromTab === 'tab-home') {
      backText = 'Kembali ke Beranda';
    } else if (fromTab === 'tab-handicap') {
      backText = 'Kembali ke Handicap';
    } else if (fromTab === 'tab-events') {
      backText = 'Kembali ke Event';
    } else if (fromTab === 'tab-clubs') {
      backText = 'Kembali ke Klub';

    } else if (fromTab === 'tab-champions') {
      backText = isMobile ? 'Kembali ke Klasemen BOC' : 'Kembali ke Klasemen Battle of Champions';
    }
  }

  // Hide public tabs and show profile
  if (eventPage) {
    eventPage.style.display = 'none';
  }
  
  if (mainContent) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    mainContent.style.display = '';
  }
  
  if (profilePage) {
    profilePage.style.display = 'block';
    // Re-trigger animation
    profilePage.style.animation = 'none';
    profilePage.offsetHeight; // force reflow
    profilePage.style.animation = '';
    
    // Update the back button text dynamically using unique ID
    const backBtnText = document.getElementById('ap-profile-back-btn-text');
    if (backBtnText) {
      backBtnText.textContent = backText;
    }
  }

  // Update URL - track navigation source (only push if pathname is different)
  const targetPath = '/athletes/' + slug;
  if (window.location.pathname !== targetPath) {
    window.history.pushState({ athleteSlug: slug, fromEvent, fromTab }, '', targetPath);
  }

  // Render the profile content
  renderAthleteProfile(athlete);

  // Update BOC announcement banners visibility
  if (typeof updateBocBannersVisibility === 'function') {
    updateBocBannersVisibility();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Close athlete profile and return to previous state
function closeAthleteProfile() {
  const mainContent = document.querySelector('.main-content');
  const profilePage = document.getElementById('athlete-profile-page');

  if (profilePage) profilePage.style.display = 'none';

  // Update BOC announcement banners visibility
  if (typeof updateBocBannersVisibility === 'function') {
    updateBocBannersVisibility();
  }

  // If we came from an event page, go back using history to restore the event page detail
  if (window.history.state && window.history.state.fromEvent) {
    window.history.back();
    return;
  }

  // If we came from a specific tab, restore that tab
  const prevTab = window.history.state && window.history.state.fromTab;
  if (prevTab) {
    if (mainContent) mainContent.style.display = '';
    const tabHash = prevTab.replace('tab-', '');
    window.history.pushState({}, '', '/#' + tabHash);
    if (typeof switchTab === 'function') {
      switchTab(prevTab, false);
    }
    return;
  }

  if (mainContent) mainContent.style.display = '';

  // Fallback: Update URL to root with #champions hash
  window.history.pushState({}, '', '/#champions-' + currentBocYear);

  // Restore champions tab in the DOM
  if (typeof switchTab === 'function') {
    switchTab('tab-champions', false);
  }
}

// Open public event detail and display it
window.openPublicEventDetail = function(eventId) {
  const event = appData.events.find(e => e.id === eventId);
  if (!event) return;

  const mainContent = document.querySelector('.main-content');
  const eventPage = document.getElementById('public-event-detail-page');
  const athletePage = document.getElementById('athlete-profile-page');
  
  const isBoc = event.elimination_type === 'boc';
  const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
  const eventDetailWrapper = document.getElementById("public-event-detail-page-wrapper");
  const publicStandingsContainer = document.getElementById("boc-public-standings-container");

  if (athletePage) athletePage.style.display = 'none';

  if (isBoc) {
    // 1. Relocate event detail inside tab-champions playoff container
    if (eventPage && publicPlayoffContainer) {
      publicPlayoffContainer.appendChild(eventPage);
      publicPlayoffContainer.style.display = "block";
    }
    if (publicStandingsContainer) {
      publicStandingsContainer.style.display = "none";
    }

    // Ensure main content is visible and switch public tab to champions
    if (mainContent) mainContent.style.display = '';
    
    // Switch to tab-champions tab to keep navigation and hash active
    switchTab('tab-champions', false);
    if (window.location.hash !== "#champions-" + currentBocYear + "-playoff") {
      window.history.pushState({}, "", "/#champions-" + currentBocYear + "-playoff");
    }

    if (eventPage) {
      eventPage.style.display = 'block';
    }

    // 2. Customize back button to say "Kembali ke Klasemen BOC" and point to standings
    const backBtn = document.querySelector("#public-event-detail-page .ap-back-btn");
    const backText = document.getElementById("pub-event-back-text");
    if (backBtn && backText) {
      backText.textContent = "Kembali ke Klasemen BOC";
      backBtn.onclick = () => {
        // Go back in history if possible, else replace state
        if (window.history.length > 1) {
          window.history.back();
        } else {
          if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
          if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
          renderStandings();
          window.history.replaceState({}, "", "/#champions-" + currentBocYear);
        }
      };
    }
  } else {
    // 1. Relocate event detail back to original wrapper
    if (eventPage && eventDetailWrapper) {
      eventDetailWrapper.appendChild(eventPage);
    }
    if (publicPlayoffContainer) {
      publicPlayoffContainer.style.display = "none";
    }
    if (publicStandingsContainer) {
      publicStandingsContainer.style.display = "block";
    }

    // 2. Normal behaviour for general events
    if (mainContent) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      mainContent.style.display = '';
    }

    if (eventPage) {
      eventPage.style.display = 'block';
      eventPage.style.animation = 'none';
      eventPage.offsetHeight; // force reflow
      eventPage.style.animation = '';
    }

    // Update URL - only push if pathname is different
    const targetPath = '/events/' + eventId;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ eventId }, '', targetPath);
    }

    // Reset back button to default
    const backBtn = document.querySelector("#public-event-detail-page .ap-back-btn");
    const backText = document.getElementById("pub-event-back-text");
    if (backBtn && backText) {
      backText.textContent = "Kembali ke Event";
      backBtn.onclick = () => {
        closePublicEventDetail();
      };
    }
  }

  // If we open a different event, reset the sub-tab to info
  if (window.activePublicEventId !== eventId) {
    window.lastActiveEventSubTab = 'info';
    window.lastActivePublicBracketSubTab = null;
  }

  // Render the event content
  renderPublicEventDetail(event);

  // Set active public event ID for live score polling
  window.activePublicEventId = eventId;
  window.activeAdminEventId = null;
  ensureLivePollingStarted();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update BOC announcement banners visibility
  if (typeof updateBocBannersVisibility === 'function') {
    updateBocBannersVisibility();
  }
};

// Close public event detail and return to events tab
window.closePublicEventDetail = function() {
  const mainContent = document.querySelector('.main-content');
  const eventPage = document.getElementById('public-event-detail-page');

  if (eventPage) eventPage.style.display = 'none';
  if (mainContent) mainContent.style.display = '';

  // Update BOC announcement banners visibility
  if (typeof updateBocBannersVisibility === 'function') {
    updateBocBannersVisibility();
  }

  // Update URL to root with #events hash first to update the pathname
  window.history.pushState({}, '', '/#events');

  // Reset active public event ID
  window.activePublicEventId = null;

  // Restore events tab in the DOM without triggering a duplicate hashchange
  if (typeof switchTab === 'function') {
    switchTab('tab-events', false);
  }
};

// Live Event Polling System for real-time scores
window.activePublicEventId = null;
window.activeAdminEventId = null;
window.livePollingIntervalId = null;

function ensureLivePollingStarted() {
  if (window.livePollingIntervalId) return;
  window.livePollingIntervalId = setInterval(async () => {
    const activeId = window.activePublicEventId || window.activeAdminEventId;
    if (!activeId) {
      clearInterval(window.livePollingIntervalId);
      window.livePollingIntervalId = null;
      return;
    }

    const event = appData.events.find(e => e.id === activeId);
    if (!event || event.status !== "Ongoing") return;

    // Skip polling if the match control modal is open to avoid disrupting admin input
    const mcModal = document.getElementById("event-match-control-modal");
    if (mcModal && mcModal.style.display === "flex") return;

    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const events = await res.json();
        if (Array.isArray(events)) {
          const serverEvent = events.find(e => e.id === activeId);
          if (serverEvent) {
            const localIdx = appData.events.findIndex(e => e.id === activeId);
            if (localIdx !== -1) {
              const localEvent = appData.events[localIdx];
              // Check if bracket, status or results changed
              if (localEvent.bracket !== serverEvent.bracket || 
                  localEvent.status !== serverEvent.status || 
                  localEvent.results !== serverEvent.results) {
                
                appData.events[localIdx] = serverEvent;

                if (window.activePublicEventId === activeId) {
                  renderPublicEventDetail(serverEvent);
                }
                if (window.activeAdminEventId === activeId) {
                  openEventDetail(activeId, false);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching live event updates:", err);
    }
  }, 4000);
}

// Setup public event tabs navigation
function setupPublicEventTabsNavigation() {
  const tabButtons = document.querySelectorAll("#public-event-detail-page .pm-stab");
  tabButtons.forEach(btn => {
    // Remove existing event listener if any
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", () => {
      const tabId = newBtn.getAttribute("data-pub-event-tab");
      if (tabId) {
        window.lastActiveEventSubTab = tabId;
      }
      const parent = document.getElementById("public-event-detail-page");
      
      parent.querySelectorAll(".pm-stab").forEach(b => b.classList.remove("active"));
      newBtn.classList.add("active");

      parent.querySelectorAll(".pub-event-tab-content").forEach(pane => {
        pane.classList.remove("active");
        pane.style.display = "none";
      });

      const targetPane = document.getElementById(`pub-event-tab-${tabId}`);
      if (targetPane) {
        targetPane.classList.add("active");
        targetPane.style.display = "block";
      }
    });
  });
}

function renderBocPlayoffConsole(event) {
  // Update year labels
  const years = document.querySelectorAll("#pub-event-boc-view .dynamic-boc-year");
  years.forEach(el => {
    el.textContent = currentBocYear;
  });

  // Populate dynamic information tab fields
  const infoNotesEl = document.getElementById("boc-playoff-info-notes");
  const infoRulesEl = document.getElementById("boc-playoff-info-rules");
  const infoVenueEl = document.getElementById("boc-playoff-info-venue");
  const infoDateEl = document.getElementById("boc-playoff-info-date");

  const savedSchedule = (typeof bocSettings !== "undefined") ? bocSettings.playoff_schedule : null;
  const rulesVal = (typeof bocSettings !== "undefined") ? bocSettings.rules : "";

  const displayVal = rulesVal || event.description || "Turnamen Grand Final Battle of Champions POBSI Banjarnegara.";
  if (infoNotesEl) {
    infoNotesEl.textContent = displayVal;
  }
  if (infoRulesEl) {
    infoRulesEl.textContent = displayVal;
  }

  // Use schedule date, time, and venue if present in settings, otherwise fallback to event
  const scheduleDate = savedSchedule ? savedSchedule.date : "";
  const scheduleTime = savedSchedule ? savedSchedule.time : "";
  const scheduleVenue = savedSchedule ? savedSchedule.venue : "";

  let displayDate = scheduleDate || event.date || "-";
  if (scheduleDate && scheduleTime) {
    displayDate = `${scheduleDate} (Pukul ${scheduleTime} WIB)`;
  }

  if (infoVenueEl) {
    infoVenueEl.innerHTML = `<i class="fa-solid fa-location-dot text-accent" style="margin-right: 6px;"></i> ${scheduleVenue || event.venue || "POBSI BANJARNEGARA"}`;
  }
  if (infoDateEl) {
    infoDateEl.innerHTML = `<i class="fa-solid fa-calendar text-gold" style="margin-right: 6px;"></i> ${displayDate}`;
  }

  // Set background image
  const heroBg = document.getElementById("boc-playoff-hero-bg");
  if (heroBg) {
    const posterUrl = (event.elimination_type === 'boc' && typeof bocSettings !== 'undefined' && bocSettings.cover) 
      ? bocSettings.cover 
      : (event.poster && event.poster !== 'images/event-poster.png' && event.poster !== 'images/dashboard-hero.png' ? event.poster : 'images/dashboard-hero.png');
    heroBg.style.backgroundImage = `url('${posterUrl}')`;
  }

  // Set status & winner badges
  const statusBadge = document.getElementById("boc-playoff-status-badge");
  const winnerBadge = document.getElementById("boc-playoff-winner-badge");
  const winnerNameSpan = document.getElementById("boc-playoff-winner-name");

  let isCompleted = event.status === "Selesai";
  let isOngoing = event.status === "Ongoing";

  if (statusBadge) {
    statusBadge.style.background = "";
    statusBadge.style.color = "";
    statusBadge.style.border = "";
    statusBadge.style.animation = "";
    statusBadge.style.boxShadow = "";

    if (isCompleted) {
      statusBadge.textContent = "Selesai";
      statusBadge.className = "boc-playoff-status-badge";
      statusBadge.style.background = "linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)";
      statusBadge.style.color = "#fff";
      statusBadge.style.boxShadow = "0 0 15px rgba(56, 189, 248, 0.35)";
    } else if (isOngoing) {
      statusBadge.textContent = "Live Playoff";
      statusBadge.className = "boc-playoff-status-badge pulse-red";
    } else {
      statusBadge.textContent = "Mendatang";
      statusBadge.className = "boc-playoff-status-badge";
      statusBadge.style.background = "linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)";
      statusBadge.style.color = "#fff";
      statusBadge.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.35)";
    }
  }

  let bracketObj = {};
  try {
    bracketObj = JSON.parse(event.bracket || "{}");
  } catch (e) {}

  let winnerName = "";
  if (bracketObj.mainBracket && bracketObj.mainBracket[6] && bracketObj.mainBracket[6].winner) {
    winnerName = bracketObj.mainBracket[6].winner;
  }

  if (winnerBadge && winnerNameSpan) {
    if (winnerName) {
      winnerBadge.style.display = "inline-flex";
      winnerNameSpan.textContent = winnerName;
    } else {
      winnerBadge.style.display = "none";
    }
  }

  // Dynamic Champion Card Showcase
  const dynamicCardContainer = document.getElementById("boc-playoff-hero-dynamic-card-container");
  if (dynamicCardContainer) {
    const heroRight = dynamicCardContainer.parentElement;
    const prevYear = (parseInt(currentBocYear) - 1).toString();
    const defendingChampions = {
      "2028": { name: "Didon", club: "Platinum Billiard", year: "2027" },
      "2027": { name: "Rizky A.", club: "Victory Billiard", year: "2026" },
      "2026": { name: "Pak Teguh RD", club: "Victory Billiard", year: "2025" }
    };

    if (isCompleted && winnerName) {
      if (heroRight) heroRight.style.display = "flex";
      // Find winner details
      const winnerPlayer = (appData.players || []).find(p => p.name === winnerName) || (appData.standings || []).find(s => s.name === winnerName);
      const winnerClub = winnerPlayer ? winnerPlayer.club : "-";
      const winnerAvatar = (winnerPlayer && winnerPlayer.avatar && winnerPlayer.avatar.trim() !== '') ? winnerPlayer.avatar : 'images/player-avatar.png';

      dynamicCardContainer.innerHTML = `
        <div class="boc-finalist-profile-card top-seed" onclick="openAthleteProfile('${generateSlug(winnerName)}')" style="width: 100%; max-width: 320px; padding: 22px 24px; box-shadow: 0 0 25px rgba(251, 191, 36, 0.15); backdrop-filter: blur(12px);">
          <div style="position: absolute; top: 12px; right: 12px; font-size: 1.1rem; color: #fbbf24; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"><i class="fa-solid fa-crown"></i></div>
          <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #fbbf24; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 0 10px rgba(251, 191, 36, 0.3); background: rgba(0,0,0,0.2);">
            <img src="${winnerAvatar}" alt="${winnerName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/player-avatar.png'">
          </div>
          <span style="font-family: var(--font-headers); font-size: 0.72rem; font-weight: 800; color: #fbbf24; letter-spacing: 2px; text-transform: uppercase;">CHAMPION OF THE SEASON</span>
          <h3 style="font-family: var(--font-headers); font-size: 1.25rem; font-weight: 900; color: #fff; margin: 6px 0 2px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${winnerName}</h3>
          <span style="font-size: 0.78rem; color: rgba(255,255,255,0.7); font-weight: 600; margin-bottom: 12px;"><i class="fa-solid fa-shield-halved" style="color: #fbbf24; margin-right: 4px;"></i> ${winnerClub}</span>
          <div style="border-top: 1px solid rgba(251, 191, 36, 0.15); padding-top: 8px; width: 100%; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
            Grand Final ${currentBocYear} Winner
          </div>
        </div>
      `;
    } else {
      if (currentBocYear === "2026") {
        dynamicCardContainer.innerHTML = "";
        if (heroRight) heroRight.style.display = "none";
      } else {
        if (heroRight) heroRight.style.display = "flex";
        // Find defending champion details
        let defendingChamp = defendingChampions[currentBocYear];
        if (!defendingChamp) {
          // Try to find it dynamically from the previous year's event in appData.events
          const prevEvent = (appData.events || []).find(e => e.elimination_type === 'boc' && e.status === 'Selesai' && (e.title.includes(prevYear) || e.description?.includes(prevYear)));
          if (prevEvent) {
            try {
              const prevBracket = JSON.parse(prevEvent.bracket || "{}");
              const prevWinner = prevBracket.mainBracket && prevBracket.mainBracket[6] && prevBracket.mainBracket[6].winner;
              if (prevWinner) {
                const prevWinnerPlayer = (appData.players || []).find(p => p.name === prevWinner) || (appData.standings || []).find(s => s.name === prevWinner);
                defendingChamp = {
                  name: prevWinner,
                  club: prevWinnerPlayer ? prevWinnerPlayer.club : "-",
                  year: prevYear
                };
              }
            } catch (e) {}
          }
        }
        if (!defendingChamp) {
          defendingChamp = { name: "Didon", club: "Platinum Billiard", year: prevYear };
        }

        // Retrieve player data for defending champ to get avatar
        const defPlayer = (appData.players || []).find(p => p.name === defendingChamp.name) || (appData.standings || []).find(s => s.name === defendingChamp.name);
        const defAvatar = (defPlayer && defPlayer.avatar && defPlayer.avatar.trim() !== '') ? defPlayer.avatar : 'images/player-avatar.png';

        dynamicCardContainer.innerHTML = `
          <div class="boc-finalist-profile-card" onclick="openAthleteProfile('${generateSlug(defendingChamp.name)}')" style="width: 100%; max-width: 320px; padding: 22px 24px; backdrop-filter: blur(12px);">
            <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; background: rgba(0,0,0,0.2); transition: border-color 0.2s;">
              <img src="${defAvatar}" alt="${defendingChamp.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/player-avatar.png'">
            </div>
            <span style="font-family: var(--font-headers); font-size: 0.72rem; font-weight: 800; color: #fbbf24; letter-spacing: 2px; text-transform: uppercase;">DEFENDING CHAMPION</span>
            <h3 style="font-family: var(--font-headers); font-size: 1.25rem; font-weight: 900; color: #fff; margin: 6px 0 2px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${defendingChamp.name}</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 12px;"><i class="fa-solid fa-shield-halved" style="margin-right: 4px;"></i> ${defendingChamp.club}</span>
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px; width: 100%; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
              BOC ${defendingChamp.year} Winner
            </div>
          </div>
        `;
      }
    }
  }

  const prizeValEl = document.getElementById("boc-playoff-prize-val");
  if (prizeValEl) {
    prizeValEl.textContent = event.prizePool || "Rp 15.000.000";
  }

  // Parse participants
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (e) {}

  // Dynamic stats calculation for BATTLE OF CHAMPIONS season panel
  const currentYearEvents = (appData.events || []).filter(e => {
    const matchesYear = e.title.includes(currentBocYear) || e.description?.includes(currentBocYear) || e.date?.includes(currentBocYear);
    return matchesYear && e.status !== 'Cancelled';
  });

  // Filter sirkuit events (excluding the Grand Final playoff itself)
  const sirkuitEvents = currentYearEvents.filter(e => e.elimination_type !== 'boc');

  // Calculate unique participants across sirkuit events (no duplicates: 1 name = 1 count)
  const uniqueParticipants = new Set();
  sirkuitEvents.forEach(e => {
    let parts = [];
    try {
      parts = typeof e.participants === 'string' ? JSON.parse(e.participants || '[]') : (e.participants || []);
    } catch (err) {}
    if (Array.isArray(parts)) {
      parts.forEach(pName => {
        if (pName && pName.trim() !== '') {
          uniqueParticipants.add(pName.trim());
        }
      });
    }
  });

  // Calculate matches count in sirkuit events
  let totalMatchesCount = 0;
  sirkuitEvents.forEach(e => {
    let bracketData = null;
    try {
      bracketData = typeof e.bracket === 'string' ? JSON.parse(e.bracket || '{}') : (e.bracket || {});
    } catch (err) {}
    
    if (bracketData) {
      // 1. Group Stage matches
      if (bracketData.groups) {
        Object.values(bracketData.groups).forEach(g => {
          if (g && g.matches) {
            const matchesArr = Array.isArray(g.matches) ? g.matches : Object.values(g.matches);
            matchesArr.forEach(m => {
              if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
                if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
                  totalMatchesCount++;
                }
              }
            });
          }
        });
      }
      // 2. Main Bracket matches
      if (bracketData.mainBracket) {
        Object.values(bracketData.mainBracket).forEach(m => {
          if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
            if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
              totalMatchesCount++;
            }
          }
        });
      }
      // 3. Loser Bracket matches (for Double Elimination)
      if (bracketData.loserBracket) {
        Object.values(bracketData.loserBracket).forEach(m => {
          if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
            if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
              totalMatchesCount++;
            }
          }
        });
      }
      // 4. Third Place match
      if (bracketData.thirdPlace) {
        const m = bracketData.thirdPlace;
        if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
          if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
            totalMatchesCount++;
          }
        }
      }
      // 5. Grand Final match
      if (bracketData.grandFinal) {
        const m = bracketData.grandFinal;
        if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
          if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
            totalMatchesCount++;
          }
        }
      }
      // 6. Replay match
      if (bracketData.grandFinalReplay) {
        const m = bracketData.grandFinalReplay;
        if (m && m.p1 && m.p2 && m.p1 !== 'TBD' && m.p2 !== 'TBD') {
          if (m.winner || m.status === 'completed' || m.s1 !== undefined || m.s2 !== undefined) {
            totalMatchesCount++;
          }
        }
      }
    }
  });

  // Filter sirkuit events to show count in series
  const sirkuitEventsCount = currentYearEvents.filter(e => e.elimination_type !== 'boc').length;

  // Fallback / standard default display if no database matches are recorded
  const finalSeriesVal = sirkuitEventsCount || 12;
  const finalParticipantsVal = uniqueParticipants.size || 487;
  const finalMatchesVal = totalMatchesCount || 2134;

  // Format values
  const seriesEl = document.getElementById("boc-stat-total-series");
  const participantsEl = document.getElementById("boc-stat-total-participants");
  const matchesEl = document.getElementById("boc-stat-total-matches");

  if (seriesEl) seriesEl.textContent = finalSeriesVal.toLocaleString('id-ID');
  if (participantsEl) participantsEl.textContent = finalParticipantsVal.toLocaleString('id-ID');
  if (matchesEl) matchesEl.textContent = finalMatchesVal.toLocaleString('id-ID');

  // Setup/Render Simulator (Grup & Knockout tabs)
  const simEl = document.getElementById("boc-playoff-bracket-simulator");
  const bannerEl = document.getElementById("boc-playoff-completion-banner");
  if (simEl) {
    renderBocBracketContent(simEl, bannerEl, event, bracketObj, participants, 16, false);
  }

  // Setup outer tab actions
  setupBocPlayoffTabs(event, participants, bracketObj);

  // Render lists
  renderBocFinalistsGrid(participants);
  renderBocPodium3D(event, bracketObj);

  // Set up CTA buttons click handlers (always active)
  const viewAllBtn = document.getElementById("boc-view-all-series-btn");
  if (viewAllBtn) {
    viewAllBtn.onclick = () => {
      const backBtn = document.getElementById("boc-playoff-back-btn");
      if (backBtn) backBtn.click();
    };
  }

  const viewBracketBtn = document.getElementById("boc-view-bracket-btn");
  if (viewBracketBtn) {
    viewBracketBtn.onclick = () => {
      const knockoutTabBtn = document.querySelector('.boc-playoff-stab[data-boc-playoff-tab="knockout"]');
      if (knockoutTabBtn) knockoutTabBtn.click();
    };
  }

  // Setup back button
  const backBtn = document.getElementById("boc-playoff-back-btn");
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      // Restore default active year in URL hash
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const publicPlayoffContainer = document.getElementById("boc-public-playoff-container");
        const publicStandingsContainer = document.getElementById("boc-public-standings-container");
        if (publicPlayoffContainer) publicPlayoffContainer.style.display = "none";
        if (publicStandingsContainer) publicStandingsContainer.style.display = "block";
        renderStandings();
        window.history.replaceState({}, "", "/#champions-" + currentBocYear);
      }
    };
  }
}

function setupBocPlayoffTabs(event, participants, bracketObj) {
  const tabs = document.querySelectorAll(".boc-playoff-stab");
  const panes = document.querySelectorAll(".boc-playoff-tab-content");
  
  const isCompleted = event.status === "Selesai";
  const podiumBtn = document.getElementById("boc-playoff-tab-podium-btn");
  if (podiumBtn) {
    podiumBtn.style.display = isCompleted ? "inline-flex" : "none";
  }

  tabs.forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      const target = tab.getAttribute("data-boc-playoff-tab");
      window.lastActivePublicBocOuterTab = target;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Hide all panes
      panes.forEach(pane => pane.style.display = "none");

      if (target === "info") {
        const infoPane = document.getElementById("boc-playoff-tab-info");
        if (infoPane) infoPane.style.display = "block";
      } else if (target === "group") {
        // Show simulator pane
        const simPane = document.getElementById("boc-playoff-tab-simulator-pane");
        if (simPane) simPane.style.display = "block";
        
        // Trigger internal group A tab inside the simulator
        const internalTabBtn = document.querySelector("#boc-playoff-bracket-simulator .boc-tab-btn[data-target='A']");
        if (internalTabBtn) internalTabBtn.click();
      } else if (target === "knockout") {
        // Show simulator pane
        const simPane = document.getElementById("boc-playoff-tab-simulator-pane");
        if (simPane) simPane.style.display = "block";

        // Trigger internal main bracket tab inside the simulator
        const internalTabBtn = document.querySelector("#boc-playoff-bracket-simulator .boc-tab-btn[data-target='main']");
        if (internalTabBtn) internalTabBtn.click();
      } else if (target === "finalists") {
        const finalistsPane = document.getElementById("boc-playoff-tab-finalists");
        if (finalistsPane) finalistsPane.style.display = "block";
      } else if (target === "podium") {
        const podiumPane = document.getElementById("boc-playoff-tab-podium");
        if (podiumPane) podiumPane.style.display = "block";
      }
    };
  });

  // Activate last active tab or info by default
  const activeTab = window.lastActivePublicBocOuterTab || "info";
  const targetTab = document.querySelector(`.boc-playoff-stab[data-boc-playoff-tab="${activeTab}"]`);
  if (targetTab && (activeTab !== "podium" || isCompleted)) {
    targetTab.click();
  } else {
    const defaultTab = document.querySelector(`.boc-playoff-stab[data-boc-playoff-tab="info"]`);
    if (defaultTab) defaultTab.click();
  }
}

function renderBocFinalistsGrid(participants) {
  const grid = document.getElementById("boc-playoff-finalists-grid");
  if (!grid) return;

  if (!participants || participants.length === 0) {
    grid.innerHTML = `<div style="color: var(--text-dim); text-align: center; grid-column: 1/-1; padding: 20px;">Belum ada finalis terdaftar.</div>`;
    return;
  }

  // Seeding order matches the rank of the players in standings, or simple participant index
  grid.innerHTML = participants.map((name, idx) => {
    const playerObj = (appData.standings || []).find(p => p.name === name);
    const originalPlayer = (appData.players || []).find(p => p.name === name);
    
    const rankVal = playerObj ? playerObj.rank : (idx + 1);
    const hcVal = originalPlayer ? originalPlayer.handicap : 4;
    const clubName = originalPlayer ? originalPlayer.club : "-";
    const pointsVal = playerObj ? playerObj.points : 0;
    
    // Top seeds get gold/highlight cards
    const isTopSeed = rankVal <= 4;
    const cardClass = isTopSeed ? "boc-finalist-profile-card top-seed" : "boc-finalist-profile-card other-seed";

    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    return `
      <div class="${cardClass}" onclick="openAthleteProfile('${generateSlug(name)}')">
        <div class="boc-finalist-avatar-wrap">
          <span class="boc-finalist-avatar-text">${initials}</span>
        </div>
        <h4 class="boc-finalist-name" title="${name}">${name}</h4>
        <span class="boc-finalist-club" title="${clubName}">${clubName}</span>
        <div class="boc-finalist-meta">
          <div class="boc-finalist-meta-item">
            <span class="boc-finalist-meta-val text-gold">HC ${hcVal}</span>
            <span class="boc-finalist-meta-lbl">Handicap</span>
          </div>
          <div class="boc-finalist-meta-item" style="border-left: 1px solid rgba(255,255,255,0.05);">
            <span class="boc-finalist-meta-val text-accent">${pointsVal} Pts</span>
            <span class="boc-finalist-meta-lbl">Sirkuit</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Helper to fetch athlete bracket statistics and scores for the premium hover drawer
function getPlayerBocStats(name, bracketObj) {
  if (!name || name === "TBD" || !bracketObj || !bracketObj.mainBracket) {
    return [];
  }
  const matches = [];
  
  // Check main bracket matches safely by checking both array and object structures
  const mainBracketKeys = Object.keys(bracketObj.mainBracket).sort((a, b) => parseInt(a) - parseInt(b));
  mainBracketKeys.forEach((key) => {
    const idx = parseInt(key);
    const m = bracketObj.mainBracket[key];
    if (m && (m.p1 === name || m.p2 === name) && m.status === 'completed') {
      const isP1 = m.p1 === name;
      const scoreSelf = isP1 ? m.s1 : m.s2;
      const scoreOpp = isP1 ? m.s2 : m.s1;
      const opponent = isP1 ? m.p2 : m.p1;
      const outcome = m.winner === name ? 'Menang' : 'Kalah';
      let roundName = 'Perempat Final';
      if (idx === 4 || idx === 5) roundName = 'Semifinal';
      if (idx === 6) roundName = 'Final';
      
      matches.push({
        roundName,
        opponent,
        scoreSelf,
        scoreOpp,
        outcome
      });
    }
  });

  // Check third place match
  const t3 = bracketObj.thirdPlace;
  if (t3 && (t3.p1 === name || t3.p2 === name) && t3.status === 'completed') {
    const isP1 = t3.p1 === name;
    const scoreSelf = isP1 ? t3.s1 : t3.s2;
    const scoreOpp = isP1 ? t3.s2 : t3.s1;
    const opponent = isP1 ? t3.p2 : t3.p1;
    const outcome = t3.winner === name ? 'Menang' : 'Kalah';
    matches.push({
      roundName: 'Perebutan Juara 3',
      opponent,
      scoreSelf,
      scoreOpp,
      outcome
    });
  }

  return matches.reverse(); // Show most recent (final/semi) matches first
}

// Lightweight self-contained canvas confetti particle generator
function triggerConfetti(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Fit to container dynamically
  const width = canvas.offsetWidth || canvas.parentElement.clientWidth || 800;
  const height = canvas.offsetHeight || canvas.parentElement.clientHeight || 450;
  canvas.width = width;
  canvas.height = height;

  const colors = ['#fbbf24', '#f59e0b', '#d97706', '#3b82f6', '#60a5fa', '#10b981', '#ffffff'];
  const particles = [];

  // Spawn initial burst of particles
  for (let i = 0; i < 90; i++) {
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 60,
      y: height - 40,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 6,
      r: Math.random() * 5 + 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      decay: Math.random() * 0.012 + 0.006,
      gravity: 0.28
    });
  }

  let animId;
  function updateFrame() {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach(p => {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (active) {
      animId = requestAnimationFrame(updateFrame);
    }
  }

  updateFrame();
}

// Global hook to launch celebration when clicking a player's medal/crown
window.triggerCrownCelebration = function() {
  const canvas = document.querySelector("#boc-playoff-podium-3d canvas");
  if (canvas) {
    triggerConfetti(canvas);
  }
};

function renderBocPodium3D(event, bracketObj) {
  const container = document.getElementById("boc-playoff-podium-3d");
  if (!container) return;

  const isCompleted = event.status === "Selesai";
  if (!isCompleted || !bracketObj.mainBracket) {
    container.innerHTML = `<div style="color: var(--text-dim); padding: 20px;">Podium juara akan ditampilkan setelah turnamen berakhir.</div>`;
    return;
  }

  // Get details helper for the podium players
  const getPlayerDetails = (name, customId) => {
    let searchName = name;
    if (name === "To'i PLT" || name === "TotiPLT") searchName = "To'i PLT";
    const p = (appData.players || []).find(x => x.name === searchName);
    
    let displayName = name;
    if (name === "To'i PLT") displayName = "TotiPLT";
    
    let avatarUrl = "";
    if (displayName === "TotiPLT") {
      avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=TotiPLT&hair=long19&hairColor=4b8a5f,50e3c2`;
    } else if (displayName === "Dodo RD") {
      avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=DodoRD&hair=curly&hairColor=8c5b30`;
    } else if (displayName === "Hendik PLT") {
      avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=HendikPLT&hair=short10&hairColor=a56950`;
    } else {
      avatarUrl = p && p.avatar ? p.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`;
    }

    return {
      name: displayName,
      realName: searchName,
      club: p ? p.club : (customId === 1 || customId === 3 ? "Platinum Billiard" : "RD Billiard"),
      handicap: p ? `HC ${p.handicap}` : (customId === 1 ? "HC 3N" : "HC 3A"),
      initials: displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase(),
      avatar: avatarUrl
    };
  };

  const mFinal = bracketObj.mainBracket[6] || {};
  const first = mFinal.winner || "To'i PLT";
  let second = "Dodo RD";
  if (mFinal.winner) {
    second = (mFinal.winner === mFinal.p1) ? mFinal.p2 : mFinal.p1;
  }
  const mT3 = bracketObj.thirdPlace || {};
  const third = mT3.winner || "Hendik PLT";

  const p1 = getPlayerDetails(first, 1);
  const p2 = getPlayerDetails(second, 2);
  const p3 = getPlayerDetails(third, 3);

  // Compute prizes
  const totalPrize = parseFloat((event.prizePool || "15.000.000").replace(/[^0-9]/g, '')) || 15000000;
  const prize1st = `Rp ${(totalPrize * 0.5).toLocaleString('id-ID')}`;
  const prize2nd = `Rp ${(totalPrize * 0.3).toLocaleString('id-ID')}`;
  const prize3rd = `Rp ${(totalPrize * 0.2).toLocaleString('id-ID')}`;

  const renderHoverCard = (player, pDetails) => {
    const stats = getPlayerBocStats(pDetails.realName, bracketObj);
    if (!stats || stats.length === 0) {
      return `
        <div class="podium-hover-card" onclick="openAthleteProfile('${generateSlug(pDetails.realName)}')">
          <div class="hover-card-title">HALL OF FAME</div>
          <div class="hover-card-divider"></div>
          <div style="font-size: 0.72rem; color: rgba(255,255,255,0.7); margin-bottom: 10px; flex-shrink: 0;">${pDetails.club}</div>
          <div class="hover-card-btn">Lihat Profil Lengkap <i class="fa-solid fa-arrow-right"></i></div>
        </div>
      `;
    }

    const matchesHtml = stats.map(m => {
      const isWin = m.outcome === 'Menang';
      const scoreStr = `${m.scoreSelf}-${m.scoreOpp}`;
      return `
        <div class="hover-card-match-item ${isWin ? 'win' : 'lose'}">
          <span style="font-weight: 700; color: rgba(255,255,255,0.5);">${m.roundName.substring(0, 5)}.</span>
          <span class="match-opponent">${m.opponent}</span>
          <span class="match-score">${scoreStr}</span>
        </div>
      `;
    }).join("");

    return `
      <div class="podium-hover-card" onclick="openAthleteProfile('${generateSlug(pDetails.realName)}')">
        <div class="hover-card-title">Perjalanan BOC</div>
        <div class="hover-card-divider"></div>
        <div style="width: 100%; max-height: 80px; overflow-y: auto; margin-bottom: 6px; flex-shrink: 0;">
          ${matchesHtml}
        </div>
        <div class="hover-card-btn">Lihat Profil Lengkap <i class="fa-solid fa-arrow-right"></i></div>
      </div>
    `;
  };

  // Render 3D Podium HTML inside container
  container.innerHTML = `
    <!-- Stadium Spotlight Background Beam -->
    <div class="podium-spotlight-beam"></div>

    <!-- 2nd Place Pedestal -->
    <div class="podium-pedestal-3d second" onclick="openAthleteProfile('${generateSlug(p2.realName)}')" style="cursor: pointer;">
      <div class="podium-avatar-wrap" onclick="event.stopPropagation(); window.triggerCrownCelebration();" title="Klik untuk selebrasi!">
        <img src="${p2.avatar}" alt="${p2.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="boc-finalist-avatar-text" style="display: none;">${p2.initials}</span>
      </div>
      <div class="podium-block">
        <span class="podium-player-name" title="${p2.name}">${p2.name}</span>
        <span class="podium-player-club" title="${p2.club}">${p2.club}</span>
        <span class="podium-player-hc" style="background: rgba(156, 163, 175, 0.15); color: #e2e8f0;">${p2.handicap}</span>
        <span class="podium-prize-tag">${prize2nd}</span>
      </div>
    </div>

    <!-- 1st Place Pedestal -->
    <div class="podium-pedestal-3d first" onclick="openAthleteProfile('${generateSlug(p1.realName)}')" style="cursor: pointer;">
      <div class="podium-avatar-wrap" onclick="event.stopPropagation(); window.triggerCrownCelebration();" title="Klik untuk selebrasi!">
        <img src="${p1.avatar}" alt="${p1.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="boc-finalist-avatar-text" style="color: #fbbf24; display: none;">${p1.initials}</span>
      </div>
      <div class="podium-block">
        <div class="champion-label" style="font-family: var(--font-headers); font-size: 0.65rem; font-weight: 800; color: #fbbf24; letter-spacing: 1px; border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 4px; padding: 2px 6px; margin-bottom: 6px; background: rgba(251, 191, 36, 0.08); flex-shrink: 0;">CHAMPION</div>
        <span class="podium-player-name" title="${p1.name}">${p1.name}</span>
        <span class="podium-player-club" title="${p1.club}">${p1.club}</span>
        <span class="podium-player-hc" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24;">${p1.handicap}</span>
        <span class="podium-prize-tag">${prize1st}</span>
      </div>
    </div>

    <!-- 3rd Place Pedestal -->
    <div class="podium-pedestal-3d third" onclick="openAthleteProfile('${generateSlug(p3.realName)}')" style="cursor: pointer;">
      <div class="podium-avatar-wrap" onclick="event.stopPropagation(); window.triggerCrownCelebration();" title="Klik untuk selebrasi!">
        <img src="${p3.avatar}" alt="${p3.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="boc-finalist-avatar-text" style="color: #fb923c; display: none;">${p3.initials}</span>
      </div>
      <div class="podium-block">
        <span class="podium-player-name" title="${p3.name}">${p3.name}</span>
        <span class="podium-player-club" title="${p3.club}">${p3.club}</span>
        <span class="podium-player-hc" style="background: rgba(217, 119, 6, 0.15); color: #fb923c;">${p3.handicap}</span>
        <span class="podium-prize-tag">${prize3rd}</span>
      </div>
    </div>
  `;

  // Render Top 16 Grid
  const top16Grid = document.getElementById("boc-top16-grid");
  if (top16Grid) {
    const finalistsData = [
      { name: "TotiPLT", realName: "To'i PLT", club: "Platinum Billiard", handicap: "3N", seed: 1, avatarSeed: "TotiPLT" },
      { name: "Dodo RD", realName: "Dodo RD", club: "RD Billiard", handicap: "3A", seed: 2, avatarSeed: "DodoRD" },
      { name: "Hendik PLT", realName: "Hendik PLT", club: "Platinum Billiard", handicap: "3A", seed: 3, avatarSeed: "HendikPLT" },
      { name: "Budi BSC", realName: "Pak Teguh RD", club: "BSC Billiard", handicap: "4A", seed: 4, avatarSeed: "BudiBSC" },
      { name: "Rian SB", realName: "Edo Luminous", club: "SB Billiard", handicap: "4B", seed: 5, avatarSeed: "RianSB" },
      { name: "Arifin PLT", realName: "Ageng PLT", club: "Platinum Billiard", handicap: "3B", seed: 6, avatarSeed: "ArifinPLT" },
      { name: "Yuda RD", realName: "Rio RD", club: "RD Billiard", handicap: "3B", seed: 7, avatarSeed: "YudaRD" },
      { name: "Fajar BSC", realName: "Rafael JP", club: "BSC Billiard", handicap: "4B", seed: 8, avatarSeed: "FajarBSC" },
      { name: "Agung SB", realName: "Santo Quantum", club: "SB Billiard", handicap: "4A", seed: 9, avatarSeed: "AgungSB" },
      { name: "Riko PLT", realName: "Faiz PLT", club: "Platinum Billiard", handicap: "3B", seed: 10, avatarSeed: "RikoPLT" },
      { name: "Iqbal RD", realName: "Tunggul RD", club: "RD Billiard", handicap: "3B", seed: 11, avatarSeed: "IqbalRD" },
      { name: "Dimas BSC", realName: "Didon", club: "BSC Billiard", handicap: "4B", seed: 12, avatarSeed: "DimasBSC" },
      { name: "Wahyu SB", realName: "Ade Atlas", club: "SB Billiard", handicap: "4B", seed: 13, avatarSeed: "WahyuSB" },
      { name: "Eko PLT", realName: "Akbar", club: "Platinum Billiard", handicap: "3B", seed: 14, avatarSeed: "EkoPLT" },
      { name: "Bayu RD", realName: "Doni Lalapo", club: "RD Billiard", handicap: "3B", seed: 14, avatarSeed: "BayuRD" },
      { name: "Tequh BSC", realName: "Dika Luminous", club: "BSC Billiard", handicap: "4B", seed: 16, avatarSeed: "TeguhBSC" }
    ];

    top16Grid.innerHTML = finalistsData.map(f => {
      const initials = f.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      let avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${f.avatarSeed}`;
      if (f.name === "TotiPLT") {
        avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=TotiPLT&hair=long19&hairColor=4b8a5f,50e3c2`;
      }
      return `
        <div class="boc-finalist-card-premium" onclick="openAthleteProfile('${generateSlug(f.realName)}')">
          <div class="rank-seed-badge">#${f.seed}</div>
          <div class="avatar-frame">
            <img src="${avatarUrl}" alt="${f.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span class="avatar-fallback" style="display: none;">${initials}</span>
          </div>
          <h4 class="player-name" title="${f.name}">${f.name}</h4>
          <p class="player-club" title="${f.club}">${f.club}</p>
          <span class="finalist-badge">Grand Finalist 2026</span>
        </div>
      `;
    }).join("");
  }

  // Render Season Awards
  const awardsGrid = document.getElementById("boc-awards-grid");
  if (awardsGrid) {
    const awardsData = [
      {
        type: "wins",
        icon: "fa-trophy",
        title: "MOST SERIES WINS",
        desc: "Pemain dengan kemenangan series terbanyak",
        player: "TotiPLT",
        realPlayer: "To'i PLT",
        stats: "4 Series",
        club: "Platinum Billiard",
        avatarSeed: "TotiPLT"
      },
      {
        type: "streak",
        icon: "fa-fire",
        title: "LONGEST WIN STREAK",
        desc: "Rentetan kemenangan terpanjang",
        player: "Rian SB",
        realPlayer: "Edo Luminous",
        stats: "11 Match",
        club: "SB Billiard",
        avatarSeed: "RianSB"
      },
      {
        type: "winrate",
        icon: "fa-bullseye",
        title: "HIGHEST WIN RATE",
        desc: "Persentase kemenangan tertinggi",
        player: "Arifin PLT",
        realPlayer: "Ageng PLT",
        stats: "78,6%",
        club: "Platinum Billiard",
        avatarSeed: "ArifinPLT"
      },
      {
        type: "finals",
        icon: "fa-star",
        title: "MOST FINALS APPEARANCE",
        desc: "Paling sering masuk final",
        player: "Dodo RD",
        realPlayer: "Dodo RD",
        stats: "6 Finals",
        club: "RD Billiard",
        avatarSeed: "DodoRD"
      },
      {
        type: "breakout",
        icon: "fa-award",
        title: "BREAKOUT PLAYER",
        desc: "Pemain paling berkembang",
        player: "Iqbal RD",
        realPlayer: "Tunggul RD",
        stats: "Rookie of the Year",
        club: "RD Billiard",
        avatarSeed: "IqbalRD"
      }
    ];

    awardsGrid.innerHTML = awardsData.map(a => {
      let avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${a.avatarSeed}`;
      if (a.player === "TotiPLT") {
        avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=TotiPLT&hair=long19&hairColor=4b8a5f,50e3c2`;
      }
      return `
        <div class="boc-award-card ${a.type}">
          <div class="award-icon-badge">
            <i class="fa-solid ${a.icon}"></i>
          </div>
          <div class="award-title-lbl">${a.title}</div>
          <div class="award-title-desc">${a.desc}</div>
          <div class="award-player-row" style="cursor: pointer;" onclick="openAthleteProfile('${generateSlug(a.realPlayer)}')">
            <div class="mini-avatar">
              <img src="${avatarUrl}" alt="${a.player}">
            </div>
            <h4 class="player-name">${a.player}</h4>
          </div>
          <div class="award-stats-lbl">${a.stats}</div>
          <p class="award-club-lbl">${a.club}</p>
        </div>
      `;
    }).join("");
  }

  // Render Dynamic Timeline from database events
  const timelineNodesContainer = document.querySelector(".boc-timeline-nodes");
  if (timelineNodesContainer) {
    let currentSirkuits = bocSirkuits || [];

    // If still empty, fallback to 12 placeholder series names
    if (currentSirkuits.length === 0) {
      currentSirkuits = [
        "RD HT", "JP HT", "LMS HT", "SYP HT", 
        "RD HT (2)", "JP HT (2)", "LMS HT (2)", "PLT HT", 
        "SYP HT (2)", "RD HT (3)", "Series 11", "Series 12"
      ];
    }

    let nodesHtml = "";
    currentSirkuits.forEach((sName, idx) => {
      const seriesNum = (idx + 1).toString().padStart(2, '0');
      // Find matching event in appData.events
      const matchingEvent = (appData.events || []).find(e => e.title.trim().toLowerCase() === sName.trim().toLowerCase());
      
      // If the overall Grand Final event is completed, all past series are completed!
      const isNodeCompleted = isCompleted || (matchingEvent && matchingEvent.status === "Selesai");
      
      let statusText = "Mendatang";
      let statusClass = "";
      let iconHtml = '<i class="fa-regular fa-circle"></i>';
      let clickHandler = "";
      let tooltipText = `${sName} - Mendatang`;

      if (matchingEvent) {
        clickHandler = `onclick="openEventDetail('${matchingEvent.id}')"`;
      }

      if (isNodeCompleted) {
        statusText = "Selesai";
        statusClass = "completed";
        iconHtml = '<i class="fa-solid fa-circle-check"></i>';
        
        let championName = "";
        if (matchingEvent) {
          try {
            const results = typeof matchingEvent.results === 'string' ? JSON.parse(matchingEvent.results || "{}") : (matchingEvent.results || {});
            championName = results.champion || "";
          } catch(e) {}
        }
        
        if (championName) {
          tooltipText = `${sName} (Selesai)\n🏆 Juara: ${championName}`;
        } else {
          tooltipText = `${sName} - Selesai`;
        }
      } else if (matchingEvent && (matchingEvent.status === "Ongoing" || matchingEvent.status === "Berjalan")) {
        statusText = "Berjalan";
        statusClass = "ongoing";
        iconHtml = '<i class="fa-solid fa-spinner fa-spin"></i>';
        tooltipText = `${sName} - Sedang Berjalan`;
      } else if (matchingEvent) {
        statusText = "Daftar";
        statusClass = "upcoming";
        iconHtml = '<i class="fa-solid fa-calendar-days"></i>';
        tooltipText = `${sName} - Pendaftaran Dibuka`;
      }

      nodesHtml += `
        <div class="boc-timeline-node ${statusClass}" ${clickHandler} title="${tooltipText}">
          <span class="node-num" style="text-overflow: ellipsis; overflow: hidden; max-width: 75px; white-space: nowrap; display: block; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.2px;">${sName}</span>
          <div class="node-status-dot">${iconHtml}</div>
          <span class="node-status-text">${statusText}</span>
        </div>
      `;
    });

    // Finally, append the Grand Final trophy node
    const gfStatusText = isCompleted ? "Juara" : (event.status === "Ongoing" ? "Berjalan" : "Mendatang");
    const gfClass = isCompleted ? "completed grandfinal trophy-glow" : (event.status === "Ongoing" ? "ongoing grandfinal" : "grandfinal");
    const gfIcon = '<i class="fa-solid fa-trophy"></i>';
    
    let gfTooltip = `Grand Final BOC ${currentBocYear}`;
    if (isCompleted) {
      let winnerName = "";
      if (bracketObj.mainBracket && bracketObj.mainBracket[6] && bracketObj.mainBracket[6].winner) {
        winnerName = bracketObj.mainBracket[6].winner;
      }
      if (winnerName) {
        gfTooltip = `Grand Final BOC ${currentBocYear}\n👑 Juara Utama: ${winnerName}`;
      }
    }

    nodesHtml += `
      <div class="boc-timeline-node ${gfClass}" title="${gfTooltip}">
        <span class="node-num text-gold" style="white-space: nowrap; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.2px;">GRAND FINAL</span>
        <div class="node-status-dot trophy-glow">${gfIcon}</div>
        <span class="node-status-text text-gold">${gfStatusText}</span>
      </div>
    `;

    timelineNodesContainer.innerHTML = nodesHtml;
  }

  // Create absolute confetti canvas overlay
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "4";
  container.appendChild(canvas);

  // Trigger celebration burst automatically when the podium finishes loading
  setTimeout(() => {
    triggerConfetti(canvas);
  }, 400);
}

// Render dynamic elements inside public event details view
function renderPublicEventDetail(event) {
  const stdView = document.getElementById("pub-event-standard-view");
  const bocView = document.getElementById("pub-event-boc-view");
  
  if (event.elimination_type === 'boc') {
    if (stdView) stdView.style.display = "none";
    if (bocView) bocView.style.display = "block";
    renderBocPlayoffConsole(event);
    return;
  }
  
  if (stdView) stdView.style.display = "block";
  if (bocView) bocView.style.display = "none";

  // 1. Populate basic info
  const titleEl = document.getElementById("pub-event-title");
  const dateEl = document.getElementById("pub-event-date");
  const venueEl = document.getElementById("pub-event-venue");
  const prizeEl = document.getElementById("pub-event-prizepool");
  const feeEl = document.getElementById("pub-event-entryfee");
  const descEl = document.getElementById("pub-event-description");
  const contactEl = document.getElementById("pub-event-contact-val");
  const feeValEl = document.getElementById("pub-event-fee-val");
  const heroEl = document.getElementById("pub-event-hero");

  if (titleEl) titleEl.textContent = event.title;
  if (dateEl) dateEl.textContent = event.date;
  if (venueEl) venueEl.textContent = event.venue;
  if (prizeEl) prizeEl.textContent = event.prizePool || "-";
  if (feeEl) feeEl.textContent = event.entryFee || "-";
  if (descEl) descEl.textContent = event.description || "Tidak ada deskripsi.";
  if (contactEl) contactEl.textContent = event.contact;
  if (feeValEl) feeValEl.textContent = event.entryFee || "-";

  // Dynamic Back Button Label
  const backTextEl = document.getElementById("pub-event-back-text");
  if (backTextEl) {
    if (event.elimination_type === 'boc') {
      backTextEl.textContent = "Kembali ke Battle of Champions";
    } else {
      backTextEl.textContent = "Kembali ke Event";
    }
  }

  // Toggle Registration Details visibility
  const regSection = document.getElementById("pub-event-registration-details-section");
  if (regSection) {
    if (event.elimination_type === 'boc') {
      regSection.style.display = "none";
    } else {
      regSection.style.display = "block";
    }
  }

  const heroBgEl = document.getElementById("pub-event-hero-bg");
  if (heroBgEl) {
    const posterUrl = (event.elimination_type === 'boc' && typeof bocSettings !== 'undefined' && bocSettings.cover) 
      ? bocSettings.cover 
      : (event.poster && event.poster !== 'images/event-poster.png' ? event.poster : 'images/event-poster.png');
    heroBgEl.style.backgroundImage = `url('${posterUrl}')`;
  }

  // Set fullscreen title and live badges
  const liveBadge = document.getElementById("pub-bracket-live-badge-indicator");
  const fsLiveBadge = document.getElementById("pub-fullscreen-live-badge");
  const fsTitle = document.getElementById("pub-fullscreen-title");
  
  if (fsTitle) fsTitle.textContent = event.title || "-";
  if (event.status === "Ongoing") {
    if (liveBadge) liveBadge.style.display = "inline-flex";
    if (fsLiveBadge) fsLiveBadge.style.display = "inline-flex";
  } else {
    if (liveBadge) liveBadge.style.display = "none";
    if (fsLiveBadge) fsLiveBadge.style.display = "none";
  }

  // 2. Status Badges & Summary Widgets
  const statusBadge = document.getElementById("pub-event-status-badge");
  let statusText = "Upcoming";
  let statusClass = "daftar";
  if (event.status === "Ongoing") {
    statusText = "LIVE / ONGOING";
    statusClass = "live";
  } else if (event.status === "Selesai") {
    statusText = "Completed";
    statusClass = "selesai";
  } else if (event.status === "Cancelled") {
    statusText = "Cancelled";
    statusClass = "selesai";
  }

  if (statusBadge) {
    statusBadge.textContent = statusText;
    statusBadge.className = `featured-status-badge ${statusClass}`;
  }

  const sumType = document.getElementById("pub-event-summary-type");
  const sumFormat = document.getElementById("pub-event-summary-format");
  const sumStatus = document.getElementById("pub-event-summary-status");
  const sumPrize = document.getElementById("pub-event-summary-prize");

  if (sumType) {
    if (event.elimination_type === "boc") {
      sumType.textContent = "Battle of Champions (BOC)";
    } else {
      sumType.textContent = event.type || "Home Tournament";
    }
  }
  if (sumFormat) {
    if (event.elimination_type === "boc") {
      sumFormat.textContent = "Kualifikasi Grup (Round-robin) + Knockout Bracket 8";
    } else if (event.bracket_size === "manual") {
      sumFormat.textContent = "Manual Input";
    } else {
      const elimType = event.elimination_type || "single";
      const elimLabels = {
        "single": "Single Elimination",
        "double_pool": "Double Elimination (Pool A & B)",
        "double_upper_lower": "Double Elimination (Upper-Lower Bracket)"
      };
      sumFormat.textContent = `${elimLabels[elimType] || "Single Elimination"} (${event.bracket_size} Pemain)`;
    }
  }
  if (sumStatus) {
    sumStatus.textContent = statusText;
    sumStatus.className = `text-${statusClass === 'daftar' ? 'green' : (statusClass === 'live' ? 'red' : 'muted')}`;
  }
  if (sumPrize) sumPrize.textContent = event.prizePool || "-";

  const sumMaxHc = document.getElementById("pub-event-summary-max-hc");
  if (sumMaxHc) sumMaxHc.textContent = event.max_hc || "Bebas";

  // 3. CTA Action
  const ctaWrap = document.getElementById("pub-event-reg-action-wrap");
  if (ctaWrap) {
    if (event.status === "Daftar") {
      ctaWrap.innerHTML = `
        <a href="https://wa.me/${event.contact.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary" style="padding: 10px 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-paper-plane"></i> Daftar via WhatsApp Sekarang
        </a>`;
    } else {
      ctaWrap.innerHTML = `<span style="color: var(--text-dim); font-size: 0.9rem; font-style: italic;"><i class="fa-solid fa-lock"></i> Pendaftaran ditutup. Turnamen sedang berjalan / telah selesai.</span>`;
    }
  }

  // 4. Participants count & list
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (e) {}

  const partCountEl = document.getElementById("pub-event-part-count");
  if (partCountEl) {
    const totalCap = event.bracket_size === "manual" ? "-" : event.bracket_size;
    partCountEl.textContent = `${participants.length} / ${totalCap}`;
  }

  const tbody = document.getElementById("pub-event-participants-tbody");
  if (tbody) {
    if (participants.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-dim); padding: 20px;">Belum ada peserta yang mendaftar.</td></tr>`;
    } else {
      tbody.innerHTML = participants.map((name, idx) => {
        const pAthlete = (appData.players || []).find(p => p.name === name);
        const club = pAthlete ? pAthlete.club : "-";
        const hc = pAthlete ? pAthlete.handicap : "-";
        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 700; color: #fff;">${name}</td>
            <td>${club}</td>
            <td class="text-center"><span class="table-badge-hc ${getHandicapColorClass(hc)}">HC ${hc}</span></td>
          </tr>`;
      }).join("");
    }
  }

  // 5. Adjust Tab Buttons Visibility
  const btnBracket = document.getElementById("pub-tab-btn-bracket");
  const btnResults = document.getElementById("pub-tab-btn-results");

  if (event.bracket_size === "manual") {
    if (btnBracket) btnBracket.style.display = "none";
  } else {
    if (event.status === "Daftar") {
      if (btnBracket) btnBracket.style.display = "none";
    } else {
      if (btnBracket) btnBracket.style.display = "inline-flex";
    }
  }

  const pubTabLiveBadge = document.getElementById("pub-tab-live-badge");
  if (pubTabLiveBadge) {
    pubTabLiveBadge.style.display = event.status === "Ongoing" ? "inline-flex" : "none";
  }

  if (event.status === "Selesai") {
    if (btnResults) btnResults.style.display = "block";
  } else {
    if (btnResults) btnResults.style.display = "none";
  }

  // Initialize tabs handlers
  setupPublicEventTabsNavigation();

  // Restore last active sub-tab or default to "Informasi"
  const targetSubTab = window.lastActiveEventSubTab || 'info';
  const tabBtn = document.querySelector(`#public-event-detail-page .pm-stab[data-pub-event-tab="${targetSubTab}"]`);
  if (tabBtn && tabBtn.style.display !== 'none') {
    tabBtn.click();
  } else {
    const defaultTabBtn = document.getElementById("pub-tab-btn-info");
    if (defaultTabBtn) {
      defaultTabBtn.click();
    }
  }

  // 6. Draw Bracket (if Ongoing/Completed and not manual)
  if (event.bracket_size !== "manual" && event.status !== "Daftar") {
    renderPublicBracket(event, participants);
  }

  // 7. Draw Results/Podium
  if (event.status === "Selesai") {
    renderPublicResults(event);
  }
}

// Render public read-only bracket visualization
// Render public read-only bracket visualization
function renderPublicBracket(event, participants) {
  const simEl = document.getElementById("pub-event-bracket-simulator");
  if (!simEl) return;

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (ex) {}

  const B = parseInt(event.bracket_size, 10) || 16;
  const elimType = event.elimination_type || "single";
  if (elimType === "boc") {
    renderBocBracketContent(simEl, null, event, bracket, participants, B, false);
    return;
  }

  let activeSubTab = "pub-upper";
  if (elimType === "double_pool") activeSubTab = "pub-poolA";
  if (window.lastActivePublicBracketSubTab) {
    const validTargets = elimType === "double_pool" 
      ? ["pub-poolA", "pub-poolB", "pub-grandFinal"] 
      : ["pub-upper", "pub-lower", "pub-grandFinal"];
    if (validTargets.includes(window.lastActivePublicBracketSubTab)) {
      activeSubTab = window.lastActivePublicBracketSubTab;
    }
  }

  const isTabActive = (target) => target === activeSubTab;

  if (Object.keys(bracket).length === 0) {
    simEl.innerHTML = `<div style="color: var(--text-dim); text-align: center; width:100%; padding:20px;">Bracket belum siap atau belum diacak.</div>`;
    return;
  }

  // Define column groupings
  // Define column groupings dynamically
  const roundColumns = [];
  {
    let currentStart = 0;
    let roundSize = B / 2;
    while (roundSize >= 1) {
      const matches = [];
      for (let i = 0; i < roundSize; i++) {
        matches.push(currentStart + i);
      }
      let title = "";
      if (roundSize === 1) title = "FINALS";
      else if (roundSize === 2) title = "SF";
      else if (roundSize === 4) title = "QF";
      else title = `R${roundSize * 2}`;
      
      roundColumns.push({ matches, title });
      currentStart += roundSize;
      roundSize /= 2;
    }
  }

  const lowerColumns = [];
  {
    let currentStart = 0;
    const numStages = 2 * Math.log2(B) - 2;
    for (let stage = 1; stage <= numStages; stage++) {
      const m = Math.floor((stage + 1) / 2);
      const size = B / Math.pow(2, m + 1);
      const matches = [];
      for (let i = 0; i < size; i++) {
        matches.push(currentStart + i);
      }
      const title = (stage === numStages) ? "L-Final" : `L-R${stage}`;
      lowerColumns.push({ matches, title });
      currentStart += size;
    }
  }

  // Inner rendering helper for normal sub-bracket columns
  const renderSubBracket = (subBracket, columns, context) => {
    const totalRounds = columns.length;

    const getRoundTitle = (titleVal) => {
      if (titleVal === "FINALS") return "Final";
      if (titleVal === "SF") return "Semi-finals";
      if (titleVal === "QF") return "Quarter-finals";
      if (titleVal.startsWith("R")) {
        const sizeStr = titleVal.substring(1);
        return `Round of ${sizeStr}`;
      }
      if (titleVal === "L-Final") return "Lower Final";
      if (titleVal.startsWith("L-R")) {
        const rNum = titleVal.substring(3);
        return `Lower Round ${rNum}`;
      }
      return titleVal;
    };

    const roundColumnsHtml = columns.map((rc, roundIdx) => {
      const isFirst = roundIdx === 0;

      const pairsHtml = rc.matches.map(idx => {
        const m = subBracket[idx] || { p1: "", p2: "", s1: "", s2: "", winner: "" };
        const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
        const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
        const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
        const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
        const p1Display = m.p1 ? `${m.p1}${p1HC}` : "TBD";
        const p2Display = m.p2 ? `${m.p2}${p2HC}` : "TBD";

        const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
        const raceToVal = m.raceTo || 4;

        // BYE detection
        const p1IsBye = m.p1 === "BYE";
        const p2IsBye = m.p2 === "BYE";
        const isByeMatch = (p1IsBye || p2IsBye) && m.winner;
        const p1ByeClass = p1IsBye ? ' bye-slot' : '';
        const p2ByeClass = p2IsBye ? ' bye-slot' : '';
        const byeMatchClass = isByeMatch ? ' bye-match' : '';

        const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
        const p1VoorTag = m.p1Voor && m.p1Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p1Voor] || m.p1Voor}</span>` : "";
        const p2VoorTag = m.p2Voor && m.p2Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p2Voor] || m.p2Voor}</span>` : "";

        return `
          <div class="bracket-match-pair${byeMatchClass}">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-slot-label" style="display: flex; align-items: center; gap: 4px;">
                  <span>M-${idx + 1} Race to ${raceToVal}</span>
                  ${isByeMatch ? `<span style="font-size: 0.65rem; color: var(--text-dim); font-style: italic; margin-left: 4px;">BYE</span>` : ''}
                  ${isLiveMatch ? `<span class="match-live-pulse-badge" style="margin-left: 4px;"><span class="pub-bracket-live-dot"></span> LIVE</span>` : ''}
                </div>
                <div class="bracket-player-slot ${m.winner === m.p1 && m.p1 ? 'winner' : (m.winner && m.p1 ? 'loser' : '')}${p1ByeClass}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p1 || 'TBD'}">${p1Display}</span>
                    ${p1VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s1 !== undefined && m.s1 !== "" ? m.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p2 && m.p2 ? 'winner' : (m.winner && m.p2 ? 'loser' : '')}${p2ByeClass}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p2 || 'TBD'}">${p2Display}</span>
                    ${p2VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s2 !== undefined && m.s2 !== "" ? m.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="bracket-round-column${isFirst ? ' round-first' : ''}">
          <div class="bracket-column-header">${getRoundTitle(rc.title)}</div>
          <div class="bracket-column-matches">
            ${pairsHtml}
          </div>
        </div>`;
    }).join("");

    // Calculate champion info
    const lastColumn = columns[totalRounds - 1];
    const finalMatchIdx = lastColumn.matches[0];
    const m = subBracket[finalMatchIdx] || { p1: "", p2: "", s1: "", s2: "", winner: "" };
    
    // Find athlete info for display
    const champAthlete = m.winner ? (appData.players || []).find(p => p.name === m.winner) : null;
    const champHC = champAthlete ? ` (HC ${champAthlete.handicap})` : "";
    const champDisplay = m.winner ? `${m.winner}${champHC}` : "TBD";
    
    // For voor tag:
    const winnerVoor = m.winner === m.p1 ? m.p1Voor : (m.winner === m.p2 ? m.p2Voor : null);
    const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
    const champVoorTag = winnerVoor && winnerVoor !== "9" ? `<span class="player-voor-tag">${voorLabels[winnerVoor] || winnerVoor}</span>` : "";

    let champLabel = `<i class="fa-solid fa-trophy text-gold"></i> CHAMPION`;
    if (context === 'poolA') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> POOL A WINNER`;
    else if (context === 'poolB') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> POOL B WINNER`;
    else if (context === 'upper') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> UPPER WINNER`;
    else if (context === 'lower') champLabel = `<i class="fa-solid fa-circle-check" style="color: var(--blue);"></i> LOWER WINNER`;

    const championColumnHtml = `
      <div class="bracket-round-column round-last">
        <div class="bracket-column-header">${champLabel}</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot champion-slot ${m.winner ? 'winner' : ''}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.winner || 'TBD'}">${champDisplay}</span>
                    ${champVoorTag}
                  </div>
                  <span class="bracket-player-score" style="background: rgba(245, 158, 11, 0.2); color: var(--gold);"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return roundColumnsHtml + championColumnHtml;
  };

  // Inner rendering helper for Grand Final
  const renderGrandFinalShowdown = (grandFinal, context) => {
    const m = grandFinal || { p1: "", p2: "", s1: "", s2: "", winner: "" };
    const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
    const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
    const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
    const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
    const p1Display = m.p1 ? `${m.p1}${p1HC}` : "TBD";
    const p2Display = m.p2 ? `${m.p2}${p2HC}` : "TBD";

    const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
    const raceToVal = m.raceTo || 4;

    const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
    const p1VoorTag = m.p1Voor && m.p1Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p1Voor] || m.p1Voor}</span>` : "";
    const p2VoorTag = m.p2Voor && m.p2Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p2Voor] || m.p2Voor}</span>` : "";

    // Find athlete info for display
    const champAthlete = m.winner ? (appData.players || []).find(p => p.name === m.winner) : null;
    const champHC = champAthlete ? ` (HC ${champAthlete.handicap})` : "";
    const champDisplay = m.winner ? `${m.winner}${champHC}` : "TBD";
    const winnerVoor = m.winner === m.p1 ? m.p1Voor : (m.winner === m.p2 ? m.p2Voor : null);
    const champVoorTag = winnerVoor && winnerVoor !== "9" ? `<span class="player-voor-tag">${voorLabels[winnerVoor] || winnerVoor}</span>` : "";

    // Playoff banner if same winner won both pools
    const finalMatchIdx = B - 2;
    const poolAWinner = bracket.poolA?.[finalMatchIdx]?.winner;
    const poolBWinner = bracket.poolB?.[finalMatchIdx]?.winner;
    const sameWinner = (poolAWinner && poolBWinner && poolAWinner === poolBWinner);

    let playoffBannerHtml = "";
    let grandFinalTitle = `Grand Final (Race to ${raceToVal})`;
    if (sameWinner) {
      grandFinalTitle = `Grand Final — Playoff Juara 2 (Race to ${raceToVal})`;
      playoffBannerHtml = `
        <div class="grand-final-playoff-notice" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; text-align: center; max-width: 600px; width: 100%;">
          <h4 style="margin: 0; color: var(--gold); font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fa-solid fa-crown text-gold"></i> Juara Umum Ditentukan</h4>
          <p style="margin: 4px 0 0 0; color: var(--text-main); font-size: 0.8rem;">
            <strong>${poolAWinner}</strong> menjuarai Pool A & Pool B secara tak terkalahkan! 
            Pertandingan di bawah adalah <strong>Playoff Perebutan Juara 2 (Runner-Up)</strong> antara runner-up Pool A & B.
          </p>
        </div>
      `;
    }

    return `
      ${playoffBannerHtml}
      <div class="bracket-round-column round-first" style="justify-content: center;">
        <div class="bracket-column-header">${grandFinalTitle}</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p1 && m.p1 ? 'winner' : (m.winner && m.p1 ? 'loser' : '')}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p1 || 'TBD'}">${p1Display}</span>
                    ${p1VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s1 !== undefined && m.s1 !== "" ? m.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p2 && m.p2 ? 'winner' : (m.winner && m.p2 ? 'loser' : '')}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p2 || 'TBD'}">${p2Display}</span>
                    ${p2VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s2 !== undefined && m.s2 !== "" ? m.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bracket-round-column round-last" style="justify-content: center;">
        <div class="bracket-column-header"><i class="fa-solid fa-trophy text-gold"></i> Champion</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot champion-slot ${m.winner ? 'winner' : ''}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.winner || 'TBD'}">${champDisplay}</span>
                    ${champVoorTag}
                  </div>
                  <span class="bracket-player-score" style="background: rgba(245, 158, 11, 0.2); color: var(--gold);"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Render based on elimination type
  if (elimType === "single") {
    simEl.innerHTML = renderSubBracket(bracket, roundColumns, 'default');
  } else if (elimType === "double_pool") {
    simEl.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div class="bracket-tabs-container" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 6px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-poolA') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-poolA" style="font-size: 0.8rem; font-weight: 700;">Pool A</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-poolB') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-poolB" style="font-size: 0.8rem; font-weight: 700;">Pool B</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-grandFinal') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-grandFinal" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-trophy text-gold"></i> Grand Final</button>
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-poolA" style="display: ${isTabActive('pub-poolA') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.poolA || {}, roundColumns, 'poolA')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-poolB" style="display: ${isTabActive('pub-poolB') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.poolB || {}, roundColumns, 'poolB')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-grandFinal" style="display: ${isTabActive('pub-grandFinal') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderGrandFinalShowdown(bracket.grandFinal, 'grandFinal')}
        </div>
      </div>
    `;
  } else if (elimType === "double_upper_lower") {
    simEl.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div class="bracket-tabs-container" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 6px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-upper') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-upper" style="font-size: 0.8rem; font-weight: 700;">Upper Bracket</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-lower') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-lower" style="font-size: 0.8rem; font-weight: 700;">Lower Bracket</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('pub-grandFinal') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="pub-grandFinal" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-trophy text-gold"></i> Grand Final</button>
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-upper" style="display: ${isTabActive('pub-upper') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.upper || {}, roundColumns, 'upper')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-lower" style="display: ${isTabActive('pub-lower') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.lower || {}, lowerColumns, 'lower')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-pub-grandFinal" style="display: ${isTabActive('pub-grandFinal') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderGrandFinalShowdown(bracket.grandFinal, 'grandFinal')}
        </div>
      </div>
    `;
  }

  // Setup tab switcher click behaviors for public view
  if (elimType !== "single") {
    const tabBtns = simEl.querySelectorAll(".pm-tab-btn");
    tabBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-target");
        window.lastActivePublicBracketSubTab = target;
        tabBtns.forEach(b => {
          b.classList.remove("pm-btn-primary");
          b.classList.add("pm-btn-outline");
        });
        btn.classList.remove("pm-btn-outline");
        btn.classList.add("pm-btn-primary");

        const panes = simEl.querySelectorAll(".tab-content-pane");
        panes.forEach(p => {
          p.style.display = p.id === `tab-pane-${target}` ? "flex" : "none";
        });
      };
    });
  }
}

// Render public podium card results
function renderPublicResults(event) {
  const container = document.getElementById("pub-event-results-container");
  if (!container) return;

  let results = {};
  try {
    results = JSON.parse(event.results || "{}");
  } catch (ex) {}

  if (!results.champion) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-dim); width: 100%;">
        <i class="fa-solid fa-trophy" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.3;"></i> 
        Hasil akhir turnamen belum diinput atau dipublikasikan.
      </div>`;
    return;
  }

  const getClub = (name) => {
    const p = (appData.players || []).find(a => a.name === name);
    return p ? p.club : "-";
  };

  const getPlayerAvatar = (name) => {
    const p = (appData.players || []).find(a => a.name === name);
    return p && p.avatar ? p.avatar : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
  };

  const recapData = getTournamentRecapData(event);
  const rowsHtml = recapData.map(r => {
    const slug = generateSlug(r.name);
    return `
      <tr onclick="openAthleteProfile('${slug}')" style="border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background-color 0.2s; ${r.isPromoted ? 'background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8;' : ''}" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.04)'" onmouseout="this.style.backgroundColor='${r.isPromoted ? 'rgba(56, 189, 248, 0.08)' : ''}'">
        <td style="font-weight: 700; color: ${r.rankOrder === 1 ? 'var(--gold)' : (r.rankOrder === 2 ? '#94a3b8' : (r.rankOrder === 3 ? '#b45309' : '#64748b'))};">${r.rankText}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; flex-shrink: 0;">
              <img src="${getPlayerAvatar(r.name)}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <span class="table-name-bold" style="transition: color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">${r.name}</span>
          </div>
        </td>
        <td>${r.club}</td>
        <td class="text-center" style="font-weight: 700; color: var(--accent);">+${r.pts} Pts</td>
        <td style="vertical-align: middle;">
          ${renderRecapHandicapProgress(r)}
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 10px; align-items: start;" id="event-results-podium-cards">
      <div class="podium-card runnerup" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 28px 20px; min-height: 360px; border: 1.5px solid rgba(37, 99, 235, 0.45); background: linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(9, 14, 26, 0.9) 100%); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12); border-radius: var(--radius-md);">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 60px; margin-bottom: 4px;">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 22 10 L 30 25 L 38 10 Z" fill="#2563eb"/>
            <path d="M 26 10 L 30 25 L 34 10 Z" fill="#60a5fa"/>
            <circle cx="30" cy="35" r="16" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
            <circle cx="30" cy="35" r="12" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1"/>
            <text x="30" y="39" font-family="var(--font-headers)" font-weight="900" font-size="13" fill="#475569" text-anchor="middle">2</text>
          </svg>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 10px; margin: 8px 0;">
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.25));"></div>
          <div class="podium-title" style="color: #cbd5e1; font-size: 0.8rem; margin: 0; white-space: nowrap;">RUNNER UP</div>
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, rgba(59, 130, 246, 0.25), transparent);"></div>
        </div>
        <div class="podium-avatar-wrapper" style="position: relative; margin: 16px auto; width: 100px; height: 100px; border-radius: 50%; border: 3px solid #cbd5e1; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); overflow: hidden; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform=''" onclick="openAthleteProfile('${generateSlug(results.runnerUp)}')">
          <img src="${getPlayerAvatar(results.runnerUp)}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div class="podium-name" style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#94a3b8'" onmouseout="this.style.color=''" onclick="openAthleteProfile('${generateSlug(results.runnerUp)}')">${results.runnerUp}</div>
        <div class="podium-club">${getClub(results.runnerUp)}</div>
      </div>
      <div class="podium-card champion" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 36px 24px; min-height: 440px; border: 2.5px solid var(--gold); background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(9, 14, 26, 0.9) 100%); box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); transform: translateY(-8px);">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 60px; margin-bottom: 4px;">
          <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 32 42 C 24 38 22 24 28 14" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M 31 38 C 28 38 27 34 30 33 C 32 34 32 37 31 38 Z" fill="#fbbf24"/>
            <path d="M 27 32 C 24 32 23 28 26 27 C 28 28 28 31 27 32 Z" fill="#fbbf24"/>
            <path d="M 25 25 C 22 25 21 21 24 20 C 26 21 26 24 25 25 Z" fill="#fbbf24"/>
            <path d="M 26 18 C 24 16 25 12 28 13 C 29 15 28 18 26 18 Z" fill="#fbbf24"/>
            <path d="M 68 42 C 76 38 78 24 72 14" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M 69 38 C 72 38 73 34 70 33 C 68 34 68 37 69 38 Z" fill="#fbbf24"/>
            <path d="M 73 32 C 76 32 77 28 74 27 C 72 28 72 31 73 32 Z" fill="#fbbf24"/>
            <path d="M 75 25 C 78 25 79 21 76 20 C 74 21 74 24 75 25 Z" fill="#fbbf24"/>
            <path d="M 74 18 C 76 16 75 12 72 13 C 71 15 72 18 74 18 Z" fill="#fbbf24"/>
            <path d="M 42 45 L 58 45 L 56 48 L 44 48 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
            <rect x="46" y="40" width="8" height="5" rx="1" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
            <path d="M 48 32 L 52 32 L 51 40 L 49 40 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
            <path d="M 38 16 L 62 16 C 62 16 62 32 50 32 C 38 32 38 16 38 16 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
            <path d="M 38 18 C 34 18 34 26 38 27" stroke="#fbbf24" stroke-width="2" fill="none"/>
            <path d="M 62 18 C 66 18 66 26 62 27" stroke="#fbbf24" stroke-width="2" fill="none"/>
            <circle cx="50" cy="22" r="3" fill="#ef4444"/>
          </svg>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 10px; margin: 8px 0;">
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.35));"></div>
          <div class="podium-title" style="color: var(--gold); font-size: 0.85rem; margin: 0; white-space: nowrap;">JUARA UTAMA</div>
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, rgba(245, 158, 11, 0.35), transparent);"></div>
        </div>
        <div class="podium-avatar-wrapper" style="position: relative; margin: 16px auto; width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--gold); box-shadow: 0 0 20px rgba(251, 191, 36, 0.55); overflow: hidden; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform=''" onclick="openAthleteProfile('${generateSlug(results.champion)}')">
          <img src="${getPlayerAvatar(results.champion)}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div class="podium-name" style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''" onclick="openAthleteProfile('${generateSlug(results.champion)}')">${results.champion}</div>
        <div class="podium-club">${getClub(results.champion)}</div>
      </div>
      <div class="podium-card top4" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 28px 20px; min-height: 360px; border: 1.5px solid rgba(217, 119, 6, 0.4); background: linear-gradient(180deg, rgba(217, 119, 6, 0.06) 0%, rgba(9, 14, 26, 0.9) 100%); box-shadow: 0 10px 25px rgba(217, 119, 6, 0.1); border-radius: var(--radius-md);">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 60px; margin-bottom: 4px;">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 22 10 L 30 25 L 38 10 Z" fill="#2563eb"/>
            <path d="M 26 10 L 30 25 L 34 10 Z" fill="#60a5fa"/>
            <circle cx="30" cy="35" r="16" fill="#b45309" stroke="#92400e" stroke-width="2"/>
            <circle cx="30" cy="35" r="12" fill="#b45309" stroke="#b45309" stroke-width="1"/>
            <text x="30" y="39" font-family="var(--font-headers)" font-weight="900" font-size="13" fill="#fff" text-anchor="middle">3</text>
          </svg>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 10px; margin: 8px 0;">
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.25));"></div>
          <div class="podium-title" style="color: #f59e0b; font-size: 0.8rem; margin: 0; white-space: nowrap;">SEMIFINALIS</div>
          <div style="flex-grow: 1; height: 1px; background: linear-gradient(90deg, rgba(217, 119, 6, 0.25), transparent);"></div>
        </div>
        <div style="display: flex; justify-content: center; gap: 16px; margin: 16px 0 8px 0; width: 100%;">
          ${(results.top4 || []).map(p => `
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
              <div class="podium-avatar-wrapper" style="position: relative; width: 80px; height: 80px; border-radius: 50%; border: 2.5px solid #b45309; box-shadow: 0 0 12px rgba(180, 83, 9, 0.25); overflow: hidden; cursor: pointer; transition: transform 0.2s; margin-bottom: 8px;" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform=''" onclick="openAthleteProfile('${generateSlug(p)}')">
                <img src="${getPlayerAvatar(p)}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="font-weight: 700; color: #fff; font-size: 0.9rem; cursor: pointer; transition: color 0.2s; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis;" onmouseover="this.style.color='#f59e0b'" onmouseout="this.style.color=''" onclick="openAthleteProfile('${generateSlug(p)}')" title="${p}">${p}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis;" title="${getClub(p)}">${getClub(p)}</div>
            </div>
          `).join("")}
          ${(!results.top4 || results.top4.length === 0) ? `<div class="podium-name">-</div>` : ''}
        </div>
      </div>
    </div>

    <div style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;">
      <h3 style="font-family: var(--font-headers); font-size: 1.15rem; font-weight: 800; color: #fff; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-list-check text-blue"></i> Rekap Hasil & Handicap Turnamen
      </h3>
      <div class="pm-table-container">
        <table class="pm-table">
          <thead>
            <tr>
              <th style="width: 120px;">Posisi</th>
              <th>Nama Pemain</th>
              <th>Klub</th>
              <th class="text-center" style="width: 120px;">Poin Sirkuit</th>
              <th class="text-center" style="width: 380px;">Progres & Kenaikan Handicap</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Main render function for athlete profile
function renderAthleteProfile(athlete) {
  if (!athlete) return;

  const rank = athlete.rank || 999;
  const name = athlete.name || 'Unknown';
  const club = athlete.club || '-';
  const hc = athlete.handicap || '-';
  const points = athlete.points || 0;
  const played = athlete.played || 0;
  const won = athlete.won || 0;
  const lost = athlete.lost || 0;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

  // Set cover picture dynamically with gradients
  const heroOverlay = document.querySelector('.ap-hero-bg-overlay');
  if (heroOverlay) {
    const coverUrl = athlete.cover || 'images/hero-player.png';
    heroOverlay.style.backgroundImage = `
      linear-gradient(90deg, rgba(7, 12, 25, 0.95) 0%, rgba(6, 11, 24, 0.88) 50%, rgba(7, 12, 25, 0.95) 100%),
      radial-gradient(circle at left center, rgba(37, 99, 235, 0.12) 0%, rgba(6, 11, 24, 0) 65%),
      url('${coverUrl}')
    `;
  }

  // Set avatar image
  const portraitImg = document.getElementById('ap-hero-portrait');
  if (portraitImg) {
    portraitImg.src = athlete.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    portraitImg.alt = name;
  }

  // Set avatar border class depending on rank
  const avatarWrapper = document.getElementById('ap-avatar-wrapper');
  if (avatarWrapper) {
    avatarWrapper.className = 'ap-hero-avatar-wrapper';
    if (rank === 1) avatarWrapper.classList.add('rank-gold');
    else if (rank === 2) avatarWrapper.classList.add('rank-silver');
    else if (rank === 3) avatarWrapper.classList.add('rank-bronze');
    else avatarWrapper.classList.add('rank-blue');
  }

  // Set avatar rank overlay badge
  const avatarRankBadge = document.getElementById('ap-avatar-rank-badge');
  if (avatarRankBadge) {
    if (rank === 1) avatarRankBadge.textContent = '🥇';
    else if (rank === 2) avatarRankBadge.textContent = '🥈';
    else if (rank === 3) avatarRankBadge.textContent = '🥉';
    else avatarRankBadge.textContent = '#' + rank;
  }

  // Set small elegant laurels rank badge next to name
  const laurelRank = document.getElementById('ap-laurel-rank-text');
  if (laurelRank) laurelRank.textContent = '#' + rank;

  // Hero name & breadcrumb
  const nameEl = document.getElementById('ap-hero-name');
  if (nameEl) nameEl.textContent = name;
  const breadcrumbEl = document.getElementById('ap-breadcrumb-name');
  if (breadcrumbEl) breadcrumbEl.textContent = name;

  // HC Badge
  const hcBadge = document.getElementById('ap-hc-badge');
  if (hcBadge) {
    hcBadge.textContent = 'HC ' + hc;
    hcBadge.className = 'ap-hc-badge table-badge-hc ' + getHandicapColorClass(hc);
  }

  // Club badge
  const clubBadge = document.getElementById('ap-club-badge');
  if (clubBadge) {
    clubBadge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> ' + club;
  }

  // KPI Cards
  const kpiPoints = document.getElementById('ap-kpi-points');
  if (kpiPoints) kpiPoints.textContent = points;
  const kpiRank = document.getElementById('ap-kpi-rank');
  if (kpiRank) kpiRank.textContent = '#' + rank;

  const eventScores = getPlayerEventScores(name, points);
  const eventsPlayed = eventScores.filter(s => s !== "").length;
  
  const kpiEvents = document.getElementById('ap-kpi-events');
  if (kpiEvents) kpiEvents.textContent = eventsPlayed;
  const kpiWinrate = document.getElementById('ap-kpi-winrate');
  if (kpiWinrate) kpiWinrate.textContent = winRate + '%';
  const kpiMatchesSub = document.getElementById('ap-kpi-matches-sub');
  if (kpiMatchesSub) kpiMatchesSub.textContent = 'Dari ' + (played || Math.max(eventsPlayed * 8, 4)) + ' Pertandingan';

  // Point Breakdown
  renderPointBreakdown(eventScores);

  // Ranking History Chart
  renderRankingHistoryChart(rank, points, eventsPlayed);

  // Tournament Results Table & Recent Results List
  renderTournamentResults(name, eventScores);

  // Club Information
  renderClubInfo(club);

  // Nearby Athletes
  renderNearbyAthletes(rank);

  // Qualification Banner
  renderQualificationBanner(rank);
}

// Render point breakdown horizontal progress bars
function renderPointBreakdown(eventScores) {
  const container = document.getElementById('ap-breakdown-grid');
  if (!container) return;

  const eventNames = [
    'RD HT', 'JP HT', 'LMS HT', 'SYP HT',
    'RD HT (2)', 'JP HT (2)', 'LMS HT (2)', 'PLT HT',
    'SYP HT (2)', 'RD HT (3)'
  ];

  const maxScore = 12; // Maximum possible score

  container.innerHTML = eventNames.map((eventName, idx) => {
    const score = eventScores[idx];
    const hasScore = score !== "" && score !== undefined && score !== null;
    const numScore = hasScore ? parseInt(score) : 0;
    
    let fillClass = 'fill-base';
    if (numScore === 12) fillClass = 'fill-champion';
    else if (numScore >= 7) fillClass = 'fill-podium';
    else if (numScore >= 3) fillClass = 'fill-finalist';
    else if (numScore >= 1) fillClass = 'fill-gold';

    if (!hasScore) {
      return `
        <div class="ap-breakdown-item">
          <span class="ap-breakdown-label">${eventName}</span>
          <div class="ap-breakdown-bar-track">
            <div class="ap-breakdown-bar-fill fill-base" style="width: 0%;"></div>
          </div>
          <span class="ap-breakdown-value ap-breakdown-no-score">0</span>
        </div>
      `;
    }

    return `
      <div class="ap-breakdown-item">
        <span class="ap-breakdown-label">${eventName}</span>
        <div class="ap-breakdown-bar-track">
          <div class="ap-breakdown-bar-fill ${fillClass}" style="width: 0%;"></div>
        </div>
        <span class="ap-breakdown-value">${numScore}</span>
      </div>
    `;
  }).join('');

  // Animate progress bars
  setTimeout(() => {
    const bars = container.querySelectorAll('.ap-breakdown-bar-fill');
    bars.forEach((bar, idx) => {
      const score = eventScores[idx];
      const hasScore = score !== "" && score !== undefined && score !== null;
      if (hasScore) {
        const pct = (parseInt(score) / maxScore) * 100;
        bar.style.width = pct + '%';
      }
    });
  }, 100);
}

// Render ranking history SVG chart (simulated progression)
function renderRankingHistoryChart(currentRank, totalPoints, eventsPlayed) {
  const container = document.getElementById('ap-ranking-chart');
  if (!container) return;

  const numPoints = 4;
  const dataPoints = [];
  
  let startRank = Math.min(currentRank + Math.floor(Math.random() * 8) + 6, 25);
  if (currentRank > 15) startRank = currentRank + 5;

  const step = (startRank - currentRank) / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    let r = Math.round(startRank - i * step);
    if (i === 1) r = Math.round(startRank - i * step + (Math.random() > 0.5 ? 1 : -1));
    dataPoints.push(Math.max(1, r));
  }
  dataPoints[numPoints - 1] = currentRank;

  const xLabels = ['BOC #1', 'BOC #2', 'BOC #3', 'BOC #4'];

  const isMobile = window.innerWidth < 768;
  const w = isMobile ? 360 : 780;
  const h = isMobile ? 180 : 220;
  const padLeft = isMobile ? 32 : 45;
  const padRight = isMobile ? 16 : 30;
  const padTop = isMobile ? 25 : 35;
  const padBottom = isMobile ? 25 : 35;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const minVal = 1;
  const maxVal = 20;
  const range = maxVal - minVal;

  const points = dataPoints.map((rank, i) => {
    const x = padLeft + (i / (numPoints - 1)) * plotW;
    const percentage = (rank - minVal) / range;
    const clampedPct = Math.min(Math.max(percentage, 0), 1);
    const y = padTop + clampedPct * plotH;
    return { x, y, rank };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.45;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.55;
    pathD += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
  }

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  let areaD = pathD + ` L ${lastPt.x} ${h - padBottom} L ${firstPt.x} ${h - padBottom} Z`;

  let gridLines = '';
  const yLabels = [1, 5, 10, 15, 20];
  yLabels.forEach(yVal => {
    const percentage = (yVal - minVal) / range;
    const y = padTop + percentage * plotH;
    gridLines += `<line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
    gridLines += `<text x="${padLeft - 12}" y="${y + 4}" fill="rgba(255,255,255,0.25)" font-size="10" text-anchor="end" font-family="Inter">#${yVal}</text>`;
  });

  let xLabelsHtml = '';
  points.forEach((pt, i) => {
    xLabelsHtml += `<text x="${pt.x}" y="${h - 8}" fill="rgba(255,255,255,0.35)" font-size="11" text-anchor="middle" font-family="Outfit" font-weight="700">${xLabels[i]}</text>`;
  });

  let dots = '';
  points.forEach((pt, i) => {
    const isLast = i === points.length - 1;
    const r = isLast ? 5.5 : 4.5;
    const fill = isLast ? '#fbbf24' : '#60a5fa';
    const glow = isLast ? `<circle cx="${pt.x}" cy="${pt.y}" r="11" fill="rgba(251,191,36,0.18)"/>` : '';
    dots += glow;
    dots += `<circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="${fill}" stroke="#070c19" stroke-width="2.5"/>`;
    dots += `<text x="${pt.x}" y="${pt.y - 12}" fill="${isLast ? '#fbbf24' : 'rgba(255,255,255,0.6)'}" font-size="11.5" font-family="Outfit" font-weight="900" text-anchor="middle">#${pt.rank}</text>`;
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">
      <defs>
        <linearGradient id="ap-chart-gradient-mock" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaD}" fill="url(#ap-chart-gradient-mock)"/>
      <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${xLabelsHtml}
    </svg>
  `;
}

// Render tournament results list and table
function renderTournamentResults(name, eventScores) {
  const recentList = document.getElementById('ap-recent-results-list');
  const bocTbody = document.getElementById('ap-boc-tbody');
  
  if (!recentList || !bocTbody) return;

  const eventNames = [
    'RD HT (Seri 1)', 'JP HT (Seri 1)', 'LMS HT (Seri 1)', 'SYP HT (Seri 1)',
    'RD HT (Seri 2)', 'JP HT (Seri 2)', 'LMS HT (Seri 2)', 'PLT HT',
    'SYP HT (Seri 2)', 'RD HT (Seri 3)'
  ];

  const dates = [
    '10 Feb 2025', '12 Mar 2025', '15 Apr 2025', '18 Mei 2025',
    '12 Jun 2025', '15 Jul 2025', '20 Ags 2025', '10 Sep 2025',
    '15 Okt 2025', '20 Nov 2025'
  ];

  function getMockPosition(score) {
    if (score === 12) return { text: 'Champion', badge: 'ap-badge-champion', ptsClass: '' };
    if (score === 9) return { text: 'Runner-Up', badge: 'ap-badge-runner', ptsClass: 'points-silver' };
    if (score === 7) return { text: 'Semifinal', badge: 'ap-badge-top8', ptsClass: 'points-blue' };
    if (score === 5) return { text: 'Top 8', badge: 'ap-badge-top8', ptsClass: 'points-blue' };
    if (score === 3) return { text: 'Top 16', badge: 'ap-badge-top16', ptsClass: 'points-blue' };
    if (score === 1) return { text: 'Top 32', badge: 'ap-badge-top16', ptsClass: 'points-blue' };
    return { text: 'Peserta', badge: 'ap-badge-top16', ptsClass: 'points-blue' };
  }

  const results = [];
  eventScores.forEach((score, idx) => {
    if (score !== "" && score !== undefined && score !== null) {
      results.push({ 
        event: eventNames[idx], 
        score: parseInt(score), 
        date: dates[idx] || '2025',
        idx 
      });
    }
  });

  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    recentList.innerHTML = '<div style="color:var(--text-muted); padding: 15px; text-align:center;">Belum ada hasil turnamen</div>';
    bocTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted); padding:20px;">Belum ada hasil turnamen</td></tr>';
    return;
  }

  // Populate RECENT RESULTS List (Up to 4 rows)
  const recentItems = results.slice(0, 4);
  recentList.innerHTML = recentItems.map(r => {
    const pos = getMockPosition(r.score);
    const crownIcon = r.score === 12 ? '<i class="fa-solid fa-crown" style="color:#fbbf24; margin-right:4px;"></i>' : '';
    return `
      <div class="ap-result-row-mock">
        <div class="ap-res-info">
          <span class="ap-res-title">${r.event}</span>
          <span class="ap-res-date">${r.date}</span>
        </div>
        <span class="ap-res-badge ${pos.badge}">${crownIcon}${pos.text}</span>
        <span class="ap-res-points ${pos.ptsClass}">${r.score} Poin</span>
      </div>
    `;
  }).join('');

  // Populate BATTLE OF CHAMPIONS RESULTS Table
  bocTbody.innerHTML = results.map(r => {
    const pos = getMockPosition(r.score);
    const posText = r.score === 12 ? '🥇 Champion' : (r.score === 9 ? '🥈 Runner-Up' : pos.text);
    return `
      <tr>
        <td class="ap-tbl-event-name">${r.event}</td>
        <td class="ap-tbl-date">${r.date}</td>
        <td style="font-weight: 700; color: ${r.score === 12 ? '#fbbf24' : '#fff'};">${posText}</td>
        <td class="text-center" style="font-weight:900; color:#fbbf24;">${r.score}</td>
        <td class="text-center"><span class="ap-status-pill">Completed</span></td>
      </tr>
    `;
  }).join('');
}

// Render club information
function renderClubInfo(clubName) {
  const titleEl = document.getElementById('ap-club-title');
  const locationEl = document.getElementById('ap-club-location');
  const athleteCountEl = document.getElementById('ap-club-athlete-count');
  const topRankEl = document.getElementById('ap-club-top-rank');
  const joinDateEl = document.getElementById('ap-club-join-date');

  if (titleEl) titleEl.textContent = clubName;
  if (locationEl) locationEl.textContent = 'Banjarnegara, Jawa Tengah';
  if (joinDateEl) joinDateEl.textContent = 'Januari 2025';

  const clubAthletes = appData.standings.filter(s => 
    s.club && s.club.toLowerCase() === clubName.toLowerCase()
  );
  if (athleteCountEl) athleteCountEl.textContent = clubAthletes.length + ' Atlet';
  
  if (topRankEl) {
    const bestRank = clubAthletes.reduce((min, a) => Math.min(min, a.rank || 999), 999);
    topRankEl.textContent = bestRank < 999 ? '#' + bestRank + ' BOC Ranking' : '-';
  }
}

// Render nearby athletes (rank ±3)
function renderNearbyAthletes(currentRank) {
  const container = document.getElementById('ap-nearby-list');
  if (!container) return;

  const nearby = appData.standings.filter(s => {
    const r = s.rank || 999;
    return r >= currentRank - 3 && r <= currentRank + 3 && r > 0 && r !== currentRank;
  }).sort((a, b) => a.rank - b.rank).slice(0, 3);

  if (nearby.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:10px;">Tidak ada data atlet terdekat.</p>';
    return;
  }

  container.innerHTML = nearby.map(athlete => {
    const slug = generateSlug(athlete.name);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(athlete.name)}`;
    
    const playerData = appData.players.find(p => p.name.toLowerCase() === athlete.name.toLowerCase());
    const avatar = playerData && playerData.avatar ? playerData.avatar : avatarUrl;

    return `
      <div class="ap-nearby-card-mock" onclick="openAthleteProfile('${slug}')">
        <span class="ap-nb-rank-box">#${athlete.rank}</span>
        <img src="${avatar}" alt="${athlete.name}" class="ap-nb-avatar">
        <div class="ap-nb-info">
          <div class="ap-nb-name">${athlete.name}</div>
          <div class="ap-nb-subtags">
            <span class="ap-nb-hc-pill table-badge-hc ${getHandicapColorClass(athlete.handicap)}">HC ${athlete.handicap}</span>
          </div>
        </div>
        <span class="ap-nb-pts">${athlete.points} Pts</span>
      </div>
    `;
  }).join('');
}

// Render qualification banner
function renderQualificationBanner(rank) {
  const banner = document.getElementById('ap-qualification-banner');
  if (!banner) return;

  if (rank <= 16) {
    banner.className = 'ap-qualification-banner';
    document.getElementById('ap-qual-title').textContent = 'Lolos Battle of Champions 2026';
    document.getElementById('ap-qual-desc').textContent = 'Atlet ini berada dalam zona 16 besar kualifikasi BOC — berhak tampil di babak final bergengsi.';
    banner.querySelector('.ap-qual-icon').className = 'fa-solid fa-crown ap-qual-icon';
  } else {
    banner.className = 'ap-qualification-banner ap-qual-out';
    document.getElementById('ap-qual-title').textContent = 'Di Luar Zona Kualifikasi';
    document.getElementById('ap-qual-desc').textContent = 'Atlet ini masih membutuhkan poin tambahan untuk menembus zona 16 besar kualifikasi BOC 2026.';
    banner.querySelector('.ap-qual-icon').className = 'fa-solid fa-circle-exclamation ap-qual-icon';
  }
}

// Scroll smoothly to results table
function scrollToBocResults() {
  const table = document.querySelector('.ap-col-boc-table');
  if (table) {
    table.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Share athlete profile
function shareAthleteProfile(platform) {
  const name = document.getElementById('ap-hero-name').textContent;
  const url = window.location.href;
  const text = name + ' — Profil Atlet POBSI Banjarnegara | Battle of Champions 2026';

  if (platform === 'whatsapp') {
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  } else if (platform === 'copy') {
    navigator.clipboard.writeText(url).then(() => {
      showCopyToast('Link profil berhasil disalin!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopyToast('Link profil berhasil disalin!');
    });
  }
}

// Show copy toast notification
function showCopyToast(message) {
  let toast = document.querySelector('.ap-copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'ap-copy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Show custom toast notification (success, error, info)
function showCustomToast(message, type = 'success') {
  let toastContainer = document.querySelector('.pm-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'pm-toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pm-toast pm-toast-${type}`;
  
  let icon = '<i class="fa-solid fa-circle-info"></i>';
  let borderCol = 'rgba(59, 130, 246, 0.3)';
  let bgCol = 'rgba(15, 23, 42, 0.95)';
  let textCol = '#60a5fa';
  
  if (type === 'success') {
    icon = '<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>';
    borderCol = 'rgba(34, 197, 94, 0.3)';
    textCol = '#4ade80';
  } else if (type === 'error') {
    icon = '<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i>';
    borderCol = 'rgba(239, 68, 68, 0.3)';
    textCol = '#f87171';
  }

  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${bgCol};
    border: 1px solid ${borderCol};
    backdrop-filter: blur(10px);
    padding: 12px 24px;
    border-radius: 50px;
    color: ${textCol};
    font-size: 0.85rem;
    font-weight: 700;
    box-shadow: 0 15px 40px rgba(0,0,0,0.5);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
  `;

  toast.innerHTML = `${icon} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Trigger reflow & show
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Hide and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 3000);
}

window.showCustomToast = showCustomToast;

// Dynamic Sirkuit Management Utilities
async function recalculateAndSyncAllStandings() {
  const standings = appData.standings || [];
  const totalPlayers = standings.length;
  for (let i = 0; i < totalPlayers; i++) {
    const player = standings[i];
    const scores = getPlayerEventScores(player.name, player.points);
    let totalPoints = 0;
    let played = 0;
    let won = 0;
    const lost = 0;
    
    scores.forEach(val => {
      if (val !== "" && val !== undefined) {
        totalPoints += parseInt(val, 10) || 0;
        played++;
        won++;
      }
    });
    
    player.points = totalPoints;
    player.played = played;
    player.won = won;
    player.lost = lost;
    
    if (isServerOnline) {
      try {
        const isLastPlayer = i === totalPlayers - 1;
        const url = `/api/standings${!isLastPlayer ? '?skipRank=true' : ''}`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: player.name,
            year: currentBocYear,
            club: player.club,
            handicap: player.handicap,
            points: totalPoints,
            played,
            won,
            lost,
            boc_points: JSON.stringify(exactBocPoints[player.name] || [])
          })
        });
      } catch (err) {
        console.error(`Failed to sync standings for ${player.name}:`, err);
      }
    }
  }
  
  standings.sort((a, b) => b.points - a.points);
  standings.forEach((p, idx) => p.rank = idx + 1);
  
  if (isServerOnline) {
    await loadDataFromApi();
  }
  loadHomeHighlights();
  renderStandings();
  renderAdminBocConsole();
  updateWorkspaceStats();
  renderWorkspacePreviews();
}

function renderManageSirkuitList() {
  const listEl = document.getElementById("boc-sirkuit-list");
  if (!listEl) return;
  
  listEl.innerHTML = bocSirkuits.map((sirkuit, idx) => {
    return `
      <li draggable="true" data-sirkuit-idx="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 4px; gap: 8px; cursor: grab; transition: opacity 0.2s, transform 0.2s, background 0.2s;">
        <div id="boc-sirkuit-display-${idx}" style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <span class="sirkuit-drag-handle" style="color: rgba(255,255,255,0.25); font-size: 1.1rem; cursor: grab; flex-shrink: 0; user-select: none; line-height: 1;" title="Seret untuk mengubah urutan">⠿</span>
          <span style="font-size: 0.88rem; font-weight: 700; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${idx + 1}. ${sirkuit}</span>
        </div>
        <div id="boc-sirkuit-edit-box-${idx}" style="display: none; align-items: center; gap: 6px; flex: 1; min-width: 0;">
          <input type="text" id="boc-sirkuit-edit-input-${idx}" value="${sirkuit}" style="padding: 4px 8px; font-size: 0.8rem; background: #0b1120; border: 1px solid #3b82f6; border-radius: 4px; color: #fff; flex: 1; min-width: 0;">
          <button onclick="saveSirkuitEdit(${idx})" class="pm-btn pm-btn-sm" style="padding: 4px 8px; background: #10b981; color: #fff; border: none; border-radius: 4px; cursor: pointer;" title="Simpan"><i class="fa-solid fa-check"></i></button>
          <button onclick="cancelSirkuitEdit(${idx})" class="pm-btn pm-btn-sm" style="padding: 4px 8px; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer;" title="Batal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button onclick="startSirkuitEdit(${idx})" class="pm-btn pm-btn-ghost pm-btn-sm" style="color: #60a5fa; padding: 4px; cursor: pointer; background: transparent; border: none;" title="Ubah Nama"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="deleteSirkuit(${idx})" class="pm-btn pm-btn-ghost pm-btn-sm" style="color: #ef4444; padding: 4px; cursor: pointer; background: transparent; border: none;" title="Hapus"><i class="fa-solid fa-trash"></i></button>
        </div>
      </li>
    `;
  }).join("");

  // Attach drag & drop event listeners
  initSirkuitDragAndDrop(listEl);
}

// Drag & Drop state
let _sirkuitDragIdx = null;

function initSirkuitDragAndDrop(listEl) {
  const items = listEl.querySelectorAll("li[draggable='true']");
  
  items.forEach(item => {
    item.addEventListener("dragstart", (e) => {
      _sirkuitDragIdx = parseInt(item.dataset.sirkuitIdx, 10);
      item.style.opacity = "0.35";
      item.style.transform = "scale(0.97)";
      e.dataTransfer.effectAllowed = "move";
      // Add a class marker to body so we can style drop targets
      document.body.classList.add("sirkuit-dragging");
    });

    item.addEventListener("dragend", () => {
      item.style.opacity = "1";
      item.style.transform = "";
      _sirkuitDragIdx = null;
      document.body.classList.remove("sirkuit-dragging");
      // Remove any lingering drop indicators
      listEl.querySelectorAll("li").forEach(li => {
        li.style.borderTop = "";
        li.style.borderBottom = "";
        li.style.background = "";
      });
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const targetIdx = parseInt(item.dataset.sirkuitIdx, 10);
      if (targetIdx === _sirkuitDragIdx) return;

      // Clear all indicators first
      listEl.querySelectorAll("li").forEach(li => {
        li.style.borderTop = "";
        li.style.borderBottom = "";
        li.style.background = "";
      });

      // Show drop indicator line
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        item.style.borderTop = "2px solid #3b82f6";
      } else {
        item.style.borderBottom = "2px solid #3b82f6";
      }
      item.style.background = "rgba(59,130,246,0.06)";
    });

    item.addEventListener("dragleave", () => {
      item.style.borderTop = "";
      item.style.borderBottom = "";
      item.style.background = "";
    });

    item.addEventListener("drop", async (e) => {
      e.preventDefault();
      const fromIdx = _sirkuitDragIdx;
      let toIdx = parseInt(item.dataset.sirkuitIdx, 10);
      if (fromIdx === null || fromIdx === toIdx) return;

      // Determine if drop is above or below midpoint
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY >= midY && toIdx < fromIdx) {
        toIdx++;
      } else if (e.clientY < midY && toIdx > fromIdx) {
        toIdx--;
      }

      if (fromIdx !== toIdx) {
        await window.reorderSirkuit(fromIdx, toIdx);
      }
    });
  });
}

window.reorderSirkuit = async function(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  
  // Move sirkuit name in the array
  const [movedSirkuit] = bocSirkuits.splice(fromIdx, 1);
  bocSirkuits.splice(toIdx, 0, movedSirkuit);
  localStorage.setItem(`bocSirkuits_${currentBocYear}`, JSON.stringify(bocSirkuits));
  await saveBocSirkuitsToServer(currentBocYear, bocSirkuits);

  // Move exactBocPoints scores for all players to maintain alignment
  Object.keys(exactBocPoints).forEach(pName => {
    const pts = exactBocPoints[pName];
    if (Array.isArray(pts)) {
      while (pts.length < bocSirkuits.length) {
        pts.push("");
      }
      const [movedPt] = pts.splice(fromIdx, 1);
      pts.splice(toIdx, 0, movedPt);
    }
  });
  localStorage.setItem("exactBocPoints", JSON.stringify(exactBocPoints));

  // Recalculate and sync all player standings to the database server
  await recalculateAndSyncAllStandings();

  // Re-render UI views
  renderManageSirkuitList();
  renderStandings();
  renderAdminBocConsole();
  
  showCustomToast("Urutan seri sirkuit berhasil diubah!", "success");
};

window.startSirkuitEdit = function(idx) {
  document.getElementById(`boc-sirkuit-display-${idx}`).style.display = "none";
  document.getElementById(`boc-sirkuit-edit-box-${idx}`).style.display = "flex";
};

window.cancelSirkuitEdit = function(idx) {
  document.getElementById(`boc-sirkuit-display-${idx}`).style.display = "flex";
  document.getElementById(`boc-sirkuit-edit-box-${idx}`).style.display = "none";
};

window.saveSirkuitEdit = async function(idx) {
  const input = document.getElementById(`boc-sirkuit-edit-input-${idx}`);
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) {
    showCustomToast("Nama sirkuit tidak boleh kosong!", "error");
    return;
  }
  
  bocSirkuits[idx] = newName;
  localStorage.setItem(`bocSirkuits_${currentBocYear}`, JSON.stringify(bocSirkuits));
  await saveBocSirkuitsToServer(currentBocYear, bocSirkuits);
  
  showCustomToast(`Sirkuit berhasil diubah menjadi "${newName}"`, "success");
  renderManageSirkuitList();
  
  renderStandings();
  renderAdminBocConsole();
};

window.deleteSirkuit = async function(idx) {
  const sirkuitName = bocSirkuits[idx];
  showCustomConfirm(
    "Hapus Seri Sirkuit",
    `Apakah Anda yakin ingin menghapus sirkuit "${sirkuitName}"? Hal ini juga akan menghapus poin seluruh atlet di sirkuit ini secara permanen.`,
    async () => {
      bocSirkuits.splice(idx, 1);
      localStorage.setItem(`bocSirkuits_${currentBocYear}`, JSON.stringify(bocSirkuits));
      await saveBocSirkuitsToServer(currentBocYear, bocSirkuits);
      
      // Clean up player points arrays
      Object.keys(exactBocPoints).forEach(name => {
        if (Array.isArray(exactBocPoints[name])) {
          exactBocPoints[name].splice(idx, 1);
        }
      });
      localStorage.setItem("exactBocPoints", JSON.stringify(exactBocPoints));
      
      showCustomToast(`Sirkuit "${sirkuitName}" berhasil dihapus.`, "success");
      renderManageSirkuitList();
      
      await recalculateAndSyncAllStandings();
    }
  );
};


// Show custom styled confirmation dialog
function showCustomConfirm(title, message, onConfirm, confirmText = "Hapus", type = "danger") {
  let modalOverlay = document.createElement('div');
  modalOverlay.className = 'pm-modal-overlay';
  modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 11000; animation: pmFadeIn 0.2s ease-out;';
  
  const modal = document.createElement('div');
  modal.className = 'pm-modal';

  let color = "#ef4444";
  let bg = "rgba(239, 68, 68, 0.1)";
  let border = "rgba(239, 68, 68, 0.2)";
  let shadow = "rgba(239, 68, 68, 0.25)";
  let icon = "fa-solid fa-triangle-exclamation";
  let borderStyle = "1px solid rgba(239, 68, 68, 0.25)";

  if (type === "warning") {
    color = "#fbbf24";
    bg = "rgba(251, 191, 36, 0.1)";
    border = "rgba(251, 191, 36, 0.2)";
    shadow = "rgba(251, 191, 36, 0.25)";
    borderStyle = "1px solid rgba(251, 191, 36, 0.25)";
  } else if (type === "primary" || type === "info") {
    color = "#3b82f6";
    bg = "rgba(59, 130, 246, 0.1)";
    border = "rgba(59, 130, 246, 0.2)";
    shadow = "rgba(59, 130, 246, 0.25)";
    borderStyle = "1px solid rgba(59, 130, 246, 0.25)";
    icon = "fa-solid fa-circle-question";
  }

  modal.style.cssText = `width: 420px; max-width: 90%; background: var(--bg-surface-solid); border: ${borderStyle}; border-radius: var(--radius-md); box-shadow: var(--shadow-lg), 0 0 35px ${bg}; padding: 24px; animation: pmSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);`;

  modal.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
      <div style="width: 44px; height: 44px; border-radius: 50%; background: ${bg}; border: 1px solid ${border}; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 1.25rem; flex-shrink: 0;">
        <i class="${icon}"></i>
      </div>
      <div style="min-width: 0; flex: 1;">
        <h3 style="font-family: var(--font-headers); font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 6px; text-align: left;">${title}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0; text-align: left;">${message}</p>
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 16px; margin-top: 12px;">
      ${confirmText === "Tutup" ? "" : `<button id="custom-confirm-btn-cancel" class="btn btn-secondary" style="padding: 8px 18px; font-size: 0.85rem; border-radius: var(--radius-sm); cursor: pointer;">Batal</button>`}
      <button id="custom-confirm-btn-confirm" class="btn" style="padding: 8px 18px; font-size: 0.85rem; border-radius: var(--radius-sm); background: ${color}; color: #fff; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px ${shadow};">${confirmText}</button>
    </div>
  `;

  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  const cleanUp = () => {
    modalOverlay.style.opacity = '0';
    setTimeout(() => modalOverlay.remove(), 200);
  };

  const cancelBtn = modal.querySelector('#custom-confirm-btn-cancel');
  const confirmBtn = modal.querySelector('#custom-confirm-btn-confirm');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      cleanUp();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      cleanUp();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanUp();
  });
}

// --- EVENT COMMAND CENTER - DASHBOARD ENGINE & COMMAND CONSOLE ---

let currentActiveEventId = null;
let currentEditEventPosterBase64 = "";
let upcomingPageStart = 0;
const upcomingPageSize = 4;
let eventDashboardLayout = 'grid'; // 'grid' or 'list'
let calCurrentMonth = new Date().getMonth();
let calCurrentYear = new Date().getFullYear();

// Helper to parse Year and Month from date string
function parseEventMonthYear(dateStr) {
  if (!dateStr) return { month: "LAINNYA", year: "LAINNYA", monthNum: 13 };
  
  const yearMatch = dateStr.match(/\b\d{4}\b/);
  const year = yearMatch ? yearMatch[0] : "Lainnya";
  
  const months = [
    { name: "JAN", patterns: ["jan", "januari"] },
    { name: "FEB", patterns: ["feb", "februari"] },
    { name: "MAR", patterns: ["mar", "maret"] },
    { name: "APR", patterns: ["apr", "april"] },
    { name: "MEI", patterns: ["mei", "may"] },
    { name: "JUN", patterns: ["jun", "juni"] },
    { name: "JUL", patterns: ["jul", "juli"] },
    { name: "AGU", patterns: ["agu", "agt", "agust", "agustus", "aug"] },
    { name: "SEP", patterns: ["sep", "september"] },
    { name: "OKT", patterns: ["okt", "oktober", "oct"] },
    { name: "NOV", patterns: ["nov", "november"] },
    { name: "DES", patterns: ["des", "desember", "dec"] }
  ];
  
  const lowerStr = dateStr.toLowerCase();
  let foundMonth = "LAINNYA";
  let monthNum = 13;
  
  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    if (m.patterns.some(p => lowerStr.includes(p))) {
      foundMonth = m.name;
      monthNum = i + 1;
      break;
    }
  }
  
  return { month: foundMonth, year: year, monthNum: monthNum };
}

// Helper to get status badge HTML
function getEventStatusBadge(status) {
  let text = "UPCOMING";
  let cls = "upcoming";
  
  if (status === "Ongoing") {
    text = "LIVE";
    cls = "live";
  } else if (status === "Selesai") {
    text = "COMPLETED";
    cls = "completed";
  } else if (status === "Cancelled") {
    text = "CANCELLED";
    cls = "cancelled";
  }
  
  return `<span class="admin-event-card-badge ${cls}">${text}</span>`;
}

// Helper to render an event card (Grid / List format)
function renderEventCard(e, isList = false) {
  let pCount = 0;
  try {
    pCount = JSON.parse(e.participants || "[]").length;
  } catch (ex) {}

  const isCompleted = e.status === "Selesai" || e.status === "Cancelled";
  const actionText = isCompleted ? "Lihat Hasil" : "Kelola Event";
  
  const posterUrl = (e.elimination_type === 'boc' && typeof bocSettings !== 'undefined' && bocSettings.cover) 
    ? bocSettings.cover 
    : (e.poster && e.poster !== 'images/event-poster.png' ? e.poster : 'images/event-poster.png');

  if (isList) {
    return `
      <div class="evt-list-row" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(15, 23, 50, 0.45); border: 1px solid var(--border-color); border-radius: 8px; gap: 16px; transition: all 0.2s;">
        <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
          <div style="width: 70px; height: 50px; border-radius: 6px; background-image: url('${posterUrl}'); background-size: cover; background-position: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.06);"></div>
          <div style="min-width: 0; flex: 1;">
            <h4 style="font-family: var(--font-headers); font-size: 0.95rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${e.title}</h4>
            <div style="display: flex; gap: 14px; font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap;">
              <span><i class="fa-solid fa-calendar" style="color: #94a3b8;"></i> ${e.date}</span>
              <span><i class="fa-solid fa-location-dot" style="color: #94a3b8;"></i> ${e.venue.split(",")[0]}</span>
              <span><i class="fa-solid fa-users" style="color: #94a3b8;"></i> ${pCount} Peserta</span>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          ${getEventStatusBadge(e.status).replace("position: absolute; top: 12px; left: 12px;", "font-size:0.65rem; padding: 4px 8px; border-radius: 4px; position: static;")}
          <button class="pm-btn pm-btn-sm pm-btn-outline" onclick="openEventDetail('${e.id}')" style="padding: 6px 12px; font-size: 0.78rem;">${actionText}</button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="admin-event-card" style="background: rgba(11, 17, 32, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, border-color 0.2s;">
      <div class="admin-event-card-banner" style="height: 140px; position: relative; background-size: cover; background-position: center; background-image: linear-gradient(180deg, rgba(6, 11, 24, 0.1) 0%, rgba(6, 11, 24, 0.8) 100%), url('${posterUrl}');">
        ${getEventStatusBadge(e.status)}
      </div>
      <div class="admin-event-card-body" style="padding: 16px 20px 20px 20px; display: flex; flex-direction: column; gap: 12px; flex-grow: 1;">
        <h4 class="admin-event-card-title" style="font-family: var(--font-headers); font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.3;">${e.title}</h4>
        <div class="admin-event-card-details" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; color: #94a3b8;">
          <span style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-calendar" style="width: 14px; text-align: center; color: #94a3b8;"></i> ${e.date}</span>
          <span style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-location-dot" style="width: 14px; text-align: center; color: #94a3b8;"></i> ${e.venue}</span>
          <span style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-users" style="width: 14px; text-align: center; color: #94a3b8;"></i> ${pCount} Peserta Terdaftar</span>
        </div>
        <div style="margin-top: auto; padding-top: 12px;">
          <button class="pm-btn pm-btn-ghost pm-btn-sm" onclick="openEventDetail('${e.id}')" style="color: #3b82f6; padding: 0; font-weight: 600; cursor: pointer; background: transparent; border: none; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; transition: color 0.2s;">
            ${actionText} <i class="fa-solid fa-arrow-right" style="font-size: 0.75rem;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Setup Event Management Listeners & Actions
function setupEventManagement() {
  // Bind Edit Poster Upload
  setupEventPosterUpload();

  // Lock bracket size to 16 when BOC elimination format is chosen
  const admElim = document.getElementById("adm-evt-elimination");
  if (admElim) {
    const handleCreateElimChange = () => {
      const sizeSelect = document.getElementById("adm-evt-bracket-size");
      if (sizeSelect) {
        if (admElim.value === "boc") {
          sizeSelect.value = "16";
          sizeSelect.disabled = true;
        } else {
          sizeSelect.disabled = false;
        }
      }
    };
    admElim.addEventListener("change", handleCreateElimChange);
    // Initial check
    handleCreateElimChange();
  }

  const editElim = document.getElementById("edit-evt-elimination");
  if (editElim) {
    const handleEditElimChange = () => {
      const sizeSelect = document.getElementById("edit-evt-bracket-size");
      if (sizeSelect) {
        if (editElim.value === "boc") {
          sizeSelect.value = "16";
          sizeSelect.disabled = true;
        } else {
          sizeSelect.disabled = false;
        }
      }
    };
    editElim.addEventListener("change", handleEditElimChange);
  }

  // Role Restriction Check
  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  const overlay = document.getElementById("restrict-event-detail-actions");
  if (overlay) {
    overlay.style.display = role === "staff" ? "flex" : "none";
  }
  const regForm = document.getElementById("event-register-athlete-form-wrap");
  if (regForm) {
    regForm.style.display = role === "staff" ? "none" : "flex";
  }

  // Dashboard Filters Listeners
  const searchInput = document.getElementById("event-search-input");
  const filterStatus = document.getElementById("event-filter-status");
  const filterYear = document.getElementById("event-filter-year");
  const filterType = document.getElementById("event-filter-type");
  const filterSort = document.getElementById("event-filter-sort");

  if (searchInput) searchInput.addEventListener("input", () => { upcomingPageStart = 0; renderAdminEventsDashboard(); });
  if (filterStatus) filterStatus.addEventListener("change", () => { upcomingPageStart = 0; renderAdminEventsDashboard(); });
  if (filterYear) filterYear.addEventListener("change", () => { upcomingPageStart = 0; renderAdminEventsDashboard(); });
  if (filterType) filterType.addEventListener("change", () => { upcomingPageStart = 0; renderAdminEventsDashboard(); });
  if (filterSort) filterSort.addEventListener("change", () => { upcomingPageStart = 0; renderAdminEventsDashboard(); });

  // Grid/List Layout Toggles
  const btnGrid = document.getElementById("btn-event-layout-grid");
  const btnList = document.getElementById("btn-event-layout-list");

  if (btnGrid && btnList) {
    btnGrid.addEventListener("click", () => {
      eventDashboardLayout = 'grid';
      btnGrid.className = "pm-btn pm-btn-ghost pm-btn-sm active";
      btnGrid.style.background = "rgba(59, 130, 246, 0.15)";
      btnGrid.style.color = "#60a5fa";
      btnGrid.style.borderColor = "rgba(59, 130, 246, 0.3)";
      
      btnList.className = "pm-btn pm-btn-ghost pm-btn-sm";
      btnList.style.background = "transparent";
      btnList.style.color = "var(--text-dim)";
      btnList.style.borderColor = "var(--border-color)";
      renderAdminEventsDashboard();
    });

    btnList.addEventListener("click", () => {
      eventDashboardLayout = 'list';
      btnList.className = "pm-btn pm-btn-ghost pm-btn-sm active";
      btnList.style.background = "rgba(59, 130, 246, 0.15)";
      btnList.style.color = "#60a5fa";
      btnList.style.borderColor = "rgba(59, 130, 246, 0.3)";

      btnGrid.className = "pm-btn pm-btn-ghost pm-btn-sm";
      btnGrid.style.background = "transparent";
      btnGrid.style.color = "var(--text-dim)";
      btnGrid.style.borderColor = "var(--border-color)";
      renderAdminEventsDashboard();
    });
  }

  // Upcoming Grid Pagination Arrows
  const btnPrev = document.getElementById("btn-upcoming-prev");
  const btnNext = document.getElementById("btn-upcoming-next");
  if (btnPrev && btnNext) {
    btnPrev.addEventListener("click", () => {
      if (upcomingPageStart > 0) {
        upcomingPageStart -= upcomingPageSize;
        renderAdminEventsDashboard();
      }
    });

    btnNext.addEventListener("click", () => {
      const events = appData.events || [];
      const searchVal = (document.getElementById("event-search-input")?.value || "").toLowerCase();
      const statusVal = document.getElementById("event-filter-status")?.value || "";
      const yearVal = document.getElementById("event-filter-year")?.value || "";
      const typeVal = document.getElementById("event-filter-type")?.value || "";

      const filtered = events.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(searchVal) || e.venue.toLowerCase().includes(searchVal) || (e.description && e.description.toLowerCase().includes(searchVal));
        const matchStatus = !statusVal || e.status === statusVal;
        const matchYear = !yearVal || parseEventMonthYear(e.date).year === yearVal;
        
        let matchType = true;
        if (typeVal === "BOC") matchType = e.title.toLowerCase().includes("boc");
        else if (typeVal === "Handicap") matchType = e.title.toLowerCase().includes("handicap");
        else if (typeVal === "Club") matchType = e.title.toLowerCase().includes("club") || e.title.toLowerCase().includes("championship");

        return matchSearch && matchStatus && matchYear && matchType;
      });

      const upcomingFiltered = filtered.filter(e => e.status === "Daftar" || e.status === "Ongoing");
      if (upcomingPageStart + upcomingPageSize < upcomingFiltered.length) {
        upcomingPageStart += upcomingPageSize;
        renderAdminEventsDashboard();
      }
    });
  }

  // Calendar prev/next buttons
  const btnCalPrev = document.getElementById("btn-cal-prev");
  const btnCalNext = document.getElementById("btn-cal-next");
  if (btnCalPrev && btnCalNext) {
    btnCalPrev.addEventListener("click", () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderCalendarWidget();
    });

    btnCalNext.addEventListener("click", () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderCalendarWidget();
    });
  }

  // Quick Action Shortcuts listeners
  const quickInputResults = document.getElementById("btn-quick-input-results");
  const quickPointDist = document.getElementById("btn-quick-point-dist");
  const quickExportEvents = document.getElementById("btn-quick-export-events");

  if (quickInputResults) {
    quickInputResults.addEventListener("click", () => {
      const activeEvent = (appData.events || []).find(e => e.status === "Ongoing") || (appData.events || [])[0];
      if (activeEvent) {
        openEventDetail(activeEvent.id);
        // Switch to bracket tab
        setTimeout(() => {
          const btn = document.querySelector(`#pane-event-detail .pm-stab[data-event-tab="bracket"]`);
          if (btn) btn.click();
        }, 150);
      } else {
        showCustomToast("Belum ada event terdaftar!", "error");
      }
    });
  }

  if (quickPointDist) {
    quickPointDist.addEventListener("click", () => {
      const event = (appData.events || [])[0];
      if (event) {
        openEventDetail(event.id);
        // Switch to points tab
        setTimeout(() => {
          const btn = document.querySelector(`#pane-event-detail .pm-stab[data-event-tab="points"]`);
          if (btn) btn.click();
        }, 150);
      } else {
        showCustomToast("Belum ada event terdaftar!", "error");
      }
    });
  }

  if (quickExportEvents) {
    quickExportEvents.addEventListener("click", () => {
      if (!appData.events || appData.events.length === 0) {
        showCustomToast("Tidak ada data event untuk diexport!", "error");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData.events, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `POBSI_Events_Report_${new Date().getFullYear()}.json`);
      dlAnchor.click();
      showCustomToast("Laporan data event berhasil diunduh!", "success");
    });
  }

  // --- BULK REGISTRATION MODAL LISTENERS ---
  // Use event delegation for opening the modal since the button can be dynamically generated
  document.addEventListener("click", (e) => {
    const target = e.target.closest("#btn-event-open-bulk-modal");
    if (target) {
      openEventBulkRegisterModal();
    }
  });

  const bulkModal = document.getElementById("event-bulk-register-modal");
  const bulkClose = document.getElementById("event-bulk-modal-close");
  const bulkCancel = document.getElementById("event-bulk-modal-btn-cancel");
  const bulkSave = document.getElementById("event-bulk-modal-btn-save");
  const bulkSearch = document.getElementById("event-bulk-search");
  const bulkSelectAll = document.getElementById("btn-event-bulk-select-all");
  const bulkDeselectAll = document.getElementById("btn-event-bulk-deselect-all");
  const bulkAutofill = document.getElementById("btn-event-autofill-quota");

  const hideBulkModal = () => {
    if (bulkModal) bulkModal.style.display = "none";
  };

  if (bulkClose) bulkClose.addEventListener("click", hideBulkModal);
  if (bulkCancel) bulkCancel.addEventListener("click", hideBulkModal);
  if (bulkModal) {
    bulkModal.addEventListener("click", (e) => {
      if (e.target === bulkModal) hideBulkModal();
    });
  }

  // Search input filtering
  if (bulkSearch) {
    bulkSearch.addEventListener("input", () => {
      renderBulkAthleteGrid(bulkTempSelected);
    });
  }

  // Select all visible athletes
  if (bulkSelectAll) {
    bulkSelectAll.addEventListener("click", () => {
      const query = (bulkSearch ? bulkSearch.value : "").toLowerCase();
      const athletes = appData.players || [];
      const visible = athletes.filter(a => a.name.toLowerCase().includes(query));
      const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!activeEvent) return;
      const B = activeEvent.bracket_size || "16";

      // Add each visible athlete to temp list if not already there, respecting capacity and handicap
      let skippedCount = 0;
      for (const athlete of visible) {
        if (!isHandicapAllowed(athlete.handicap, activeEvent.max_hc)) {
          skippedCount++;
          continue;
        }
        if (!bulkTempSelected.includes(athlete.name)) {
          const limit = B === "manual" ? null : parseInt(B, 10);
          if (limit !== null && bulkTempSelected.length >= limit) {
            showCustomToast(`Kapasitas penuh! Hanya dapat memilih maksimal ${limit} atlet.`, "error");
            break;
          }
          bulkTempSelected.push(athlete.name);
        }
      }
      if (skippedCount > 0) {
        showCustomToast(`${skippedCount} atlet dilewati karena handicap melebihi batas maksimal event!`, "warning");
      }
      renderBulkAthleteGrid(bulkTempSelected);
    });
  }

  // Deselect all visible athletes
  if (bulkDeselectAll) {
    bulkDeselectAll.addEventListener("click", () => {
      const query = (bulkSearch ? bulkSearch.value : "").toLowerCase();
      const athletes = appData.players || [];
      const visible = athletes.filter(a => a.name.toLowerCase().includes(query));
      
      // Remove all visible athletes from temp list
      bulkTempSelected = bulkTempSelected.filter(name => !visible.some(a => a.name === name));
      renderBulkAthleteGrid(bulkTempSelected);
    });
  }

  // Auto-fill remaining quota from rankings
  if (bulkAutofill) {
    bulkAutofill.addEventListener("click", () => {
      const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!activeEvent) return;
      const B = activeEvent.bracket_size || "16";
      if (B === "manual") {
        showCustomToast("Auto-fill tidak tersedia untuk tipe manual/tanpa bracket.", "error");
        return;
      }
      const capacity = B === "manual" ? 0 : parseInt(B, 10);
      if (bulkTempSelected.length >= capacity) {
        showCustomToast(`Kapasitas kuota sudah penuh (${bulkTempSelected.length}/${capacity})!`, "error");
        return;
      }

      // Sort standings by points descending (or rank ascending)
      const sortedStandings = [...(appData.standings || [])].sort((a, b) => {
        const rankA = parseInt(a.rank, 10) || 999;
        const rankB = parseInt(b.rank, 10) || 999;
        if (rankA !== rankB) return rankA - rankB;
        const ptsA = parseFloat(a.points) || 0;
        const ptsB = parseFloat(b.points) || 0;
        return ptsB - ptsA;
      });

      // Find players in standings not in tempSelected, respecting Max HC
      let addedCount = 0;
      for (const player of sortedStandings) {
        if (!bulkTempSelected.includes(player.name)) {
          // Verify that this player actually exists in players database to avoid ghost names
          const playerObj = (appData.players || []).find(p => p.name === player.name);
          if (playerObj) {
            // Check handicap eligibility
            if (!isHandicapAllowed(playerObj.handicap, activeEvent.max_hc)) {
              continue;
            }
            bulkTempSelected.push(player.name);
            addedCount++;
            if (bulkTempSelected.length >= capacity) break;
          }
        }
      }

      // If capacity still not filled, fill with remaining players from players list alphabetically, respecting Max HC
      if (bulkTempSelected.length < capacity) {
        const sortedPlayers = [...(appData.players || [])].sort((a, b) => a.name.localeCompare(b.name));
        for (const p of sortedPlayers) {
          if (!isHandicapAllowed(p.handicap, activeEvent.max_hc)) {
            continue;
          }
          if (!bulkTempSelected.includes(p.name)) {
            bulkTempSelected.push(p.name);
            addedCount++;
            if (bulkTempSelected.length >= capacity) break;
          }
        }
      }

      showCustomToast(`Berhasil menambahkan ${addedCount} atlet teratas ke dalam daftar!`, "success");
      renderBulkAthleteGrid(bulkTempSelected);
    });
  }

  // Save selected athletes
  if (bulkSave) {
    bulkSave.addEventListener("click", async () => {
      const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!activeEvent) return;

      const B = activeEvent.bracket_size || "16";
      
      // Check if bracket simulation has already started
      let currentParticipants = [];
      try {
        currentParticipants = JSON.parse(activeEvent.participants || "[]");
      } catch (e) {}

      let bracket = {};
      try {
        bracket = JSON.parse(activeEvent.bracket || "{}");
      } catch (e) {}

      const hasActiveBracket = Object.keys(bracket).length > 0;
      const listChanged = JSON.stringify(currentParticipants.sort()) !== JSON.stringify([...bulkTempSelected].sort());

      const performSave = async () => {
        if (listChanged && hasActiveBracket) {
          activeEvent.bracket = "{}";
          activeEvent.results = "{}";
        }

        activeEvent.participants = JSON.stringify(bulkTempSelected);
        await saveEventDetails(activeEvent);
        showCustomToast("Pendaftaran massal berhasil disimpan!", "success");
        hideBulkModal();
        openEventDetail(activeEvent.id);
      };

      if (listChanged && hasActiveBracket) {
        showCustomConfirm(
          "Reset Bracket Turnamen?",
          "Perubahan daftar peserta akan mereset bagan pertandingan (bracket) yang sedang berjalan. Apakah Anda yakin?",
          performSave,
          "Reset",
          "warning"
        );
      } else {
        await performSave();
      }
    });
  }

  // Open bulk modal action
  function openEventBulkRegisterModal() {
    const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
    if (!activeEvent) return;

    let participants = [];
    try {
      participants = JSON.parse(activeEvent.participants || "[]");
    } catch (e) {}

    bulkTempSelected = [...participants];
    if (bulkSearch) bulkSearch.value = "";
    if (bulkModal) bulkModal.style.display = "flex";
    
    renderBulkAthleteGrid(bulkTempSelected);
  }

  // --- MATCH CONTROL MODAL LISTENERS ---
  const mcModal = document.getElementById("event-match-control-modal");
  const mcClose = document.getElementById("event-mc-modal-close");
  const mcCancel = document.getElementById("event-mc-modal-btn-cancel");
  const mcSave = document.getElementById("event-mc-modal-btn-save");
  
  const mcWoP1 = document.getElementById("btn-mc-wo-p1");
  const mcWoP2 = document.getElementById("btn-mc-wo-p2");
  const mcReset = document.getElementById("btn-mc-reset");

  const hideMcModal = () => {
    if (mcModal) mcModal.style.display = "none";
  };

  if (mcClose) mcClose.addEventListener("click", hideMcModal);
  if (mcCancel) mcCancel.addEventListener("click", hideMcModal);
  if (mcModal) {
    mcModal.addEventListener("click", (e) => {
      if (e.target === mcModal) hideMcModal();
    });
  }

  const directWinnerSelElement = document.getElementById("mc-direct-winner");
  if (directWinnerSelElement) {
    const handleDirectWinnerChange = () => {
      const isSelected = directWinnerSelElement.value !== "";
      const s1Input = document.getElementById("mc-s1-input");
      const s2Input = document.getElementById("mc-s2-input");
      const s1Minus = document.getElementById("btn-mc-s1-minus");
      const s1Plus = document.getElementById("btn-mc-s1-plus");
      const s2Minus = document.getElementById("btn-mc-s2-minus");
      const s2Plus = document.getElementById("btn-mc-s2-plus");
      
      if (s1Input) s1Input.disabled = isSelected;
      if (s2Input) s2Input.disabled = isSelected;
      if (s1Minus) s1Minus.disabled = isSelected;
      if (s1Plus) s1Plus.disabled = isSelected;
      if (s2Minus) s2Minus.disabled = isSelected;
      if (s2Plus) s2Plus.disabled = isSelected;
      
      if (isSelected) {
        if (s1Input) s1Input.value = "";
        if (s2Input) s2Input.value = "";
      }
    };
    directWinnerSelElement.addEventListener("change", handleDirectWinnerChange);
    window.updateDirectWinnerUI = handleDirectWinnerChange;
  }

  // Apply auto-calculated voor recommendation
  const mcApplyRec = document.getElementById("btn-mc-apply-recommendation");
  if (mcApplyRec) {
    mcApplyRec.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.mcActiveRecommendation) {
        const p1VoorSel = document.getElementById("mc-p1-voor");
        const p2VoorSel = document.getElementById("mc-p2-voor");
        if (p1VoorSel) p1VoorSel.value = window.mcActiveRecommendation.p1Voor || "9";
        if (p2VoorSel) p2VoorSel.value = window.mcActiveRecommendation.p2Voor || "9";
        showCustomToast("Rekomendasi voor diterapkan!", "success");
      }
    });
  }

  // WO Player 1 click
  if (mcWoP1) {
    mcWoP1.addEventListener("click", () => {
      const s1Input = document.getElementById("mc-s1-input");
      const s2Input = document.getElementById("mc-s2-input");
      const raceToInput = document.getElementById("mc-raceto-input");
      const raceToVal = raceToInput ? parseInt(raceToInput.value, 10) : 4;
      const raceTo = isNaN(raceToVal) || raceToVal < 1 ? 4 : raceToVal;
      if (s1Input && s2Input) {
        s1Input.value = raceTo.toString();
        s2Input.value = "0";
        showCustomToast(`Skor WO Pemain 1 terisi (${raceTo}-0)! Klik Simpan Skor untuk menyimpan.`, "success");
      }
    });
  }

  // WO Player 2 click
  if (mcWoP2) {
    mcWoP2.addEventListener("click", () => {
      const s1Input = document.getElementById("mc-s1-input");
      const s2Input = document.getElementById("mc-s2-input");
      const raceToInput = document.getElementById("mc-raceto-input");
      const raceToVal = raceToInput ? parseInt(raceToInput.value, 10) : 4;
      const raceTo = isNaN(raceToVal) || raceToVal < 1 ? 4 : raceToVal;
      if (s1Input && s2Input) {
        s1Input.value = "0";
        s2Input.value = raceTo.toString();
        showCustomToast(`Skor WO Pemain 2 terisi (0-${raceTo})! Klik Simpan Skor untuk menyimpan.`, "success");
      }
    });
  }

  // Plus/Minus Buttons Click Handler
  const s1InputEl = document.getElementById("mc-s1-input");
  const s2InputEl = document.getElementById("mc-s2-input");

  document.getElementById("btn-mc-s1-minus")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (s1InputEl) {
      let val = parseInt(s1InputEl.value, 10) || 0;
      if (val > 0) s1InputEl.value = val - 1;
    }
  });
  document.getElementById("btn-mc-s1-plus")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (s1InputEl) {
      let val = parseInt(s1InputEl.value, 10) || 0;
      s1InputEl.value = val + 1;
    }
  });
  document.getElementById("btn-mc-s2-minus")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (s2InputEl) {
      let val = parseInt(s2InputEl.value, 10) || 0;
      if (val > 0) s2InputEl.value = val - 1;
    }
  });
  document.getElementById("btn-mc-s2-plus")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (s2InputEl) {
      let val = parseInt(s2InputEl.value, 10) || 0;
      s2InputEl.value = val + 1;
    }
  });

  // Mulai Pertandingan (Start Match) Click Handler
  const mcStartMatch = document.getElementById("btn-mc-start-match");
  if (mcStartMatch) {
    mcStartMatch.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!mcActiveEventId || mcActiveMatchIdx === null) return;
      
      const event = appData.events.find(evt => evt.id === mcActiveEventId);
      if (!event) return;
      
      let bracket = {};
      try {
        bracket = JSON.parse(event.bracket || "{}");
      } catch (ex) {}
      
      const context = window.mcActiveContext || 'default';
      let match;
      if (context === 'default') {
        match = bracket[mcActiveMatchIdx];
      } else if (context === 'grandFinal') {
        match = bracket.grandFinal;
      } else {
        match = bracket[context]?.[mcActiveMatchIdx];
      }

      if (match) {
        match.status = "ongoing";
        // Initialize scores to 0 if empty
        if (match.s1 === "" || match.s1 === undefined || match.s1 === null) match.s1 = 0;
        if (match.s2 === "" || match.s2 === undefined || match.s2 === null) match.s2 = 0;
        
        event.bracket = JSON.stringify(bracket);
        await saveEventDetails(event);
        showCustomToast("Pertandingan dimulai (Status: LIVE)!", "success");
        hideMcModal();
        openEventDetail(event.id);
      }
    });
  }

  // Reset match score & cancel
  if (mcReset) {
    mcReset.addEventListener("click", () => {
      if (!mcActiveEventId || mcActiveMatchIdx === null) return;
      
      const performReset = async () => {
        const event = appData.events.find(evt => evt.id === mcActiveEventId);
        if (!event) return;
        
        let bracket = {};
        try {
          bracket = JSON.parse(event.bracket || "{}");
        } catch (e) {}

        const context = window.mcActiveContext || 'default';
        let match;
        if (context === 'default') {
          match = bracket[mcActiveMatchIdx];
        } else if (context === 'grandFinal') {
          match = bracket.grandFinal;
        } else {
          match = bracket[context]?.[mcActiveMatchIdx];
        }

        if (match) {
          match.s1 = "";
          match.s2 = "";
          match.winner = "";
        }

        if (context === 'default') {
          clearDownstreamMatches(bracket, mcActiveMatchIdx, mcActiveBracketSize);
        } else if (context === 'poolA' || context === 'poolB') {
          clearDownstreamMatchesDoublePool(bracket, mcActiveMatchIdx, context, mcActiveBracketSize);
        } else if (context === 'upper' || context === 'lower') {
          clearDownstreamMatchesDouble(bracket, mcActiveMatchIdx, context, mcActiveBracketSize);
        }

        if (event.status === "Selesai") {
          event.status = "Ongoing";
          event.results = "{}";
        }

        event.bracket = JSON.stringify(bracket);
        await saveEventDetails(event);
        showCustomToast("Pertandingan dibatalkan & skor direset!", "success");
        hideMcModal();
        openEventDetail(event.id);
      };

      showCustomConfirm(
        "Batalkan Pertandingan?",
        "Skor untuk pertandingan ini akan direset dan semua pertandingan babak selanjutnya yang bergantung pada pertandingan ini juga akan direset. Apakah Anda yakin?",
        performReset,
        "Reset",
        "danger"
      );
    });
  }

  // Save score click
  if (mcSave) {
    mcSave.addEventListener("click", async () => {
      if (!mcActiveEventId || mcActiveMatchIdx === null) return;

      const s1Val = document.getElementById("mc-s1-input")?.value.trim();
      const s2Val = document.getElementById("mc-s2-input")?.value.trim();
      const raceToVal = document.getElementById("mc-raceto-input")?.value.trim();
      const raceTo = raceToVal ? parseInt(raceToVal, 10) : 4;
      const directWinner = document.getElementById("mc-direct-winner")?.value || "";

      const hasS1 = s1Val !== "" && s1Val !== undefined && s1Val !== null;
      const hasS2 = s2Val !== "" && s2Val !== undefined && s2Val !== null;

      if (!directWinner && (hasS1 !== hasS2)) {
        showCustomToast("Kedua skor harus diisi jika ingin menyimpan hasil pertandingan!", "error");
        return;
      }

      const event = appData.events.find(evt => evt.id === mcActiveEventId);
      if (!event) return;

      let bracket = {};
      try {
        bracket = JSON.parse(event.bracket || "{}");
      } catch (e) {}

      const context = window.mcActiveContext || 'default';
      let match;
      if (context === 'default') {
        match = bracket[mcActiveMatchIdx];
      } else if (context === 'grandFinal') {
        match = bracket.grandFinal;
      } else if (context.startsWith('boc_group_')) {
        const groupKey = context.replace('boc_group_', '');
        match = bracket.groups?.[groupKey]?.matches?.[mcActiveMatchIdx];
      } else if (context === 'boc_main') {
        match = bracket.mainBracket?.[mcActiveMatchIdx];
      } else if (context === 'boc_thirdPlace') {
        match = bracket.thirdPlace;
      } else {
        match = bracket[context]?.[mcActiveMatchIdx];
      }

      if (!match) return;

      const p1VoorVal = document.getElementById("mc-p1-voor")?.value || "9";
      const p2VoorVal = document.getElementById("mc-p2-voor")?.value || "9";

      match.raceTo = isNaN(raceTo) || raceTo < 1 ? 4 : raceTo;
      match.p1Voor = p1VoorVal;
      match.p2Voor = p2VoorVal;

      const oldWinner = match.winner;
      let newWinner = "";
      let isCompleted = false;

      if (directWinner) {
        newWinner = (directWinner === "p1") ? match.p1 : match.p2;
        match.s1 = "";
        match.s2 = "";
        match.winner = newWinner;
        match.status = "completed";
        isCompleted = true;
      } else if (hasS1 && hasS2) {
        const s1 = parseInt(s1Val, 10);
        const s2 = parseInt(s2Val, 10);

        if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
          showCustomToast("Skor tidak valid!", "error");
          return;
        }

        if (s1 > raceTo || s2 > raceTo) {
          showCustomToast(`Skor tidak boleh melebihi Target Kemenangan (Race to ${raceTo})!`, "error");
          return;
        }

        match.s1 = s1;
        match.s2 = s2;

        if (s1 === raceTo || s2 === raceTo) {
          newWinner = s1 === raceTo ? match.p1 : match.p2;
          match.winner = newWinner;
          match.status = "completed";
          isCompleted = true;
        } else {
          // Intermediate score (match is ongoing / live)
          match.winner = "";
          match.status = "ongoing";

          if (oldWinner) {
            const B = mcActiveBracketSize;
            if (context === 'default') {
              clearDownstreamMatches(bracket, mcActiveMatchIdx, B);
            } else if (context === 'poolA' || context === 'poolB') {
              clearDownstreamMatchesDoublePool(bracket, mcActiveMatchIdx, context, B);
            } else if (context === 'upper' || context === 'lower') {
              clearDownstreamMatchesDouble(bracket, mcActiveMatchIdx, context, B);
            } else if (context === 'boc_main') {
              clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            } else if (context.startsWith('boc_group_')) {
              const groupKey = context.replace('boc_group_', '');
              recalculateGroupStandings(bracket.groups[groupKey]);
            }
          }
          showCustomToast("Skor live berhasil diperbarui!", "success");
        }
      }

      if (isCompleted) {
        const B = mcActiveBracketSize;

        if (context === 'default') {
          // --- SINGLE ELIMINATION ---
          const matchInfo = getNextMatchInfo(mcActiveMatchIdx, B);
          if (matchInfo.isFinal) {
            const runnerUp = newWinner === match.p1 ? match.p2 : match.p1;
            let t4_1 = "";
            let t4_2 = "";
            let t8 = [];

            // Semifinal matches are at B - 4 and B - 3
            const sf1 = bracket[B - 4];
            const sf2 = bracket[B - 3];
            if (sf1) t4_1 = sf1.winner === sf1.p1 ? sf1.p2 : sf1.p1;
            if (sf2) t4_2 = sf2.winner === sf2.p1 ? sf2.p2 : sf2.p1;

            // Quarterfinal matches are at B - 8 to B - 5
            for (let idx = B - 8; idx <= B - 5; idx++) {
              const qf = bracket[idx];
              if (qf) {
                const loser = qf.winner === qf.p1 ? qf.p2 : qf.p1;
                if (loser) t8.push(loser);
              }
            }

            event.results = JSON.stringify({
              champion: newWinner,
              runnerUp: runnerUp,
              top4: [t4_1, t4_2].filter(v => v && v !== 'BYE'),
              top8: t8.filter(v => v && v !== 'BYE')
            });

            event.status = "Selesai";
            showCustomToast("Turnamen selesai! Juara & podium ditentukan.", "success");
          } else {
            const nextMatchIdx = matchInfo.nextIdx;
            const isEven = matchInfo.isEven;

            if (oldWinner && oldWinner !== newWinner) {
              clearDownstreamMatches(bracket, mcActiveMatchIdx, B);
            }

            if (!bracket[nextMatchIdx]) {
              bracket[nextMatchIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
            }

            if (isEven) {
              bracket[nextMatchIdx].p1 = newWinner;
            } else {
              bracket[nextMatchIdx].p2 = newWinner;
            }
          }
        } else if (context.startsWith('boc_group_')) {
          const groupKey = context.replace('boc_group_', '');
          recalculateGroupStandings(bracket.groups[groupKey]);
          
          let allDone = true;
          const groupKeys = ["A", "B", "C", "D"];
          groupKeys.forEach(gk => {
            for (let i = 0; i < 6; i++) {
              if (!bracket.groups?.[gk]?.matches?.[i]?.winner) allDone = false;
            }
          });
          if (allDone) {
            showCustomToast("Seluruh pertandingan kualifikasi grup selesai! Babak Utama siap digenerate.", "success");
          }
        } else if (context === 'boc_main') {
          if (mcActiveMatchIdx === 0) {
            if (!bracket.mainBracket[4]) bracket.mainBracket[4] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[4].p1 = newWinner;
          } else if (mcActiveMatchIdx === 1) {
            if (!bracket.mainBracket[4]) bracket.mainBracket[4] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[4].p2 = newWinner;
          } else if (mcActiveMatchIdx === 2) {
            if (!bracket.mainBracket[5]) bracket.mainBracket[5] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[5].p1 = newWinner;
          } else if (mcActiveMatchIdx === 3) {
            if (!bracket.mainBracket[5]) bracket.mainBracket[5] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[5].p2 = newWinner;
          } else if (mcActiveMatchIdx === 4) {
            if (!bracket.mainBracket[6]) bracket.mainBracket[6] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 7 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[6].p1 = newWinner;
            
            const loser = newWinner === match.p1 ? match.p2 : match.p1;
            bracket.thirdPlace.p1 = loser;
          } else if (mcActiveMatchIdx === 5) {
            if (!bracket.mainBracket[6]) bracket.mainBracket[6] = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 7 };
            if (oldWinner && oldWinner !== newWinner) clearDownstreamBocMainMatches(bracket, mcActiveMatchIdx);
            bracket.mainBracket[6].p2 = newWinner;
            
            const loser = newWinner === match.p1 ? match.p2 : match.p1;
            bracket.thirdPlace.p2 = loser;
          } else if (mcActiveMatchIdx === 6) {
            checkAndFinalizeBoc(event, bracket);
          }
        } else if (context === 'boc_thirdPlace') {
          checkAndFinalizeBoc(event, bracket);
        } else if (context === 'poolA' || context === 'poolB') {
          // --- DOUBLE POOL (Pool A & B) ---
          const matchInfo = getNextMatchInfo(mcActiveMatchIdx, B);
          if (matchInfo.isFinal) {
            if (oldWinner && oldWinner !== newWinner) {
              clearDownstreamMatchesDoublePool(bracket, mcActiveMatchIdx, context, B);
            }
            if (context === 'poolA') {
              bracket.grandFinal.p1 = newWinner;
            } else {
              bracket.grandFinal.p2 = newWinner;
            }
            updateGrandFinalSlots(bracket, B);
            showCustomToast(`${context === 'poolA' ? 'Pool A' : 'Pool B'} selesai! Pemenang masuk ke Grand Final.`, "success");
          } else {
            const nextMatchIdx = matchInfo.nextIdx;
            const isEven = matchInfo.isEven;

            if (oldWinner && oldWinner !== newWinner) {
              clearDownstreamMatchesDoublePool(bracket, mcActiveMatchIdx, context, B);
            }

            const poolBracket = bracket[context];
            if (!poolBracket[nextMatchIdx]) {
              poolBracket[nextMatchIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
            }

            if (isEven) {
              poolBracket[nextMatchIdx].p1 = newWinner;
            } else {
              poolBracket[nextMatchIdx].p2 = newWinner;
            }
            updateGrandFinalSlots(bracket, B);
          }
        } else if (context === 'upper' || context === 'lower') {
          // --- DOUBLE UPPER & LOWER ---
          const matchInfo = getDoubleEliminationNextMatch(mcActiveMatchIdx, context, B);
          if (oldWinner && oldWinner !== newWinner) {
            clearDownstreamMatchesDouble(bracket, mcActiveMatchIdx, context, B);
          }

          if (matchInfo.isGrandFinal) {
            if (matchInfo.slot === 'p1') {
              bracket.grandFinal.p1 = newWinner;
            } else {
              bracket.grandFinal.p2 = newWinner;
            }
            showCustomToast(`Pemenang ${context === 'upper' ? 'Upper' : 'Lower'} bracket masuk ke Grand Final.`, "success");
          } else {
            // Non-grand final propagation
            const targetContext = matchInfo.isLower ? 'lower' : 'upper';
            const targetBracket = bracket[targetContext];
            const nextMatchIdx = matchInfo.nextIdx;
            
            if (!targetBracket[nextMatchIdx]) {
              targetBracket[nextMatchIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
            }

            if (matchInfo.isEven) {
              targetBracket[nextMatchIdx].p1 = newWinner;
            } else {
              targetBracket[nextMatchIdx].p2 = newWinner;
            }
          }

          // Loser drop calculation (only from upper bracket)
          if (context === 'upper' && matchInfo.loserIdx !== undefined) {
            const loser = newWinner === match.p1 ? match.p2 : match.p1;
            if (loser) {
              if (!bracket.lower[matchInfo.loserIdx]) {
                bracket.lower[matchInfo.loserIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
              }
              if (matchInfo.loserIsEven) {
                bracket.lower[matchInfo.loserIdx].p1 = loser;
              } else {
                bracket.lower[matchInfo.loserIdx].p2 = loser;
              }
            }
          }
        } else if (context === 'grandFinal') {
          // --- GRAND FINAL COMPLETED ---
          const runnerUp = newWinner === match.p1 ? match.p2 : match.p1;
          const elimType = event.elimination_type || "single";
          
          if (elimType === "double_pool") {
            const finalMatchIdx = B - 2;
            const poolAWinner = bracket.poolA?.[finalMatchIdx]?.winner;
            const poolBWinner = bracket.poolB?.[finalMatchIdx]?.winner;
            const sameWinner = (poolAWinner && poolBWinner && poolAWinner === poolBWinner);

            let eventChampion, eventRunnerUp, eventT4_1, eventT4_2;
            if (sameWinner) {
              eventChampion = poolAWinner;
              eventRunnerUp = newWinner; // winner of the playoff
              eventT4_1 = newWinner === match.p1 ? match.p2 : match.p1; // loser of the playoff
              eventT4_2 = "";
            } else {
              eventChampion = newWinner;
              eventRunnerUp = runnerUp;
              eventT4_1 = bracket.poolA[finalMatchIdx].winner === bracket.poolA[finalMatchIdx].p1 ? bracket.poolA[finalMatchIdx].p2 : bracket.poolA[finalMatchIdx].p1;
              eventT4_2 = bracket.poolB[finalMatchIdx].winner === bracket.poolB[finalMatchIdx].p1 ? bracket.poolB[finalMatchIdx].p2 : bracket.poolB[finalMatchIdx].p1;
            }

            let t8 = [];
            const sf1 = B - 4;
            const sf2 = B - 3;
            [bracket.poolA, bracket.poolB].forEach(pb => {
              if (pb[sf1]) {
                const l1 = pb[sf1].winner === pb[sf1].p1 ? pb[sf1].p2 : pb[sf1].p1;
                if (l1) t8.push(l1);
              }
              if (pb[sf2]) {
                const l2 = pb[sf2].winner === pb[sf2].p1 ? pb[sf2].p2 : pb[sf2].p1;
                if (l2) t8.push(l2);
              }
            });

            event.results = JSON.stringify({
              champion: eventChampion,
              runnerUp: eventRunnerUp,
              top4: [eventT4_1, eventT4_2].filter(v => v && v !== 'BYE'),
              top8: t8.filter(v => v && v !== 'BYE')
            });
          } else if (elimType === "double_upper_lower") {
            const lowerFinalIdx = B - 3;
            const lowerSemiIdx = B - 4;
            const lowerQFSemi1 = B - 6;
            const lowerQFSemi2 = B - 5;
            const lowerQF1 = B - 8;
            const lowerQF2 = B - 7;

            const t4_1 = bracket.lower[lowerFinalIdx].winner === bracket.lower[lowerFinalIdx].p1 ? bracket.lower[lowerFinalIdx].p2 : bracket.lower[lowerFinalIdx].p1;
            const t4_2 = bracket.lower[lowerSemiIdx].winner === bracket.lower[lowerSemiIdx].p1 ? bracket.lower[lowerSemiIdx].p2 : bracket.lower[lowerSemiIdx].p1;

            // Top 8 are the losers of matches that feed into Lower semi-finals
            let t8 = [];
            [lowerQFSemi1, lowerQFSemi2, lowerQF1, lowerQF2].forEach(idx => {
              if (bracket.lower[idx]) {
                const loser = bracket.lower[idx].winner === bracket.lower[idx].p1 ? bracket.lower[idx].p2 : bracket.lower[idx].p1;
                if (loser) t8.push(loser);
              }
            });

            event.results = JSON.stringify({
              champion: newWinner,
              runnerUp: runnerUp,
              top4: [t4_1, t4_2].filter(v => v && v !== 'BYE'),
              top8: t8.filter(v => v && v !== 'BYE')
            });
          }

          event.status = "Selesai";
          showCustomToast("Turnamen selesai! Juara & podium ditentukan.", "success");
        }
      }

      event.bracket = JSON.stringify(bracket);
      await saveEventDetails(event);
      showCustomToast("Hasil pertandingan berhasil disimpan!", "success");
      hideMcModal();
      openEventDetail(event.id);
    });
  }

  // --- MULTISTEP EVENT WIZARD STATE & NAVIGATION ---
  window.currentEventStep = 1;

  window.updateAddEventWizardUI = function() {
    const step = window.currentEventStep;
    const panes = document.querySelectorAll(".add-event-step-pane");
    panes.forEach(pane => {
      const paneStep = parseInt(pane.getAttribute("data-step"), 10);
      if (paneStep === step) {
        pane.classList.add("active");
        pane.removeAttribute("style"); // clear any inline display override
      } else {
        pane.classList.remove("active");
        pane.removeAttribute("style"); // let CSS handle hiding
      }
    });

    const steps = document.querySelectorAll("#add-event-wizard-stepper .wizard-step");
    steps.forEach(s => {
      const sStep = parseInt(s.getAttribute("data-step"), 10);
      const circle = s.querySelector(".wizard-step-circle");
      s.classList.remove("active", "completed");
      if (sStep === step) {
        s.classList.add("active");
        if (circle) circle.innerHTML = sStep; // show number for active step
      } else if (sStep < step) {
        s.classList.add("completed");
        if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>'; // checkmark for completed
      } else {
        if (circle) circle.innerHTML = sStep; // reset number for future steps
      }
    });

    const progress = document.getElementById("add-event-wizard-progress");
    if (progress && steps.length > 1) {
      const percent = ((step - 1) / (steps.length - 1)) * 100;
      progress.style.width = `${percent}%`;
    }

    const btnCancel = document.getElementById("modal-add-event-btn-cancel");
    const btnPrev = document.getElementById("modal-add-event-btn-prev");
    const btnNext = document.getElementById("modal-add-event-btn-next");
    const btnSubmit = document.getElementById("modal-add-event-btn-submit");

    if (step === 1) {
      if (btnCancel) btnCancel.style.display = "inline-block";
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) btnNext.style.display = "inline-block";
      if (btnSubmit) btnSubmit.style.display = "none";
    } else if (step === 2) {
      if (btnCancel) btnCancel.style.display = "none";
      if (btnPrev) btnPrev.style.display = "inline-block";
      if (btnNext) btnNext.style.display = "inline-block";
      if (btnSubmit) btnSubmit.style.display = "none";
    } else if (step === 3) {
      if (btnCancel) btnCancel.style.display = "none";
      if (btnPrev) btnPrev.style.display = "inline-block";
      if (btnNext) btnNext.style.display = "none";
      if (btnSubmit) btnSubmit.style.display = "inline-block";
    }
  };

  window.resetAddEventWizard = function() {
    window.currentEventStep = 1;
    window.updateAddEventWizardUI();
  };

  const btnWizardPrev = document.getElementById("modal-add-event-btn-prev");
  const btnWizardNext = document.getElementById("modal-add-event-btn-next");

  // Use direct onclick assignment to prevent double-binding (fixes step-skipping bug)
  if (btnWizardPrev) {
    btnWizardPrev.onclick = function() {
      if (window.currentEventStep > 1) {
        window.currentEventStep--;
        window.updateAddEventWizardUI();
      }
    };
  }

  if (btnWizardNext) {
    btnWizardNext.onclick = function() {
      if (window.currentEventStep === 1) {
        const title = document.getElementById("adm-evt-title").value.trim();
        if (!title) {
          showCustomToast("Nama Turnamen / Agenda wajib diisi!", "error");
          document.getElementById("adm-evt-title").focus();
          return;
        }
      } else if (window.currentEventStep === 2) {
        const date = document.getElementById("adm-evt-date").value.trim();
        const venue = document.getElementById("adm-evt-venue").value.trim();
        if (!date) {
          showCustomToast("Tanggal Pelaksanaan wajib diisi!", "error");
          document.getElementById("adm-evt-date").focus();
          return;
        }
        if (!venue) {
          showCustomToast("Lokasi / Arena wajib diisi!", "error");
          document.getElementById("adm-evt-venue").focus();
          return;
        }
      }

      if (window.currentEventStep < 3) {
        window.currentEventStep++;
        window.updateAddEventWizardUI();
      }
    };
  }

  // Add Event Modal Open/Close Controls
  const btnOpenAdd = document.getElementById("btn-open-add-event-modal");
  const modalAdd = document.getElementById("modal-add-event");
  const modalAddClose = document.getElementById("modal-add-event-close");
  const modalAddCancel = document.getElementById("modal-add-event-btn-cancel");

  if (btnOpenAdd && modalAdd) {
    btnOpenAdd.addEventListener("click", () => {
      const form = document.getElementById("form-admin-add-event");
      if (form) form.reset();
      
      // Reset upload poster state in UI
      const dropZone = document.getElementById("event-poster-drop-zone");
      const previewContainer = document.getElementById("event-poster-preview-container");
      if (dropZone) dropZone.style.display = "flex";
      if (previewContainer) previewContainer.style.display = "none";
      
      window.resetAddEventWizard();
      modalAdd.style.display = "flex";
    });
  }

  const hideAddModal = () => {
    if (modalAdd) modalAdd.style.display = "none";
  };
  if (modalAddClose) modalAddClose.addEventListener("click", hideAddModal);
  if (modalAddCancel) modalAddCancel.addEventListener("click", hideAddModal);

  if (modalAdd) {
    modalAdd.addEventListener("click", (e) => {
      if (e.target === modalAdd) {
        hideAddModal();
      }
    });
  }

  // Hide modal on successful creation
  const formAddEvent = document.getElementById("form-admin-add-event");
  if (formAddEvent) {
    formAddEvent.addEventListener("submit", hideAddModal);
  }

  // Edit Event Modal Close Controls
  const modalEdit = document.getElementById("modal-edit-event");
  const modalEditClose = document.getElementById("modal-edit-event-close");
  const modalEditCancel = document.getElementById("modal-edit-event-btn-cancel");

  const hideEditModal = () => {
    if (modalEdit) {
      modalEdit.classList.remove("open");
      setTimeout(() => {
        modalEdit.style.display = "none";
      }, 300);
    }
  };
  if (modalEditClose) modalEditClose.addEventListener("click", hideEditModal);
  if (modalEditCancel) modalEditCancel.addEventListener("click", hideEditModal);

  if (modalEdit) {
    modalEdit.addEventListener("click", (e) => {
      if (e.target === modalEdit) {
        hideEditModal();
      }
    });
  }

  // Edit Event Form Submit Handler
  const formEditEvent = document.getElementById("form-admin-edit-event");
  if (formEditEvent) {
    formEditEvent.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-evt-id").value;
      const event = appData.events.find(evt => evt.id === id);
      if (!event) return;

      event.title = document.getElementById("edit-evt-title").value.trim();
      event.date = document.getElementById("edit-evt-date").value.trim();
      event.venue = document.getElementById("edit-evt-venue").value.trim();
      event.prizePool = document.getElementById("edit-evt-prize").value.trim();
      event.entryFee = document.getElementById("edit-evt-fee").value.trim();
      event.contact = document.getElementById("edit-evt-contact").value.trim();
      event.status = document.getElementById("edit-evt-status").value;
      event.description = document.getElementById("edit-evt-desc").value.trim();
      event.type = document.getElementById("edit-evt-type").value;
      event.bracket_size = document.getElementById("edit-evt-bracket-size").value;
      event.elimination_type = document.getElementById("edit-evt-elimination").value;
      event.max_hc = document.getElementById("edit-evt-max-hc") ? document.getElementById("edit-evt-max-hc").value : "Bebas";
      
      if (currentEditEventPosterBase64) {
        event.poster = currentEditEventPosterBase64;
      }

      await saveEventDetails(event);
      showCustomToast("Data event berhasil diperbarui!", "success");
      hideEditModal();
      
      // Reload details and workspace dashboards
      openEventDetail(event.id);
      renderAdminEventsDashboard();
    });
  }

  // Detail View Action Listeners
  const btnEditDetail = document.getElementById("btn-event-detail-edit");
  const btnStatusToggle = document.getElementById("btn-event-detail-status-toggle");
  const btnPublish = document.getElementById("btn-event-detail-publish");
  const btnDelete = document.getElementById("btn-event-detail-delete");

  if (btnEditDetail) {
    btnEditDetail.addEventListener("click", () => {
      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!event) return;

      document.getElementById("edit-evt-id").value = event.id;
      document.getElementById("edit-evt-title").value = event.title;
      const editDatePicker = document.getElementById("edit-evt-date-wrapper")?._flatpickr;
      if (editDatePicker) {
        editDatePicker.setDate(event.date || "");
      } else {
        document.getElementById("edit-evt-date").value = event.date;
      }
      document.getElementById("edit-evt-venue").value = event.venue;
      document.getElementById("edit-evt-prize").value = event.prizePool || "";
      document.getElementById("edit-evt-fee").value = event.entryFee || "";
      document.getElementById("edit-evt-contact").value = event.contact;
      document.getElementById("edit-evt-status").value = event.status;
      document.getElementById("edit-evt-desc").value = event.description || "";
      document.getElementById("edit-evt-type").value = event.type || "Home Tournament";
      document.getElementById("edit-evt-bracket-size").value = event.bracket_size || "16";
      document.getElementById("edit-evt-elimination").value = event.elimination_type || "single";
      if (event.elimination_type === "boc") {
        document.getElementById("edit-evt-bracket-size").disabled = true;
      } else {
        document.getElementById("edit-evt-bracket-size").disabled = false;
      }
      
      if (document.getElementById("edit-evt-max-hc")) {
        document.getElementById("edit-evt-max-hc").value = event.max_hc || "Bebas";
      }

      // Setup poster preview
      currentEditEventPosterBase64 = "";
      const dropZone = document.getElementById("edit-event-poster-drop-zone");
      const previewContainer = document.getElementById("edit-event-poster-preview-container");
      const previewImg = document.getElementById("edit-event-poster-preview-img");
      const previewFilename = document.getElementById("edit-event-poster-preview-filename");

      if (event.poster && event.poster !== "images/event-poster.png") {
        currentEditEventPosterBase64 = event.poster;
        if (previewImg) previewImg.src = event.poster;
        if (previewFilename) previewFilename.textContent = "Poster Aktif";
        if (dropZone) dropZone.style.display = "none";
        if (previewContainer) previewContainer.style.display = "flex";
      } else {
        if (dropZone) dropZone.style.display = "flex";
        if (previewContainer) previewContainer.style.display = "none";
      }

      if (modalEdit) {
        modalEdit.style.display = "flex";
        setTimeout(() => modalEdit.classList.add("open"), 10);
      }
    });
  }

  if (btnStatusToggle) {
    btnStatusToggle.addEventListener("click", async () => {
      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!event) return;

      // Cycle status: Daftar -> Ongoing -> Selesai -> Cancelled -> Daftar
      const statuses = ["Daftar", "Ongoing", "Selesai", "Cancelled"];
      const currentIdx = statuses.indexOf(event.status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      event.status = statuses[nextIdx];

      await saveEventDetails(event);
      showCustomToast(`Status event diubah menjadi ${event.status}`, "success");
      openEventDetail(event.id);
    });
  }

  if (btnPublish) {
    btnPublish.addEventListener("click", () => {
      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!event) return;

      let results = {};
      try {
        results = JSON.parse(event.results || "{}");
      } catch (ex) {}

      if (!results.champion) {
        showCustomToast("Turnamen belum selesai! Selesaikan bracket hingga babak Final terlebih dahulu.", "error");
        return;
      }

      if (event.points_published === 1) {
        showCustomConfirm(
          "Publikasikan Ulang Poin",
          `Poin untuk event ini sudah pernah dirilis. Apakah Anda yakin ingin mempublikasikan ulang ke sirkuit BOC? Ini akan menimpa poin yang ada sebelumnya.`,
          () => {
            showPublishSirkuitModal(event, async (sirkuitIdx) => {
              await publishPointsSequence(event, sirkuitIdx);
            });
          },
          "Rilis",
          "warning"
        );
      } else {
        showPublishSirkuitModal(event, async (sirkuitIdx) => {
          await publishPointsSequence(event, sirkuitIdx);
        });
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!event) return;

      showCustomConfirm(
        "Hapus Event / Agenda",
        `Apakah Anda yakin ingin menghapus event "${event.title}" secara permanen?`,
        async () => {
          if (isServerOnline) {
            try {
              const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
              if (res.ok) {
                showCustomToast("Event berhasil dihapus!", "success");
                appData.events = appData.events.filter(e => e.id !== event.id);
                switchAdminPane('pane-events');
                updateWorkspaceStats();
                renderWorkspacePreviews();
              } else {
                showCustomToast("Gagal menghapus event dari server.", "error");
              }
            } catch (err) {
              showCustomToast(`Error koneksi server: ${err.message}`, "error");
            }
          } else {
            appData.events = appData.events.filter(e => e.id !== event.id);
            showCustomToast("Mode Luring: Event dihapus dari memori!", "success");
            switchAdminPane('pane-events');
            updateWorkspaceStats();
            renderWorkspacePreviews();
          }
        }
      );
    });
  }

  // Register Athlete Button Listener
  const btnRegAthlete = document.getElementById("btn-event-register-athlete");
  if (btnRegAthlete) {
    btnRegAthlete.addEventListener("click", async () => {
      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (!event) return;

      const select = document.getElementById("event-register-athlete-select");
      const name = select.value;
      if (!name) {
        showCustomToast("Pilih atlet yang valid untuk didaftarkan!", "error");
        return;
      }

      // Check handicap eligibility
      const playerObj = appData.players.find(p => p.name === name);
      if (playerObj && !isHandicapAllowed(playerObj.handicap, event.max_hc)) {
        showCustomToast(`Handicap atlet (${playerObj.handicap}) melebihi batas maksimal event ini (${event.max_hc || 'Bebas'})!`, "error");
        return;
      }

      let participants = [];
      try {
        participants = JSON.parse(event.participants || "[]");
      } catch (ex) {}

      const B = event.bracket_size || "16";
      if (B !== "manual" && participants.length >= parseInt(B, 10)) {
        showCustomToast(`Kapasitas peserta penuh (Maksimal ${B} atlet)!`, "error");
        return;
      }

      participants.push(name);
      event.participants = JSON.stringify(participants);

      let bracket = {};
      try {
        bracket = JSON.parse(event.bracket || "{}");
      } catch (ex) {}

      if (Object.keys(bracket).length > 0) {
        event.bracket = "{}";
        event.results = "{}";
        if (event.status === "Ongoing") event.status = "Daftar";
        showCustomToast(`Pendaftaran ditambahkan & bagan pertandingan (bracket) di-reset!`, "warning");
      } else {
        showCustomToast(`Atlet "${name}" berhasil didaftarkan!`, "success");
      }

      await saveEventDetails(event);
      openEventDetail(event.id);
    });
  }

  // Tabs Switches for event detail pane
  const tabButtons = document.querySelectorAll("#pane-event-detail .pm-stab");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tabId = btn.getAttribute("data-event-tab");
      const contentPanes = document.querySelectorAll("#pane-event-detail .pm-tab-content");
      contentPanes.forEach(pane => pane.classList.remove("active"));

      const targetPane = document.getElementById(`event-tab-${tabId}`);
      if (targetPane) targetPane.classList.add("active");

      const event = appData.events.find(evt => evt.id === currentActiveEventId);
      if (event) renderEventDetailTabs(event);
    });
  });
}

// Setup Event Poster File Uploader in Edit Modal
function setupEventPosterUpload() {
  const dropZone = document.getElementById("edit-event-poster-drop-zone");
  const fileInput = document.getElementById("edit-evt-poster-file");
  const previewContainer = document.getElementById("edit-event-poster-preview-container");
  const previewImg = document.getElementById("edit-event-poster-preview-img");
  const previewFilename = document.getElementById("edit-event-poster-preview-filename");
  const btnClearPoster = document.getElementById("btn-clear-edit-event-poster");

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove("dragover");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelection(files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFileSelection(files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    if (!file.type.startsWith("image/")) {
      showCustomToast("Format berkas tidak valid! Silakan unggah gambar.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showCustomToast("Ukuran gambar terlalu besar! Maksimal 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentEditEventPosterBase64 = e.target.result;
      if (previewImg) previewImg.src = currentEditEventPosterBase64;
      if (previewFilename) previewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (dropZone) dropZone.style.display = "none";
      if (previewContainer) previewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  if (btnClearPoster) {
    btnClearPoster.addEventListener("click", () => {
      currentEditEventPosterBase64 = "";
      if (fileInput) fileInput.value = "";
      if (dropZone) dropZone.style.display = "flex";
      if (previewContainer) previewContainer.style.display = "none";
    });
  }
}

// Render Calendar Widget Grid
function renderCalendarWidget() {
  const container = document.getElementById("calendar-days-grid");
  const monthYearEl = document.getElementById("calendar-month-year");
  if (!container || !monthYearEl) return;

  const events = appData.events || [];
  
  // Update calendar legend counts dynamically
  const upcomingCount = events.filter(e => e.status === "Daftar").length;
  const liveCount = events.filter(e => e.status === "Ongoing").length;
  const completedCount = events.filter(e => e.status === "Selesai").length;
  
  const legUpcoming = document.getElementById("cal-legend-upcoming");
  const legLive = document.getElementById("cal-legend-live");
  const legCompleted = document.getElementById("cal-legend-completed");
  
  if (legUpcoming) legUpcoming.textContent = `Upcoming (${upcomingCount})`;
  if (legLive) legLive.textContent = `Live (${liveCount})`;
  if (legCompleted) legCompleted.textContent = `Completed (${completedCount})`;

  const indMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  monthYearEl.textContent = `${indMonths[calCurrentMonth]} ${calCurrentYear}`;

  // First day of the month
  let startOffset = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  // Adjust starting day to Monday instead of Sunday (which is 0)
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  // Total days in month
  const totalDays = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  let daysHtml = "";
  // Empty space offsets
  for (let i = 0; i < startOffset; i++) {
    daysHtml += `<div class="evt-cal-day empty"></div>`;
  }

  // Days grid populator
  for (let d = 1; d <= totalDays; d++) {
    // Check matching events
    const matching = events.filter(e => {
      const parsed = parseEventMonthYear(e.date);
      if (parsed.year !== String(calCurrentYear)) return false;
      const monthAbbr = indMonths[calCurrentMonth].substring(0, 3).toUpperCase();
      if (parsed.month !== monthAbbr) return false;

      // Match range or single dates
      const rangeMatch = e.date.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        return d >= start && d <= end;
      }
      
      const singleMatch = e.date.match(/\b(\d+)\b/);
      if (singleMatch) {
        return parseInt(singleMatch[1], 10) === d;
      }
      return false;
    });

    let dotHtml = "";
    if (matching.length > 0) {
      const status = matching[0].status;
      let dotClass = "upcoming";
      if (status === "Ongoing") dotClass = "live";
      else if (status === "Selesai") dotClass = "completed";
      
      dotHtml = `<span class="evt-cal-day-dot ${dotClass}"></span>`;
    }

    const isToday = new Date().getDate() === d && new Date().getMonth() === calCurrentMonth && new Date().getFullYear() === calCurrentYear;
    const todayClass = isToday ? "today" : "";

    let clickHandler = "";
    let style = "";
    const isPublic = window.location.pathname !== "/admin" && window.location.pathname !== "/admin/";
    if (matching.length > 0) {
      if (isPublic) {
        clickHandler = `onclick="openPublicEventDetail('${matching[0].id}')" title="${matching[0].title}"`;
      } else {
        clickHandler = `onclick="openEventDetail('${matching[0].id}')" title="${matching[0].title}"`;
      }
      style = `style="cursor:pointer; font-weight:700; color:#fff;"`;
    } else {
      if (isPublic) {
        clickHandler = "";
        style = "";
      } else {
        // Tanggal kosong → klik untuk buat event baru dengan tanggal otomatis terisi
        const dateStr = `${d} ${indMonths[calCurrentMonth]} ${calCurrentYear}`;
        clickHandler = `onclick="openAddEventFromCalendar('${dateStr}')" title="Buat event di tanggal ${d}"`;
        style = `style="cursor:pointer;"`;
      }
    }

    daysHtml += `
      <div class="evt-cal-day ${todayClass}" ${clickHandler} ${style}>
        <span>${d}</span>
        ${dotHtml}
      </div>`;
  }

  container.innerHTML = daysHtml;
}

// Render monthly SVG Statistics Graph
function renderEventStatisticsChart() {
  const wrapper = document.getElementById("event-stats-chart-wrapper");
  if (!wrapper) return;

  const events = appData.events || [];
  
  // Calculate tournament distribution for Jan - Jun 2026
  const counts = { JAN: 0, FEB: 0, MAR: 0, APR: 0, MEI: 0, JUN: 0 };
  events.forEach(e => {
    const parsed = parseEventMonthYear(e.date);
    if (parsed.year === "2026" && counts[parsed.month] !== undefined) {
      counts[parsed.month]++;
    }
  });

  const rawValues = [counts.JAN, counts.FEB, counts.MAR, counts.APR, counts.MEI, counts.JUN];
  // If database is empty, fallback to mockup statistics ratios
  const chartValues = rawValues.every(v => v === 0) ? [1, 2, 2.2, 2, 2.8, 3.8] : rawValues.map(v => v === 0 ? 0.8 : v);

  const xCoords = [20, 62, 104, 146, 188, 230];
  const maxVal = Math.max(...chartValues, 1);
  const yCoords = chartValues.map(v => {
    const ratio = v / maxVal;
    return 100 - (ratio * 70); // Bounds it between Y=30 and Y=100
  });

  wrapper.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 250 135" style="overflow: visible;">
      <defs>
        <linearGradient id="chart-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#60a5fa" />
        </linearGradient>
        <linearGradient id="chart-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
        </linearGradient>
        <filter id="svg-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Horizontal gridlines -->
      <line x1="20" y1="30" x2="230" y2="30" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      <line x1="20" y1="65" x2="230" y2="65" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      <line x1="20" y1="100" x2="230" y2="100" stroke="rgba(255,255,255,0.04)" stroke-width="1" />

      <!-- Y axis text scale tags -->
      <text x="4" y="33" fill="var(--text-dim)" font-size="7" font-weight="700">30</text>
      <text x="4" y="68" fill="var(--text-dim)" font-size="7" font-weight="700">20</text>
      <text x="4" y="103" fill="var(--text-dim)" font-size="7" font-weight="700">10</text>

      <!-- Gradient Area Chart -->
      <path d="M ${xCoords[0]} 100 L ${xCoords[0]} ${yCoords[0]} 
               C 41 ${yCoords[0]}, 41 ${yCoords[1]}, ${xCoords[1]} ${yCoords[1]}
               C 83 ${yCoords[1]}, 83 ${yCoords[2]}, ${xCoords[2]} ${yCoords[2]}
               C 125 ${yCoords[2]}, 125 ${yCoords[3]}, ${xCoords[3]} ${yCoords[3]}
               C 167 ${yCoords[3]}, 167 ${yCoords[4]}, ${xCoords[4]} ${yCoords[4]}
               C 209 ${yCoords[4]}, 209 ${yCoords[5]}, ${xCoords[5]} ${yCoords[5]}
               L ${xCoords[5]} 100 Z" fill="url(#chart-area-gradient)" />

      <!-- Smooth neon bezier path -->
      <path d="M ${xCoords[0]} ${yCoords[0]} 
               C 41 ${yCoords[0]}, 41 ${yCoords[1]}, ${xCoords[1]} ${yCoords[1]}
               C 83 ${yCoords[1]}, 83 ${yCoords[2]}, ${xCoords[2]} ${yCoords[2]}
               C 125 ${yCoords[2]}, 125 ${yCoords[3]}, ${xCoords[3]} ${yCoords[3]}
               C 167 ${yCoords[3]}, 167 ${yCoords[4]}, ${xCoords[4]} ${yCoords[4]}
               C 209 ${yCoords[4]}, 209 ${yCoords[5]}, ${xCoords[5]} ${yCoords[5]}"
            fill="none" stroke="url(#chart-line-gradient)" stroke-width="2.5" filter="url(#svg-neon-glow)" stroke-linecap="round" />

      <!-- Plot nodes -->
      ${xCoords.map((x, idx) => `
        <circle cx="${x}" cy="${yCoords[idx]}" r="3" fill="#fff" stroke="#3b82f6" stroke-width="1.5" />
      `).join("")}

      <!-- X label ticks -->
      <text x="${xCoords[0]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Jan</text>
      <text x="${xCoords[1]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Feb</text>
      <text x="${xCoords[2]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Mar</text>
      <text x="${xCoords[3]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Apr</text>
      <text x="${xCoords[4]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Mei</text>
      <text x="${xCoords[5]}" y="118" fill="var(--text-dim)" font-size="7.5" font-weight="700" text-anchor="middle">Jun</text>
    </svg>
  `;
}

// Render Event command center mockup dashboard
function renderAdminEventsDashboard() {
  const events = (appData.events || []).filter(e => e.elimination_type !== "boc");

  const searchVal = (document.getElementById("event-search-input")?.value || "").toLowerCase();
  const statusVal = document.getElementById("event-filter-status")?.value || "";
  const yearVal = document.getElementById("event-filter-year")?.value || "";
  const typeVal = document.getElementById("event-filter-type")?.value || "";
  const sortVal = document.getElementById("event-filter-sort")?.value || "desc";

  // Filter events
  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(searchVal) || e.venue.toLowerCase().includes(searchVal) || (e.description && e.description.toLowerCase().includes(searchVal));
    const matchStatus = !statusVal || e.status === statusVal;
    const matchYear = !yearVal || parseEventMonthYear(e.date).year === yearVal;
    
    let matchType = true;
    if (typeVal === "BOC") matchType = e.title.toLowerCase().includes("boc");
    else if (typeVal === "Handicap") matchType = e.title.toLowerCase().includes("handicap");
    else if (typeVal === "Club") matchType = e.title.toLowerCase().includes("club") || e.title.toLowerCase().includes("championship");

    return matchSearch && matchStatus && matchYear && matchType;
  });

  // Calculate KPI Summary
  const totalCount = events.length;
  const upcomingCount = events.filter(e => e.status === "Daftar" || e.status === "Ongoing").length;
  const completedCount = events.filter(e => e.status === "Selesai").length;
  
  let participantSum = 0;
  events.forEach(e => {
    try {
      const parts = JSON.parse(e.participants || "[]");
      participantSum += parts.length;
    } catch (ex) {}
  });

  // Populate KPIs in UI
  const totalEl = document.getElementById("event-kpi-total");
  const upcomingEl = document.getElementById("event-kpi-upcoming");
  const completedEl = document.getElementById("event-kpi-completed");
  const partEl = document.getElementById("event-kpi-participants");

  if (totalEl) totalEl.textContent = totalCount;
  if (upcomingEl) upcomingEl.textContent = upcomingCount;
  if (completedEl) completedEl.textContent = completedCount;
  if (partEl) partEl.textContent = participantSum;

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    const parsedA = parseEventMonthYear(a.date);
    const parsedB = parseEventMonthYear(b.date);
    let diff = 0;
    if (parsedA.year !== parsedB.year) {
      diff = parsedA.year.localeCompare(parsedB.year);
    } else {
      diff = parsedA.monthNum - parsedB.monthNum;
    }
    return sortVal === "desc" ? -diff : diff;
  });

  const isList = eventDashboardLayout === 'list';

  // Render Upcoming/Live events grid
  const upcomingGrid = document.getElementById("upcoming-events-grid");
  if (upcomingGrid) {
    const upcomingFiltered = sorted.filter(e => e.status === "Daftar" || e.status === "Ongoing");
    
    // Bounds check pagination index
    if (upcomingPageStart >= upcomingFiltered.length) {
      upcomingPageStart = Math.max(0, Math.floor((upcomingFiltered.length - 1) / upcomingPageSize) * upcomingPageSize);
    }

    const slice = upcomingFiltered.slice(upcomingPageStart, upcomingPageStart + upcomingPageSize);

    if (upcomingFiltered.length === 0) {
      upcomingGrid.style.display = "block";
      upcomingGrid.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim); border: 1px dashed rgba(255,255,255,0.06); border-radius: 8px;">
          Tidak ada event aktif atau pendaftaran dibuka.
        </div>`;
    } else {
      upcomingGrid.style.display = isList ? "flex" : "grid";
      if (isList) {
        upcomingGrid.style.flexDirection = "column";
        upcomingGrid.style.gap = "10px";
      } else {
        upcomingGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(260px, 1fr))";
      }
      upcomingGrid.innerHTML = slice.map(e => renderEventCard(e, isList)).join("");
    }
  }

  // Render Recent completed events grid
  const recentGrid = document.getElementById("recent-events-grid");
  if (recentGrid) {
    const recentFiltered = sorted.filter(e => e.status === "Selesai" || e.status === "Cancelled");
    if (recentFiltered.length === 0) {
      recentGrid.style.display = "block";
      recentGrid.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim); border: 1px dashed rgba(255,255,255,0.06); border-radius: 8px;">
          Belum ada event selesai atau ditiadakan.
        </div>`;
    } else {
      recentGrid.style.display = isList ? "flex" : "grid";
      if (isList) {
        recentGrid.style.flexDirection = "column";
        recentGrid.style.gap = "10px";
      } else {
        recentGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(260px, 1fr))";
      }
      // Display all recent items (mockup baseline shows completed)
      recentGrid.innerHTML = recentFiltered.map(e => renderEventCard(e, isList)).join("");
    }
  }

  // Centered View All button click handler
  const btnViewAll = document.getElementById("btn-view-all-events");
  if (btnViewAll) {
    btnViewAll.onclick = () => {
      // Clear status filters to view all
      const statusSelect = document.getElementById("event-filter-status");
      if (statusSelect) {
        statusSelect.value = "";
        upcomingPageStart = 0;
        renderAdminEventsDashboard();
      }
    };
  }

  // Render Sidebar widgets
  renderCalendarWidget();
  renderEventStatisticsChart();
}

// Open Event Detail Pane
function openEventDetail(eventId, updateUrl = true) {
  const event = appData.events.find(e => e.id === eventId);
  if (!event) return;

  const isDifferentEvent = currentActiveEventId !== eventId;
  if (isDifferentEvent) {
    window.lastActiveAdminBracketSubTab = null;
  }
  currentActiveEventId = eventId;

  // Set active admin event ID for live score polling
  window.activeAdminEventId = eventId;
  window.activePublicEventId = null;
  ensureLivePollingStarted();

  const isBoc = event.elimination_type === 'boc';
  const bocSettingsTabBtn = document.getElementById("adm-tab-btn-boc-settings");
  if (bocSettingsTabBtn) {
    bocSettingsTabBtn.style.display = isBoc ? "inline-block" : "none";
  }
  
  const eventDetail = document.getElementById("pane-event-detail");
  const bocPlayoffContainer = document.getElementById("boc-playoff-container");
  const eventDetailWrapper = document.getElementById("pane-event-detail-wrapper");
  const bocStandingsContainer = document.getElementById("boc-standings-container");
  
  if (isBoc) {
    // 1. Relocate event detail inside pane-boc
    if (eventDetail && bocPlayoffContainer) {
      bocPlayoffContainer.appendChild(eventDetail);
      bocPlayoffContainer.style.display = "block";
    }
    if (bocStandingsContainer) {
      bocStandingsContainer.style.display = "none";
    }
    
    // Ensure eventDetail is displayed inline/flex
    if (eventDetail) {
      eventDetail.style.display = "flex";
      eventDetail.classList.add("active");
    }

    // Hide sidebar for BOC events — BOC is a final event, not a circuit event
    const sidebar = document.getElementById("event-detail-sidebar");
    if (sidebar) sidebar.style.display = "none";

    // 2. Keep the URL hash as #boc-[year]-playoff and switch to pane-boc
    switchAdminPane("pane-boc", false, true);
    const playoffHash = "#boc-" + currentBocYear + "-playoff";
    if (window.location.pathname !== "/admin" || window.location.hash !== playoffHash) {
      window.history.replaceState({}, "", "/admin" + playoffHash);
    }

    // 3. Customize crumbs & back button click bindings for BOC
    const crumbLink = document.querySelector("#pane-event-detail .pm-crumb-wrap .ad-crumb-link");
    const backBtn = document.querySelector("#pane-event-detail .pm-crumb-wrap .pm-btn");

    if (crumbLink) {
      crumbLink.textContent = "Battle of Champions";
      crumbLink.onclick = () => {
        if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
        if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
        renderAdminBocConsole();
        const standingsHash = "#boc-" + currentBocYear;
        if (window.location.hash !== standingsHash) {
          window.history.replaceState({}, "", "/admin" + standingsHash);
        }
      };
    }
    if (backBtn) {
      backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Kembali ke Klasemen BOC`;
      backBtn.onclick = () => {
        if (bocPlayoffContainer) bocPlayoffContainer.style.display = "none";
        if (bocStandingsContainer) bocStandingsContainer.style.display = "block";
        renderAdminBocConsole();
        const standingsHash = "#boc-" + currentBocYear;
        if (window.location.hash !== standingsHash) {
          window.history.replaceState({}, "", "/admin" + standingsHash);
        }
      };
    }
  } else {
    // 1. Move event detail back to its original wrapper pane-event-detail-wrapper
    if (eventDetail && eventDetailWrapper) {
      eventDetailWrapper.appendChild(eventDetail);
    }
    if (bocPlayoffContainer) {
      bocPlayoffContainer.style.display = "none";
    }
    if (bocStandingsContainer) {
      bocStandingsContainer.style.display = "block";
    }

    // Show sidebar for non-BOC events
    const sidebar = document.getElementById("event-detail-sidebar");
    if (sidebar) sidebar.style.display = "flex";

    // 2. Switch pane normally to pane-event-detail
    switchAdminPane("pane-event-detail", false);

    if (updateUrl && window.location.pathname !== `/admin/events/${eventId}`) {
      window.history.pushState({}, '', `/admin/events/${eventId}`);
    }

    // 3. Reset crumbs & back button click bindings for standard Events
    const crumbLink = document.querySelector("#pane-event-detail .pm-crumb-wrap .ad-crumb-link");
    const backBtn = document.querySelector("#pane-event-detail .pm-crumb-wrap .pm-btn");

    if (crumbLink) {
      crumbLink.textContent = "Kelola Event";
      crumbLink.onclick = () => {
        switchAdminPane('pane-events');
      };
    }
    if (backBtn) {
      backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Kembali ke Event`;
      backBtn.onclick = () => {
        switchAdminPane('pane-events');
      };
    }
  }

  // Populate Breadcrumbs & Title
  const crumbTitle = document.getElementById("event-detail-crumb-title");
  const detailTitle = document.getElementById("event-detail-title");
  const detailDate = document.getElementById("event-detail-date");
  const detailVenue = document.getElementById("event-detail-venue");
  const detailPrize = document.getElementById("event-detail-prizepool");
  const detailFee = document.getElementById("event-detail-entryfee");
  const sidebarContact = document.getElementById("event-detail-sidebar-contact");
  const sidebarPubStatus = document.getElementById("event-detail-sidebar-pub-status");
  const heroBanner = document.getElementById("event-detail-hero-banner");

  if (crumbTitle) crumbTitle.textContent = event.title;
  if (detailTitle) detailTitle.textContent = event.title;
  if (detailDate) detailDate.textContent = event.date;
  if (detailVenue) detailVenue.textContent = event.venue;
  if (detailPrize) detailPrize.textContent = event.prizePool || "-";
  if (detailFee) detailFee.textContent = event.entryFee || "-";
  if (sidebarContact) sidebarContact.textContent = event.contact;

  const sidebarMaxHc = document.getElementById("event-detail-sidebar-max-hc");
  if (sidebarMaxHc) {
    sidebarMaxHc.textContent = event.max_hc || "Bebas";
  }

  if (sidebarPubStatus) {
    sidebarPubStatus.innerHTML = event.points_published === 1 
      ? `<span style="color: var(--green); font-weight:700;"><i class="fa-solid fa-circle-check"></i> Sudah Rilis</span>`
      : `<span style="color: var(--red); font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Belum Rilis</span>`;
  }

  const sidebarBracketType = document.getElementById("event-detail-sidebar-bracket-type");
  if (sidebarBracketType) {
    if (event.bracket_size === "manual") {
      sidebarBracketType.textContent = "Manual Input";
    } else {
      const elimType = event.elimination_type || "single";
      const elimLabels = {
        "single": "Single Elim",
        "double_pool": "Double Elim (Pool)",
        "double_upper_lower": "Double Elim (U/L)"
      };
      const label = elimLabels[elimType] || "Single Elim";
      sidebarBracketType.textContent = `${event.bracket_size}-${label}`;
    }
  }

  // Update Hero Status Badge
  const statusBadge = document.getElementById("event-detail-status-badge");
  if (statusBadge) {
    let statusText = "Upcoming";
    let statusClass = "daftar";
    
    if (event.status === "Ongoing") {
      statusText = "LIVE / ONGOING";
      statusClass = "live"; // red pulsing
    } else if (event.status === "Selesai") {
      statusText = "Completed";
      statusClass = "selesai";
    } else if (event.status === "Cancelled") {
      statusText = "Cancelled";
      statusClass = "selesai";
    }
    
    statusBadge.textContent = statusText;
    statusBadge.className = `featured-status-badge ${statusClass}`;
  }

  // Update Hero Banner Background image
  const heroBannerBg = document.getElementById("event-detail-hero-banner-bg");
  if (heroBannerBg) {
    const posterUrl = (event.elimination_type === 'boc' && typeof bocSettings !== 'undefined' && bocSettings.cover) 
      ? bocSettings.cover 
      : (event.poster && event.poster !== 'images/event-poster.png' ? event.poster : 'images/event-poster.png');
    heroBannerBg.style.backgroundImage = `url('${posterUrl}')`;
  }

  // Preserve active tab state if updating the same event
  const activeTabBtn = document.querySelector("#pane-event-detail .pm-stab.active");
  const currentActiveTab = activeTabBtn ? activeTabBtn.getAttribute("data-event-tab") : "participants";
  const tabToActivate = isDifferentEvent ? "participants" : currentActiveTab;

  const targetTabBtn = document.querySelector(`#pane-event-detail .pm-stab[data-event-tab="${tabToActivate}"]`);
  if (targetTabBtn) {
    const tabButtons = document.querySelectorAll("#pane-event-detail .pm-stab");
    tabButtons.forEach(b => b.classList.remove("active"));
    targetTabBtn.classList.add("active");

    const contentPanes = document.querySelectorAll("#pane-event-detail .pm-tab-content");
    contentPanes.forEach(pane => pane.classList.remove("active"));

    const targetPane = document.getElementById(`event-tab-${tabToActivate}`);
    if (targetPane) targetPane.classList.add("active");
  }

  // Render Tabs Contents
  renderEventDetailTabs(event);

  const adminTabLiveBadge = document.getElementById("admin-tab-live-badge");
  if (adminTabLiveBadge) {
    adminTabLiveBadge.style.display = event.status === "Ongoing" ? "inline-flex" : "none";
  }
}

// Form Catat Hasil Manual (Tanpa Bracket)
function renderManualResultsForm(simEl, event, participants) {
  if (participants.length === 0) {
    simEl.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-dim); width: 100%;">
        <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.3;"></i> 
        Pendaftaran peserta kosong. Daftarkan minimal 2 atlet terlebih dahulu di Tab Partisipan untuk mencatat hasil.
      </div>`;
    return;
  }

  let results = {};
  try {
    results = JSON.parse(event.results || "{}");
  } catch (ex) {}

  const pOptions = `<option value="">-- Pilih Atlet --</option>` + participants.map(p => `<option value="${p}">${p}</option>`).join("");

  const t4_1 = results.top4 && results.top4[0] ? results.top4[0] : "";
  const t4_2 = results.top4 && results.top4[1] ? results.top4[1] : "";
  const t8_1 = results.top8 && results.top8[0] ? results.top8[0] : "";
  const t8_2 = results.top8 && results.top8[1] ? results.top8[1] : "";
  const t8_3 = results.top8 && results.top8[2] ? results.top8[2] : "";
  const t8_4 = results.top8 && results.top8[3] ? results.top8[3] : "";

  let top16SectionHtml = "";
  if (participants.length > 16) {
    let top16Dropdowns = "";
    for (let i = 1; i <= 8; i++) {
      top16Dropdowns += `
        <select id="man-res-top16-${i}" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
          ${pOptions}
        </select>
      `;
    }
    top16SectionHtml = `
      <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-bottom: 12px;">
        <label class="form-lbl" style="display: block; font-weight: 700; color: #fff; margin-bottom: 8px;">16 Besar (Opsional)</label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${top16Dropdowns}
        </div>
      </div>
    `;
  }

  let top32SectionHtml = "";
  if (participants.length > 32) {
    let top32Dropdowns = "";
    for (let i = 1; i <= 16; i++) {
      top32Dropdowns += `
        <select id="man-res-top32-${i}" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
          ${pOptions}
        </select>
      `;
    }
    top32SectionHtml = `
      <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-bottom: 12px;">
        <label class="form-lbl" style="display: block; font-weight: 700; color: #fff; margin-bottom: 8px;">32 Besar (Opsional)</label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${top32Dropdowns}
        </div>
      </div>
    `;
  }

  simEl.innerHTML = `
    <div class="manual-results-wrapper" style="width: 100%; max-width: 1200px; margin: 0 auto; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-md); padding: 24px;">
      <h3 style="font-family: var(--font-headers); font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 8px; text-align: left; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-trophy text-gold"></i> Catat Hasil Turnamen Manual
      </h3>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px; text-align: left;">Pilih atlet pemenang untuk masing-masing posisi juara untuk merilis poin klasemen.</p>
      
      <form id="form-manual-results" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div>
            <label class="form-lbl" style="display: flex; align-items: center; gap: 4px; font-weight: 700; color: var(--gold); margin-bottom: 6px;"><i class="fa-solid fa-medal"></i> Juara 1</label>
            <select id="man-res-champion" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
          </div>
          <div>
            <label class="form-lbl" style="display: flex; align-items: center; gap: 4px; font-weight: 700; color: var(--text-dim); margin-bottom: 6px;"><i class="fa-solid fa-medal" style="color: #94a3b8;"></i> Juara 2</label>
            <select id="man-res-runnerup" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
          </div>
          <div>
            <label class="form-lbl" style="display: block; font-weight: 700; color: #fff; margin-bottom: 6px;">Semifinalis</label>
            <select id="man-res-top4-1" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
          </div>
          <div>
            <label class="form-lbl" style="display: block; font-weight: 700; color: #fff; margin-bottom: 6px;">Semifinalis</label>
            <select id="man-res-top4-2" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
          </div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-bottom: 12px;">
          <label class="form-lbl" style="display: block; font-weight: 700; color: #fff; margin-bottom: 8px;">Perempatfinalis (Opsional)</label>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <select id="man-res-top8-1" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
            <select id="man-res-top8-2" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
            <select id="man-res-top8-3" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
            <select id="man-res-top8-4" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 4px; font-size: 0.88rem; outline: none; cursor: pointer;">
              ${pOptions}
            </select>
          </div>
        </div>

        ${top16SectionHtml}
        ${top32SectionHtml}

        <button type="submit" class="btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); color: #fff; border: none; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);"><i class="fa-solid fa-circle-check"></i> Simpan Hasil & Selesaikan Turnamen</button>
      </form>
    </div>
  `;

  // Pre-fill existing values
  const setSelectVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  };
  setSelectVal("man-res-champion", results.champion);
  setSelectVal("man-res-runnerup", results.runnerUp);
  setSelectVal("man-res-top4-1", t4_1);
  setSelectVal("man-res-top4-2", t4_2);
  setSelectVal("man-res-top8-1", t8_1);
  setSelectVal("man-res-top8-2", t8_2);
  setSelectVal("man-res-top8-3", t8_3);
  setSelectVal("man-res-top8-4", t8_4);

  if (participants.length > 16) {
    for (let i = 1; i <= 8; i++) {
      const val = results.top16 && results.top16[i - 1] ? results.top16[i - 1] : "";
      setSelectVal(`man-res-top16-${i}`, val);
    }
  }

  if (participants.length > 32) {
    for (let i = 1; i <= 16; i++) {
      const val = results.top32 && results.top32[i - 1] ? results.top32[i - 1] : "";
      setSelectVal(`man-res-top32-${i}`, val);
    }
  }

  // Form submit handler
  const form = document.getElementById("form-manual-results");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mencatat hasil.", "error");
        return;
      }

      const champion = document.getElementById("man-res-champion").value;
      const runnerUp = document.getElementById("man-res-runnerup").value;
      const top4_1 = document.getElementById("man-res-top4-1").value;
      const top4_2 = document.getElementById("man-res-top4-2").value;
      const top8_1 = document.getElementById("man-res-top8-1").value;
      const top8_2 = document.getElementById("man-res-top8-2").value;
      const top8_3 = document.getElementById("man-res-top8-3").value;
      const top8_4 = document.getElementById("man-res-top8-4").value;

      let top16 = [];
      if (participants.length > 16) {
        for (let i = 1; i <= 8; i++) {
          const val = document.getElementById(`man-res-top16-${i}`)?.value || "";
          if (val) top16.push(val);
        }
      }

      let top32 = [];
      if (participants.length > 32) {
        for (let i = 1; i <= 16; i++) {
          const val = document.getElementById(`man-res-top32-${i}`)?.value || "";
          if (val) top32.push(val);
        }
      }

      if (!champion || !runnerUp) {
        showCustomToast("Juara 1 dan Juara 2 harus diisi!", "error");
        return;
      }

      // Check duplicates
      const selected = [
        champion, runnerUp, top4_1, top4_2, top8_1, top8_2, top8_3, top8_4,
        ...top16, ...top32
      ].filter(Boolean);
      const unique = new Set(selected);
      if (unique.size !== selected.length) {
        showCustomToast("Setiap atlet hanya boleh dipilih untuk satu posisi hasil!", "error");
        return;
      }

      event.results = JSON.stringify({
        champion,
        runnerUp,
        top4: [top4_1, top4_2].filter(Boolean),
        top8: [top8_1, top8_2, top8_3, top8_4].filter(Boolean),
        top16: top16,
        top32: top32
      });
      
      event.status = "Selesai";

      await saveEventDetails(event);
      showCustomToast("Hasil turnamen manual berhasil disimpan!", "success");
      openEventDetail(event.id);
    });
  }
}

// Render tabs inside detail pane
function renderEventDetailTabs(event) {
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (ex) {}

  // Update Registered Counts
  const countEl = document.getElementById("event-detail-part-count");
  const B = event.bracket_size || "16";
  const capacity = B === "manual" ? null : parseInt(B, 10);
  if (countEl) {
    if (B === "manual") {
      countEl.textContent = `${participants.length} Atlet`;
    } else {
      countEl.textContent = `${participants.length} / ${capacity}`;
    }
  }

  // Render Active Tab Content
  const activeTabBtn = document.querySelector("#pane-event-detail .pm-stab.active");
  const tabId = activeTabBtn ? activeTabBtn.getAttribute("data-event-tab") : "participants";

  if (tabId === "participants") {
    // Fill Registration Dropdown Select
    const select = document.getElementById("event-register-athlete-select");
    const regFormWrap = document.getElementById("event-register-athlete-form-wrap");
    const isReadOnly = event.status === "Selesai" || event.status === "Cancelled" || localStorage.getItem("pobsi_admin_role") === "staff";

    if (regFormWrap) {
      const capacity = B === "manual" ? null : parseInt(B, 10);
      if (B !== "manual" && participants.length >= capacity) {
        regFormWrap.style.display = "flex";
        regFormWrap.innerHTML = `
          <span style="font-size:0.85rem; color: var(--text-dim); margin-right: 8px;"><i class="fa-solid fa-circle-info"></i> Kapasitas Penuh (${capacity} Atlet)</span>
          <button class="pm-btn pm-btn-sm pm-btn-primary" id="btn-event-open-bulk-modal" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); padding: 8px 12px; font-size: 0.82rem;"><i class="fa-solid fa-users-gear"></i> Kelola Massal & Auto-fill</button>
        `;
      } else if (isReadOnly) {
        regFormWrap.style.display = "none";
      } else {
        regFormWrap.style.display = "flex";
        // Restore default template
        regFormWrap.innerHTML = `
          <select id="event-register-athlete-select" class="select-reset" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: var(--radius-sm); padding: 8px 12px; min-width: 160px; font-size: 0.82rem;">
          </select>
          <button class="pm-btn pm-btn-sm pm-btn-outline" id="btn-event-register-athlete" style="padding: 8px 12px; font-size: 0.82rem;"><i class="fa-solid fa-user-plus"></i> Tambah</button>
          <button class="pm-btn pm-btn-sm pm-btn-primary" id="btn-event-open-bulk-modal" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); padding: 8px 12px; font-size: 0.82rem;"><i class="fa-solid fa-users-gear"></i> Kelola Massal & Auto-fill</button>
        `;
        
        // Populate select options
        const athletes = appData.players || [];
        const available = athletes.filter(a => !participants.includes(a.name));
        const selectEl = document.getElementById("event-register-athlete-select");
        if (selectEl) {
          selectEl.innerHTML = available.map(a => `<option value="${a.name}">${a.name} (HC ${a.handicap})</option>`).join("");
          if (available.length === 0) {
            selectEl.innerHTML = `<option value="">Tidak ada atlet tersedia</option>`;
          }
        }
        
        // Re-hook registration submit click
        const btnReg = document.getElementById("btn-event-register-athlete");
        if (btnReg) {
          btnReg.addEventListener("click", async () => {
            const athleteName = document.getElementById("event-register-athlete-select").value;
            if (!athleteName) {
              showCustomToast("Pilih atlet yang valid!", "error");
              return;
            }
            participants.push(athleteName);
            event.participants = JSON.stringify(participants);
            await saveEventDetails(event);
            showCustomToast(`Atlet "${athleteName}" terdaftar!`, "success");
            openEventDetail(event.id);
          });
        }
      }
    }

    // Populate Table
    const tbody = document.getElementById("event-detail-participants-tbody");
    if (tbody) {
      if (participants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px; color:var(--text-muted);">Belum ada peserta terdaftar.</td></tr>`;
      } else {
        tbody.innerHTML = participants.map((pName, idx) => {
          const athlete = (appData.players || []).find(a => a.name === pName);
          const club = athlete ? athlete.club : "-";
          const hc = athlete ? athlete.handicap : "-";
          
          let actionBtn = `<button class="pm-btn pm-btn-ghost pm-btn-sm text-red" onclick="unregisterAthlete('${event.id}', '${pName}')" title="Hapus"><i class="fa-solid fa-user-minus"></i></button>`;
          if (isReadOnly) {
            actionBtn = `<span style="color:var(--text-dim);">-</span>`;
          }

          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="table-name-bold">${pName}</td>
              <td>${club}</td>
              <td class="text-center"><span class="table-badge-hc ${getHandicapColorClass(hc)}">HC ${hc}</span></td>
              <td class="text-center"><span class="featured-status-badge daftar" style="font-size:0.7rem; padding: 2px 8px;">Terdaftar</span></td>
              <td class="text-center">${actionBtn}</td>
            </tr>`;
        }).join("");
      }
    }
  }

  else if (tabId === "bracket") {
    const simEl = document.getElementById("event-bracket-simulator");
    const bracketTitleEl = document.getElementById("admin-bracket-title");
    const bannerEl = document.getElementById("admin-bracket-completion-banner");
    const B = event.bracket_size || "16";
    
    if (bannerEl) bannerEl.innerHTML = "";
    
    if (bracketTitleEl) {
      if (B === "manual") {
        bracketTitleEl.textContent = "Pencatatan Hasil Turnamen Manual";
      } else {
        const elimType = event.elimination_type || "single";
        const elimLabels = {
          "single": "Single Elimination",
          "double_pool": "Double Elimination — Pool A & B",
          "double_upper_lower": "Double Elimination — Upper-Lower Bracket"
        };
        bracketTitleEl.textContent = `Bagan Pertandingan (Bracket) - ${elimLabels[elimType] || "Single Elimination"} (${B} Pemain)`;
      }
    }

    if (simEl) {
      let bracket = {};
      try {
        bracket = JSON.parse(event.bracket || "{}");
      } catch (ex) {}

      if (B === "manual") {
        // Tampilkan pencatatan manual hasil turnamen
        renderManualResultsForm(simEl, event, participants);
      } else {
        renderBracketContent(simEl, bannerEl, event, bracket, participants, parseInt(B, 10));
      }
    }
  }

  else if (tabId === "results") {
    const resultsContainer = document.getElementById("event-results-podium-cards");
    if (resultsContainer) {
      let results = {};
      try {
        results = JSON.parse(event.results || "{}");
      } catch (ex) {}

      if (!results.champion) {
        resultsContainer.parentElement.innerHTML = `
          <h3 style="font-family: var(--font-headers); font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0;">Hasil Akhir Kejuaraan</h3>
          <div style="text-align: center; padding: 40px; color: var(--text-dim); width: 100%;">
            <i class="fa-solid fa-trophy" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.3;"></i> 
            Turnamen masih berlangsung. Jalankan pertandingan di Tab Bracket hingga babak Final selesai untuk melihat podium juara.
          </div>`;
      } else {
        const getClub = (name) => {
          const p = (appData.players || []).find(a => a.name === name);
          return p ? p.club : "-";
        };

        const recapData = getTournamentRecapData(event);
        const rowsHtml = recapData.map(r => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); ${r.isPromoted ? 'background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8;' : ''}">
            <td style="font-weight: 700; color: ${r.rankOrder === 1 ? 'var(--gold)' : (r.rankOrder === 2 ? '#94a3b8' : (r.rankOrder === 3 ? '#b45309' : '#64748b'))};">${r.rankText}</td>
            <td class="table-name-bold">${r.name}</td>
            <td>${r.club}</td>
            <td class="text-center" style="font-weight: 700; color: var(--accent);">+${r.pts} Pts</td>
            <td style="vertical-align: middle;">
              ${renderRecapHandicapProgress(r)}
            </td>
          </tr>
        `).join("");

        // Render podium flex items and recap table
        resultsContainer.parentElement.innerHTML = `
          <h3 style="font-family: var(--font-headers); font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0;">Hasil Akhir Kejuaraan</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 10px;" id="event-results-podium-cards">
            <div class="podium-card runnerup">
              <div class="podium-medal">🥈</div>
              <div class="podium-title">Runner Up</div>
              <div class="podium-name">${results.runnerUp}</div>
              <div class="podium-club">${getClub(results.runnerUp)}</div>
            </div>
            <div class="podium-card champion">
              <div class="podium-medal">🥇</div>
              <div class="podium-title">Champion</div>
              <div class="podium-name">${results.champion}</div>
              <div class="podium-club">${getClub(results.champion)}</div>
            </div>
            <div class="podium-card top4">
              <div class="podium-medal">🥉</div>
              <div class="podium-title">Semifinalis</div>
              <div class="podium-name">${results.top4 ? results.top4.join(" / ") : "-"}</div>
              <div class="podium-club">Semifinalis</div>
            </div>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;">
            <h3 style="font-family: var(--font-headers); font-size: 1.1rem; font-weight: 800; color: #fff; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-list-check text-blue"></i> Rekap Hasil & Handicap Turnamen
            </h3>
            <div class="pm-table-container">
              <table class="pm-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">Posisi</th>
                    <th>Nama Pemain</th>
                    <th>Klub</th>
                    <th class="text-center" style="width: 120px;">Poin Sirkuit</th>
                    <th class="text-center" style="width: 380px;">Progres & Kenaikan Handicap</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    }
  }

  else if (tabId === "boc-settings") {
    // Populate the form fields with current values from global bocSettings
    const tabBocCutoff = document.getElementById("tab-set-boc-cutoff");
    const tabBocMaxhc = document.getElementById("tab-set-boc-maxhc");
    const tabBocYear = document.getElementById("tab-set-boc-year");
    
    const tabBocPrize1 = document.getElementById("tab-set-boc-prize1");
    const tabBocPrize2 = document.getElementById("tab-set-boc-prize2");
    const tabBocPrize3 = document.getElementById("tab-set-boc-prize3");
    const tabBocBestgame = document.getElementById("tab-set-boc-bestgame");
    const tabBocRules = document.getElementById("tab-set-boc-rules");

    const tabBocDate = document.getElementById("tab-boc-schedule-date");
    const tabBocTime = document.getElementById("tab-boc-schedule-time");
    const tabBocVenue = document.getElementById("tab-boc-schedule-venue");

    const savedSchedule = bocSettings.playoff_schedule || {};
    const prizes = bocSettings.prizes || {};

    if (tabBocCutoff) tabBocCutoff.value = bocSettings.cutoff_limit || "16";
    if (tabBocMaxhc) tabBocMaxhc.value = bocSettings.max_handicap || "Bebas";
    if (tabBocYear) tabBocYear.value = currentBocYear || "2026";

    if (tabBocPrize1) tabBocPrize1.value = prizes.juara1 || "";
    if (tabBocPrize2) tabBocPrize2.value = prizes.juara2 || "";
    if (tabBocPrize3) tabBocPrize3.value = prizes.juara3 || "";
    if (tabBocBestgame) tabBocBestgame.value = prizes.best_game || "";
    if (tabBocRules) tabBocRules.value = bocSettings.rules || "";

    // Flatpickr initialization
    const dateWrapper = document.getElementById("tab-boc-schedule-date-wrapper");
    if (dateWrapper && typeof flatpickr !== "undefined" && !dateWrapper._flatpickr) {
      flatpickr(dateWrapper, {
        dateFormat: "d F Y",
        locale: "id",
        allowInput: true,
        disableMobile: true,
        wrap: true
      });
    }

    const tabBocDatePicker = dateWrapper?._flatpickr;
    if (tabBocDatePicker) {
      tabBocDatePicker.setDate(savedSchedule.date || "");
    } else if (tabBocDate) {
      tabBocDate.value = savedSchedule.date || "";
    }

    setSelectedTimeValue("tab-boc-schedule-time", savedSchedule.time || "");

    if (tabBocVenue) tabBocVenue.value = savedSchedule.venue || "";

    // Toggle schedule and regulation sections based on tournament status (playoff has started or is completed)
    const sectionSchedule = document.getElementById("tab-boc-settings-section-schedule");
    const sectionRegulations = document.getElementById("tab-boc-settings-section-regulations");

    if (event.status !== "Daftar") {
      // Hide sections
      if (sectionSchedule) sectionSchedule.style.display = "none";
      if (sectionRegulations) sectionRegulations.style.display = "none";
      
      // Remove required attributes to prevent hidden validation errors
      if (tabBocDate) tabBocDate.removeAttribute("required");
      if (tabBocTime) tabBocTime.removeAttribute("required");
      if (tabBocVenue) tabBocVenue.removeAttribute("required");
      if (tabBocYear) tabBocYear.removeAttribute("required");
    } else {
      // Show sections
      if (sectionSchedule) sectionSchedule.style.display = "flex";
      if (sectionRegulations) sectionRegulations.style.display = "flex";
      
      // Restore required attributes
      if (tabBocDate) tabBocDate.setAttribute("required", "");
      if (tabBocTime) tabBocTime.setAttribute("required", "");
      if (tabBocVenue) tabBocVenue.setAttribute("required", "");
      if (tabBocYear) tabBocYear.setAttribute("required", "");
    }

    // Role Restriction Check (RBAC)
    const role = localStorage.getItem("pobsi_admin_role") || "admin";
    const restrictOverlay = document.getElementById("restrict-boc-tab-settings");
    if (role === "staff") {
      if (restrictOverlay) restrictOverlay.style.display = "flex";
      toggleFormInputs("form-tab-boc-settings", false);
    } else {
      if (restrictOverlay) restrictOverlay.style.display = "none";
      toggleFormInputs("form-tab-boc-settings", true);
    }

    // Image Upload zones
    // 1. Playoff Cover
    const coverDropZone = document.getElementById("tab-boc-cover-drop-zone");
    const coverFileInput = document.getElementById("tab-set-boc-cover-file");
    const coverPreviewContainer = document.getElementById("tab-boc-cover-preview-container");
    const coverPreviewImg = document.getElementById("tab-boc-cover-preview-img");
    const coverPreviewFilename = document.getElementById("tab-boc-cover-preview-filename");
    const btnClearCover = document.getElementById("btn-clear-tab-boc-cover");

    window.tabUploadedBocCoverBase64 = bocSettings.cover || "";

    if (bocSettings.cover) {
      if (coverPreviewImg) coverPreviewImg.src = bocSettings.cover;
      if (coverPreviewFilename) coverPreviewFilename.textContent = "boc_cover.png";
      if (coverDropZone) coverDropZone.style.display = "none";
      if (coverPreviewContainer) coverPreviewContainer.style.display = "flex";
    } else {
      if (coverDropZone) coverDropZone.style.display = "flex";
      if (coverPreviewContainer) coverPreviewContainer.style.display = "none";
    }

    if (coverDropZone && coverFileInput && role !== "staff") {
      coverDropZone.onclick = () => coverFileInput.click();
      
      coverDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        coverDropZone.classList.add("dragover");
      });
      ["dragleave", "drop"].forEach(eventName => {
        coverDropZone.addEventListener(eventName, () => coverDropZone.classList.remove("dragover"));
      });
      coverDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect(files[0], "cover");
      });
      coverFileInput.onchange = (e) => {
        const files = e.target.files;
        if (files.length > 0) handleFileSelect(files[0], "cover");
      };
    }

    if (btnClearCover && role !== "staff") {
      btnClearCover.onclick = () => {
        window.tabUploadedBocCoverBase64 = "";
        if (coverFileInput) coverFileInput.value = "";
        if (coverDropZone) coverDropZone.style.display = "flex";
        if (coverPreviewContainer) coverPreviewContainer.style.display = "none";
      };
    }

    // 2. Season Recap Cover
    const recapDropZone = document.getElementById("tab-boc-recap-drop-zone");
    const recapFileInput = document.getElementById("tab-set-boc-recap-file");
    const recapPreviewContainer = document.getElementById("tab-boc-recap-preview-container");
    const recapPreviewImg = document.getElementById("tab-boc-recap-preview-img");
    const recapPreviewFilename = document.getElementById("tab-boc-recap-preview-filename");
    const btnClearRecap = document.getElementById("btn-clear-tab-boc-recap");

    window.tabUploadedBocRecapBase64 = bocSettings.recap_cover || "";

    if (bocSettings.recap_cover) {
      if (recapPreviewImg) recapPreviewImg.src = bocSettings.recap_cover;
      if (recapPreviewFilename) recapPreviewFilename.textContent = "recap_cover.png";
      if (recapDropZone) recapDropZone.style.display = "none";
      if (recapPreviewContainer) recapPreviewContainer.style.display = "flex";
    } else {
      if (recapDropZone) recapDropZone.style.display = "flex";
      if (recapPreviewContainer) recapPreviewContainer.style.display = "none";
    }

    if (recapDropZone && recapFileInput && role !== "staff") {
      recapDropZone.onclick = () => recapFileInput.click();
      
      recapDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        recapDropZone.classList.add("dragover");
      });
      ["dragleave", "drop"].forEach(eventName => {
        recapDropZone.addEventListener(eventName, () => recapDropZone.classList.remove("dragover"));
      });
      recapDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect(files[0], "recap");
      });
      recapFileInput.onchange = (e) => {
        const files = e.target.files;
        if (files.length > 0) handleFileSelect(files[0], "recap");
      };
    }

    if (btnClearRecap && role !== "staff") {
      btnClearRecap.onclick = () => {
        window.tabUploadedBocRecapBase64 = "";
        if (recapFileInput) recapFileInput.value = "";
        if (recapDropZone) recapDropZone.style.display = "flex";
        if (recapPreviewContainer) recapPreviewContainer.style.display = "none";
      };
    }

    function handleFileSelect(file, type) {
      if (!file.type.startsWith("image/")) {
        showCustomToast("Berkas harus berupa gambar!", "error");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showCustomToast("Ukuran gambar maksimal 2MB!", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        if (type === "cover") {
          window.tabUploadedBocCoverBase64 = base64Data;
          if (coverPreviewImg) coverPreviewImg.src = base64Data;
          if (coverPreviewFilename) coverPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          if (coverDropZone) coverDropZone.style.display = "none";
          if (coverPreviewContainer) coverPreviewContainer.style.display = "flex";
        } else {
          window.tabUploadedBocRecapBase64 = base64Data;
          if (recapPreviewImg) recapPreviewImg.src = base64Data;
          if (recapPreviewFilename) recapPreviewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          if (recapDropZone) recapDropZone.style.display = "none";
          if (recapPreviewContainer) recapPreviewContainer.style.display = "flex";
        }
      };
      reader.readAsDataURL(file);
    }

    // Submit handler
    const formBocSettings = document.getElementById("form-tab-boc-settings");
    if (formBocSettings) {
      if (!formBocSettings._hasSubmitListener) {
        formBocSettings._hasSubmitListener = true;
        formBocSettings.addEventListener("submit", async (e) => {
          e.preventDefault();
          const role = localStorage.getItem("pobsi_admin_role") || "admin";
          if (role === "staff") {
            showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah regulasi/pengaturan BOC.", "error");
            return;
          }

          const date = document.getElementById("tab-boc-schedule-date").value;
          const time = document.getElementById("tab-boc-schedule-time").value;
          const venue = document.getElementById("tab-boc-schedule-venue").value;

          const cutoffVal = parseInt(document.getElementById("tab-set-boc-cutoff").value, 10);
          const maxhcInput = document.getElementById("tab-set-boc-maxhc");
          const maxhcVal = maxhcInput ? maxhcInput.value : "Bebas";
          const newYear = document.getElementById("tab-set-boc-year").value.trim();

          const prize1 = document.getElementById("tab-set-boc-prize1").value.trim();
          const prize2 = document.getElementById("tab-set-boc-prize2").value.trim();
          const prize3 = document.getElementById("tab-set-boc-prize3").value.trim();
          const bestgame = document.getElementById("tab-set-boc-bestgame").value.trim();
          const rulesVal = document.getElementById("tab-set-boc-rules").value.trim();

          // Save settings to database
          await saveBocSettings({
            cutoff_limit: cutoffVal,
            max_handicap: maxhcVal,
            year: newYear,
            playoff_schedule: { date, time, venue },
            prizes: {
              juara1: prize1,
              juara2: prize2,
              juara3: prize3,
              best_game: bestgame
            },
            rules: rulesVal,
            cover: window.tabUploadedBocCoverBase64 || null,
            recap_cover: window.tabUploadedBocRecapBase64 || null
          });

          showCustomToast("Pengaturan BOC berhasil disimpan!", "success");

          const oldYear = localStorage.getItem("currentBocYear") || "2026";
          localStorage.setItem("currentBocYear", newYear);

          if (oldYear !== newYear) {
            currentBocYear = newYear;
            await loadBocSettings(newYear);
            bocSirkuits = loadBocSirkuitsForYear(newYear);
            loadDataFromApi().then(() => {
              renderStandings();
              renderEvents("all");
              renderAdminBocConsole();
            });
          } else {
            renderAdminBocConsole();
            renderStandings();
          }
        });
      }
    }
  }
}

// Unregister Participant Athlete
window.unregisterAthlete = async function(eventId, name) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  showCustomConfirm(
    "Hapus Pendaftaran Atlet",
    `Apakah Anda yakin ingin membatalkan pendaftaran "${name}" dari turnamen ini?`,
    async () => {
      let participants = [];
      try {
        participants = JSON.parse(event.participants || "[]");
      } catch (ex) {}

      participants = participants.filter(p => p !== name);
      event.participants = JSON.stringify(participants);

      // Check if bracket already initialized
      let bracket = {};
      try {
        bracket = JSON.parse(event.bracket || "{}");
      } catch (ex) {}

      if (Object.keys(bracket).length > 0) {
        // Must reset bracket because participants changed
        event.bracket = "{}";
        event.results = "{}";
        if (event.status === "Ongoing") event.status = "Daftar";
        showCustomToast("Pendaftaran dihapus & bagan pertandingan (bracket) di-reset!", "warning");
      } else {
        showCustomToast("Pendaftaran atlet berhasil dihapus.", "success");
      }

      await saveEventDetails(event);
      openEventDetail(event.id);
    }
  );
};

// Helper untuk menghitung indeks pertandingan berikutnya secara dinamis berdasarkan format ukuran bracket
function getNextMatchInfo(matchIdx, bracketSize) {
  const B = parseInt(bracketSize, 10) || 16;
  if (matchIdx >= B - 1) {
    return { isFinal: true };
  }
  if (matchIdx === B - 2) {
    return { isFinal: true };
  }

  let startIdx = 0;
  let roundSize = B / 2;
  while (roundSize > 1) {
    if (matchIdx >= startIdx && matchIdx < startIdx + roundSize) {
      const offset = matchIdx - startIdx;
      const nextRoundStartIdx = startIdx + roundSize;
      const nextIdx = nextRoundStartIdx + Math.floor(offset / 2);
      const isEven = (offset % 2 === 0);
      return { nextIdx, isEven, isFinal: false };
    }
    startIdx += roundSize;
    roundSize /= 2;
  }
  return { isFinal: true };
}

// Define renderBracketContent function for Admin panel
function renderBracketContent(simEl, bannerEl, event, bracket, participants, B) {
  const elimType = event.elimination_type || "single";
  if (elimType === "boc") {
    renderBocBracketContent(simEl, bannerEl, event, bracket, participants, B, true);
    return;
  }

  let activeSubTab = "upper";
  if (elimType === "double_pool") activeSubTab = "poolA";
  if (window.lastActiveAdminBracketSubTab) {
    const validTargets = elimType === "double_pool" 
      ? ["poolA", "poolB", "grandFinal"] 
      : ["upper", "lower", "grandFinal"];
    if (validTargets.includes(window.lastActiveAdminBracketSubTab)) {
      activeSubTab = window.lastActiveAdminBracketSubTab;
    }
  }

  const isTabActive = (target) => target === activeSubTab;

  // Check tournament completion and render banner
  let championName = "";
  if (elimType === "single") {
    const finalMatchIdx = B - 2;
    const finalMatch = bracket[finalMatchIdx];
    if (finalMatch && finalMatch.winner) championName = finalMatch.winner;
  } else {
    if (bracket.grandFinal && bracket.grandFinal.winner) {
      championName = bracket.grandFinal.winner;
    }
  }

  if (bannerEl && championName) {
    bannerEl.innerHTML = `
      <div class="completion-banner" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px; border-radius: var(--radius-md); text-align: center; margin-bottom: 24px; box-shadow: var(--shadow-neon-success);">
        <h4 style="margin: 0; color: #10b981; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-trophy text-gold"></i> Turnamen Selesai! Juara: ${championName}
        </h4>
      </div>`;
  } else if (bannerEl && event.status === "Daftar" && Object.keys(bracket).length > 0) {
    const requiredPlayers = B;
    const currentCount = participants.length;
    
    let actionButtonsHtml = "";
    if (currentCount === requiredPlayers) {
      actionButtonsHtml = `
        <button class="pm-btn pm-btn-sm pm-btn-outline" onclick="window.initializeBracket('${event.id}')" style="padding: 8px 16px; font-weight: 700; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-shuffle"></i> Acak Ulang Bracket
        </button>
        <button class="pm-btn pm-btn-sm pm-btn-success" id="btn-start-tournament-direct" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 8px 16px; font-weight: 700; font-size: 0.82rem; color: #fff; border: none; border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-play"></i> Mulai Turnamen (Set LIVE)
        </button>
      `;
    } else {
      actionButtonsHtml = `
        <span style="color: var(--text-warning); font-size: 0.82rem; font-weight: 600;"><i class="fa-solid fa-triangle-exclamation"></i> Partisipan (${currentCount}) tidak sesuai kuota (${requiredPlayers}) untuk mengacak ulang.</span>
      `;
    }

    bannerEl.innerHTML = `
      <div class="upcoming-controls-banner" style="background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); text-align: left; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; width: 100%;">
        <div>
          <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-circle-info text-accent"></i> Turnamen Belum Dimulai
          </h4>
          <p style="margin: 0; color: var(--text-dim); font-size: 0.8rem;">Bagan sudah diacak, tetapi status turnamen masih dalam pendaftaran (Upcoming).</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          ${actionButtonsHtml}
        </div>
      </div>`;
      
      setTimeout(() => {
        const startBtn = document.getElementById("btn-start-tournament-direct");
        if (startBtn) {
          startBtn.onclick = async () => {
            event.status = "Ongoing";
            await saveEventDetails(event);
            showCustomToast("Turnamen dimulai secara LIVE!", "success");
            openEventDetail(event.id);
          };
        }
      }, 50);
  } else if (bannerEl) {
    bannerEl.innerHTML = "";
  }

  if (Object.keys(bracket).length === 0) {
    const requiredPlayers = B;
    const currentCount = participants.length;
    
    let buttonHtml = "";
    let messageHtml = "";
    
    if (currentCount === requiredPlayers) {
      messageHtml = `<div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Partisipan sudah terisi lengkap (${currentCount} dari ${requiredPlayers} atlet). Anda dapat mengacak bagan pertandingan sekarang untuk memulai turnamen.</div>`;
      buttonHtml = `
        <button class="pm-btn pm-btn-primary" onclick="window.initializeBracket('${event.id}')" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); padding: 12px 24px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-shuffle"></i> Acak & Mulai Turnamen
        </button>
      `;
    } else {
      messageHtml = `<div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Pendaftaran belum lengkap (Saat ini: ${currentCount} dari ${requiredPlayers} atlet). Silakan daftarkan atlet terlebih dahulu di tab <strong>Partisipan</strong>.</div>`;
      buttonHtml = `
        <button class="pm-btn pm-btn-outline" onclick="document.querySelector('#pane-event-detail .pm-stab[data-event-tab=\\'participants\\']').click()" style="padding: 10px 20px; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-users"></i> Kelola Partisipan
        </button>
      `;
    }

    simEl.innerHTML = `
      <div style="text-align: center; width: 100%; padding: 40px 20px; background: rgba(15, 23, 42, 0.2); border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <i class="fa-solid fa-sitemap" style="font-size: 3rem; color: var(--accent); opacity: 0.5; margin-bottom: 16px;"></i>
        <h4 style="font-family: var(--font-headers); font-size: 1.1rem; color: #fff; margin: 0 0 8px 0; font-weight: 800;">Bagan Pertandingan Belum Dibuat</h4>
        ${messageHtml}
        ${buttonHtml}
      </div>
    `;
    return;
  }

  // Define column groupings
  // Define column groupings dynamically
  const roundColumns = [];
  {
    let currentStart = 0;
    let roundSize = B / 2;
    while (roundSize >= 1) {
      const matches = [];
      for (let i = 0; i < roundSize; i++) {
        matches.push(currentStart + i);
      }
      let title = "";
      if (roundSize === 1) title = "FINALS";
      else if (roundSize === 2) title = "SF";
      else if (roundSize === 4) title = "QF";
      else title = `R${roundSize * 2}`;
      
      roundColumns.push({ matches, title });
      currentStart += roundSize;
      roundSize /= 2;
    }
  }

  const lowerColumns = [];
  {
    let currentStart = 0;
    const numStages = 2 * Math.log2(B) - 2;
    for (let stage = 1; stage <= numStages; stage++) {
      const m = Math.floor((stage + 1) / 2);
      const size = B / Math.pow(2, m + 1);
      const matches = [];
      for (let i = 0; i < size; i++) {
        matches.push(currentStart + i);
      }
      const title = (stage === numStages) ? "L-Final" : `L-R${stage}`;
      lowerColumns.push({ matches, title });
      currentStart += size;
    }
  }

  // Inner rendering helper for normal sub-bracket columns
  const renderSubBracket = (subBracket, columns, context) => {
    const totalRounds = columns.length;

    // Helper: Identify LB slots receiving Upper Bracket losers to hide their left connector lines
    const upperLosers = new Set();
    if (context === "lower") {
      const totalUpperMatches = B - 1;
      for (let i = 0; i < totalUpperMatches; i++) {
        const info = getDoubleEliminationNextMatch(i, "upper", B);
        if (info.loserIdx !== undefined) {
          const slotName = info.loserIsEven ? "p1" : "p2";
          upperLosers.add(`${info.loserIdx}-${slotName}`);
        }
      }
    }

    const getRoundTitle = (titleVal) => {
      if (titleVal === "FINALS") return "Final";
      if (titleVal === "SF") return "Semi-finals";
      if (titleVal === "QF") return "Quarter-finals";
      if (titleVal.startsWith("R")) {
        const sizeStr = titleVal.substring(1);
        return `Round of ${sizeStr}`;
      }
      if (titleVal === "L-Final") return "Lower Final";
      if (titleVal.startsWith("L-R")) {
        const rNum = titleVal.substring(3);
        return `Lower Round ${rNum}`;
      }
      return titleVal;
    };

    const roundColumnsHtml = columns.map((rc, roundIdx) => {
      const isFirst = roundIdx === 0;

      const pairsHtml = rc.matches.map(idx => {
        const m = subBracket[idx] || { p1: "", p2: "", s1: "", s2: "", winner: "" };
        const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
        const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
        const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
        const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
        const p1Display = m.p1 ? `${m.p1}${p1HC}` : "TBD";
        const p2Display = m.p2 ? `${m.p2}${p2HC}` : "TBD";

        const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
        const raceToVal = m.raceTo || 4;

        // BYE detection
        const p1IsBye = m.p1 === "BYE";
        const p2IsBye = m.p2 === "BYE";
        const isByeMatch = (p1IsBye || p2IsBye) && m.winner;
        const p1ByeClass = p1IsBye ? ' bye-slot' : '';
        const p2ByeClass = p2IsBye ? ' bye-slot' : '';
        const byeMatchClass = isByeMatch ? ' bye-match' : '';

        const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
        const p1VoorTag = m.p1Voor && m.p1Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p1Voor] || m.p1Voor}</span>` : "";
        const p2VoorTag = m.p2Voor && m.p2Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p2Voor] || m.p2Voor}</span>` : "";

        // Drag/drop only in first round of pool/upper and before match has completed
        const canDrag = isFirst && !m.winner && event.status !== "Selesai" && context !== "lower" && !p1IsBye && !p2IsBye;
        const dragEvents1 = canDrag ? `draggable="true" ondragstart="handleBracketDragStart(event, '${event.id}', ${idx}, 1, '${context}')" ondragover="handleBracketDragOver(event)" ondragleave="handleBracketDragLeave(event)" ondragend="handleBracketDragEnd(event)" ondrop="handleBracketDrop(event, '${event.id}', ${idx}, 1, '${context}')"` : '';
        const dragEvents2 = canDrag ? `draggable="true" ondragstart="handleBracketDragStart(event, '${event.id}', ${idx}, 2, '${context}')" ondragover="handleBracketDragOver(event)" ondragleave="handleBracketDragLeave(event)" ondragend="handleBracketDragEnd(event)" ondrop="handleBracketDrop(event, '${event.id}', ${idx}, 2, '${context}')"` : '';

        const hasLeftConnector = !isFirst && !upperLosers.has(`${idx}-p1`);
        const hasLeftConnector2 = !isFirst && !upperLosers.has(`${idx}-p2`);

        return `
          <div class="bracket-match-pair${byeMatchClass}">
            <div class="bracket-match-wrapper${hasLeftConnector ? '' : ' no-left-connector'}">
              <div class="bracket-slot-container">
                <div class="bracket-slot-label" style="display: flex; align-items: center; gap: 4px;">
                  <span>M-${idx + 1} Race to ${raceToVal}</span>
                  ${isByeMatch ? `<span style="font-size: 0.65rem; color: var(--text-dim); font-style: italic; margin-left: 4px;">BYE</span>` : ''}
                  ${isLiveMatch ? `<span class="match-live-pulse-badge" style="margin-left: 4px;"><span class="pub-bracket-live-dot"></span> LIVE</span>` : ''}
                </div>
                <div class="bracket-player-slot ${m.winner === m.p1 && m.p1 ? 'winner' : (m.winner && m.p1 ? 'loser' : '')}${p1ByeClass}" 
                     ${dragEvents1}
                     onclick="handleBracketMatchClick('${event.id}', ${idx}, 1, '${context}')"
                     style="cursor: ${isByeMatch ? 'not-allowed' : 'pointer'}; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p1 || 'TBD'}">${p1Display}</span>
                    ${p1VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s1 !== undefined && m.s1 !== "" ? m.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper${hasLeftConnector2 ? '' : ' no-left-connector'}">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p2 && m.p2 ? 'winner' : (m.winner && m.p2 ? 'loser' : '')}${p2ByeClass}" 
                     ${dragEvents2}
                     onclick="handleBracketMatchClick('${event.id}', ${idx}, 2, '${context}')"
                     style="cursor: ${isByeMatch ? 'not-allowed' : 'pointer'}; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p2 || 'TBD'}">${p2Display}</span>
                    ${p2VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s2 !== undefined && m.s2 !== "" ? m.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="bracket-round-column${isFirst ? ' round-first' : ''}">
          <div class="bracket-column-header">${getRoundTitle(rc.title)}</div>
          <div class="bracket-column-matches">
            ${pairsHtml}
          </div>
        </div>`;
    }).join("");

    // Calculate champion info
    const lastColumn = columns[totalRounds - 1];
    const finalMatchIdx = lastColumn.matches[0];
    const m = subBracket[finalMatchIdx] || { p1: "", p2: "", s1: "", s2: "", winner: "" };
    
    // Find athlete info for display
    const champAthlete = m.winner ? (appData.players || []).find(p => p.name === m.winner) : null;
    const champHC = champAthlete ? ` (HC ${champAthlete.handicap})` : "";
    const champDisplay = m.winner ? `${m.winner}${champHC}` : "TBD";
    
    // For voor tag:
    const winnerVoor = m.winner === m.p1 ? m.p1Voor : (m.winner === m.p2 ? m.p2Voor : null);
    const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
    const champVoorTag = winnerVoor && winnerVoor !== "9" ? `<span class="player-voor-tag">${voorLabels[winnerVoor] || winnerVoor}</span>` : "";

    let champLabel = `<i class="fa-solid fa-trophy text-gold"></i> CHAMPION`;
    if (context === 'poolA') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> POOL A WINNER`;
    else if (context === 'poolB') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> POOL B WINNER`;
    else if (context === 'upper') champLabel = `<i class="fa-solid fa-trophy text-gold"></i> UPPER WINNER`;
    else if (context === 'lower') champLabel = `<i class="fa-solid fa-circle-check" style="color: var(--blue);"></i> LOWER WINNER`;

    const championColumnHtml = `
      <div class="bracket-round-column round-last">
        <div class="bracket-column-header">${champLabel}</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot champion-slot ${m.winner ? 'winner' : ''}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.winner || 'TBD'}">${champDisplay}</span>
                    ${champVoorTag}
                  </div>
                  <span class="bracket-player-score" style="background: rgba(245, 158, 11, 0.2); color: var(--gold);"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return roundColumnsHtml + championColumnHtml;
  };

  // Inner rendering helper for Grand Final
  const renderGrandFinalShowdown = (grandFinal, context) => {
    const m = grandFinal || { p1: "", p2: "", s1: "", s2: "", winner: "" };
    const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
    const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
    const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
    const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
    const p1Display = m.p1 ? `${m.p1}${p1HC}` : "TBD";
    const p2Display = m.p2 ? `${m.p2}${p2HC}` : "TBD";

    const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
    const raceToVal = m.raceTo || 4;

    const voorLabels = { "9": "", "8S": "8S", "8B": "8B", "7S": "7,8S", "7B": "7,8B", "7": "B7" };
    const p1VoorTag = m.p1Voor && m.p1Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p1Voor] || m.p1Voor}</span>` : "";
    const p2VoorTag = m.p2Voor && m.p2Voor !== "9" ? `<span class="player-voor-tag">${voorLabels[m.p2Voor] || m.p2Voor}</span>` : "";

    // Find athlete info for display
    const champAthlete = m.winner ? (appData.players || []).find(p => p.name === m.winner) : null;
    const champHC = champAthlete ? ` (HC ${champAthlete.handicap})` : "";
    const champDisplay = m.winner ? `${m.winner}${champHC}` : "TBD";
    const winnerVoor = m.winner === m.p1 ? m.p1Voor : (m.winner === m.p2 ? m.p2Voor : null);
    const champVoorTag = winnerVoor && winnerVoor !== "9" ? `<span class="player-voor-tag">${voorLabels[winnerVoor] || winnerVoor}</span>` : "";

    // Playoff banner if same winner won both pools
    const finalMatchIdx = B - 2;
    const poolAWinner = bracket.poolA?.[finalMatchIdx]?.winner;
    const poolBWinner = bracket.poolB?.[finalMatchIdx]?.winner;
    const sameWinner = (poolAWinner && poolBWinner && poolAWinner === poolBWinner);

    let playoffBannerHtml = "";
    let grandFinalTitle = `Grand Final (Race to ${raceToVal})`;
    if (sameWinner) {
      grandFinalTitle = `Grand Final — Playoff Juara 2 (Race to ${raceToVal})`;
      playoffBannerHtml = `
        <div class="grand-final-playoff-notice" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; text-align: center; max-width: 600px; width: 100%;">
          <h4 style="margin: 0; color: var(--gold); font-size: 0.95rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fa-solid fa-crown text-gold"></i> Juara Umum Ditentukan</h4>
          <p style="margin: 4px 0 0 0; color: var(--text-main); font-size: 0.8rem;">
            <strong>${poolAWinner}</strong> menjuarai Pool A & Pool B secara tak terkalahkan! 
            Pertandingan di bawah adalah <strong>Playoff Perebutan Juara 2 (Runner-Up)</strong> antara runner-up Pool A & B.
          </p>
        </div>
      `;
    }

    return `
      ${playoffBannerHtml}
      <div class="bracket-round-column round-first" style="justify-content: center;">
        <div class="bracket-column-header">${grandFinalTitle}</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p1 && m.p1 ? 'winner' : (m.winner && m.p1 ? 'loser' : '')}" 
                     onclick="handleBracketMatchClick('${event.id}', 0, 1, '${context}')"
                     style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p1 || 'TBD'}">${p1Display}</span>
                    ${p1VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s1 !== undefined && m.s1 !== "" ? m.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p2 && m.p2 ? 'winner' : (m.winner && m.p2 ? 'loser' : '')}" 
                     onclick="handleBracketMatchClick('${event.id}', 0, 2, '${context}')"
                     style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p2 || 'TBD'}">${p2Display}</span>
                    ${p2VoorTag}
                  </div>
                  <span class="bracket-player-score">${m.s2 !== undefined && m.s2 !== "" ? m.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bracket-round-column round-last" style="justify-content: center;">
        <div class="bracket-column-header"><i class="fa-solid fa-trophy text-gold"></i> Champion</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot champion-slot ${m.winner ? 'winner' : ''}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.winner || 'TBD'}">${champDisplay}</span>
                    ${champVoorTag}
                  </div>
                  <span class="bracket-player-score" style="background: rgba(245, 158, 11, 0.2); color: var(--gold);"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Render based on elimination type
  if (elimType === "single") {
    simEl.innerHTML = renderSubBracket(bracket, roundColumns, 'default');
  } else if (elimType === "double_pool") {
    simEl.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div class="bracket-tabs-container" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 6px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('poolA') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="poolA" style="font-size: 0.8rem; font-weight: 700;">Pool A</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('poolB') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="poolB" style="font-size: 0.8rem; font-weight: 700;">Pool B</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('grandFinal') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="grandFinal" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-trophy text-gold"></i> Grand Final</button>
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-poolA" style="display: ${isTabActive('poolA') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.poolA || {}, roundColumns, 'poolA')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-poolB" style="display: ${isTabActive('poolB') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.poolB || {}, roundColumns, 'poolB')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-grandFinal" style="display: ${isTabActive('grandFinal') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderGrandFinalShowdown(bracket.grandFinal, 'grandFinal')}
        </div>
      </div>
    `;
  } else if (elimType === "double_upper_lower") {
    simEl.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div class="bracket-tabs-container" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 6px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('upper') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="upper" style="font-size: 0.8rem; font-weight: 700;">Upper Bracket</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('lower') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="lower" style="font-size: 0.8rem; font-weight: 700;">Lower Bracket</button>
          <button class="pm-tab-btn pm-btn pm-btn-sm ${isTabActive('grandFinal') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="grandFinal" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-trophy text-gold"></i> Grand Final</button>
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-upper" style="display: ${isTabActive('upper') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.upper || {}, roundColumns, 'upper')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-lower" style="display: ${isTabActive('lower') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderSubBracket(bracket.lower || {}, lowerColumns, 'lower')}
        </div>
        <div class="bracket-wrapper tab-content-pane" id="tab-pane-grandFinal" style="display: ${isTabActive('grandFinal') ? 'flex' : 'none'}; gap: 40px; min-width: 1000px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${renderGrandFinalShowdown(bracket.grandFinal, 'grandFinal')}
        </div>
      </div>
    `;
  }

  // Setup tab switcher click behaviors
  if (elimType !== "single") {
    const tabBtns = simEl.querySelectorAll(".pm-tab-btn");
    tabBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-target");
        window.lastActiveAdminBracketSubTab = target;
        tabBtns.forEach(b => {
          b.classList.remove("pm-btn-primary");
          b.classList.add("pm-btn-outline");
        });
        btn.classList.remove("pm-btn-outline");
        btn.classList.add("pm-btn-primary");

        const panes = simEl.querySelectorAll(".tab-content-pane");
        panes.forEach(p => {
          p.style.display = p.id === `tab-pane-${target}` ? "flex" : "none";
        });
      };
    });
  }
}

// Initialize Bracket for Tournament
window.initializeBracket = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const B = parseInt(event.bracket_size, 10) || 16;
  const elimType = event.elimination_type || "single";
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (ex) {}
  // --- BATTLE OF CHAMPIONS (BOC) ---
  if (elimType === "boc") {
    // Auto-generate participants from top 16 standings if empty
    if (participants.length === 0) {
      const sortedStandings = [...(appData.standings || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
      participants = sortedStandings.slice(0, 16).map(p => p.name);
      if (participants.length < 16) {
        showCustomToast(`Klasemen sirkuit hanya memiliki ${participants.length} atlet. Diperlukan minimal 16 untuk BOC!`, "error");
        return;
      }
      event.participants = JSON.stringify(participants);
    }
    if (participants.length !== 16) {
      showCustomToast(`BOC memerlukan tepat 16 peserta! Saat ini: ${participants.length}`, "error");
      return;
    }

    const startBoc = async () => {
      // Serpentine seeding: distribute 16 ranked athletes into 4 groups
      const groupNames = ["A", "B", "C", "D"];
      const groups = { A: { players: [], matches: {}, standings: [] }, B: { players: [], matches: {}, standings: [] }, C: { players: [], matches: {}, standings: [] }, D: { players: [], matches: {}, standings: [] } };

      // Pot 1: 1→A, 2→B, 3→C, 4→D (forward)
      // Pot 2: 5→D, 6→C, 7→B, 8→A (reverse)
      // Pot 3: 9→A, 10→B, 11→C, 12→D (forward)
      // Pot 4: 13→D, 14→C, 15→B, 16→A (reverse)
      const seedOrder = [
        ["A", "B", "C", "D"],  // Pot 1
        ["D", "C", "B", "A"],  // Pot 2
        ["A", "B", "C", "D"],  // Pot 3
        ["D", "C", "B", "A"]   // Pot 4
      ];

      for (let pot = 0; pot < 4; pot++) {
        for (let slot = 0; slot < 4; slot++) {
          const playerIdx = pot * 4 + slot;
          const groupKey = seedOrder[pot][slot];
          groups[groupKey].players.push(participants[playerIdx]);
        }
      }

      // Shuffle order within each group for match randomness
      groupNames.forEach(gk => {
        groups[gk].players = groups[gk].players.sort(() => Math.random() - 0.5);
      });

      // Build round-robin schedule (6 matches per group for 4 players)
      // Round 1: 0v1, 2v3 | Round 2: 0v2, 1v3 | Round 3: 0v3, 1v2
      const rrPairs = [[0,1,2,3], [0,2,1,3], [0,3,1,2]]; // each sub-array: [m1p1, m1p2, m2p1, m2p2]
      groupNames.forEach(gk => {
        const p = groups[gk].players;
        let matchIdx = 0;
        rrPairs.forEach(pairs => {
          groups[gk].matches[matchIdx] = { p1: p[pairs[0]], p2: p[pairs[1]], s1: "", s2: "", winner: "", raceTo: 4 };
          matchIdx++;
          groups[gk].matches[matchIdx] = { p1: p[pairs[2]], p2: p[pairs[3]], s1: "", s2: "", winner: "", raceTo: 4 };
          matchIdx++;
        });

        // Initialize standings
        groups[gk].standings = p.map(name => ({
          name, played: 0, won: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, points: 0
        }));
      });

      const bracketData = {
        phase: "qualification",
        groups: groups,
        mainBracket: {},
        thirdPlace: { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 }
      };

      event.bracket = JSON.stringify(bracketData);
      event.results = "{}";
      event.status = "Ongoing";
      event.bracket_size = "16";

      await saveEventDetails(event);
      showCustomToast("Battle of Champions berhasil dimulai! Babak Kualifikasi Grup siap dimainkan.", "success");
      openEventDetail(event.id);
    };

    showCustomConfirm(
      "Mulai Battle of Champions",
      `16 atlet teratas dari klasemen sirkuit akan dibagi ke 4 grup (A, B, C, D) dengan sistem serpentine seeding. Setiap grup bermain setengah kompetisi (round-robin). 2 teratas per grup lolos ke Babak Utama (Bracket 8). Lanjutkan?`,
      startBoc,
      "Mulai",
      "primary"
    );
    return;
  }

  // --- DOUBLE POOL (Pool A-B) ---
  if (elimType === "double_pool") {
    const totalNeeded = B;
    if (participants.length > totalNeeded) {
      showCustomToast(`Peserta melebihi kapasitas bracket (${totalNeeded})! Saat ini: ${participants.length}`, "error");
      return;
    }
    if (participants.length < 2) {
      showCustomToast(`Minimal 2 atlet diperlukan untuk memulai turnamen!`, "error");
      return;
    }

    const startDoublePool = async () => {
      // Pad with BYE if needed
      const padded = [...participants];
      while (padded.length < totalNeeded) padded.push("BYE");

      const poolA = [...padded].sort(() => Math.random() - 0.5);
      const poolB = [...padded].sort(() => Math.random() - 0.5);

      const bracketData = {
        poolA: buildSingleEliminationBracket(poolA, B),
        poolB: buildSingleEliminationBracket(poolB, B),
        grandFinal: { p1: "", p2: "", s1: "", s2: "", winner: "" }
      };

      // Auto-resolve BYE matches in both pools
      autoResolveByes(bracketData.poolA, B);
      autoResolveByes(bracketData.poolB, B);

      event.bracket = JSON.stringify(bracketData);
      event.results = "{}";
      event.status = "Ongoing";

      await saveEventDetails(event);
      showCustomToast("Bracket Pool A-B berhasil dibuat dan turnamen dimulai!", "success");
      openEventDetail(event.id);
    };

    if (participants.length < totalNeeded) {
      const byeCount = totalNeeded - participants.length;
      showCustomConfirm(
        "Sistem BYE Otomatis",
        `Jumlah peserta (${participants.length}) kurang dari kapasitas bracket (${totalNeeded}). ${byeCount} slot kosong akan diisi dengan BYE secara otomatis. Atlet yang mendapat lawan BYE akan langsung menang tanpa bertanding. Lanjutkan?`,
        startDoublePool,
        "Mulai",
        "primary"
      );
    } else {
      await startDoublePool();
    }
    return;
  }

  // --- DOUBLE UPPER-LOWER ---
  if (elimType === "double_upper_lower") {
    if (participants.length > B) {
      showCustomToast(`Peserta melebihi kapasitas bracket (${B})! Saat ini: ${participants.length}`, "error");
      return;
    }
    if (participants.length < 2) {
      showCustomToast(`Minimal 2 atlet diperlukan untuk memulai turnamen!`, "error");
      return;
    }

    const startDoubleUL = async () => {
      // Pad with BYE if needed
      const padded = [...participants];
      while (padded.length < B) padded.push("BYE");

      const shuffled = [...padded].sort(() => Math.random() - 0.5);
      const upper = buildSingleEliminationBracket(shuffled, B);

      const lowerMatchCount = B - 1;
      const lower = {};
      for (let i = 0; i < lowerMatchCount; i++) {
        lower[i] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
      }

      const bracketData = {
        upper: upper,
        lower: lower,
        grandFinal: { p1: "", p2: "", s1: "", s2: "", winner: "" }
      };

      // Auto-resolve BYE matches in upper bracket, cascade to lower
      autoResolveByesDoubleUL(bracketData, B);

      event.bracket = JSON.stringify(bracketData);
      event.results = "{}";
      event.status = "Ongoing";

      await saveEventDetails(event);
      showCustomToast("Bracket Upper-Lower berhasil dibuat dan turnamen dimulai!", "success");
      openEventDetail(event.id);
    };

    if (participants.length < B) {
      const byeCount = B - participants.length;
      showCustomConfirm(
        "Sistem BYE Otomatis",
        `Jumlah peserta (${participants.length}) kurang dari kapasitas bracket (${B}). ${byeCount} slot kosong akan diisi dengan BYE secara otomatis. Atlet yang mendapat lawan BYE akan langsung menang tanpa bertanding. Lanjutkan?`,
        startDoubleUL,
        "Mulai",
        "primary"
      );
    } else {
      await startDoubleUL();
    }
    return;
  }

  // --- SINGLE ELIMINATION (default) ---
  if (participants.length > B) {
    showCustomToast(`Peserta melebihi kapasitas bracket (${B})! Saat ini: ${participants.length}`, "error");
    return;
  }
  if (participants.length < 2) {
    showCustomToast(`Minimal 2 atlet diperlukan untuk memulai turnamen!`, "error");
    return;
  }

  const startSingleElim = async () => {
    // Pad with BYE if needed
    const padded = [...participants];
    while (padded.length < B) padded.push("BYE");

    const shuffled = [...padded].sort(() => Math.random() - 0.5);
    const bracket = buildSingleEliminationBracket(shuffled, B);

    // Auto-resolve BYE matches
    autoResolveByes(bracket, B);

    event.bracket = JSON.stringify(bracket);
    event.results = "{}";
    event.status = "Ongoing";

    await saveEventDetails(event);
    showCustomToast("Bracket turnamen berhasil diacak dan dimulai!", "success");
    openEventDetail(event.id);
  };

  if (participants.length < B) {
    const byeCount = B - participants.length;
    showCustomConfirm(
      "Sistem BYE Otomatis",
      `Jumlah peserta (${participants.length}) kurang dari kapasitas bracket (${B}). ${byeCount} slot kosong akan diisi dengan BYE secara otomatis. Atlet yang mendapat lawan BYE akan langsung menang tanpa bertanding. Lanjutkan?`,
      startSingleElim,
      "Mulai",
      "primary"
    );
  } else {
    await startSingleElim();
  }
};

// Helper: Get next match info for double elimination (upper and lower brackets)
function getDoubleEliminationNextMatch(matchIdx, context, B) {
  if (context === 'grandFinal') {
    return { isFinal: true };
  }
  if (context === 'upper') {
    if (matchIdx === B - 2) {
      return { isGrandFinal: true, slot: 'p1', loserIdx: B - 3, loserIsEven: false };
    }
    let startIdx = 0;
    let roundSize = B / 2;
    let r = 1;
    while (roundSize > 1) {
      if (matchIdx >= startIdx && matchIdx < startIdx + roundSize) {
        const offset = matchIdx - startIdx;
        const nextStartIdx = startIdx + roundSize;
        const nextIdx = nextStartIdx + Math.floor(offset / 2);
        const isEven = (offset % 2 === 0);
        let loserIdx;
        let loserIsEven;
        if (r === 1) {
          loserIdx = Math.floor(offset / 2);
          loserIsEven = (offset % 2 === 0);
        } else if (r === 2) {
          // Format B: UB Round 2 losers play each other in the second half of LB Round 2
          const lbRound2Start = B / 4;
          const lbRound2Size = B / 4;
          loserIdx = lbRound2Start + lbRound2Size / 2 + Math.floor(offset / 2);
          loserIsEven = (offset % 2 === 0);
        } else {
          loserIdx = matchIdx - B / Math.pow(2, r);
          loserIsEven = false;
        }
        return { nextIdx, isEven, isLower: false, loserIdx, loserIsEven };
      }
      startIdx += roundSize;
      roundSize /= 2;
      r++;
    }
  } else if (context === 'lower') {
    let currentStart = 0;
    let stage = 0;
    let roundSize = 0;
    const numStages = 2 * Math.log2(B) - 2;
    for (let s = 1; s <= numStages; s++) {
      const m = Math.floor((s + 1) / 2);
      const size = B / Math.pow(2, m + 1);
      if (matchIdx >= currentStart && matchIdx < currentStart + size) {
        stage = s;
        roundSize = size;
        break;
      }
      currentStart += size;
    }
    if (stage === 0) {
      return { isFinal: true };
    }
    if (stage === numStages) {
      return { isGrandFinal: true, slot: 'p2' };
    }
    if (stage % 2 === 1) {
      if (stage === 1) {
        const offset = matchIdx - currentStart;
        return { nextIdx: currentStart + roundSize + Math.floor(offset / 2), isEven: (offset % 2 === 0), isLower: true };
      } else {
        return { nextIdx: matchIdx + roundSize, isEven: true, isLower: true };
      }
    } else {
      if (stage === 2) {
        const offset = matchIdx - currentStart;
        const halfSize = roundSize / 2;
        if (offset < halfSize) {
          return { nextIdx: currentStart + roundSize + offset, isEven: true, isLower: true };
        } else {
          return { nextIdx: currentStart + roundSize + (offset - halfSize), isEven: false, isLower: true };
        }
      } else {
        const offset = matchIdx - currentStart;
        return { nextIdx: currentStart + roundSize + Math.floor(offset / 2), isEven: (offset % 2 === 0), isLower: true };
      }
    }
  }
  return { isFinal: true };
}

// Helper: Get lower bracket round name
function getRoundNameLower(matchIdx, B) {
  const numStages = 2 * Math.log2(B) - 2;
  if (matchIdx === B - 3) return "Lower Final";
  if (matchIdx === B - 4) return "Lower Semifinal";

  let currentStart = 0;
  for (let stage = 1; stage <= numStages - 2; stage++) {
    const m = Math.floor((stage + 1) / 2);
    const size = B / Math.pow(2, m + 1);
    if (matchIdx >= currentStart && matchIdx < currentStart + size) {
      return `Lower Round ${stage}`;
    }
    currentStart += size;
  }
  return "Lower Match";
}

// Helper: Clear downstream matches for double elimination upper-lower format
function clearDownstreamMatchesDouble(bracket, matchIdx, context, B) {
  const matchInfo = getDoubleEliminationNextMatch(matchIdx, context, B);
  if (matchInfo.isFinal) return;

  if (matchInfo.isGrandFinal) {
    bracket.grandFinal.p1 = (matchInfo.slot === 'p1') ? "" : bracket.grandFinal.p1;
    bracket.grandFinal.p2 = (matchInfo.slot === 'p2') ? "" : bracket.grandFinal.p2;
    bracket.grandFinal.s1 = "";
    bracket.grandFinal.s2 = "";
    bracket.grandFinal.winner = "";
    return;
  }

  // Clear winner propagation path
  if (matchInfo.isLower) {
    const nextMatch = bracket.lower[matchInfo.nextIdx];
    if (nextMatch) {
      if (matchInfo.isEven) nextMatch.p1 = "";
      else nextMatch.p2 = "";
      nextMatch.s1 = "";
      nextMatch.s2 = "";
      nextMatch.winner = "";
      clearDownstreamMatchesDouble(bracket, matchInfo.nextIdx, 'lower', B);
    }
  } else {
    const nextMatch = bracket.upper[matchInfo.nextIdx];
    if (nextMatch) {
      if (matchInfo.isEven) nextMatch.p1 = "";
      else nextMatch.p2 = "";
      nextMatch.s1 = "";
      nextMatch.s2 = "";
      nextMatch.winner = "";
      clearDownstreamMatchesDouble(bracket, matchInfo.nextIdx, 'upper', B);
    }
  }

  // Clear loser propagation path (only if it was an Upper Bracket match)
  if (context === 'upper' && matchInfo.loserIdx !== undefined) {
    const loserMatch = bracket.lower[matchInfo.loserIdx];
    if (loserMatch) {
      if (matchInfo.loserIsEven) loserMatch.p1 = "";
      else loserMatch.p2 = "";
      loserMatch.s1 = "";
      loserMatch.s2 = "";
      loserMatch.winner = "";
      clearDownstreamMatchesDouble(bracket, matchInfo.loserIdx, 'lower', B);
    }
  }
}

// Helper: Clear downstream matches for double elimination pool format
function clearDownstreamMatchesDoublePool(bracket, matchIdx, poolLabel, B) {
  const matchInfo = getNextMatchInfo(matchIdx, B);
  if (matchInfo.isFinal) {
    if (poolLabel === 'poolA') {
      bracket.grandFinal.p1 = "";
    } else {
      bracket.grandFinal.p2 = "";
    }
    bracket.grandFinal.s1 = "";
    bracket.grandFinal.s2 = "";
    bracket.grandFinal.winner = "";
    updateGrandFinalSlots(bracket, B);
    return;
  }
  const poolBracket = bracket[poolLabel];
  const nextMatchIdx = matchInfo.nextIdx;
  const isEven = matchInfo.isEven;
  if (poolBracket[nextMatchIdx]) {
    if (isEven) {
      poolBracket[nextMatchIdx].p1 = "";
    } else {
      poolBracket[nextMatchIdx].p2 = "";
    }
    poolBracket[nextMatchIdx].s1 = "";
    poolBracket[nextMatchIdx].s2 = "";
    poolBracket[nextMatchIdx].winner = "";
    clearDownstreamMatchesDoublePool(bracket, nextMatchIdx, poolLabel, B);
  }
  updateGrandFinalSlots(bracket, B);
}

// Helper: Update grand final slots for double pool format
function updateGrandFinalSlots(bracket, B) {
  if (!bracket || !bracket.grandFinal) return;
  const finalMatchIdx = B - 2;
  const poolAFinal = bracket.poolA ? bracket.poolA[finalMatchIdx] : null;
  const poolBFinal = bracket.poolB ? bracket.poolB[finalMatchIdx] : null;
  
  if (poolAFinal && poolBFinal && poolAFinal.winner && poolBFinal.winner) {
    if (poolAFinal.winner === poolBFinal.winner) {
      // Same winner! Put pool losers as Grand Final players to play for 2nd place
      const loserA = poolAFinal.winner === poolAFinal.p1 ? poolAFinal.p2 : poolAFinal.p1;
      const loserB = poolBFinal.winner === poolBFinal.p1 ? poolBFinal.p2 : poolBFinal.p1;
      bracket.grandFinal.p1 = loserA || "";
      bracket.grandFinal.p2 = loserB || "";
    } else {
      bracket.grandFinal.p1 = poolAFinal.winner;
      bracket.grandFinal.p2 = poolBFinal.winner;
    }
  } else {
    bracket.grandFinal.p1 = poolAFinal?.winner || "";
    bracket.grandFinal.p2 = poolBFinal?.winner || "";
  }
}

// Helper: Build a standard single-elimination bracket object from a participant list
function buildSingleEliminationBracket(players, size) {
  const bracket = {};
  const firstRoundMatches = size / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    bracket[i] = {
      p1: players[i * 2] || "",
      p2: players[i * 2 + 1] || "",
      s1: "",
      s2: "",
      winner: ""
    };
  }
  const totalMatches = size - 1;
  for (let i = firstRoundMatches; i < totalMatches; i++) {
    bracket[i] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
  }
  return bracket;
}

// ============================================================
// BYE Auto-Resolution System
// ============================================================

/**
 * Auto-resolve BYE matches for single elimination / pool brackets.
 * Sweeps all matches recursively: if either player is "BYE",
 * the real player wins automatically and is propagated forward.
 */
function autoResolveByes(bracket, B) {
  let changed = true;
  // Iterate until no more changes (handles cascading BYEs)
  while (changed) {
    changed = false;
    const totalMatches = B - 1;
    for (let i = 0; i < totalMatches; i++) {
      const m = bracket[i];
      if (!m || m.winner) continue; // already resolved
      if (!m.p1 && !m.p2) continue; // both empty

      const p1IsBye = m.p1 === "BYE";
      const p2IsBye = m.p2 === "BYE";

      if (!p1IsBye && !p2IsBye) continue; // no BYE
      if (!m.p1 || !m.p2) continue; // one slot still empty (TBD)

      // Both BYE → propagate BYE upward
      if (p1IsBye && p2IsBye) {
        m.winner = "BYE";
        m.status = "completed";
      } else {
        // One BYE → real player wins
        m.winner = p1IsBye ? m.p2 : m.p1;
        m.status = "completed";
      }

      // Propagate winner to next round
      const matchInfo = getNextMatchInfo(i, B);
      if (!matchInfo.isFinal) {
        if (!bracket[matchInfo.nextIdx]) {
          bracket[matchInfo.nextIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
        }
        if (matchInfo.isEven) {
          bracket[matchInfo.nextIdx].p1 = m.winner;
        } else {
          bracket[matchInfo.nextIdx].p2 = m.winner;
        }
      }
      changed = true;
    }
  }
}

/**
 * Auto-resolve BYE matches for Double Upper-Lower bracket.
 * 1. Sweep Upper Bracket - auto-resolve BYEs, propagate winners up, drop losers to Lower.
 * 2. Sweep Lower Bracket - auto-resolve any BYEs that landed there.
 */
function autoResolveByesDoubleUL(bracketData, B) {
  const upper = bracketData.upper;
  const lower = bracketData.lower;

  // --- Pass 1: Upper Bracket ---
  let changed = true;
  while (changed) {
    changed = false;
    const totalUpperMatches = B - 1;
    for (let i = 0; i < totalUpperMatches; i++) {
      const m = upper[i];
      if (!m || m.winner) continue;
      if (!m.p1 && !m.p2) continue;
      if (!m.p1 || !m.p2) continue;

      const p1IsBye = m.p1 === "BYE";
      const p2IsBye = m.p2 === "BYE";
      if (!p1IsBye && !p2IsBye) continue;

      if (p1IsBye && p2IsBye) {
        m.winner = "BYE";
      } else {
        m.winner = p1IsBye ? m.p2 : m.p1;
      }
      m.status = "completed";

      // Propagate winner in upper bracket
      const matchInfo = getDoubleEliminationNextMatch(i, 'upper', B);
      if (matchInfo.isGrandFinal) {
        bracketData.grandFinal.p1 = m.winner;
      } else if (matchInfo.nextIdx !== undefined) {
        if (!upper[matchInfo.nextIdx]) {
          upper[matchInfo.nextIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
        }
        if (matchInfo.isEven) {
          upper[matchInfo.nextIdx].p1 = m.winner;
        } else {
          upper[matchInfo.nextIdx].p2 = m.winner;
        }
      }

      // Drop loser to lower bracket
      if (matchInfo.loserIdx !== undefined) {
        const loser = m.winner === m.p1 ? m.p2 : m.p1;
        if (loser) {
          if (!lower[matchInfo.loserIdx]) {
            lower[matchInfo.loserIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
          }
          if (matchInfo.loserIsEven) {
            lower[matchInfo.loserIdx].p1 = loser;
          } else {
            lower[matchInfo.loserIdx].p2 = loser;
          }
        }
      }
      changed = true;
    }
  }

  // --- Pass 2: Lower Bracket ---
  changed = true;
  while (changed) {
    changed = false;
    const totalLowerMatches = B - 1;
    for (let i = 0; i < totalLowerMatches; i++) {
      const m = lower[i];
      if (!m || m.winner) continue;
      if (!m.p1 && !m.p2) continue;
      if (!m.p1 || !m.p2) continue;

      const p1IsBye = m.p1 === "BYE";
      const p2IsBye = m.p2 === "BYE";
      if (!p1IsBye && !p2IsBye) continue;

      if (p1IsBye && p2IsBye) {
        m.winner = "BYE";
      } else {
        m.winner = p1IsBye ? m.p2 : m.p1;
      }
      m.status = "completed";

      // Propagate winner in lower bracket
      const matchInfo = getDoubleEliminationNextMatch(i, 'lower', B);
      if (matchInfo.isGrandFinal) {
        bracketData.grandFinal.p2 = m.winner;
      } else if (matchInfo.nextIdx !== undefined) {
        if (!lower[matchInfo.nextIdx]) {
          lower[matchInfo.nextIdx] = { p1: "", p2: "", s1: "", s2: "", winner: "" };
        }
        if (matchInfo.isEven) {
          lower[matchInfo.nextIdx].p1 = m.winner;
        } else {
          lower[matchInfo.nextIdx].p2 = m.winner;
        }
      }
      changed = true;
    }
  }
}

// Pool Assignment Modal for Double Pool format
function showPoolAssignmentModal(event, participants, poolSize) {
  // Auto-shuffle into two pools
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  let poolA = shuffled.slice(0, poolSize);
  let poolB = shuffled.slice(poolSize, poolSize * 2);

  // Create or reuse modal overlay
  let modalOverlay = document.getElementById("pool-assignment-modal");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "pool-assignment-modal";
    modalOverlay.className = "pm-modal-overlay";
    document.body.appendChild(modalOverlay);
  }
  modalOverlay.style.display = "flex";

  function renderPoolModal() {
    const getHC = (name) => {
      const p = (appData.players || []).find(a => a.name === name);
      return p ? p.handicap : "-";
    };

    const renderPlayerRow = (name, poolLabel, idx) => {
      const hc = getHC(name);
      return `
        <div class="pool-assign-player" data-pool="${poolLabel}" data-idx="${idx}" draggable="true" 
             ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({pool:'${poolLabel}',idx:${idx}})); event.currentTarget.classList.add('dragging');"
             ondragend="event.currentTarget.classList.remove('dragging');"
             ondragover="event.preventDefault(); event.currentTarget.classList.add('drag-over');"
             ondragleave="event.currentTarget.classList.remove('drag-over');"
             ondrop="event.preventDefault(); event.currentTarget.classList.remove('drag-over'); window._poolAssignDrop('${poolLabel}', ${idx}, event);">
          <span class="pool-assign-number">${idx + 1}</span>
          <span class="pool-assign-name">${name}</span>
          <span class="table-badge-hc ${getHandicapColorClass(hc)}" style="font-size: 0.65rem; padding: 1px 6px;">HC ${hc}</span>
        </div>`;
    };

    modalOverlay.innerHTML = `
      <div class="pm-modal" style="width: 780px; max-width: 95%; max-height: 85vh;">
        <div class="pm-modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 16px;">
          <div>
            <h3 style="font-family: var(--font-headers); font-size: 1.3rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; margin: 0;">
              <i class="fa-solid fa-people-arrows text-accent"></i> Pembagian Pool A & Pool B
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">
              Drag & drop pemain antar pool untuk menyesuaikan. Total: <strong>${poolSize * 2} atlet</strong> → <strong>${poolSize} per pool</strong>.
            </p>
          </div>
          <button class="pm-modal-close" onclick="document.getElementById('pool-assignment-modal').style.display='none'">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px 24px; overflow-y: auto; max-height: calc(85vh - 200px);">
          <!-- Pool A -->
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; color: #fff; letter-spacing: 1px;">POOL A</span>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${poolA.length} pemain</span>
            </div>
            <div class="pool-assign-list" id="pool-assign-list-a">
              ${poolA.map((name, idx) => renderPlayerRow(name, "A", idx)).join("")}
            </div>
          </div>
          <!-- Pool B -->
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; color: #fff; letter-spacing: 1px;">POOL B</span>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${poolB.length} pemain</span>
            </div>
            <div class="pool-assign-list" id="pool-assign-list-b">
              ${poolB.map((name, idx) => renderPlayerRow(name, "B", idx)).join("")}
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <button class="pm-btn pm-btn-outline" id="pool-assign-reshuffle" style="font-size: 0.82rem;">
            <i class="fa-solid fa-shuffle"></i> Acak Ulang
          </button>
          <div style="display: flex; gap: 10px;">
            <button class="pm-btn pm-btn-outline" onclick="document.getElementById('pool-assignment-modal').style.display='none'" style="font-size: 0.82rem;">Batal</button>
            <button class="pm-btn pm-btn-primary" id="pool-assign-confirm" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); font-size: 0.82rem;">
              <i class="fa-solid fa-check"></i> Konfirmasi & Mulai Turnamen
            </button>
          </div>
        </div>
      </div>
    `;

    // Reshuffle button
    const reshuffleBtn = document.getElementById("pool-assign-reshuffle");
    if (reshuffleBtn) {
      reshuffleBtn.onclick = () => {
        const allPlayers = [...poolA, ...poolB].sort(() => Math.random() - 0.5);
        poolA = allPlayers.slice(0, poolSize);
        poolB = allPlayers.slice(poolSize, poolSize * 2);
        renderPoolModal();
        showCustomToast("Pool diacak ulang!", "info");
      };
    }

    // Confirm button
    const confirmBtn = document.getElementById("pool-assign-confirm");
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        // Save pool assignments into bracket, then re-trigger initializeBracket
        const assignments = { _poolAssignments: { poolA: [...poolA], poolB: [...poolB] } };
        event.bracket = JSON.stringify(assignments);
        await saveEventDetails(event);
        modalOverlay.style.display = "none";
        // Now re-call initializeBracket — it will find the _poolAssignments and build the bracket
        await window.initializeBracket(event.id);
      };
    }

    // Drop handler for swapping players between pools
    window._poolAssignDrop = function(targetPool, targetIdx, dropEvent) {
      try {
        const source = JSON.parse(dropEvent.dataTransfer.getData("text/plain"));
        const sourcePool = source.pool;
        const sourceIdx = source.idx;

        const sourceArr = sourcePool === "A" ? poolA : poolB;
        const targetArr = targetPool === "A" ? poolA : poolB;

        // Swap players
        const temp = targetArr[targetIdx];
        targetArr[targetIdx] = sourceArr[sourceIdx];
        sourceArr[sourceIdx] = temp;

        renderPoolModal();
      } catch (ex) {
        console.error("Pool assign drop error:", ex);
      }
    };
  }

  renderPoolModal();
}

// --- BATTLE OF CHAMPIONS (BOC) RENDERER & LOGIC ---

// Recalculate group standings based on matches
function recalculateGroupStandings(group) {
  // Reset standings
  group.standings.forEach(s => {
    s.played = 0;
    s.won = 0;
    s.lost = 0;
    s.scoreFor = 0;
    s.scoreAgainst = 0;
    s.points = 0;
  });

  // Loop matches
  for (const key in group.matches) {
    const m = group.matches[key];
    if (m.winner) {
      const p1 = group.standings.find(s => s.name === m.p1);
      const p2 = group.standings.find(s => s.name === m.p2);
      if (!p1 || !p2) continue;

      const s1 = parseInt(m.s1, 10) || 0;
      const s2 = parseInt(m.s2, 10) || 0;
      const raceTo = parseInt(m.raceTo, 10) || 4;

      p1.played++;
      p2.played++;
      p1.scoreFor += s1;
      p1.scoreAgainst += s2;
      p2.scoreFor += s2;
      p2.scoreAgainst += s1;

      if (m.winner === m.p1) {
        p1.won++;
        p2.lost++;
        if (s1 === raceTo && s2 === raceTo - 1) {
          p1.points += 2;
          p2.points += 1;
        } else {
          p1.points += 3;
          p2.points += 0;
        }
      } else {
        p2.won++;
        p1.lost++;
        if (s2 === raceTo && s1 === raceTo - 1) {
          p2.points += 2;
          p1.points += 1;
        } else {
          p2.points += 3;
          p1.points += 0;
        }
      }
    }
  }

  // Sort standings: Points desc, then score difference desc, then scoreFor desc, then H2H
  group.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.scoreFor - a.scoreAgainst;
    const diffB = b.scoreFor - b.scoreAgainst;
    if (diffB !== diffA) return diffB - diffA;
    if (b.scoreFor !== a.scoreFor) return b.scoreFor - a.scoreFor;
    
    // Head-to-head check
    for (const key in group.matches) {
      const m = group.matches[key];
      if ((m.p1 === a.name && m.p2 === b.name) || (m.p1 === b.name && m.p2 === a.name)) {
        if (m.winner === a.name) return -1;
        if (m.winner === b.name) return 1;
      }
    }
    return 0;
  });
}

// Generate Main Bracket (8-player single elimination) from top 2 of groups A, B, C, D
window.generateBocMainBracket = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan membuat bracket.", "error");
    return;
  }

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (e) {}

  // Double check that all 24 group matches are completed
  const groupNames = ["A", "B", "C", "D"];
  for (const gk of groupNames) {
    const grp = bracket.groups?.[gk];
    for (let i = 0; i < 6; i++) {
      if (!grp?.matches?.[i]?.winner) {
        showCustomToast(`Grup ${gk} Match ${i + 1} belum selesai!`, "error");
        return;
      }
    }
  }

  const startGeneration = async () => {
    // Collect Rank 1 and Rank 2 from each group
    const rank1Players = [];
    const rank2Players = [];

    groupNames.forEach(gk => {
      const standings = bracket.groups[gk].standings;
      // Recalculate to be absolutely sure
      recalculateGroupStandings(bracket.groups[gk]);
      
      rank1Players.push({ name: standings[0].name, group: gk });
      rank2Players.push({ name: standings[1].name, group: gk });
    });

    // Seeding Rank 1 vs Rank 2 under constraints:
    // 1. Rank 1 from Group X must play Rank 2 from Group Y (X != Y)
    // 2. Rank 1 & Rank 2 from same group cannot be in the same half of the bracket (upper half: matches 0 & 1, lower half: matches 2 & 3).
    let attempts = 0;
    let success = false;
    let finalPairs = [];

    while (attempts < 1000 && !success) {
      attempts++;
      const r1 = [...rank1Players].sort(() => Math.random() - 0.5);
      const r2 = [...rank2Players].sort(() => Math.random() - 0.5);
      
      let valid = true;
      const pairs = [];
      for (let i = 0; i < 4; i++) {
        if (r1[i].group === r2[i].group) {
          valid = false;
          break;
        }
        pairs.push([r1[i], r2[i]]);
      }
      if (!valid) continue;

      const upperGroups = new Set([pairs[0][0].group, pairs[0][1].group, pairs[1][0].group, pairs[1][1].group]);
      const lowerGroups = new Set([pairs[2][0].group, pairs[2][1].group, pairs[3][0].group, pairs[3][1].group]);

      if (upperGroups.size === 4 && lowerGroups.size === 4) {
        finalPairs = pairs;
        success = true;
      }
    }

    if (!success) {
      finalPairs = [];
      for (let i = 0; i < 4; i++) {
        finalPairs.push([rank1Players[i], rank2Players[(i + 1) % 4]]);
      }
    }

    // Build main bracket matches (0 to 6)
    bracket.mainBracket = {
      "0": { p1: finalPairs[0][0].name, p2: finalPairs[0][1].name, s1: "", s2: "", winner: "", raceTo: 5 },
      "1": { p1: finalPairs[1][0].name, p2: finalPairs[1][1].name, s1: "", s2: "", winner: "", raceTo: 5 },
      "2": { p1: finalPairs[2][0].name, p2: finalPairs[2][1].name, s1: "", s2: "", winner: "", raceTo: 5 },
      "3": { p1: finalPairs[3][0].name, p2: finalPairs[3][1].name, s1: "", s2: "", winner: "", raceTo: 5 },
      "4": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 },
      "5": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 },
      "6": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 7 }
    };
    bracket.thirdPlace = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
    bracket.phase = "main";

    event.bracket = JSON.stringify(bracket);
    await saveEventDetails(event);
    showCustomToast("Bracket Babak Utama berhasil dibuat secara otomatis!", "success");
    openEventDetail(event.id);
  };

  showCustomConfirm(
    "Generate Babak Utama?",
    "Peringkat 1 & 2 dari masing-masing grup akan diundi masuk ke slot perempat final (seeding otomatis dengan batasan grup). Lanjutkan?",
    startGeneration,
    "Generate",
    "primary"
  );
};

// --- BOC MANUAL SEEDING & BRACKET LOGIC ---
function updateGroupSelectOptions() {
  const selects = Array.from(document.querySelectorAll(".boc-manual-group-select"));
  const selectedValues = new Set();
  
  selects.forEach(sel => {
    if (sel.value) {
      selectedValues.add(sel.value);
    }
  });
  
  selects.forEach(sel => {
    const currentVal = sel.value;
    const options = sel.querySelectorAll("option");
    options.forEach(opt => {
      const optVal = opt.value;
      if (!optVal) return;
      if (optVal !== currentVal && selectedValues.has(optVal)) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });
  });
  
  let hasDuplicate = false;
  const uniqueVals = new Set();
  let filledCount = 0;
  selects.forEach(sel => {
    if (sel.value) {
      filledCount++;
      if (uniqueVals.has(sel.value)) {
        hasDuplicate = true;
      }
      uniqueVals.add(sel.value);
    }
  });
  
  const alertEl = document.getElementById("boc-manual-group-alert");
  const submitBtn = document.getElementById("boc-manual-group-submit");
  
  if (hasDuplicate) {
    if (alertEl) {
      alertEl.style.display = "block";
      alertEl.textContent = "Duplikasi Terdeteksi: Beberapa atlet dipilih lebih dari satu kali!";
    }
    if (submitBtn) submitBtn.disabled = true;
  } else if (filledCount < 16) {
    if (alertEl) {
      alertEl.style.display = "block";
      alertEl.textContent = `Semua slot harus diisi! (${filledCount} dari 16 terisi)`;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (alertEl) alertEl.style.display = "none";
    if (submitBtn) submitBtn.disabled = false;
  }
}

function updateBracketSelectOptions() {
  const selects = Array.from(document.querySelectorAll(".boc-manual-bracket-select"));
  const selectedValues = new Set();
  
  selects.forEach(sel => {
    if (sel.value) {
      selectedValues.add(sel.value);
    }
  });
  
  selects.forEach(sel => {
    const currentVal = sel.value;
    const options = sel.querySelectorAll("option");
    options.forEach(opt => {
      const optVal = opt.value;
      if (!optVal) return;
      if (optVal !== currentVal && selectedValues.has(optVal)) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });
  });
  
  let hasDuplicate = false;
  const uniqueVals = new Set();
  let filledCount = 0;
  selects.forEach(sel => {
    if (sel.value) {
      filledCount++;
      if (uniqueVals.has(sel.value)) {
        hasDuplicate = true;
      }
      uniqueVals.add(sel.value);
    }
  });
  
  const alertEl = document.getElementById("boc-manual-bracket-alert");
  const submitBtn = document.getElementById("boc-manual-bracket-submit");
  
  if (hasDuplicate) {
    if (alertEl) {
      alertEl.style.display = "block";
      alertEl.textContent = "Duplikasi Terdeteksi: Beberapa atlet dipilih lebih dari satu kali!";
    }
    if (submitBtn) submitBtn.disabled = true;
  } else if (filledCount < 8) {
    if (alertEl) {
      alertEl.style.display = "block";
      alertEl.textContent = `Semua slot harus diisi! (${filledCount} dari 8 terisi)`;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (alertEl) alertEl.style.display = "none";
    if (submitBtn) submitBtn.disabled = false;
  }
}

window.openBocManualGroupModal = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengatur grup.", "error");
    return;
  }

  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (ex) {}
  if (participants.length === 0) {
    const sortedStandings = [...(appData.standings || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
    participants = sortedStandings.slice(0, 16).map(p => p.name);
  }
  if (participants.length !== 16) {
    showCustomToast(`BOC memerlukan tepat 16 peserta!`, "error");
    return;
  }

  const seedOrder = [
    ["A", "B", "C", "D"],
    ["D", "C", "B", "A"],
    ["A", "B", "C", "D"],
    ["D", "C", "B", "A"]
  ];
  const initialGroups = { A: [], B: [], C: [], D: [] };
  for (let pot = 0; pot < 4; pot++) {
    for (let slot = 0; slot < 4; slot++) {
      const playerIdx = pot * 4 + slot;
      const groupKey = seedOrder[pot][slot];
      initialGroups[groupKey].push(participants[playerIdx]);
    }
  }

  const selects = Array.from(document.querySelectorAll(".boc-manual-group-select"));
  selects.forEach(sel => {
    const parts = sel.id.split("-");
    const gkey = parts[2].toUpperCase();
    const slotIdx = parseInt(parts[3], 10);
    
    const initialPlayer = initialGroups[gkey]?.[slotIdx] || "";
    
    sel.innerHTML = `<option value="">-- Pilih Atlet --</option>` +
      participants.map(p => `<option value="${p}">${p}</option>`).join("");
      
    sel.value = initialPlayer;
    
    sel.removeEventListener("change", updateGroupSelectOptions);
    sel.addEventListener("change", updateGroupSelectOptions);
  });

  const submitBtn = document.getElementById("boc-manual-group-submit");
  if (submitBtn) {
    submitBtn.dataset.eventId = eventId;
    submitBtn.onclick = () => window.saveBocManualGroup(eventId);
  }

  const closeGroupModal = () => {
    document.getElementById("boc-manual-group-modal").style.display = "none";
  };
  
  const closeBtn = document.getElementById("boc-manual-group-modal-close");
  if (closeBtn) closeBtn.onclick = closeGroupModal;
  
  const cancelBtn = document.getElementById("boc-manual-group-modal-btn-cancel");
  if (cancelBtn) cancelBtn.onclick = closeGroupModal;

  updateGroupSelectOptions();
  document.getElementById("boc-manual-group-modal").style.display = "flex";
};

window.saveBocManualGroup = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengatur grup.", "error");
    return;
  }

  const groupNames = ["A", "B", "C", "D"];
  const groups = {
    A: { players: [], matches: {}, standings: [] },
    B: { players: [], matches: {}, standings: [] },
    C: { players: [], matches: {}, standings: [] },
    D: { players: [], matches: {}, standings: [] }
  };

  const selectedValues = [];
  for (const gk of groupNames) {
    const gkey = gk.toLowerCase();
    for (let slot = 0; slot < 4; slot++) {
      const val = document.getElementById(`boc-mgs-${gkey}-${slot}`).value;
      if (!val) {
        showCustomToast("Semua slot grup harus diisi!", "error");
        return;
      }
      groups[gk].players.push(val);
      selectedValues.push(val);
    }
  }

  const uniqueVals = new Set(selectedValues);
  if (uniqueVals.size !== 16) {
    showCustomToast("Terdapat atlet ganda yang dipilih!", "error");
    return;
  }

  const rrPairs = [[0,1,2,3], [0,2,1,3], [0,3,1,2]];
  groupNames.forEach(gk => {
    const p = groups[gk].players;
    let matchIdx = 0;
    rrPairs.forEach(pairs => {
      groups[gk].matches[matchIdx] = { p1: p[pairs[0]], p2: p[pairs[1]], s1: "", s2: "", winner: "", raceTo: 4 };
      matchIdx++;
      groups[gk].matches[matchIdx] = { p1: p[pairs[2]], p2: p[pairs[3]], s1: "", s2: "", winner: "", raceTo: 4 };
      matchIdx++;
    });

    groups[gk].standings = p.map(name => ({
      name, played: 0, won: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, points: 0
    }));
  });

  const bracketData = {
    phase: "qualification",
    groups: groups,
    mainBracket: {},
    thirdPlace: { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 }
  };

  event.bracket = JSON.stringify(bracketData);
  event.results = "{}";
  event.status = "Ongoing";
  event.bracket_size = "16";

  showCustomConfirm(
    "Mulai Turnamen BOC (Grup Manual)",
    "Apakah Anda yakin ingin memulai turnamen dengan pembagian grup ini?",
    async () => {
      try {
        await saveEventDetails(event);
        showCustomToast("Battle of Champions berhasil dimulai dengan grup manual!", "success");
        document.getElementById("boc-manual-group-modal").style.display = "none";
        openEventDetail(event.id);
      } catch (ex) {
        showCustomToast(`Gagal memulai turnamen: ${ex.message}`, "error");
      }
    },
    "Mulai",
    "primary"
  );
};

window.openBocManualBracketModal = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan membuat bracket.", "error");
    return;
  }

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (e) {}

  const groupNames = ["A", "B", "C", "D"];
  for (const gk of groupNames) {
    const grp = bracket.groups?.[gk];
    for (let i = 0; i < 6; i++) {
      if (!grp?.matches?.[i]?.winner) {
        showCustomToast(`Grup ${gk} Match ${i + 1} belum selesai!`, "error");
        return;
      }
    }
  }

  const rank1Players = [];
  const rank2Players = [];
  const all8Players = [];

  groupNames.forEach(gk => {
    const standings = bracket.groups[gk].standings;
    recalculateGroupStandings(bracket.groups[gk]);
    
    const p1 = { name: standings[0].name, group: gk, rank: 1 };
    const p2 = { name: standings[1].name, group: gk, rank: 2 };
    rank1Players.push(p1);
    rank2Players.push(p2);
    all8Players.push(p1, p2);
  });

  let attempts = 0;
  let success = false;
  let finalPairs = [];

  while (attempts < 1000 && !success) {
    attempts++;
    const r1 = [...rank1Players].sort(() => Math.random() - 0.5);
    const r2 = [...rank2Players].sort(() => Math.random() - 0.5);
    
    let valid = true;
    const pairs = [];
    for (let i = 0; i < 4; i++) {
      if (r1[i].group === r2[i].group) {
        valid = false;
        break;
      }
      pairs.push([r1[i], r2[i]]);
    }
    if (!valid) continue;

    const upperGroups = new Set([pairs[0][0].group, pairs[0][1].group, pairs[1][0].group, pairs[1][1].group]);
    const lowerGroups = new Set([pairs[2][0].group, pairs[2][1].group, pairs[3][0].group, pairs[3][1].group]);

    if (upperGroups.size === 4 && lowerGroups.size === 4) {
      finalPairs = pairs;
      success = true;
    }
  }

  if (!success) {
    finalPairs = [];
    for (let i = 0; i < 4; i++) {
      finalPairs.push([rank1Players[i], rank2Players[(i + 1) % 4]]);
    }
  }

  const selects = Array.from(document.querySelectorAll(".boc-manual-bracket-select"));
  selects.forEach(sel => {
    const parts = sel.id.split("-");
    const matchIdx = parseInt(parts[2], 10);
    const pKey = parts[3];
    
    const initialPlayer = pKey === "p1" ? finalPairs[matchIdx]?.[0]?.name : finalPairs[matchIdx]?.[1]?.name;
    
    sel.innerHTML = `<option value="">-- Pilih Atlet --</option>` +
      all8Players.map(p => `<option value="${p.name}">${p.name} (Grup ${p.group} - Rank ${p.rank})</option>`).join("");
      
    sel.value = initialPlayer || "";
    
    sel.removeEventListener("change", updateBracketSelectOptions);
    sel.addEventListener("change", updateBracketSelectOptions);
  });

  const submitBtn = document.getElementById("boc-manual-bracket-submit");
  if (submitBtn) {
    submitBtn.dataset.eventId = eventId;
    submitBtn.onclick = () => window.saveBocManualBracket(eventId);
  }

  const closeBracketModal = () => {
    document.getElementById("boc-manual-bracket-modal").style.display = "none";
  };
  
  const closeBtn = document.getElementById("boc-manual-bracket-modal-close");
  if (closeBtn) closeBtn.onclick = closeBracketModal;
  
  const cancelBtn = document.getElementById("boc-manual-bracket-modal-btn-cancel");
  if (cancelBtn) cancelBtn.onclick = closeBracketModal;

  updateBracketSelectOptions();
  document.getElementById("boc-manual-bracket-modal").style.display = "flex";
};

window.saveBocManualBracket = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan membuat bracket.", "error");
    return;
  }

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (e) {}

  const p0_1 = document.getElementById("boc-mbs-0-p1").value;
  const p0_2 = document.getElementById("boc-mbs-0-p2").value;
  const p1_1 = document.getElementById("boc-mbs-1-p1").value;
  const p1_2 = document.getElementById("boc-mbs-1-p2").value;
  const p2_1 = document.getElementById("boc-mbs-2-p1").value;
  const p2_2 = document.getElementById("boc-mbs-2-p2").value;
  const p3_1 = document.getElementById("boc-mbs-3-p1").value;
  const p3_2 = document.getElementById("boc-mbs-3-p2").value;

  const players = [p0_1, p0_2, p1_1, p1_2, p2_1, p2_2, p3_1, p3_2];
  if (players.some(p => !p)) {
    showCustomToast("Semua slot perempat final harus diisi!", "error");
    return;
  }
  const uniquePlayers = new Set(players);
  if (uniquePlayers.size !== 8) {
    showCustomToast("Terdapat atlet ganda yang dipilih!", "error");
    return;
  }

  const startBracketManual = async () => {
    try {
      bracket.mainBracket = {
        "0": { p1: p0_1, p2: p0_2, s1: "", s2: "", winner: "", raceTo: 5 },
        "1": { p1: p1_1, p2: p1_2, s1: "", s2: "", winner: "", raceTo: 5 },
        "2": { p1: p2_1, p2: p2_2, s1: "", s2: "", winner: "", raceTo: 5 },
        "3": { p1: p3_1, p2: p3_2, s1: "", s2: "", winner: "", raceTo: 5 },
        "4": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 },
        "5": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 },
        "6": { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 7 }
      };
      bracket.thirdPlace = { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
      bracket.phase = "main";

      event.bracket = JSON.stringify(bracket);
      await saveEventDetails(event);
      showCustomToast("Bracket Babak Utama berhasil dibuat secara manual!", "success");
      document.getElementById("boc-manual-bracket-modal").style.display = "none";
      openEventDetail(event.id);
    } catch (ex) {
      showCustomToast(`Gagal menyimpan bracket: ${ex.message}`, "error");
    }
  };

  showCustomConfirm(
    "Simpan & Buat Bracket Utama?",
    "Apakah Anda yakin ingin membuat bracket perempat final dengan pasangan yang Anda tentukan?",
    startBracketManual,
    "Buat Bracket",
    "primary"
  );
};

// Dev helper to automatically finish all 24 group matches for testing manual bracket flow
window.simulateFinishAllBocGroupMatches = async function() {
  const event = appData.events.find(evt => evt.elimination_type === 'boc');
  if (!event) {
    showCustomToast("Event BOC tidak ditemukan!", "error");
    return;
  }
  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (e) {}
  if (!bracket.groups) {
    showCustomToast("Grup BOC belum diinisialisasi!", "error");
    return;
  }
  
  const groupNames = ["A", "B", "C", "D"];
  groupNames.forEach(gk => {
    const grp = bracket.groups[gk];
    if (!grp) return;
    for (let i = 0; i < 6; i++) {
      const match = grp.matches?.[i];
      if (!match) continue;
      match.raceTo = 4;
      if (i % 2 === 0) {
        match.s1 = 4;
        match.s2 = 2;
        match.winner = match.p1;
      } else {
        match.s1 = 1;
        match.s2 = 4;
        match.winner = match.p2;
      }
      match.status = "completed";
    }
    recalculateGroupStandings(grp);
  });
  
  event.bracket = JSON.stringify(bracket);
  await saveEventDetails(event);
  showCustomToast("Semua 24 pertandingan grup berhasil diselesaikan secara otomatis!", "success");
  openEventDetail(event.id);
};


// Clean downstream matches in BOC main bracket when a result is changed/reset
function clearDownstreamBocMainMatches(bracket, matchIdx) {
  if (matchIdx === 0 || matchIdx === 1) {
    if (bracket.mainBracket[4]) {
      if (matchIdx === 0) bracket.mainBracket[4].p1 = "";
      else bracket.mainBracket[4].p2 = "";
      bracket.mainBracket[4].winner = "";
      bracket.mainBracket[4].s1 = "";
      bracket.mainBracket[4].s2 = "";
      clearDownstreamBocMainMatches(bracket, 4);
    }
  } else if (matchIdx === 2 || matchIdx === 3) {
    if (bracket.mainBracket[5]) {
      if (matchIdx === 2) bracket.mainBracket[5].p1 = "";
      else bracket.mainBracket[5].p2 = "";
      bracket.mainBracket[5].winner = "";
      bracket.mainBracket[5].s1 = "";
      bracket.mainBracket[5].s2 = "";
      clearDownstreamBocMainMatches(bracket, 5);
    }
  } else if (matchIdx === 4 || matchIdx === 5) {
    if (bracket.mainBracket[6]) {
      if (matchIdx === 4) bracket.mainBracket[6].p1 = "";
      else bracket.mainBracket[6].p2 = "";
      bracket.mainBracket[6].winner = "";
      bracket.mainBracket[6].s1 = "";
      bracket.mainBracket[6].s2 = "";
    }
    // Reset third place slot
    if (matchIdx === 4) {
      bracket.thirdPlace.p1 = "";
    } else {
      bracket.thirdPlace.p2 = "";
    }
    bracket.thirdPlace.winner = "";
    bracket.thirdPlace.s1 = "";
    bracket.thirdPlace.s2 = "";
  }
}

// Check and finalize BOC tournament results
function checkAndFinalizeBoc(event, bracket) {
  const finalMatch = bracket.mainBracket[6];
  const thirdMatch = bracket.thirdPlace;
  if (finalMatch && finalMatch.winner) {
    const champion = finalMatch.winner;
    const runnerUp = champion === finalMatch.p1 ? finalMatch.p2 : finalMatch.p1;
    
    let thirdPlaceWinner = "";
    let thirdPlaceLoser = "";
    if (thirdMatch && thirdMatch.winner) {
      thirdPlaceWinner = thirdMatch.winner;
      thirdPlaceLoser = thirdPlaceWinner === thirdMatch.p1 ? thirdMatch.p2 : thirdMatch.p1;
    } else {
      // Fallback: Semifinal losers
      const sf1 = bracket.mainBracket[4];
      const sf2 = bracket.mainBracket[5];
      if (sf1) thirdPlaceWinner = sf1.winner === sf1.p1 ? sf1.p2 : sf1.p1;
      if (sf2) thirdPlaceLoser = sf2.winner === sf2.p1 ? sf2.p2 : sf2.p1;
    }
    
    const qfLosers = [];
    for (let i = 0; i < 4; i++) {
      const qf = bracket.mainBracket[i];
      if (qf && qf.winner) {
        const loser = qf.winner === qf.p1 ? qf.p2 : qf.p1;
        if (loser) qfLosers.push(loser);
      }
    }

    const groupStageEliminated = [];
    const groupNames = ["A", "B", "C", "D"];
    groupNames.forEach(gk => {
      const standings = bracket.groups?.[gk]?.standings || [];
      if (standings.length >= 4) {
        groupStageEliminated.push(standings[2].name);
        groupStageEliminated.push(standings[3].name);
      }
    });
    
    event.results = JSON.stringify({
      champion,
      runnerUp,
      top4: [thirdPlaceWinner, thirdPlaceLoser].filter(Boolean),
      top8: qfLosers.filter(Boolean),
      top16: groupStageEliminated.filter(Boolean)
    });
    event.status = "Selesai";
    showCustomToast("Battle of Champions selesai! Juara & seluruh posisi podium telah ditentukan.", "success");
  }
}

// Get BOC main bracket round name
function getBocMainRoundName(matchIdx) {
  if (matchIdx >= 0 && matchIdx <= 3) return "Perempat Final (Quarter-finals)";
  if (matchIdx === 4 || matchIdx === 5) return "Semifinal (Semi-finals)";
  if (matchIdx === 6) return "Final";
  return "Babak Utama";
}

// Render BOC layout (standings table + match list)
function renderBocBracketContent(simEl, bannerEl, event, bracket, participants, B, isAdmin) {
  if (!bracket || Object.keys(bracket).length === 0 || !bracket.groups) {
    const requiredPlayers = 16;
    const currentCount = participants.length;
    
    let buttonHtml = "";
    let messageHtml = "";
    
    if (isAdmin) {
      if (currentCount === requiredPlayers) {
        messageHtml = `<div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Partisipan sudah terisi lengkap (${currentCount} dari ${requiredPlayers} atlet). Anda dapat membagi grup secara otomatis (Serpentine seeding) atau mengatur grup secara manual untuk memulai turnamen BOC.</div>`;
        buttonHtml = `
          <div style="display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap; justify-content: center;">
            <button class="pm-btn pm-btn-primary" onclick="window.initializeBracket('${event.id}')" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); padding: 12px 24px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
              <i class="fa-solid fa-play"></i> Seeding Otomatis (Serpentine)
            </button>
            <button class="pm-btn pm-btn-outline" onclick="window.openBocManualGroupModal('${event.id}')" style="border-color: #c084fc; color: #c084fc; padding: 12px 24px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
              <i class="fa-solid fa-users-gear"></i> Atur Grup Manual
            </button>
          </div>
        `;
      } else {
        messageHtml = `<div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Pendaftaran belum lengkap (Saat ini: ${currentCount} dari ${requiredPlayers} atlet). Silakan daftarkan atlet terlebih dahulu di tab <strong>Partisipan</strong>.</div>`;
        buttonHtml = `
          <button class="pm-btn pm-btn-outline" onclick="document.querySelector('#pane-event-detail .pm-stab[data-event-tab=\\'participants\\']').click()" style="padding: 10px 20px; display: inline-flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-users"></i> Kelola Partisipan
          </button>
        `;
      }
    } else {
      messageHtml = `<div style="color: var(--text-muted); font-size: 0.95rem;">Turnamen Battle of Champions belum dimulai oleh panitia. Jadwal dan pembagian grup babak penyisihan akan muncul di sini setelah turnamen resmi dimulai.</div>`;
      buttonHtml = "";
    }

    simEl.innerHTML = `
      <div style="text-align: center; width: 100%; padding: 40px 20px; background: rgba(15, 23, 42, 0.2); border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <i class="fa-solid fa-sitemap" style="font-size: 3rem; color: var(--accent); opacity: 0.5; margin-bottom: 16px;"></i>
        <h4 style="font-family: var(--font-headers); font-size: 1.1rem; color: #fff; margin: 0 0 8px 0; font-weight: 800;">Battle of Champions Belum Dimulai</h4>
        ${messageHtml}
        ${buttonHtml}
      </div>
    `;
    return;
  }

  let activeTab = isAdmin ? (window.lastActiveAdminBocTab || "A") : (window.lastActivePublicBocTab || "A");

  if (bracket.phase === "main" || bracket.phase === "completed" || event.status === "Selesai") {
    if (!isAdmin && !window.lastActivePublicBocTab) activeTab = "main";
    if (isAdmin && !window.lastActiveAdminBocTab) activeTab = "main";
  }

  const isTabActive = (tab) => tab === activeTab;

  let championName = "";
  if (bracket.mainBracket && bracket.mainBracket[6] && bracket.mainBracket[6].winner) {
    championName = bracket.mainBracket[6].winner;
  }
  if (bannerEl && championName) {
    bannerEl.innerHTML = `
      <div class="completion-banner" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px; border-radius: var(--radius-md); text-align: center; margin-bottom: 24px; box-shadow: var(--shadow-neon-success); width: 100%;">
        <h4 style="margin: 0; color: #10b981; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-trophy text-gold"></i> Turnamen BOC Selesai! Juara: ${championName}
        </h4>
      </div>`;
  } else if (bannerEl) {
    bannerEl.innerHTML = "";
  }

  const renderStandingsTable = (groupStandings) => {
    return `
      <table class="boc-group-table">
        <thead>
          <tr>
            <th style="width: 60px; text-align: center;">Pos</th>
            <th>Nama Atlet</th>
            <th style="width: 80px; text-align: center;">Main</th>
            <th style="width: 100px; text-align: center;">W - L</th>
            <th style="width: 120px; text-align: center;">Skor</th>
            <th style="width: 100px; text-align: center;">Poin</th>
          </tr>
        </thead>
        <tbody>
          ${groupStandings.map((std, idx) => {
            const isQualified = idx < 2;
            const athlete = (appData.players || []).find(p => p.name === std.name);
            const hc = athlete ? ` (HC ${athlete.handicap})` : "";
            const rowClass = isQualified ? 'boc-group-qualified' : '';
            const tag = isQualified ? `<span class="boc-group-qualified-tag">Qualified</span>` : '';
            return `
              <tr class="${rowClass}">
                <td style="text-align: center; font-weight: 800; color: ${isQualified ? 'var(--gold)' : 'var(--text-dim)'};">${idx + 1}</td>
                <td style="font-weight: 600; color: #fff;">${std.name}${hc}${tag}</td>
                <td style="text-align: center;">${std.played}</td>
                <td style="text-align: center; font-family: monospace;">${std.won} - ${std.lost}</td>
                <td style="text-align: center; font-family: monospace;">${std.scoreFor} - ${std.scoreAgainst}</td>
                <td style="text-align: center; font-weight: 800; color: ${std.points > 0 ? 'var(--accent)' : 'var(--text-muted)'};">${std.points}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  };

  const renderGroupMatches = (groupMatches, groupKey) => {
    let matchesHtml = "";
    const sortedKeys = Object.keys(groupMatches).sort((a,b) => parseInt(a,10) - parseInt(b,10));
    
    sortedKeys.forEach(mKey => {
      const idx = parseInt(mKey, 10);
      const m = groupMatches[mKey];
      const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
      const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
      const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
      const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
      
      const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
      const raceToVal = m.raceTo || 4;
      const p1Winner = m.winner === m.p1;
      const p2Winner = m.winner === m.p2;

      let p1PointsBadge = "";
      let p2PointsBadge = "";
      
      if (m.winner) {
        const s1 = parseInt(m.s1, 10) || 0;
        const s2 = parseInt(m.s2, 10) || 0;
        
        if (p1Winner) {
          const p1Pts = (s1 === raceToVal && s2 === raceToVal - 1) ? 2 : 3;
          const p2Pts = (s1 === raceToVal && s2 === raceToVal - 1) ? 1 : 0;
          p1PointsBadge = `<span class="boc-points-badge pts-${p1Pts}">${p1Pts} Pts</span>`;
          p2PointsBadge = `<span class="boc-points-badge pts-${p2Pts}">${p2Pts} Pts</span>`;
        } else {
          const p2Pts = (s2 === raceToVal && s1 === raceToVal - 1) ? 2 : 3;
          const p1Pts = (s2 === raceToVal && s1 === raceToVal - 1) ? 1 : 0;
          p1PointsBadge = `<span class="boc-points-badge pts-${p1Pts}">${p1Pts} Pts</span>`;
          p2PointsBadge = `<span class="boc-points-badge pts-${p2Pts}">${p2Pts} Pts</span>`;
        }
      }

      const clickAttr = isAdmin 
        ? `onclick="window.handleBracketMatchClick('${event.id}', ${idx}, 1, 'boc_group_${groupKey}')"` 
        : "";

      matchesHtml += `
        <div class="boc-match-card ${!isAdmin ? 'readonly' : ''}" ${clickAttr}>
          <div class="boc-match-header">
            <span>Match ${idx + 1} &bull; Race to ${raceToVal}</span>
            ${isLiveMatch ? `<span class="match-live-pulse-badge"><span class="pub-bracket-live-dot"></span> LIVE</span>` : ""}
            ${m.winner ? `<span style="color: var(--accent); font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Selesai</span>` : ""}
          </div>
          <div class="boc-match-player-row ${p1Winner ? 'winner' : (m.winner ? 'loser' : '')}">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <span class="boc-match-player-name" title="${m.p1}">${m.p1}${p1HC}</span>
              ${p1PointsBadge}
            </div>
            <span class="boc-match-player-score">${m.s1 !== "" && m.s1 !== undefined ? m.s1 : "-"}</span>
          </div>
          <div class="boc-match-player-row ${p2Winner ? 'winner' : (m.winner ? 'loser' : '')}">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <span class="boc-match-player-name" title="${m.p2}">${m.p2}${p2HC}</span>
              ${p2PointsBadge}
            </div>
            <span class="boc-match-player-score">${m.s2 !== "" && m.s2 !== undefined ? m.s2 : "-"}</span>
          </div>
        </div>
      `;
    });

    return `<div class="boc-matches-grid">${matchesHtml}</div>`;
  };

  const renderBocMainBracket = () => {
    if (bracket.phase === "qualification" || !bracket.mainBracket) {
      let allDone = true;
      const groupKeys = ["A", "B", "C", "D"];
      groupKeys.forEach(gk => {
        for (let i = 0; i < 6; i++) {
          if (!bracket.groups?.[gk]?.matches?.[i]?.winner) allDone = false;
        }
      });

      let btnHtml = "";
      if (allDone && isAdmin) {
        btnHtml = `
          <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; justify-content: center;">
            <button class="pm-btn pm-btn-primary" onclick="window.generateBocMainBracket('${event.id}')" style="background: var(--gradient-primary); box-shadow: var(--shadow-neon); padding: 12px 24px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
              <i class="fa-solid fa-network-wired"></i> Seeding Otomatis
            </button>
            <button class="pm-btn pm-btn-outline" onclick="window.openBocManualBracketModal('${event.id}')" style="border-color: #c084fc; color: #c084fc; padding: 12px 24px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
              <i class="fa-solid fa-users-gear"></i> Atur Bracket Manual
            </button>
          </div>
        `;
      }

      return `
        <div style="text-align: center; width: 100%; padding: 40px 20px; background: rgba(15, 23, 42, 0.2); border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <i class="fa-solid fa-sitemap" style="font-size: 3rem; color: var(--gold); opacity: 0.5; margin-bottom: 16px;"></i>
          <h4 style="font-family: var(--font-headers); font-size: 1.1rem; color: #fff; margin: 0 0 8px 0; font-weight: 800;">Babak Utama Belum Dimulai</h4>
          <p style="color: var(--text-dim); font-size: 0.85rem; max-width: 500px; margin: 0 0 10px 0;">Fase kualifikasi grup sedang berjalan. Selesaikan seluruh 24 pertandingan grup untuk lolos ke babak perempat final single elimination.</p>
          ${btnHtml}
        </div>
      `;
    }

    const mainCols = [
      { matches: [0, 1, 2, 3], title: "QF" },
      { matches: [4, 5], title: "SF" },
      { matches: [6], title: "FINALS" }
    ];

    const getRoundTitle = (titleVal) => {
      if (titleVal === "FINALS") return "Final";
      if (titleVal === "SF") return "Semi-finals";
      if (titleVal === "QF") return "Quarter-finals";
      return titleVal;
    };

    const roundColumnsHtml = mainCols.map((rc, roundIdx) => {
      const isFirst = roundIdx === 0;

      const pairsHtml = rc.matches.map(idx => {
        const m = bracket.mainBracket?.[idx] || { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 5 };
        const p1Athlete = m.p1 ? (appData.players || []).find(p => p.name === m.p1) : null;
        const p2Athlete = m.p2 ? (appData.players || []).find(p => p.name === m.p2) : null;
        const p1HC = p1Athlete ? ` (HC ${p1Athlete.handicap})` : "";
        const p2HC = p2Athlete ? ` (HC ${p2Athlete.handicap})` : "";
        const p1Display = m.p1 ? `${m.p1}${p1HC}` : "TBD";
        const p2Display = m.p2 ? `${m.p2}${p2HC}` : "TBD";

        const isLiveMatch = event.status === "Ongoing" && m.p1 && m.p2 && m.status === "ongoing";
        const raceToVal = m.raceTo || (roundIdx === 0 ? 5 : (roundIdx === 1 ? 6 : 7));

        const clickAttr = isAdmin && m.p1 && m.p2
          ? `onclick="window.handleBracketMatchClick('${event.id}', ${idx}, 1, 'boc_main')"`
          : "";

        return `
          <div class="bracket-match-pair" style="cursor: ${isAdmin && m.p1 && m.p2 ? 'pointer' : 'default'};" ${clickAttr}>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-slot-label" style="display: flex; align-items: center; gap: 4px;">
                  <span>M-${idx + 1} Race to ${raceToVal}</span>
                  ${isLiveMatch ? `<span class="match-live-pulse-badge" style="margin-left: 4px;"><span class="pub-bracket-live-dot"></span> LIVE</span>` : ''}
                </div>
                <div class="bracket-player-slot ${m.winner === m.p1 && m.p1 ? 'winner' : (m.winner && m.p1 ? 'loser' : '')}" 
                     style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p1 || 'TBD'}">${p1Display}</span>
                  </div>
                  <span class="bracket-player-score">${m.s1 !== undefined && m.s1 !== "" ? m.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${m.winner === m.p2 && m.p2 ? 'winner' : (m.winner && m.p2 ? 'loser' : '')}" 
                     style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${m.p2 || 'TBD'}">${p2Display}</span>
                  </div>
                  <span class="bracket-player-score">${m.s2 !== undefined && m.s2 !== "" ? m.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="bracket-round-column${isFirst ? ' round-first' : ''}">
          <div class="bracket-column-header">${getRoundTitle(rc.title)}</div>
          <div class="bracket-column-matches">
            ${pairsHtml}
          </div>
        </div>`;
    }).join("");

    const finalMatch = bracket.mainBracket[6] || { winner: "" };
    const champAthlete = finalMatch.winner ? (appData.players || []).find(p => p.name === finalMatch.winner) : null;
    const champHC = champAthlete ? ` (HC ${champAthlete.handicap})` : "";
    const champDisplay = finalMatch.winner ? `${finalMatch.winner}${champHC}` : "TBD";

    const championColumnHtml = `
      <div class="bracket-round-column round-last">
        <div class="bracket-column-header"><i class="fa-solid fa-trophy text-gold"></i> CHAMPION</div>
        <div class="bracket-column-matches">
          <div class="bracket-match-pair" style="justify-content: center;">
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot champion-slot ${finalMatch.winner ? 'winner' : ''}" 
                     style="cursor: default; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; min-width: 0; flex: 1;">
                    <span class="bracket-player-name" title="${finalMatch.winner || 'TBD'}">${champDisplay}</span>
                  </div>
                  <span class="bracket-player-score" style="background: rgba(245, 158, 11, 0.2); color: var(--gold);"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const t3 = bracket.thirdPlace || { p1: "", p2: "", s1: "", s2: "", winner: "", raceTo: 6 };
    const t3p1Athlete = t3.p1 ? (appData.players || []).find(p => p.name === t3.p1) : null;
    const t3p2Athlete = t3.p2 ? (appData.players || []).find(p => p.name === t3.p2) : null;
    const t3p1HC = t3p1Athlete ? ` (HC ${t3p1Athlete.handicap})` : "";
    const t3p2HC = t3p2Athlete ? ` (HC ${t3p2Athlete.handicap})` : "";
    const t3p1Display = t3.p1 ? `${t3.p1}${t3p1HC}` : "TBD";
    const t3p2Display = t3.p2 ? `${t3.p2}${t3p2HC}` : "TBD";
    const t3Live = event.status === "Ongoing" && t3.p1 && t3.p2 && t3.status === "ongoing";

    const clickT3 = isAdmin && t3.p1 && t3.p2
      ? `onclick="window.handleBracketMatchClick('${event.id}', 0, 1, 'boc_thirdPlace')"`
      : "";

    const thirdPlaceHtml = `
      <div class="boc-third-place">
        <div class="boc-third-place-header">
          <i class="fa-solid fa-medal text-gold"></i> Perebutan Juara 3 & 4 (Race to ${t3.raceTo || 6})
          ${t3Live ? `<span class="match-live-pulse-badge" style="margin-left: 8px;"><span class="pub-bracket-live-dot"></span> LIVE</span>` : ""}
        </div>
        <div style="width: 100%; border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); overflow: hidden; background: rgba(15, 23, 42, 0.3);">
          <div class="bracket-match-pair" style="cursor: ${isAdmin && t3.p1 && t3.p2 ? 'pointer' : 'default'}; border: none; margin: 0; padding: 10px;" ${clickT3}>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${t3.winner === t3.p1 && t3.p1 ? 'winner' : (t3.winner && t3.p1 ? 'loser' : '')}" style="border: none; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span class="bracket-player-name">${t3p1Display}</span>
                  <span class="bracket-player-score">${t3.s1 !== undefined && t3.s1 !== "" ? t3.s1 : "-"}</span>
                </div>
              </div>
            </div>
            <div class="bracket-match-wrapper">
              <div class="bracket-slot-container">
                <div class="bracket-player-slot ${t3.winner === t3.p2 && t3.p2 ? 'winner' : (t3.winner && t3.p2 ? 'loser' : '')}" style="border: none; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span class="bracket-player-name">${t3p2Display}</span>
                  <span class="bracket-player-score">${t3.s2 !== undefined && t3.s2 !== "" ? t3.s2 : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="bracket-wrapper" style="display: flex; gap: 40px; min-width: 900px; padding: 20px 10px; align-items: stretch; justify-content: safe center; width: 100%;">
          ${roundColumnsHtml}
          ${championColumnHtml}
        </div>
        ${thirdPlaceHtml}
      </div>
    `;
  };

  simEl.innerHTML = `
    <div class="boc-layout-container">
      <div class="bracket-tabs-container" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; background: rgba(255,255,255,0.03); padding: 6px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
        <button class="boc-tab-btn pm-btn pm-btn-sm ${isTabActive('A') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="A" style="font-size: 0.8rem; font-weight: 700;">Grup A</button>
        <button class="boc-tab-btn pm-btn pm-btn-sm ${isTabActive('B') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="B" style="font-size: 0.8rem; font-weight: 700;">Grup B</button>
        <button class="boc-tab-btn pm-btn pm-btn-sm ${isTabActive('C') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="C" style="font-size: 0.8rem; font-weight: 700;">Grup C</button>
        <button class="boc-tab-btn pm-btn pm-btn-sm ${isTabActive('D') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="D" style="font-size: 0.8rem; font-weight: 700;">Grup D</button>
        <button class="boc-tab-btn pm-btn pm-btn-sm ${isTabActive('main') ? 'pm-btn-primary' : 'pm-btn-outline'}" data-target="main" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-trophy text-gold"></i> Babak Utama</button>
      </div>

      <!-- Group Panes -->
      ${["A", "B", "C", "D"].map(gk => {
        const grp = bracket.groups?.[gk] || { players: [], matches: {}, standings: [] };
        return `
          <div class="boc-tab-content-pane" id="boc-pane-${gk}" style="display: ${isTabActive(gk) ? 'block' : 'none'}; width: 100%;">
            <div style="margin-bottom: 12px; font-weight: 800; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
              <span style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; color: #fff; letter-spacing: 1px;">GRUP ${gk}</span>
              <span style="font-size: 0.82rem; color: var(--text-dim); font-weight: normal;">Klasemen Kualifikasi & Pertandingan</span>
            </div>
            ${renderStandingsTable(grp.standings || [])}
            <div style="margin-top: 20px; margin-bottom: 12px; font-weight: 800; color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-calendar-days text-accent"></i> Jadwal & Hasil Pertandingan Grup
            </div>
            ${renderGroupMatches(grp.matches || {}, gk)}
          </div>
        `;
      }).join("")}

      <!-- Main Bracket Pane -->
      <div class="boc-tab-content-pane" id="boc-pane-main" style="display: ${isTabActive('main') ? 'block' : 'none'}; width: 100%;">
        ${renderBocMainBracket()}
      </div>
    </div>
  `;

  const tabBtns = simEl.querySelectorAll(".boc-tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-target");
      if (isAdmin) {
        window.lastActiveAdminBocTab = target;
      } else {
        window.lastActivePublicBocTab = target;
      }
      
      tabBtns.forEach(b => {
        b.classList.remove("pm-btn-primary");
        b.classList.add("pm-btn-outline");
      });
      btn.classList.remove("pm-btn-outline");
      btn.classList.add("pm-btn-primary");

      const panes = simEl.querySelectorAll(".boc-tab-content-pane");
      panes.forEach(p => {
        p.style.display = p.id === `boc-pane-${target}` ? "block" : "none";
      });
    };
  });
}

// Active state variables for Match Control Modal
let mcActiveEventId = null;
let mcActiveMatchIdx = null;
let mcActiveBracketSize = null;

// Handle player slot clicks inside bracket
window.handleBracketMatchClick = async function(eventId, matchIdx, playerSlot, context = 'default') {
  if (window.isDraggingBracket) {
    return;
  }
  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah skor bracket.", "error");
    return;
  }

  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const B = parseInt(event.bracket_size, 10) || 16;
  const finalsIdx = B - 2; // Finals match index is B - 2

  const isFinalMatch = context === 'grandFinal' || (context === 'default' && matchIdx === finalsIdx);
  if (event.status === "Selesai" && !isFinalMatch) {
    showCustomToast("Turnamen sudah selesai! Hanya diperbolehkan mengubah hasil Final.", "warning");
  }
  if (event.status === "Cancelled") {
    showCustomToast("Turnamen sudah dibatalkan!", "error");
    return;
  }

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (ex) {}

  let match;
  if (context === 'default') {
    match = bracket[matchIdx];
  } else if (context === 'grandFinal') {
    match = bracket.grandFinal;
  } else if (context.startsWith('boc_group_')) {
    const groupKey = context.replace('boc_group_', '');
    match = bracket.groups?.[groupKey]?.matches?.[matchIdx];
  } else if (context === 'boc_main') {
    match = bracket.mainBracket?.[matchIdx];
  } else if (context === 'boc_thirdPlace') {
    match = bracket.thirdPlace;
  } else {
    match = bracket[context]?.[matchIdx];
  }

  if (!match || !match.p1 || !match.p2) {
    showCustomToast("Kedua slot pemain harus terisi sebelum mencatat skor pertandingan!", "error");
    return;
  }

  // Block interaction with BYE matches (auto-resolved)
  if ((match.p1 === "BYE" || match.p2 === "BYE") && match.winner) {
    showCustomToast("Pertandingan BYE diselesaikan secara otomatis dan tidak dapat diubah.", "warning");
    return;
  }

  // Set active state variables
  mcActiveEventId = eventId;
  mcActiveMatchIdx = matchIdx;
  mcActiveBracketSize = B;
  window.mcActiveContext = context;

  // Open Premium Match Control Modal
  openEventMatchControlModal(event, match, matchIdx, B);
};

// Handle bracket drag and drop
window.handleBracketDragStart = function(e, eventId, matchIdx, playerSlot, context = 'default') {
  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    e.preventDefault();
    return;
  }
  window.isDraggingBracket = true;
  e.dataTransfer.setData("text/plain", JSON.stringify({ eventId, matchIdx, playerSlot, context }));
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
};

window.handleBracketDragOver = function(e) {
  e.preventDefault();
  const slot = e.currentTarget.closest(".bracket-player-slot");
  if (slot && !slot.classList.contains("dragging")) {
    slot.classList.add("drag-over");
  }
};

window.handleBracketDragLeave = function(e) {
  const slot = e.currentTarget.closest(".bracket-player-slot");
  if (slot) {
    slot.classList.remove("drag-over");
  }
};

window.handleBracketDragEnd = function(e) {
  e.currentTarget.classList.remove("dragging");
  document.querySelectorAll(".bracket-player-slot.drag-over").forEach(el => {
    el.classList.remove("drag-over");
  });
  setTimeout(() => {
    window.isDraggingBracket = false;
  }, 100);
};

window.handleBracketDrop = async function(e, targetEventId, targetMatchIdx, targetPlayerSlot, targetContext = 'default') {
  e.preventDefault();
  
  document.querySelectorAll(".bracket-player-slot.drag-over").forEach(el => {
    el.classList.remove("drag-over");
  });

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah bracket.", "error");
    return;
  }

  try {
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    const source = JSON.parse(dataStr);
    if (!source || source.eventId !== targetEventId) return;
    if (source.context !== targetContext) {
      showCustomToast("Hanya diperbolehkan menukar pemain dalam bracket yang sama!", "warning");
      return;
    }
    if (source.matchIdx === targetMatchIdx && source.playerSlot === targetPlayerSlot) return;

    const event = appData.events.find(evt => evt.id === targetEventId);
    if (!event) return;

    if (event.status === "Selesai" || event.status === "Cancelled") {
      showCustomToast("Turnamen sudah selesai atau dibatalkan!", "error");
      return;
    }

    const B = parseInt(event.bracket_size, 10) || 16;
    const maxFirstRoundMatchIdx = (B / 2) - 1;
    if (source.matchIdx > maxFirstRoundMatchIdx || targetMatchIdx > maxFirstRoundMatchIdx) {
      showCustomToast("Hanya diperbolehkan menukar pemain di Babak Pertama!", "warning");
      return;
    }

    let bracket = {};
    try {
      bracket = JSON.parse(event.bracket || "{}");
    } catch (ex) {}

    let sourceMatch, targetMatch;
    if (targetContext === 'default') {
      sourceMatch = bracket[source.matchIdx];
      targetMatch = bracket[targetMatchIdx];
    } else {
      sourceMatch = bracket[targetContext]?.[source.matchIdx];
      targetMatch = bracket[targetContext]?.[targetMatchIdx];
    }

    if (!sourceMatch || !targetMatch) return;

    const sourceKey = `p${source.playerSlot}`;
    const targetKey = `p${targetPlayerSlot}`;

    const tempPlayer = sourceMatch[sourceKey];
    sourceMatch[sourceKey] = targetMatch[targetKey];
    targetMatch[targetKey] = tempPlayer;

    // Reset scores & winner for both matches since the players changed
    sourceMatch.s1 = "";
    sourceMatch.s2 = "";
    sourceMatch.winner = "";

    targetMatch.s1 = "";
    targetMatch.s2 = "";
    targetMatch.winner = "";

    // Clear downstream matches for both
    if (targetContext === 'default') {
      clearDownstreamMatches(bracket, source.matchIdx, B);
      clearDownstreamMatches(bracket, targetMatchIdx, B);
    } else if (targetContext === 'poolA' || targetContext === 'poolB') {
      clearDownstreamMatchesDoublePool(bracket, source.matchIdx, targetContext, B);
      clearDownstreamMatchesDoublePool(bracket, targetMatchIdx, targetContext, B);
    } else if (targetContext === 'upper' || targetContext === 'lower') {
      clearDownstreamMatchesDouble(bracket, source.matchIdx, targetContext, B);
      clearDownstreamMatchesDouble(bracket, targetMatchIdx, targetContext, B);
    }

    // Save and re-render
    event.bracket = JSON.stringify(bracket);
    await saveEventDetails(event);
    openEventDetail(event.id);
    showCustomToast("Posisi bracket berhasil ditukar!", "success");
  } catch (err) {
    console.error("Error swapping bracket slots:", err);
  }
};

// Open Event Match Control Modal and populate its elements
function openEventMatchControlModal(event, match, matchIdx, B) {
  const labelEl = document.getElementById("mc-match-label");
  const roundEl = document.getElementById("mc-round-name");
  const statusEl = document.getElementById("mc-match-status-badge");
  
  const p1NameEl = document.getElementById("mc-p1-name");
  const p1SubEl = document.getElementById("mc-p1-sub");
  const p2NameEl = document.getElementById("mc-p2-name");
  const p2SubEl = document.getElementById("mc-p2-sub");
  
  const s1Input = document.getElementById("mc-s1-input");
  const s2Input = document.getElementById("mc-s2-input");

  if (labelEl) {
    if (window.mcActiveContext === 'grandFinal') {
      labelEl.textContent = "Grand Final";
    } else if (window.mcActiveContext === 'poolA' || window.mcActiveContext === 'poolB') {
      const pLabel = window.mcActiveContext === 'poolA' ? 'A' : 'B';
      labelEl.textContent = `Pool ${pLabel} M-${matchIdx + 1}`;
    } else if (window.mcActiveContext === 'upper' || window.mcActiveContext === 'lower') {
      const uLabel = window.mcActiveContext === 'upper' ? 'Upper' : 'Lower';
      labelEl.textContent = `${uLabel} M-${matchIdx + 1}`;
    } else {
      labelEl.textContent = `M-${matchIdx + 1}`;
    }
  }
  if (roundEl) {
    if (window.mcActiveContext === 'grandFinal') {
      roundEl.textContent = "Grand Final Showdown";
    } else if (window.mcActiveContext === 'lower') {
      roundEl.textContent = getRoundNameLower(matchIdx, B);
    } else {
      roundEl.textContent = getRoundName(matchIdx, B);
    }
  }
  
  if (statusEl) {
    if (match.winner) {
      statusEl.textContent = "Selesai";
      statusEl.className = "featured-status-badge selesai";
      statusEl.style.background = "rgba(16, 185, 129, 0.15)";
      statusEl.style.color = "#10b981";
      statusEl.style.border = "1px solid rgba(16, 185, 129, 0.25)";
    } else if (match.status === "ongoing") {
      statusEl.textContent = "Sedang Berlangsung";
      statusEl.className = "featured-status-badge live";
      statusEl.style.background = "rgba(239, 68, 68, 0.15)";
      statusEl.style.color = "#ef4444";
      statusEl.style.border = "1px solid rgba(239, 68, 68, 0.25)";
    } else {
      statusEl.textContent = "Belum Mulai";
      statusEl.className = "featured-status-badge daftar";
      statusEl.style.background = "rgba(59, 130, 246, 0.15)";
      statusEl.style.color = "#60a5fa";
      statusEl.style.border = "1px solid rgba(59, 130, 246, 0.25)";
    }
  }

  const startBtnContainer = document.getElementById("mc-start-match-btn-container");
  if (startBtnContainer) {
    if (!match.winner && match.status !== "ongoing") {
      startBtnContainer.style.display = "grid";
    } else {
      startBtnContainer.style.display = "none";
    }
  }

  // Lookup player info
  const p1Athlete = (appData.players || []).find(p => p.name === match.p1);
  const p2Athlete = (appData.players || []).find(p => p.name === match.p2);

  if (p1NameEl) p1NameEl.textContent = match.p1;
  if (p1SubEl) p1SubEl.textContent = `${p1Athlete ? p1Athlete.club : 'Tanpa Klub'} - HC ${p1Athlete ? p1Athlete.handicap : '-'}`;
  
  if (p2NameEl) p2NameEl.textContent = match.p2;
  if (p2SubEl) p2SubEl.textContent = `${p2Athlete ? p2Athlete.club : 'Tanpa Klub'} - HC ${p2Athlete ? p2Athlete.handicap : '-'}`;

  if (s1Input) s1Input.value = match.s1 !== undefined && match.s1 !== "" ? match.s1 : "";
  if (s2Input) s2Input.value = match.s2 !== undefined && match.s2 !== "" ? match.s2 : "";

  const raceToInput = document.getElementById("mc-raceto-input");
  if (raceToInput) {
    raceToInput.value = match.raceTo !== undefined && match.raceTo !== "" ? match.raceTo : 4;
  }

  // Calculate and show auto-recommendation, populate dropdowns
  const rec = getRecommendedVoor(p1Athlete ? p1Athlete.handicap : null, p2Athlete ? p2Athlete.handicap : null);
  window.mcActiveRecommendation = rec;
  
  const recTextEl = document.getElementById("mc-voor-recommendation-text");
  if (recTextEl) recTextEl.innerHTML = rec.text;

  const p1VoorSel = document.getElementById("mc-p1-voor");
  const p2VoorSel = document.getElementById("mc-p2-voor");
  if (p1VoorSel) p1VoorSel.value = match.p1Voor !== undefined && match.p1Voor !== "" ? match.p1Voor : "9";
  if (p2VoorSel) p2VoorSel.value = match.p2Voor !== undefined && match.p2Voor !== "" ? match.p2Voor : "9";

  const p1WinnerOpt = document.getElementById("mc-direct-winner-p1");
  const p2WinnerOpt = document.getElementById("mc-direct-winner-p2");
  if (p1WinnerOpt) p1WinnerOpt.textContent = match.p1 || "Pemain 1";
  if (p2WinnerOpt) p2WinnerOpt.textContent = match.p2 || "Pemain 2";

  const directWinnerSel = document.getElementById("mc-direct-winner");
  if (directWinnerSel) {
    if (match.winner && match.winner === match.p1) {
      directWinnerSel.value = "p1";
    } else if (match.winner && match.winner === match.p2) {
      directWinnerSel.value = "p2";
    } else {
      directWinnerSel.value = "";
    }
    if (typeof window.updateDirectWinnerUI === "function") {
      window.updateDirectWinnerUI();
    }
  }

  // Show modal
  const modal = document.getElementById("event-match-control-modal");
  if (modal) modal.style.display = "flex";
}

function getRoundName(matchIdx, bracketSize) {
  const B = parseInt(bracketSize, 10) || 16;
  if (matchIdx === B - 2) return "Final";
  if (matchIdx >= B - 4 && matchIdx <= B - 3) return "Semifinal (SF)";
  if (matchIdx >= B - 8 && matchIdx <= B - 5) return "Perempat Final (QF)";
  
  let startIdx = 0;
  let roundSize = B / 2;
  while (roundSize > 4) {
    if (matchIdx >= startIdx && matchIdx < startIdx + roundSize) {
      return `Babak ${roundSize * 2} Besar`;
    }
    startIdx += roundSize;
    roundSize /= 2;
  }
  return "Pertandingan";
}

// Calculate recommended voor based on players' handicap difference
function getRecommendedVoor(hcA, hcB) {
  if (!hcA || !hcB) return { p1Voor: "9", p2Voor: "9", text: "Handicap tidak lengkap untuk kalkulasi voor." };

  const hierarchy = { '3B': 1, '3N': 2, '3A': 3, '4B': 4, '4A': 5, '5B': 6, '5A': 7, '6': 8, '7': 9 };
  const valA = hierarchy[String(hcA).trim().toUpperCase()] || 0;
  const valB = hierarchy[String(hcB).trim().toUpperCase()] || 0;
  
  if (valA === 0 || valB === 0) return { p1Voor: "9", p2Voor: "9", text: "Handicap tidak dikenali untuk kalkulasi voor." };
  if (valA === valB) return { p1Voor: "9", p2Voor: "9", text: "Handicap seimbang, tidak ada voor (Keduanya Bola 9)." };
  
  const diff = Math.abs(valA - valB);
  let voor = "9";
  if (diff === 1) voor = "8S";
  else if (diff === 2) voor = "8B";
  else if (diff === 3) voor = "7S";
  else if (diff === 4) voor = "7B";
  else if (diff >= 5) voor = "7";
  
  const voorLabels = { "8S": "8 Seri", "8B": "8 Bersih", "7S": "7,8 Seri", "7B": "7,8 Bersih", "7": "Bola 7" };
  
  if (valA < valB) {
    // Player A is weaker, gets voor
    return { p1Voor: voor, p2Voor: "9", text: `Rekomendasi: Pemain 1 dapat Voor <strong>${voorLabels[voor]}</strong>.` };
  } else {
    // Player B is weaker, gets voor
    return { p1Voor: "9", p2Voor: voor, text: `Rekomendasi: Pemain 2 dapat Voor <strong>${voorLabels[voor]}</strong>.` };
  }
}

// Clear downstream bracket matches if winner is overridden
function clearDownstreamMatches(bracket, matchIdx, bracketSize) {
  const B = parseInt(bracketSize, 10) || 16;
  const matchInfo = getNextMatchInfo(matchIdx, B);
  if (matchInfo.isFinal) return;

  const nextMatchIdx = matchInfo.nextIdx;
  const isEven = matchInfo.isEven;

  if (bracket[nextMatchIdx]) {
    if (isEven) {
      bracket[nextMatchIdx].p1 = "";
    } else {
      bracket[nextMatchIdx].p2 = "";
    }
    bracket[nextMatchIdx].s1 = "";
    bracket[nextMatchIdx].s2 = "";
    bracket[nextMatchIdx].winner = "";
    clearDownstreamMatches(bracket, nextMatchIdx, B);
  }
}

// Check if player's handicap satisfies the event's max handicap restriction
function isHandicapAllowed(playerHandicap, maxHandicap) {
  if (!maxHandicap || maxHandicap === "Bebas") return true;
  
  const hierarchy = { '3B': 1, '3N': 2, '3A': 3, '4B': 4, '4A': 5, '5B': 6, '5A': 7, '6': 8, '7': 9 };
  const playerVal = hierarchy[playerHandicap] || 0;
  const maxVal = hierarchy[maxHandicap] || 999;
  
  return playerVal <= maxVal;
}

// Persist Event updates
async function saveEventDetails(event) {
  if (isServerOnline) {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          venue: event.venue,
          prizePool: event.prizePool,
          entryFee: event.entryFee,
          contact: event.contact,
          description: event.description,
          status: event.status,
          poster: event.poster,
          participants: event.participants,
          bracket: event.bracket,
          results: event.results,
          points_published: event.points_published,
          type: event.type,
          bracket_size: event.bracket_size,
          elimination_type: event.elimination_type,
          max_hc: event.max_hc
        })
      });
      if (!res.ok) {
        showCustomToast("Gagal menyimpan detail event di server.", "error");
      }
    } catch (err) {
      console.error(err);
      showCustomToast("Gagal menghubungi server database.", "error");
    }
  }

  const idx = appData.events.findIndex(evt => evt.id === event.id);
  if (idx !== -1) {
    appData.events[idx] = event;
  }

  updateWorkspaceStats();
  renderWorkspacePreviews();
}

// Calculate official BOC standing points for a player based on their performance in the event
function getPointsForPlayer(event, playerName) {
  let results = {};
  try {
    results = JSON.parse(event.results || "{}");
  } catch (e) {}

  const rules = bocSettings.point_rules || defaultPointRules;
  const cp = rules.circuit_points || defaultPointRules.circuit_points;

  if (playerName === results.champion) return cp.champion ?? 12;
  if (playerName === results.runnerUp) return cp.runnerUp ?? 9;
  if (results.top4 && results.top4.includes(playerName)) return cp.top4 ?? 7;
  if (results.top8 && results.top8.includes(playerName)) return cp.top8 ?? 5;
  if (results.top16 && results.top16.includes(playerName)) return cp.top16 ?? 3;
  if (results.top32 && results.top32.includes(playerName)) return cp.top32 ?? 1;

  const B = event.bracket_size || "16";
  if (B !== "manual") {
    let bracket = {};
    try {
      bracket = JSON.parse(event.bracket || "{}");
    } catch (e) {}

    const bracketSizeNum = parseInt(B, 10) || 16;
    const elimType = event.elimination_type || "single";

    if (elimType === "double_upper_lower") {
      let playedMatchesLower = [];
      let playedGrandFinal = false;

      if (bracket.lower) {
        for (let idx in bracket.lower) {
          const m = bracket.lower[idx];
          if (m && (m.p1 === playerName || m.p2 === playerName)) {
            playedMatchesLower.push(parseInt(idx, 10));
          }
        }
      }
      if (bracket.grandFinal && (bracket.grandFinal.p1 === playerName || bracket.grandFinal.p2 === playerName)) {
        playedGrandFinal = true;
      }

      if (playedGrandFinal) return 9; // Will be 12 if champion (handled above)
      if (playedMatchesLower.length > 0) {
        const maxIdx = Math.max(...playedMatchesLower);
        if (maxIdx >= bracketSizeNum - 4) return 7;
        if (maxIdx >= bracketSizeNum - 8) return 5;
        if (maxIdx >= bracketSizeNum - 16) return 3;
        return 1;
      }
      return 0;
    } else {
      let playedMatches = [];
      if (elimType === "double_pool") {
        ["poolA", "poolB"].forEach(pool => {
          if (bracket[pool]) {
            for (let idx in bracket[pool]) {
              const m = bracket[pool][idx];
              if (m && (m.p1 === playerName || m.p2 === playerName)) {
                playedMatches.push(parseInt(idx, 10));
              }
            }
          }
        });
      } else {
        for (let idx in bracket) {
          const m = bracket[idx];
          if (m && (m.p1 === playerName || m.p2 === playerName)) {
            playedMatches.push(parseInt(idx, 10));
          }
        }
      }

      if (playedMatches.length === 0) return 0;
      const maxIdx = Math.max(...playedMatches);

      if (bracketSizeNum === 8) {
        if (maxIdx === 6) return 9;
        if (maxIdx >= 4 && maxIdx <= 5) return 7;
        if (maxIdx >= 0 && maxIdx <= 3) return 5;
      } else if (bracketSizeNum === 32) {
        if (maxIdx === 30) return 9;
        if (maxIdx >= 28 && maxIdx <= 29) return 7;
        if (maxIdx >= 24 && maxIdx <= 27) return 5;
        if (maxIdx >= 16 && maxIdx <= 23) return 3;
        if (maxIdx >= 0 && maxIdx <= 15) return 1;
      } else {
        // Default 16
        if (maxIdx === 14) return 9;
        if (maxIdx >= 12 && maxIdx <= 13) return 7;
        if (maxIdx >= 8 && maxIdx <= 11) return 5;
        if (maxIdx >= 0 && maxIdx <= 7) return 3;
      }
    }
  }
  return 0;
}

// Helper to render stacked progress bar for handicap in the results recap table
function renderRecapHandicapProgress(r) {
  const hcThresholds = {
    "3B": { next: "3N", pts: 30 },
    "3N": { next: "3A", pts: 60 },
    "3A": { next: "4B", pts: 150 },
    "4B": { next: "4A", pts: 200 },
    "4A": { next: "5B", pts: 300 },
    "5B": { next: "5A", pts: 400 },
    "5A": { next: "6", pts: 500 },
    "6": { next: "7", pts: 600 }
  };

  const hc = r.hcAwal;
  const poinAwal = r.poinAwal;
  const poinAkhir = r.poinAkhir;

  // Let's get the color class for the starting HC
  const startColorClass = getHandicapColorClass(hc);

  // If it's max tier (no threshold)
  if (!hcThresholds[hc]) {
    return `
      <div style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: 100%;">
        <span class="table-badge-hc ${startColorClass}">HC ${hc}</span>
        <div class="progress-container" style="flex: 1; min-width: 160px; max-width: 260px;">
          <div class="progress-bar-custom max-tier" style="width: 100%;"></div>
          <span class="progress-label-text">${poinAkhir} Pts (Max)</span>
        </div>
      </div>
    `;
  }

  const targetPoints = hcThresholds[hc].pts;

  const poinAwalPercent = Math.min(100, Math.round((poinAwal / targetPoints) * 100));
  const poinAkhirPercent = Math.min(100, Math.round((poinAkhir / targetPoints) * 100));
  const poinSirkuitPercent = Math.max(0, poinAkhirPercent - poinAwalPercent);

  // Build the stacked progress bar HTML
  let barHtml = '';
  
  if (r.isPromoted) {
    // If promoted, show a blue highlighted bar representing completion/promotion
    barHtml = `
      <div class="progress-container" style="flex: 1; min-width: 120px; max-width: 165px; border-color: rgba(56, 189, 248, 0.5); box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);">
        <div class="progress-bar-custom" style="width: ${poinAwalPercent}%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%); opacity: 0.85;"></div>
        <div class="progress-bar-custom" style="left: ${poinAwalPercent}%; width: ${100 - poinAwalPercent}%; background: linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%);"></div>
        <span class="progress-label-text" style="color: #fff; font-weight: 800;">${poinAwal} (+${r.hcPts}) / ${targetPoints} Pts</span>
      </div>
    `;

    return `
      <div style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: 100%;">
        <span class="table-badge-hc ${startColorClass}">HC ${hc}</span>
        ${barHtml}
        <i class="fa-solid fa-angles-right" style="color: #38bdf8; font-size: 0.65rem;"></i>
        <span class="table-badge-hc ${getHandicapColorClass(r.hcAkhir)}" style="box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); border-color: #38bdf8;">HC ${r.hcAkhir}</span>
        <span class="badge-promoted-tag" style="background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2.5px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px; box-shadow: 0 0 8px rgba(56, 189, 248, 0.25);"><i class="fa-solid fa-arrow-trend-up"></i> PROMOTED!</span>
      </div>
    `;
  } else {
    // Regular progress with starting points and tournament points
    barHtml = `
      <div class="progress-container" style="flex: 1; min-width: 160px; max-width: 260px;">
        <div class="progress-bar-custom" style="width: ${poinAwalPercent}%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%); opacity: 0.85;"></div>
        <div class="progress-bar-custom" style="left: ${poinAwalPercent}%; width: ${poinSirkuitPercent}%; background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);"></div>
        <span class="progress-label-text">${poinAwal} (+${r.hcPts}) / ${targetPoints} Pts</span>
      </div>
    `;

    return `
      <div style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: 100%;">
        <span class="table-badge-hc ${startColorClass}">HC ${hc}</span>
        ${barHtml}
      </div>
    `;
  }
}

// Get detailed tournament results and handicap recap
function getTournamentRecapData(event) {
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (e) {}

  const standings = appData.standings || [];

  return participants.map(pName => {
    const athlete = (appData.players || []).find(a => a.name === pName);
    const club = athlete ? athlete.club : "-";
    
    // Find standing to get current points and handicap
    const standing = standings.find(s => s.name === pName);
    const currentPoints = standing ? parseFloat(standing.points || 0) : 0;
    const currentHC = standing ? standing.handicap.toString().trim() : (athlete ? athlete.handicap.toString().trim() : "3B");

    const pts = getPointsForPlayer(event, pName);
    let rankText = "Partisipan";
    let rankOrder = 7;

    if (pts === 12) {
      rankText = "Juara 1";
      rankOrder = 1;
    } else if (pts === 9) {
      rankText = "Juara 2";
      rankOrder = 2;
    } else if (pts === 7) {
      rankText = "Semifinalis";
      rankOrder = 3;
    } else if (pts === 5) {
      rankText = "Perempatfinalis";
      rankOrder = 4;
    } else if (pts === 3) {
      rankText = "16 Besar";
      rankOrder = 5;
    } else if (pts === 1) {
      rankText = "32 Besar";
      rankOrder = 6;
    }

    // Calculate points progression
    const pointsPublished = event.points_published === 1;
    let poinAwal = 0;
    let poinAkhir = 0;

    const hcPts = (pts === 12) ? 30 : ((pts === 9) ? 20 : ((pts === 7) ? 10 : 0));

    let hcAwal = currentHC;
    let hcAkhir = currentHC;
    let isPromoted = false;

    const hcThresholds = {
      "3B": { next: "3N", pts: 30 },
      "3N": { next: "3A", pts: 60 },
      "3A": { next: "4B", pts: 150 },
      "4B": { next: "4A", pts: 200 },
      "4A": { next: "5B", pts: 300 },
      "5B": { next: "5A", pts: 400 },
      "5A": { next: "6", pts: 500 },
      "6": { next: "7", pts: 600 }
    };

    if (pointsPublished) {
      // If points are published, check if they promoted in this event
      if (hcPts > 0 && currentPoints < hcPts) {
        // They promoted and reset to 0.0. Find the previous level
        isPromoted = true;
        let prevHC = currentHC;
        const hcKeys = ["3B", "3N", "3A", "4B", "4A", "5B", "5A", "6", "7"];
        const curIdx = hcKeys.indexOf(currentHC);
        if (curIdx > 0) {
          prevHC = hcKeys[curIdx - 1];
        }
        hcAwal = prevHC;
        hcAkhir = currentHC;
        
        const prevThreshold = hcThresholds[prevHC] ? hcThresholds[prevHC].pts : 30;
        poinAwal = Math.max(0, prevThreshold - hcPts);
        poinAkhir = currentPoints; // 0.0
      } else {
        // Did not promote
        hcAwal = currentHC;
        hcAkhir = currentHC;
        poinAkhir = currentPoints;
        poinAwal = Math.max(0, poinAkhir - hcPts);
      }
    } else {
      // Preview mode (not published yet)
      poinAwal = currentPoints;
      poinAkhir = poinAwal + hcPts;
      hcAwal = currentHC;
      hcAkhir = currentHC;

      if (hcThresholds[hcAwal]) {
        const threshold = hcThresholds[hcAwal].pts;
        if (poinAkhir >= threshold) {
          hcAkhir = hcThresholds[hcAwal].next;
          isPromoted = true;
          poinAkhir = 0.0; // reset to 0.0 on promotion
        }
      }
    }

    return { 
      name: pName, 
      club, 
      handicap: currentHC, 
      rankText, 
      pts, 
      hcPts,
      rankOrder,
      hcAwal,
      poinAwal,
      hcAkhir,
      poinAkhir,
      isPromoted
    };
  }).sort((a, b) => {
    if (a.rankOrder !== b.rankOrder) return a.rankOrder - b.rankOrder;
    return a.name.localeCompare(b.name);
  });
}

// Finalize tournament from bracket page
window.finalizeTournamentFromBracket = async function(eventId) {
  const event = appData.events.find(evt => evt.id === eventId);
  if (!event) return;

  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan menyelesaikan turnamen.", "error");
    return;
  }

  let bracket = {};
  try {
    bracket = JSON.parse(event.bracket || "{}");
  } catch (ex) {}

  const B = parseInt(event.bracket_size, 10) || 16;
  const elimType = event.elimination_type || "single";

  let newWinner = "";
  let runnerUp = "";
  let t4_1 = "";
  let t4_2 = "";
  let t8 = [];

  if (elimType === "boc") {
    if (!bracket.mainBracket || !bracket.mainBracket[6] || !bracket.mainBracket[6].winner) {
      showCustomToast("Pertandingan final belum selesai!", "error");
      return;
    }
    newWinner = bracket.mainBracket[6].winner;
    runnerUp = newWinner === bracket.mainBracket[6].p1 ? bracket.mainBracket[6].p2 : bracket.mainBracket[6].p1;

    if (bracket.thirdPlace && bracket.thirdPlace.winner) {
      t4_1 = bracket.thirdPlace.winner;
      t4_2 = t4_1 === bracket.thirdPlace.p1 ? bracket.thirdPlace.p2 : bracket.thirdPlace.p1;
    } else {
      // Fallback: Semifinal losers
      const sf1 = bracket.mainBracket[4];
      const sf2 = bracket.mainBracket[5];
      if (sf1) t4_1 = sf1.winner === sf1.p1 ? sf1.p2 : sf1.p1;
      if (sf2) t4_2 = sf2.winner === sf2.p1 ? sf2.p2 : sf2.p1;
    }

    for (let i = 0; i < 4; i++) {
      const qf = bracket.mainBracket[i];
      if (qf && qf.winner) {
        const loser = qf.winner === qf.p1 ? qf.p2 : qf.p1;
        if (loser) t8.push(loser);
      }
    }

    const groupStageEliminated = [];
    const groupNames = ["A", "B", "C", "D"];
    groupNames.forEach(gk => {
      const standings = bracket.groups?.[gk]?.standings || [];
      if (standings.length >= 4) {
        groupStageEliminated.push(standings[2].name);
        groupStageEliminated.push(standings[3].name);
      }
    });

    event.results = JSON.stringify({
      champion: newWinner,
      runnerUp: runnerUp,
      top4: [t4_1, t4_2].filter(Boolean),
      top8: t8.filter(Boolean),
      top16: groupStageEliminated.filter(Boolean)
    });
  } else if (elimType === "double_upper_lower") {
    if (!bracket.grandFinal || !bracket.grandFinal.winner) {
      showCustomToast("Pertandingan final belum selesai!", "error");
      return;
    }
    newWinner = bracket.grandFinal.winner;
    runnerUp = newWinner === bracket.grandFinal.p1 ? bracket.grandFinal.p2 : bracket.grandFinal.p1;

    const lowerFinalIdx = B - 3;
    const lowerSemiIdx = B - 4;
    const lowerQFSemi1 = B - 6;
    const lowerQFSemi2 = B - 5;
    const lowerQF1 = B - 8;
    const lowerQF2 = B - 7;

    if (bracket.lower) {
      if (bracket.lower[lowerFinalIdx]) {
        t4_1 = bracket.lower[lowerFinalIdx].winner === bracket.lower[lowerFinalIdx].p1 ? bracket.lower[lowerFinalIdx].p2 : bracket.lower[lowerFinalIdx].p1;
      }
      if (bracket.lower[lowerSemiIdx]) {
        t4_2 = bracket.lower[lowerSemiIdx].winner === bracket.lower[lowerSemiIdx].p1 ? bracket.lower[lowerSemiIdx].p2 : bracket.lower[lowerSemiIdx].p1;
      }

      [lowerQFSemi1, lowerQFSemi2, lowerQF1, lowerQF2].forEach(idx => {
        if (bracket.lower[idx]) {
          const loser = bracket.lower[idx].winner === bracket.lower[idx].p1 ? bracket.lower[idx].p2 : bracket.lower[idx].p1;
          if (loser) t8.push(loser);
        }
      });
    }
  } else if (elimType === "double_pool") {
    if (!bracket.grandFinal || !bracket.grandFinal.winner) {
      showCustomToast("Pertandingan final belum selesai!", "error");
      return;
    }

    const finalMatchIdx = B - 2;
    const poolAWinner = bracket.poolA?.[finalMatchIdx]?.winner;
    const poolBWinner = bracket.poolB?.[finalMatchIdx]?.winner;
    const sameWinner = (poolAWinner && poolBWinner && poolAWinner === poolBWinner);

    if (sameWinner) {
      newWinner = poolAWinner; // Champion is the same pool winner
      runnerUp = bracket.grandFinal.winner; // Runner-up is the winner of the playoff
      
      // Top 4 includes the loser of the playoff (who got 3rd place)
      const playoffLoser = runnerUp === bracket.grandFinal.p1 ? bracket.grandFinal.p2 : bracket.grandFinal.p1;
      t4_1 = playoffLoser;
      t4_2 = "";
    } else {
      newWinner = bracket.grandFinal.winner;
      runnerUp = newWinner === bracket.grandFinal.p1 ? bracket.grandFinal.p2 : bracket.grandFinal.p1;

      if (bracket.poolA && bracket.poolA[finalMatchIdx]) {
        t4_1 = bracket.poolA[finalMatchIdx].winner === bracket.poolA[finalMatchIdx].p1 ? bracket.poolA[finalMatchIdx].p2 : bracket.poolA[finalMatchIdx].p1;
      }
      if (bracket.poolB && bracket.poolB[finalMatchIdx]) {
        t4_2 = bracket.poolB[finalMatchIdx].winner === bracket.poolB[finalMatchIdx].p1 ? bracket.poolB[finalMatchIdx].p2 : bracket.poolB[finalMatchIdx].p1;
      }
    }

    const sf1 = B - 4;
    const sf2 = B - 3;
    [bracket.poolA, bracket.poolB].forEach(pb => {
      if (pb) {
        if (pb[sf1]) {
          const l1 = pb[sf1].winner === pb[sf1].p1 ? pb[sf1].p2 : pb[sf1].p1;
          if (l1) t8.push(l1);
        }
        if (pb[sf2]) {
          const l2 = pb[sf2].winner === pb[sf2].p1 ? pb[sf2].p2 : pb[sf2].p1;
          if (l2) t8.push(l2);
        }
      }
    });
  } else {
    // Single elimination
    let finalMatchIdx = B - 2;
    const finalMatch = bracket[finalMatchIdx];

    if (!finalMatch || !finalMatch.winner) {
      showCustomToast("Pertandingan final belum selesai!", "error");
      return;
    }

    newWinner = finalMatch.winner;
    runnerUp = newWinner === finalMatch.p1 ? finalMatch.p2 : finalMatch.p1;

    // Semifinal matches are at B - 4 and B - 3
    const sf1 = bracket[B - 4];
    const sf2 = bracket[B - 3];
    if (sf1) t4_1 = sf1.winner === sf1.p1 ? sf1.p2 : sf1.p1;
    if (sf2) t4_2 = sf2.winner === sf2.p1 ? sf2.p2 : sf2.p1;

    // Quarterfinal matches are at B - 8 to B - 5
    for (let idx = B - 8; idx <= B - 5; idx++) {
      const qf = bracket[idx];
      if (qf) {
        const loser = qf.winner === qf.p1 ? qf.p2 : qf.p1;
        if (loser) t8.push(loser);
      }
    }
  }

  event.results = JSON.stringify({
    champion: newWinner,
    runnerUp: runnerUp,
    top4: [t4_1, t4_2].filter(v => v && v !== 'BYE'),
    top8: t8.filter(v => v && v !== 'BYE')
  });

  event.status = "Selesai";
  await saveEventDetails(event);

  // Trigger points publishing modal
  showPublishSirkuitModal(event, async (sirkuitIdx) => {
    await publishPointsSequence(event, sirkuitIdx);
    showCustomToast("Turnamen berhasil difinalisasi dan poin sirkuit klasemen telah dirilis!", "success");
    openEventDetail(event.id);
  });
};

window.triggerRepublishPoints = function(eventId) {
  const btnPublish = document.getElementById("btn-event-detail-publish");
  if (btnPublish) {
    btnPublish.click();
  }
};

// Publish standings points sequence
async function publishPointsSequence(event, sirkuitIdx) {
  const sirkuitName = bocSirkuits[sirkuitIdx];
  let results = {};
  try {
    results = JSON.parse(event.results || "{}");
  } catch (e) {}

  if (!results.champion) return;

  const awards = [];
  let participants = [];
  try {
    participants = JSON.parse(event.participants || "[]");
  } catch (e) {}

  participants.forEach(pName => {
    const pts = getPointsForPlayer(event, pName);
    if (pts > 0) {
      awards.push({ name: pName, pts: pts });
    }
  });

  // Reset all players' points for this sirkuit index first to avoid orphans/leftovers
  for (let pName in exactBocPoints) {
    if (exactBocPoints[pName]) {
      exactBocPoints[pName][sirkuitIdx] = "";
    }
  }

  // Assign points locally
  awards.forEach(item => {
    const pName = item.name;
    const pts = item.pts;

    if (!exactBocPoints[pName]) {
      exactBocPoints[pName] = Array(bocSirkuits.length).fill("");
    } else if (exactBocPoints[pName].length < bocSirkuits.length) {
      while (exactBocPoints[pName].length < bocSirkuits.length) {
        exactBocPoints[pName].push("");
      }
    }
    
    // Assign points
    exactBocPoints[pName][sirkuitIdx] = pts;
  });

  // Save exactBocPoints to localStorage
  localStorage.setItem("exactBocPoints", JSON.stringify(exactBocPoints));

  // Set event publish status
  event.points_published = 1;
  await saveEventDetails(event);

  // Update handicap points (+30, +20, +10) and manage automatic promotions in players table
  const rules = bocSettings.point_rules || defaultPointRules;
  const cp = rules.circuit_points || defaultPointRules.circuit_points;
  const hp = rules.hc_points || defaultPointRules.hc_points;
  const ht = rules.hc_thresholds || defaultPointRules.hc_thresholds;

  for (const pName of participants) {
    const player = (appData.players || []).find(p => p.name === pName);
    if (player) {
      const pts = getPointsForPlayer(event, pName);
      let hcPts = hp.others ?? 0;
      if (pts === (cp.champion ?? 12)) hcPts = hp.champion ?? 30;
      else if (pts === (cp.runnerUp ?? 9)) hcPts = hp.runnerUp ?? 20;
      else if (pts === (cp.top4 ?? 7)) hcPts = hp.top4 ?? 10;

      if (hcPts > 0) {
        const currentHC = player.handicap.toString().trim();
        const hcThresholds = {
          "3B": { next: "3N", pts: ht["3B"] ?? 30 },
          "3N": { next: "3A", pts: ht["3N"] ?? 60 },
          "3A": { next: "4B", pts: ht["3A"] ?? 150 },
          "4B": { next: "4A", pts: ht["4B"] ?? 200 },
          "4A": { next: "5B", pts: ht["4A"] ?? 300 },
          "5B": { next: "5A", pts: ht["5B"] ?? 400 },
          "5A": { next: "6", pts: ht["5A"] ?? 500 },
          "6": { next: "7", pts: ht["6"] ?? 600 }
        };

        const newPoints = parseFloat(player.points || 0) + hcPts;
        let newHC = currentHC;
        let finalPoints = newPoints;

        if (hcThresholds[currentHC]) {
          const threshold = hcThresholds[currentHC].pts;
          if (newPoints >= threshold) {
            newHC = hcThresholds[currentHC].next;
            finalPoints = 0.0;
          }
        }

        player.points = finalPoints;
        player.handicap = newHC;

        if (isServerOnline) {
          try {
            await fetch(`/api/players/${player.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ points: finalPoints, handicap: newHC })
            });
          } catch (err) {
            console.error(`Failed to update player handicap points for ${pName}:`, err);
          }
        }
      }
    }
  }

  // Recalculate global standings & rankings
  await recalculateAndSyncAllStandings();

  showCustomToast(`Poin berhasil dirilis ke sirkuit "${sirkuitName}"!`, "success");
  openEventDetail(event.id);
}

// Publish Sirkuit Selection Modal
function showPublishSirkuitModal(event, onSelect) {
  let modalOverlay = document.createElement('div');
  modalOverlay.className = 'pm-modal-overlay';
  modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 11000; animation: pmFadeIn 0.2s ease-out;';
  
  const modal = document.createElement('div');
  modal.className = 'pm-modal';
  modal.style.cssText = 'width: 440px; max-width: 90%; background: var(--bg-surface-solid); border: 1px solid rgba(251, 191, 36, 0.25); border-radius: var(--radius-md); box-shadow: var(--shadow-lg), 0 0 35px rgba(251, 191, 36, 0.05); padding: 24px; animation: pmSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);';

  // Find pre-selected sirkuit index
  let preSelectedIdx = 0;
  const titleLower = event.title.toLowerCase();
  bocSirkuits.forEach((s, idx) => {
    if (titleLower.includes(s.toLowerCase()) || s.toLowerCase().includes(titleLower)) {
      preSelectedIdx = idx;
    }
  });

  const optionsHtml = bocSirkuits.map((s, idx) => {
    return `<option value="${idx}" ${idx === preSelectedIdx ? 'selected' : ''}>${s}</option>`;
  }).join("");

  modal.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
      <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: var(--gold); font-size: 1.25rem; flex-shrink: 0;">
        <i class="fa-solid fa-ranking-star"></i>
      </div>
      <div style="min-width: 0; flex: 1;">
        <h3 style="font-family: var(--font-headers); font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 6px; text-align: left;">Rilis Poin Sirkuit BOC</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0; text-align: left;">Pilih seri sirkuit klasemen tempat hasil poin event <strong>${event.title}</strong> akan dicatat.</p>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <label class="form-lbl" style="margin-bottom: 8px; display: block; font-size: 0.8rem; font-weight: 700; color: #fff; text-align: left;">Seri Sirkuit Tujuan:</label>
      <select id="publish-sirkuit-select" class="select-reset" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); color: #fff; border-radius: var(--radius-sm); padding: 10px 12px; font-size: 0.88rem; outline: none; cursor: pointer;">
        ${optionsHtml}
      </select>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 16px; margin-top: 12px;">
      <button id="publish-modal-btn-cancel" class="btn btn-secondary" style="padding: 8px 18px; font-size: 0.85rem; border-radius: var(--radius-sm); cursor: pointer;">Batal</button>
      <button id="publish-modal-btn-confirm" class="btn" style="padding: 8px 18px; font-size: 0.85rem; border-radius: var(--radius-sm); background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); color: #fff; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">Rilis Poin</button>
    </div>
  `;

  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  const cleanUp = () => {
    modalOverlay.style.opacity = '0';
    setTimeout(() => modalOverlay.remove(), 200);
  };

  const cancelBtn = modal.querySelector('#publish-modal-btn-cancel');
  const confirmBtn = modal.querySelector('#publish-modal-btn-confirm');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', cleanUp);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const select = modal.querySelector('#publish-sirkuit-select');
      const selectedIdx = parseInt(select.value, 10);
      cleanUp();
      if (typeof onSelect === 'function') {
        onSelect(selectedIdx);
      }
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanUp();
  });
}
// Buka modal "Tambah Event" dari kalender dengan tanggal otomatis terisi
window.openAddEventFromCalendar = function(dateStr) {
  const modalAdd = document.getElementById("modal-add-event");
  const form = document.getElementById("form-admin-add-event");
  if (!modalAdd) return;

  // Reset form terlebih dahulu
  if (form) form.reset();

  // Reset poster upload state
  const dropZone = document.getElementById("event-poster-drop-zone");
  const previewContainer = document.getElementById("event-poster-preview-container");
  if (dropZone) dropZone.style.display = "flex";
  if (previewContainer) previewContainer.style.display = "none";

  // Pre-fill tanggal dari kalender
  const dateInput = document.getElementById("adm-evt-date");
  if (dateInput) dateInput.value = dateStr;

  // Reset wizard to Step 1
  if (typeof window.resetAddEventWizard === "function") {
    window.resetAddEventWizard();
  }

  // Tampilkan modal
  modalAdd.style.display = "flex";
};

// Local state for bulk registration modal session
let bulkTempSelected = [];

// Render grid selection inside bulk registration modal
function renderBulkAthleteGrid(tempSelected) {
  const grid = document.getElementById("event-bulk-athletes-grid");
  const quotaInfo = document.getElementById("event-bulk-quota-info");
  const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
  if (!grid || !activeEvent) return;

  const B = activeEvent.bracket_size || "16";
  const limit = B === "manual" ? null : parseInt(B, 10);

  // Update quota info
  if (quotaInfo) {
    if (limit === null) {
      quotaInfo.textContent = `Terpilih: ${tempSelected.length} Atlet`;
    } else {
      const remaining = limit - tempSelected.length;
      quotaInfo.textContent = `Terpilih: ${tempSelected.length}/${limit} (Sisa Kuota: ${remaining >= 0 ? remaining : 0})`;
    }
  }

  const query = (document.getElementById("event-bulk-search")?.value || "").toLowerCase();
  const athletes = appData.players || [];
  const filtered = athletes.filter(a => a.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">Tidak ada atlet yang cocok dengan pencarian.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => {
    const isSelected = tempSelected.includes(a.name);
    // Find standing rank
    const standing = (appData.standings || []).find(s => s.name === a.name);
    const rankText = standing ? `Rank #${standing.rank}` : "Belum Ada Rank";

    return `
      <div class="athlete-select-card ${isSelected ? 'selected' : ''}" onclick="toggleAthleteSelectionInModal('${a.name}')">
        <input type="checkbox" class="athlete-select-cb" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleAthleteSelectionInModal('${a.name}')">
        <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
          <div style="font-family: var(--font-headers); font-weight: 700; font-size: 0.85rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${a.name}">${a.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${a.club || 'Tanpa Klub'}</div>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
            <span class="table-badge-hc ${getHandicapColorClass(a.handicap)}" style="font-size: 0.65rem; padding: 1px 6px;">HC ${a.handicap}</span>
            <span style="font-size: 0.65rem; color: var(--gold); font-weight: 700;">${rankText}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Toggle athlete checkbox/card selection inside modal
window.toggleAthleteSelectionInModal = function(name) {
  const activeEvent = appData.events.find(evt => evt.id === currentActiveEventId);
  if (!activeEvent) return;
  const B = activeEvent.bracket_size || "16";

  const idx = bulkTempSelected.indexOf(name);
  if (idx > -1) {
    // Unselect
    bulkTempSelected.splice(idx, 1);
  } else {
    // Check handicap eligibility
    const playerObj = appData.players.find(p => p.name === name);
    if (playerObj && !isHandicapAllowed(playerObj.handicap, activeEvent.max_hc)) {
      showCustomToast(`Handicap atlet (${playerObj.handicap}) melebihi batas maksimal event ini (${activeEvent.max_hc || 'Bebas'})!`, "error");
      return;
    }
    // Select
    const limit = B === "manual" ? null : parseInt(B, 10);
    if (limit !== null && bulkTempSelected.length >= limit) {
      showCustomToast(`Kapasitas penuh! Hanya dapat memilih maksimal ${limit} atlet.`, "error");
      return;
    }
    bulkTempSelected.push(name);
  }
  renderBulkAthleteGrid(bulkTempSelected);
};

// Expose functions globally for inline events
window.setupEventManagement = setupEventManagement;
window.renderAdminEventsDashboard = renderAdminEventsDashboard;
window.openEventDetail = openEventDetail;

// Fullscreen Bracket feature
window.toggleBracketFullscreen = function() {
  const wrapper = document.querySelector("#pub-event-tab-bracket .bracket-simulator-wrapper");
  if (!wrapper) return;
  
  if (!document.fullscreenElement) {
    wrapper.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

// Monitor fullscreen state change to update button icon & text
document.addEventListener("fullscreenchange", () => {
  const btn = document.getElementById("pub-bracket-fullscreen-btn");
  if (btn) {
    if (document.fullscreenElement) {
      btn.innerHTML = `<i class="fa-solid fa-compress"></i> Keluar Layar Penuh`;
    } else {
      btn.innerHTML = `<i class="fa-solid fa-expand"></i> Layar Penuh`;
    }
  }
});

// Initialize Flatpickr Date Pickers with Indonesian locale, range support, and manual inputs
function setupDatePickers() {
  if (typeof flatpickr !== "undefined") {
    const config = {
      wrap: true,
      allowInput: true,
      clickOpens: false,
      mode: "range",
      dateFormat: "j F Y",
      locale: "id",
      disableMobile: true,
      static: true
    };
    flatpickr("#adm-evt-date-wrapper", config);
    flatpickr("#edit-evt-date-wrapper", config);

    // Flatpickr for BOC Schedule (Single Date)
    const singleConfig = {
      wrap: true,
      allowInput: true,
      clickOpens: false,
      dateFormat: "j F Y",
      locale: "id",
      disableMobile: true,
      static: true
    };
    flatpickr("#inp-boc-schedule-date-wrapper", singleConfig);

  }
}

// ==========================================================================
// 13. Kelola Surat Edaran Admin Logic (Upload PDF/Word/Excel Base64 & CRUD)
// ==========================================================================
let currentDocBase64 = "";
let selectedFileExt = "";
let selectedFileType = "";

function renderAdminDocsDashboard(searchQuery = "", filterType = "ALL") {
  const tableBody = document.getElementById("pm-doc-table-body");
  if (!tableBody) return;

  const docs = appData.documents || [];
  const filtered = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === "ALL") return matchesSearch;
    const docType = getFileTypeLabel(doc.title, doc.fileType);
    return matchesSearch && docType === filterType;
  });

  const totalItems = filtered.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (admDocsCurrentPage > totalPages) {
    admDocsCurrentPage = totalPages;
  }
  if (admDocsCurrentPage < 1) {
    admDocsCurrentPage = 1;
  }

  const startIndex = (admDocsCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDocs = filtered.slice(startIndex, endIndex);

  // Render Rows
  tableBody.innerHTML = paginatedDocs.map((doc, idx) => {
    const iconClass = getFileIconClass(doc.title, doc.fileType);
    const docType = getFileTypeLabel(doc.title, doc.fileType);
    return `
      <tr>
        <td class="text-center" style="font-weight: 600; color: var(--text-muted);">${startIndex + idx + 1}</td>
        <td class="table-name-bold">
          <i class="${iconClass}" style="margin-right:8px; font-size:1.1rem"></i>
          ${doc.title}
        </td>
        <td style="color:var(--text-muted)">${doc.date}</td>
        <td class="text-center" style="font-family:var(--font-headers); font-weight:600">${doc.fileSize}</td>
        <td class="text-center"><span class="doc-badge doc-badge-${docType.toLowerCase()}">${docType}</span></td>
        <td class="text-center">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <a href="${doc.fileUrl || '#'}" target="_blank" class="doc-action-btn doc-action-btn-download" aria-label="Unduh ${doc.title}" ${doc.fileUrl ? '' : `onclick="showCustomToast('Unduhan tidak tersedia untuk dokumen ini.', 'error'); return false;"`}>
              <i class="fa-solid fa-download"></i>
            </a>
            <button class="doc-action-btn doc-action-btn-delete" onclick="deleteAdminDoc('${doc.id}')" title="Hapus Dokumen">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  if (totalItems === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px; color:var(--text-muted)"><i class="fa-solid fa-magnifying-glass" style="font-size:1.8rem; margin-bottom:12px; display:block"></i> Surat edaran tidak ditemukan</td></tr>`;
  }

  // Update Stats row
  const totalDocsEl = document.getElementById("pm-total-docs");
  const totalSizeEl = document.getElementById("pm-docs-size");
  const latestDateEl = document.getElementById("pm-docs-latest-date");

  if (totalDocsEl) totalDocsEl.textContent = docs.length;

  // Calculate total size
  let totalKB = 0;
  docs.forEach(d => {
    let sizeStr = d.fileSize || "0 KB";
    let val = parseFloat(sizeStr);
    if (isNaN(val)) val = 0;
    if (sizeStr.toUpperCase().includes("MB")) {
      totalKB += val * 1024;
    } else {
      totalKB += val;
    }
  });

  if (totalSizeEl) {
    if (totalKB >= 1024) {
      totalSizeEl.textContent = (totalKB / 1024).toFixed(1) + " MB";
    } else {
      totalSizeEl.textContent = totalKB.toFixed(0) + " KB";
    }
  }

  if (latestDateEl) {
    if (docs.length > 0) {
      latestDateEl.textContent = docs[0].date;
    } else {
      latestDateEl.textContent = "-";
    }
  }

  // Update Pagination Info
  const pageRangeEl = document.getElementById("adm-docs-page-range");
  const totalCountEl = document.getElementById("adm-docs-total-count");
  if (pageRangeEl && totalCountEl) {
    pageRangeEl.textContent = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : "0-0";
    totalCountEl.textContent = totalItems;
  }

  // Render Page Numbers
  renderAdminDocsPageNumbers(totalPages);
}

function renderAdminDocsPageNumbers(totalPages) {
  const container = document.getElementById("adm-docs-page-numbers");
  const prevBtn = document.getElementById("adm-docs-prev-page");
  const nextBtn = document.getElementById("adm-docs-next-page");

  if (prevBtn) prevBtn.disabled = admDocsCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = admDocsCurrentPage >= totalPages;

  if (!container) return;
  container.innerHTML = "";

  const maxVisible = 5;
  let startPage = Math.max(1, admDocsCurrentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.className = `pm-page-btn ${admDocsCurrentPage === i ? "active" : ""}`;
    btn.textContent = i;
    btn.style.width = "28px";
    btn.style.height = "28px";
    btn.style.borderRadius = "6px";
    btn.style.border = admDocsCurrentPage === i ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)";
    btn.style.background = admDocsCurrentPage === i ? "var(--gradient-primary)" : "rgba(255,255,255,0.02)";
    btn.style.color = admDocsCurrentPage === i ? "#fff" : "var(--text-dim)";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "600";
    btn.style.fontSize = "0.75rem";
    
    btn.addEventListener("click", () => {
      admDocsCurrentPage = i;
      const searchVal = document.getElementById("pm-doc-search-input")?.value || "";
      const filterVal = document.getElementById("pm-doc-filter-type")?.value || "ALL";
      renderAdminDocsDashboard(searchVal, filterVal);
    });
    container.appendChild(btn);
  }
}

function setupDocManagement() {
  const modal = document.getElementById("pm-add-doc-modal");
  const btnOpen = document.getElementById("btn-open-add-doc-modal");
  const btnClose = document.getElementById("pm-doc-modal-close");
  const form = document.getElementById("form-admin-add-doc");

  const searchInput = document.getElementById("pm-doc-search-input");
  const btnReset = document.getElementById("pm-doc-reset-filters");

  const dropZone = document.getElementById("doc-drop-zone");
  const fileInput = document.getElementById("adm-doc-file");
  const previewContainer = document.getElementById("doc-preview-container");
  const previewFilename = document.getElementById("doc-preview-filename");
  const btnClearDoc = document.getElementById("btn-clear-doc");

  // Open modal
  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => {
      // Role Check
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      const restrictOverlay = document.getElementById("restrict-docs-overlay");
      if (restrictOverlay) {
        restrictOverlay.style.display = role === "staff" ? "flex" : "none";
      }

      // Prepopulate date input with today's date in Indonesian
      const dateInput = document.getElementById("adm-doc-date");
      if (dateInput) {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const today = new Date();
        dateInput.value = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      }

      modal.style.display = "flex";
    });
  }

  // Close modal
  if (btnClose && modal) {
    btnClose.addEventListener("click", () => { modal.style.display = "none"; });
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  // Reset form / upload state
  function resetUploadState() {
    currentDocBase64 = "";
    selectedFileExt = "";
    selectedFileType = "";
    if (fileInput) fileInput.value = "";
    if (dropZone) dropZone.style.display = "flex";
    if (previewContainer) previewContainer.style.display = "none";
  }

  if (btnClearDoc) {
    btnClearDoc.addEventListener("click", resetUploadState);
  }

  const filterTypeSelect = document.getElementById("pm-doc-filter-type");

  function handleFilterChange() {
    admDocsCurrentPage = 1; // Reset to page 1 on filter/search change
    const searchVal = searchInput ? searchInput.value : "";
    const filterVal = filterTypeSelect ? filterTypeSelect.value : "ALL";
    renderAdminDocsDashboard(searchVal, filterVal);
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleFilterChange);
  }

  if (filterTypeSelect) {
    filterTypeSelect.addEventListener("change", handleFilterChange);
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (filterTypeSelect) filterTypeSelect.value = "ALL";
      admDocsCurrentPage = 1;
      renderAdminDocsDashboard();
    });
  }

  // Bind pagination arrows for admin docs
  const prevBtn = document.getElementById("adm-docs-prev-page");
  const nextBtn = document.getElementById("adm-docs-next-page");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (admDocsCurrentPage > 1) {
        admDocsCurrentPage--;
        const searchVal = searchInput ? searchInput.value : "";
        const filterVal = filterTypeSelect ? filterTypeSelect.value : "ALL";
        renderAdminDocsDashboard(searchVal, filterVal);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const docs = appData.documents || [];
      const searchVal = searchInput ? searchInput.value : "";
      const filterVal = filterTypeSelect ? filterTypeSelect.value : "ALL";
      const filteredCount = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchVal.toLowerCase());
        if (filterVal === "ALL") return matchesSearch;
        const docType = getFileTypeLabel(doc.title, doc.fileType);
        return matchesSearch && docType === filterVal;
      }).length;
      const totalPages = Math.ceil(filteredCount / 10) || 1;

      if (admDocsCurrentPage < totalPages) {
        admDocsCurrentPage++;
        renderAdminDocsDashboard(searchVal, filterVal);
      }
    });
  }

  // File Upload Drag & Drop
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove("dragover");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) handleDocFileSelection(files[0]);
    });

    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) handleDocFileSelection(files[0]);
    });
  }

  function handleDocFileSelection(file) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      showCustomToast("Format berkas tidak valid! Silakan unggah berkas PDF, Word, atau Excel.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showCustomToast("Ukuran dokumen terlalu besar! Maksimal batas ukuran berkas adalah 5MB.", "error");
      return;
    }

    selectedFileExt = fileExt;
    selectedFileType = getFileTypeLabel(file.name, file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      currentDocBase64 = e.target.result;
      
      // Update UI Previews
      if (previewFilename) {
        previewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }

      // Update Preview Icon dynamically
      const previewIcon = document.getElementById("doc-preview-icon");
      if (previewIcon) {
        previewIcon.className = getFileIconClass(file.name, file.type);
        previewIcon.style.fontSize = "2rem";
      }

      const filetypeLabel = document.getElementById("doc-preview-filetype-label");
      if (filetypeLabel) {
        filetypeLabel.textContent = `Format ${selectedFileType} Terverifikasi`;
      }
      
      if (dropZone) dropZone.style.display = "none";
      if (previewContainer) previewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  // Form Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Role restrict check
      const role = localStorage.getItem("pobsi_admin_role") || "admin";
      if (role === "staff") {
        showCustomToast("Hak akses terbatas! Hanya Admin atau Super Admin yang dapat mengunggah berkas.", "error");
        return;
      }

      const titleInput = document.getElementById("adm-doc-title");
      const dateInput = document.getElementById("adm-doc-date");

      const title = titleInput.value.trim();
      const date = dateInput.value.trim();

      if (!title || !date) {
        showCustomToast("Judul dokumen dan tanggal rilis wajib diisi!", "error");
        return;
      }

      if (!currentDocBase64) {
        showCustomToast("Silakan pilih berkas dokumen untuk diunggah!", "error");
        return;
      }

      // Calculate file size string
      const previewText = previewFilename ? previewFilename.textContent : "";
      const sizeMatch = previewText.match(/\((.*?)\)/);
      const fileSize = sizeMatch ? sizeMatch[1] : "500 KB";

      const payload = {
        title,
        date,
        fileSize,
        fileType: selectedFileType || "PDF",
        fileExtension: selectedFileExt || ".pdf",
        fileData: currentDocBase64
      };

      if (isServerOnline) {
        try {
          const res = await fetch('/api/docs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            showCustomToast(`Berhasil mengunggah dokumen "${title}"!`, "success");
            form.reset();
            resetUploadState();
            if (modal) modal.style.display = "none";

            // Reset search/filter inputs & page index
            if (searchInput) searchInput.value = "";
            if (filterTypeSelect) filterTypeSelect.value = "ALL";
            docsCurrentPage = 1;
            admDocsCurrentPage = 1;

            // Reload data
            await loadDataFromApi();
            renderAdminDocsDashboard();
            renderDocuments(); // Update public table too
          } else {
            const errJson = await res.json();
            showCustomToast(`Gagal menyimpan berkas: ${errJson.error || 'Server error'}`, "error");
          }
        } catch (err) {
          showCustomToast(`Error koneksi server: ${err.message}`, "error");
        }
      } else {
        // Local mode fallback
        const tempId = `D_TEMP_${(appData.documents || []).length + 1}`;
        const newDoc = {
          id: tempId,
          title: title + (title.toLowerCase().endsWith(selectedFileExt) ? "" : selectedFileExt),
          date,
          fileSize,
          fileType: selectedFileType || "PDF",
          fileUrl: "" 
        };

        if (!appData.documents) appData.documents = [];
        appData.documents.unshift(newDoc);

        showCustomToast(`Mode Luring: Berkas "${title}" ditambahkan sementara di memori browser!`, "info");
        form.reset();
        resetUploadState();
        if (modal) modal.style.display = "none";

        // Reset search/filter inputs & page index
        if (searchInput) searchInput.value = "";
        if (filterTypeSelect) filterTypeSelect.value = "ALL";
        docsCurrentPage = 1;
        admDocsCurrentPage = 1;

        renderAdminDocsDashboard();
        renderDocuments();
      }
    });
  }
}

// Delete Document
window.deleteAdminDoc = async function(id) {
  const role = localStorage.getItem("pobsi_admin_role") || "admin";
  if (role === "staff") {
    showCustomToast("Hak akses terbatas! Hanya Admin atau Super Admin yang dapat menghapus dokumen resmi.", "error");
    return;
  }

  const doc = (appData.documents || []).find(d => d.id === id);
  if (!doc) return;

  showCustomConfirm(
    "Konfirmasi Hapus Dokumen",
    `Apakah Anda yakin ingin menghapus dokumen "${doc.title}"? Tindakan ini tidak dapat dibatalkan.`,
    async () => {
      if (isServerOnline) {
        try {
          const res = await fetch(`/api/docs/${id}`, {
            method: 'DELETE'
          });

          if (res.ok) {
            showCustomToast("Dokumen berhasil dihapus!", "success");
            await loadDataFromApi();
            renderAdminDocsDashboard();
            renderDocuments();
          } else {
            // Try fallback to query param endpoint
            const resQuery = await fetch(`/api/docs?id=${id}`, {
              method: 'DELETE'
            });
            if (resQuery.ok) {
              showCustomToast("Dokumen berhasil dihapus!", "success");
              await loadDataFromApi();
              renderAdminDocsDashboard();
              renderDocuments();
            } else {
              const errJson = await resQuery.json().catch(() => ({}));
              showCustomToast(`Gagal menghapus berkas: ${errJson.error || 'Server error'}`, "error");
            }
          }
        } catch (err) {
          showCustomToast(`Error koneksi server: ${err.message}`, "error");
        }
      } else {
        // Local memory delete
        const idx = (appData.documents || []).findIndex(d => d.id === id);
        if (idx > -1) {
          appData.documents.splice(idx, 1);
          showCustomToast("Mode Luring: Berkas dihapus dari memori browser.", "info");
          renderAdminDocsDashboard();
          renderDocuments();
        }
      }
    },
    "Hapus",
    "danger"
  );
};

window.renderAdminDocsDashboard = renderAdminDocsDashboard;
window.setupDocManagement = setupDocManagement;

// 13. System Settings Logic
function setupSystemSettings() {
  const formOrg = document.getElementById("form-settings-org");
  const formRules = document.getElementById("form-settings-rules");
  const formPassword = document.getElementById("form-settings-password");
  const formAddUser = document.getElementById("form-settings-add-user");
  const formPoints = document.getElementById("form-settings-points");
  const btnAddUser = document.getElementById("btn-settings-add-user");
  const modalAddUser = document.getElementById("settings-add-user-modal");
  const btnCloseModal = document.getElementById("settings-user-modal-close");

  const orgNameInput = document.getElementById("set-org-name");
  const chairmanInput = document.getElementById("set-org-chairman");
  const emailInput = document.getElementById("set-org-email");
  const whatsappInput = document.getElementById("set-org-whatsapp");
  const addressInput = document.getElementById("set-org-address");

  const bocCutoffInput = document.getElementById("set-boc-cutoff");
  const bocMaxhcInput = document.getElementById("set-boc-maxhc");
  const bocYearInput = document.getElementById("set-boc-year");
  const bocPrize1Input = document.getElementById("set-boc-prize1");
  const bocPrize2Input = document.getElementById("set-boc-prize2");
  const bocPrize3Input = document.getElementById("set-boc-prize3");
  const bocBestGameInput = document.getElementById("set-boc-bestgame");
  const bocRulesInput = document.getElementById("set-boc-rules");

  const currentRole = localStorage.getItem("pobsi_admin_role") || "admin";
  const currentUsername = localStorage.getItem("pobsi_admin_username") || "admin";

  // Check RBAC limits: only super admin can change rules/org or manage admins
  const isAdminOrSuper = currentRole === "admin" || currentRole === "super admin";
  const isSuperAdmin = currentRole === "super admin";

  // Settings Sub-menu Tab Switcher
  const subLinks = document.querySelectorAll(".settings-sub-link");
  const subPanes = document.querySelectorAll(".settings-pane-card");

  subLinks.forEach(link => {
    link.addEventListener("click", () => {
      const targetSub = link.getAttribute("data-sub");
      
      subLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      subPanes.forEach(pane => {
        pane.classList.remove("active");
        if (pane.id === targetSub) {
          pane.classList.add("active");
        }
      });
    });
  });

  // Hide accounts menu if not super admin
  const subUsersBtn = document.getElementById("settings-sub-users-btn");
  if (!isSuperAdmin) {
    if (subUsersBtn) subUsersBtn.style.display = "none";
  }

  // Initialize form fields from localStorage (or default hardcoded ones)
  if (orgNameInput) orgNameInput.value = localStorage.getItem("pobsi_org_name") || "POBSI Kabupaten Banjarnegara";
  if (chairmanInput) chairmanInput.value = localStorage.getItem("pobsi_chairman") || "H. Sugeng W., S.E.";
  if (emailInput) emailInput.value = localStorage.getItem("pobsi_email") || "info@pobsibanjarnegara.or.id";
  if (whatsappInput) whatsappInput.value = localStorage.getItem("pobsi_whatsapp") || "+62 812-3456-789";
  if (addressInput) addressInput.value = localStorage.getItem("pobsi_address") || "Banjarnegara, Jawa Tengah";

  if (bocCutoffInput) bocCutoffInput.value = bocSettings.cutoff_limit || "16";
  if (bocMaxhcInput) bocMaxhcInput.value = bocSettings.max_handicap || "Bebas";
  if (bocYearInput) bocYearInput.value = localStorage.getItem("currentBocYear") || "2026";

  // Populate prizes from bocSettings
  const prizes = bocSettings.prizes || {};
  if (bocPrize1Input) bocPrize1Input.value = prizes.juara1 || "";
  if (bocPrize2Input) bocPrize2Input.value = prizes.juara2 || "";
  if (bocPrize3Input) bocPrize3Input.value = prizes.juara3 || "";
  if (bocBestGameInput) bocBestGameInput.value = prizes.best_game || "";
  if (bocRulesInput) bocRulesInput.value = bocSettings.rules || "";


  if (!isSuperAdmin) {
    // Hide administrative users card
    const usersCard = document.getElementById("settings-admin-users-card");
    if (usersCard) usersCard.style.display = "none";
  }

  if (currentRole === "staff") {
    // Disable inputs in rules and org profiles
    if (formOrg) {
      formOrg.querySelectorAll("input, button").forEach(el => el.disabled = true);
    }
    if (formRules) {
      formRules.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
    }
    if (formPoints) {
      formPoints.querySelectorAll("input, button").forEach(el => el.disabled = true);
    }
  }

  // Populate Database mode info
  const dbModeEl = document.getElementById("settings-db-mode");
  const dbDriverEl = document.getElementById("settings-db-driver");
  if (dbModeEl) {
    if (isServerOnline) {
      dbModeEl.textContent = "ONLINE (CLOUD CONNECTED)";
      dbModeEl.style.cssText = "font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);";
      if (dbDriverEl) dbDriverEl.textContent = "Supabase PostgreSQL (Production Cloud)";
    } else {
      dbModeEl.textContent = "LURING (LOCAL DEMO DB)";
      dbModeEl.style.cssText = "font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25);";
      if (dbDriverEl) dbDriverEl.textContent = "SQLite 3 (Local API Mode)";
    }
  }

  // Form Submit: Org profile
  if (formOrg) {
    formOrg.addEventListener("submit", (e) => {
      e.preventDefault();
      if (currentRole === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah profil organisasi.", "error");
        return;
      }
      localStorage.setItem("pobsi_org_name", orgNameInput.value.trim());
      localStorage.setItem("pobsi_chairman", chairmanInput.value.trim());
      localStorage.setItem("pobsi_email", emailInput.value.trim());
      localStorage.setItem("pobsi_whatsapp", whatsappInput.value.trim());
      localStorage.setItem("pobsi_address", addressInput.value.trim());

      showCustomToast("Profil organisasi berhasil diperbarui!", "success");
      
      // Update public page texts immediately
      applySettingsToDOM();
    });
  }

  // Form Submit: BOC Rules
  if (formRules) {
    formRules.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (currentRole === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah regulasi BOC.", "error");
        return;
      }

      // Save settings to database
      await saveBocSettings({
        cutoff_limit: bocCutoffInput ? parseInt(bocCutoffInput.value, 10) : (bocSettings.cutoff_limit || 16),
        max_handicap: bocMaxhcInput ? bocMaxhcInput.value : "Bebas",
        prizes: {
          juara1: bocPrize1Input ? bocPrize1Input.value.trim() : '',
          juara2: bocPrize2Input ? bocPrize2Input.value.trim() : '',
          juara3: bocPrize3Input ? bocPrize3Input.value.trim() : '',
          best_game: bocBestGameInput ? bocBestGameInput.value.trim() : ''
        },
        rules: bocRulesInput ? bocRulesInput.value.trim() : '',
        cover: window.currentUploadedBocCoverBase64 || null
      });
      
      const oldYear = localStorage.getItem("currentBocYear") || "2026";
      const newYear = bocYearInput.value.trim();
      localStorage.setItem("currentBocYear", newYear);

      showCustomToast("Regulasi sirkuit BOC berhasil diperbarui!", "success");
      if (typeof closeBocSettingsModal === "function") {
        closeBocSettingsModal();
      }

      if (oldYear !== newYear) {
        currentBocYear = newYear;
        // Load settings for the new year
        await loadBocSettings(newYear);
        // Reload sirkuits for the new year
        bocSirkuits = loadBocSirkuitsForYear(newYear);
        // Refresh standings & events
        loadDataFromApi().then(() => {
          renderStandings();
          renderEvents("all");
          renderAdminBocConsole();
        });
      } else {
        // Just refresh standings display
        renderStandings();
      }
    });
  }

  // Form Submit: Points & Handicap rules
  if (formPoints) {
    formPoints.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (currentRole === "staff") {
        showCustomToast("Akses Dibatasi: Peran Staff tidak diizinkan mengubah aturan poin.", "error");
        return;
      }

      const updatedRules = {
        circuit_points: {
          champion: parseInt(document.getElementById("pts-circuit-champion").value, 10),
          runnerUp: parseInt(document.getElementById("pts-circuit-runnerUp").value, 10),
          top4: parseInt(document.getElementById("pts-circuit-top4").value, 10),
          top8: parseInt(document.getElementById("pts-circuit-top8").value, 10),
          top16: parseInt(document.getElementById("pts-circuit-top16").value, 10),
          top32: parseInt(document.getElementById("pts-circuit-top32").value, 10)
        },
        hc_points: {
          champion: parseInt(document.getElementById("pts-hc-champion").value, 10),
          runnerUp: parseInt(document.getElementById("pts-hc-runnerUp").value, 10),
          top4: parseInt(document.getElementById("pts-hc-top4").value, 10),
          others: parseInt(document.getElementById("pts-hc-others").value, 10)
        },
        hc_thresholds: {
          "3B": parseInt(document.getElementById("th-hc-3b").value, 10),
          "3N": parseInt(document.getElementById("th-hc-3n").value, 10),
          "3A": parseInt(document.getElementById("th-hc-3a").value, 10),
          "4B": parseInt(document.getElementById("th-hc-4b").value, 10),
          "4A": parseInt(document.getElementById("th-hc-4a").value, 10),
          "5B": parseInt(document.getElementById("th-hc-5b").value, 10),
          "5A": parseInt(document.getElementById("th-hc-5a").value, 10),
          "6": parseInt(document.getElementById("th-hc-6").value, 10)
        }
      };

      const year = localStorage.getItem("currentBocYear") || "2026";
      try {
        await saveBocSettings({
          year: year,
          point_rules: updatedRules
        });
        showCustomToast("Konfigurasi aturan poin & handicap berhasil diperbarui!", "success");
      } catch (err) {
        showCustomToast(`Gagal menyimpan aturan: ${err.message}`, "error");
      }
    });
  }

  // Form Submit: Change Password
  if (formPassword) {
    formPassword.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById("set-pwd-current").value;
      const newPwd = document.getElementById("set-pwd-new").value;
      const confirmPwd = document.getElementById("set-pwd-confirm").value;

      if (newPwd.length < 6) {
        showCustomToast("Kata sandi baru minimal harus 6 karakter!", "error");
        return;
      }

      if (newPwd !== confirmPwd) {
        showCustomToast("Konfirmasi kata sandi baru tidak cocok!", "error");
        return;
      }

      try {
        const res = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUsername,
            currentPassword: currentPwd,
            newPassword: newPwd
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          showCustomToast("Kata sandi Anda berhasil diubah!", "success");
          formPassword.reset();
        } else {
          showCustomToast(data.error || "Gagal mengubah kata sandi!", "error");
        }
      } catch (err) {
        showCustomToast(`Koneksi error: ${err.message}`, "error");
      }
    });
  }

  // Modal actions for adding admin
  if (btnAddUser && modalAddUser) {
    btnAddUser.addEventListener("click", () => {
      if (!isSuperAdmin) return;
      modalAddUser.style.display = "flex";
    });
  }

  if (btnCloseModal && modalAddUser) {
    btnCloseModal.addEventListener("click", () => {
      modalAddUser.style.display = "none";
    });
  }

  // Form Submit: Add Admin User
  if (formAddUser) {
    formAddUser.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isSuperAdmin) return;

      const fullname = document.getElementById("set-user-fullname").value.trim();
      const username = document.getElementById("set-user-username").value.trim().toLowerCase();
      const password = document.getElementById("set-user-pwd").value;
      const role = document.getElementById("set-user-role").value;

      if (password.length < 6) {
        showCustomToast("Kata sandi minimal harus 6 karakter!", "error");
        return;
      }

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullname, username, password, role })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          showCustomToast("Akun pengelola berhasil didaftarkan!", "success");
          formAddUser.reset();
          if (modalAddUser) modalAddUser.style.display = "none";
          renderAdminUsersList();
        } else {
          showCustomToast(data.error || "Gagal mendaftarkan pengelola!", "error");
        }
      } catch (err) {
        showCustomToast(`Koneksi error: ${err.message}`, "error");
      }
    });
  }

  // Load and render users list for super admins
  if (isSuperAdmin) {
    renderAdminUsersList();
  }
}

// Render administrative users list table
async function renderAdminUsersList() {
  const tableBody = document.getElementById("settings-users-table-body");
  if (!tableBody) return;

  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const users = await res.json();
      const currentUsername = localStorage.getItem("pobsi_admin_username") || "";

      tableBody.innerHTML = users.map((user, idx) => {
        const isCurrent = user.username === currentUsername;
        const isSuper = user.username === 'superadmin';
        const deleteBtn = (isCurrent || isSuper) ? `
          <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic">Tidak bisa dihapus</span>
        ` : `
          <button type="button" class="doc-action-btn doc-action-btn-delete" onclick="deleteAdminUser('${user.username}')" title="Hapus Akun">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;

        // Style role badge
        let badgeColor = "rgba(59, 130, 246, 0.15)";
        let textColor = "#3b82f6";
        let borderColor = "rgba(59, 130, 246, 0.25)";
        if (user.role === 'super admin') {
          badgeColor = "rgba(251, 191, 36, 0.15)";
          textColor = "#fbbf24";
          borderColor = "rgba(251, 191, 36, 0.25)";
        } else if (user.role === 'staff') {
          badgeColor = "rgba(156, 163, 175, 0.15)";
          textColor = "#9ca3af";
          borderColor = "rgba(156, 163, 175, 0.25)";
        }

        return `
          <tr>
            <td class="text-center" style="font-weight:600; color:var(--text-muted);">${idx + 1}</td>
            <td style="font-weight:700; color:#fff">${user.fullname} ${isCurrent ? ' <span style="font-size:0.7rem; color:#10b981; font-weight:600; border:1px solid rgba(16,185,129,0.2); background:rgba(16,185,129,0.05); padding:2px 6px; border-radius:4px; margin-left:6px">AKUN ANDA</span>' : ''}</td>
            <td style="font-family:monospace; color:var(--text-dim)">@${user.username}</td>
            <td class="text-center">
              <span class="badge" style="font-size:0.72rem; font-weight:700; padding:4px 8px; border-radius:4px; background:${badgeColor}; color:${textColor}; border:1px solid ${borderColor}; text-transform:uppercase;">
                ${user.role}
              </span>
            </td>
            <td class="text-center">
              ${deleteBtn}
            </td>
          </tr>
        `;
      }).join("");

      if (users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:24px; color:var(--text-muted)">Tidak ada akun pengelola.</td></tr>`;
      }
    }
  } catch (err) {
    console.error("Error loading admin users list:", err);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:24px; color:#ef4444">Gagal memuat data dari server. Check koneksi.</td></tr>`;
  }
}

// Delete Administrator User
window.deleteAdminUser = function(username) {
  const currentRole = localStorage.getItem("pobsi_admin_role") || "admin";
  if (currentRole !== "super admin") {
    showCustomToast("Hak akses terbatas! Hanya Super Admin yang dapat mengelola akun pengelola.", "error");
    return;
  }

  showCustomConfirm(
    "Hapus Akun Pengelola",
    `Apakah Anda yakin ingin menghapus akun pengelola "@${username}"? Akses administratif untuk akun ini akan segera dicabut secara permanen.`,
    async () => {
      try {
        const res = await fetch(`/api/admin/users?username=${username}`, {
          method: 'DELETE'
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          showCustomToast("Akun pengelola berhasil dihapus!", "success");
          renderAdminUsersList();
        } else {
          showCustomToast(data.error || "Gagal menghapus pengelola!", "error");
        }
      } catch (err) {
        showCustomToast(`Koneksi error: ${err.message}`, "error");
      }
    },
    "Cabut Akses",
    "danger"
  );
};

// Apply profile configurations dynamically to the portals header, footer, etc.
function applySettingsToDOM() {
  const orgName = localStorage.getItem("pobsi_org_name") || "POBSI Kabupaten Banjarnegara";
  const email = localStorage.getItem("pobsi_email") || "info@pobsibanjarnegara.or.id";
  const whatsapp = localStorage.getItem("pobsi_whatsapp") || "+62 812-3456-789";
  const address = localStorage.getItem("pobsi_address") || "Banjarnegara, Jawa Tengah";

  // Document Title
  document.title = `${orgName} - Platform Digital Resmi Biliar`;

  // Header logo text updates (splits first word and remainder)
  const words = orgName.split(" ");
  const firstWord = words[0] || "POBSI";
  const remaining = words.slice(1).join(" ").toUpperCase() || "BANJARNEGARA";

  document.querySelectorAll(".logo-title").forEach(el => {
    el.textContent = firstWord;
  });
  document.querySelectorAll(".logo-subtitle").forEach(el => {
    el.textContent = remaining;
  });

  // Sidebar branding check
  const logoText = document.querySelector(".nav-logo span");
  if (logoText) logoText.textContent = orgName;

  // Footer organization texts
  const footerOrgName = document.querySelector(".footer-left h3");
  if (footerOrgName) footerOrgName.textContent = orgName;

  const footerLogoText = document.querySelector(".footer-logo-text");
  if (footerLogoText) footerLogoText.textContent = orgName.toUpperCase();

  const footerCopyright = document.querySelector(".footer-bottom p");
  if (footerCopyright) {
    footerCopyright.innerHTML = `&copy; 2026 ${orgName}. Hak Cipta Dilindungi. Didukung oleh KONI Kabupaten Banjarnegara.`;
  }
}

window.setupSystemSettings = setupSystemSettings;
window.applySettingsToDOM = applySettingsToDOM;


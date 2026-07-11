import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Supabase Configuration (using service role key to bypass RLS for administrative operations)
const SUPABASE_URL = "https://flwrkxufkknrqbdlkvvp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd3JreHVma2tucnFiZGxrdnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYzMjEwMywiZXhwIjoyMDk3MjA4MTAzfQ.2bQaLJPuybEaHL9thSxsoUZi9q-blPzIdeBdYF-LWuM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Fallback Silhouette Image (Premium dark SVG vector base64 encoded)
const DEFAULT_PHOTO = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFiMjUzYiIvPjxwYXRoIGQ9Ik0xMiAxMmMyLjIxIDAgNC0xLjc5IDQtNHMtMS43OS00LTQtNC00IDEuNzktNCA0IDEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiIGZpbGw9IiM0NzU1NjkiLz48L3N2Zz4=`;

// Application State
let state = {
  players: [],
  teams: [],
  history: [],
  teamSeasons: [],
  tempTeamSeasons: [],
  carnetQueue: [],
  selectedPlayer: null,
  pendingAction: null // Holds data for confirmation modal
};

// DOM Elements
const elements = {
  statPlayers: document.getElementById('stat-players'),
  statTeams: document.getElementById('stat-teams'),
  statHistory: document.getElementById('stat-history'),
  btnSync: document.getElementById('btn-sync'),
  searchPlayer: document.getElementById('search-player'),
  btnSearchTrigger: document.getElementById('btn-search-trigger'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  searchSuggestions: document.getElementById('search-suggestions'),
  playerProfile: document.getElementById('player-profile'),
  playerPlaceholder: document.getElementById('player-placeholder'),
  playerImg: document.getElementById('player-img'),
  playerFullName: document.getElementById('player-fullname'),
  playerCIBadge: document.getElementById('player-ci-badge'),
  playerBirthdate: document.getElementById('player-birthdate'),
  playerTimeline: document.getElementById('player-timeline'),
  formTransfer: document.getElementById('form-transfer'),
  transferTeamInput: document.getElementById('transfer-team-input'),
  formNewPlayer: document.getElementById('form-new-player'),
  newTeamInput: document.getElementById('new-team-input'),
  teamsList: document.getElementById('teams-list'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmSummaryText: document.getElementById('confirm-summary-text'),
  modalCancel: document.getElementById('modal-cancel'),
  modalConfirm: document.getElementById('modal-confirm'),
  toastContainer: document.getElementById('toast-container'),
  
  // Navigation & Roster Elements
  sectionPlayers: document.getElementById('section-players'),
  sectionRosters: document.getElementById('section-rosters'),
  rosterTeamInput: document.getElementById('roster-team-input'),
  btnRosterSearch: document.getElementById('btn-roster-search'),
  rosterResultsContainer: document.getElementById('roster-results-container'),
  rosterSelectedTeamName: document.getElementById('roster-selected-team-name'),
  rosterSelectAll: document.getElementById('roster-select-all'),
  rosterTableBody: document.getElementById('roster-table-body'),
  btnRosterRenew: document.getElementById('btn-roster-renew'),
  rosterPlaceholder: document.getElementById('roster-placeholder'),
  
  // Carnet Elements
  sectionCarnets: document.getElementById('section-carnets'),
  searchCarnetPlayer: document.getElementById('search-carnet-player'),
  btnClearCarnetSearch: document.getElementById('btn-clear-carnet-search'),
  btnCarnetSearchTrigger: document.getElementById('btn-carnet-search-trigger'),
  searchCarnetSuggestions: document.getElementById('search-carnet-suggestions'),
  carnetPreviewContainer: document.getElementById('carnet-preview-container'),
  carnetPlaceholder: document.getElementById('carnet-placeholder'),
  carnetAnverso: document.getElementById('carnet-anverso'),
  carnetReverso: document.getElementById('carnet-reverso'),
  btnPrintCarnet: document.getElementById('btn-print-carnet'),
  btnAddCarnetQueue: document.getElementById('btn-add-carnet-queue'),
  carnetTeamInput: document.getElementById('carnet-team-input'),
  btnLoadCarnetTeam: document.getElementById('btn-load-carnet-team'),
  carnetTeamResults: document.getElementById('carnet-team-results'),
  carnetTeamSelectedName: document.getElementById('carnet-team-selected-name'),
  carnetTeamSelectAll: document.getElementById('carnet-team-select-all'),
  carnetTeamTableBody: document.getElementById('carnet-team-table-body'),
  btnGenerateTeamCarnetsPdf: document.getElementById('btn-generate-team-carnets-pdf'),
  carnetQueueSummary: document.getElementById('carnet-queue-summary'),
  btnGenerateQueuePdf: document.getElementById('btn-generate-queue-pdf'),
  btnClearCarnetQueue: document.getElementById('btn-clear-carnet-queue'),
  printSection: document.getElementById('print-section'),
  pdfRenderArea: document.getElementById('pdf-render-area'),
  
  // Advanced Section Elements
  sectionAdvanced: document.getElementById('section-advanced'),
  searchAdvancedPlayer: document.getElementById('search-advanced-player'),
  btnClearAdvancedSearch: document.getElementById('btn-clear-advanced-search'),
  btnAdvancedSearchTrigger: document.getElementById('btn-advanced-search-trigger'),
  searchAdvancedSuggestions: document.getElementById('search-advanced-suggestions'),
  advancedProfileContainer: document.getElementById('advanced-profile-container'),
  advancedPlaceholder: document.getElementById('advanced-placeholder'),
  formAdvancedEdit: document.getElementById('form-advanced-edit'),
  advancedNombres: document.getElementById('advanced-nombres'),
  advancedApellidos: document.getElementById('advanced-apellidos'),
  advancedCI: document.getElementById('advanced-ci'),
  advancedBirthdate: document.getElementById('advanced-birthdate'),
  btnAdvancedSave: document.getElementById('btn-advanced-save'),
  btnAdvancedDelete: document.getElementById('btn-advanced-delete'),
  advancedConfirmModal: document.getElementById('advanced-confirm-modal'),
  advancedModalTitle: document.getElementById('advanced-modal-title'),
  advancedModalWarningText: document.getElementById('advanced-modal-warning-text'),
  advancedModalSummaryText: document.getElementById('advanced-modal-summary-text'),
  advancedConfirmPassword: document.getElementById('advanced-confirm-password'),
  advancedConfirmPasswordError: document.getElementById('advanced-confirm-password-error'),
  btnAdvancedModalCancel: document.getElementById('btn-advanced-modal-cancel'),
  btnAdvancedModalConfirm: document.getElementById('btn-advanced-modal-confirm')
};

// Helper: Normalize strings (removes accents, lowercase)
function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Helper: Highlight matching characters in search results (accent-insensitive)
function highlightText(text, query) {
  if (!query) return text;
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);
  
  let result = '';
  let currentIndex = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, currentIndex);
  
  if (matchIndex === -1) return text;
  
  while (matchIndex !== -1) {
    result += text.substring(currentIndex, matchIndex);
    const matchText = text.substring(matchIndex, matchIndex + query.length);
    result += `<strong>${matchText}</strong>`;
    currentIndex = matchIndex + query.length;
    matchIndex = normalizedText.indexOf(normalizedQuery, currentIndex);
  }
  
  result += text.substring(currentIndex);
  return result;
}

// Toast Notifications System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';
  
  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
    <div class="toast-progress" style="animation-duration: 4000ms;"></div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'No registrada';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Helper: Format full name
function formatFullName(player) {
  return `${player.nombres} ${player.apellidos}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeFileName(value) {
  return normalizeString(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'carnets';
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getPlayerByCi(ci) {
  return state.players.find(p => p.ci === ci) || null;
}

function getLatestPlayerRecord(playerCi) {
  const playerHistory = state.history.filter(h => h.jugador_ci === playerCi);
  playerHistory.sort((a, b) => Number(b['año'] || 0) - Number(a['año'] || 0));
  return playerHistory[0] || null;
}

function getTeamSeasonCategory(team, preferredYear = getCurrentYear()) {
  if (!team) return 'Sin categoría';

  const records = state.teamSeasons
    .filter(item => Number(item.equipo_id) === Number(team.id))
    .sort((a, b) => Number(b['año'] || 0) - Number(a['año'] || 0));

  const exactRecord = records.find(item => Number(item['año']) === Number(preferredYear));
  if (exactRecord?.categoria) return exactRecord.categoria;

  const tempRecord = state.tempTeamSeasons.find(item =>
    normalizeString(item.nombre_equipo) === normalizeString(team.nombre) &&
    Number(item.anio) === Number(preferredYear)
  );
  if (tempRecord?.categoria) return tempRecord.categoria;

  const priorRecord = records.find(item => Number(item['año']) <= Number(preferredYear));
  if (priorRecord?.categoria) return priorRecord.categoria;

  return 'Sin categoría';
}

function getCarnetRenderData(player) {
  const latestRecord = getLatestPlayerRecord(player.ci);
  const currentYear = getCurrentYear();
  const recordYear = latestRecord ? Number(latestRecord['año']) : currentYear;
  const team = latestRecord ? state.teams.find(t => t.id === latestRecord.equipo_id) : null;
  const teamName = team ? team.nombre : 'SIN CLUB REGISTRADO';
  const teamCategory = team ? getTeamSeasonCategory(team, currentYear) : 'Sin categoría';

  let age = null;
  if (player.fecha_nacimiento) {
    const birthDate = new Date(player.fecha_nacimiento);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  let category = latestRecord?.categoria_jugador || 'natural';
  if (age !== null && age < 19) {
    category = 'juvenil';
  }

  let categoryLabel = 'Natural';
  let catClass = 'cat-natural';
  if (category === 'refuerzo') {
    categoryLabel = 'Refuerzo';
    catClass = 'cat-refuerzo';
  } else if (category === 'juvenil') {
    categoryLabel = 'Juvenil';
    catClass = 'cat-juvenil';
  }

  const today = new Date();
  const emissionDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const isTemp = player.ci.startsWith('TEMP-');
  const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
  const qrValue = `https://kardex.ligadefutbolvinto.com/${player.ci}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}&color=0f172a&bgcolor=ffffff&qzone=1`;

  return {
    player,
    latestRecord,
    currentYear,
    recordYear,
    teamName,
    teamCategory,
    category,
    categoryLabel,
    catClass,
    emissionDate,
    isTemp,
    photoUrl,
    qrImgUrl
  };
}

function buildCarnetHtml(player) {
  const data = getCarnetRenderData(player);
  const fullName = escapeHtml(formatFullName(player));
  const ciText = data.isTemp ? 'Temporal' : escapeHtml(player.ci);
  const birthText = escapeHtml(formatDate(player.fecha_nacimiento));
  const teamName = escapeHtml(data.teamName);
  const teamCategory = escapeHtml(data.teamCategory);
  const categoryBadge = data.category !== 'natural' ? `<span class="carnet-category-badge">${escapeHtml(data.categoryLabel)}</span>` : '';

  return {
    catClass: data.catClass,
    anversoHtml: `
    <div class="carnet-front-header">
      <img src="/logo.png" class="carnet-header-logo" alt="" crossorigin="anonymous" onerror="this.style.display='none'">
      <div class="carnet-header-text-container">
        <div class="carnet-header-title">LIGA DE FUTBOL VINTO</div>
        <div class="carnet-header-subtitle">Fdo. 13 de Mayo de 1963</div>
        <div class="carnet-header-subtitle">Personeria Juridica R. S. Nº 128155</div>
      </div>
    </div>
    <div class="carnet-front-body">
      <div class="carnet-player-photo-container">
        <img src="${data.photoUrl}" class="carnet-player-photo-img" crossorigin="anonymous" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      </div>
      <div class="carnet-player-details">
        <div class="carnet-detail-item">
          <span class="carnet-detail-label">Jugador</span>
          <span class="carnet-detail-value player-name-value">${fullName}</span>
        </div>
        <div class="carnet-detail-item">
          <span class="carnet-detail-label">Cédula de Identidad</span>
          <span class="carnet-detail-value">${ciText}</span>
        </div>
        <div class="carnet-detail-item">
          <span class="carnet-detail-label">Fecha de nacimiento</span>
          <span class="carnet-detail-value">${birthText}</span>
        </div>
        <div class="carnet-detail-item">
          <span class="carnet-detail-label">Club Actual (${data.currentYear})</span>
          <span class="carnet-detail-value carnet-team-line"><span>${teamName}</span><span class="carnet-team-category">${teamCategory}</span></span>
        </div>
        <div class="carnet-detail-item carnet-emission-row">
          <div class="carnet-detail-item">
            <span class="carnet-detail-label">F. Emisión</span>
            <span class="carnet-detail-value carnet-emission-date">${data.emissionDate}</span>
          </div>
          ${categoryBadge}
        </div>
      </div>
    </div>
    <div class="carnet-front-footer">
      VINTO - COCHABAMBA
    </div>
  `,
    reversoHtml: `
    <div class="carnet-back-qr-wrapper">
      <img src="${data.qrImgUrl}" class="carnet-back-qr-img" alt="QR Verification" crossorigin="anonymous">
    </div>
    <div class="carnet-back-signatures">
      <img src="/logo.png" class="carnet-back-watermark" alt="" crossorigin="anonymous">
      <div class="carnet-sig-area">
        <img src="/presidente.png" class="carnet-signature-img carnet-signature-president" alt="" crossorigin="anonymous">
        <div class="carnet-sig-line"></div>
        <span class="carnet-sig-name">Enrique Uribe</span>
        <span class="carnet-sig-label">Presidente</span>
      </div>
      <div class="carnet-sig-area">
        <img src="/secretario.png" class="carnet-signature-img carnet-signature-secretary" alt="" crossorigin="anonymous">
        <div class="carnet-sig-line"></div>
        <span class="carnet-sig-name">Jose Marcelo Donaire</span>
        <span class="carnet-sig-label">Srio. Matriculas</span>
      </div>
    </div>
  `
  };
}

function renderCarnetPreview(player) {
  const carnet = buildCarnetHtml(player);
  elements.carnetAnverso.className = `carnet-side carnet-front ${carnet.catClass}`;
  elements.carnetAnverso.innerHTML = carnet.anversoHtml;
  elements.carnetReverso.className = `carnet-side carnet-back ${carnet.catClass}`;
  elements.carnetReverso.innerHTML = carnet.reversoHtml;
}

// Generate Temporary CI
function generateTempCI() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `TEMP-${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Initialize Application Cache
async function initApp() {
  setupEventListeners();
  
  const cachedPlayers = localStorage.getItem('vinto_players');
  const cachedTeams = localStorage.getItem('vinto_teams');
  const cachedHistory = localStorage.getItem('vinto_history');
  const cachedTeamSeasons = localStorage.getItem('vinto_team_seasons');
  const cachedTempTeamSeasons = localStorage.getItem('vinto_temp_team_seasons');
  const cachedCarnetQueue = localStorage.getItem('vinto_carnet_queue');
  
  if (cachedPlayers && cachedTeams && cachedHistory && cachedTeamSeasons && cachedTempTeamSeasons) {
    try {
      state.players = JSON.parse(cachedPlayers);
      state.teams = JSON.parse(cachedTeams);
      state.history = JSON.parse(cachedHistory);
      state.teamSeasons = JSON.parse(cachedTeamSeasons);
      state.tempTeamSeasons = JSON.parse(cachedTempTeamSeasons);
      state.carnetQueue = cachedCarnetQueue ? JSON.parse(cachedCarnetQueue) : [];
      
      updateStatsUI();
      populateTeamDropdowns();
      updateCarnetQueueUI();
      showToast('Base de datos local cargada desde caché', 'info');
    } catch (e) {
      console.error("Error reading cache", e);
      await syncDatabase();
    }
  } else {
    // If no cache, perform initial sync
    await syncDatabase();
  }
}

// Sync Database from Supabase (handling pagination chunks of 1000)
async function syncDatabase() {
  setSyncingState(true);
  showToast('Iniciando sincronización con Supabase...', 'info');
  
  try {
    // 1. Fetch Teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('equipos')
      .select('*')
      .order('nombre', { ascending: true });
      
    if (teamsError) throw teamsError;
    state.teams = teamsData;

    // 2. Fetch Players (Paginated)
    let playersList = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .range(from, from + limit - 1);
        
      if (error) throw error;
      playersList = playersList.concat(data);
      
      if (data.length < limit) {
        hasMore = false;
      } else {
        from += limit;
      }
    }
    state.players = playersList;

    // 3. Fetch History (Paginated)
    let historyList = [];
    from = 0;
    hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('historial_participacion')
        .select('*')
        .range(from, from + limit - 1);
        
      if (error) throw error;
      historyList = historyList.concat(data);
      
      if (data.length < limit) {
        hasMore = false;
      } else {
        from += limit;
      }
    }
    state.history = historyList;

    // 4. Fetch Team Categories by Season
    const { data: teamSeasonData, error: teamSeasonError } = await supabase
      .from('equipo_temporada')
      .select('*');

    if (teamSeasonError) throw teamSeasonError;
    state.teamSeasons = teamSeasonData || [];

    // 5. Temporary 2026 fallback table keyed by team name
    const { data: tempTeamSeasonData, error: tempTeamSeasonError } = await supabase
      .from('tmp_equipo_temporada_2026')
      .select('*');

    if (tempTeamSeasonError) throw tempTeamSeasonError;
    state.tempTeamSeasons = tempTeamSeasonData || [];

    // Cache in localStorage
    localStorage.setItem('vinto_teams', JSON.stringify(state.teams));
    localStorage.setItem('vinto_players', JSON.stringify(state.players));
    localStorage.setItem('vinto_history', JSON.stringify(state.history));
    localStorage.setItem('vinto_team_seasons', JSON.stringify(state.teamSeasons));
    localStorage.setItem('vinto_temp_team_seasons', JSON.stringify(state.tempTeamSeasons));
    
    updateStatsUI();
    populateTeamDropdowns();
    updateCarnetQueueUI();
    
    showToast('Sincronización completa. Base de datos guardada localmente.', 'success');
  } catch (err) {
    console.error("Sync error:", err);
    showToast(`Error al sincronizar: ${err.message}`, 'error');
  } finally {
    setSyncingState(false);
  }
}

// Update UI Stats Numbers
function updateStatsUI() {
  elements.statPlayers.textContent = state.players.length;
  elements.statTeams.textContent = state.teams.length;
  elements.statHistory.textContent = state.history.length;
}

// Set UI Sync Button State
function setSyncingState(isSyncing) {
  if (isSyncing) {
    elements.btnSync.disabled = true;
    elements.btnSync.querySelector('svg').classList.add('icon-spin');
  } else {
    elements.btnSync.disabled = false;
    elements.btnSync.querySelector('svg').classList.remove('icon-spin');
  }
}

// Populate Datalist with Sorted Teams
function populateTeamDropdowns() {
  const options = state.teams
    .map(team => `<option value="${team.nombre}"></option>`)
    .join('');
  elements.teamsList.innerHTML = options;
}

// Clear Search input, suggestions, and deselect player
function clearSearch() {
  elements.searchPlayer.value = '';
  state.selectedPlayer = null;
  elements.searchSuggestions.innerHTML = '';
  elements.searchSuggestions.classList.add('hidden');
  elements.btnClearSearch.classList.add('hidden');
  
  // Show placeholder card and hide profile
  elements.playerProfile.classList.add('hidden');
  elements.playerPlaceholder.classList.remove('hidden');
  
  // Focus search box
  elements.searchPlayer.focus();
}

// Toggle visibility of clear button
function toggleClearButtonVisibility() {
  if (elements.searchPlayer.value.trim().length > 0) {
    elements.btnClearSearch.classList.remove('hidden');
  } else {
    elements.btnClearSearch.classList.add('hidden');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Sync Button
  elements.btnSync.addEventListener('click', syncDatabase);
  
  // Search input events
  elements.searchPlayer.addEventListener('input', () => {
    handleSearchInput();
    toggleClearButtonVisibility();
  });
  elements.searchPlayer.addEventListener('focus', () => {
    if (elements.searchPlayer.value.trim().length > 0) {
      elements.searchSuggestions.classList.remove('hidden');
    }
  });
  
  // Clear search button event
  elements.btnClearSearch.addEventListener('click', clearSearch);
  
  // Search Trigger events
  elements.btnSearchTrigger.addEventListener('click', performFullSearch);
  elements.searchPlayer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performFullSearch();
    }
  });
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !elements.searchPlayer.contains(e.target) && 
      !elements.searchSuggestions.contains(e.target) && 
      !elements.btnSearchTrigger.contains(e.target) &&
      !elements.btnClearSearch.contains(e.target)
    ) {
      elements.searchSuggestions.classList.add('hidden');
    }
  });

  // Main Navigation Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.nav-section').forEach(s => s.classList.add('hidden'));
      
      btn.classList.add('active');
      const targetSectionId = btn.getAttribute('data-nav');
      document.getElementById(targetSectionId).classList.remove('hidden');
    });
  });

  // Tabs navigation (profile internal tabs)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Roster Search and Autocomplete Actions
  elements.btnRosterSearch.addEventListener('click', handleRosterSearch);
  elements.rosterTeamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleRosterSearch();
    }
  });

  // Roster Select All Checkbox (Only targets enabled/eligible players)
  elements.rosterSelectAll.addEventListener('change', (e) => {
    const checkboxes = elements.rosterTableBody.querySelectorAll('input.roster-cb:not(:disabled)');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
    });
  });

  // Roster Save Habilitaciones
  if (elements.btnRosterRenew) {
    const currentYear = new Date().getFullYear();
    elements.btnRosterRenew.querySelector('span').textContent = `Habilitar Nómina ${currentYear}`;
    elements.btnRosterRenew.addEventListener('click', () => handleRosterSave(currentYear));
  }

  // Transfer form button clicks (Pase / Préstamo)
  const btnTransferPase = document.getElementById('btn-transfer-pase');
  const btnTransferPrestamo = document.getElementById('btn-transfer-prestamo');
  if (btnTransferPase) {
    btnTransferPase.addEventListener('click', () => handleTransferAction('oficial'));
  }
  if (btnTransferPrestamo) {
    btnTransferPrestamo.addEventListener('click', () => handleTransferAction('prestamo'));
  }
  
  // New Player form submit (Save)
  elements.formNewPlayer.addEventListener('submit', handleNewPlayerSubmit);
  
  // Modal buttons
  elements.modalCancel.addEventListener('click', hideConfirmModal);
  elements.modalConfirm.addEventListener('click', executePendingAction);

  // Carnet Search Input
  elements.searchCarnetPlayer.addEventListener('input', () => {
    handleCarnetSearchInput();
    if (elements.searchCarnetPlayer.value.trim().length > 0) {
      elements.btnClearCarnetSearch.classList.remove('hidden');
    } else {
      elements.btnClearCarnetSearch.classList.add('hidden');
    }
  });
  elements.searchCarnetPlayer.addEventListener('focus', () => {
    if (elements.searchCarnetPlayer.value.trim().length > 0) {
      elements.searchCarnetSuggestions.classList.remove('hidden');
    }
  });

  // Clear Carnet Search
  elements.btnClearCarnetSearch.addEventListener('click', clearCarnetSearch);

  // Search Carnet Trigger
  elements.btnCarnetSearchTrigger.addEventListener('click', performFullCarnetSearch);
  elements.searchCarnetPlayer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performFullCarnetSearch();
    }
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !elements.searchCarnetPlayer.contains(e.target) && 
      !elements.searchCarnetSuggestions.contains(e.target) && 
      !elements.btnCarnetSearchTrigger.contains(e.target) &&
      !elements.btnClearCarnetSearch.contains(e.target)
    ) {
      elements.searchCarnetSuggestions.classList.add('hidden');
    }
  });

  // Print Carnet Action
  elements.btnPrintCarnet.addEventListener('click', handlePrintCarnet);
  elements.btnAddCarnetQueue.addEventListener('click', addSelectedCarnetToQueue);
  elements.btnLoadCarnetTeam.addEventListener('click', handleCarnetTeamSearch);
  elements.carnetTeamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCarnetTeamSearch();
    }
  });
  elements.carnetTeamSelectAll.addEventListener('change', (e) => {
    const checkboxes = elements.carnetTeamTableBody.querySelectorAll('input.carnet-team-cb');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
    });
  });
  elements.btnGenerateTeamCarnetsPdf.addEventListener('click', handleGenerateTeamCarnetsPdf);
  elements.btnGenerateQueuePdf.addEventListener('click', handleGenerateQueuePdf);
  elements.btnClearCarnetQueue.addEventListener('click', clearCarnetQueueList);

  // Advanced Search Input
  elements.searchAdvancedPlayer.addEventListener('input', () => {
    handleAdvancedSearchInput();
    if (elements.searchAdvancedPlayer.value.trim().length > 0) {
      elements.btnClearAdvancedSearch.classList.remove('hidden');
    } else {
      elements.btnClearAdvancedSearch.classList.add('hidden');
    }
  });
  elements.searchAdvancedPlayer.addEventListener('focus', () => {
    if (elements.searchAdvancedPlayer.value.trim().length > 0) {
      elements.searchAdvancedSuggestions.classList.remove('hidden');
    }
  });

  // Clear Advanced Search
  elements.btnClearAdvancedSearch.addEventListener('click', clearAdvancedSearch);

  // Search Advanced Trigger
  elements.btnAdvancedSearchTrigger.addEventListener('click', performFullAdvancedSearch);
  elements.searchAdvancedPlayer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performFullAdvancedSearch();
    }
  });

  // Close advanced suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (
      elements.searchAdvancedPlayer && 
      elements.searchAdvancedSuggestions && 
      elements.btnAdvancedSearchTrigger && 
      elements.btnClearAdvancedSearch &&
      !elements.searchAdvancedPlayer.contains(e.target) && 
      !elements.searchAdvancedSuggestions.contains(e.target) && 
      !elements.btnAdvancedSearchTrigger.contains(e.target) &&
      !elements.btnClearAdvancedSearch.contains(e.target)
    ) {
      elements.searchAdvancedSuggestions.classList.add('hidden');
    }
  });

  // Advanced Form Submit (Edit)
  elements.formAdvancedEdit.addEventListener('submit', handleAdvancedEditSubmit);

  // Advanced Form Delete Click
  elements.btnAdvancedDelete.addEventListener('click', handleAdvancedDeleteClick);

  // Advanced Modal Actions
  elements.btnAdvancedModalCancel.addEventListener('click', hideAdvancedConfirmModal);
  elements.btnAdvancedModalConfirm.addEventListener('click', executePendingAdvancedAction);
}

// Handle Search Input and render fast suggestions
function handleSearchInput() {
  const rawQuery = elements.searchPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    elements.searchSuggestions.innerHTML = '';
    elements.searchSuggestions.classList.add('hidden');
    
    // Restore appropriate card when search is cleared
    if (state.selectedPlayer) {
      elements.playerProfile.classList.remove('hidden');
      elements.playerPlaceholder.classList.add('hidden');
    } else {
      elements.playerProfile.classList.add('hidden');
      elements.playerPlaceholder.classList.remove('hidden');
    }
    return;
  }
  
  // Hide cards while actively searching to prevent occlusion/clutter
  elements.playerProfile.classList.add('hidden');
  elements.playerPlaceholder.classList.add('hidden');
  
  // Search locally
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  // Render suggestions
  elements.searchSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores</div>`;
    elements.searchSuggestions.classList.remove('hidden');
    return;
  }
  
  // Take top 25 matches for typing suggestions
  const topMatches = matches.slice(0, 25);
  
  topMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    // Check if temporal CI
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    
    // Build photo url
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    // Highlight matching text
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectPlayer(player));
    elements.searchSuggestions.appendChild(item);
  });
  
  elements.searchSuggestions.classList.remove('hidden');
}

// Perform Full Search showing all matches with scroll bar
function performFullSearch() {
  const rawQuery = elements.searchPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    showToast('Ingresa al menos 2 caracteres para buscar', 'warning');
    return;
  }
  
  // Hide cards while displaying search results
  elements.playerProfile.classList.add('hidden');
  elements.playerPlaceholder.classList.add('hidden');
  
  // Search locally
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  // Render suggestions
  elements.searchSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores para "${rawQuery}"</div>`;
    elements.searchSuggestions.classList.remove('hidden');
    return;
  }
  
  // Render suggestions header
  const header = document.createElement('div');
  header.className = 'suggestions-header';
  header.textContent = `Resultados de búsqueda: ${matches.length} encontrados`;
  elements.searchSuggestions.appendChild(header);
  
  // Take top 100 matches to prevent lag
  const displayMatches = matches.slice(0, 100);
  
  displayMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    // Check if temporal CI
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    
    // Build photo url
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    // Highlight matching text
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectPlayer(player));
    elements.searchSuggestions.appendChild(item);
  });
  
  elements.searchSuggestions.classList.remove('hidden');
}

// Select Player and Render Profile
function selectPlayer(player) {
  state.selectedPlayer = player;
  elements.searchSuggestions.classList.add('hidden');
  elements.searchPlayer.value = formatFullName(player);
  elements.btnClearSearch.classList.remove('hidden');
  
  // Populate Player profile card
  elements.playerFullName.textContent = formatFullName(player);
  elements.playerBirthdate.textContent = `Fecha de Nacimiento: ${formatDate(player.fecha_nacimiento)}`;
  
  // CI Badge setup
  const isTemp = player.ci.startsWith('TEMP-');
  elements.playerCIBadge.textContent = `C.I.: ${player.ci}`;
  if (isTemp) {
    elements.playerCIBadge.classList.add('badge-temp');
  } else {
    elements.playerCIBadge.classList.remove('badge-temp');
  }

  // Load Image with Fallback
  if (isTemp) {
    elements.playerImg.src = DEFAULT_PHOTO;
  } else {
    const photoUrl = `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    elements.playerImg.src = photoUrl;
    elements.playerImg.onerror = () => {
      elements.playerImg.src = DEFAULT_PHOTO;
      elements.playerImg.onerror = null;
    };
  }

  // Fetch and display player participation timeline
  renderPlayerTimeline(player.ci);
  
  // Show Profile & Hide Placeholder
  elements.playerPlaceholder.classList.add('hidden');
  elements.playerProfile.classList.remove('hidden');
  
  // Reset transfer form
  elements.formTransfer.reset();

  // Pre-populate category from latest history record
  const playerHistory = state.history.filter(h => h.jugador_ci === player.ci);
  playerHistory.sort((a, b) => b['año'] - a['año']);
  const latestRecord = playerHistory[0] || null;
  const categorySelect = document.getElementById('transfer-category');
  if (categorySelect) {
    if (latestRecord && latestRecord.categoria_jugador) {
      categorySelect.value = latestRecord.categoria_jugador;
    } else {
      categorySelect.value = 'natural';
    }
  }
  
  // Reset tabs: activate history tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="tab-history"]').classList.add('active');
  document.getElementById('tab-history').classList.add('active');
}

// Render Selected Player Timeline
function renderPlayerTimeline(playerCi) {
  // Filter history records
  const playerHistory = state.history.filter(h => h.jugador_ci === playerCi);
  
  // Sort descending by year
  playerHistory.sort((a, b) => b['año'] - a['año']);
  
  elements.playerTimeline.innerHTML = '';
  
  if (playerHistory.length === 0) {
    elements.playerTimeline.innerHTML = '<p class="no-suggestions">No se registra historial de participación.</p>';
    return;
  }
  
  playerHistory.forEach((item, index) => {
    const team = state.teams.find(t => t.id === item.equipo_id);
    const teamName = team ? team.nombre : `Club ID: ${item.equipo_id}`;
    const isCurrent = index === 0; // Highlight the latest record
    
    const timelineItem = document.createElement('div');
    timelineItem.className = `timeline-item ${isCurrent ? 'current' : ''}`;
    
    timelineItem.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-content">
        <div class="timeline-year">${item['año']}</div>
        <div class="timeline-team">${teamName}</div>
        <div class="timeline-category">Categoría: <span>${item.categoria_jugador}</span></div>
      </div>
    `;
    
    elements.playerTimeline.appendChild(timelineItem);
  });
}

// Handle Transfer Actions (Pase / Préstamo)
function handleTransferAction(condicionPase) {
  if (!elements.formTransfer.reportValidity()) return;
  
  if (!state.selectedPlayer) {
    showToast('Por favor selecciona un jugador primero', 'error');
    return;
  }
  
  const selectedTeamName = elements.transferTeamInput.value.trim();
  const team = state.teams.find(t => t.nombre.toLowerCase() === selectedTeamName.toLowerCase());
  
  if (!team) {
    showToast(`El club "${selectedTeamName}" no es válido o no está registrado. Elige uno de la lista.`, 'error');
    return;
  }
  
  const teamId = team.id;
  const teamName = team.nombre;
  const yearVal = new Date().getFullYear();
  const category = document.getElementById('transfer-category').value;
  
  // Find current/owner team from player's latest record
  const playerHistory = state.history.filter(h => h.jugador_ci === state.selectedPlayer.ci);
  playerHistory.sort((a, b) => b['año'] - a['año']);
  const latestRecord = playerHistory[0] || null;
  const currentTeamId = latestRecord ? latestRecord.equipo_id : null;
  const currentTeamName = latestRecord ? (state.teams.find(t => t.id === latestRecord.equipo_id)?.nombre || `Club ID: ${latestRecord.equipo_id}`) : 'Ninguno';
  
  if (condicionPase === 'prestamo' && !currentTeamId) {
    showToast('No se puede registrar un préstamo para un jugador sin club anterior.', 'error');
    return;
  }
  
  state.pendingAction = {
    type: 'transfer',
    playerCi: state.selectedPlayer.ci,
    playerName: formatFullName(state.selectedPlayer),
    teamId: teamId,
    teamName: teamName,
    year: yearVal,
    category: category,
    condicionPase: condicionPase,
    equipoPropietarioId: condicionPase === 'prestamo' ? currentTeamId : null,
    ownerTeamName: currentTeamName
  };
  
  const labelText = condicionPase === 'prestamo' ? `PRÉSTAMO (propietario: ${currentTeamName})` : 'PASE DEFINITIVO';
  elements.confirmSummaryText.innerHTML = `El jugador <strong>${state.selectedPlayer.nombres} ${state.selectedPlayer.apellidos}</strong> será transferido al equipo <strong>${teamName}</strong> en el año <strong>${yearVal}</strong> bajo la categoría <strong>${category}</strong> como <strong>${labelText}</strong>.`;
  
  showConfirmModal();
}

// Handle submit of New Player Form
function handleNewPlayerSubmit(e) {
  e.preventDefault();
  
  const nombres = document.getElementById('new-nombres').value.trim();
  const apellidos = document.getElementById('new-apellidos').value.trim();
  let ci = document.getElementById('new-ci').value.trim();
  const birthdate = document.getElementById('new-birthdate').value;
  
  const selectedTeamName = elements.newTeamInput.value.trim();
  const team = state.teams.find(t => t.nombre.toLowerCase() === selectedTeamName.toLowerCase());
  
  if (!team) {
    showToast(`El club "${selectedTeamName}" no es válido o no está registrado. Elige uno de la lista.`, 'error');
    return;
  }
  
  const teamId = team.id;
  const teamName = team.nombre;
  const yearVal = new Date().getFullYear();
  const category = document.getElementById('new-category').value;
  
  if (!ci) {
    ci = generateTempCI();
  }
  
  // Check if CI already exists in cache to prevent duplicate CIs locally
  const ciExists = state.players.some(p => p.ci.toLowerCase() === ci.toLowerCase());
  if (ciExists) {
    showToast(`El C.I. "${ci}" ya se encuentra registrado a otro jugador en el sistema.`, 'error');
    return;
  }
  
  state.pendingAction = {
    type: 'new_player',
    nombres: nombres,
    apellidos: apellidos,
    ci: ci,
    birthdate: birthdate || null,
    teamId: teamId,
    teamName: teamName,
    year: yearVal,
    category: category
  };
  
  elements.confirmSummaryText.innerHTML = `Se registrará al NUEVO jugador <strong>${nombres.toUpperCase()} ${apellidos.toUpperCase()}</strong> (C.I.: <em>${ci}</em>) y se habilitará su participación inicial en el club <strong>${teamName}</strong> para el año <strong>${yearVal}</strong> como <strong>${category}</strong>.`;
  
  showConfirmModal();
}

// Show/Hide Modal Dialog
function showConfirmModal() {
  elements.confirmModal.classList.remove('hidden');
}

function hideConfirmModal() {
  elements.confirmModal.classList.add('hidden');
  state.pendingAction = null;
  resetButtonSpinner();
}

function showButtonSpinner() {
  elements.modalConfirm.disabled = true;
  elements.modalConfirm.querySelector('.btn-spinner').classList.remove('hidden');
  elements.modalConfirm.querySelector('.btn-text').textContent = 'Inyectando...';
}

function resetButtonSpinner() {
  elements.modalConfirm.disabled = false;
  elements.modalConfirm.querySelector('.btn-spinner').classList.add('hidden');
  elements.modalConfirm.querySelector('.btn-text').textContent = 'Confirmar e Inyectar';
}

// Execute Pending Database Injection (Transfer or New Player)
async function executePendingAction() {
  if (!state.pendingAction) return;
  
  showButtonSpinner();
  const action = state.pendingAction;
  
  try {
    if (action.type === 'transfer') {
      // Inyectar / Upsert en historial_participacion
      const { data, error } = await supabase
        .from('historial_participacion')
        .upsert({
          jugador_ci: action.playerCi,
          equipo_id: action.teamId,
          "año": action.year,
          categoria_jugador: action.category,
          condicion_pase: action.condicionPase,
          equipo_propietario_id: action.equipoPropietarioId
        }, {
          onConflict: 'jugador_ci,año'
        })
        .select();
        
      if (error) throw error;
      
      // Update local history cache
      const existingIndex = state.history.findIndex(h => h.jugador_ci === action.playerCi && h['año'] === action.year);
      const insertedItem = data[0];
      
      if (existingIndex > -1) {
        state.history[existingIndex] = insertedItem;
      } else {
        state.history.push(insertedItem);
      }
      
      localStorage.setItem('vinto_history', JSON.stringify(state.history));
      updateStatsUI();
      
      // Re-render current timeline
      if (state.selectedPlayer && state.selectedPlayer.ci === action.playerCi) {
        renderPlayerTimeline(action.playerCi);
      }
      
      showToast(`Pase de ${action.playerName} guardado con éxito.`, 'success');
      hideConfirmModal();
      
    } else if (action.type === 'new_player') {
      // 1. Insert Player
      const upperNombres = action.nombres.toUpperCase();
      const upperApellidos = action.apellidos.toUpperCase();
      
      const { data: playerData, error: playerError } = await supabase
        .from('jugadores')
        .insert({
          ci: action.ci,
          nombres: upperNombres,
          apellidos: upperApellidos,
          fecha_nacimiento: action.birthdate
        })
        .select();
        
      if (playerError) throw playerError;
      
      // 2. Insert Participation
      const { data: histData, error: histError } = await supabase
        .from('historial_participacion')
        .insert({
          jugador_ci: action.ci,
          equipo_id: action.teamId,
          "año": action.year,
          categoria_jugador: action.category
        })
        .select();
        
      if (histError) {
        // Rollback player creation locally if database allows (or just report)
        throw histError;
      }
      
      // Add to local state
      const newPlayer = playerData[0];
      const newHist = histData[0];
      
      state.players.push(newPlayer);
      state.history.push(newHist);
      
      // Update localStorage
      localStorage.setItem('vinto_players', JSON.stringify(state.players));
      localStorage.setItem('vinto_history', JSON.stringify(state.history));
      
      updateStatsUI();
      
      // Reset new player form
      elements.formNewPlayer.reset();
      
      showToast(`Nuevo jugador ${upperNombres} ${upperApellidos} creado y habilitado.`, 'success');
      hideConfirmModal();
      
      // Auto-select the newly created player in search profile
      selectPlayer(newPlayer);
    } else if (action.type === 'roster_renewal') {
      // Bulk Insert in historial_participacion
      const insertRows = action.players.map(p => ({
        jugador_ci: p.ci,
        equipo_id: p.condicionPase === 'prestamo' ? p.destTeamId : action.teamId,
        "año": action.year,
        categoria_jugador: p.category,
        condicion_pase: p.condicionPase,
        equipo_propietario_id: p.condicionPase === 'prestamo' ? action.teamId : null
      }));
      
      const { data, error } = await supabase
        .from('historial_participacion')
        .insert(insertRows)
        .select();
        
      if (error) throw error;
      
      // Update local history cache
      data.forEach(insertedRow => {
        const idx = state.history.findIndex(h => h.jugador_ci === insertedRow.jugador_ci && h['año'] === insertedRow['año']);
        if (idx > -1) {
          state.history[idx] = insertedRow;
        } else {
          state.history.push(insertedRow);
        }
      });
      
      localStorage.setItem('vinto_history', JSON.stringify(state.history));
      updateStatsUI();
      
      showToast(`Se habilitaron ${action.players.length} jugadores con éxito para la gestión ${action.year}.`, 'success');
      hideConfirmModal();
      
      // Refresh the roster grid to show updated years/categories
      handleRosterSearch();
    }
  } catch (err) {
    console.error("Database writing error:", err);
    showToast(`Error al guardar en Supabase: ${err.message || JSON.stringify(err)}`, 'error');
    resetButtonSpinner();
  }
}

// Handle Roster Search using Supabase SQL RPC (Stored Procedure) for high-performance DISTINCT ON queries
async function handleRosterSearch() {
  const selectedTeamName = elements.rosterTeamInput.value.trim();
  const team = state.teams.find(t => t.nombre.toLowerCase() === selectedTeamName.toLowerCase());
  
  if (!team) {
    showToast(`El club "${selectedTeamName}" no es válido o no está registrado. Elige uno de la lista.`, 'error');
    return;
  }
  
  // Save selected team properties on the element
  elements.rosterSelectedTeamName.textContent = team.nombre;
  elements.rosterSelectedTeamName.dataset.teamId = team.id;
  
  const targetYear = new Date().getFullYear();
  
  // Display loading message in the table body
  elements.rosterTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="no-suggestions" style="text-align: center; padding: 2rem;">
        Cargando nómina histórica desde la base de datos...
      </td>
    </tr>
  `;
  
  // Switch Views to show loading state
  elements.rosterPlaceholder.classList.add('hidden');
  elements.rosterResultsContainer.classList.remove('hidden');
  
  try {
    // 1. Call the Supabase Stored Procedure (RPC) to retrieve the unique latest records for this club
    const { data: records, error } = await supabase
      .rpc('obtener_nomina_historica', { target_equipo_id: team.id });
      
    if (error) throw error;
    
    // 2. Map flat RPC rows to the rosterPlayersList structure expected by the rendering pipeline
    const rosterPlayersList = [];
    records.forEach(row => {
      rosterPlayersList.push({
        player: {
          ci: row.ci,
          nombres: row.nombres,
          apellidos: row.apellidos,
          fecha_nacimiento: row.fecha_nacimiento
        },
        latestRecord: {
          año: row.año,
          categoria_jugador: row.categoria_jugador,
          condicion_pase: row.condicion_pase,
          equipo_id: row.equipo_id,
          equipo_propietario_id: row.equipo_propietario_id
        }
      });
    });
    
    // Sort alphabetically by full name
    rosterPlayersList.sort((a, b) => {
      const nameA = `${a.player.nombres || ''} ${a.player.apellidos || ''}`.trim().toLowerCase();
      const nameB = `${b.player.nombres || ''} ${b.player.apellidos || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Clear table rows before rendering
    elements.rosterTableBody.innerHTML = '';
    
    if (rosterPlayersList.length === 0) {
      elements.rosterTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="no-suggestions" style="text-align: center; padding: 2rem;">
            No se encontraron jugadores históricos en propiedad de este club en la base de datos.
          </td>
        </tr>
      `;
      return;
    }
    
    // Build options for destination teams (loans)
    let teamOptions = `<option value="" disabled selected>Club Destino...</option>`;
    state.teams.forEach(t => {
      if (t.id !== team.id) {
        teamOptions += `<option value="${t.id}">${t.nombre}</option>`;
      }
    });
    
    rosterPlayersList.forEach(item => {
      const p = item.player;
      const rec = item.latestRecord;
      const isTemp = p.ci.startsWith('TEMP-');
      const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${p.ci}.jpg`;
      const isAlreadyActive = rec['año'] >= targetYear;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="roster-cb" data-ci="${p.ci}" ${isAlreadyActive ? 'disabled checked' : ''}>
        </td>
        <td style="text-align: center;">
          <img src="${photoUrl}" class="roster-player-photo" width="32" height="32" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
        </td>
        <td>
          <div class="roster-player-name-container" style="${isAlreadyActive ? 'opacity: 0.7;' : ''}">
            <span class="roster-player-nombres">${p.nombres}</span>
            <span class="roster-player-apellidos">${p.apellidos}</span>
            ${isAlreadyActive ? '<span class="badge" style="background-color: #10b981; color: white; font-size: 6.5pt; padding: 1px 4px; margin-left: 8px; border-radius: 4px; font-weight: bold; opacity: 1 !important; display: inline-block;">Activo</span>' : ''}
          </div>
        </td>
        <td>
          <span style="${isAlreadyActive ? 'opacity: 0.7;' : ''}">${isTemp ? 'Temporal' : p.ci}</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: ${isAlreadyActive ? '#10b981' : 'var(--color-primary)'};">
          ${rec['año']}
        </td>
        <td>
          <select class="roster-cat-select" data-ci="${p.ci}" ${isAlreadyActive ? 'disabled' : ''}>
            <option value="natural" ${rec.categoria_jugador === 'natural' ? 'selected' : ''}>Natural</option>
            <option value="refuerzo" ${rec.categoria_jugador === 'refuerzo' ? 'selected' : ''}>Refuerzo</option>
            <option value="juvenil" ${rec.categoria_jugador === 'juvenil' ? 'selected' : ''}>Juvenil</option>
          </select>
        </td>
        <td>
          <select class="roster-cond-select" data-ci="${p.ci}" ${isAlreadyActive ? 'disabled' : ''}>
            <option value="oficial" ${rec.condicion_pase !== 'prestamo' ? 'selected' : ''}>Oficial</option>
            <option value="prestamo" ${rec.condicion_pase === 'prestamo' ? 'selected' : ''}>Préstamo</option>
          </select>
        </td>
        <td>
          <select class="roster-dest-select ${rec.condicion_pase === 'prestamo' ? '' : 'hidden'}" data-ci="${p.ci}" style="max-width: 150px;" ${isAlreadyActive ? 'disabled' : ''}>
            ${teamOptions}
          </select>
        </td>
      `;
      
      // Connect dynamic show/hide event for loan destination select
      const condSelect = tr.querySelector('.roster-cond-select');
      const destSelect = tr.querySelector('.roster-dest-select');
      
      condSelect.addEventListener('change', (e) => {
        if (e.target.value === 'prestamo') {
          destSelect.classList.remove('hidden');
        } else {
          destSelect.classList.add('hidden');
          destSelect.value = '';
        }
      });
      
      elements.rosterTableBody.appendChild(tr);
    });
    
    // Reset Select All checkbox to unchecked by default
    elements.rosterSelectAll.checked = false;
    
  } catch (err) {
    console.error("Error loading roster:", err);
    showToast(`Error al cargar la nómina: ${err.message}`, 'error');
  }
}

// Handle Roster Save
function handleRosterSave(targetYear) {
  const teamIdVal = elements.rosterSelectedTeamName.dataset.teamId;
  
  if (!teamIdVal) {
    showToast('Por favor selecciona un club primero', 'error');
    return;
  }
  
  const checkedBoxes = elements.rosterTableBody.querySelectorAll('input.roster-cb:checked:not(:disabled)');
  
  if (checkedBoxes.length === 0) {
    showToast('Por favor selecciona al menos un jugador para renovar su nómina.', 'warning');
    return;
  }
  
  const playersToSave = [];
  let validationError = false;
  
  checkedBoxes.forEach(cb => {
    if (validationError) return;
    
    const ci = cb.dataset.ci;
    const player = state.players.find(p => p.ci === ci);
    
    const catSelect = elements.rosterTableBody.querySelector(`select.roster-cat-select[data-ci="${ci}"]`);
    const category = catSelect ? catSelect.value : 'natural';
    
    const condSelect = elements.rosterTableBody.querySelector(`select.roster-cond-select[data-ci="${ci}"]`);
    const condicionPase = condSelect ? condSelect.value : 'oficial';
    
    const destSelect = elements.rosterTableBody.querySelector(`select.roster-dest-select[data-ci="${ci}"]`);
    const destTeamId = destSelect && condicionPase === 'prestamo' ? parseInt(destSelect.value) : null;
    
    if (condicionPase === 'prestamo' && (isNaN(destTeamId) || !destTeamId)) {
      showToast(`Por favor selecciona un club de destino para el jugador ${formatFullName(player)}.`, 'error');
      validationError = true;
      return;
    }
    
    if (player) {
      playersToSave.push({
        ci: ci,
        fullName: formatFullName(player),
        category: category,
        condicionPase: condicionPase,
        destTeamId: destTeamId
      });
    }
  });
  
  if (validationError) return;
  
  state.pendingAction = {
    type: 'roster_renewal',
    teamId: parseInt(teamIdVal),
    teamName: elements.rosterSelectedTeamName.textContent,
    year: targetYear,
    players: playersToSave
  };
  
  elements.confirmSummaryText.innerHTML = `Se habilitará en bloque a <strong>${playersToSave.length} jugadores</strong> en el club <strong>${elements.rosterSelectedTeamName.textContent}</strong> para la gestión deportiva <strong>${targetYear}</strong>.`;
  
  showConfirmModal();
}

let selectedCarnetPlayerObj = null;

// Handle Carnet Search Input and render suggestions
function handleCarnetSearchInput() {
  const rawQuery = elements.searchCarnetPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    elements.searchCarnetSuggestions.innerHTML = '';
    elements.searchCarnetSuggestions.classList.add('hidden');
    
    // Restore appropriate state card
    elements.carnetPreviewContainer.classList.add('hidden');
    elements.carnetPlaceholder.classList.remove('hidden');
    return;
  }
  
  elements.carnetPreviewContainer.classList.add('hidden');
  elements.carnetPlaceholder.classList.add('hidden');
  
  // Search locally
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  elements.searchCarnetSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchCarnetSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores</div>`;
    elements.searchCarnetSuggestions.classList.remove('hidden');
    return;
  }
  
  const topMatches = matches.slice(0, 25);
  
  topMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectCarnetPlayer(player));
    elements.searchCarnetSuggestions.appendChild(item);
  });
  
  elements.searchCarnetSuggestions.classList.remove('hidden');
}

// Clear Carnet Search
function clearCarnetSearch() {
  elements.searchCarnetPlayer.value = '';
  elements.searchCarnetSuggestions.innerHTML = '';
  elements.searchCarnetSuggestions.classList.add('hidden');
  elements.btnClearCarnetSearch.classList.add('hidden');
  
  elements.carnetPreviewContainer.classList.add('hidden');
  elements.carnetPlaceholder.classList.remove('hidden');
  
  selectedCarnetPlayerObj = null;
  elements.searchCarnetPlayer.focus();
}

// Perform Full Carnet Search
function performFullCarnetSearch() {
  const rawQuery = elements.searchCarnetPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    showToast('Ingresa al menos 2 caracteres para buscar', 'warning');
    return;
  }
  
  elements.carnetPreviewContainer.classList.add('hidden');
  elements.carnetPlaceholder.classList.add('hidden');
  
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  elements.searchCarnetSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchCarnetSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores para "${rawQuery}"</div>`;
    elements.searchCarnetSuggestions.classList.remove('hidden');
    return;
  }
  
  const header = document.createElement('div');
  header.className = 'suggestions-header';
  header.textContent = `Resultados de búsqueda: ${matches.length} encontrados`;
  elements.searchCarnetSuggestions.appendChild(header);
  
  const displayMatches = matches.slice(0, 100);
  
  displayMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectCarnetPlayer(player));
    elements.searchCarnetSuggestions.appendChild(item);
  });
  
  elements.searchCarnetSuggestions.classList.remove('hidden');
}

// Select Player and Render Carnet Preview
function selectCarnetPlayer(player) {
  selectedCarnetPlayerObj = player;
  elements.searchCarnetSuggestions.classList.add('hidden');
  elements.searchCarnetPlayer.value = formatFullName(player);
  elements.btnClearCarnetSearch.classList.remove('hidden');

  renderCarnetPreview(player);

  // Show Card & Hide Placeholder
  elements.carnetPlaceholder.classList.add('hidden');
  elements.carnetPreviewContainer.classList.remove('hidden');
}

function saveCarnetQueue() {
  localStorage.setItem('vinto_carnet_queue', JSON.stringify(state.carnetQueue));
}

function updateCarnetQueueUI() {
  if (!elements.carnetQueueSummary) return;
  const validQueue = state.carnetQueue.filter(ci => getPlayerByCi(ci));
  if (validQueue.length !== state.carnetQueue.length) {
    state.carnetQueue = validQueue;
    saveCarnetQueue();
  }

  const count = state.carnetQueue.length;
  elements.carnetQueueSummary.textContent = count === 0
    ? 'No hay carnets en cola.'
    : `${count} carnet${count === 1 ? '' : 's'} listo${count === 1 ? '' : 's'} para generar PDF.`;
  elements.btnGenerateQueuePdf.disabled = count === 0;
  elements.btnClearCarnetQueue.disabled = count === 0;
}

function addSelectedCarnetToQueue() {
  if (!selectedCarnetPlayerObj) {
    showToast('Por favor selecciona un jugador primero', 'error');
    return;
  }

  if (state.carnetQueue.includes(selectedCarnetPlayerObj.ci)) {
    showToast('Este carnet ya está en la cola de impresión', 'info');
    return;
  }

  state.carnetQueue.push(selectedCarnetPlayerObj.ci);
  saveCarnetQueue();
  updateCarnetQueueUI();
  showToast(`Carnet de ${formatFullName(selectedCarnetPlayerObj)} agregado a la cola`, 'success');
}

function clearCarnetQueueList() {
  state.carnetQueue = [];
  saveCarnetQueue();
  updateCarnetQueueUI();
  showToast('Cola de impresión limpiada', 'info');
}

let currentCarnetTeamPlayers = [];

function handleCarnetTeamSearch() {
  const selectedTeamName = elements.carnetTeamInput.value.trim();
  const team = state.teams.find(t => t.nombre.toLowerCase() === selectedTeamName.toLowerCase());

  if (!team) {
    showToast(`El club "${selectedTeamName}" no es válido o no está registrado. Elige uno de la lista.`, 'error');
    return;
  }

  const targetYear = getCurrentYear();
  const enabledRecords = state.history.filter(h =>
    Number(h.equipo_id) === Number(team.id) && Number(h['año']) === Number(targetYear)
  );

  const uniqueCis = [...new Set(enabledRecords.map(h => h.jugador_ci))];
  currentCarnetTeamPlayers = uniqueCis
    .map(ci => getPlayerByCi(ci))
    .filter(Boolean)
    .sort((a, b) => formatFullName(a).localeCompare(formatFullName(b)));

  elements.carnetTeamSelectedName.textContent = `${team.nombre} (${targetYear})`;
  elements.carnetTeamResults.classList.remove('hidden');
  elements.carnetTeamSelectAll.checked = true;
  elements.carnetTeamTableBody.innerHTML = '';

  if (currentCarnetTeamPlayers.length === 0) {
    elements.carnetTeamTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="no-suggestions" style="text-align: center; padding: 1rem;">
          No se encontraron jugadores habilitados para este equipo en la gestión ${targetYear}.
        </td>
      </tr>
    `;
    return;
  }

  currentCarnetTeamPlayers.forEach(player => {
    const tr = document.createElement('tr');
    const isTemp = player.ci.startsWith('TEMP-');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="carnet-team-cb" data-ci="${escapeHtml(player.ci)}" checked>
      </td>
      <td>
        <div class="roster-player-name-container">
          <span class="roster-player-nombres">${escapeHtml(player.nombres)}</span>
          <span class="roster-player-apellidos">${escapeHtml(player.apellidos)}</span>
        </div>
      </td>
      <td>${isTemp ? 'Temporal' : escapeHtml(player.ci)}</td>
    `;
    elements.carnetTeamTableBody.appendChild(tr);
  });
}

function getSelectedTeamCarnetPlayers() {
  const checkedBoxes = elements.carnetTeamTableBody.querySelectorAll('input.carnet-team-cb:checked');
  const selectedCis = [...checkedBoxes].map(cb => cb.dataset.ci);
  return selectedCis
    .map(ci => currentCarnetTeamPlayers.find(player => player.ci === ci))
    .filter(Boolean);
}

async function handleGenerateTeamCarnetsPdf() {
  const players = getSelectedTeamCarnetPlayers();
  if (players.length === 0) {
    showToast('Selecciona al menos un jugador para generar el PDF', 'warning');
    return;
  }

  await generateCarnetsPdf(players, `carnets-${elements.carnetTeamSelectedName.textContent}`);
}

async function handleGenerateQueuePdf() {
  const players = state.carnetQueue.map(ci => getPlayerByCi(ci)).filter(Boolean);
  if (players.length === 0) {
    showToast('No hay carnets válidos en la cola', 'warning');
    clearCarnetQueueList();
    return;
  }

  await generateCarnetsPdf(players, 'carnets-cola-impresion');
}

function buildPdfPage(players) {
  const page = document.createElement('div');
  page.className = 'pdf-letter-page';

  players.forEach(player => {
    const carnet = buildCarnetHtml(player);
    const row = document.createElement('div');
    row.className = 'pdf-carnet-row';
    row.innerHTML = `
      <div class="carnet-side carnet-front ${carnet.catClass}">${carnet.anversoHtml}</div>
      <div class="carnet-side carnet-back ${carnet.catClass}">${carnet.reversoHtml}</div>
    `;
    page.appendChild(row);
  });

  return page;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function waitForImages(container) {
  const images = [...container.querySelectorAll('img')];
  return Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

async function generateCarnetsPdf(players, fileNameBase) {
  const cleanPlayers = players.filter(Boolean);
  if (cleanPlayers.length === 0) return;

  const previousTeamBtnState = elements.btnGenerateTeamCarnetsPdf.disabled;
  const previousQueueBtnState = elements.btnGenerateQueuePdf.disabled;
  elements.btnGenerateTeamCarnetsPdf.disabled = true;
  elements.btnGenerateQueuePdf.disabled = true;
  showToast(`Preparando PDF con ${cleanPlayers.length} carnet${cleanPlayers.length === 1 ? '' : 's'}...`, 'info');

  try {
    const pageGroups = chunkArray(cleanPlayers, 5);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = 215.9;
    const pageHeight = 279.4;

    for (let i = 0; i < pageGroups.length; i++) {
      elements.pdfRenderArea.innerHTML = '';
      const page = buildPdfPage(pageGroups[i]);
      elements.pdfRenderArea.appendChild(page);
      await waitForImages(page);

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      if (i > 0) pdf.addPage('letter', 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    pdf.save(`${sanitizeFileName(fileNameBase)}.pdf`);
    showToast('PDF generado correctamente', 'success');
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast(`Error al generar PDF: ${err.message}`, 'error');
  } finally {
    elements.pdfRenderArea.innerHTML = '';
    elements.btnGenerateTeamCarnetsPdf.disabled = previousTeamBtnState;
    elements.btnGenerateQueuePdf.disabled = previousQueueBtnState || state.carnetQueue.length === 0;
  }
}

// Handle Print Carnet
function handlePrintCarnet() {
  if (!selectedCarnetPlayerObj) {
    showToast('Por favor selecciona un jugador primero', 'error');
    return;
  }
  
  // Copy content from preview to print container
  const printAnverso = elements.carnetAnverso.cloneNode(true);
  const printReverso = elements.carnetReverso.cloneNode(true);
  
  elements.printSection.innerHTML = '';
  elements.printSection.appendChild(printAnverso);
  elements.printSection.appendChild(printReverso);
  
  // Trigger system print dialogue
  window.print();
}

let selectedAdvancedPlayerObj = null;
let pendingAdvancedAction = null;

// Handle Advanced Search Input and render suggestions
function handleAdvancedSearchInput() {
  const rawQuery = elements.searchAdvancedPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    elements.searchAdvancedSuggestions.innerHTML = '';
    elements.searchAdvancedSuggestions.classList.add('hidden');
    
    // Restore appropriate state card
    if (selectedAdvancedPlayerObj) {
      elements.advancedProfileContainer.classList.remove('hidden');
      elements.advancedPlaceholder.classList.add('hidden');
    } else {
      elements.advancedProfileContainer.classList.add('hidden');
      elements.advancedPlaceholder.classList.remove('hidden');
    }
    return;
  }
  
  elements.advancedProfileContainer.classList.add('hidden');
  elements.advancedPlaceholder.classList.add('hidden');
  
  // Search locally
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  elements.searchAdvancedSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchAdvancedSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores</div>`;
    elements.searchAdvancedSuggestions.classList.remove('hidden');
    return;
  }
  
  const topMatches = matches.slice(0, 25);
  
  topMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectAdvancedPlayer(player));
    elements.searchAdvancedSuggestions.appendChild(item);
  });
  
  elements.searchAdvancedSuggestions.classList.remove('hidden');
}

// Clear Advanced Search
function clearAdvancedSearch() {
  elements.searchAdvancedPlayer.value = '';
  elements.searchAdvancedSuggestions.innerHTML = '';
  elements.searchAdvancedSuggestions.classList.add('hidden');
  elements.btnClearAdvancedSearch.classList.add('hidden');
  
  elements.advancedProfileContainer.classList.add('hidden');
  elements.advancedPlaceholder.classList.remove('hidden');
  
  selectedAdvancedPlayerObj = null;
  elements.formAdvancedEdit.reset();
  elements.searchAdvancedPlayer.focus();
}

// Perform Full Advanced Search
function performFullAdvancedSearch() {
  const rawQuery = elements.searchAdvancedPlayer.value.trim();
  const query = normalizeString(rawQuery);
  
  if (query.length < 2) {
    showToast('Ingresa al menos 2 caracteres para buscar', 'warning');
    return;
  }
  
  elements.advancedProfileContainer.classList.add('hidden');
  elements.advancedPlaceholder.classList.add('hidden');
  
  const matches = state.players.filter(player => {
    const nameMatch = normalizeString(player.nombres).includes(query);
    const surnameMatch = normalizeString(player.apellidos).includes(query);
    const ciMatch = player.ci.toLowerCase().includes(query);
    return nameMatch || surnameMatch || ciMatch;
  });
  
  elements.searchAdvancedSuggestions.innerHTML = '';
  
  if (matches.length === 0) {
    elements.searchAdvancedSuggestions.innerHTML = `<div class="no-suggestions">No se encontraron jugadores para "${rawQuery}"</div>`;
    elements.searchAdvancedSuggestions.classList.remove('hidden');
    return;
  }
  
  const header = document.createElement('div');
  header.className = 'suggestions-header';
  header.textContent = `Resultados de búsqueda: ${matches.length} encontrados`;
  elements.searchAdvancedSuggestions.appendChild(header);
  
  const displayMatches = matches.slice(0, 100);
  
  displayMatches.forEach((player) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.ci = player.ci;
    
    const isTemp = player.ci.startsWith('TEMP-');
    const badgeHtml = isTemp ? `<span class="badge badge-temp">Temp</span>` : `<span class="badge">CI: ${player.ci}</span>`;
    const photoUrl = isTemp ? DEFAULT_PHOTO : `${SUPABASE_URL}/storage/v1/object/public/fotos_jugadores/${player.ci}.jpg`;
    
    const rawFullName = formatFullName(player);
    const highlightedName = highlightText(rawFullName, rawQuery);
    
    item.innerHTML = `
      <img src="${photoUrl}" class="suggestion-photo" width="28" height="28" onerror="this.onerror=null; this.src='${DEFAULT_PHOTO}'">
      <div class="suggestion-info">
        <span class="suggestion-name">${highlightedName}</span>
        <span>${badgeHtml}</span>
      </div>
    `;
    
    item.addEventListener('click', () => selectAdvancedPlayer(player));
    elements.searchAdvancedSuggestions.appendChild(item);
  });
  
  elements.searchAdvancedSuggestions.classList.remove('hidden');
}

// Select Player for Advanced Management
function selectAdvancedPlayer(player) {
  selectedAdvancedPlayerObj = player;
  elements.searchAdvancedSuggestions.classList.add('hidden');
  elements.searchAdvancedPlayer.value = formatFullName(player);
  elements.btnClearAdvancedSearch.classList.remove('hidden');
  
  // Fill inputs
  elements.advancedNombres.value = player.nombres || '';
  elements.advancedApellidos.value = player.apellidos || '';
  elements.advancedCI.value = player.ci || '';
  elements.advancedBirthdate.value = player.fecha_nacimiento || '';
  
  // Show profile form
  elements.advancedPlaceholder.classList.add('hidden');
  elements.advancedProfileContainer.classList.remove('hidden');
}

// Hide Advanced Modal
function hideAdvancedConfirmModal() {
  elements.advancedConfirmModal.classList.add('hidden');
  elements.advancedConfirmPassword.value = '';
  elements.advancedConfirmPasswordError.classList.add('hidden');
  pendingAdvancedAction = null;
  
  // Reset confirm button spinner & text
  const btnText = elements.btnAdvancedModalConfirm.querySelector('.btn-text');
  const spinner = elements.btnAdvancedModalConfirm.querySelector('.btn-spinner');
  btnText.textContent = 'Confirmar y Aplicar';
  spinner.classList.add('hidden');
  elements.btnAdvancedModalConfirm.disabled = false;
  elements.btnAdvancedModalCancel.disabled = false;
}

// Handle advanced edit submit (Save Changes)
function handleAdvancedEditSubmit(e) {
  e.preventDefault();
  
  if (!selectedAdvancedPlayerObj) {
    showToast('Por favor selecciona un jugador primero', 'error');
    return;
  }
  
  const nombres = elements.advancedNombres.value.trim().toUpperCase();
  const apellidos = elements.advancedApellidos.value.trim().toUpperCase();
  const ci = elements.advancedCI.value.trim();
  const birthdate = elements.advancedBirthdate.value || null;
  
  if (!nombres || !apellidos || !ci) {
    showToast('Los campos de Nombres, Apellidos y C.I. son obligatorios', 'warning');
    return;
  }
  
  // Verify changes
  const hasChanges = nombres !== selectedAdvancedPlayerObj.nombres || 
                     apellidos !== selectedAdvancedPlayerObj.apellidos || 
                     ci !== selectedAdvancedPlayerObj.ci || 
                     birthdate !== selectedAdvancedPlayerObj.fecha_nacimiento;
                     
  if (!hasChanges) {
    showToast('No has realizado ningún cambio en los campos', 'info');
    return;
  }

  // If CI changed, verify the new CI is not already used by another player
  if (ci !== selectedAdvancedPlayerObj.ci) {
    const duplicate = state.players.find(p => p.ci === ci);
    if (duplicate) {
      showToast(`Error: Ya existe otro jugador registrado con el C.I. ${ci} (${formatFullName(duplicate)}).`, 'error');
      return;
    }
  }
  
  // Prepare Summary
  let summaryHtml = '<ul style="list-style-type: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">';
  if (nombres !== selectedAdvancedPlayerObj.nombres) {
    summaryHtml += `<li><strong>Nombres:</strong> <del style="color: var(--color-danger);">${selectedAdvancedPlayerObj.nombres}</del> ➡️ <ins style="color: var(--color-success); text-decoration: none;">${nombres}</ins></li>`;
  }
  if (apellidos !== selectedAdvancedPlayerObj.apellidos) {
    summaryHtml += `<li><strong>Apellidos:</strong> <del style="color: var(--color-danger);">${selectedAdvancedPlayerObj.apellidos}</del> ➡️ <ins style="color: var(--color-success); text-decoration: none;">${apellidos}</ins></li>`;
  }
  if (ci !== selectedAdvancedPlayerObj.ci) {
    summaryHtml += `<li><strong>C.I.:</strong> <del style="color: var(--color-danger);">${selectedAdvancedPlayerObj.ci}</del> ➡️ <ins style="color: var(--color-success); text-decoration: none;">${ci}</ins></li>`;
  }
  if (birthdate !== selectedAdvancedPlayerObj.fecha_nacimiento) {
    summaryHtml += `<li><strong>Nacimiento:</strong> <del style="color: var(--color-danger);">${formatDate(selectedAdvancedPlayerObj.fecha_nacimiento)}</del> ➡️ <ins style="color: var(--color-success); text-decoration: none;">${formatDate(birthdate)}</ins></li>`;
  }
  summaryHtml += '</ul>';
  
  pendingAdvancedAction = {
    type: 'edit',
    player: selectedAdvancedPlayerObj,
    newData: { nombres, apellidos, ci, fecha_nacimiento: birthdate }
  };
  
  elements.advancedModalTitle.textContent = 'Confirmar Modificación de Jugador';
  elements.advancedModalWarningText.textContent = 'Esta acción modificará de forma permanente los datos del jugador en la base de datos central.';
  elements.advancedModalSummaryText.innerHTML = summaryHtml;
  
  elements.advancedConfirmModal.classList.remove('hidden');
  elements.advancedConfirmPassword.focus();
}

// Handle Advanced Delete Click
function handleAdvancedDeleteClick() {
  if (!selectedAdvancedPlayerObj) {
    showToast('Por favor selecciona un jugador primero', 'error');
    return;
  }
  
  const summaryHtml = `
    <div style="font-weight: bold; color: var(--color-danger);">
      Jugador: ${formatFullName(selectedAdvancedPlayerObj)} <br>
      C.I.: ${selectedAdvancedPlayerObj.ci}
    </div>
    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
      Se eliminarán en cascada todos sus registros de participación en la tabla 'historial_participacion'.
    </div>
  `;
  
  pendingAdvancedAction = {
    type: 'delete',
    player: selectedAdvancedPlayerObj
  };
  
  elements.advancedModalTitle.textContent = 'Confirmar Eliminación de Jugador';
  elements.advancedModalWarningText.textContent = '¡ADVERTENCIA CRÍTICA! Esta acción es COMPLETAMENTE IRREVERSIBLE. Se borrarán todos los datos del jugador y su historial de participación.';
  elements.advancedModalSummaryText.innerHTML = summaryHtml;
  
  elements.advancedConfirmModal.classList.remove('hidden');
  elements.advancedConfirmPassword.focus();
}

// Execute Pending Advanced Action
async function executePendingAdvancedAction() {
  if (!pendingAdvancedAction) return;
  
  // Verify Admin password
  const password = elements.advancedConfirmPassword.value;
  if (password !== 'matricula2026') {
    elements.advancedConfirmPasswordError.classList.remove('hidden');
    elements.advancedConfirmPassword.focus();
    return;
  }
  
  // Hide password error if any
  elements.advancedConfirmPasswordError.classList.add('hidden');
  
  // Show spinner
  const btnText = elements.btnAdvancedModalConfirm.querySelector('.btn-text');
  const spinner = elements.btnAdvancedModalConfirm.querySelector('.btn-spinner');
  btnText.textContent = 'Aplicando...';
  spinner.classList.remove('hidden');
  elements.btnAdvancedModalConfirm.disabled = true;
  elements.btnAdvancedModalCancel.disabled = true;
  
  try {
    if (pendingAdvancedAction.type === 'edit') {
      const oldCi = pendingAdvancedAction.player.ci;
      const { nombres, apellidos, ci: newCi, fecha_nacimiento } = pendingAdvancedAction.newData;
      
      if (oldCi === newCi) {
        // Simple update
        const { error } = await supabase
          .from('jugadores')
          .update({ nombres, apellidos, fecha_nacimiento })
          .eq('ci', oldCi);
          
        if (error) throw error;
        
        // Update local cache
        const index = state.players.findIndex(p => p.ci === oldCi);
        if (index !== -1) {
          state.players[index].nombres = nombres;
          state.players[index].apellidos = apellidos;
          state.players[index].fecha_nacimiento = fecha_nacimiento;
        }
      } else {
        // Cascade manually: Create new, Update history, Delete old
        // 1. Insert new player
        const { error: insertError } = await supabase
          .from('jugadores')
          .insert({ ci: newCi, nombres, apellidos, fecha_nacimiento });
          
        if (insertError) throw insertError;
        
        // 2. Update history records
        const { error: historyError } = await supabase
          .from('historial_participacion')
          .update({ jugador_ci: newCi })
          .eq('jugador_ci', oldCi);
          
        if (historyError) throw historyError;
        
        // 3. Delete old player record
        const { error: deleteError } = await supabase
          .from('jugadores')
          .delete()
          .eq('ci', oldCi);
          
        if (deleteError) throw deleteError;
        
        // Update local cache
        const index = state.players.findIndex(p => p.ci === oldCi);
        if (index !== -1) {
          state.players[index] = { ci: newCi, nombres, apellidos, fecha_nacimiento };
        }
        
        state.history.forEach(h => {
          if (h.jugador_ci === oldCi) {
            h.jugador_ci = newCi;
          }
        });
      }
      
      // Save local cache
      localStorage.setItem('vinto_players', JSON.stringify(state.players));
      localStorage.setItem('vinto_history', JSON.stringify(state.history));
      
      showToast('Datos del jugador modificados con éxito', 'success');
      
    } else if (pendingAdvancedAction.type === 'delete') {
      const ci = pendingAdvancedAction.player.ci;
      
      // Delete ordered: first history, then player
      const { error: historyError } = await supabase
        .from('historial_participacion')
        .delete()
        .eq('jugador_ci', ci);
        
      if (historyError) throw historyError;
      
      const { error: playerError } = await supabase
        .from('jugadores')
        .delete()
        .eq('ci', ci);
        
      if (playerError) throw playerError;
      
      // Update local cache
      state.players = state.players.filter(p => p.ci !== ci);
      state.history = state.history.filter(h => h.jugador_ci !== ci);
      
      localStorage.setItem('vinto_players', JSON.stringify(state.players));
      localStorage.setItem('vinto_history', JSON.stringify(state.history));
      
      showToast('Jugador y su historial deportivo eliminados de la base de datos', 'success');
    }
    
    // Refresh Stats UI
    updateStatsUI();
    
    // Clear Advanced Panel Search and close modal
    clearAdvancedSearch();
    hideAdvancedConfirmModal();
    
  } catch (err) {
    console.error("Advanced administrative action failed:", err);
    showToast(`Error al procesar la operación: ${err.message}`, 'error');
    
    // Reset confirmation button
    btnText.textContent = 'Confirmar y Aplicar';
    spinner.classList.add('hidden');
    elements.btnAdvancedModalConfirm.disabled = false;
    elements.btnAdvancedModalCancel.disabled = false;
  }
}

// Start Application with Authentication Gating
// Start Application with Gating
function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('vinto_auth') === 'true';
  const appContainer = document.querySelector('.app-container');
  const loginContainer = document.getElementById('login-container');
  
  if (isAuthenticated) {
    if (loginContainer) loginContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    
    // Set up logout button event listener
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('vinto_auth');
        window.location.reload();
      });
    }
    
    initApp();
  } else {
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');
        
        if (email === 'matricula@ligadefutbolvinto.com' && password === 'matricula2026') {
          sessionStorage.setItem('vinto_auth', 'true');
          loginContainer.classList.add('hidden');
          appContainer.classList.remove('hidden');
          
          // Set up logout button event listener
          const btnLogout = document.getElementById('btn-logout');
          if (btnLogout) {
            btnLogout.addEventListener('click', () => {
              sessionStorage.removeItem('vinto_auth');
              window.location.reload();
            });
          }
          
          initApp();
        } else {
          if (errorMsg) errorMsg.classList.remove('hidden');
        }
      });
    }
  }
}

checkAuth();

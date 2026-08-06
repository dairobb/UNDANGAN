'use strict';

/* ================================================================
   CONFIG — edit everything in this block for your own wedding.
   ================================================================ */
const CONFIG = {
  // Paste the Web App URL you get after deploying Code.gs (see README).
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxqQ_q3Y7wTbmi29BFGvcLwij6zu1g9ZYhB7w2w9GnYgEhhtTBq0r21GzAa42Bpjuvt5Q/exec',

  EVENTS: {
    akad: {
      label: 'Akad Nikah',
      dateISO: '2026-11-14T08:00:00+07:00',
      endISO: '2026-11-14T10:00:00+07:00',
      venue: 'Kediaman Mempelai Wanita',
      address: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    },
    resepsi: {
      label: 'Resepsi Pernikahan',
      dateISO: '2026-11-14T11:00:00+07:00',
      endISO: '2026-11-14T14:00:00+07:00',
      venue: 'Graha Pratama Ballroom',
      address: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    },
  },

  // Which event the hero countdown/date counts down to: 'akad' or 'resepsi'.
  COUNTDOWN_TARGET: 'akad',

  // Which event's address feeds the Google Maps embed below the event cards.
  MAP_TARGET: 'resepsi',
};

/**
 * Builds a direct-view Google Drive image URL from a file ID.
 * Get the ID from a Drive share link: .../d/FILE_ID/view
 * Usage: driveImage('1AbCdEfGhIjKlMnOpQrSt')
 */
function driveImage(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initCover();
  renderEventDetails();
  initCountdown();
  initRevealOnScroll();
  initGallery();
  initRSVPForm();
  loadGuestbook();
  initMusicToggle();
});

/* ================================================================
   COVER — guest-name personalization + open animation
   ================================================================ */
function initCover() {
  const cover = document.getElementById('cover');
  const openBtn = document.getElementById('open-invitation');
  const guestNameEl = document.getElementById('guest-name');
  const main = document.getElementById('main-content');

  const params = new URLSearchParams(window.location.search);
  const guest = params.get('to');
  if (guest) guestNameEl.textContent = decodeURIComponent(guest).replace(/\+/g, ' ');

  document.body.classList.add('no-scroll');
  if (main) main.setAttribute('inert', '');

  openBtn.addEventListener('click', () => {
    cover.classList.add('is-open');
    document.body.classList.remove('no-scroll');
    if (main) main.removeAttribute('inert');

    const music = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    if (music && music.querySelector('source').getAttribute('src') && !music.querySelector('source').src.includes('PASTE_YOUR_MUSIC')) {
      music.play().then(() => musicToggle.classList.add('is-playing')).catch(() => {});
      musicToggle.setAttribute('aria-pressed', 'true');
    }

    setTimeout(() => cover.setAttribute('hidden', ''), 950);
  });
}

/* ================================================================
   EVENT DETAILS — single source of truth from CONFIG
   ================================================================ */
function formatEventDateTime(startISO, endISO) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const dayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
  let out = `${dayFmt.format(start)} · ${timeFmt.format(start)}`;
  if (end) out += ` – ${timeFmt.format(end)} WIB`;
  else out += ' WIB';
  return out;
}

function buildGoogleCalendarUrl(evt) {
  const toGCalDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = toGCalDate(evt.dateISO);
  const end = toGCalDate(evt.endISO || evt.dateISO);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${evt.label} — Achmad & Indah`,
    dates: `${start}/${end}`,
    location: evt.address,
    details: `${evt.label} Achmad Dairobbi & Indah Ambarwati`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildDirectionsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

function renderEventDetails() {
  ['akad', 'resepsi'].forEach((key) => {
    const evt = CONFIG.EVENTS[key];
    if (!evt) return;
    const dtEl = document.getElementById(`${key}-datetime`);
    const venueEl = document.getElementById(`${key}-venue`);
    const addrEl = document.getElementById(`${key}-address`);
    const calEl = document.getElementById(`${key}-calendar`);
    const dirEl = document.getElementById(`${key}-directions`);
    if (dtEl) dtEl.textContent = formatEventDateTime(evt.dateISO, evt.endISO);
    if (venueEl) venueEl.textContent = evt.venue;
    if (addrEl) addrEl.textContent = evt.address;
    if (calEl) calEl.href = buildGoogleCalendarUrl(evt);
    if (dirEl) dirEl.href = buildDirectionsUrl(evt.address);
  });

  const heroDateEl = document.getElementById('hero-date');
  const target = CONFIG.EVENTS[CONFIG.COUNTDOWN_TARGET] || CONFIG.EVENTS.akad;
  if (heroDateEl) {
    const d = new Date(target.dateISO);
    const pad = (n) => String(n).padStart(2, '0');
    heroDateEl.textContent = `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${d.getFullYear()}`;
  }

  const mapEl = document.getElementById('map-embed');
  const mapEvt = CONFIG.EVENTS[CONFIG.MAP_TARGET] || CONFIG.EVENTS.resepsi;
  if (mapEl && mapEvt) {
    mapEl.src = `https://www.google.com/maps?q=${encodeURIComponent(mapEvt.address)}&output=embed`;
  }
}

/* ================================================================
   COUNTDOWN
   ================================================================ */
function initCountdown() {
  const target = CONFIG.EVENTS[CONFIG.COUNTDOWN_TARGET] || CONFIG.EVENTS.akad;
  const targetDate = new Date(target.dateISO).getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  if (!daysEl) return;

  const pad = (n) => String(Math.max(n, 0)).padStart(2, '0');

  function tick() {
    const diff = targetDate - Date.now();
    if (diff <= 0) {
      daysEl.textContent = hoursEl.textContent = minsEl.textContent = secsEl.textContent = '00';
      clearInterval(intervalId);
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  tick();
  const intervalId = setInterval(tick, 1000);
}

/* ================================================================
   REVEAL ON SCROLL
   ================================================================ */
function initRevealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  items.forEach((el) => observer.observe(el));
}

/* ================================================================
   GALLERY LIGHTBOX
   ================================================================ */
function initGallery() {
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  if (!items.length || !lightbox) return;

  let currentIndex = 0;
  let lastFocused = null;

  function open(index) {
    currentIndex = index;
    const item = items[currentIndex];
    imgEl.src = item.dataset.full || item.querySelector('img').src;
    imgEl.alt = item.querySelector('img').alt || '';
    lastFocused = document.activeElement;
    lightbox.removeAttribute('hidden');
    closeBtn.focus();
    document.body.classList.add('no-scroll');
  }

  function close() {
    lightbox.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  }

  function show(delta) {
    currentIndex = (currentIndex + delta + items.length) % items.length;
    const item = items[currentIndex];
    imgEl.src = item.dataset.full || item.querySelector('img').src;
    imgEl.alt = item.querySelector('img').alt || '';
  }

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(-1));
  nextBtn.addEventListener('click', () => show(1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hasAttribute('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
  });
}

/* ================================================================
   RSVP FORM
   ================================================================ */
function initRSVPForm() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const submitBtn = document.getElementById('rsvp-submit');
  const statusEl = document.getElementById('rsvp-status');
  const guestsField = document.getElementById('guests-field');
  const guestsInput = document.getElementById('rsvp-guests');
  const minusBtn = document.getElementById('guests-minus');
  const plusBtn = document.getElementById('guests-plus');
  const attendanceRadios = form.querySelectorAll('input[name="attendance"]');

  function syncGuestsVisibility() {
    const selected = form.querySelector('input[name="attendance"]:checked');
    const isAttending = selected && selected.value === 'hadir';
    guestsField.classList.toggle('is-hidden', !isAttending);
  }
  attendanceRadios.forEach((r) => r.addEventListener('change', syncGuestsVisibility));
  syncGuestsVisibility();

  minusBtn.addEventListener('click', () => {
    guestsInput.value = Math.max(1, parseInt(guestsInput.value, 10) - 1);
  });
  plusBtn.addEventListener('click', () => {
    guestsInput.value = Math.min(10, parseInt(guestsInput.value, 10) + 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const selectedAttendance = form.querySelector('input[name="attendance"]:checked').value;
    const payload = {
      name: document.getElementById('rsvp-name').value.trim(),
      attendance: selectedAttendance,
      guests: selectedAttendance === 'hadir' ? parseInt(guestsInput.value, 10) : 0,
      message: document.getElementById('rsvp-message').value.trim(),
    };

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'rsvp-form__status';

    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        // text/plain avoids a CORS preflight against the Apps Script endpoint
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === 'success') {
        statusEl.textContent = data.message || 'Terima kasih atas konfirmasi Anda!';
        statusEl.classList.add('is-success');
        prependWish(payload);
        form.reset();
        syncGuestsVisibility();
        guestsInput.value = 1;
        setTimeout(loadGuestbook, 1200);
      } else {
        throw new Error(data.message || 'Terjadi kesalahan, silakan coba lagi.');
      }
    } catch (err) {
      statusEl.textContent = err.message || 'Gagal mengirim. Periksa koneksi Anda dan coba lagi.';
      statusEl.classList.add('is-error');
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/* ================================================================
   GUESTBOOK
   ================================================================ */
function attendanceLabel(value) {
  return value === 'hadir' ? 'Hadir' : 'Tidak Hadir';
}

function relativeTime(isoString) {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function wishCardHtml(wish) {
  return `
    <article class="wish-card">
      <div class="wish-card__head">
        <span class="wish-card__name">${escapeHtml(wish.name)}</span>
        <span class="wish-card__badge wish-card__badge--${wish.attendance}">${attendanceLabel(wish.attendance)}</span>
      </div>
      ${wish.message ? `<p class="wish-card__message">${escapeHtml(wish.message)}</p>` : ''}
      <p class="wish-card__time">${wish.timestamp ? relativeTime(wish.timestamp) : ''}</p>
    </article>`;
}

function prependWish(payload) {
  const list = document.getElementById('guestbook-list');
  if (!list) return;
  const loading = document.getElementById('guestbook-loading');
  if (loading) loading.remove();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = wishCardHtml({ ...payload, timestamp: new Date().toISOString() });
  list.prepend(wrapper.firstElementChild);
}

async function loadGuestbook() {
  const list = document.getElementById('guestbook-list');
  if (!list) return;

  try {
    const res = await fetch(CONFIG.GAS_URL, { method: 'GET' });
    const data = await res.json();
    if (data.status !== 'success') throw new Error(data.message || 'Gagal memuat ucapan.');

    const wishes = data.data || [];
    if (!wishes.length) {
      list.innerHTML = '<p class="guestbook__empty">Jadilah yang pertama mengirimkan ucapan &amp; doa.</p>';
      return;
    }
    list.innerHTML = wishes.map(wishCardHtml).join('');
  } catch (err) {
    list.innerHTML = '<p class="guestbook__error">Belum dapat memuat ucapan. Pastikan CONFIG.GAS_URL sudah diatur.</p>';
  }
}

/* ================================================================
   BACKGROUND MUSIC TOGGLE
   ================================================================ */
function initMusicToggle() {
  const btn = document.getElementById('music-toggle');
  const audio = document.getElementById('bg-music');
  if (!btn || !audio) return;

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        btn.classList.add('is-playing');
        btn.setAttribute('aria-pressed', 'true');
      }).catch(() => {});
    } else {
      audio.pause();
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

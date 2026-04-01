/**
 * PrairieTest → Google Calendar
 * Content script: reads exam reservations from the PrairieTest homepage
 * and injects an "Add to Google Calendar" button into each reservation row.
 *
 * HTML structure (as of 2026):
 *
 *   <li class="list-group-item">
 *     <div class="row">
 *       <div data-testid="exam">          ← exam title (link or plain text)
 *       <div data-testid="date">          ← <span data-format-date='{"date":"<ISO UTC>"}'>
 *       <div data-testid="location">      ← location text / link
 *       <div class="col-xxl-4 …">         ← "50 min, In-person, …"
 *     </div>
 *   </li>
 */

'use strict';

const PROCESSED_ATTR = 'data-ptgcal-done';

// --------------------------------------------------------------------------
// Duration parsing
// --------------------------------------------------------------------------

/**
 * Parse duration text like "50 min," or "1 h 50 min," into milliseconds.
 * Returns 0 if unparseable.
 */
function parseDurationMs(text) {
  let hours = 0;
  let minutes = 0;

  const hMatch = text.match(/(\d+)\s*h\b/i);
  const mMatch = text.match(/(\d+)\s*min\b/i);

  if (hMatch) hours = parseInt(hMatch[1], 10);
  if (mMatch) minutes = parseInt(mMatch[1], 10);

  return (hours * 60 + minutes) * 60 * 1000;
}

// --------------------------------------------------------------------------
// Google Calendar URL builder
// --------------------------------------------------------------------------

/** Format a Date to GCal local format: YYYYMMDDTHHmmss */
function toGCalLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    '00'
  );
}

function buildCalendarUrl({ title, start, end, location }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGCalLocal(start)}/${toGCalLocal(end)}`,
    details: 'Added via PrairieTest → Google Calendar extension',
  });
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --------------------------------------------------------------------------
// Button creation
// --------------------------------------------------------------------------

const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

function createButton(calUrl) {
  const btn = document.createElement('a');
  btn.href = calUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'ptgcal-btn';
  btn.title = 'Add this exam to Google Calendar';
  btn.innerHTML = `${CALENDAR_ICON} Add to Calendar`;
  return btn;
}

// --------------------------------------------------------------------------
// Main: scan for reservation rows
// --------------------------------------------------------------------------

function processRow(row) {
  if (row.hasAttribute(PROCESSED_ATTR)) return;

  // --- 1. Date / start time ---
  const dateDiv = row.querySelector('[data-testid="date"]');
  if (!dateDiv) return;

  const dateSpan = dateDiv.querySelector('[data-format-date]');
  if (!dateSpan) return;

  let startDate;
  try {
    const json = JSON.parse(dateSpan.getAttribute('data-format-date'));
    startDate = new Date(json.date); // UTC ISO string → local Date
  } catch {
    return;
  }
  if (isNaN(startDate.getTime())) return;

  // --- 2. Duration → end time ---
  // The 4th sibling column has no testid; find it by excluding the known ones.
  const durationDiv = row.querySelector(
    'div:not([data-testid="exam"]):not([data-testid="date"]):not([data-testid="location"])[class*="col-"]'
  );
  const durationMs = durationDiv ? parseDurationMs(durationDiv.textContent) : 0;
  const endDate = new Date(startDate.getTime() + (durationMs || 60 * 60 * 1000));

  // --- 3. Title ---
  const examDiv = row.querySelector('[data-testid="exam"]');
  const title = examDiv ? examDiv.textContent.trim() : 'Reserved Exam';

  // --- 4. Location ---
  const locationDiv = row.querySelector('[data-testid="location"]');
  const location = locationDiv ? locationDiv.textContent.trim().replace(/\s+/g, ' ') : '';

  // --- 5. Build URL and inject button ---
  const calUrl = buildCalendarUrl({ title, start: startDate, end: endDate, location });
  const btn = createButton(calUrl);
  dateDiv.appendChild(btn);

  row.setAttribute(PROCESSED_ATTR, '1');
}

function scan() {
  // Target every .row inside a list-group-item that has a [data-testid="date"] child
  document.querySelectorAll('.list-group-item .row').forEach(processRow);
}

// --------------------------------------------------------------------------
// MutationObserver for dynamic content
// --------------------------------------------------------------------------

let scanTimer = null;
function scheduleScan() {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(scan, 300);
}

const observer = new MutationObserver((mutations) => {
  if (mutations.some((m) => m.addedNodes.length > 0)) scheduleScan();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan on load
scan();

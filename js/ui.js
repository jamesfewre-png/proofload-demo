'use strict';
/* TagRound UI: icons, small components and every screen as a template function. */

const UI = { route: { name: 'home' }, filter: 'all', q: '', typeOpen: false, nv: null, justIssued: false };

/* ---------- icons ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  missing: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
  print: '<path d="M7 8V4h10v4M7 17H4V9h16v8h-3M7 14h10v6H7z"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M5 19h14"/>',
  table: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M10 5v14"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  alert: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
  pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>'
};
const ic = (n, size = 22, sw = 2) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const fmtSecs = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const fmtTime = iso => { const d = new Date(iso); if (isNaN(d)) return ''; const h = d.getHours() % 12 || 12; return h + ':' + String(d.getMinutes()).padStart(2, '0') + (d.getHours() < 12 ? ' am' : ' pm'); };
const RICON = { pass: 'check', fail: 'x', repair: 'wrench', missing: 'missing' };

/* Small pictograms so a long register can be scanned by shape. */
const GLYPHS = {
  chain: '<rect x="2.5" y="8" width="11" height="8" rx="4"/><rect x="10.5" y="8" width="11" height="8" rx="4"/>',
  wire: '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.2 8.2l7.6 7.6"/>',
  web: '<path d="M4 9l11 11M9 4l11 11M4 9l5-5M15 20l5-5"/>',
  round: '<ellipse cx="12" cy="12" rx="4.5" ry="9" transform="rotate(45 12 12)"/>',
  shackle: '<path d="M9.2 15.5v-2.4a5.6 5.6 0 1 1 5.6 0v2.4"/><path d="M5 18h14M19 16.2v3.6"/>',
  hoist: '<rect x="6" y="3" width="12" height="8" rx="2"/><path d="M12 11v4M12 15a2.6 2.6 0 1 0 2.6 2.6"/>',
  clamp: '<path d="M3 5h18M8 5v4l-2 3 3 2M16 5v4l2 3-3 2"/><circle cx="12" cy="18" r="2.5"/>',
  eyebolt: '<circle cx="12" cy="7.5" r="4"/><path d="M12 11.5V21M9 15h6"/>',
  beam: '<path d="M3 7h18v4H3zM12 3v4M7 11v4M17 11v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  hook: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 6.3V11M12 11a4.5 4.5 0 1 0 4.5 4.5"/>',
  harness: '<circle cx="12" cy="4.5" r="2.2"/><path d="M8 9l4 5 4-5M8 9v6l4 6 4-6V9M8 15h8"/>',
  lanyard: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.5 6.5c6 1 1 10 11 11"/>',
  other: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 12h6"/>'
};
const glyph = (type, size = 26) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[type] || GLYPHS.other}</svg>`;
const markSVG = (hex, size = 40) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><path d="M13 4h23v32H13L4 27V13z" fill="${hex}"/><circle cx="13" cy="20" r="3.4" fill="#17212B"/><path d="M21 14h9M21 20h9M21 26h6" stroke="rgba(0,0,0,.35)" stroke-width="2.4" stroke-linecap="round"/></svg>`;

/* ---------- small components ---------- */
function tagChip(key, text, cls = '', pre = '') {
  const t = TAGS[key] || TAGS.yellow;
  return `<span class="tagchip ${cls} ${key === 'yellow' || key === 'white' ? 'is-light' : ''}" style="--c:${t.hex};--on:${t.on}">${pre}${esc(text ?? t.name + ' tag')}</span>`;
}
function badge(result) {
  if (!result) return '<span class="badge todo">To do</span>';
  return `<span class="badge ${result}">${ic(RICON[result], 16, 2.6)}${RESULTS[result].label}</span>`;
}
function segBar(c) {
  const parts = ['pass', 'repair', 'fail', 'missing'].filter(k => c[k]).map(k => `<i class="${k}" style="flex:${c[k]}"></i>`).join('');
  return `<div class="seg" role="img" aria-label="${c.done} of ${c.total} inspected: ${c.pass || 0} pass, ${c.fail || 0} fail, ${c.repair || 0} repair, ${c.missing || 0} not presented">${parts}${c.todo ? `<i style="flex:${c.todo}"></i>` : ''}</div>`;
}
function dueBadge(days) {
  if (days < 0) return `<span class="badge over">Overdue ${plural(-days, 'day')}</span>`;
  if (days === 0) return '<span class="badge over">Due today</span>';
  return `<span class="badge due">Due in ${plural(days, 'day')}</span>`;
}
const wllVal = a => (typeOf(a).wll && String(a.wll).trim()) ? a.wll + ' ' + a.wllUnit : '';
const wllText = a => wllVal(a) ? (typeOf(a).cap ? 'Capacity ' : 'WLL ') + wllVal(a) : '';
const itemSub = a => [typeOf(a).name, wllVal(a), a.desc].filter(Boolean).join(', ');
const field = (label, bind, value, attrs = '') => `<label class="field"><span>${label}</span><input class="input" data-bind="${bind}" value="${esc(value)}" ${attrs}></label>`;
const area = (label, bind, value, attrs = '') => `<label class="field"><span>${label}</span><textarea class="input" data-bind="${bind}" ${attrs}>${esc(value)}</textarea></label>`;
const backBtn = (label = 'Back to items') => `<button class="btn btn-quiet btn-icon only-phone" data-act="panel" data-panel="" aria-label="${label}">${ic('back')}</button>`;

/* ---------- navigation chrome ---------- */
function navItems(r) {
  const dl = dueAssets(), due = dl.length, over = dl.filter(d => d.days < 0).length;
  const cur = (r.name === 'visit' || r.name === 'report') ? 'home' : r.name;
  return [['home', 'Visits', 'clipboard'], ['register', 'Register', 'list'], ['due', 'Due', 'clock'], ['settings', 'Settings', 'sliders']]
    .map(([n, l, i]) => `<button class="tab" data-act="nav" data-to="${n}" ${cur === n ? 'aria-current="page"' : ''}${n === 'due' && due ? ` aria-label="Due, ${due} due within 30 days${over ? ', ' + over + ' overdue' : ''}"` : ''}>${ic(i, 24)}<span>${l}</span>${n === 'due' && due ? `<span class="dot${over ? ' over' : ''}">${due}</span>` : ''}</button>`).join('');
}
const rail = r => `<nav class="rail" aria-label="Main"><div class="mark">${markSVG(TAGS[tagFor(todayISO())].hex)}</div>${navItems(r)}</nav>`;
const tabbar = r => `<nav class="tabbar" aria-label="Main">${navItems(r)}</nav>`;

function shell(r) {
  if (r.name === 'welcome') return viewWelcome();
  const top = ['home', 'register', 'due', 'settings'].includes(r.name) && !(r.name === 'register' && r.assetId);
  const body = r.name === 'visit' ? viewVisit(r) : r.name === 'report' ? viewReport(r) : r.name === 'register' ? viewRegister(r)
    : r.name === 'due' ? viewDue() : r.name === 'settings' ? viewSettings() : viewHome();
  return `<div class="shell ${top ? 'is-top' : ''}">${rail(r)}<main class="stage">${body}</main>${tabbar(r)}</div>`;
}

/* ---------- welcome ---------- */
function viewWelcome() {
  const t = TAGS[tagFor(todayISO())];
  return `<div class="welcome">
    <div class="welcome-side">
      <div class="wordmark">${markSVG(t.hex, 34)}TagRound</div>
      <div><h1>Inspect it. Tag it. Send the report from site.</h1>
      <p>A lifting gear register and inspection report on your phone or tablet. It works with no signal, and your records stay on this device. It records inspections. It does not carry out or certify proof load tests.</p></div>
      <div>${tagChip(tagFor(todayISO()), t.name + ' tag, ' + quarterOf(todayISO()), 'lg')}</div>
    </div>
    <form class="welcome-form" data-form="welcome">
      <h2 style="margin-top:0">Two details and you are ready</h2>
      <label class="field"><span>Your business name, as it should appear on reports</span><input class="input" name="company" autocomplete="organization" required></label>
      <label class="field"><span>Your name</span><input class="input" name="inspector" autocomplete="name" required></label>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Set up TagRound</button>
      <button class="btn btn-secondary btn-block" type="button" data-act="load-demo" style="margin-top:10px">Look around with sample data</button>
      <p class="small muted" style="margin-top:16px">You can add your logo, ABN and contact details later in Settings.</p>
    </form>
  </div>`;
}

/* ---------- home ---------- */
function visitCard(v) {
  const c = client(v.clientId), n = counts(v.id), t = TAGS[v.tag] || TAGS.yellow;
  return `<button class="vcard" style="--c:${t.hex}" data-act="open-visit" data-id="${v.id}">
    <div class="name">${esc(c.name)}</div>
    <div class="meta">${esc([c.site, fmtDate(v.date), t.name + ' tag'].filter(Boolean).join(', '))}</div>
    ${segBar(n)}
    <div class="tally"><span>${n.total ? n.done + ' of ' + n.total + ' inspected' : 'No items yet'}</span>${n.action ? `<span class="act">${n.action} need${n.action === 1 ? 's' : ''} action</span>` : ''}</div>
  </button>`;
}
function issuedRow(v) {
  const c = client(v.clientId), n = counts(v.id);
  return `<div class="row is-plain" role="button" tabindex="0" data-act="open-visit" data-id="${v.id}">
    <span class="grow"><span class="row-id" style="display:block">${esc(v.reportNo)}</span><span class="row-sub" style="display:block">${esc(c.name)}, ${fmtDate(v.date)}</span></span>
    <span class="small muted" style="text-align:right">${plural(n.total, 'item')}${n.action ? `<br><b style="color:var(--fail)">${n.action} action</b>` : ''}</span>
  </div>`;
}
function duePanel() {
  const due = dueAssets(), rep = repairAssets();
  if (!due.length && !rep.length) return '<h2>Coming due</h2><div class="banner note">Nothing is due in the next 30 days.</div>';
  const over = due.filter(d => d.days < 0).length;
  const by = {};
  due.forEach(d => { by[d.a.clientId] = (by[d.a.clientId] || 0) + 1; });
  return `<h2>Coming due</h2><div class="card">
    <h3>${due.length ? plural(due.length, 'item') + ' due within 30 days' : 'Nothing is due in the next 30 days'}</h3>
    ${over ? `<p style="color:var(--fail);font-weight:650">${over} already overdue</p>` : ''}
    ${due.length ? `<ul style="margin:10px 0 14px">${Object.keys(by).map(id => `<li class="qrow"><span>${esc(client(id).name)}</span><b class="d">${by[id]}</b></li>`).join('')}</ul>` : ''}
    ${rep.length ? `<p style="color:#4A5763;margin:10px 0 14px">${rep.length === 1 ? '1 item' : rep.length + ' items'} waiting on repair</p>` : ''}
    <button class="btn btn-secondary btn-block" data-act="nav" data-to="due">See what is due</button>
  </div>`;
}
function backupBanner() {
  const t = backupReminder();
  return t ? `<div class="backupbar"><b>Back up your records</b>Your records are only on this device. Last backup: ${t}.<button class="btn btn-secondary" data-act="backup">${ic('download')}Save a backup file</button></div>` : '';
}
function viewHome() {
  const t = todayISO(), tag = tagFor(t);
  const open = S.visits.filter(v => v.status === 'open');
  const issued = S.visits.filter(v => v.status === 'issued').sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="page">
    <header class="page-head"><div><h1>Visits</h1><p class="sub">${fmtLong(t)}</p></div>${tagChip(tag, TAGS[tag].name + ' tag, ' + quarterOf(t))}</header>
    <div class="page-body" data-scroll="home"><div class="wrap home-grid">
      <div>
        ${backupBanner()}
        <button class="btn btn-primary btn-lg btn-block" data-act="new-visit">${ic('plus')}Start a visit</button>
        ${open.length ? '<h2>In progress</h2>' + open.map(visitCard).join('') : ''}
        ${!S.visits.length ? '<div class="empty" style="margin-top:18px"><b>No visits yet</b>Start a visit, add the gear you inspect, and issue the report before you leave site.</div>' : ''}
        ${issued.length ? '<h2>Issued reports</h2><div class="rows">' + issued.map(issuedRow).join('') + '</div>' : ''}
      </div>
      <aside>${duePanel()}</aside>
    </div></div>
  </div>`;
}

/* ---------- visit: list pane ---------- */
function itemRow(i, r) {
  const a = asset(i.assetId);
  const cur = r.panel === 'item' && r.itemId === i.id;
  return `<div class="row" role="button" tabindex="0" data-act="open-item" data-id="${i.id}" ${cur ? 'aria-current="true"' : ''}>
    <span class="glyph">${glyph(a.type)}</span>
    <span class="grow"><span class="row-id ${a.ident ? '' : 'none'}" style="display:block">${esc(a.ident) || 'No ID yet'}</span><span class="row-sub" style="display:block">${esc(itemSub(a))}</span></span>
    ${i.result ? badge(i.result) : `<button class="quick" data-act="quick-pass" data-id="${i.id}" aria-label="Pass ${esc(itemLabel(a))}">${ic('check', 26, 2.6)}</button>`}
  </div>`;
}
function visitList(v, r) {
  const c = client(v.clientId), n = counts(v.id), L = visitInsps(v.id), f = UI.filter;
  const shown = L.filter(i => f === 'all' || (f === 'todo' && !i.result) || (f === 'action' && (i.result === 'fail' || i.result === 'repair')));
  const fb = (id, label, count) => `<button class="filter" data-act="filter" data-f="${id}" aria-pressed="${f === id}">${label} ${count}</button>`;
  return `<div class="pane-head">
      <div class="bar"><button class="btn btn-quiet btn-icon" data-act="nav" data-to="home" aria-label="Back to visits">${ic('back')}</button>
        <div class="grow"><div class="title">${esc(c.name)}</div></div>
        <button class="btn btn-quiet btn-icon" data-act="panel" data-panel="details" aria-label="Visit details">${ic('more')}</button></div>
      <div class="vmeta"><span>${esc([fmtDate(v.date), c.site].filter(Boolean).join(', '))}</span>${tagChip(v.tag)}</div>
      ${segBar(n)}
      <div class="filters">${fb('all', 'All', n.total)}${fb('todo', 'To do', n.todo)}${fb('action', 'Action', n.action)}</div>
    </div>
    <div class="pane-body" data-scroll="vlist">
      ${shown.length ? '<div class="rows">' + shown.map(i => itemRow(i, r)).join('') + '</div>'
        : L.length ? '<div class="banner note" style="margin-top:8px">Nothing in this view.</div>'
        : '<div class="empty" style="margin-top:8px"><b>No items on this visit yet</b>Add the first piece of gear. After that, "Add another like this" makes short work of a rack of identical items.</div>'}
    </div>
    <div class="pane-foot">
      <button class="btn btn-secondary" data-act="add-item">${ic('plus')}Add item</button>
      <button class="btn btn-primary" data-act="panel" data-panel="issue">Check and issue</button>
    </div>`;
}

/* ---------- visit: detail panels ---------- */
function typeGrid(act, current) {
  return `<div class="typegrid">${TYPES.map(t => `<button class="typebtn" data-act="${act}" data-type="${t.id}" aria-pressed="${current === t.id}"><span class="glyph">${glyph(t.id, 24)}</span>${t.name}</button>`).join('')}</div>`;
}
function pickPanel() {
  return `<div class="pane-head"><div class="bar">${backBtn()}<div class="grow"><div class="title sm">What are you adding?</div></div></div></div>
    <div class="pane-body" data-scroll="pick">${typeGrid('pick-type', '')}</div>`;
}
function nextNoWarnHTML() {
  const t = nextNoWarning(S.settings.prefix, S.settings.nextNo);
  return t ? `<div class="fieldwarn">${ic('alert', 20)}<span>${esc(t)}</span></div>` : '';
}
function identWarn(a, visitId) {
  const d = a && dupIdent(a, visitId); if (!d) return '';
  return `<div class="fieldwarn">${ic('alert', 20)}<span>Another item for this client already has this ID: ${esc(typeOf(d.other).name)}, ${esc(d.where)}. Check the tag before you carry on.</span></div>`;
}
function itemPanel(v, i) {
  const a = asset(i.assetId), t = typeOf(a);
  const bad = i.result === 'fail' || i.result === 'repair';
  const resBtn = k => `<button class="res ${k}" data-act="set-result" data-result="${k}" aria-pressed="${i.result === k}">${ic(RICON[k], 26, 2.6)}<b>${RESULTS[k].label}</b><small>${RESULTS[k].long}</small></button>`;
  const allDefects = [...t.defects, ...i.defects.filter(d => !t.defects.includes(d))];
  const acts = i.actions || [];
  return `<div class="pane-head"><div class="bar">${backBtn('Back to items')}
      <div class="grow"><div class="title sm">${esc(a.ident) || 'New item'}</div></div>
      <button class="btn btn-quiet btn-icon" data-act="del-item" aria-label="Delete this item">${ic('trash')}</button></div></div>
    <div class="pane-body" data-scroll="item">
      <div class="photos">
        ${i.photos.map(p => `<button class="photo" data-act="view-photo" data-photo-id="${p}" aria-label="View photo"><img data-photo="${p}" alt=""></button>`).join('')}
        <button class="addphoto" data-act="take-photo">${ic('camera', 26)}Take photo</button>
        <button class="addphoto" data-act="choose-photo">${ic('image', 26)}Choose</button>
      </div>
      <button class="typeline" data-act="toggle-types" aria-expanded="${UI.typeOpen}"><span class="glyph">${glyph(a.type)}</span><span class="grow">${t.name}<small>Tap to change the type</small></span>${ic('chevron', 20)}</button>
      ${UI.typeOpen ? '<div style="margin:-4px 0 16px">' + typeGrid('set-type', a.type) + '</div>' : ''}
      <label class="field"><span>ID or serial number</span><input class="input input-id" id="identInput" data-bind="a:ident" value="${esc(a.ident)}" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="As stamped or tagged"></label>
      <div id="identWarn" aria-live="polite">${identWarn(a, i.visitId)}</div>

      <div class="section"><span class="label">Result</span><div class="results">${['pass', 'fail', 'repair', 'missing'].map(resBtn).join('')}</div>
        ${i.result === 'missing' ? `<p class="small muted" style="margin:8px 0 0">${i.nextDue ? 'Last due ' + fmtDate(i.nextDue) + '. It stays on the Due list until it is inspected.' : 'No earlier due date on record.'}</p>` : ''}</div>
      ${bad ? `<div class="section"><span class="label">What is wrong</span><div class="chips">${allDefects.map(d => `<button class="chip" data-act="toggle-defect" data-defect="${esc(d)}" aria-pressed="${i.defects.includes(d)}">${esc(d)}</button>`).join('')}</div></div>` : ''}
      ${bad ? `<div class="section acts"><span class="label">What was done with it</span><div class="chips">${ACTIONS[i.result].map(x => `<button class="chip" data-act="toggle-action" data-action="${esc(x)}" aria-pressed="${acts.includes(x)}">${esc(x)}</button>`).join('')}</div>
        ${i.result === 'repair' ? `<label class="check" style="margin-top:12px"><input type="checkbox" data-retest ${i.retest ? 'checked' : ''}><span>Proof load test needed after the repair</span></label>
        <p class="small muted" style="margin:4px 0 0">Ticked for chain slings, chain blocks, lever hoists and lifting beams, where a repair to a load-bearing part calls for a retest. Untick it if the repair does not touch a load-bearing part.</p>` : ''}</div>` : ''}
      ${t.wll ? `<div class="cols-3"><label class="field"><span>${t.cap ? 'Rated capacity' : 'Working load limit'}</span><input class="input d" data-bind="a:wll" value="${esc(a.wll)}" inputmode="decimal" autocomplete="off" placeholder="e.g. 3.2" style="font-size:20px;font-weight:700"></label>
        <div class="field"><span class="label">Unit</span><div class="unit"><button data-act="set-unit" data-unit="t" aria-pressed="${a.wllUnit === 't'}">t</button><button data-act="set-unit" data-unit="kg" aria-pressed="${a.wllUnit === 'kg'}">kg</button></div></div></div>` : ''}
      ${field('Description', 'a:desc', a.desc, `placeholder="${esc(t.hint)}" autocomplete="off"`)}
      <div class="section">${area(bad ? 'Notes on the defect' : 'Notes', 'i:notes', i.notes, 'placeholder="Anything the client should know about this item"')}${voiceArea(i)}</div>
      ${i.result === 'pass' ? `<label class="field"><span>Next inspection due</span><input class="input" type="date" data-bind="i:nextDue" value="${esc(i.nextDue)}"></label>
        <p class="small muted" style="margin:-8px 0 14px">Set from the ${t.months}-month interval for ${TYPE_PLURALS[t.id] || 'this type'} in Settings. Use the manufacturer's recommendation where there is one, otherwise your own judgement and the site's procedure.</p>` : ''}
      <div class="cols">${field('Manufacturer', 'a:make', a.make, 'autocomplete="off"')}${field('Test certificate number', 'a:certNo', a.certNo || '', 'autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="As on the certificate"')}</div>
      <div class="cols">${field('Where it is kept', 'a:location', a.location, 'autocomplete="off" placeholder="Bay 2 rack"')}${field('Standard reference', 'a:std', a.std, 'autocomplete="off"')}</div>
    </div>
    <div class="pane-foot">
      <button class="btn btn-secondary" data-act="add-like">Add another like this</button>
      <button class="btn btn-primary" data-act="panel" data-panel="">Done</button>
    </div>`;
}
/* ---------- voice notes: a recording is evidence, its typed draft is only a draft until the inspector checks it ---------- */
function micInner(secs) {
  return secs == null ? `${ic('mic', 28, 2.2)}<span id="micLabel">Record a voice note</span>` : `<i class="recdot"></i><span id="micLabel">Recording ${fmtSecs(secs)}, tap to stop</span>`;
}
function voiceNote(n) {
  const un = n.status !== 'checked', ready = Voice.state === 'ready';
  const play = `<button class="vplay" data-act="voice-play" data-note="${n.id}" aria-label="Play the recording">${ic('play', 28, 2.4)}</button>`;
  const del = `<button class="btn btn-quiet btn-icon" data-act="voice-del" data-note="${n.id}" aria-label="Delete this voice note">${ic('trash')}</button>`;
  const meta = `<span class="vmeta2"><b class="d">${fmtSecs(n.secs)}</b> ${esc(fmtTime(n.at))}</span>`;
  let body;
  if (!un) body = `<div class="vrow">${play}<span class="grow">${meta}<span class="vstat ok">Checked, added to the notes</span></span>${del}</div>`;
  else {
    const waiting = n.status === 'queued', busy = n.status === 'transcribing';
    const stat = busy ? '<p class="vstat">Writing a draft…</p>'
      : waiting ? (ready ? '<p class="vstat">Waiting to be written…</p>' : '<p class="vstat">Saved. A draft will be written once voice notes are downloaded in Settings. <button class="link" data-act="nav" data-to="settings">Open Settings</button></p>')
      : n.err && !n.text ? `<p class="vstat">${esc(n.err)}</p>` : '';
    body = `<div class="vrow">${play}<span class="grow"><span class="vlabel">Voice draft, check it before issuing</span>${meta}</span>${del}</div>
      ${stat}
      <textarea class="input voicetext" data-voice="${n.id}" rows="3" placeholder="Or type it yourself" aria-label="Voice note text">${esc(n.text)}</textarea>
      ${n.status === 'draft' ? `<button class="btn btn-primary btn-block" data-act="voice-check" data-note="${n.id}" style="margin-top:8px">${ic('check', 22, 2.6)}Add to notes</button>` : ''}`;
  }
  return `<div class="vnote ${un ? 'open' : 'done'}" id="note-${n.id}" data-id="${n.id}" data-status="${n.status}">${body}</div>`;
}
function voiceArea(i) {
  const rec = Voice.rec && Voice.rec.inspId === i.id, err = UI.voiceErr && UI.voiceErr.inspId === i.id ? UI.voiceErr : null;
  return `<div class="voicearea" id="voiceArea">
    <button class="micbtn ${rec ? 'rec' : ''}" id="micBtn" data-act="rec-toggle" aria-pressed="${!!rec}">${micInner(rec ? Voice.rec.secs : null)}</button>
    <div id="voiceMsg">${err ? `<div class="banner stop" role="alert">${ic('alert', 22)}<div>${esc(err.text)}</div></div>` : ''}</div>
    <div id="voiceCards">${(i.voice || []).map(voiceNote).join('')}</div>
  </div>`;
}
function voiceCardInner() {
  const st = Voice.state, p = Voice.pack, mb = p ? Math.round(p.totalBytes / 1e6) : 102, w = Voice.waiting();
  const pct = Voice.total ? Math.min(100, Math.floor(100 * Voice.loaded / Voice.total)) : 0;
  const mbOf = b => (b / 1e6).toFixed(0);
  const status = st === 'ready' ? '<b class="vok">Ready</b>'
    : st === 'downloading' ? `<b>Downloading ${pct}%</b> (${mbOf(Voice.loaded)} of ${mbOf(Voice.total)} MB)`
    : st === 'failed' ? `<b class="vbad">Failed</b>. ${esc(Voice.err)}`
    : '<b>Not downloaded</b>';
  const prot = Voice.persisted === true ? 'This device will keep the voice files unless you remove them.'
    : Voice.persisted === false && (st === "ready" || st === "downloading") ? 'This device may clear the voice files if it runs low on space. If that happens, download them again.' : '';
  const btns = st === 'downloading' ? '<button class="btn btn-secondary" data-act="voice-cancel">Cancel</button>'
    : st === 'ready' ? '<button class="btn btn-danger" data-act="voice-remove">Remove voice files</button>'
    : `<button class="btn btn-primary" data-act="voice-download">${ic('download')}${st === 'failed' ? 'Try again' : 'Download'}</button>`;
  return `<h3>Voice notes</h3><p>Speak a note about an item. The recording is kept as evidence and a draft is written for you to check and fix. It all runs on this device. Nothing is sent anywhere. You still decide every result.</p>
    <p class="vsize">Download about ${mb} MB once, over wifi. Voice notes then work with no signal.</p>
    ${st === 'downloading' ? `<div class="vbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>` : ''}
    <p class="vline">${status}</p>
    ${w ? `<p class="vline">${plural(w, 'voice note')} waiting for a draft.${st === 'ready' ? '' : ' They are written once the download finishes.'}</p>` : ''}
    ${prot ? `<p class="vline small muted">${prot}</p>` : ''}
    <div class="btn-row" style="margin-top:12px">${btns}</div>`;
}
function gateBox(v) {
  const g = gateLines(v), blocks = g.filter(x => x.kind === 'block'), adv = g.filter(x => x.kind === 'advise');
  const li = (x, idx) => {
    const inner = `<span class="n">${ic(x.kind === 'block' ? 'alert' : 'pen', 20)}</span><span>${esc(x.text)}</span>${ic('chevron', 18)}`;
    return `<li class="${x.kind}"><button data-act="gate-go" data-idx="${idx}">${inner}</button></li>`;
  };
  /* Before any result is recorded, nothing has gone wrong yet: show the job, not a list of errors.
     Item lines are held back until inspecting starts; visit-level lines stay, shown as reminders. */
  const L = visitInsps(v.id);
  if (blocks.length && !L.some(i => i.result)) {
    const rest = g.map((x, idx) => [x, idx]).filter(([x]) => !x.item);
    return `<div class="banner note">${ic('clipboard', 26)}<div><b>${L.length ? plural(L.length, 'item') + ' to inspect' : 'Add the first item'}</b>Record a result for each item. Anything the report still needs is listed here as you go.</div></div>
      ${rest.length ? `<ul class="gate" style="margin-top:10px">${rest.map(([x, idx]) => li({ ...x, kind: 'advise' }, idx)).join('')}</ul>` : ''}`;
  }
  return `${blocks.length
      ? `<div class="banner stop">${ic('alert', 26)}<div><b>${plural(blocks.length, 'thing')} to fix first</b>The report cannot be issued until ${blocks.length === 1 ? 'this is' : 'these are'} done.</div></div>`
      : `<div class="banner ok">${ic('check', 26, 2.6)}<div><b>Ready to issue</b>Every item has what the report needs.</div></div>`}
    ${g.length ? `<ul class="gate" style="margin-top:10px">${g.map((x, idx) => li(x, idx)).join('')}</ul>` : ''}`;
}
function signBox(v, who) {
  const data = who === 'inspector' ? v.signInspector : v.signClient;
  return `<button class="signbox ${data ? 'done' : ''}" data-act="sign" data-who="${who}">${data ? `<img src="${data}" alt="Signature">` : `<span style="display:flex;gap:8px;align-items:center">${ic('pen', 20)}Tap to sign</span>`}</button>`;
}
/* "Issue report", or "Issue report (3 to fix)" while the readiness list still has blocking lines */
/* as HTML for the button: the bracketed count never splits across lines */
const issueLabelHTML = v => esc(issueLabel(v)).replace(/\((.*)\)/, '<span class="nw">($1)</span>');
function issueLabel(v) {
  const n = gateLines(v).filter(x => x.kind === 'block').length;
  return n ? 'Issue report (' + n + ' to fix)' : 'Issue report';
}
function issuePanel(v) {
  const n = counts(v.id), blocked = gate(v).some(x => x.kind === 'block');
  return `<div class="pane-head"><div class="bar">${backBtn('Back to items')}<div class="grow"><div class="title sm">Check and issue</div></div></div></div>
    <div class="pane-body" data-scroll="issue">
      <div id="gateBox">${gateBox(v)}</div>
      <div class="section"><span class="label">Sign-off</span>
        ${field('Inspector', 'v:inspector', v.inspector, 'id="inspectorInput" autocomplete="name"')}
        ${field('Inspector competency', 'v:inspectorQuals', v.inspectorQuals || '', 'id="qualsInput" autocomplete="off"')}
        ${signBox(v, 'inspector')}
        ${field('Client representative, if on site', 'v:clientRep', v.clientRep, 'autocomplete="off"')}
        ${signBox(v, 'client')}
      </div>
      <div class="section"><span class="label">This visit</span>
        <div class="tallybox"><div><b>${n.pass}</b>Pass</div><div><b>${n.action}</b>Action</div><div><b>${n.missing}</b>Not presented</div><div><b>${n.todo}</b>To do</div></div>
      </div>
    </div>
    <div class="pane-foot"><button class="btn btn-secondary" data-act="preview">Preview</button><button class="btn btn-go" id="issueBtn" data-act="issue" ${blocked ? 'disabled' : ''}>${issueLabelHTML(v)}</button></div>`;
}
const swatchesHTML = v => Object.keys(TAGS).map(k => `<button class="swatch" data-act="set-tag" data-tag="${k}" aria-pressed="${v.tag === k}" aria-label="${TAGS[k].name} tag">${tagChip(k, TAGS[k].name, '', v.tag === k ? ic('check', 16, 3) : '')}</button>`).join('');
function detailsPanel(v) {
  const c = client(v.clientId);
  return `<div class="pane-head"><div class="bar">${backBtn('Back to items')}<div class="grow"><div class="title sm">Visit details</div></div></div></div>
    <div class="pane-body" data-scroll="details">
      ${field('Client', 'c:name', c.name, 'autocomplete="off"')}
      ${field('Site', 'c:site', c.site, 'autocomplete="off" placeholder="Workshop, 12 Example Rd, Welshpool"')}
      <div class="cols">${field('Contact name', 'c:contact', c.contact, 'autocomplete="off"')}${field('Contact phone', 'c:phone', c.phone, 'type="tel" inputmode="tel" autocomplete="off"')}</div>
      ${field('Contact email', 'c:email', c.email, 'type="email" autocomplete="off"')}
      ${field('Inspection date', 'v:date', v.date, 'type="date"')}
      <div class="section"><span class="label">Tag colour for this visit</span>
        <div class="swatches" id="swatches">${swatchesHTML(v)}</div>
      </div>
      <div class="section">${area('Scope of this inspection', 'v:scope', v.scope, 'placeholder="For example: all lifting gear in the main workshop and the service truck"')}</div>
      <div class="section"><button class="btn btn-danger btn-block" data-act="del-visit">${ic('trash')}Delete this visit</button></div>
    </div>
    <div class="pane-foot"><button class="btn btn-primary" data-act="panel" data-panel="">Done</button></div>`;
}
const isWide = () => window.matchMedia('(min-width: 760px)').matches;
function visitDetail(v, r) {
  const panel = r.panel || (isWide() ? 'issue' : '');
  if (panel === 'item') { const i = insp(r.itemId); if (i) return itemPanel(v, i); }
  if (panel === 'pick') return pickPanel();
  if (panel === 'details') return detailsPanel(v);
  if (panel === 'issue' || panel === 'item') return issuePanel(v);
  return '';
}
function viewVisit(r) {
  const v = visit(r.id);
  if (!v) return '<div class="page"><div class="page-body"><div class="empty" style="margin-top:40px"><b>That visit is gone</b><button class="btn btn-primary" data-act="nav" data-to="home">Back to visits</button></div></div></div>';
  return `<div class="split ${r.panel ? 'has-detail' : ''}">
    <section class="pane pane-list" id="paneList">${visitList(v, r)}</section>
    <section class="pane pane-detail" id="paneDetail">${visitDetail(v, r)}</section>
  </div>`;
}

/* ---------- report screen ---------- */
function viewReport(r) {
  const v = visit(r.id);
  /* a draft preview of an open visit: drawn from live data, nothing to print or send */
  if (r.preview && v.status !== 'issued') return `<div class="page">
    <div class="toolbar">
      <button class="btn btn-quiet btn-icon" data-act="back-report" aria-label="Back to the visit">${ic('back')}</button>
      <span class="title">Draft preview</span>
    </div>
    <div class="docwrap" data-scroll="doc"><div style="position:relative;max-width:820px;margin:0 auto">${renderDoc(makeSnapshot(v), null, { draft: true })}</div></div>
  </div>`;
  const rv = r.rev !== undefined && v.revisions && v.revisions[r.rev];
  /* an earlier version: read-only, marked SUPERSEDED, only Back and Print */
  if (rv) return `<div class="page">
    <div class="toolbar">
      <button class="btn btn-quiet btn-icon" data-act="back-report" aria-label="Back to the current report">${ic('back')}</button>
      <span class="title">Report ${esc(reportNo(rv.snapshot))}</span>
      <div class="tb-actions"><button class="btn btn-primary" data-act="print">${ic('print')}Print or save PDF</button></div>
    </div>
    <div class="docwrap" data-scroll="doc"><div style="position:relative;max-width:820px;margin:0 auto">${renderDoc(rv.snapshot, null, { superseded: true })}</div></div>
  </div>`;
  const vers = (v.revisions || []).map((x, k) => `<button class="btn btn-secondary" data-act="open-rev" data-idx="${k}">${x.rev ? 'Rev ' + x.rev : 'Original'}, issued ${fmtDate(x.issuedAt)}</button>`).join('');
  return `<div class="page">
    <div class="toolbar">
      <button class="btn btn-quiet btn-icon" data-act="nav" data-to="home" aria-label="Back to visits">${ic('back')}</button>
      <span class="title">Report ${esc(reportNo(v))}</span>
      <div class="tb-actions">
        <button class="btn btn-primary" data-act="print">${ic('print')}Print or save PDF</button>
        ${navigator.share ? `<button class="btn btn-secondary" data-act="share-report">${ic('share')}Share</button>` : ''}
        <button class="btn btn-secondary" data-act="dl-report">${ic('download')}Save report file</button>
        <button class="btn btn-secondary" data-act="dl-csv">${ic('table')}Save spreadsheet (CSV)</button>
        <button class="btn btn-quiet" data-act="revise">Revise report</button>
      </div>
      ${vers ? `<div class="vers"><span class="small" style="font-weight:650">Earlier versions:</span>${vers}</div>` : ''}
    </div>
    <div class="docwrap" data-scroll="doc"><div style="position:relative;max-width:820px;margin:0 auto">${UI.justIssued ? '<div class="stamp">ISSUED</div>' : ''}${reportDoc(v, null)}</div></div>
  </div>`;
}

/* ---------- register ---------- */
function regRows(r) {
  const q = UI.q.trim().toLowerCase();
  const L = S.assets.filter(a => {
    if (!q) return true;
    const c = client(a.clientId);
    return [a.ident, typeOf(a).name, a.desc, a.location, a.make, a.certNo, c && c.name].join(' ').toLowerCase().includes(q);
  }).sort((a, b) => (a.retired - b.retired) || (client(a.clientId).name.localeCompare(client(b.clientId).name)) || a.ident.localeCompare(b.ident));
  if (!L.length) return `<div class="empty"><b>${S.assets.length ? 'No matches' : 'The register is empty'}</b>${S.assets.length ? 'Try a different ID, type or client.' : 'Items you inspect on a visit are added here automatically.'}</div>`;
  return '<div class="rows">' + L.map(a => {
    const l = lastInsp(a.id);
    const right = a.retired ? '<span class="badge missing">Retired</span>' : l ? badge(l.i.result) : '<span class="badge todo">Not inspected</span>';
    return `<div class="row" role="button" tabindex="0" data-act="open-asset" data-id="${a.id}" ${r.assetId === a.id ? 'aria-current="true"' : ''}>
      <span class="glyph">${glyph(a.type)}</span>
      <span class="grow"><span class="row-id ${a.ident ? '' : 'none'}" style="display:block">${esc(a.ident) || 'No ID yet'}</span><span class="row-sub" style="display:block">${esc(typeOf(a).name)}, ${esc(client(a.clientId).name)}</span></span>
      ${right}</div>`;
  }).join('') + '</div>';
}
/* Register history line: what was done, plus the proof load test flag. */
function histAction(i) {
  const t = actionText(i.actions || []), rt = i.result === 'repair' && i.retest;
  if (!t) return rt ? 'Proof load test needed.' : '';
  return 'Action taken: ' + (rt ? t.slice(0, -1) + ', proof load test needed.' : t);
}
function assetPanel(a) {
  const c = client(a.clientId), t = typeOf(a), l = lastInsp(a.id);
  const hist = S.inspections.filter(i => i.assetId === a.id && i.result).map(i => ({ i, v: visit(i.visitId) })).filter(x => x.v).sort((x, y) => y.v.date.localeCompare(x.v.date));
  const line = (k, val) => val ? `<div class="qrow"><span class="muted">${k}</span><b style="text-align:right">${esc(val)}</b></div>` : '';
  return `<div class="pane-head"><div class="bar">${backBtn('Back to the register')}<div class="grow"><div class="title sm">${esc(a.ident) || 'No ID yet'}</div></div>${l && !a.retired ? badge(l.i.result) : ''}</div></div>
    <div class="pane-body" data-scroll="asset">
      ${l && l.i.nextDue && !a.retired ? `<div class="banner note" style="margin-bottom:14px">${ic('clock', 22)}<div><b>Next inspection ${fmtDate(l.i.nextDue)}</b>${daysFromToday(l.i.nextDue) < 0 ? 'Overdue by ' + plural(-daysFromToday(l.i.nextDue), 'day') : 'In ' + plural(daysFromToday(l.i.nextDue), 'day')}</div></div>` : ''}
      <div class="card" style="padding:6px 16px">
        ${line('Type', t.name)}${line('Description', a.desc)}${line(typeOf(a).cap ? 'Rated capacity' : 'Working load limit', wllVal(a))}${line('Manufacturer', a.make)}${line('Test certificate', a.certNo)}${line('Kept at', a.location)}${line('Standard', a.std)}${line('Client', c.name)}
      </div>
      <h2>Inspection history</h2>
      ${hist.length ? hist.map(({ i, v }) => `<div class="card" style="padding:12px 14px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b>${fmtDate(v.date)}</b>${badge(i.result)}</div>
          <p class="small muted">${v.reportNo ? 'Report ' + esc(v.reportNo) : 'Visit in progress'}${v.inspector ? ', ' + esc(v.inspector) : ''}</p>
          ${i.defects.length ? `<p class="small" style="margin-top:6px">${esc(i.defects.join(', '))}</p>` : ''}
          ${i.notes ? `<p class="small" style="margin-top:4px">${esc(i.notes)}</p>` : ''}
          ${histAction(i) ? `<p class="small" style="margin-top:4px">${esc(histAction(i))}</p>` : ''}
          ${i.photos.length ? `<div class="photos" style="margin:10px 0 0">${i.photos.map(p => `<span class="photo"><img data-photo="${p}" alt=""></span>`).join('')}</div>` : ''}
        </div>`).join('') : '<div class="banner note">No results recorded yet.</div>'}
      <div class="section"><button class="btn btn-secondary btn-block" data-act="retire-asset" data-id="${a.id}">${a.retired ? 'Return to the active register' : 'Retire this item'}</button>
        <p class="small muted" style="margin-top:8px">${a.retired ? 'Retired items are not brought forward to new visits.' : 'Use this when gear is scrapped or leaves the site. Its history is kept.'}</p></div>
    </div>`;
}
function viewRegister(r) {
  const a = r.assetId && asset(r.assetId);
  const live = S.assets.filter(x => !x.retired).length;
  return `<div class="split ${a ? 'has-detail' : ''}">
    <section class="pane pane-list" id="paneList">
      <div class="pane-head" style="padding-left:16px;padding-right:16px"><h1 style="margin-top:6px">Register</h1><p class="sub">${plural(live, 'item')} across ${plural(S.clients.length, 'client')}</p>
        <input class="input" type="search" id="regSearch" placeholder="Search ID, type or client" value="${esc(UI.q)}" aria-label="Search the register" style="margin-top:12px"></div>
      <div class="pane-body" data-scroll="reg" id="regRows" style="padding-top:8px">${regRows(r)}</div>
    </section>
    <section class="pane pane-detail" id="paneDetail">${a ? assetPanel(a) : '<div class="pane-body" style="display:grid;place-items:center"><p class="muted">Choose an item to see its history.</p></div>'}</section>
  </div>`;
}

/* ---------- due ---------- */
function contactActions(c) {
  const tel = telHref(c.phone), mail = String(c.email || '').trim(), name = String(c.contact || '').trim(), hasMail = mail.includes('@');
  const call = tel ? `<a class="btn btn-secondary btn-block btn-wrap" href="${esc(tel)}">${ic('phone', 20)}<span>${name ? 'Call ' + esc(name) : 'Call the client'}, ${esc(String(c.phone).trim())}</span></a>` : '';
  const em = hasMail ? `<a class="btn btn-secondary" href="mailto:${esc(mail)}">${ic('mail', 20)}Email</a>` : '';
  if (!call && !em) return name ? `<p class="small muted">Contact ${esc(name)}</p>` : '';
  return `<div class="btn-row" style="margin:12px 0 0">${call}${em}</div>`;
}
function viewDue() {
  const due = dueAssets(), by = {}, rep = repairAssets(), rby = {};
  due.forEach(d => { (by[d.a.clientId] = by[d.a.clientId] || []).push(d); });
  rep.forEach(d => { (rby[d.a.clientId] = rby[d.a.clientId] || []).push(d); });
  const dueRow = d => `<div class="row" role="button" tabindex="0" data-act="open-asset" data-id="${d.a.id}"><span class="glyph">${glyph(d.a.type)}</span><span class="grow"><span class="row-id" style="display:block">${esc(d.a.ident)}</span><span class="row-sub" style="display:block">${esc(itemSub(d.a) + (d.l.i.result === 'missing' ? ', not presented ' + fmtDate(d.l.v.date) : ''))}</span></span>${dueBadge(d.days)}</div>`;
  const repRow = d => `<div class="row" role="button" tabindex="0" data-act="open-asset" data-id="${d.a.id}"><span class="glyph">${glyph(d.a.type)}</span><span class="grow"><span class="row-id" style="display:block">${esc(d.a.ident)}</span><span class="row-sub" style="display:block">${esc(typeOf(d.a).name + ', reported ' + fmtDate(d.l.v.date) + (d.l.i.retest ? ', proof load test needed' : ''))}</span></span>${badge('repair')}</div>`;
  const cards = [...new Set([...Object.keys(by), ...Object.keys(rby)])].map(cid => {
    const c = client(cid), L = by[cid] || [], R = rby[cid] || [], over = L.filter(d => d.days < 0).length, ov = openVisitFor(cid);
    return `<div class="card">
      <h3 class="d" style="font-size:22px">${esc(c.name)}</h3>
      <p class="sub">${[over ? over + ' overdue' : '', (L.length - over) ? (L.length - over) + ' due within 30 days' : '', R.length ? R.length + ' waiting on repair' : ''].filter(Boolean).join(', ')}</p>
      ${contactActions(c)}
      ${L.length ? `<div class="rows" style="margin:12px 0">${L.map(dueRow).join('')}</div>` : ''}
      ${R.length ? `<h3 style="font-size:17px;margin:14px 0 8px">Waiting on repair</h3><div class="rows" style="margin:0 0 12px">${R.map(repRow).join('')}</div>` : ''}
      ${ov ? `<button class="btn btn-secondary btn-block" data-act="open-visit" data-id="${ov.id}">Continue the visit in progress</button>`
           : `<button class="btn btn-primary btn-block" data-act="start-due" data-id="${cid}">Start a visit with this client's gear</button>`}
    </div>`;
  }).join('');
  return `<div class="page"><header class="page-head"><div><h1>Due</h1><p class="sub">Next inspections falling in the coming 30 days</p></div></header>
    <div class="page-body" data-scroll="due"><div class="wrap" style="max-width:720px">
      ${cards || '<div class="empty"><b>Nothing is due</b>When you pass an item it gets a next inspection date. It shows up here 30 days before that date, so you can book the return visit.</div>'}
    </div></div></div>`;
}

/* ---------- settings ---------- */
const backupLine = () => { const d = S.settings.lastBackupAt ? new Date(S.settings.lastBackupAt) : null; return d && !isNaN(d) ? 'Last backup: ' + fmtDate(toISO(d)) + '.' : 'No backup saved yet.'; };
function viewSettings() {
  const s = S.settings, co = s.company;
  return `<div class="page"><header class="page-head"><div><h1>Settings</h1><p class="sub">${APP.name} ${APP.version}. Everything is stored on this device.</p></div></header>
    <div class="page-body" data-scroll="settings"><div class="wrap set-grid">
      <div class="card"><h3>Your business</h3><p>Shown at the top of every report.</p>
        ${co.logo ? `<img class="logo-prev" src="${co.logo}" alt="Your logo">` : ''}
        <div class="btn-row" style="margin-bottom:14px"><button class="btn btn-secondary" data-act="pick-logo">${co.logo ? 'Change logo' : 'Add your logo'}</button>${co.logo ? '<button class="btn btn-quiet" data-act="clear-logo">Remove</button>' : ''}</div>
        ${field('Business name', 's:company.name', co.name, 'autocomplete="organization"')}
        <div class="cols">${field('ABN', 's:company.abn', co.abn, 'inputmode="numeric" autocomplete="off"')}${field('Phone', 's:company.phone', co.phone, 'type="tel" autocomplete="tel"')}</div>
        ${field('Email', 's:company.email', co.email, 'type="email" autocomplete="email"')}
        ${field('Address', 's:company.address', co.address, 'autocomplete="street-address"')}
      </div>
      <div class="card"><h3>Inspector</h3><p>The default for new visits. You can change it on any visit.</p>
        ${field('Name', 's:inspector.name', s.inspector.name, 'autocomplete="name"')}
        ${field('Competency shown on reports', 's:inspector.quals', s.inspector.quals, 'autocomplete="off" placeholder="For example: intermediate rigging licence, 12 years inspecting lifting gear"')}
        <p class="small muted" style="margin:6px 0 0">Your licence, ticket or training. Printed under your signature on every report.</p>
      </div>
      <div class="card"><h3>Tag colours</h3><p>The colour for each three-month period. Match these to the colour code your clients work to. Colour codes are a site system, not a legal requirement.</p>
        <div class="field"><span class="label" id="tsLabel">Periods start in</span><div class="unit" role="group" aria-labelledby="tsLabel"><button data-act="set-tagstart" data-start="0" aria-pressed="${tagStartOf() === 0}">January</button><button data-act="set-tagstart" data-start="11" aria-pressed="${tagStartOf() === 11}">December</button></div></div>
        ${PERIODS[tagStartOf()].map((q, n) => `<div class="qrow"><span style="display:flex;align-items:center;gap:10px"><span class="tagdot" style="--c:${TAGS[s.quarters[n]].hex}"></span>${q}</span>
          <select data-quarter="${n}" aria-label="Tag colour for ${q}">${Object.keys(TAGS).map(k => `<option value="${k}" ${s.quarters[n] === k ? 'selected' : ''}>${TAGS[k].name}</option>`).join('')}</select></div>`).join('')}
      </div>
      <div class="card"><h3>Reports</h3><p>Numbering and the wording at the foot of each report.</p>
        <div class="cols">${field('Report number prefix', 's:prefix', s.prefix, 'autocomplete="off"')}${field('Next number', 's:nextNo', s.nextNo, 'inputmode="numeric" autocomplete="off"')}</div>
        <div id="nextNoWarn" aria-live="polite">${nextNoWarnHTML()}</div>
        ${area('Statement at the foot of the report', 's:disclaimer', s.disclaimer, 'style="min-height:150px"')}
        <label class="check"><input type="checkbox" data-toggle="photoEveryItem" ${s.photoEveryItem ? 'checked' : ''}><span>Require a photo of every item, not only failed ones</span></label>
      </div>
      <div class="card" id="voiceCard">${voiceCardInner()}</div>
      <div class="card" style="grid-column:1/-1"><h3>Equipment types</h3><p>The standard printed against each type, and the months until its next inspection. Set each to the manufacturer's recommendation where there is one, otherwise to your judgement as the competent person and the site's procedure. Where neither applies, the law requires inspection at least once a year.</p>
        <table class="ttable"><tbody>${TYPES.map(t0 => { const t = typeById(t0.id); return `<tr><td>${t.name}</td><td><input class="input" data-type-std="${t.id}" value="${esc(t.std)}" aria-label="Standard for ${t.name}"></td><td style="width:92px"><input class="input" data-type-months="${t.id}" value="${t.months}" inputmode="numeric" aria-label="Months between inspections for ${t.name}"></td></tr>`; }).join('')}</tbody></table>
      </div>
      <div class="card" style="grid-column:1/-1"><h3>Your data</h3><p>Records live in this browser on this device. Save a backup file regularly and keep it somewhere safe, such as your email or a USB stick. A backup holds everything, photos included.</p>
        <p>${backupLine()}</p>
        <div class="btn-row"><button class="btn btn-primary" data-act="backup">${ic('download')}Save a backup file</button><button class="btn btn-secondary" data-act="restore">Restore from a backup</button></div>
        <div class="btn-row" style="margin-top:10px"><button class="btn btn-secondary" data-act="load-demo">Load sample data</button><button class="btn btn-danger" data-act="erase">Erase everything</button></div>
      </div>
    </div></div></div>`;
}

/* ---------- overlay content ---------- */
function sheetNewVisit() {
  const nv = UI.nv, have = S.clients.length > 0;
  const pickList = S.clients.map(c => {
    const n = S.assets.filter(a => a.clientId === c.id && !a.retired).length;
    return `<button class="pick" type="button" data-act="nv-client" data-id="${c.id}" aria-pressed="${nv.clientId === c.id}"><span class="grow"><b>${esc(c.name)}</b><small>${esc(c.site || 'No site recorded')}${n ? ', ' + plural(n, 'item') + ' on the register' : ''}</small></span></button>`;
  }).join('');
  const assetsN = nv.clientId ? S.assets.filter(a => a.clientId === nv.clientId && !a.retired).length : 0;
  return `<form class="sheet" data-form="new-visit" role="dialog" aria-label="Start a visit">
    <div class="sheet-head"><h3>Start a visit</h3><button class="btn btn-quiet btn-icon" type="button" data-act="close-overlay" aria-label="Close">${ic('x')}</button></div>
    <div class="sheet-body">
      ${have ? `<div class="unit" style="margin-bottom:14px"><button type="button" data-act="nv-mode" data-mode="existing" aria-pressed="${nv.mode === 'existing'}">Existing client</button><button type="button" data-act="nv-mode" data-mode="new" aria-pressed="${nv.mode === 'new'}">New client</button></div>` : ''}
      ${nv.mode === 'existing' ? pickList : `
        <label class="field"><span>Client</span><input class="input" name="name" value="${esc(nv.name)}" autocomplete="off" required></label>
        <label class="field"><span>Site</span><input class="input" name="site" value="${esc(nv.site)}" autocomplete="off" placeholder="Workshop, 12 Example Rd, Welshpool"></label>
        <div class="cols"><label class="field"><span>Contact name</span><input class="input" name="contact" value="${esc(nv.contact)}" autocomplete="off"></label>
        <label class="field"><span>Contact phone</span><input class="input" name="phone" type="tel" inputmode="tel" value="${esc(nv.phone)}" autocomplete="off"></label></div>
        <label class="field"><span>Contact email</span><input class="input" name="email" type="email" value="${esc(nv.email)}" autocomplete="off"></label>`}
      <label class="field" style="margin-top:6px"><span>Inspection date</span><input class="input" type="date" name="date" value="${esc(nv.date)}" required></label>
      <p class="small muted" style="display:flex;align-items:center;gap:10px;margin-top:-4px">Tag colour ${tagChip(tagFor(nv.date))} You can change it on the visit.</p>
      ${nv.mode === 'existing' && assetsN ? `<label class="check"><input type="checkbox" name="bring" ${nv.bring ? 'checked' : ''}><span>Bring forward the ${plural(assetsN, 'item')} already on this client's register, ready to re-inspect</span></label>` : ''}
    </div>
    <div class="sheet-foot"><button class="btn btn-primary" type="submit" ${nv.mode === 'existing' && !nv.clientId ? 'disabled' : ''}>Start the visit</button></div>
  </form>`;
}
function sheetRevise(v) {
  return `<div class="sheet" role="dialog" aria-labelledby="reviseTitle">
    <div class="sheet-head"><h3 id="reviseTitle">Revise this report?</h3><button class="btn btn-quiet btn-icon" data-act="close-overlay" aria-label="Close">${ic('x')}</button></div>
    <div class="sheet-body"><p>${esc(`The visit opens for editing. When you issue it again it keeps number ${v.reportNo}, becomes Rev ${(v.rev || 0) + 1}, and says it replaces the version issued ${fmtDate(v.issuedAt)}. The earlier version is kept. You and the client sign again.`)}</p>
      <label class="field" style="margin-top:14px"><span>Why does it need revising?</span><textarea class="input" id="reviseWhy" autocomplete="off"></textarea></label></div>
    <div class="sheet-foot"><button class="btn btn-secondary" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="reviseOk" data-act="revise-ok" disabled>Revise report</button></div>
  </div>`;
}
function sheetSign(who) {
  return `<div class="sheet" role="dialog" aria-label="Signature">
    <div class="sheet-head"><h3>${who === 'inspector' ? 'Inspector signature' : 'Client signature'}</h3><button class="btn btn-quiet btn-icon" data-act="close-overlay" aria-label="Close">${ic('x')}</button></div>
    <div class="sheet-body"><canvas class="sigpad" id="sigpad"></canvas><p class="small muted" style="margin-top:8px">Sign with a finger or stylus.</p></div>
    <div class="sheet-foot"><button class="btn btn-secondary" data-act="sig-clear">Clear</button><button class="btn btn-primary" data-act="sig-save" data-who="${who}">Use this signature</button></div>
  </div>`;
}
function sheetConfirm(title, body, okLabel, danger) {
  return `<div class="sheet" role="alertdialog" aria-label="${esc(title)}">
    <div class="sheet-head"><h3>${esc(title)}</h3></div>
    <div class="sheet-body"><p>${esc(body)}</p></div>
    <div class="sheet-foot"><button class="btn btn-secondary" data-act="close-overlay">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm-ok">${esc(okLabel)}</button></div>
  </div>`;
}
function sheetPhoto(pid, canDelete) {
  return `<div class="viewer"><img data-photo="${pid}" alt="Inspection photo">
    <div class="btn-row">${canDelete ? `<button class="btn btn-danger" data-act="del-photo" data-photo-id="${pid}">${ic('trash')}Delete photo</button>` : ''}<button class="btn btn-secondary" data-act="close-overlay">Close</button></div></div>`;
}

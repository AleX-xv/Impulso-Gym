'use strict';
const routines = [
 {id:'full',name:'Fuerza de cuerpo completo',category:'Fuerza',level:'GYM · GENERAL',minutes:35,word:'STRONG',symbol:'≋',color:'#e9eedf',ink:'#536b2b',description:'Un recorrido por los principales grupos musculares.',exercises:[['Entrada en calor','5 minutos a ritmo cómodo'],['Sentadilla con peso corporal','3 series de 10 repeticiones'],['Remo con mancuerna','3 series de 10 por lado'],['Press de pecho con mancuernas','3 series de 10 repeticiones'],['Vuelta a la calma','3 minutos de movimiento suave']]},
 {id:'cardio',name:'Muévete a tu ritmo',category:'Cardio',level:'SIN EQUIPO · INICIAL',minutes:20,word:'MOVE',symbol:'↗',color:'#e7e8fc',ink:'#7770b0',description:'Una sesión de movimiento continuo, sin saltos.',exercises:[['Marcha suave','4 minutos'],['Caminata a paso ágil','8 minutos a un ritmo que permita conversar'],['Pasos laterales','4 minutos sin saltos'],['Caminata suave','4 minutos para cerrar']]},
 {id:'mobility',name:'Pausa y movilidad',category:'Movilidad',level:'SIN EQUIPO · SUAVE',minutes:15,word:'RESET',symbol:'◎',color:'#f7e8de',ink:'#bb835e',description:'Haz una pausa y explora movimientos cómodos.',exercises:[['Caminata suave','3 minutos'],['Círculos de hombros','2 minutos, rango cómodo'],['Movilidad de tobillos','2 minutos por lado'],['Rotaciones de tronco de pie','3 minutos, sin forzar'],['Respiración tranquila','3 minutos']]},
 {id:'upper',name:'Tren superior',category:'Fuerza',level:'GYM · GENERAL',minutes:30,word:'BUILD',symbol:'↟',color:'#e3edf1',ink:'#527786',description:'Una sesión de ejemplo con mancuernas y control.',exercises:[['Entrada en calor','5 minutos suaves'],['Remo con mancuerna','3 series de 10 por lado'],['Press de pecho con mancuernas','3 series de 10'],['Curl de bíceps','2 series de 10'],['Vuelta a la calma','3 minutos']]},
 {id:'walk',name:'Caminata activa',category:'Cardio',level:'AL AIRE LIBRE · INICIAL',minutes:25,word:'GO OUT',symbol:'↗',color:'#f0edda',ink:'#958133',description:'Una ruta simple para sumar movimiento a tu día.',exercises:[['Inicio tranquilo','5 minutos de caminata suave'],['Caminata continua','15 minutos a un ritmo cómodo'],['Regreso a la calma','5 minutos suaves']]},
 {id:'lower',name:'Base y equilibrio',category:'Fuerza',level:'SIN EQUIPO · INICIAL',minutes:20,word:'BALANCE',symbol:'◒',color:'#e6e9e5',ink:'#6b8268',description:'Movimientos sencillos con el peso de tu cuerpo.',exercises:[['Marcha suave','4 minutos'],['Sentarse y levantarse de una silla estable','2 series de 8'],['Elevaciones de talones con apoyo','2 series de 10'],['Pasos laterales','3 minutos'],['Vuelta a la calma','3 minutos']]}
];
const storageKey = 'impulso-gym-v1';
const $ = selector => document.querySelector(selector);
const categories = ['Fuerza', 'Cardio', 'Movilidad'];
const places = ['Gym', 'En casa', 'Sin equipo', 'Al aire libre'];
const maxExercises = 20;
const maxRoutines = 100;
const palette = {
  Fuerza: { color: '#e9eedf', ink: '#536b2b', symbol: '≋', word: 'MY PLAN' },
  Cardio: { color: '#e7e8fc', ink: '#7770b0', symbol: '↗', word: 'MY PACE' },
  Movilidad: { color: '#f7e8de', ink: '#bb835e', symbol: '◎', word: 'MY FLOW' }
};
const uniqueId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cleanText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function validCustomRoutine(r) {
  return r && typeof r.id === 'string' && r.id.startsWith('custom-') &&
    cleanText(r.name, 80) && categories.includes(r.category) && places.includes(r.place) &&
    Number.isInteger(r.minutes) && r.minutes >= 1 && r.minutes <= 300 &&
    Array.isArray(r.exercises) && r.exercises.length >= 1 && r.exercises.length <= maxExercises &&
    r.exercises.every(e => Array.isArray(e) && cleanText(e[0], 80) && cleanText(e[1], 120));
}
function normalizeState(saved) {
  const result = { sessions: [], goal: 3, customRoutines: [] };
  if (!saved || typeof saved !== 'object') return result;
  const ids = new Set();
  if (Array.isArray(saved.customRoutines)) {
    result.customRoutines = saved.customRoutines.filter(validCustomRoutine).filter(r => {
      if (ids.has(r.id)) return false;
      ids.add(r.id); return true;
    }).slice(0, maxRoutines).map(r => ({
      id: r.id, name: cleanText(r.name, 80), category: r.category, place: r.place,
      description: cleanText(r.description, 180), minutes: r.minutes,
      exercises: r.exercises.map(e => [cleanText(e[0], 80), cleanText(e[1], 120)])
    }));
  }
  const available = [...routines, ...result.customRoutines];
  if (Array.isArray(saved.sessions)) {
    result.sessions = saved.sessions.filter(s => s && typeof s.id === 'string' &&
      typeof s.routine === 'string' && Number.isInteger(s.minutes) && s.minutes >= 1 && s.minutes <= 300 &&
      typeof s.date === 'string' && !isNaN(new Date(s.date).getTime())).flatMap(s => {
      const original = available.find(r => r.id === s.routine);
      const snapshot = s.routineSnapshot;
      const name = cleanText(snapshot?.name, 80) || original?.name;
      const category = categories.includes(snapshot?.category) ? snapshot.category : original?.category;
      return name && category ? [{ id: s.id, routine: s.routine, date: s.date, minutes: s.minutes,
        routineSnapshot: { name, category } }] : [];
    });
  }
  if ([2, 3, 4, 5, 6, 7].includes(saved.goal)) result.goal = saved.goal;
  return result;
}
let state = normalizeState(null);
let storageAvailable = true;
try { state = normalizeState(JSON.parse(localStorage.getItem(storageKey) || 'null')); }
catch { storageAvailable = false; }
function allRoutines() { return [...routines, ...state.customRoutines]; }
function decorateRoutine(r) {
  return r.id.startsWith('custom-') ? { ...r, ...palette[r.category], level: `${r.place.toUpperCase()} · PERSONAL` } : r;
}
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
let toastTimeout;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
function showStorageWarning() {
  let warning = $('#storage-warning');
  if (!warning) {
    warning = node('p', 'save-warning', 'No se pudo guardar en este navegador. Los cambios de esta visita podrían perderse al cerrar o recargar.');
    warning.id = 'storage-warning'; warning.setAttribute('role', 'alert');
    $('.topbar').after(warning);
  }
  warning.hidden = storageAvailable;
}
function save() {
  let persisted = true;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; persisted = false; }
  showStorageWarning();
  renderStats(); renderHistory(); renderCustom();
  return persisted;
}
function showView(view) {
  if (!['home', 'routines', 'custom', 'history'].includes(view)) view = 'home';
  if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== view + '-view');
  document.querySelectorAll('.nav').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
    if (el.dataset.view === view) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
$('.brand').addEventListener('click', e => { e.preventDefault(); showView('home'); });
$('#hero-start').addEventListener('click', () => showView('routines'));
$('#show-all').addEventListener('click', () => showView('routines'));

function createCard(original) {
  const r = decorateRoutine(original);
  const custom = original.id.startsWith('custom-');
  const card = node('article', 'routine-card' + (custom ? ' custom-card' : ''));
  card.style.setProperty('--card-color', r.color);
  card.style.setProperty('--card-ink', r.ink);
  const visual = node('div', 'routine-visual'); visual.setAttribute('aria-hidden', 'true');
  visual.append(node('span', 'level', r.level), node('span', 'visual-word', r.word), node('span', 'visual-symbol', r.symbol));
  const body = node('div', 'card-body');
  body.append(node('span', 'card-category', r.category.toUpperCase()), node('h3', '', r.name),
    node('p', '', r.description || 'Tu secuencia de ejercicios, a tu manera.'));
  const bottom = node('div', 'card-bottom');
  bottom.append(node('span', '', `◷ ${r.minutes} min · ${r.exercises.length} ejercicio${r.exercises.length === 1 ? '' : 's'}`));
  const start = node('button', custom ? 'train-button' : '', custom ? 'Entrenar ↗' : '↗');
  start.type = 'button'; start.setAttribute('aria-label', 'Abrir ' + r.name);
  start.addEventListener('click', () => openSession(r));
  if (custom) {
    const actions = node('div', 'custom-actions');
    const edit = node('button', 'edit-button', 'Editar'); edit.type = 'button';
    edit.setAttribute('aria-label', 'Editar ' + r.name);
    edit.addEventListener('click', () => openEditor(original));
    const remove = node('button', 'delete-icon', '×'); remove.type = 'button';
    remove.setAttribute('aria-label', 'Eliminar rutina ' + r.name);
    remove.addEventListener('click', () => requestDelete(original));
    actions.append(start, edit, remove); body.append(bottom, actions);
  } else { bottom.append(start); body.append(bottom); }
  card.append(visual, body); return card;
}
function renderRoutines(filter = 'all') {
  $('#all-routines').replaceChildren(...routines.filter(r => filter === 'all' || r.category === filter).map(createCard));
}
function renderCustom() {
  $('#custom-routines').replaceChildren(...state.customRoutines.map(createCard));
  $('#custom-empty').hidden = state.customRoutines.length > 0;
  $('#custom-nav-count').textContent = state.customRoutines.length;
}
$('#featured').append(...routines.slice(0, 3).map(createCard));
renderRoutines();
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(x => {
    x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b));
  }); renderRoutines(b.dataset.filter);
}));
function dayKey(date) { const d = new Date(date); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
function weekStart() {
  const now = new Date(); now.setHours(0, 0, 0, 0); now.setDate(now.getDate() - (now.getDay() + 6) % 7); return now;
}
function renderStats() {
  const start = weekStart(); const end = new Date(start); end.setDate(end.getDate() + 7);
  const sessions = state.sessions.filter(s => new Date(s.date) >= start && new Date(s.date) < end);
  $('#week-count').replaceChildren(document.createTextNode(sessions.length + ' '), node('small', '', 'sesiones'));
  $('#minutes-count').replaceChildren(document.createTextNode(sessions.reduce((sum, s) => sum + s.minutes, 0) + ' '), node('small', '', 'min esta semana'));
  $('#goal').value = state.goal;
  $('#week-progress').textContent = `${sessions.length} / ${state.goal}`;
  $('#goal-progress').style.width = Math.min(100, sessions.length / state.goal * 100) + '%';
  const left = state.goal - sessions.length;
  $('#goal-message').textContent = left <= 0 ? 'Objetivo cumplido. ¡Buen trabajo esta semana!' : sessions.length ?
    `Te ${left === 1 ? 'falta 1 sesión' : 'faltan ' + left + ' sesiones'} para tu objetivo.` : 'Cada hábito empieza con la primera sesión.';
  const labels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  $('#week-days').replaceChildren(...labels.map((label, index) => {
    const date = new Date(start); date.setDate(date.getDate() + index);
    const trained = sessions.some(s => dayKey(s.date) === dayKey(date));
    const div = node('div', 'day' + (dayKey(date) === dayKey(new Date()) ? ' today' : '') + (trained ? ' trained' : ''));
    div.append(document.createTextNode(label), node('i', '', trained ? '✓' : date.getDate()));
    div.setAttribute('aria-label', `${label} ${date.getDate()}${trained ? ', entrenamiento registrado' : ''}`); return div;
  }));
}
$('#goal').addEventListener('change', () => { state.goal = Number($('#goal').value); save(); });
function renderHistory() {
  $('#total-count').textContent = state.sessions.length;
  const holder = $('#history-list'); holder.replaceChildren();
  if (!state.sessions.length) {
    const empty = node('div', 'empty-history');
    empty.append(node('h2', '', 'Tu historia empieza aquí.'), node('p', '', 'Elige una rutina y registra tu primera sesión.'));
    const browse = node('button', 'primary', 'Encontrar mi rutina ↗');
    browse.addEventListener('click', () => showView('routines')); empty.append(browse); holder.append(empty); return;
  }
  for (const s of [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date))) {
    const r = s.routineSnapshot;
    const row = node('article', 'history-row');
    const content = node('div');
    content.append(node('h3', '', r.name), node('p', '', `${new Date(s.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} · ${s.minutes} min · ${r.category}`));
    const remove = node('button', '', 'Eliminar');
    remove.setAttribute('aria-label', 'Eliminar registro de ' + r.name);
    remove.addEventListener('click', () => { state.sessions = state.sessions.filter(x => x.id !== s.id); const persisted = save(); toast(persisted ? 'Registro eliminado.' : 'Cambio aplicado solo durante esta visita.'); });
    row.append(node('span', 'history-icon', '✓'), content, remove); holder.append(row);
  }
}

let activeRoutine = null;
function openSession(r) {
  activeRoutine = r;
  $('#session-title').textContent = r.name;
  $('#session-meta').textContent = `${r.category} · ${r.minutes} min orientativos · ${r.level.toLowerCase()}`;
  $('#session-minutes').value = r.minutes;
  $('#exercise-list').replaceChildren(...r.exercises.map(([name, detail]) => {
    const label = node('label'); const check = node('input'); check.type = 'checkbox';
    const copy = node('span'); copy.append(node('strong', '', name), node('small', '', detail));
    check.addEventListener('change', updateFinishButton); label.append(check, copy); return label;
  }));
  updateFinishButton(); $('#session-dialog').showModal();
}
function updateFinishButton() {
  const checks = [...document.querySelectorAll('#exercise-list input')];
  const complete = checks.length > 0 && checks.every(c => c.checked);
  $('#finish-session').disabled = !complete;
  $('#finish-session').textContent = complete ? 'Registrar entrenamiento ✓' : `Ejercicios completados: ${checks.filter(c => c.checked).length} / ${checks.length}`;
}
$('#close-dialog').addEventListener('click', () => $('#session-dialog').close());
$('#session-form').addEventListener('submit', e => {
  e.preventDefault(); if (!activeRoutine || $('#finish-session').disabled) return;
  const minutes = Number($('#session-minutes').value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 300) { $('#session-minutes').reportValidity(); return; }
  state.sessions.push({ id: uniqueId(), routine: activeRoutine.id, date: new Date().toISOString(), minutes,
    routineSnapshot: { name: activeRoutine.name, category: activeRoutine.category } });
  const persisted = save(); $('#session-dialog').close(); activeRoutine = null;
  toast(persisted ? 'Entrenamiento registrado. ¡Una sesión más para ti!' : 'Sesión registrada solo durante esta visita.');
});

// The editor keeps its draft separate until the user chooses Save.
let editingId = null;
let draftRowNumber = 0;
function openEditor(routine = null) {
  if (!routine && state.customRoutines.length >= maxRoutines) { toast('Puedes guardar hasta 100 rutinas. Edita o elimina alguna para continuar.'); return; }
  editingId = routine?.id || null;
  $('#routine-form').reset(); $('#editor-error').textContent = '';
  $('#editor-title').textContent = editingId ? 'Editar rutina' : 'Crear rutina';
  $('#save-routine').textContent = editingId ? 'Guardar cambios ↗' : 'Guardar rutina ↗';
  $('#routine-name').value = routine?.name || '';
  $('#routine-category').value = routine?.category || 'Fuerza';
  $('#routine-minutes').value = routine?.minutes || 30;
  $('#routine-place').value = routine?.place || 'Gym';
  $('#routine-description').value = routine?.description || '';
  $('#editor-exercises').replaceChildren();
  for (const exercise of routine?.exercises || [['', '']]) addExerciseRow(exercise, false);
  updateExerciseRows(); $('#routine-editor').showModal(); $('#routine-name').focus();
}
function addExerciseRow(exercise = ['', ''], focus = true) {
  if ($('#editor-exercises').children.length >= maxExercises) return;
  const row = node('div', 'exercise-editor-row');
  const order = node('span', 'exercise-order'); order.setAttribute('aria-hidden', 'true');
  const fields = node('div', 'exercise-editor-inputs');
  const nameField = node('div', 'field'); const detailField = node('div', 'field');
  const nameId = 'exercise-name-' + (++draftRowNumber); const detailId = 'exercise-detail-' + draftRowNumber;
  const nameLabel = node('label', 'exercise-name-label'); nameLabel.htmlFor = nameId;
  const nameInput = node('input', 'exercise-name'); nameInput.id = nameId; nameInput.required = true;
  nameInput.maxLength = 80; nameInput.placeholder = 'Ej. Sentadilla'; nameInput.value = exercise[0];
  const detailLabel = node('label', 'exercise-detail-label'); detailLabel.htmlFor = detailId;
  const detailInput = node('input', 'exercise-detail'); detailInput.id = detailId; detailInput.required = true;
  detailInput.maxLength = 120; detailInput.placeholder = 'Ej. 3 × 12 o 5 minutos'; detailInput.value = exercise[1];
  nameField.append(nameLabel, nameInput); detailField.append(detailLabel, detailInput); fields.append(nameField, detailField);
  const tools = node('div', 'exercise-tools');
  for (const [action, text, className] of [['up', '↑', 'move-up'], ['down', '↓', 'move-down'], ['remove', '×', 'remove-exercise']]) {
    const button = node('button', className, text); button.type = 'button'; button.dataset.action = action; tools.append(button);
  }
  row.append(order, fields, tools); $('#editor-exercises').append(row); updateExerciseRows(); if (focus) nameInput.focus();
}
function updateExerciseRows() {
  const rows = [...$('#editor-exercises').children];
  rows.forEach((row, index) => {
    row.querySelector('.exercise-order').textContent = String(index + 1).padStart(2, '0');
    row.querySelector('.exercise-name-label').textContent = `Ejercicio ${index + 1} *`;
    row.querySelector('.exercise-detail-label').textContent = `Series o duración ${index + 1} *`;
    row.querySelector('.move-up').disabled = index === 0;
    row.querySelector('.move-up').setAttribute('aria-label', `Subir ejercicio ${index + 1}`);
    row.querySelector('.move-down').disabled = index === rows.length - 1;
    row.querySelector('.move-down').setAttribute('aria-label', `Bajar ejercicio ${index + 1}`);
    row.querySelector('.remove-exercise').disabled = rows.length === 1;
    row.querySelector('.remove-exercise').setAttribute('aria-label', `Quitar ejercicio ${index + 1}`);
  });
  $('#exercise-count').textContent = `${rows.length} / ${maxExercises}`;
  $('#add-exercise').disabled = rows.length >= maxExercises;
}
$('#editor-exercises').addEventListener('click', e => {
  const button = e.target.closest('button[data-action]'); if (!button) return;
  const row = button.closest('.exercise-editor-row'); const action = button.dataset.action;
  let focusTarget = button;
  if (action === 'up' && row.previousElementSibling) row.previousElementSibling.before(row);
  else if (action === 'down' && row.nextElementSibling) row.nextElementSibling.after(row);
  else if (action === 'remove' && $('#editor-exercises').children.length > 1) {
    focusTarget = (row.nextElementSibling || row.previousElementSibling).querySelector('.exercise-name'); row.remove();
  }
  updateExerciseRows();
  if (focusTarget.disabled) focusTarget = row.querySelector('.exercise-name');
  focusTarget.focus();
});
$('#add-exercise').addEventListener('click', () => addExerciseRow());
document.querySelectorAll('[data-create-routine]').forEach(b => b.addEventListener('click', () => openEditor()));
$('#close-editor').addEventListener('click', () => $('#routine-editor').close());
$('#cancel-editor').addEventListener('click', () => $('#routine-editor').close());
$('#routine-form').addEventListener('submit', e => {
  e.preventDefault(); $('#editor-error').textContent = '';
  const name = $('#routine-name').value.trim();
  if (!name) { $('#editor-error').textContent = 'Escribe un nombre para tu rutina.'; $('#routine-name').focus(); return; }
  const exercises = [...$('#editor-exercises').children].map(row => [row.querySelector('.exercise-name').value.trim(), row.querySelector('.exercise-detail').value.trim()]);
  const incomplete = exercises.findIndex(([title, detail]) => !title || !detail);
  if (incomplete !== -1) {
    $('#editor-error').textContent = `Completa el nombre y las series o duración del ejercicio ${incomplete + 1}.`;
    $('#editor-exercises').children[incomplete].querySelector(!exercises[incomplete][0] ? '.exercise-name' : '.exercise-detail').focus(); return;
  }
  const routine = { id: editingId || 'custom-' + uniqueId(), name,
    category: $('#routine-category').value, minutes: Number($('#routine-minutes').value),
    place: $('#routine-place').value, description: $('#routine-description').value.trim(), exercises };
  if (!validCustomRoutine(routine)) { $('#editor-error').textContent = 'Revisa la duración (1–300 minutos) y los ejercicios (1–20).'; return; }
  const isEdit = !!editingId;
  if (isEdit) {
    const index = state.customRoutines.findIndex(r => r.id === editingId);
    if (index === -1) { $('#editor-error').textContent = 'Esta rutina ya no está disponible. Cierra el editor y crea una nueva.'; return; }
    state.customRoutines[index] = routine;
  } else {
    if (state.customRoutines.length >= maxRoutines) { $('#editor-error').textContent = 'Llegaste al límite de 100 rutinas.'; return; }
    state.customRoutines.push(routine);
  }
  const persisted = save(); $('#routine-editor').close(); showView('custom');
  toast(persisted ? (isEdit ? 'Rutina actualizada. Tu plan sigue creciendo.' : 'Rutina creada. ¡Ya puedes entrenar con ella!') : 'Rutina disponible durante esta visita; no se pudo guardar.');
});
let deletingId = null;
function requestDelete(routine) {
  deletingId = routine.id; $('#delete-routine-name').textContent = routine.name; $('#delete-routine-dialog').showModal();
}
$('#close-delete').addEventListener('click', () => $('#delete-routine-dialog').close());
$('#cancel-delete').addEventListener('click', () => $('#delete-routine-dialog').close());
$('#confirm-delete').addEventListener('click', () => {
  if (!deletingId) return;
  state.customRoutines = state.customRoutines.filter(r => r.id !== deletingId);
  const persisted = save(); $('#delete-routine-dialog').close(); deletingId = null;
  toast(persisted ? 'Rutina eliminada. Tu historial se conserva.' : 'Cambio aplicado solo durante esta visita.');
});
let duration=60,remaining=60,deadline=0,timer=null;
function drawTimer(){$('#timer-display').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;}
function pauseTimer(){if(timer){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));clearInterval(timer);timer=null;}$('#timer-toggle').textContent='Continuar';drawTimer();}
function resetTimer(){clearInterval(timer);timer=null;remaining=duration;$('#timer-toggle').textContent='Iniciar';$('#timer-status').textContent='Un respiro y seguimos.';drawTimer();}
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));drawTimer();if(!remaining){clearInterval(timer);timer=null;$('#timer-toggle').textContent='Repetir';$('#timer-status').textContent='Descanso terminado. Sigue cuando estés listo.';toast('Tu descanso ha terminado.');}}
$('#timer-toggle').addEventListener('click',()=>{if(timer){pauseTimer();$('#timer-status').textContent='Descanso en pausa.';return;}if(!remaining)remaining=duration;deadline=Date.now()+remaining*1000;timer=setInterval(tick,200);$('#timer-toggle').textContent='Pausar';$('#timer-status').textContent='Respira. El tiempo es tuyo.';tick();});
$('#timer-reset').addEventListener('click',resetTimer);
document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{duration=Number(b.dataset.seconds);document.querySelectorAll('[data-seconds]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});resetTimer();}));
$('#today').textContent = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
renderStats(); renderHistory(); renderCustom(); showView(location.hash.slice(1)); showStorageWarning();
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
const ideaURL = new URL(location.href);
const requestedIdea = ideaURL.searchParams.get('idea');
if (requestedIdea && typeof ideaLibrary !== 'undefined') {
  const idea = ideaLibrary.find(item => item.id === requestedIdea);
  ideaURL.searchParams.delete('idea');
  history.replaceState(null, '', ideaURL);
  if (idea) {
    showView('custom');
    openEditor({ name: idea.title, category: idea.category, place: idea.place, minutes: idea.minutes,
      description: idea.description, exercises: idea.exercises.map(name => [name, '']) });
    toast('Idea abierta como borrador. Define las series o duración de tus ejercicios antes de guardar.');
  }
}

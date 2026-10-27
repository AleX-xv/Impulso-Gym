'use strict';
const select = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
let requestController = null;
let requestNumber = 0;
let lastCatalogIdea = null;
const catalogCache = new Map();
function externalLink(text, href, className) {
  const link = make('a', className, text);
  link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}
function youtubeURL(query) {
  const url = new URL('https://www.youtube.com/results');
  url.searchParams.set('search_query', query);
  return url.href;
}
function routineVideoQuery(topic) {
  const prefix = /^(en |sin )/i.test(topic) ? 'rutina ' : 'rutina de ';
  return (/rutina|entrenamiento/i.test(topic) ? topic : prefix + topic) + ' en español';
}
function ideaCard(idea) {
  const card = make('article', 'idea-card');
  card.style.setProperty('--idea-color', idea.color); card.style.setProperty('--idea-ink', idea.ink);
  const visual = make('div', 'idea-visual'); visual.setAttribute('aria-hidden', 'true');
  visual.append(make('span', 'idea-symbol', idea.symbol), make('span', 'idea-group', idea.group.toUpperCase()));
  const body = make('div', 'idea-body');
  const tags = make('div', 'idea-tags'); tags.append(make('span', '', idea.place), make('span', '', idea.category));
  body.append(tags, make('h3', '', idea.title), make('p', '', idea.description));
  const list = make('ul', 'idea-movements');
  idea.exercises.forEach(name => list.append(make('li', '', name)));
  body.append(list);
  const youtube = externalLink('▷ Buscar videos en YouTube', youtubeURL(routineVideoQuery(idea.group)), 'idea-youtube');
  const use = make('a', 'use-idea', '＋ Usar esta idea');
  use.href = 'index.html?idea=' + encodeURIComponent(idea.id) + '#custom';
  body.append(youtube, use); card.append(visual, body); return card;
}
function renderIdeas(ideas) {
  select('#routine-ideas').replaceChildren(...ideas.map(ideaCard));
  select('#routine-ideas').classList.toggle('single-result', ideas.length === 1);
  select('#ideas-empty').hidden = ideas.length !== 0;
}
function matchIdeas(query) {
  const term = normalize(query);
  return ideaLibrary.filter(idea => idea.terms.some(alias => term.includes(normalize(alias))) ||
    normalize(idea.title).includes(term));
}
function resetCatalog() {
  requestController?.abort(); requestController = null; requestNumber++;
  select('#catalog-exercises').replaceChildren(); select('#catalog-exercises').setAttribute('aria-busy', 'false');
  select('#retry-catalog').hidden = true;
}
function startSearch(rawQuery) {
  const query = rawQuery.trim().slice(0, 100);
  select('#search-error').textContent = '';
  if (query.length < 2) { select('#search-error').textContent = 'Escribe al menos dos letras para buscar.'; select('#ideas-query').focus(); return; }
  select('#ideas-query').value = query;
  const matches = matchIdeas(query);
  renderIdeas(matches);
  select('#ideas-results-title').textContent = matches.length ? `Ideas para «${query}».` : `Tu búsqueda: «${query}».`;
  select('#clear-search').hidden = false;
  document.querySelectorAll('[data-topic]').forEach(button => {
    const selected = normalize(button.dataset.topic) === normalize(query);
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
  });
  select('#youtube-search-title').textContent = 'Videos: ' + query;
  select('#youtube-query-link').href = youtubeURL(routineVideoQuery(query));
  select('#youtube-search-banner').hidden = false;
  const pageURL = new URL(location.href); pageURL.searchParams.set('q', query); history.replaceState(null, '', pageURL);
  if (matches.length) {
    const mainMatch = matches.find(idea => idea.apiCategory) || matches[0];
    loadCatalog(mainMatch);
  } else {
    resetCatalog(); select('#exercise-catalog').hidden = true;
  }
}
select('#ideas-search').addEventListener('submit', event => { event.preventDefault(); startSearch(select('#ideas-query').value); });
document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => startSearch(button.dataset.topic)));
select('#clear-search').addEventListener('click', () => {
  resetCatalog(); select('#exercise-catalog').hidden = true; select('#youtube-search-banner').hidden = true;
  select('#ideas-query').value = ''; select('#ideas-results-title').textContent = 'Explora ideas de rutinas.';
  select('#clear-search').hidden = true; select('#search-error').textContent = '';
  document.querySelectorAll('[data-topic]').forEach(button => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); });
  const pageURL = new URL(location.href); pageURL.searchParams.delete('q'); history.replaceState(null, '', pageURL);
  renderIdeas(ideaLibrary);
});
const equipmentNames = { 'Barbell': 'Barra', 'Dumbbell': 'Mancuernas', 'Bench': 'Banco', 'Pull-up bar': 'Barra de dominadas', 'none (bodyweight exercise)': 'Peso corporal', 'Kettlebell': 'Kettlebell' };
function catalogCard(exercise) {
  const translated = exercise.translations.find(t => t.language === 4 && typeof t.name === 'string') ||
    exercise.translations.find(t => t.language === 2 && typeof t.name === 'string');
  if (!translated) return null;
  const card = make('article', 'catalog-card');
  const top = make('div', 'catalog-card-top');
  top.append(make('span', 'catalog-label', 'EJERCICIO PARA EXPLORAR'), make('span', 'catalog-play', '▷'));
  card.append(top, make('h3', '', translated.name));
  const equipment = Array.isArray(exercise.equipment) ? exercise.equipment.filter(e => typeof e.name === 'string').map(e => equipmentNames[e.name] || e.name).join(', ') : '';
  card.append(make('p', 'catalog-equipment', equipment ? 'Equipo: ' + equipment : 'Equipo sin especificar'));
  if (translated.language !== 4) card.append(make('span', 'english-label', 'Nombre en inglés'));
  const credits = make('p', 'exercise-credits');
  const source = externalLink('wger', `https://wger.de/en/exercise/${exercise.id}/view/`, '');
  credits.append(document.createTextNode('Fuente: '), source);
  const authors = Array.isArray(translated.author_history) ? translated.author_history.filter(a => typeof a === 'string') : [];
  const author = authors.length ? [...new Set(authors)].join(', ') : translated.license_author || exercise.license_author;
  if (typeof author === 'string' && author) credits.append(document.createTextNode(' · Autor: ' + author));
  const license = exercise.license;
  if (license && translated.license === license.id && typeof license.url === 'string') {
    try {
      const licenseURL = new URL(license.url);
      if (licenseURL.protocol === 'https:' && licenseURL.hostname === 'creativecommons.org') {
        credits.append(document.createTextNode(' · '), externalLink(license.short_name || 'Licencia', licenseURL.href, ''));
      }
    } catch { /* La ficha conserva el enlace a los créditos originales. */ }
  } else credits.append(document.createTextNode(' · Licencia en la fuente'));
  card.append(externalLink('Buscar técnica en YouTube ↗', youtubeURL(translated.name + ' ejercicio técnica en español'), 'catalog-youtube'), credits);
  return card;
}
async function loadCatalog(idea) {
  resetCatalog(); lastCatalogIdea = idea;
  const controller = new AbortController(); requestController = controller;
  const number = requestNumber;
  select('#exercise-catalog').hidden = false;
  select('#catalog-title').textContent = idea.id === 'casa' ? 'Ejercicios etiquetados como peso corporal.' : 'Ejercicios para ' + idea.group.toLowerCase() + '.';
  select('#catalog-exercises').setAttribute('aria-busy', 'true');
  select('#catalog-status').textContent = 'Consultando ejercicios relacionados…';
  const timeout = setTimeout(() => controller.abort(), 15000);
  const url = new URL('https://wger.de/api/v2/exerciseinfo/');
  url.searchParams.set('limit', '12');
  if (idea.apiCategory) url.searchParams.set('category', String(idea.apiCategory));
  if (idea.apiEquipment) url.searchParams.set('equipment', String(idea.apiEquipment));
  const cacheKey = url.href;
  try {
    let data = catalogCache.get(cacheKey);
    if (!data) {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : 'request-failed');
      data = await response.json();
      if (!data || !Array.isArray(data.results)) throw new Error('invalid-response');
      catalogCache.set(cacheKey, data);
    }
    if (number !== requestNumber) return;
    const exercises = data.results.filter(e => e && Number.isInteger(e.id) && Array.isArray(e.translations));
    // Prefiere traducciones al español sin modificar el contenido de la fuente.
    exercises.sort((a, b) => Number(b.translations.some(t => t.language === 4)) - Number(a.translations.some(t => t.language === 4)));
    const cards = exercises.map(catalogCard).filter(Boolean).slice(0, 6);
    select('#catalog-exercises').replaceChildren(...cards);
    select('#catalog-status').textContent = cards.length ? `${cards.length} ejercicios consultados en wger. Abre sus búsquedas para explorar la técnica en video.` : 'No encontramos ejercicios en español o inglés para este tema. Puedes continuar buscando videos en YouTube.';
  } catch (error) {
    if (number !== requestNumber) return;
    select('#catalog-status').textContent = error.message === 'rate-limit' ? 'El catálogo recibió demasiadas consultas. Espera un momento y vuelve a intentarlo.' : 'No se pudo consultar el catálogo. Revisa la conexión o reintenta. Las ideas y los enlaces a YouTube siguen disponibles.';
    select('#retry-catalog').hidden = false;
  } finally {
    clearTimeout(timeout);
    if (number === requestNumber) { select('#catalog-exercises').setAttribute('aria-busy', 'false'); requestController = null; }
  }
}
select('#retry-catalog').addEventListener('click', () => { if (lastCatalogIdea) loadCatalog(lastCatalogIdea); });
renderIdeas(ideaLibrary);
const initialQuery = new URLSearchParams(location.search).get('q');
if (initialQuery?.trim().length >= 2) startSearch(initialQuery);

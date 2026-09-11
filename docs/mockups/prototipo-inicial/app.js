const requests = [
  { id: 'casa', type: 'materials', tag: 'MATERIALES', zone: 'Soacha', urgency: 'Alta', title: 'Techo y paredes para vivienda afectada', text: 'Se necesitan láminas, perfiles livianos y apoyo para reparar una habitación. La familia cuenta con acompañamiento comunitario.', date: 'Actualizada hoy', signal: 'Información declarada por la persona responsable.' },
  { id: 'mocoa', type: 'labor', tag: 'MANO DE OBRA', zone: 'Mocoa', urgency: 'Media', title: 'Apoyo para reparar baño familiar', text: 'Hogar con afectación parcial busca una cuadrilla voluntaria para una jornada de reparación.', date: 'Actualizada ayer', signal: 'Zona aproximada declarada. Sin contacto público.' },
  { id: 'cocina', type: 'home', tag: 'ENSERES', zone: 'Soacha', urgency: 'Media', title: 'Enseres básicos para cocina', text: 'Se requieren ollas, platos y utensilios en buen estado para retomar las actividades del hogar.', date: 'Actualizada hace 2 días', signal: 'La solicitud continúa activa.' },
  { id: 'plano', type: 'technical', tag: 'ASESORÍA TÉCNICA', zone: 'Mocoa', urgency: 'Alta', title: 'Orientación sobre reparación segura', text: 'La familia busca acompañamiento profesional para entender opciones de reparación antes de iniciar obra.', date: 'Actualizada hace 3 días', signal: 'Necesidad declarada por la familia.' }
];

let activeFilter = 'all';
let selectedRequest = requests[0];
let publishStep = 1;
let pendingEvidenceImages = [];
let locationMarked = false;
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

function tagClass(type) { return type === 'materials' ? 'materials' : type; }

function renderRequests(list = null) {
  const visible = list || requests.filter(item => activeFilter === 'all' || item.type === activeFilter);
  $('#request-list').innerHTML = visible.map(item => `
    <article class="request-card" tabindex="0" data-request="${item.id}" aria-label="Ver solicitud: ${item.title}">
      <div class="card-top"><span class="tag ${tagClass(item.type)}">${item.tag}</span><span class="urgency">Urgencia ${item.urgency.toLowerCase()}</span></div>
      <h2>${item.title}</h2><p>${item.zone} · ${item.date}</p>
      <div class="card-footer"><span>⌖ Zona aproximada</span><span>Ver detalle →</span></div>
    </article>`).join('') || '<p class="helper">No encontramos publicaciones con este filtro.</p>';
}

function renderDetail() {
  const r = selectedRequest;
  const gallery = r.evidenceImages?.length ? `<section class="evidence-section"><h2>Imágenes de apoyo</h2><div class="detail-gallery">${r.evidenceImages.map(image => `<figure><img src="${image.url}" alt="Imagen aportada para verificar la publicación: ${image.name}" /></figure>`).join('')}</div></section>` : '';
  $('#detail-content').innerHTML = `
    <div class="detail-hero" aria-label="Imagen ilustrativa de una vivienda en reconstrucción"></div>
    <div class="detail-info"><div class="card-top"><span class="tag ${tagClass(r.type)}">${r.tag}</span><span class="urgency">Urgencia ${r.urgency.toLowerCase()}</span></div>
    <h1 id="detail-title">${r.title}</h1><div class="meta"><span>⌖ ${r.zone}, zona aproximada</span><span>◷ ${r.date}</span></div><p>${r.text}</p>
    <div class="signal"><span>✦</span><div><b>Lo que sabemos</b><br>${r.signal} Reconstruye no garantiza a las personas, los aportes ni las obras.</div></div>${gallery}</div>
    <div class="action-area"><button class="primary wide" id="contact-button" type="button">Contactar con cuidado</button><button class="safety-link" type="button" data-route="safety">Ver recomendaciones de seguridad</button></div>`;
}

function route(name) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === name));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.route === name));
  if (name === 'detail') renderDetail();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message) {
  const element = $('.toast'); element.textContent = message; element.classList.add('show');
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => element.classList.remove('show'), 3300);
}

function setPublishStep(step) {
  publishStep = Math.min(3, Math.max(1, step));
  $$('.form-step').forEach(section => section.classList.toggle('active', Number(section.dataset.step) === publishStep));
  $$('.stepper .step').forEach((element, index) => element.classList.toggle('active', index + 1 <= publishStep));
}

document.addEventListener('click', event => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) { route(routeButton.dataset.route); return; }
  const chip = event.target.closest('.chip');
  if (chip) { activeFilter = chip.dataset.filter; $$('.chip').forEach(item => item.classList.toggle('selected', item === chip)); renderRequests(); return; }
  const card = event.target.closest('[data-request]');
  if (card) { selectedRequest = requests.find(item => item.id === card.dataset.request); route('detail'); return; }
  if (event.target.closest('.next-step')) {
    const currentStep = $('.form-step.active');
    const firstInvalid = [...currentStep.querySelectorAll('[required]')].find(field => !field.checkValidity());
    if (firstInvalid) { firstInvalid.reportValidity(); return; }
    setPublishStep(publishStep + 1); return;
  }
  if (event.target.closest('.prev-step')) { setPublishStep(publishStep - 1); return; }
  if (event.target.closest('#map-location')) {
    locationMarked = true;
    $('#map-status').textContent = 'Zona aproximada marcada. Podrás modificarla antes de publicar.';
    $('#map-status').classList.add('selected');
    return;
  }
  if (event.target.closest('#contact-button')) { $('#contact-modal').classList.add('open'); $('#contact-modal').setAttribute('aria-hidden', 'false'); return; }
  if (event.target.closest('.modal-close')) { $('#contact-modal').classList.remove('open'); $('#contact-modal').setAttribute('aria-hidden', 'true'); return; }
  const toastButton = event.target.closest('[data-toast]');
  if (toastButton) toast(toastButton.dataset.toast);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('.request-card')) event.target.click();
  if (event.key === 'Escape') { $('#contact-modal').classList.remove('open'); $('#contact-modal').setAttribute('aria-hidden', 'true'); }
});

$('#filter-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget); const help = data.getAll('help'); const zone = data.get('zone'); const urgency = data.get('urgency');
  const filtered = requests.filter(item => (!help.length || help.includes(item.type)) && (zone === 'all' || item.zone === zone) && (urgency === 'all' || item.urgency === urgency));
  activeFilter = 'all'; $$('.chip').forEach(chip => chip.classList.toggle('selected', chip.dataset.filter === 'all'));
  renderRequests(filtered); route('home'); toast(`${filtered.length} publicación${filtered.length === 1 ? '' : 'es'} encontrada${filtered.length === 1 ? '' : 's'}.`);
});

$('#publish-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const category = form.querySelector('select[required]').value;
  const categoryType = { Materiales: 'materials', 'Mano de obra': 'labor', 'Enseres esenciales': 'home', 'Asesoría técnica': 'technical' }[category] || 'materials';
  const publicationType = form.querySelector('[name="publicationType"]:checked').value;
  requests.unshift({
    id: `publicacion-${Date.now()}`,
    type: categoryType,
    tag: publicationType === 'offer' ? 'OFERTA DE APOYO' : category.toUpperCase(),
    zone: form.querySelector('[name="zone"]').value,
    urgency: form.querySelectorAll('select')[1].value,
    title: publicationType === 'offer' ? `Oferta de ${category.toLowerCase()}` : `Solicitud de ${category.toLowerCase()}`,
    text: form.querySelector('textarea').value,
    date: 'Publicada ahora',
    signal: locationMarked ? 'La persona indicó una zona aproximada mediante el mapa.' : 'Información declarada por la persona responsable.',
    evidenceImages: pendingEvidenceImages
  });
  form.reset(); pendingEvidenceImages = []; locationMarked = false; $('#upload-preview').innerHTML = ''; $('#map-status').textContent = 'Aún no se ha marcado una ubicación.'; $('#map-status').classList.remove('selected');
  setPublishStep(1); activeFilter = 'all'; renderRequests(); route('home'); toast('Publicación registrada. Las imágenes se verán en su detalle.');
});

$('#evidence-images').addEventListener('change', event => {
  pendingEvidenceImages = [...event.target.files].map(file => ({ url: URL.createObjectURL(file), name: file.name }));
  $('#upload-preview').innerHTML = pendingEvidenceImages.map(image => `<figure><img src="${image.url}" alt="Vista previa de ${image.name}" /><figcaption>${image.name}</figcaption></figure>`).join('');
});

$('#contact-consent').addEventListener('change', event => { $('#contact-confirm').disabled = !event.target.checked; });
$('#contact-confirm').addEventListener('click', () => { $('#contact-modal').classList.remove('open'); $('#contact-modal').setAttribute('aria-hidden', 'true'); toast('En el producto real, aquí se abriría WhatsApp con un mensaje editable.'); });

renderRequests();

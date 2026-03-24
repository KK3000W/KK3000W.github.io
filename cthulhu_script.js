/* ═══════════════════════════════════════════════════
   ARKHAM CHRONICLES — script.js
   ═══════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════
//  STORAGE — Todo se guarda en localStorage
// ══════════════════════════════════════════════════
const STORE = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ══════════════════════════════════════════════════
//  FONDO: PARTÍCULAS TENTACULARES
// ══════════════════════════════════════════════════
(function initBg() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.003 + 0.001,
      drift: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '107,58,26' : '74,124,89',
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.a += p.speed;
      p.x += Math.cos(p.a) * p.drift;
      p.y += Math.sin(p.a * 0.7) * 0.15;
      if (p.y > canvas.height + 10) p.y = -10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.x < -10) p.x = canvas.width + 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ══════════════════════════════════════════════════
//  NAVEGACIÓN PRINCIPAL
// ══════════════════════════════════════════════════
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const sec = btn.dataset.section;
    document.querySelectorAll('.section').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const target = document.getElementById('sec-' + sec);
    target.classList.remove('hidden');
    target.classList.add('active');
  });
});

// ══════════════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════════════
let modalResolve = null;

function showModal(title, bodyHTML, okText = 'Aceptar') {
  return new Promise(resolve => {
    modalResolve = resolve;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-ok').textContent = okText;
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}
function closeModal(val) {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (modalResolve) modalResolve(val);
  modalResolve = null;
}
document.getElementById('modal-cancel').addEventListener('click', () => closeModal(null));
document.getElementById('modal-ok').addEventListener('click', () => {
  // Recoger todos los inputs del modal
  const inputs = document.querySelectorAll('#modal-body .modal-input, #modal-body .modal-textarea, #modal-body .modal-select');
  const result = {};
  inputs.forEach(el => { result[el.dataset.key] = el.value; });
  closeModal(result);
});

// ══════════════════════════════════════════════════
//  SECCIÓN: HISTORIAS
// ══════════════════════════════════════════════════
let historiasData = STORE.get('historias') || [];
let historiaActual = null;

function saveHistorias() { STORE.set('historias', historiasData); }

function renderHistoriasGrid() {
  const grid = document.getElementById('historias-grid');
  if (historiasData.length === 0) {
    grid.innerHTML = '<div class="historia-empty">☽ Ninguna historia aún. Crea tu primera campaña.</div>';
    return;
  }
  grid.innerHTML = historiasData.map(h => `
    <div class="historia-card" data-id="${h.id}">
      <div class="historia-card-title">${h.titulo}</div>
      <div class="historia-card-desc">${h.descripcion || 'Sin descripción'}</div>
      <div class="historia-card-meta">
        <span>🗺 ${(h.mapas || []).length}</span>
        <span>📝 ${(h.notas || []).length}</span>
        <span>⚔ ${(h.items || []).length}</span>
        <span>👥 ${(h.npcs || []).length}</span>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.historia-card').forEach(card => {
    card.addEventListener('click', () => abrirHistoria(card.dataset.id));
  });
}

document.getElementById('btn-nueva-historia').addEventListener('click', async () => {
  const result = await showModal('Nueva Historia', `
    <label class="modal-label">TÍTULO</label>
    <input class="modal-input" data-key="titulo" placeholder="El Horror de Dunwich..."/>
    <label class="modal-label">DESCRIPCIÓN</label>
    <textarea class="modal-textarea" data-key="descripcion" placeholder="Breve descripción de la campaña..."></textarea>
  `, 'Crear');
  if (!result || !result.titulo?.trim()) return;
  const h = {
    id: Date.now().toString(),
    titulo: result.titulo.trim(),
    descripcion: result.descripcion?.trim() || '',
    mapas: [], notas: [], items: [], npcs: [],
    creada: new Date().toLocaleDateString('es-ES'),
  };
  historiasData.push(h);
  saveHistorias();
  renderHistoriasGrid();
});

function abrirHistoria(id) {
  historiaActual = historiasData.find(h => h.id === id);
  if (!historiaActual) return;
  document.getElementById('historias-grid').classList.add('hidden');
  document.getElementById('btn-nueva-historia').style.display = 'none';
  document.querySelector('.section-header').querySelector('h2').textContent = '';
  document.getElementById('historia-detalle').classList.remove('hidden');
  document.getElementById('detalle-titulo').textContent = historiaActual.titulo;
  // Reset tabs
  document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
  document.querySelector('.dtab[data-tab="mapas"]').classList.add('active');
  document.getElementById('tab-mapas').classList.add('active');
  document.getElementById('tab-mapas').classList.remove('hidden');
  renderMapas(); renderNotas(); renderItems(); renderNPCs();
}

document.getElementById('btn-volver').addEventListener('click', () => {
  historiaActual = null;
  document.getElementById('historia-detalle').classList.add('hidden');
  document.getElementById('historias-grid').classList.remove('hidden');
  document.getElementById('btn-nueva-historia').style.display = '';
  document.querySelector('.section-header').querySelector('h2').textContent = '📜 Mis Historias';
  renderHistoriasGrid();
});

document.getElementById('btn-eliminar-historia').addEventListener('click', async () => {
  const r = await showModal('¿Eliminar historia?', `<p style="color:var(--text)">Se eliminará "<strong>${historiaActual.titulo}</strong>" y todo su contenido. Esta acción no se puede deshacer.</p>`, 'Eliminar');
  if (r === null) return;
  historiasData = historiasData.filter(h => h.id !== historiaActual.id);
  saveHistorias();
  document.getElementById('btn-volver').click();
});

// Tabs detalle
document.querySelectorAll('.dtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    const panel = document.getElementById('tab-' + tab.dataset.tab);
    panel.classList.add('active'); panel.classList.remove('hidden');
  });
});

// ─── MAPAS ───
function renderMapas() {
  const grid = document.getElementById('mapas-grid');
  if (!historiaActual.mapas?.length) { grid.innerHTML = '<p style="color:var(--muted);font-style:italic;padding:20px">No hay mapas. Añade imágenes.</p>'; return; }
  grid.innerHTML = historiaActual.mapas.map((m, i) => `
    <div class="media-item">
      <img src="${m.data}" alt="${m.nombre}" loading="lazy"/>
      <div class="media-item-name">${m.nombre}</div>
      <button class="media-item-del" data-idx="${i}">✕</button>
    </div>
  `).join('');
  grid.querySelectorAll('.media-item img').forEach((img, i) => {
    img.addEventListener('click', () => {
      document.getElementById('img-viewer-img').src = historiaActual.mapas[i].data;
      document.getElementById('img-viewer-caption').textContent = historiaActual.mapas[i].nombre;
      document.getElementById('img-viewer').classList.remove('hidden');
    });
  });
  grid.querySelectorAll('.media-item-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      historiaActual.mapas.splice(parseInt(btn.dataset.idx), 1);
      saveHistorias(); renderMapas();
    });
  });
}
document.getElementById('input-mapa').addEventListener('change', function () {
  const files = Array.from(this.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!historiaActual.mapas) historiaActual.mapas = [];
      historiaActual.mapas.push({ nombre: file.name, data: e.target.result });
      saveHistorias(); renderMapas();
    };
    reader.readAsDataURL(file);
  });
  this.value = '';
});
document.getElementById('img-viewer-close').addEventListener('click', () => {
  document.getElementById('img-viewer').classList.add('hidden');
});

// ─── NOTAS ───
function renderNotas() {
  const list = document.getElementById('notas-list');
  if (!historiaActual.notas?.length) { list.innerHTML = '<p style="color:var(--muted);font-style:italic;padding:20px">No hay notas.</p>'; return; }
  list.innerHTML = historiaActual.notas.map((n, i) => `
    <div class="nota-card">
      <div class="nota-header">
        <span class="nota-titulo">${n.titulo}</span>
        <button class="btn-del-small" data-idx="${i}">✕</button>
      </div>
      <div class="nota-texto">${n.texto}</div>
      <div class="nota-fecha">${n.fecha}</div>
    </div>
  `).join('');
  list.querySelectorAll('.btn-del-small').forEach(btn => {
    btn.addEventListener('click', () => {
      historiaActual.notas.splice(parseInt(btn.dataset.idx), 1);
      saveHistorias(); renderNotas();
    });
  });
}
document.getElementById('btn-nueva-nota').addEventListener('click', async () => {
  const r = await showModal('Nueva Nota', `
    <label class="modal-label">TÍTULO</label>
    <input class="modal-input" data-key="titulo" placeholder="Sesión 3 - El Sótano..."/>
    <label class="modal-label">CONTENIDO</label>
    <textarea class="modal-textarea" data-key="texto" placeholder="Escribe aquí las notas de la sesión..."></textarea>
  `, 'Guardar');
  if (!r || !r.titulo?.trim()) return;
  if (!historiaActual.notas) historiaActual.notas = [];
  historiaActual.notas.push({ titulo: r.titulo.trim(), texto: r.texto?.trim() || '', fecha: new Date().toLocaleString('es-ES') });
  saveHistorias(); renderNotas();
});

// ─── ITEMS ───
function renderItems() {
  const list = document.getElementById('items-list');
  if (!historiaActual.items?.length) { list.innerHTML = '<p style="color:var(--muted);font-style:italic;padding:20px">No hay items.</p>'; return; }
  list.innerHTML = historiaActual.items.map((item, i) => `
    <div class="item-card">
      <div class="item-header">
        <div>
          <div class="item-tipo">[${item.tipo}]</div>
          <div class="item-nombre">${item.nombre}</div>
        </div>
        <button class="btn-del-small" data-idx="${i}">✕</button>
      </div>
      <div class="item-desc">${item.desc}</div>
    </div>
  `).join('');
  list.querySelectorAll('.btn-del-small').forEach(btn => {
    btn.addEventListener('click', () => {
      historiaActual.items.splice(parseInt(btn.dataset.idx), 1);
      saveHistorias(); renderItems();
    });
  });
}
document.getElementById('btn-nuevo-item').addEventListener('click', async () => {
  const r = await showModal('Nuevo Item', `
    <label class="modal-label">TIPO</label>
    <select class="modal-select" data-key="tipo">
      <option>Arma</option><option>Objeto Mágico</option><option>Tomo</option>
      <option>Equipo</option><option>Artefacto Mítco</option><option>Otro</option>
    </select>
    <label class="modal-label">NOMBRE</label>
    <input class="modal-input" data-key="nombre" placeholder="Revólver .38..."/>
    <label class="modal-label">DESCRIPCIÓN</label>
    <textarea class="modal-textarea" data-key="desc" placeholder="Descripción del objeto..."></textarea>
  `, 'Añadir');
  if (!r || !r.nombre?.trim()) return;
  if (!historiaActual.items) historiaActual.items = [];
  historiaActual.items.push({ tipo: r.tipo, nombre: r.nombre.trim(), desc: r.desc?.trim() || '' });
  saveHistorias(); renderItems();
});

// ─── NPCs ───
function renderNPCs() {
  const list = document.getElementById('npcs-list');
  if (!historiaActual.npcs?.length) { list.innerHTML = '<p style="color:var(--muted);font-style:italic;padding:20px">No hay personajes / NPCs.</p>'; return; }
  list.innerHTML = historiaActual.npcs.map((npc, i) => `
    <div class="npc-card">
      <div class="npc-header">
        <div>
          <div class="npc-rol">[${npc.rol}]</div>
          <div class="npc-nombre">${npc.nombre}</div>
        </div>
        <button class="btn-del-small" data-idx="${i}">✕</button>
      </div>
      <div class="npc-desc">${npc.desc}</div>
    </div>
  `).join('');
  list.querySelectorAll('.btn-del-small').forEach(btn => {
    btn.addEventListener('click', () => {
      historiaActual.npcs.splice(parseInt(btn.dataset.idx), 1);
      saveHistorias(); renderNPCs();
    });
  });
}
document.getElementById('btn-nuevo-npc').addEventListener('click', async () => {
  const r = await showModal('Nuevo Personaje / NPC', `
    <label class="modal-label">ROL</label>
    <select class="modal-select" data-key="rol">
      <option>Aliado</option><option>Enemigo</option><option>Neutral</option>
      <option>Monstruo</option><option>Investigador</option><option>Otro</option>
    </select>
    <label class="modal-label">NOMBRE</label>
    <input class="modal-input" data-key="nombre" placeholder="Prof. Armitage..."/>
    <label class="modal-label">DESCRIPCIÓN / NOTAS</label>
    <textarea class="modal-textarea" data-key="desc" placeholder="Descripción, stats, motivaciones..."></textarea>
  `, 'Añadir');
  if (!r || !r.nombre?.trim()) return;
  if (!historiaActual.npcs) historiaActual.npcs = [];
  historiaActual.npcs.push({ rol: r.rol, nombre: r.nombre.trim(), desc: r.desc?.trim() || '' });
  saveHistorias(); renderNPCs();
});

// ══════════════════════════════════════════════════
//  SECCIÓN: DADOS
// ══════════════════════════════════════════════════
const DADOS_CONFIG = { D4: 4, D6: 6, D8: 8, D10: 10, D12: 12, D20: 20, D100: 100 };
const dadosCantidad = { D4: 0, D6: 0, D8: 0, D10: 0, D12: 0, D20: 0, D100: 0 };
let modificador = 0;
let historialTiradas = STORE.get('historial_dados') || [];

function tirarDado(caras) {
  return Math.floor(Math.random() * caras) + 1;
}

// Controles cantidad
document.querySelectorAll('.qty-btn[data-d]').forEach(btn => {
  btn.addEventListener('click', () => {
    const d = btn.dataset.d;
    const op = btn.dataset.op;
    if (op === '+') dadosCantidad[d] = Math.min(dadosCantidad[d] + 1, 20);
    else dadosCantidad[d] = Math.max(dadosCantidad[d] - 1, 0);
    document.getElementById('qty-' + d).textContent = dadosCantidad[d];
  });
});

document.getElementById('mod-menos').addEventListener('click', () => {
  modificador = Math.max(modificador - 1, -20);
  document.getElementById('mod-val').textContent = modificador >= 0 ? '+' + modificador : modificador;
});
document.getElementById('mod-mas').addEventListener('click', () => {
  modificador = Math.min(modificador + 1, 20);
  document.getElementById('mod-val').textContent = modificador >= 0 ? '+' + modificador : modificador;
});

document.getElementById('btn-tirar').addEventListener('click', () => {
  const seleccionados = Object.entries(dadosCantidad).filter(([, v]) => v > 0);
  if (seleccionados.length === 0) {
    document.getElementById('dados-animacion').innerHTML = '<p style="color:var(--muted);font-style:italic">Selecciona al menos un dado.</p>';
    return;
  }

  // Animar
  const animDiv = document.getElementById('dados-animacion');
  animDiv.innerHTML = '';
  document.getElementById('resultado-box').classList.add('hidden');

  const tiradas = [];
  seleccionados.forEach(([tipo, cant]) => {
    for (let i = 0; i < cant; i++) {
      const val = tirarDado(DADOS_CONFIG[tipo]);
      tiradas.push({ tipo, val });
      const div = document.createElement('div');
      div.className = 'dado-anim ' + tipo.toLowerCase() + '-a';
      div.style.animationDelay = (tiradas.length - 1) * 80 + 'ms';
      div.textContent = '?';
      animDiv.appendChild(div);
    }
  });

  // Mostrar resultado tras animación
  setTimeout(() => {
    tiradas.forEach((t, i) => { animDiv.children[i].textContent = t.val; });
    const suma = tiradas.reduce((s, t) => s + t.val, 0) + modificador;
    const formula = seleccionados.map(([t, c]) => c + t).join(' + ') + (modificador !== 0 ? (modificador > 0 ? ' + ' + modificador : ' - ' + Math.abs(modificador)) : '');
    const resBox = document.getElementById('resultado-box');
    document.getElementById('resultado-formula').textContent = formula;
    const dadosHTML = tiradas.map(t => {
      const max = DADOS_CONFIG[t.tipo];
      const cls = t.val === max ? 'critico' : t.val === 1 ? 'pifia' : '';
      return `<span class="res-dado ${cls}">${t.tipo}: ${t.val}</span>`;
    }).join('') + (modificador !== 0 ? `<span class="res-dado">(${modificador >= 0 ? '+' : ''}${modificador})</span>` : '');
    document.getElementById('resultado-dados').innerHTML = dadosHTML;
    document.getElementById('resultado-total').textContent = suma;
    resBox.classList.remove('hidden');

    // Historial
    const entrada = { formula, total: suma, hora: new Date().toLocaleTimeString('es-ES'), dados: tiradas.map(t => `${t.tipo}:${t.val}`).join(' ') };
    historialTiradas.unshift(entrada);
    if (historialTiradas.length > 50) historialTiradas.pop();
    STORE.set('historial_dados', historialTiradas);
    renderHistorial();

    // Bajar cordura aleatoriamente en D20
    const d20s = tiradas.filter(t => t.tipo === 'D20');
    d20s.forEach(t => { if (t.val === 1) afectarCordura(-Math.floor(Math.random() * 3 + 1)); });
  }, 700);
});

function renderHistorial() {
  const list = document.getElementById('historial-list');
  if (!historialTiradas.length) { list.innerHTML = '<p style="color:var(--muted);font-style:italic;font-size:.8rem;padding:10px">Sin tiradas.</p>'; return; }
  list.innerHTML = historialTiradas.map(h => `
    <div class="historial-item">
      <div class="historial-formula">${h.formula}</div>
      <div class="historial-total">${h.total}</div>
      <div class="historial-hora">${h.hora}</div>
    </div>
  `).join('');
}

document.getElementById('btn-limpiar-historial').addEventListener('click', () => {
  historialTiradas = [];
  STORE.set('historial_dados', []);
  renderHistorial();
});

// ══════════════════════════════════════════════════
//  CORDURA
// ══════════════════════════════════════════════════
let cordura = STORE.get('cordura') ?? 99;
function afectarCordura(delta) {
  cordura = Math.max(0, Math.min(99, cordura + delta));
  STORE.set('cordura', cordura);
  const pct = (cordura / 99 * 100) + '%';
  document.getElementById('sanity-bar').style.width = pct;
  document.getElementById('sanity-val').textContent = cordura;
  if (cordura < 30) {
    document.getElementById('sanity-bar').style.background = 'var(--red-bright)';
  } else if (cordura < 60) {
    document.getElementById('sanity-bar').style.background = 'linear-gradient(90deg, var(--gold), var(--purple-bright))';
  }
}
afectarCordura(0); // inicializar display

// ══════════════════════════════════════════════════
//  SECCIÓN: PERSONAJES — CALCULADORA
// ══════════════════════════════════════════════════
const STATS_DEF = [
  { key: 'FUE', nombre: '💪 Fuerza',       formula: '3D6×5',    dados: [3,6],  mult: 5 },
  { key: 'CON', nombre: '🏃 Constitución',  formula: '3D6×5',    dados: [3,6],  mult: 5 },
  { key: 'TAM', nombre: '🤸 Tamaño',       formula: '(2D6+6)×5', dados: [2,6], mult: 5, base: 6 },
  { key: 'DES', nombre: '🎯 Destreza',      formula: '3D6×5',    dados: [3,6],  mult: 5 },
  { key: 'APA', nombre: '✨ Apariencia',    formula: '3D6×5',    dados: [3,6],  mult: 5 },
  { key: 'INT', nombre: '🧠 Inteligencia', formula: '(2D6+6)×5', dados: [2,6], mult: 5, base: 6 },
  { key: 'POD', nombre: '💡 Poder',         formula: '3D6×5',    dados: [3,6],  mult: 5 },
  { key: 'EDU', nombre: '📚 Educación',    formula: '(2D6+6)×5', dados: [2,6], mult: 5, base: 6 },
];

const HABILIDADES_DEF = [
  { nombre: 'Antropología',    base: 1  }, { nombre: 'Arqueología',      base: 1  },
  { nombre: 'Arte/Artesanía',  base: 5  }, { nombre: 'Charla',           base: 5  },
  { nombre: 'Conducir',        base: 20 }, { nombre: 'Contabilidad',      base: 5  },
  { nombre: 'Crédito',         base: 0  }, { nombre: 'Disfraz',           base: 5  },
  { nombre: 'Electrónica',     base: 1  }, { nombre: 'Escalada',          base: 20 },
  { nombre: 'Escuchar',        base: 20 }, { nombre: 'Esquivar',          base: 0  },
  { nombre: 'Fotografía',      base: 5  }, { nombre: 'Historia',          base: 5  },
  { nombre: 'Idioma Extranjero',base: 1 }, { nombre: 'Idioma Propio',     base: 0  },
  { nombre: 'Intimidar',       base: 15 }, { nombre: 'Latín',             base: 1  },
  { nombre: 'Leyes',           base: 5  }, { nombre: 'Librería',          base: 25 },
  { nombre: 'Mecánica',        base: 10 }, { nombre: 'Medicina',          base: 1  },
  { nombre: 'Mitos de Cthulhu',base: 0  }, { nombre: 'Montar',            base: 5  },
  { nombre: 'Nadar',           base: 20 }, { nombre: 'Navegar',           base: 10 },
  { nombre: 'Ocultismo',       base: 5  }, { nombre: 'Percepción',        base: 25 },
  { nombre: 'Pelea (Puños)',   base: 25 }, { nombre: 'Persuasión',        base: 10 },
  { nombre: 'Primeros Auxilios',base: 30}, { nombre: 'Psicoanálisis',     base: 1  },
  { nombre: 'Psicología',      base: 10 }, { nombre: 'Saltar',            base: 20 },
  { nombre: 'Sigilo',          base: 20 }, { nombre: 'Supervivencia',     base: 10 },
  { nombre: 'Tiro (Pistola)',  base: 20 }, { nombre: 'Tiro (Rifle)',      base: 25 },
  { nombre: 'Trepar',          base: 20 }, { nombre: 'Rastrear',          base: 10 },
];

let statsActuales = {};
let habilidadesActuales = {};

function tirarStat(stat) {
  // Tiramos los dados (ej: 3D6 o 2D6+6)
  const rolls = Array.from({ length: stat.dados[0] }, () => Math.floor(Math.random() * stat.dados[1]) + 1);
  const suma = rolls.reduce((a, b) => a + b, 0);
  
  // Calculamos el total con el multiplicador (x5)
  const resultado = (suma + (stat.base || 0)) * stat.mult;
  
  return Math.min(95, resultado); 
}

function renderStatsGrid() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = STATS_DEF.map(s => `
    <div class="stat-row">
      <span class="stat-nombre">${s.nombre}</span>
      <input type="number" class="stat-input" id="stat-${s.key}"
             min="5" max="90" step="5"
             value="${statsActuales[s.key] || ''}"
             placeholder="${s.formula}"
             data-key="${s.key}"/>
      <span class="stat-max">/90</span>
      <button class="btn-tirar-stat" data-key="${s.key}">🎲 Tirar</button>
    </div>
  `).join('');

  grid.querySelectorAll('.stat-input').forEach(inp => {
    inp.addEventListener('input', () => {
      statsActuales[inp.dataset.key] = parseInt(inp.value) || 0;
      updateDerivados(); updatePuntosHabilidad();
    });
  });
  grid.querySelectorAll('.btn-tirar-stat').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = STATS_DEF.find(s => s.key === btn.dataset.key);
      const val = tirarStat(stat);
      statsActuales[btn.dataset.key] = val;
      document.getElementById('stat-' + btn.dataset.key).value = val;
      updateDerivados(); updatePuntosHabilidad();
    });
  });
}

function updateDerivados() {
  const { CON = 0, TAM = 0, POD = 0 } = statsActuales;
  const pv = Math.floor((CON / 5 + TAM / 5) / 2) || 0;
  const pm = Math.floor(POD / 5) || 0;
  const cor = POD || 0;
  const suerte = 0; // se tira aparte
  const div = document.getElementById('stats-derivados');
  div.innerHTML = `
    <h4>📊 STATS DERIVADOS</h4>
    <div class="derivado-row"><span class="derivado-nombre">❤️ Puntos de Vida</span><span class="derivado-val">${pv || '—'}</span></div>
    <div class="derivado-row"><span class="derivado-nombre">🧩 Cordura inicial</span><span class="derivado-val">${cor || '—'}</span></div>
    <div class="derivado-row"><span class="derivado-nombre">🔮 Puntos de Magia</span><span class="derivado-val">${pm || '—'}</span></div>
    <div class="derivado-row"><span class="derivado-nombre">🎓 Pts. Ocupación</span><span class="derivado-val">${statsActuales.EDU ? statsActuales.EDU * 4 : '—'}</span></div>
    <div class="derivado-row"><span class="derivado-nombre">🌍 Pts. Interés</span><span class="derivado-val">${statsActuales.INT ? statsActuales.INT * 2 : '—'}</span></div>
  `;
}

function updatePuntosHabilidad() {
  const ptsOcup = (statsActuales.EDU || 0) * 4;
  const ptsInt  = (statsActuales.INT || 0) * 2;
  const gastadoOcup = Object.values(habilidadesActuales).reduce((s, h) => s + (h.ocup || 0), 0);
  const gastadoInt  = Object.values(habilidadesActuales).reduce((s, h) => s + (h.inter || 0), 0);
  document.getElementById('pts-ocup').textContent = ptsOcup - gastadoOcup;
  document.getElementById('pts-int').textContent  = ptsInt  - gastadoInt;
}

function renderHabilidadesGrid() {
  const grid = document.getElementById('habilidades-grid');
  grid.innerHTML = HABILIDADES_DEF.map(h => {
    const stored = habilidadesActuales[h.nombre] || {};
    const val = (h.base + (stored.ocup || 0) + (stored.inter || 0));
    const pct = Math.min(val, 90);
    return `
      <div class="hab-row">
        <span class="hab-nombre">${h.nombre}</span>
        <span class="hab-base">${h.base}%</span>
        <input type="number" class="hab-input" min="0" max="90"
               value="${val}" data-nombre="${h.nombre}" data-base="${h.base}"/>
        <div class="hab-bar-wrap"><div class="hab-bar" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.hab-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const nombre = inp.dataset.nombre;
      const base   = parseInt(inp.dataset.base);
      const val    = Math.max(base, Math.min(90, parseInt(inp.value) || base));
      inp.value = val;
      const diff = val - base;
      if (!habilidadesActuales[nombre]) habilidadesActuales[nombre] = { ocup: 0, inter: 0 };
      habilidadesActuales[nombre].ocup = diff; // simplificado: todo va a ocupación
      const bar = inp.closest('.hab-row').querySelector('.hab-bar');
      bar.style.width = val + '%';
      updatePuntosHabilidad();
    });
  });
}

// Tabs personajes
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.ptab-panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    document.getElementById('ptab-' + tab.dataset.ptab).classList.add('active');
    document.getElementById('ptab-' + tab.dataset.ptab).classList.remove('hidden');
  });
});

// Guardar personaje
document.getElementById('btn-guardar-personaje').addEventListener('click', async () => {
  const r = await showModal('Guardar Personaje', `
    <label class="modal-label">NOMBRE DEL PERSONAJE</label>
    <input class="modal-input" data-key="nombre" placeholder="Prof. Henry Armitage..."/>
    <label class="modal-label">OCUPACIÓN</label>
    <input class="modal-input" data-key="ocupacion" placeholder="Profesor, Periodista, Detective..."/>
  `, 'Guardar');
  if (!r || !r.nombre?.trim()) return;
  const personajes = STORE.get('personajes') || [];
  personajes.push({
    id: Date.now().toString(),
    nombre: r.nombre.trim(),
    ocupacion: r.ocupacion?.trim() || '—',
    stats: { ...statsActuales },
    habilidades: { ...habilidadesActuales },
    guardado: new Date().toLocaleDateString('es-ES'),
  });
  STORE.set('personajes', personajes);
  renderPersonajesList();
  // Cambiar a tab mis personajes
  document.querySelector('.ptab[data-ptab="mispersonajes"]').click();
});

function renderPersonajesList() {
  const list = document.getElementById('personajes-list');
  const personajes = STORE.get('personajes') || [];
  if (!personajes.length) {
    list.innerHTML = '<p class="personaje-empty">☽ Ningún personaje guardado aún.</p>';
    return;
  }
  list.innerHTML = personajes.map((p, i) => `
    <div class="personaje-card">
      <div>
        <div class="personaje-nombre">${p.nombre}</div>
        <div style="font-family:var(--font-mono);font-size:.65rem;color:var(--gold);margin-bottom:8px">${p.ocupacion}</div>
        <div class="personaje-stats-mini">
          ${Object.entries(p.stats || {}).map(([k, v]) => `<span>${k}: ${v}</span>`).join('')}
        </div>
        <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--muted);margin-top:8px">Guardado: ${p.guardado}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn-secondary btn-cargar-personaje" data-idx="${i}">📂 Cargar</button>
        <button class="btn-danger btn-del-personaje" data-idx="${i}">🗑 Borrar</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('.btn-del-personaje').forEach(btn => {
    btn.addEventListener('click', () => {
      const ps = STORE.get('personajes') || [];
      ps.splice(parseInt(btn.dataset.idx), 1);
      STORE.set('personajes', ps);
      renderPersonajesList();
    });
  });
  list.querySelectorAll('.btn-cargar-personaje').forEach(btn => {
    btn.addEventListener('click', () => {
      const ps = STORE.get('personajes') || [];
      const p = ps[parseInt(btn.dataset.idx)];
      statsActuales = { ...p.stats };
      habilidadesActuales = { ...p.habilidades };
      renderStatsGrid(); renderHabilidadesGrid(); updateDerivados(); updatePuntosHabilidad();
      document.querySelector('.ptab[data-ptab="calculadora"]').click();
    });
  });
}

// ══════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════
renderHistoriasGrid();
renderHistorial();
renderStatsGrid();
renderHabilidadesGrid();
updateDerivados();
updatePuntosHabilidad();
renderPersonajesList();

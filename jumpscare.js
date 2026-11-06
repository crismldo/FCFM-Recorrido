import * as THREE from 'three';

export const zonas = [
  {
    id: 'integral',

    caja: new THREE.Box3(
      new THREE.Vector3(0, 4, -7),   // esquina mínima (x, y, z)
      new THREE.Vector3(4, 8, -3)   // esquina máxima (x, y, z)
    ),
    //imagen: '/public/jumpscare/cutebison.jpg',
    imagen: '/public/jumpscare/Bisonte_2.png',
    duracion: 2500,   // milisegundos
    repetir: false,   // true = se activa cada vez que entres
    activada: false,
    dentro: false,
  },
];

const overlay = document.getElementById('jumpscare');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bufferGrito = null;
let fuenteGrito = null;

// Descarga y decodifica el audio una sola vez, al cargar la página
fetch('/public/jumpscare/scream-1.mp3')
  .then(r => r.arrayBuffer())
  .then(datos => audioCtx.decodeAudioData(datos))
  .then(buf => { bufferGrito = buf; })
  .catch(err => console.error('Error cargando audio:', err));

// El navegador deja el contexto "suspendido" hasta que haya un clic
document.getElementById('start-btn')
  .addEventListener('click', () => audioCtx.resume());

function reproducirSonido() {
  if (!bufferGrito) return;
  fuenteGrito = audioCtx.createBufferSource();
  fuenteGrito.buffer = bufferGrito;
  fuenteGrito.connect(audioCtx.destination);
  fuenteGrito.start(0);
}

function detenerSonido() {
  try { fuenteGrito?.stop(); } catch {}
}

let mostrando = false;

// Precarga las imágenes para que no tarden en aparecer
zonas.forEach(z => { new Image().src = z.imagen; });

function disparar(zona) {
  if (mostrando) return;
  mostrando = true;      
  zona.activada = true;

  // Retraso aleatorio entre 300 y 1200 ms
  const retraso = 300 + Math.random() * 300;

  setTimeout(() => {
    overlay.style.backgroundImage = `url("${zona.imagen}")`;
    overlay.classList.add('activo');
    reproducirSonido();

    // Ocultarlo después de la duración
    setTimeout(() => {
      overlay.classList.remove('activo');
      detenerSonido();
      mostrando = false;
    }, zona.duracion);
  }, retraso);
}

export function revisarZonas(posicion) {
  for (const zona of zonas) {
    const estaDentro = zona.caja.containsPoint(posicion);

    // Solo dispara en el momento de ENTRAR a la zona
    if (estaDentro && !zona.dentro) {
      if (!zona.activada || zona.repetir) disparar(zona);
    }
    zona.dentro = estaDentro;
  }
}
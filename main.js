import * as THREE from 'three';
import { GLTFLoader }          from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }         from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { RGBELoader }          from 'three/addons/loaders/RGBELoader.js';
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';
import { EffectComposer }      from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }          from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass }          from 'three/addons/postprocessing/OutputPass.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import  Stats                  from 'three/addons/libs/stats.module.js';

// Parchea el raycast global para usar BVH automáticamente
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let scene, camera, renderer, controls, composer, clock, mixer;
let isModelLoaded = false;

// ── DOM ───────────────────────────────────────────────────────
const canvas       = document.getElementById('webgl');
const blocker      = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const coordsDiv    = document.getElementById('coords');
const stats        = new Stats();
const fpsDisplay   = document.getElementById('fps-value');

let lastTime = performance.now();
let frames = 0;

// ── TECLADO ───────────────────────────────────────────────────
const keys = { w: false, a: false, s: false, d: false, ' ': false };
document.addEventListener('keydown', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = true;

    if (isModelLoaded && controls.isLocked) {
        if (k === 'p') {
            teletransportarA(new THREE.Vector3(7.0, 8.41, 37.0)); // Coordenadas de ejemplo 1
        }
        //if (k === 'o') {
        //    teletransportarA(new THREE.Vector3(7.0, 8.41, 37.0));  // Coordenadas de inicio del juego
        //}
        
    }




});
document.addEventListener('keyup', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = false;
});



// ── INFORMACION SALONES ────────────────────────────────────────────────────
const infoPanel = document.getElementById('info-panel');
const Salon_Nombre = document.getElementById('Salon_Nombre');
const Salon_Descripcion = document.getElementById('Salon_Descripcion');
let Salon_ID = 0;




const Salones = Object.freeze({
    //PISO 1
    Princ_Salon_101: 'Princ_Salon_101',
    Princ_Salon_102: 'Princ_Salon_102',
    Princ_Salon_103: 'Princ_Salon_103',
    Princ_Salon_104: 'Princ_Salon_104',
    Princ_Salon_105: 'Princ_Salon_105',

    Princ_Salon_201: 'Princ_Salon_201',
    Princ_Salon_202: 'Princ_Salon_202',
    Princ_Salon_203: 'Princ_Salon_203',
    Princ_Salon_204: 'Princ_Salon_204',

    Princ_Salon_401: 'Princ_Salon_401',
    Princ_Salon_402: 'Princ_Salon_402',
    Princ_Salon_403: 'Princ_Salon_403',
    Princ_Salon_404: 'Princ_Salon_404',
    Princ_Salon_405: 'Princ_Salon_405',

    Princ_Audi_Eladio: 'Princ_Audi_Eladio',

    Princ_Dep_Tutorias:          'Princ_Dep_Tutorias',
    Princ_Dep_Tesoreria:         'Princ_Dep_Tesoreria',
    Princ_Dep_Direccion:         'Princ_Dep_Direccion',
    Princ_Dep_Servicios_General: 'Princ_Dep_Servicios_General',
    Princ_Dep_Coordinacion:      'Princ_Dep_Coordinacion',

    Princ_Cafeteria: 'Princ_Cafeteria',

    //PISO 2
    Princ_Salon_106: 'Princ_Salon_106',
    Princ_Salon_107: 'Princ_Salon_107',
    Princ_Salon_108: 'Princ_Salon_108',
    Princ_Salon_109: 'Princ_Salon_109',
    Princ_Salon_110: 'Princ_Salon_110',

    Princ_Salon_205: 'Princ_Salon_205',
    Princ_Salon_206: 'Princ_Salon_206',
    Princ_Salon_207: 'Princ_Salon_207',
    Princ_Salon_208: 'Princ_Salon_208',

    Princ_Salon_406: 'Princ_Salon_406',
    Princ_Salon_407: 'Princ_Salon_407',
    Princ_Salon_408: 'Princ_Salon_408',
    Princ_Salon_409: 'Princ_Salon_409',
    Princ_Salon_410: 'Princ_Salon_410',

    Princ_Audi_Jose: 'Princ_Audi_Jose',

    Princ_Lab_Mecanica:      'Princ_Lab_Mecanica',
    Princ_Lab_Fluidos:       'Princ_Lab_Fluidos',
    Princ_Lab_Circuitos:     'Princ_Lab_Circuitos',
    Princ_Lab_Fisica_III:    'Princ_Lab_Fisica_III',
    Princ_Lab_Sistemas_Elec: 'Princ_Lab_Sistemas_Elec',
    Princ_Lab_Optica:        'Princ_Lab_Optica',

    Princ_Dep_Soci_Alumnos:    'Princ_Dep_Soci_Alumnos',
    Princ_Dep_Copias:          'Princ_Dep_Copias',
    Princ_Dep_RH:              'Princ_Dep_RH',
    Princ_Dep_Escolar:         'Princ_Dep_Escolar',
    Princ_Dep_Prefectura:      'Princ_Dep_Prefectura',
    Princ_Dep_Servicio_Social: 'Princ_Dep_Servicio_Social',

    //PISO 3
    Princ_Salon_111: 'Princ_Salon_111',
    Princ_Salon_112: 'Princ_Salon_112',
    Princ_Salon_113: 'Princ_Salon_113',
    Princ_Salon_114: 'Princ_Salon_114',
    Princ_Salon_115: 'Princ_Salon_115',
    Princ_Salon_116: 'Princ_Salon_116',
    Princ_Salon_117: 'Princ_Salon_117',
    Princ_Salon_118: 'Princ_Salon_118',
    Princ_Salon_119: 'Princ_Salon_119',
    Princ_Salon_120: 'Princ_Salon_120',
    Princ_Salon_121: 'Princ_Salon_121',

    Princ_Salon_209: 'Princ_Salon_209',
    Princ_Salon_210: 'Princ_Salon_210',
    Princ_Salon_211: 'Princ_Salon_211',
    Princ_Salon_212: 'Princ_Salon_212',

    Princ_Salon_411: 'Princ_Salon_411',
    Princ_Salon_412: 'Princ_Salon_412',
    Princ_Salon_413: 'Princ_Salon_413',
    Princ_Salon_414: 'Princ_Salon_414',

    Princ_Dep_Astronomia:       'Princ_Dep_Astronomia',
    Princ_Dep_Soporte_Tecnico:  'Princ_Dep_Soporte_Tecnico',
    Princ_Dep_Lab_Computo_Mat:  'Princ_Dep_Lab_Computo_Mat',
    Princ_Dep_Ofici_Administra: 'Princ_Dep_Ofici_Administra',
    Princ_Dep_CAADI:            'Princ_Dep_CAADI',
    Princ_Dep_Biblioteca:       'Princ_Dep_Biblioteca',





});


const InformacionSalones = {
    // --- PISO 1 ---
    [Salones.Princ_Salon_101]: { nombre: "Salón 101", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_102]: { nombre: "Salón 102", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_103]: { nombre: "Salón 103", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_104]: { nombre: "Salón 104", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_105]: { nombre: "Salón 105", descripcion: "Aula de clases regulares." },

    [Salones.Princ_Salon_201]: { nombre: "Salón 201", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_202]: { nombre: "Salón 202", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_203]: { nombre: "Salón 203", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_204]: { nombre: "Salón 204", descripcion: "Aula de clases." },

    [Salones.Princ_Salon_401]: { nombre: "Salón 401", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_402]: { nombre: "Salón 402", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_403]: { nombre: "Salón 403", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_404]: { nombre: "Salón 404", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_405]: { nombre: "Salón 405", descripcion: "Aula de clases." },

    [Salones.Princ_Audi_Eladio]: { nombre: "Auditorio Eladio", descripcion: "Auditorio principal para conferencias y eventos." },
    [Salones.Princ_Dep_Tutorias]: { nombre: "Departamento de Tutorías", descripcion: "Atención y seguimiento académico." },
    [Salones.Princ_Dep_Tesoreria]: { nombre: "Tesorería", descripcion: "Pagos de colegiaturas y trámites financieros." },
    [Salones.Princ_Dep_Direccion]: { nombre: "Dirección", descripcion: "Oficina del director(a) de la facultad." },
    [Salones.Princ_Dep_Servicios_General]: { nombre: "Servicios Generales", descripcion: "Mantenimiento y operaciones del edificio." },
    [Salones.Princ_Dep_Coordinacion]: { nombre: "Coordinación", descripcion: "Coordinación académica." },
    [Salones.Princ_Cafeteria]: { nombre: "Cafetería", descripcion: "Área de comida y descanso." },

    // --- PISO 2 ---
    [Salones.Princ_Salon_106]: { nombre: "Salón 106", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_107]: { nombre: "Salón 107", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_108]: { nombre: "Salón 108", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_109]: { nombre: "Salón 109", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_110]: { nombre: "Salón 110", descripcion: "Aula de clases regulares." },

    [Salones.Princ_Salon_205]: { nombre: "Salón 205", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_206]: { nombre: "Salón 206", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_207]: { nombre: "Salón 207", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_208]: { nombre: "Salón 208", descripcion: "Aula de clases." },

    [Salones.Princ_Salon_406]: { nombre: "Salón 406", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_407]: { nombre: "Salón 407", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_408]: { nombre: "Salón 408", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_409]: { nombre: "Salón 409", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_410]: { nombre: "Salón 410", descripcion: "Aula de clases." },

    [Salones.Princ_Audi_Jose]: { nombre: "Auditorio José", descripcion: "Auditorio secundario para presentaciones." },

    [Salones.Princ_Lab_Mecanica]: { nombre: "Laboratorio de Mecánica", descripcion: "Uso obligatorio de bata y lentes de seguridad." },
    [Salones.Princ_Lab_Fluidos]: { nombre: "Laboratorio de Fluidos", descripcion: "Prácticas de hidrostática e hidrodinámica." },
    [Salones.Princ_Lab_Circuitos]: { nombre: "Laboratorio de Circuitos", descripcion: "Mesas de trabajo con osciloscopios y fuentes." },
    [Salones.Princ_Lab_Fisica_III]: { nombre: "Laboratorio de Física III", descripcion: "Prácticas de electromagnetismo." },
    [Salones.Princ_Lab_Sistemas_Elec]: { nombre: "Lab. Sistemas Eléctricos", descripcion: "Prácticas de potencia y control." },
    [Salones.Princ_Lab_Optica]: { nombre: "Laboratorio de Óptica", descripcion: "Experimentos con luz y lentes. Mantener puerta cerrada." },

    [Salones.Princ_Dep_Soci_Alumnos]: { nombre: "Sociedad de Alumnos", descripcion: "Oficina de representación estudiantil." },
    [Salones.Princ_Dep_Copias]: { nombre: "Centro de Copiado", descripcion: "Impresiones, copias y papelería básica." },
    [Salones.Princ_Dep_RH]: { nombre: "Recursos Humanos", descripcion: "Atención al personal docente y administrativo." },
    [Salones.Princ_Dep_Escolar]: { nombre: "Control Escolar", descripcion: "Kardex, constancias y trámites de titulación." },
    [Salones.Princ_Dep_Prefectura]: { nombre: "Prefectura", descripcion: "Control de asistencias y reportes." },
    [Salones.Princ_Dep_Servicio_Social]: { nombre: "Servicio Social", descripcion: "Registro y liberación de horas." },

    // --- PISO 3 ---
    [Salones.Princ_Salon_111]: { nombre: "Salón 111", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_112]: { nombre: "Salón 112", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_113]: { nombre: "Salón 113", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_114]: { nombre: "Salón 114", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_115]: { nombre: "Salón 115", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_116]: { nombre: "Salón 116", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_117]: { nombre: "Salón 117", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_118]: { nombre: "Salón 118", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_119]: { nombre: "Salón 119", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_120]: { nombre: "Salón 120", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_121]: { nombre: "Salón 121", descripcion: "Aula de clases regulares." },

    [Salones.Princ_Salon_209]: { nombre: "Salón 209", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_210]: { nombre: "Salón 210", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_211]: { nombre: "Salón 211", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_212]: { nombre: "Salón 212", descripcion: "Aula de clases." },

    [Salones.Princ_Salon_411]: { nombre: "Salón 411", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_412]: { nombre: "Salón 412", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_413]: { nombre: "Salón 413", descripcion: "Aula de clases." },
    [Salones.Princ_Salon_414]: { nombre: "Salón 414", descripcion: "Aula de clases." },

    [Salones.Princ_Dep_Astronomia]: { nombre: "Departamento de Astronomía", descripcion: "Oficinas e investigación astronómica." },
    [Salones.Princ_Dep_Soporte_Tecnico]: { nombre: "Soporte Técnico", descripcion: "Ayuda con redes y equipo de cómputo." },
    [Salones.Princ_Dep_Lab_Computo_Mat]: { nombre: "Lab. Cómputo Matemático", descripcion: "Computadoras con software especializado." },
    [Salones.Princ_Dep_Ofici_Administra]: { nombre: "Oficinas Administrativas", descripcion: "Área administrativa general." },
    [Salones.Princ_Dep_CAADI]: { nombre: "CAADI", descripcion: "Centro de Autoaprendizaje de Idiomas." },
    [Salones.Princ_Dep_Biblioteca]: { nombre: "Biblioteca", descripcion: "Zona de silencio y estudio." }
};


function DisplaySalonInfo(ID_Salon_Seleccionado) {
    
    const info = InformacionSalones[ID_Salon_Seleccionado];
    
    if (info) {
        Salon_Nombre.textContent = info.nombre;
        Salon_Descripcion.textContent = info.descripcion;
    } else {
        Salon_Nombre.textContent = "Área Desconocida";
        Salon_Descripcion.textContent = "No hay información disponible para este lugar.";
    }
}





window.addEventListener('keydown', (event) => {
    
    DisplaySalonInfo(Salones.Princ_Dep_Servicio_Social);
    
    
    
    // Check if the 'I' key was pressed (case-insensitive)
    if (event.key.toLowerCase() === 'i') {
        // Toggle the display style
        if (infoPanel.style.display === 'none') {
            infoPanel.style.display = 'block';
        } else {
            infoPanel.style.display = 'none';
        }
    }
});









// ── FÍSICA ────────────────────────────────────────────────────
const FIXED_STEP         = 1 / 60;
const MAX_SUBSTEPS       = 2;
let   _accumulator       = 0;
const moveSpeed          = 8.0;
const gravity            = 50.0;
const jumpForce          = 10.0;
const cameraHeight       = 1.3;
const collisionThreshold = 0.5;
const COLLISION_EVERY    = 2;
let   velocityY          = 0;
let   isGrounded         = false;
let   _collisionFrame    = 0;
let   _lastCollisions    = { forward: false, backward: false, left: false, right: false };
let   _lastCoordX, _lastCoordY, _lastCoordZ;

// ── COLISIONES ────────────────────────────────────────────────
const collidableObjects  = [];
const LAYER_COLLIDABLE   = 1;
let   raycaster;

const _rayOrigin = new THREE.Vector3();
const _camDir    = new THREE.Vector3();
const _fwd  = new THREE.Vector3();
const _bwd  = new THREE.Vector3();
const _right = new THREE.Vector3();
const _left  = new THREE.Vector3();
const _down  = new THREE.Vector3(0, -1, 0);
const direction = new THREE.Vector3();

// ── TELEPORTERS ───────────────────────────────────────────────
let teleportCooldown = 0;
const teleportList = [
    { name: "TP_1", position: new THREE.Vector3(20.5, 8.4, 24.8), target: new THREE.Vector3(22.6, 8.4, 24.6) },
    { name: "TP_2", position: new THREE.Vector3(22.6, 8.4, 24.6), target: new THREE.Vector3(20.5, 8.4, 24.8) },
];

// ============================================================
// CONFIGURACIÓN DE LOADERS
// ============================================================
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.setDecoderConfig({ type: 'wasm' });

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// ── DETECCIÓN DE MATERIALES ───────────────────────────────────
const METAL_KEYWORDS = ['metal','steel','iron','aluminum','aluminium','chrome','copper','brass','acero','hierro','aluminio','cromo'];
const GLASS_KEYWORDS = ['glass','cristal','vidrio','window','ventana','glazing'];
function isMetal(name = '') { return METAL_KEYWORDS.some(k => name.toLowerCase().includes(k)); }
function isGlass(name = '') { return GLASS_KEYWORDS.some(k => name.toLowerCase().includes(k)); }
function isOriginallyMetal(mat) { return mat && mat.metalness !== undefined && mat.metalness >= 0.5; }

function enhanceMetalMaterial(mat) {
    mat.metalness = 1.0;
    mat.roughness = Math.min(mat.roughness ?? 0.3, 0.35);
    mat.envMapIntensity = 2.5;
    mat.needsUpdate = true;
}

function createGlassMaterial(orig) {
    return new THREE.MeshStandardMaterial({
        color: orig.color ?? new THREE.Color(0xffffff),
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
}


// ── FUNCIÓN DE TELETRANSPORTE REUTILIZABLE ────────────────────
function teletransportarA(nuevaPosicion) {
    const camObj = controls.getObject();

    // 1. Copiamos la nueva posición al objeto de la cámara (el avatar del jugador)
    camObj.position.copy(nuevaPosicion);

    // 2. Reseteamos la velocidad vertical para evitar que herede gravedad acumulada
    velocityY = 0;

    // 3. Activamos el cooldown global de teletransporte que ya tienes en tu física
    // Esto evita conflictos con los desencadenadores de los TPs automáticos del mapa
    teleportCooldown = 1.5;

    console.log(`Teletransportado con éxito a: X: ${nuevaPosicion.x} | Y: ${nuevaPosicion.y} | Z: ${nuevaPosicion.z}`);
}



// ============================================================
// FÍSICA STEP
// ============================================================
function physicsStep() {
    const dt     = FIXED_STEP;
    const camObj = controls.getObject();

    _rayOrigin.copy(camObj.position);
    raycaster.set(_rayOrigin, _down);
    const groundHits = raycaster.intersectObjects(collidableObjects, false);
    const groundDist = groundHits.length > 0 ? groundHits[0].distance : Infinity;

    if (groundDist <= cameraHeight + 0.05) {
        isGrounded = true;
        velocityY  = 0;
        camObj.position.y = groundHits[0].point.y + cameraHeight;
    } else {
        isGrounded = false;
    }

    if (keys[' '] && isGrounded) {
        velocityY  = jumpForce;
        isGrounded = false;
    }

    if (!isGrounded) {
        velocityY -= gravity * dt;
    }
    camObj.position.y += velocityY * dt;

    _collisionFrame++;
    if (_collisionFrame >= COLLISION_EVERY) {
        _collisionFrame = 0;
        camera.getWorldDirection(_camDir);
        _camDir.y = 0;
        _camDir.normalize();

        _fwd.copy(_camDir);
        _bwd.copy(_camDir).negate();
        _right.crossVectors(_camDir, camera.up).normalize();
        _left.copy(_right).negate();
        _rayOrigin.copy(camObj.position);

        function blocked(dir) {
            raycaster.set(_rayOrigin, dir);
            const hits = raycaster.intersectObjects(collidableObjects, false);
            return hits.length > 0 && hits[0].distance < collisionThreshold;
        }
        _lastCollisions.forward  = blocked(_fwd);
        _lastCollisions.backward = blocked(_bwd);
        _lastCollisions.right    = blocked(_right);
        _lastCollisions.left     = blocked(_left);
    }

    direction.set(0, 0, 0);
    if (keys['w']) direction.z -= 1;
    if (keys['s']) direction.z += 1;
    if (keys['a']) direction.x -= 1;
    if (keys['d']) direction.x += 1;
    direction.normalize();

    if (_lastCollisions.forward  && direction.z < 0) direction.z = 0;
    if (_lastCollisions.backward && direction.z > 0) direction.z = 0;
    if (_lastCollisions.right    && direction.x > 0) direction.x = 0;
    if (_lastCollisions.left     && direction.x < 0) direction.x = 0;

    if (direction.z !== 0) controls.moveForward(-direction.z * moveSpeed * dt);
    if (direction.x !== 0) controls.moveRight(direction.x * moveSpeed * dt);

    if (teleportCooldown > 0) {
        teleportCooldown -= dt;
    } else {
        const playerPos = camObj.position;
        for (const tp of teleportList) {
            if (playerPos.distanceTo(tp.position) < 1.5) {
                camObj.position.copy(tp.target);
                velocityY = 0;
                teleportCooldown = 2.0;
                break;
            }
        }
    }
}

// ============================================================
// INIT
// ============================================================
function init() {
    // Definimos el color base para el horizonte y la niebla
    const FOG_COLOR = 0xffe6d1;

    // ── ESCENA ────────────────────────────────────────────────
    scene = new THREE.Scene();
    
    // [CAMBIO]: Niebla lineal. Empieza suave a los 80m y es total a los 150m
    scene.fog = new THREE.Fog(FOG_COLOR, 80, 150);

    // ── CÁMARA ────────────────────────────────────────────────
    // [CAMBIO]: Reducido el Far Plane de 600 a 150 para no renderizar lo lejano
    camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 350);
    camera.position.set(7, 8.41, 37);

    // ── RENDERER ──────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    
    // [CAMBIO]: Forzamos al fondo a ser del mismo color de la niebla
    renderer.setClearColor(FOG_COLOR, 1.0); 

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.VSMShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;

    // ── POST-PROCESADO ────────────────────────────────────────
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    // ── CONTROLES ─────────────────────────────────────────────
    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isModelLoaded) controls.lock();
        });
    }

    controls.addEventListener('lock', () => {
        if (instructions) instructions.style.display = 'none';
        if (blocker)      blocker.style.display      = 'none';
    });
    controls.addEventListener('unlock', () => {
        if (blocker)      blocker.style.display      = 'flex';
        if (instructions) instructions.style.display = '';
    });

    // ── RAYCASTER ─────────────────────────────────────────────
    raycaster = new THREE.Raycaster();
    raycaster.far = 50;
    raycaster.layers.set(LAYER_COLLIDABLE);
    raycaster.firstHitOnly = true;

    // ── ILUMINACIÓN ───────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xffeeb1, 0x3a5f8a, 1.5);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffaa33, 2.5);
    sun.position.set(50, 80, 50);
    sun.castShadow = false;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 150;
    sun.shadow.bias        = -0.001;
    sun.shadow.radius      = 4;
    const d = 60;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top  =  d; sun.shadow.camera.bottom = -d;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8ab4d4, 0.4);
    fill.position.set(-40, 20, -30);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    // ── PISO BASE ─────────────────────────────────────────────
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.geometry.boundsTree = new MeshBVH(ground.geometry);
    ground.layers.enable(LAYER_COLLIDABLE);
    scene.add(ground);
    collidableObjects.push(ground);

    // ── RELOJ + CARGA ─────────────────────────────────────────
    clock = new THREE.Clock();
    loadEnvironmentAndModel();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        composer.setSize(innerWidth, innerHeight);
    });

    animate();
}

// ============================================================
// CARGA HDR + MODELOS MÚLTIPLES
// ============================================================
function loadEnvironmentAndModel() {
    new RGBELoader().load(
        'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr',
        async (hdr) => {
            hdr.mapping = THREE.EquirectangularReflectionMapping;
            scene.backgroundIntensity  = 0.8;
            scene.environmentIntensity = 1.2;

            const pmrem    = new THREE.PMREMGenerator(renderer);
            const envRT    = pmrem.fromEquirectangular(hdr);
            const probe    = LightProbeGenerator.fromCubeRenderTarget(renderer, envRT);
            probe.intensity = 0.8;
            scene.add(probe);
            pmrem.dispose();

            const loadingBar = document.getElementById('loading-bar');
            const statusText = document.getElementById('status-text');
            const startBtn   = document.getElementById('start-btn');

            if (statusText) statusText.innerText = 'CARGANDO CAMPUS...';

            try {
                // Configuración modular de tus pedazos de mapa
                await Promise.all([
                    
                    loadGLBModel('modelos/EdificioP_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/EP_P1_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/300s_opt.glb', { x: 0, y: 8, z: -10, scale: 100 }),
            
                    loadGLBModel('modelos/EP_P2_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/EP_PB3_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    //loadGLBModel('modelos/EP_PB1_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    //loadGLBModel('modelos/EP_PB2_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),

                    loadGLBModel('modelos/Estacionamiento_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/Salas-Estudio_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/USIT-Auditorio_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/USIT-Bancas_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    loadGLBModel('modelos/USIT-Edificio_opt.glb', { x: 0, y: 10, z: -10, scale: 100 }),
                    



                    
                    //loadGLBModel('modelos/PisoTest_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/Estaci_SalaMaestros_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/EstacionamientoTest_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/Main_Entrada_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/Main_Edificio_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/Main_Pozo_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/USIT_Bancos_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/USIT_Edificio_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    //loadGLBModel('modelos/Traseros_Edificio_opt.glb', { x: 0, y: 10, z: 0, scale: 100 }),
                    
                    
                    // Aquí puedes añadir más módulos en el futuro:
                    // loadGLBModel('modelos/PisoNorte.glb', { x: 0, y: 10, z: -100, scale: 100 }),
                ]);

                isModelLoaded = true;
                if (statusText) statusText.style.display = 'none';
                if (loadingBar?.parentElement) loadingBar.parentElement.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-block';

            } catch (error) {
                console.error("Fallo general al cargar modelos:", error);
                if (statusText) statusText.innerText = 'Error al cargar los modelos.';
            }
        }
    );
}

// Función para cargar modelos individuales
function loadGLBModel(path, options = {}) {
    return new Promise((resolve, reject) => {
        const posX  = options.x !== undefined ? options.x : 0;
        const posY  = options.y !== undefined ? options.y : 0;
        const posZ  = options.z !== undefined ? options.z : 0;
        const scale = options.scale !== undefined ? options.scale : 100;

        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(scale, scale, scale);
                model.position.set(posX, posY, posZ);

                scene.add(model);
                model.updateMatrixWorld(true);
                model.traverse(c => { c.matrixAutoUpdate = false; });

                model.traverse((child) => {
                    if (!child.isMesh) return;

                    child.castShadow    = false;
                    child.receiveShadow = false;
                    child.frustumCulled = true;

                    if (child.material) {
                        const name = (child.material.name || '') + ' ' + (child.name || '');
                        if (isGlass(name)) {
                            child.material = createGlassMaterial(child.material);
                        } else if (isMetal(name) || isOriginallyMetal(child.material)) {
                            enhanceMetalMaterial(child.material);
                        } else {
                            child.material.envMapIntensity = 0.8;
                            child.material.roughness = Math.max(child.material.roughness ?? 0.7, 0.4);
                            child.material.needsUpdate = true;
                        }
                    }

                    child.updateWorldMatrix(true, false);
                    child.geometry.boundsTree = new MeshBVH(child.geometry);
                    child.layers.enable(LAYER_COLLIDABLE);
                    collidableObjects.push(child);
                });

                if (gltf.animations.length > 0) {
                    if (!mixer) mixer = new THREE.AnimationMixer(scene);
                    mixer.clipAction(gltf.animations[0], model).play();
                }

                resolve(model);
            },
            undefined,
            (err) => reject(err)
        );
    });
}

// ============================================================
// LOOP DE ANIMACIÓN
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    const dt = clock.getDelta();
    _accumulator += Math.min(dt, FIXED_STEP * MAX_SUBSTEPS);

    if (mixer) mixer.update(dt);

    if (controls.isLocked) {
        while (_accumulator >= FIXED_STEP) {
            physicsStep();
            _accumulator -= FIXED_STEP;
        }

        const p = controls.getObject().position;
        const cx = p.x.toFixed(2), cy = p.y.toFixed(2), cz = p.z.toFixed(2);
        if (cx !== _lastCoordX || cy !== _lastCoordY || cz !== _lastCoordZ) {
            const posDisplay = document.getElementById('pos-values');
            if (posDisplay) posDisplay.innerText = `X: ${cx} | Y: ${cy} | Z: ${cz}`;
            _lastCoordX = cx; _lastCoordY = cy; _lastCoordZ = cz;
        }
    }

    composer.render();
    stats.end();

    frames++;
    const now = performance.now();
    if (now >= lastTime + 1000) {
        if (fpsDisplay) fpsDisplay.innerText = frames;
        frames = 0;
        lastTime = now;
    }
}

// ── ARRANQUE ──────────────────────────────────────────────────
init();
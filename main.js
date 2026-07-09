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
const edificiosCargados = {};
let isUsitVisible = true;
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
            //teletransportarA(new THREE.Vector3(48.38, 8.41, -51.56)); // Coordenadas de ejemplo 1
        }
        
        //if (k === 'o') {
        //    isUsitVisible = !isUsitVisible; // Invertimos el estado
        //    toggleEdificio('USIT', isUsitVisible);
        //}
        
    }

    const vectorMovimiento = new THREE.Vector3(0, 0, 0);

    // Mapeo de teclas
    if (k === 'i') vectorMovimiento.z -= debugPaso; // Mover adelante
    if (k === 'k') vectorMovimiento.z += debugPaso; // Mover atrás
    if (k === 'j') vectorMovimiento.x -= debugPaso; // Mover izquierda
    if (k === 'l') vectorMovimiento.x += debugPaso; // Mover derecha
    if (k === 'u') vectorMovimiento.y -= debugPaso; // Mover abajo
    if (k === 'o') vectorMovimiento.y += debugPaso; // Mover arriba

    // Aplicar el movimiento a la caja
    //debugBox.translate(vectorMovimiento);

    // IMPRIMIR COORDENADAS CON 'P'
    if (k === 'm') {
        const centroActual = new THREE.Vector3();
        debugBox.getCenter(centroActual); // Extraemos el centro exacto
        
        const size = new THREE.Vector3();
        debugBox.getSize(size); // Extraemos el tamaño por si lo olvidaste

        const cX = centroActual.x.toFixed(2);
        const cY = centroActual.y.toFixed(2);
        const cZ = centroActual.z.toFixed(2);

        console.log("=====================================");
        console.log("Copia y pega esta línea en tu código:");
        console.log(`CrearBuildingColision('TAG_AQUI', ${cX}, ${cY}, ${cZ}, ${size.x}, ${size.y}, ${size.z});`);
        console.log("=====================================");
    }




});
document.addEventListener('keyup', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = false;
});









// window.addEventListener('keydown', (event) => {
    
//     DisplaySalonInfo(Salones.Princ_Dep_Servicio_Social);
    
    
    
//     // Check if the 'I' key was pressed (case-insensitive)
//     if (event.key.toLowerCase() === 'i') {
//         // Toggle the display style
//         if (infoPanel.style.display === 'none') {
//             infoPanel.style.display = 'block';
//         } else {
//             infoPanel.style.display = 'none';
//         }
//     }
// });









// ── FÍSICA ────────────────────────────────────────────────────
const FIXED_STEP         = 1 / 60;
const MAX_SUBSTEPS       = 2;
let   _accumulator       = 0;
const moveSpeed          = 8.0;
const gravity            = 50.0;
//const gravity            = 0.0;
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
let collidableObjects  = [];
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

    verificarColisionSalones()
}

// ============================================================
// INIT
// ============================================================
function init() {
    // Definimos el color base para el horizonte y la niebla
    const FOG_COLOR = 0xffe6d1;

    // ── ESCENA ────────────────────────────────────────────────
    scene = new THREE.Scene();
    
   
    scene.fog = new THREE.Fog(FOG_COLOR, 80, 150);

    // ── CÁMARA ────────────────────────────────────────────────
    
    camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 50);
    camera.position.set(7, 8.41, 37);
    //camera.position.set(6.31, 20, 52.96);

    // ── RENDERER ──────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    
    
    renderer.setClearColor(FOG_COLOR, 1.0); 

    renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type    = THREE.VSMShadowMap;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
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



    //================ INFORMACION DE SALONES ================================================

    

    
    
    
    CrearSalonColision(Salones.Princ_Salon_101, -10.0, 7.46, 40.0, false);
    CrearSalonColision(Salones.Princ_Lab_Mecanica, -10.0, 7.46, 45.0, false);
    CrearSalonColision(Salones.Princ_Dep_Biblioteca, -10.0, 7.46, 50.0, false);


    CrearSalonColision(Salones.Sala_Maestros, 34.22, 7.46, 51.84, false);
    CrearSalonColision(Salones.USIT_entrada, -24.80, 7.53, 20.87, false);

    CrearSalonColision(Salones.Princ_Dep_Coordinacion, -8.54, 8.05, -22.25, false);
    CrearSalonColision(Salones.Princ_Dep_Servicios_General, -8.77, 8.05, 3.59, false);
    CrearSalonColision(Salones.Princ_Cafeteria, -9.14, 8.05, -7.87, false);
    CrearSalonColision(Salones.Princ_Dep_Direccion, 14.33, 8.05, 6.22, false);
    CrearSalonColision(Salones.Princ_Dep_Tesoreria, 14.50, 8.05, -7.28, false);
    CrearSalonColision(Salones.Princ_Audi_Eladio, 17.72, 8.05, -13.97, false);
    CrearSalonColision(Salones.Princ_Salon_401, 30.97, 8.05, -18.80, false);

    //Piso 2
    CrearSalonColision(Salones.Princ_Dep_Prefectura, 13.98, 11.77, 9.20, false);
    CrearSalonColision(Salones.Princ_Dep_Servicio_Social, 14.06, 11.77, 4.30, false);
    CrearSalonColision(Salones.Princ_Dep_Escolar, 14.15, 11.77, -2.25, false);
    CrearSalonColision(Salones.Princ_Audi_Jose, 16.89, 11.77, -13.21, false);
    //////////CrearSalonColision(Salones.Sala_inovacion_emprendimiento, 30.70, 11.77, -18.77, false);
    CrearSalonColision(Salones.Princ_Lab_Optica, 20.37, 11.77, -22.62, false);
    CrearSalonColision(Salones.Princ_Lab_Sistemas_Elec, 14.08, 11.77, -22.86, false);
    CrearSalonColision(Salones.Princ_Lab_Fisica_III, 7.08, 11.77, -22.90, false);
    CrearSalonColision(Salones.Princ_Lab_Circuitos, 0.41, 11.77, -22.86, false);
    CrearSalonColision(Salones.Princ_Lab_Fluidos, -6.51, 11.77, -22.94, false);
    CrearSalonColision(Salones.Princ_Lab_Mecanica, -13.38, 11.77, -22.85, false);
    //////////CrearSalonColision(Salones.Lab_Actuaria, -30.15, 11.77, -11.86, false);
    CrearSalonColision(Salones.Princ_Dep_Soci_Alumnos, -9.08, 11.77, -7.10, false);
    CrearSalonColision(Salones.Princ_Dep_Copias, -9.12, 11.77, -5.24, false);
    CrearSalonColision(Salones.Princ_Dep_RH, -9.16, 11.77, -2.05, false);
    

    
    CrearBuildingColision('Princ', 3.94, 16.00, -10.95, 35, 20, 44.5);
    CrearBuildingColision('Princ', -42.06, 16.00, -16.95, 35, 20, 30.3);
    CrearBuildingColision('Princ', -19.06, 16.00, -26.95, 11.5, 20, 10);
    CrearBuildingColision('Princ', 30.94, 16.00, -23.95, 11.5, 20, 32);
    CrearBuildingColision('Princ', 19.94, 16.00, 5.05, 10, 20, 18);

    CrearBuildingColision('usitbuild', -46.06, 16.00, 18.05, 30, 20, 30);
    CrearBuildingColision('usitbuild', -30.06, 16.00, 17.55, 2.5, 20, 9.5);
    CrearBuildingColision('usitbuild', -28.06, 16.00, 17.55, 3, 20, 4);

    CrearBuildingColision('back', 13.27, 16.00, -108.11, 60, 20, 80);

    CrearBuildingColision('front', 12.27, 16.00, 44.89, 60, 20, 40);
    CrearBuildingColision('front', -40.23, 16.00, 49.89, 45, 20, 30);

    //SpawnDebugBox(45, 20, 30)
    

    //================ INFORMACION DE SALONES ================================================    

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        composer.setSize(innerWidth, innerHeight);
    });
    animate();
}

// Arreglo para guardar las grandes zonas de carga (Trigger Volumes)
const zonasEdificios = [];

function CrearBuildingColision(prefijo, centroX, centroY, centroZ, w, h, d) {
    const centro = new THREE.Vector3(centroX, centroY, centroZ);
    const tamaño = new THREE.Vector3(w, h, d);
    
    const cajaMatematica = new THREE.Box3().setFromCenterAndSize(centro, tamaño);
    
    zonasEdificios.push({
        prefijo: prefijo, // ej: 'Princ' o 'USIT'
        box: cajaMatematica
    });

    // Descomenta esto para ver las cajas amarillas gigantes y ajustarlas visualmente
    //const helper = new THREE.Box3Helper(cajaMatematica, 0xffff00);
    //scene.add(helper);
}

// ==========================================
// HERRAMIENTA DE DEBUG PARA CAJAS DE CARGA
// ==========================================
let debugBox = null;
let debugBoxHelper = null;
let debugPaso = 0.5; // Cuántos metros se mueve con cada tecla

function SpawnDebugBox(w, h, d) {
    // Si ya existe una caja de debug, la borramos primero
    if (debugBoxHelper) {
        scene.remove(debugBoxHelper);
    }

    //const centroInicial = new THREE.Vector3(0, 10, 0); // Empieza en el centro del mundo
    const centroInicial = new THREE.Vector3(-47.23, 16.00, 48.89); // Empieza en el centro del mundo
    const tamaño = new THREE.Vector3(w, h, d);
    
    // Creamos la caja matemática
    debugBox = new THREE.Box3().setFromCenterAndSize(centroInicial, tamaño);
    
    // Le ponemos un color llamativo (Cyan) para diferenciarla de las rojas/verdes
    //debugBoxHelper = new THREE.Box3Helper(debugBox, 0x00ffff); 
    //scene.add(debugBoxHelper);

    //console.log(`Caja Debug Creada: ${w}x${h}x${d}`);
    //console.log("Controles: I/K (Adelante/Atrás), J/L (Izquierda/Derecha), U/O (Abajo/Arriba). Presiona 'P' para imprimir.");
}





//=======================================Funcion para crear Colisiones de Informacion====================================

// ── INFORMACION SALONES ────────────────────────────────────────────────────
const infoPanel = document.getElementById('info-panel');
const Salon_Nombre = document.getElementById('Salon_Nombre');
const Salon_Descripcion = document.getElementById('Salon_Descripcion');
let Salon_ID = 0;




const Salones = Object.freeze({
    
    Sala_Maestros: 'Sala_Maestros',
    
    
    
    USIT_entrada: 'USIT_entrada',


    
    
    
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
    [Salones.Sala_Maestros]: { nombre: "Sala de maestros", descripcion: " " },
    [Salones.USIT_entrada]: { nombre: "USIT", descripcion: "Entrada al eficio USIT" },
    
    
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

    [Salones.Princ_Salon_401]: { nombre: "Salón 401", descripcion: "Sala Polivalente." },
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

// Arreglo para guardar todas las zonas de colisión de los salones
const zonasSalones = [];

// Variable de estado para evitar laguear el DOM actualizando el texto en cada frame
let salonActualID = null;
let isPlayerInside101 = false;

function CrearSalonColision(id, centroX, centroY, centroZ, isBuildingZone) {

    loadGLBModel('modelos/A_test.glb', { x: centroX, y: (centroY - 1.3), z: centroZ, scale: 1 });
    const centro = new THREE.Vector3(centroX, centroY, centroZ);
    const tamaño = new THREE.Vector3(2, 2, 2);
    
    // Crear una caja matemática pura (sin mesh, rendimiento óptimo)
    const cajaMatematica = new THREE.Box3().setFromCenterAndSize(centro, tamaño);
    
    // Empujamos el objeto con su ID al arreglo global
    zonasSalones.push({
        id: id,
        box: cajaMatematica
    });

    // OPCIONAL: Si quieres ver las cajas para debugear dónde están paradas:
    
    //const helper = new THREE.Box3Helper(cajaMatematica, 0x00ff00);
    //scene.add(helper);
    
}


function verificarColisionEdificios() {
    const playerPos = controls.getObject().position;
    let sectorActual = 'Exterior'; // Asumimos que está afuera por defecto

    // Revisamos si el jugador está dentro de alguna caja gigante de edificio
    for (let i = 0; i < zonasEdificios.length; i++) {
        if (zonasEdificios[i].box.containsPoint(playerPos)) {
            sectorActual = zonasEdificios[i].prefijo;
            break; // Ya sabemos en qué edificio está, dejamos de buscar
        }
    }

    // Llamamos a la función que hicimos en el paso anterior
    // (Si el sector no cambió, la función actualizarSectores ya sabe ignorarlo)
    actualizarSectores(sectorActual);
}


function verificarColisionSalones() {
    const camObj = controls.getObject();
    const playerPos = camObj.position;
    let dentroDeAlgunSalon = false;

    for (let i = 0; i < zonasSalones.length; i++) {
        const zona = zonasSalones[i];

        if (zona.box.containsPoint(playerPos)) {
            dentroDeAlgunSalon = true;

            if (salonActualID !== zona.id) {
                salonActualID = zona.id;
                DisplaySalonInfo(zona.id); 
                infoPanel.style.display = 'block'; 
            }
            break; 
        }
    }

    if (!dentroDeAlgunSalon && salonActualID !== null) {
        salonActualID = null;
        infoPanel.style.display = 'none';
    }
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

                    //===============================USIT===============================
                    loadGLBModel('modelos/USIT-Opt/USIT-Bancas_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P1_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P1Lab_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P2_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P2Oro_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P2Podcast_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-P2Soporte_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-PB_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-PBLab_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
                    loadGLBModel('modelos/USIT-Opt/USIT-PBMulti_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),

                    

                    //===============================ESTACIONAMIENTO===============================
                    loadGLBModel('modelos/Est-Opt/Est_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'EST' }),
                    loadGLBModel('modelos/Est-Opt/Est-Arboles_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'EST' }),
            
                    //===============================FACU===============================
                    loadGLBModel('modelos/FACU/Principal-PB_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),
                    loadGLBModel('modelos/FACU/Principal-B_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),
                    loadGLBModel('modelos/FACU/Principal-P1_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),

                    //===============================SALONES ATRAS===============================
                    loadGLBModel('modelos/Salones-Opt/Salones_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
                    loadGLBModel('modelos/Salones-Opt/Salones-Plant_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),                
                    loadGLBModel('modelos/Atras/300s_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
                    loadGLBModel('modelos/Atras/canchas_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
                    loadGLBModel('modelos/Atras/deportivo_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
                    loadGLBModel('modelos/Atras/posgrado_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
                                                                                
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

        // Definir Tag, si no se define, se pone General
        const tag = options.tag || 'general';

        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(scale, scale, scale);
                model.position.set(posX, posY, posZ);

                // Guardamos el modelo en nuestro diccionario global
                if (!edificiosCargados[tag]) edificiosCargados[tag] = [];
                edificiosCargados[tag].push(model);

                scene.add(model);
                model.updateMatrixWorld(true);
                model.traverse(c => { c.matrixAutoUpdate = false; });

                model.traverse((child) => {
                    if (!child.isMesh) return;
                    
                    
                    child.userData.tag = tag; 

                    child.geometry.boundsTree = new MeshBVH(child.geometry);
                    child.layers.enable(LAYER_COLLIDABLE);
                    collidableObjects.push(child);

                    child.castShadow    = false;
                    child.receiveShadow = false;
                    child.frustumCulled = true;

                    if (child.material) {
                        const name = (child.material.name || '') + ' ' + (child.name || '');
                        if (isGlass(name)) {
                            child.material = createGlassMaterial(child.material);
                        } else if (isMetal(name) || isOriginallyMetal(child.material)) {
                            enhanceMetalMaterial(child.material);
                        }
                    }
                });

                resolve(model);
            },
            undefined,
            (error) => {
                console.error(`Error cargando el modelo ${path}:`, error);
                reject(error);
            }
        );
    });
}

// ============================================================
// GESTIÓN DE CHUNKS 
// ============================================================

// Lista maestra de todos los tags que usas en loadGLBModel
//const TODOS_LOS_TAGS = ['Edificio_Principal', 'USIT', 'Estacionamiento'];

const TODOS_LOS_TAGS = ['FACU', 'USIT', 'EST', 'ATRAS'];

// Reglas de Visibilidad
const ReglasVisibilidad = {
    // Al entrar a la caja "Princ", solo se muestra la facultad
    'Princ': ['FACU'],

    // Al entrar a la caja "back", solo se muestra la parte de atrás
    'back': ['ATRAS'],

    'front': ['FACU', 'USIT', 'EST'],

    // Al entrar a la caja "usitbuild", solo se muestra el USIT
    'usitbuild': ['USIT'],

    // En el exterior, vemos todos los edificios desde afuera, 
    // y cargamos "EST" (estacionamiento) que es exclusivo de esta vista
    'Exterior': ['FACU', 'ATRAS', 'USIT', 'EST']
};

let sectorActivoActual = 'Exterior'; 

function actualizarSectores(nuevoSector) {
    if (sectorActivoActual === nuevoSector) return; // Evita cálculos innecesarios

    sectorActivoActual = nuevoSector;
    const tagsPermitidos = ReglasVisibilidad[nuevoSector] || ReglasVisibilidad['Exterior'];

    TODOS_LOS_TAGS.forEach(tag => {
        const debeEstarActivo = tagsPermitidos.includes(tag);

        // Asumiendo que tu función toggleEdificio maneja si ya está activo/inactivo
        toggleEdificio(tag, debeEstarActivo);
    });
}

function toggleEdificio(tag, activar) {
    const modelos = edificiosCargados[tag];
    
    if (!modelos) {
        console.warn(`No se encontraron modelos con el tag: ${tag}`);
        return;
    }

    if (activar) {
        // VOLVER A CARGAR
        modelos.forEach(model => {
            scene.add(model);
            
            // COLISIONES
            model.traverse(child => {
                if (child.isMesh && !collidableObjects.includes(child)) {
                    collidableObjects.push(child);
                }
            });
        });
        console.log(`[${tag}] Cargado y activo.`);
        
    } else {
        // DESCARGAR
        modelos.forEach(model => {
            scene.remove(model);
        });
        
        // Limpiar el arreglo de colisiones quitando solo los de este tag

        collidableObjects = collidableObjects.filter(obj => obj.userData.tag !== tag);
        
        console.log(`[${tag}] Descargado y oculto.`);
    }
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
        verificarColisionEdificios();
        const p = controls.getObject().position;
        const cx = p.x.toFixed(2), cy = p.y.toFixed(2), cz = p.z.toFixed(2);
        if (cx !== _lastCoordX || cy !== _lastCoordY || cz !== _lastCoordZ) {
            const posDisplay = document.getElementById('pos-values');
            if (posDisplay) posDisplay.innerText = `X: ${cx} | Y: ${cy} | Z: ${cz}`;
            _lastCoordX = cx; _lastCoordY = cy; _lastCoordZ = cz;
        }

        const playerObj = controls.getObject();

        // Si el jugador cae por debajo de Y = 0 (ajusta este número según tu mapa)
        if (playerObj.position.y < 5.0) {
            console.log("¡Jugador se cayó del mapa! Teletransportando...");

            // Resetear la posición a la entrada (usando las coords de tu init)
            playerObj.position.set(7, 8.41, 37);

            // OPCIONAL: Si tu 'physicsStep' usa una variable de velocidad (ej. velocity.y), 
            // asegúrate de resetearla a 0 aquí para que no siga cayendo rápido al reaparecer.
        }
    }


    
    //--------------------------------------------------COLISION DE INFO--------------------------------------------------

    
    
    





    //--------------------------------------------------COLISION DE INFO--------------------------------------------------



    composer.render();

    //renderer.render(scene, camera);

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
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

// ── TECLADO ───────────────────────────────────────────────────
const keys = { w: false, a: false, s: false, d: false, ' ': false };
document.addEventListener('keydown', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = true;
});
document.addEventListener('keyup', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = false;
});

// ── FÍSICA ────────────────────────────────────────────────────
const FIXED_STEP         = 1 / 60;
const MAX_SUBSTEPS       = 5;
let   _accumulator       = 0;
const moveSpeed          = 5.0;
const gravity            = 25.0;
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

// Vectores reutilizables (sin new cada frame)
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
    return new THREE.MeshPhysicalMaterial({
        color:              orig.color ?? new THREE.Color(0xffffff),
        map:                orig.map ?? null,
        normalMap:          orig.normalMap ?? null,
        metalness:          0.0,
        roughness:          0.05,
        transmission:       0.92,
        ior:                1.52,
        thickness:          0.3,
        transparent:        true,
        opacity:            1.0,
        side:               THREE.DoubleSide,
        envMapIntensity:    3.0,
        attenuationDistance: 0.5,
        attenuationColor:   orig.color ?? new THREE.Color(0xffffff),
    });
}

// ============================================================
// FÍSICA STEP
// ============================================================
function physicsStep() {
    const dt     = FIXED_STEP;
    const camObj = controls.getObject();

    // 1. GRAVEDAD Y SUELO
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
        velocityY -= gravity * dt;
    }
    camObj.position.y += velocityY * dt;

    // 2. SALTO
    if (keys[' '] && isGrounded) {
        velocityY  = jumpForce;
        isGrounded = false;
    }

    // 3. COLISIONES HORIZONTALES (throttled cada COLLISION_EVERY frames)
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

    // 4. MOVIMIENTO WASD
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

    // 5. TELEPORTERS
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
    // ── ESCENA ────────────────────────────────────────────────
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffe6d1, 0.002);

    // ── CÁMARA ────────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 600);
    camera.position.set(7, 8.41, 37);

    // ── RENDERER ──────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
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

    // listener del botón
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

    // ── ILUMINACIÓN ───────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xffeeb1, 0x3a5f8a, 1.5);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffaa33, 2.5);
    sun.position.set(50, 80, 50);
    sun.castShadow = true;
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
// CARGA HDR + MODELO
// ============================================================
function loadEnvironmentAndModel() {
    new RGBELoader().load(
        'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr',
        (hdr) => {
            hdr.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdr;
            scene.background  = hdr;
            scene.backgroundIntensity  = 0.8;
            scene.environmentIntensity = 1.2;

            const pmrem    = new THREE.PMREMGenerator(renderer);
            const envRT    = pmrem.fromEquirectangular(hdr);
            const probe    = LightProbeGenerator.fromCubeRenderTarget(renderer, envRT);
            probe.intensity = 0.8;
            scene.add(probe);
            pmrem.dispose();

            loadGLBModel();
        }
    );
}

function loadGLBModel() {
    const loadingBar = document.getElementById('loading-bar');
    const statusText = document.getElementById('status-text');
    const startBtn   = document.getElementById('start-btn');

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
        'modelos/facu3_opt.glb',
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(100, 100, 100);
            model.position.y = 10;

            // 1. Agregar a la escena primero
            scene.add(model);
            // 2. Actualizar matrices con la posición/escala ya aplicadas
            model.updateMatrixWorld(true);
            // 3. Congelar auto-update (el modelo no se mueve)
            model.traverse(c => { c.matrixAutoUpdate = false; });

            // 4. Materiales + BVH en un solo traverse
            model.traverse((child) => {
                if (!child.isMesh) return;

                child.castShadow    = true;
                child.receiveShadow = true;
                child.frustumCulled = true;

                // Materiales
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

                // BVH — forzar matriz del mundo antes de construir
                child.updateWorldMatrix(true, false);
                child.geometry.boundsTree = new MeshBVH(child.geometry);
                child.layers.enable(LAYER_COLLIDABLE);
                collidableObjects.push(child);
            });

            if (gltf.animations.length > 0) mixer = new THREE.AnimationMixer(model);

            isModelLoaded = true;
            if (statusText) statusText.style.display = 'none';
            if (loadingBar?.parentElement) loadingBar.parentElement.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-block';
        },
        (xhr) => {
            if (xhr.total > 0) {
                const pct = (xhr.loaded / xhr.total * 100).toFixed(0);
                if (loadingBar) loadingBar.style.width = `${pct}%`;
                if (statusText) statusText.innerText   = `PREPARANDO CAMPUS: ${pct}%`;
            }
        },
        (err) => {
            console.error('Error al cargar GLB', err);
            if (statusText) statusText.innerText = 'Error al cargar el modelo.';
        }
    );
}

// ============================================================
// LOOP DE ANIMACIÓN
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    _accumulator += Math.min(dt, FIXED_STEP * MAX_SUBSTEPS);

    if (mixer) mixer.update(dt);

    if (controls.isLocked) {
        while (_accumulator >= FIXED_STEP) {
            physicsStep();
            _accumulator -= FIXED_STEP;
        }

        // Actualizar coordenadas en UI solo si cambiaron
        const p = controls.getObject().position;
        const cx = p.x.toFixed(2), cy = p.y.toFixed(2), cz = p.z.toFixed(2);
        if (cx !== _lastCoordX || cy !== _lastCoordY || cz !== _lastCoordZ) {
            const posDisplay = document.getElementById('pos-values');
            if (posDisplay) posDisplay.innerText = `X: ${cx} | Y: ${cy} | Z: ${cz}`;
            _lastCoordX = cx; _lastCoordY = cy; _lastCoordZ = cz;
        }
    }

    composer.render();
}

// ── ARRANQUE ──────────────────────────────────────────────────
init();

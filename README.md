# FCFM-Recorrido

> Documentación del codigo para el proyecto del Recorrido Virtual de la FCFM. Este documento contiene formato tipo *"Markdown"* , para mejor legibilidad leer este documento en un editor capaz de mostrar este formato. Ejemplos:

> Leer el Readme desde [Github.com](https://github.com/crismldo/FCFM-Recorrido) en el repositorio de este proyecto.

> Previsualizador [Markdownlivepreview](https://markdownlivepreview.com/).

> Alguna extensión para ver documentos estilo Markdown en Visual Studio Code como `"Markdown Preview Enhanced"`

--------
#### ⚠️Advertencia⚠️: Para un Rendimiento optimo mientras se navega en este proyecto, favor de tener encendido `Acceleración de Hardware` en la configuración de su navegador. De lo contrario el proyecto tendrá mucho lag y no sera jugable o testeable apropiadamente.

#### ⚠️Advertencia⚠️: Para evitar subir archivos muy pesados al Github, el `.gitignore` hace que Github no detecte la carpeta `modelos/` ni sus contenidos en tu ordenador

##### No tener esta carpeta o sus contenidos provocará fallo en el programa, por lo que antes de ejecutarlo se debe hacer lo siguiente: 

> En la carpeta principal, crear una nueva carpeta llamda **`modelos.`**

> En `modelos` subir los Modelos 3D con los que se esté trabajando. En caso de no tener estos modelos, favor de preguntar a algun docente encargado o a otros compañeros encargados de este proyecto por una copia de los modelos que se están utilizando.

##### Esto permitirá que el codigo pueda encontrar los modelos que requiere para funcionar sin peligro de sobrecargar el peso del proyecto en Github

#### ⚠️Advertencia⚠️: Por motivos de Estética y de esconder algunas imperfecciones, a la visión del jugador se le añadieron algunos efectos de Post Procesado. Más adeltante en este documento se detallará cuales son y como desactivarlos en caso de ser necesario.


--------

## Modo Desarrollador / Debug

##### Mucho del codigo de este proyecto radica en el uso de Colisiones para determinar acciones que el programa debe realizar, como saber qué edificios dejar de dibujar o para saber en donde estan los limites de cada "Zona"

> Al inicio del codigo de `main.js` se encuentra este bloque de texto. Para Habilitar las funciones del Modo Desarrollador hay que cambiar esta variable a `TRUE`.



```
// ============================================================
// PARA PODER VER LAS COLISIONES Y BOUNDING BOXES, PONER ESTA VARIABLE EN TRUE
// DE LO CONTRARIO ESTAN PERMANECERAN INVISIBLES
// ============================================================
const ModoDebugActivado = false;
```

> Tambien se recomienda tener la Consola del navegador (Accesible mediante las `herramientas para desarrollador`) abierta para poder leer los avisos que se crean segun se modifiquen aspectos del proyecto.



### SpawnDebugBox()

#### Esta funcion se usa para dibujar una Caja que el cliente puede mover usando teclas que solo se pueden usar cuando el `Modo Desarrollador` está activado

```
function SpawnDebugBox(x, y, z, scaleX, scaleY, scaleZ) {
    
    // Si ya existe una caja de debug, la borramos primero
    if (debugBoxHelper) {
        scene.remove(debugBoxHelper);
    }

    const centroInicial = new THREE.Vector3(x, y, z);
    const tamaño = new THREE.Vector3(scaleX, scaleY, scaleZ);

    debugBox = new THREE.Box3().setFromCenterAndSize(centroInicial, tamaño);
    
    
    debugBoxHelper = new THREE.Box3Helper(debugBox, 0x00ffff); 
    scene.add(debugBoxHelper);

    console.log(`Caja Debug Creada`);
    console.log(`Posicion: ${x},${y},${z}`);
    console.log(`Dimensiones: ${scaleX}x${scaleY}x${scaleZ}`);
    console.log("Controles: I/K (Adelante/Atrás), J/L (Izquierda/Derecha), U/O (Abajo/Arriba). Presiona 'M' para imprimir.");
}
```
> Esta funcion es muy útil para hacer una preview de que `tamaño` y en que `posición` quieres poner una colisión y comprobar si realmente cubre el espacio que deseas.

> Para Dibujarla en Escena `Init()` tiene que incluir este segmento de codigo

```
if (ModoDebugActivado == true){
    SpawnDebugBox(10, 10, 10, 0.3, 3, 2)
}
```

> Los primeros 3 valores corresponden a la `posición` en `X, Y y Z`. Los segundos 3 valores son la `escala` que se le aplicará al tamaño del objeto.

> ⚠️Advertencia⚠️: Amenos que el `Modo Desarrollador` esté activado, este objeto nunca se dibujará en camara, así que de preferencia no se elimine esta parte del codigo.


> Para mover la caja se utilizan los siguientes controles 
```
if (ModoDebugActivado == true) {
    const vectorMovimiento = new THREE.Vector3(0, 0, 0);
    // Mapeo de teclas Debug
    if (k === 'i') vectorMovimiento.z -= debugPaso; // Mover adelante
    if (k === 'k') vectorMovimiento.z += debugPaso; // Mover atrás
    if (k === 'j') vectorMovimiento.x -= debugPaso; // Mover izquierda
    if (k === 'l') vectorMovimiento.x += debugPaso; // Mover derecha
    if (k === 'u') vectorMovimiento.y -= debugPaso; // Mover abajo
    if (k === 'o') vectorMovimiento.y += debugPaso; // Mover arriba
    // Mover la Caja
    debugBox.translate(vectorMovimiento);

    // IMPRIMIR COORDENADAS CON 'M'
    if (k === 'm') {
        const centroActual = new THREE.Vector3();
        debugBox.getCenter(centroActual); // Extraemos el centro exacto
        const size = new THREE.Vector3();
        debugBox.getSize(size); // Extraemos el tamaño por si lo olvidaste
        const cX = centroActual.x.toFixed(2);
        const cY = centroActual.y.toFixed(2);
        const cZ = centroActual.z.toFixed(2);

        console.log("=====================================");
        console.log(`POSICION:--------(${cX}, ${cY}, ${cZ})`);
        console.log(`PROPORCIONES:----(${size.x}, ${size.y}, ${size.z})`);
        console.log(`Combinado:-------(${cX}, ${cY}, ${cZ}, ${size.x}, ${size.y}, ${size.z})`);
        //console.log(`CrearCajaDeColision(${cX}, ${cY}, ${cZ}, ${size.x}, ${size.y}, ${size.z});`);
        console.log("=====================================");
    }
}
```

> `U` y `O` Mueven Abajo y Arriba
> `I` y `K` Mueven Adelante y Atrás
> `J` y `L` Mueven Izquierda y Derecha

> `M` Permite imprimir un Mensaje en la consola con la información actual de la caja para que sea facil copiar y pegas estos datos en tus funciones que lo pidan


```
=====================================
POSICION:--------(10.00, 10.00, 10.00)
PROPORCIONES:----(0.3, 3, 2)
Combinado:-------(10.00, 10.00, 10.00, 0.3, 3, 2)
=====================================
```


### CrearCajaDeColision()
#### Para determinar Areas donde los usuarios no puedan pasar, hay que crear Cajas que funcionan como Colisiones para prevenir el paso del usuario.

```
function CrearCajaDeColision(x, y, z, scaleX, scaleY, scaleZ) {
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        wireframe: true,
        transparent: !ModoDebugActivado,
        opacity: ModoDebugActivado ? 1 : 0 
    });
    const collisionBox = new THREE.Mesh(geometry, material);
    collisionBox.position.set(x, y, z);
    collisionBox.scale.set(scaleX, scaleY, scaleZ);
    collisionBox.updateMatrixWorld(true);

    collisionBox.geometry.boundsTree = new MeshBVH(collisionBox.geometry);
    collisionBox.layers.enable(LAYER_COLLIDABLE);
    
    collidableObjects.push(collisionBox);
    scene.add(collisionBox);
}
```

> Al igual que otras Cajas o Bounding Boxes, cada `Caja de Colision` se declaran dentro del `Init()`

```
CrearCajaDeColision(2.60, 13.70, -5.00, 18.5, 8, 29);
```

--------















### Controles y añadir nuevas Teclas

> El movimiento Basico del jugador es `WASD` y Salto con el `Espacio`.

> La tecla `P` es usada para teletransportarse a la entrada de la Facultad, esto es util en caso de perderse en el mapa o en caso de que el jugador quede Atascado en alguna parte de la geometria.

> Para Añadir una nueva Tecla con una nueva accion, se debe definir de esta manera
```
document.addEventListener('keydown', e => {
    const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
    if (k in keys) keys[k] = true;

    if (isModelLoaded && controls.isLocked) {
        if (k === 'p') {
            teletransportarA(new THREE.Vector3(7.0, 8.41, 37.0)); // VOLVER A LA ENTRADA 
        }        
    }
```

> `o` es la tecla a la que le asignameros una nueva funcion en este caso.


--------



### Añadir Informacion sobre la Facultad

##### Para desplegar información hemos creamos objetos con colisiones que al hacer contacto con el jugador, desplegara un _Titulo_ y una _Descripcion_ (en caso de ser necesario). La manera en que lo manejamos es con el nombre de `Salones`, pero esto aplica para cualquier area o departamento que pueda requerir descripción. Mediante esto, se estableceran diferentes puntos a lo largo de las instalaciones para indicar puntos clave de la Facultad

#### Esta información se guarda en 2 partes

> **Salones**: un pseudo-enum que tiene un objeto por cada Area que tendrá información

```
const Salones = Object.freeze({
    //PISO 1
    Princ_Salon_101: 'Princ_Salon_101',
    Princ_Salon_102: 'Princ_Salon_102',
    Princ_Salon_103: 'Princ_Salon_103',
    Princ_Salon_104: 'Princ_Salon_104',
    Princ_Salon_105: 'Princ_Salon_105'

});
```

> **InformacionSalones**: Un Objeto que guarda _ID,_ _Titulo del area,_ y una _Descripcion_ en caso de ser necesaria 

```
const InformacionSalones = {
    [Salones.Sala_Maestros]: { nombre: "Sala de maestros", descripcion: "  DESCRIPCION TEST " },

    //USIT
    [Salones.USIT_entrada]: { nombre: "USIT", descripcion: " " },
    [Salones.USIT_Tienda_Bisonte]: { nombre: "Tienda Bisonte", descripcion: " " },
...
);
```


> Para crear "Salones" que no esten ya definidos, se deben añadir en estas dos secciones

##### Teniendo esta información, ahora pasemos a como que Usa

> Para crear una colision en el mapa se usa la funcion **CrearSalonColision()**

> Para usarla solo se tiene que pedir un objeto **InformacionSalones,** y coordenadas **X, Y, Z**

```
function CrearSalonColision(id, centroX, centroY, centroZ, Salontag) {
    
    loadGLBModel('modelos/A_test.glb', { x: centroX, y: (centroY - 1.3), z: centroZ, scale: 1, tag: Salontag });
    const centro = new THREE.Vector3(centroX, centroY, centroZ);
    const tamaño = new THREE.Vector3(2, 2, 2);
    
    const cajaMatematica = new THREE.Box3().setFromCenterAndSize(centro, tamaño);
    zonasSalones.push({
        id: id,
        box: cajaMatematica
    });

    if (ModoDebugActivado == true) {
        const helper = new THREE.Box3Helper(cajaMatematica, 0x00ff00);
        scene.add(helper);
    }
}
```

> `ID` se trata del valor del pseudo-Enum representando el `Salón` que este objeto mostrará en su información.

```
    CrearSalonColision(Salones.Princ_Dep_Servicios_General, -8.77, 8.05, 3.59);
    CrearSalonColision(Salones.Princ_Cafeteria, -9.14, 8.05, -7.87);
    CrearSalonColision(Salones.Princ_Dep_Direccion, 14.33, 8.05, 6.22);
```

> X Y y Z solo son las coordenadas en donde se colocará el objeto.


> Las llamadas a esta funcion se declaran dentro de la función **init().**

```
function init() {
    ...
    //================ INFORMACION DE SALONES ================================================

    CrearSalonColision(Salones.Princ_Salon_101, -10.0, 7.46, 40.0);
    CrearSalonColision(Salones.Princ_Lab_Mecanica, -10.0, 7.46, 45.0);
    CrearSalonColision(Salones.Princ_Dep_Biblioteca, -10.0, 7.46, 50.0);

    //================ INFORMACION DE SALONES ================================================
    ...
}
```
--------

### Carga de Chunks
##### Con motivo de optimizar el rendimiento del proyecto, el mapa separa los modelos en `pseudo Chunks` o `Zonas` que dividen el mapa en areas donde solo ciertos modelos que sean visibles desde ahí permaneceran cargados. Así modelos que no puedan verse no tendran que ser cargados y no afectaran al rendimiento.

> Llamamos a estas zonas como `Edificios` o `Buildings`, las cuales son Cajas de Colision muy grandes que rodean multiples modelos y su definición es muy parecida a la de los `Salones`.

> Estas zonas son definidas mediante una `Tag` que se le asigna a cada modelo cuando es declarado, y una `Regla de Visibilidad` que define qué `Tags` tendran sus modelos cargados cuando te encuentres dentro de su `Edificio` asignado

```
//  LISTA DE TAGS QUE SE USAN EN LOS MODELOS
const TODOS_LOS_TAGS = ['FACU', 'USIT', 'EST', 'ATRAS'];

// Reglas de Visibilidad
const ReglasVisibilidad = {
    
    'Princ': ['FACU'], // Al entrar a la caja "Princ", solo se muestra la facultad
    
    'back': ['ATRAS'], // Al entrar a la caja "back", solo se muestra la parte de atrás

    'front': ['FACU', 'USIT', 'EST'], // Muestra los edificios de Adelante pero oculta los salones de Atras
    
    'usitbuild': ['USIT'], // Al entrar a la caja "usitbuild", solo se muestra el USIT

    // Exterior es la Regla Default, es para cargar todos los modelos
    'Exterior': ['FACU', 'ATRAS', 'USIT', 'EST']
};
```

> La `Regla de visibilidad` por defecto es la de `Exterior` que define areas sin `Tag` especificadas o que requieran que todos los modelos puedan ser vistos a la vez

```
function CrearBuildingColision(prefijo, centroX, centroY, centroZ, w, h, d) {
    const centro = new THREE.Vector3(centroX, centroY, centroZ);
    const tamaño = new THREE.Vector3(w, h, d);
    const cajaMatematica = new THREE.Box3().setFromCenterAndSize(centro, tamaño);
    zonasEdificios.push({
        prefijo: prefijo, // ej: 'Princ' o 'USIT'
        box: cajaMatematica
    });

    if (ModoDebugActivado == true) {
        const helper = new THREE.Box3Helper(cajaMatematica, 0xffff00);
        scene.add(helper);
    }
    
}
```
> Y su declaración es la siguiente.

```
function init() {
    ...
    //================ INFORMACION DE SALONES ================================================



    CrearBuildingColision('Princ', 3.94, 16.00, -10.95, 35, 20, 44.5);
    CrearBuildingColision('usitbuild', -46.06, 16.00, 18.05, 30, 20, 30);
    CrearBuildingColision('back', 13.27, 16.00, -108.11, 60, 20, 80);
    CrearBuildingColision('front', 12.27, 16.00, 44.89, 60, 20, 40);
    ...
}
```


> `prefijo` se refiere al `Edificio` que esta colisión activa una vez el jugador entra en ella

> Luego tenemos sus coordenadas `X Y y Z` así como sus valores de Escala tambien en `X Y y Z` (Width, Height, Deep)

```
loadGLBModel('modelos/USIT/Modelo1.glb',{ x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
loadGLBModel('modelos/Est/Modelo2.glb',{ x: 0, y: 10, z: -10, scale: 100, tag: 'EST' }),
loadGLBModel('modelos/FACU/Modelo3.glb',{ x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),
```

> Cuando se añada un Modelo, este debe tener asignado una `Tag` para que el codigo sepa a qué `Edificio` pertenece y por lo mismo, bajo que condiciones este modelo debe ser cargado.


--------

### Carga de Modelos
#### Los modelos forman nuestro escenario, así que son la parte que los jugadores verán más comunmente de este proyecto, pero hay que encontrar un balance entre estetica y rendimiento para tratar de que la mayor cantidad de Dispositivos puedan correr el proyecto en sus navegadores

#### ⚠️Advertencia⚠️: Este programa solo acepta modelos en formato `.glb`. Si quieres meter un modelo en otro formato, tendras que reexportarlo a este formato.

> Los modelos se declaran dentro de la funcion `loadEnvironmentAndModel()`

```
function loadEnvironmentAndModel() {
    .......
    try {
        // Configuración modular de tus pedazos de mapa
        await Promise.all([                                        
            //===============================USIT===============================
            loadGLBModel('modelos/USIT-Opt/USIT-Bancas_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
            loadGLBModel('modelos/USIT-Opt/USIT-P1_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
            //===============================ESTACIONAMIENTO===============================
            loadGLBModel('modelos/Est-Opt/Est_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'EST' }),
            loadGLBModel('modelos/Est-Opt/Est-Arboles_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'EST' }),
            //===============================FACU===============================
            loadGLBModel('modelos/FACU/Principal-PB_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),
            loadGLBModel('modelos/FACU/Principal-B_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'FACU' }),
            //===============================SALONES ATRAS===============================
            loadGLBModel('modelos/Salones-Opt/Salones_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),
            loadGLBModel('modelos/Salones-Opt/Salones-Plant_.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'ATRAS' }),                                                            
        ]);
        .........
}
```

> Para evitar dolores de cabeza, a todos los modelos les ponemos la misma posición, la diferencia de posición la hacemos ajustando el Punto de origen del modelo en Blender antes de exportar cada modelo.

> Tambien todos los modelos tienen la misma Transformación de Escala aplicada de 100 en sus 3 ejes. 

```
function loadGLBModel(path, options = {}) {
    return new Promise((resolve, reject) => {
        const posX  = options.x !== undefined ? options.x : 0;
        const posY  = options.y !== undefined ? options.y : 0;
        const posZ  = options.z !== undefined ? options.z : 0;
        const scale = options.scale !== undefined ? options.scale : 100;

        // Definir Tag, si no se define, se pone EST
        const tag = options.tag || 'EST';

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
                ........
            },
            undefined,
            (error) => {
                console.error(`Error cargando el modelo ${path}:`, error);
                reject(error);
            }
        );
    });
}
```
> `path` es la ruta en que se encuentra el modelo.

> Si el modelo se encuentra en la carpeta raiz por si solo, se define así dentro de `loadEnvironmentAndModel()`

```
function loadEnvironmentAndModel() {
    .......
    try {
        await Promise.all([                                        
            .......
            loadGLBModel('Modelo.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
```

> Si el modelo se encuentra en la carpeta de `modelos,` se define así dentro de `loadEnvironmentAndModel()`

```
function loadEnvironmentAndModel() {
    .......
    try {
        await Promise.all([                                        
            loadGLBModel('modelos/Modelo.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
```
> Si el modelo se encuentra dentro de una subcarpeta dentro de `modelos,` (como debe ser) se define así dentro de `loadEnvironmentAndModel()`

```
function loadEnvironmentAndModel() {
    .......
    try {
        await Promise.all([                                        
            loadGLBModel('modelos/Subcarpeta/Modelo.glb', { x: 0, y: 10, z: -10, scale: 100, tag: 'USIT' }),
```
> Ahora pasemos a `options`.

> Dentro de `options` se definen `posX, posY, posZ` (La posicion del modelo), `scale` (la escala aplicada a los 3 ejes del modelo), y `tag` que define de qué `Edificio` formarian parte por motivos de la carga y descarga de Chunks.



--------

### Optimizar Modelos

##### Para asegurarnos de que los modelos sean ligeros y causen la menor cantidad de lag posible, hay que pasarlos por un proceso de optimización que hacemos mediante la libreria `Draco`

> Para instalar la dependencia, correr el siguiente codigo en consola (powershell).

```
npm install -g @gltf-transform/cli
```

> Ahora, para Optimizar un modelo se escribe el siguiente codigo en la consola donde se especificará el nombre del modelo que buscas optimizar y el nombre que deseas darle al modelo optimizado.

```
gltf-transform optimize modelos/facu2.glb modelos/facu3_opt.glb --compress draco --texture-compress webp --flatten false
```

> **modelos/facu2.glb** ------------------- **modelos/facu3_opt.glb**

                ^                           ^
      nombre del modelo original      nombre del modelo optimizado

> Cambiar `Facu2` por el modelo que se vaya a optimizar.

> Por ultimo, reemplazar el modelo original por el modelo optimizado en el codigo. Asi como eliminar el modelo original de la carpeta `modelos/` en caso de ser necesario.
--------



## Efectos de Post Procesado

##### Algunos efectos se pueden añadir a la vision del jugador para dar una impresión mas profesional del proyecto que está probando, sin embargo, se entiende que aveces estos efectos pueden tambien verse poco profesionales, por lo que detallaremos como podemos desactivarlos en caso de que sea decidido que hacen mas mál que bien.



> La seccion pertinente al Post procesado se encuentra en la función `Init()` dentro del apartado `// ── POST-PROCESADO`

> Esta es la versión `minima` del efecto de post procesado, es lo que tenemos que conservar aunque no vayamos a agregar otros efectos ya es necesario.
⚠️Quitar esta parte del codigo creará un error⚠️

```
// ── POST-PROCESADO ────────────────────────────────────────
    // Inicializar el Compositor de Efectos
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
```
#### Ruido / Estática en pantalla
> Esto es el codigo que maneja el dibujado de Ruido en pantalla, lo cual puede ayudar a esconder errores en los materiales o para hacer menos notorio cuando una Textura tiene que ser reducida y por lo miosmo bajó su calidad.

```
// --- RUIDO ---
    
// FilmPass: noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale

// Se recomienda mantener scanlinesIntensity en 0.05 o 0
const filmPass = new FilmPass(0.3, 0.05, 648, false);
composer.addPass(filmPass);
```

> `filmPass` es lo que define al efecto, mientras que `.addPass()` solo es para añadirlo al elemento `composer`, en caso de que quieras desactivar este efecto, puedes comentar la linea que llama a esta función.

> `noiseIntensity` especifica que tan intenso quieres el ruido, si el valor se hacerca mucho a 1, será muy notorio, por lo que un nivel más bajo es recomendado.

#### Viñeta
> Esto añade un efecto negro en los bordes de la imagen que van a mas ligeros y transparentes hacia el centro de la imagen, ocultando levemente algunos objetos mas lejanos de la vista del jugador, lo que ayuda a esconder algunos efectos de Desdibujar elementos que no necesitan ser dibujador en este momento.

```
// --- VIÑETA ---
const vignettePass = new ShaderPass(VignetteShader);

// Que tan lejos las esquinas negras se hacercan al Centro (Entre mas pequeño, mas se acerca)
vignettePass.uniforms['offset'].value = 0.8;
//Que tanta obscuridad absoluta hay en las esquinas (Entre mas grande, más negro)
vignettePass.uniforms['darkness'].value = 1.5;
composer.addPass(vignettePass);
```

> `offset` define que tan pequeño es el "circulo" que no tiene oscuridad en la pantalla, entre mas pequeño y cerca de 0.0, menos se notará la viñeta, y entre más grande sea el valor más se notará la viñeta y el "circulo" será más pequeño.

> `darkness` define que tan intenso quieres el negro de los bordes, un valor mas bajo que 1 le da más transparencia y un valor más alto lo hace mucho mas intenso y dramatico.

--------

## COMENTARIOS


> `13/08/2026` Ojalá esta documentación le sea útil a la siguiente persona que le toque trabajar con este proyecto. En caso de que algun aspecto sea confuso, sientanse libres de actualizar este documento para crear mejor legibilidad o para explicar más detalladamente el funcionamiento de este codigo.

> Gracias por leer.


- Documentación hecha por Dariel Pérez Chávez.
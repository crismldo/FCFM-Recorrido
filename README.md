# FCFM-Recorrido

### Recuerden agregar una carpeta llamada modelos/ y dentro meter el modelo de la facu que vayan a usar :)


#### Para evitar subir modelos muy pesados al Github, el .gitignore hace que Github no detecte la carpeta `modelos/` ni sus contenidos, así que para trabajar en el proyecto hay que hacer lo siguiente

> En la carpeta principal, crear una nueva carpeta llamda **`modelos`**

> En `modelos` subir el Modelo 3D con el que se esté trabajando, en este momento seria el modelo con el nombre **`facu2.glb`**

#### El codigo requiere que los nombres de las carpetas sean exactamente los esperados, si se requiere cambiar el nombre de algun elemento, mandar mensaje en el grupo para ponernos deacuerdo

--------

## Optimizar el Modelo


> Para instalar la dependencia, correr el siguiente codigo en consola (powershell)

``` npm install -g @gltf-transform/cli ```

> Ahora, para Optimizar el modelo se sigue el siguiente codigo

``` gltf-transform optimize modelos/facu2.glb modelos/facu3_opt.glb --compress draco --texture-compress webp --flatten false ```

> **modelos/facu2.glb** ------------------- **modelos/facu3_opt.glb**

                     ^                         ^
      nombre del modelo original      nombre del modelo optimizado


## Añadir Informacion

#### Para desplegar información, creamos objetos con colisiones que al hacer contacto con el jugador, desplegara un Titulo y una Descripcion. La manera en que lo manejamos es con el nombre de "Salones", pero esto aplica para cualquier area o departamento que pueda requerir descripción

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
    // --- PISO 1 ---
    [Salones.Princ_Salon_101]: { nombre: "Salón 101", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_102]: { nombre: "Salón 102", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_103]: { nombre: "Salón 103", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_104]: { nombre: "Salón 104", descripcion: "Aula de clases regulares." },
    [Salones.Princ_Salon_105]: { nombre: "Salón 105", descripcion: "Aula de clases regulares." }
};
```

> Para crear "Salones" que no esten ya definidos, se deben añadir en estas dos secciones

#### Teniendo esta información, ahora pasemos a como que Usa

> Para crear una colision en el mapa se usa la funcion **CrearSalonColision()**

> Para usarla solo se tiene que pedir un objeto **InformacionSalones,** y coordenadas **X, Y, Z**

```
function CrearSalonColision(id, centroX, centroY, centroZ) {

    loadGLBModel('modelos/A_test.glb', { x: centroX, y: (centroY - 1.7), z: centroZ, scale: 1 });
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
```

> Las llamadas a esta funcion se Declaran dentro de la función **init()**

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








 



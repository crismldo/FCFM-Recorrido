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



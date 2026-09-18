# Modelos 3D

Esta pasta existe para modelos GLB/GLTF reais.

O visualizador **não depende** deles: quando um componente não tem `model3D`,
a cena é montada com primitivas do Three.js dimensionadas pela ficha técnica
(ver `lib/three-layout.ts` e `components/three/`).

Para usar um modelo real, coloque o arquivo aqui e aponte o campo `model3D`
do componente em `data/components.ts` para `/models/<arquivo>.glb`.

#!/bin/bash

# Detener el script si ocurre un error
set -e

# Verificar si hay cambios no "commiteados"
if git diff-index --quiet HEAD --; then
  echo "No hay cambios para commit."
  exit 0
else
  echo "Detectados cambios no commiteados."
fi

# Si hay cambios, proceder con el proceso de compilación, add, commit, y push
echo "Compilando..."
node_modules/.bin/parcel build ./src/pose-detector.js --dist-dir ./dist

echo "Añadiendo cambios..."
git add .

echo "Creando commit..."
git commit -m 'Build for new release'

echo "Empujando cambios..."
git push

# Actualizar la versión y publicar en npm
echo "Actualizando versión y publicando..."
npm version patch
npm publish

echo "Proceso completado exitosamente."

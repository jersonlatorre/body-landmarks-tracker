#!/bin/bash

# Detener el script si ocurre un error
set -e

# Si hay cambios, proceder con el proceso de compilación, add, commit, y push
echo "Compilando..."
node_modules/.bin/parcel build ./src/body-tracker.js --dist-dir ./dist

# Envía el archivo compilado a /Users/uno/Desktop/blazepose-html
echo "Enviando archivo compilado a /Users/uno/Desktop/blazepose-html-3..."
cp ./dist/body-tracker.js /Users/uno/Desktop/blazepose-html-3/body-tracker.js

echo "Listo!"

#!/usr/bin/env bash
# Verifica que la plantilla de Documenso se pueda leer con el token de la cuenta.
#
# El token NUNCA se imprime ni se pasa por la línea de comandos: se lee de
# .env.local y viaja solo dentro del proceso de curl.
#
#   bash scripts/verificar-documenso.sh [id-de-plantilla]
#
# Sin argumento usa DOCUMENSO_TEMPLATE_ID de .env.local.

set -uo pipefail
cd "$(dirname "$0")/.."

leer_env() {
  grep -m1 "^$1=" .env.local 2>/dev/null | cut -d= -f2- | sed 's/^["'\'']//; s/["'\'']$//'
}

TOKEN="${DOCUMENSO_API_TOKEN:-$(leer_env DOCUMENSO_API_TOKEN)}"
ID="${1:-${DOCUMENSO_TEMPLATE_ID:-$(leer_env DOCUMENSO_TEMPLATE_ID)}}"

if [ -z "$TOKEN" ]; then
  echo "No encontré DOCUMENSO_API_TOKEN en .env.local."
  echo "Agregalo ahí, o exportalo en esta terminal antes de correr el script."
  exit 1
fi

if [ -z "$ID" ]; then
  echo "Falta el id de la plantilla."
  echo "Pasalo como argumento: bash scripts/verificar-documenso.sh envelope_xxxxx"
  exit 1
fi

echo "Token: encontrado (${#TOKEN} caracteres, no se muestra)"
echo "Plantilla: $ID"
echo

probar() {
  local url="$1"
  local codigo
  codigo=$(curl -s -o /tmp/documenso-check.json -w '%{http_code}' \
    -H "Authorization: $TOKEN" -H 'Content-Type: application/json' \
    --max-time 20 "$url")
  echo "  $codigo  $url"
  [ "$codigo" = "200" ]
}

echo "Probando rutas:"
ENCONTRADA=""
for base in "https://app.documenso.com/api/v2" "https://app.documenso.com/api/v2-beta"; do
  for recurso in "template" "envelope"; do
    if probar "$base/$recurso/$ID"; then
      ENCONTRADA="$base/$recurso/$ID"
      break 2
    fi
  done
done

echo
if [ -z "$ENCONTRADA" ]; then
  echo "Ninguna ruta devolvió 200. Listando las plantillas de la cuenta:"
  for base in "https://app.documenso.com/api/v2" "https://app.documenso.com/api/v2-beta"; do
    codigo=$(curl -s -o /tmp/documenso-list.json -w '%{http_code}' \
      -H "Authorization: $TOKEN" --max-time 20 "$base/template")
    echo "  $codigo  $base/template"
    if [ "$codigo" = "200" ]; then
      echo
      echo "  Ids que devuelve la API:"
      grep -o '"id":[^,}]*' /tmp/documenso-list.json | head -10 | sed 's/^/    /'
      break
    fi
  done
  exit 1
fi

echo "OK: la plantilla se lee desde $ENCONTRADA"
echo
echo "Campos que la API reporta (tienen que estar los nueve):"
grep -o '"label":"[^"]*"' /tmp/documenso-check.json | sed 's/"label":"/    /; s/"$//' | sort

echo
echo "Firmantes:"
grep -o '"role":"[^"]*"' /tmp/documenso-check.json | sed 's/"role":"/    /; s/"$//' | sort | uniq -c

rm -f /tmp/documenso-check.json /tmp/documenso-list.json

#!/bin/bash
# Quick script to test cookie flow from Vercel origin to Render backend

BACKEND="https://ecommerce-app-9a4d.onrender.com"
FRONTEND_ORIGIN="https://ecommerce-app-sepia-kappa.vercel.app"

echo "=== Testing Login Cookie Flow ==="
echo ""
echo "1. Testing OPTIONS preflight for /api/auth/login..."
curl -i -X OPTIONS \
  -H "Origin: ${FRONTEND_ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  "${BACKEND}/api/auth/login"

echo ""
echo "2. Testing POST /api/auth/login (replace with real credentials)..."
curl -i -X POST \
  -H "Origin: ${FRONTEND_ORIGIN}" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"testpass"}' \
  "${BACKEND}/api/auth/login"

echo ""
echo "3. Check if cookies were saved..."
if [ -f cookies.txt ]; then
  echo "Cookies file contents:"
  cat cookies.txt
  echo ""
fi

echo ""
echo "4. Testing GET /api/cart with cookies..."
curl -i -X GET \
  -H "Origin: ${FRONTEND_ORIGIN}" \
  -b cookies.txt \
  "${BACKEND}/api/cart"

echo ""
echo "=== Test Complete ==="

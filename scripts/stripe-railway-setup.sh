#!/bin/bash
# Stripe + Railway setup for book-adventures
# Usage: STRIPE_SECRET_KEY=sk_test_xxx ./scripts/stripe-railway-setup.sh
# Or: stripe login && ./scripts/stripe-railway-setup.sh

set -e
APP_URL="https://web-production-6f70d.up.railway.app"
WEBHOOK_URL="${APP_URL}/api/webhooks/stripe"

echo "=== Stripe + Railway Setup ==="
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Create webhook via Stripe API
if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo "Creating webhook via API..."
  RESP=$(curl -s -u "$STRIPE_SECRET_KEY:" \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "description=book-adventures Railway" \
    https://api.stripe.com/v1/webhook_endpoints)
  
  WH_SECRET=$(echo "$RESP" | grep -o '"secret":"whsec_[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$WH_SECRET" ]; then
    echo "Webhook created. Signing secret: ${WH_SECRET:0:25}..."
    echo ""
    if [ -n "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
      echo "Adding all to Railway..."
      export STRIPE_WEBHOOK_SECRET="$WH_SECRET"
      ./scripts/add-stripe-to-railway.sh
    else
      echo "Add to Railway (get pk_test_ from https://dashboard.stripe.com/test/apikeys):"
      echo "  STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET=$WH_SECRET \\"
      echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx ./scripts/add-stripe-to-railway.sh"
    fi
  else
    echo "Failed. Response: $RESP"
  fi
else
  echo "Option A - Use Stripe CLI:"
  echo "  stripe login"
  echo "  stripe webhook_endpoints create --url '$WEBHOOK_URL' --enabled-events checkout.session.completed --confirm"
  echo ""
  echo "Option B - Use API (paste your sk_test_ key):"
  echo "  STRIPE_SECRET_KEY=sk_test_xxx ./scripts/stripe-railway-setup.sh"
  echo ""
  echo "Option C - Manual: https://dashboard.stripe.com/test/webhooks"
  echo "  Add endpoint: $WEBHOOK_URL"
  echo "  Event: checkout.session.completed"
  echo "  Copy signing secret (whsec_...)"
fi

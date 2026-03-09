#!/bin/bash
# Add Stripe variables to Railway
# Usage: STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx ./scripts/add-stripe-to-railway.sh

set -e
cd "$(dirname "$0")/.."  # app/

if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ] || [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
  echo "Usage: STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx $0"
  echo ""
  echo "Get keys from https://dashboard.stripe.com/test/apikeys"
  echo "Webhook secret from https://dashboard.stripe.com/test/webhooks (after creating endpoint)"
  exit 1
fi

echo "Adding Stripe variables to Railway..."
npx -y @railway/cli variable set "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
npx -y @railway/cli variable set "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
npx -y @railway/cli variable set "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "Done. Redeploy with: npm run deploy"

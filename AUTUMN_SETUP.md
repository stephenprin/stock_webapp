# Autumn Billing Setup Guide

## Phase 1: Setup & Configuration Status

### ✅ Completed Steps

1. **Package Installation**
   - ✅ `autumn-js` installed (v0.1.63)
   - Package is in `package.json` dependencies

2. **Type Definitions**
   - ✅ Subscription types added to `types/global.d.ts`:
     - `SubscriptionPlan` ("free" | "pro" | "enterprise")
     - `SubscriptionLimits` (limits object)
     - `SubscriptionStatus` (status object)
   - ✅ `User` type updated with optional `subscriptionPlan`

### ⏳ Pending Steps

3. **Environment Variables**
   You need to add these to your `.env.local` file:

   ```env
   # Autumn Billing Configuration
   AUTUMN_SECRET_KEY=your_autumn_secret_key_here
   
   # Better Auth Configuration (should already exist)
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=your_better_auth_secret
   ```

4. **External Setup (Manual Steps)**
   Before you can use Autumn Billing, you need to:

   a. **Create Autumn Account**
      - Go to [useautumn.com](https://useautumn.com/)
      - Sign up for an account
      - Navigate to Dashboard

   b. **Connect Stripe Account**
      - In Autumn dashboard, go to Settings → Integrations
      - Connect your Stripe account
      - This enables payment processing

   c. **Create Pricing Products**
      - In Autumn dashboard, go to Products
      - Create "Pro Plan" product:
        - Name: "Pro Plan"
        - Price: $9/month
        - Product ID: `pro` (important - used in code)
      - Create "Enterprise Plan" product:
        - Name: "Enterprise Plan"
        - Price: $29/month
        - Product ID: `enterprise` (important - used in code)
      - Note: Free tier is default, no product needed

   d. **Get Secret Key**
      - In Autumn dashboard, go to Developer → API Keys
      - Copy your `AUTUMN_SECRET_KEY`
      - Add it to `.env.local`

## Next Steps

Once Phase 1 is complete:
1. Verify environment variables are set
2. Test Better Auth initialization with Autumn plugin
3. Proceed to Phase 2: Backend Integration

## Verification

To verify Phase 1 is complete:
- [ ] `autumn-js` package is in `package.json`
- [ ] Subscription types are in `types/global.d.ts`
- [ ] `.env.local` has `AUTUMN_SECRET_KEY`
- [ ] `.env.local` has `BETTER_AUTH_URL`
- [ ] Autumn account created
- [ ] Stripe connected in Autumn
- [ ] Products created in Autumn dashboard


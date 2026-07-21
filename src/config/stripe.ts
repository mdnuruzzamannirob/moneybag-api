import Stripe from 'stripe';
import { env } from './env.js';

// Stripe is optional for local development. Billing operations validate the
// real key before making SDK requests.
const apiKey = env.STRIPE_SECRET_KEY ?? 'sk_test_moneybag_not_configured';

export const stripe = new Stripe(apiKey, {
  appInfo: {
    name: 'MoneyBag',
    version: '2.0',
  },
});

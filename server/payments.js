import { randomUUID } from 'node:crypto';
import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';
import { createClient } from '@supabase/supabase-js';
import express from 'express';

const productId = process.env.DODO_GAMEWEEK_PRODUCT_ID?.trim();
const environment = process.env.DODO_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
const appUrl = (process.env.PLAYXI_PUBLIC_URL || 'https://playfpl.digital').replace(/\/$/, '');
const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim();
const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();

const database = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const dodo = apiKey ? new DodoPayments({ bearerToken: apiKey, environment }) : null;
const webhook = webhookKey ? new Webhook(webhookKey) : null;

// Only a verified merchant account and its live credentials can expose checkout to visitors.
export const checkoutAvailable = Boolean(database && dodo && webhook && productId && environment === 'live_mode');

async function authenticatedUser(request) {
  if (!database) return null;
  const token = /^Bearer (.+)$/i.exec(request.headers.authorization || '')?.[1];
  if (!token) return null;
  const { data, error } = await database.auth.getUser(token);
  return error ? null : data.user;
}

export async function hasGameweekUnlock(request, entryId, eventId) {
  const user = await authenticatedUser(request);
  if (!user || !database) return false;
  const { data, error } = await database.from('gameweek_payment_orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('fpl_entry_id', String(entryId))
    .eq('event_id', eventId)
    .eq('status', 'paid')
    .limit(1);
  if (error) {
    console.error('Could not check Gameweek unlock:', error);
    return false;
  }
  return Boolean(data?.length);
}

export function registerPaymentRoutes(app, loadTransferPreview) {
  app.get('/api/payments/config', (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json({ checkoutAvailable });
  });

  app.post('/api/payments/gameweek-checkout', express.json({ limit: '8kb' }), async (request, response) => {
    response.set('Cache-Control', 'no-store');
    if (!checkoutAvailable) return response.status(503).json({ error: 'Gameweek checkout is not available yet.' });
    const user = await authenticatedUser(request);
    if (!user?.email) return response.status(401).json({ error: 'Sign in to unlock Gameweek ideas.' });
    const entryId = Number(request.body?.entryId);
    if (!Number.isSafeInteger(entryId) || entryId < 1 || entryId > 999999999999) {
      return response.status(400).json({ error: 'Enter a valid FPL Team ID.' });
    }
    try {
      const preview = await loadTransferPreview(entryId);
      if (!preview.lockedCount) return response.status(409).json({ error: 'There are no additional ideas to unlock for this Gameweek.' });
      if (await hasGameweekUnlock(request, entryId, preview.eventId)) {
        return response.status(409).json({ error: 'This Gameweek is already unlocked. Refresh your team.' });
      }
      const orderId = randomUUID();
      const { error: insertError } = await database.from('gameweek_payment_orders').insert({
        id: orderId, user_id: user.id, fpl_entry_id: String(entryId), event_id: preview.eventId,
      });
      if (insertError) throw insertError;

      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email, name: user.user_metadata?.full_name || user.email },
        metadata: { playxi_order_id: orderId },
        return_url: `${appUrl}/?checkout=return`,
        cancel_url: `${appUrl}/?checkout=cancelled`,
      });
      if (!session.checkout_url || !session.session_id) throw new Error('Dodo did not return a checkout session.');
      const { error: updateError } = await database.from('gameweek_payment_orders')
        .update({ checkout_session_id: session.session_id }).eq('id', orderId);
      if (updateError) throw updateError;
      response.json({ checkoutUrl: session.checkout_url });
    } catch (error) {
      console.error('Could not create Dodo checkout:', error);
      response.status(502).json({ error: 'Could not start checkout. Please try again later.' });
    }
  });

  app.post('/api/payments/dodo-webhook', express.raw({ type: 'application/json', limit: '128kb' }), async (request, response) => {
    if (!database || !dodo || !webhook || !Buffer.isBuffer(request.body)) return response.sendStatus(503);
    let payload;
    try {
      const raw = request.body.toString('utf8');
      webhook.verify(raw, {
        'webhook-id': request.headers['webhook-id'] || '',
        'webhook-signature': request.headers['webhook-signature'] || '',
        'webhook-timestamp': request.headers['webhook-timestamp'] || '',
      });
      payload = JSON.parse(raw);
    } catch {
      return response.sendStatus(400);
    }
    if (payload.type !== 'payment.succeeded' && payload.type !== 'refund.succeeded') return response.sendStatus(200);
    const paymentId = payload.data?.payment_id;
    if (typeof paymentId !== 'string' || !paymentId.startsWith('pay_')) return response.sendStatus(200);
    try {
      if (payload.type === 'refund.succeeded') {
        const { error } = await database.from('gameweek_payment_orders')
          .update({ status: 'refunded' }).eq('payment_id', paymentId);
        if (error) throw error;
        return response.sendStatus(200);
      }
      const payment = await dodo.payments.retrieve(paymentId);
      const orderId = payment.metadata?.playxi_order_id;
      if (payment.status !== 'succeeded' || payment.currency !== 'INR' || payment.total_amount < 2900
        || typeof orderId !== 'string' || !/^[a-f0-9-]{36}$/i.test(orderId)) return response.sendStatus(200);
      const { data: order, error: findError } = await database.from('gameweek_payment_orders')
        .select('id, checkout_session_id, status').eq('id', orderId).maybeSingle();
      if (findError) throw findError;
      if (!order || order.status === 'refunded') return response.sendStatus(200);
      // Dodo can deliver the event before checkoutSessions.create has returned to our API.
      if (!order.checkout_session_id) return response.sendStatus(500);
      if (payment.checkout_session_id !== order.checkout_session_id) return response.sendStatus(200);
      const { error: updateError } = await database.from('gameweek_payment_orders')
        .update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() })
        .eq('id', orderId).eq('status', 'pending');
      if (updateError) throw updateError;
      response.sendStatus(200);
    } catch (error) {
      console.error('Could not process Dodo webhook:', error);
      response.sendStatus(500);
    }
  });
}

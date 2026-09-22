const crypto = require('crypto');

const APP_SLUG = process.env.IZAKHONO_PAY_APP_SLUG || 'legacymart-makers';

function gatewayConfig() {
  const url = String(process.env.IZAKHONO_PAY_URL || '').trim().replace(/\/$/, '');
  const apiKey = String(process.env.IZAKHONO_PAY_API_KEY || '').trim();
  const callbackSecret = String(process.env.IZAKHONO_PAY_CALLBACK_SECRET || '').trim();
  return { url, apiKey, callbackSecret, configured: Boolean(url && apiKey && callbackSecret) };
}

function safeGatewayUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname))) {
    throw new Error('IZAKHONO PAY URL must be HTTPS or loopback HTTP');
  }
  return url;
}

async function request(path, options = {}) {
  const { url, apiKey } = gatewayConfig();
  if (!url || !apiKey) throw new Error('IZAKHONO PAY is not configured');
  const base = safeGatewayUrl(url);
  const target = new URL(path, base.origin);
  const response = await fetch(target, {
    ...options,
    headers: {
      accept: 'application/json',
      'x-izakhono-app': APP_SLUG,
      'x-izakhono-key': apiKey,
      ...(options.body ? {'content-type':'application/json'} : {}),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload || payload.ok !== true) {
    throw new Error(String(payload.error || `IZAKHONO PAY HTTP ${response.status}`));
  }
  return payload;
}

async function createPaymentOrder({ productCode, customerName, customerEmail, customerReference }) {
  const payload = await request('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify({
      product_code: productCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_reference: customerReference
    })
  });
  const order = payload.order || {};
  if (!order.id || !order.product_code || !Number.isInteger(order.amount_minor)) {
    throw new Error('IZAKHONO PAY returned an invalid order');
  }
  if (order.redirect_url) {
    const checkout = safeGatewayUrl(order.redirect_url);
    if (checkout.protocol !== 'https:') throw new Error('Hosted checkout must use HTTPS');
  }
  return order;
}

async function getPaymentStatus(orderId) {
  const payload = await request(`/api/v1/orders/status?order=${encodeURIComponent(orderId)}`);
  const order = payload.order || {};
  if (!order.id || !order.product_code || !Number.isInteger(order.amount_minor)) {
    throw new Error('IZAKHONO PAY returned an invalid order status');
  }
  return order;
}

function verifyPaidCallback(headers, rawBody) {
  const { callbackSecret } = gatewayConfig();
  if (!callbackSecret) throw new Error('IZAKHONO PAY callback secret is not configured');
  const timestamp = String(headers['x-izakhono-timestamp'] || '').trim();
  const signature = String(headers['x-izakhono-signature'] || '').trim().toLowerCase();
  const eventName = String(headers['x-izakhono-event'] || '').trim();
  const eventId = String(headers['x-izakhono-event-id'] || '').trim();
  if (!/^\d{10,13}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(signature) || eventName !== 'payment.paid' || !eventId) {
    return { ok:false };
  }
  const ts = Number(timestamp);
  const seconds = ts > 2e10 ? Math.floor(ts / 1000) : ts;
  if (!Number.isFinite(seconds) || Math.abs(Math.floor(Date.now()/1000) - seconds) > 300) return { ok:false };
  const expected = crypto.createHmac('sha256', callbackSecret).update(timestamp + '.').update(rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature,'hex'), Buffer.from(expected,'hex'))) return { ok:false };
  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return { ok:false }; }
  if (payload?.event !== 'payment.paid' || payload?.event_id !== eventId || payload?.merchant !== APP_SLUG) return { ok:false };
  return { ok:true, eventId, payload };
}

module.exports = { APP_SLUG, gatewayConfig, createPaymentOrder, getPaymentStatus, verifyPaidCallback };

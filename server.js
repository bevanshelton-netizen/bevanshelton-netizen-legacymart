const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const marketplacePay = require('./marketplace-pay');

const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  });
}

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const PAYFAST_MODE = process.env.PAYFAST_MODE || 'sandbox';
const CHECKOUT_ENABLED = process.env.CHECKOUT_ENABLED !== 'false';
const PAYFAST_URL = PAYFAST_MODE === 'live' ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process';
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10000100';
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-this-long-secret';
const PRICE = process.env.PRODUCT_PRICE || '199.00';
const MARKETPLACE_FEE_PERCENT = Number(process.env.MARKETPLACE_FEE_PERCENT || 8);
const REFERENCE_CHECKOUT_ENABLED = process.env.REFERENCE_CHECKOUT_ENABLED === 'true';
const REFERENCE_PRODUCTS = Object.freeze({
  'BS-HOODIE-001': { product_code:'bs-signature-hoodie', title:'BEVAN SHELTON™ Signature Hoodie', amount_minor:55000 },
  'BS-TRACK-001': { product_code:'bs-signature-tracksuit', title:'BEVAN SHELTON™ Signature Tracksuit', amount_minor:68000 },
  'BS-GOLFER-001': { product_code:'bs-branded-golfer', title:'BEVAN SHELTON™ Branded Golfer', amount_minor:25000 },
  'BS-TEE-001': { product_code:'bs-branded-tee', title:'BEVAN SHELTON™ Branded Tee', amount_minor:19000 }
});
const ANALYTICS_URL = (() => {
  const raw = String(process.env.IZAKHONO_ANALYTICS_URL || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const loopback = url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname);
    return (url.protocol === 'https:' || loopback) ? url.origin : '';
  } catch { return ''; }
})();
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DOWNLOAD_DIR = path.join(PUBLIC_DIR, 'downloads');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const VENDORS_FILE = path.join(DATA_DIR, 'vendors.json');
const PRODUCT_FILE = 'faith-personified-my-journey.pdf';
const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
});
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
for (const f of [ORDERS_FILE, VENDORS_FILE]) if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');

function readJson(file){ try { return JSON.parse(fs.readFileSync(file,'utf8') || '[]'); } catch { return []; } }
function writeJson(file,data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }
function esc(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function body(req){ return new Promise(resolve => { let d=''; req.on('data', c => d += c); req.on('end', () => resolve(querystring.parse(d))); }); }
function rawBody(req){ return new Promise((resolve,reject) => { const chunks=[]; let size=0; req.on('data', chunk => { size += chunk.length; if (size > 131072) { reject(new Error('request too large')); req.destroy(); return; } chunks.push(chunk); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
function moneyMinor(value){ return 'R' + (Number(value || 0) / 100).toFixed(2); }
function referenceProduct(sku){ return REFERENCE_PRODUCTS[String(sku || '').trim().toUpperCase()] || null; }
function mutateOrder(id, fn){ const orders=readJson(ORDERS_FILE); const order=orders.find(o => o.id===id); if (!order) return null; fn(order); order.updated_at=new Date().toISOString(); writeJson(ORDERS_FILE,orders); return order; }
function marketplaceOrderByGatewayId(gatewayId){ return readJson(ORDERS_FILE).find(o => o.kind==='marketplace-reference' && o.gateway_order_id===gatewayId) || null; }
function send(res, status, html, type='text/html'){ res.writeHead(status, {...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': 'no-store'}); res.end(html); }
function page(title, content){ const analytics = ANALYTICS_URL ? `<script defer src="${ANALYTICS_URL}/beacon.js?platform=legacymart"></script>` : ''; return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="LegacyMart is a purpose-driven marketplace for trusted products, creators, entrepreneurs and community commerce."><title>${esc(title)} | LegacyMart</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/premium-v1.css">${analytics}</head><body data-quality-profile="izakhono-premium-v1"><header><a class="brand" href="/"><span class="mark">LM</span><span><b>LegacyMart</b><small>Trade • Community • Lasting Impact</small></span></a><nav><a href="/shop">Shop</a><a href="/faith-personified">Faith Personified</a><a href="/become-a-vendor">Become a Vendor</a><a href="/how-it-works">How It Works</a><a href="/about">About</a></nav></header><main>${content}</main><footer><b>LegacyMart</b><p>Buy with purpose. Sell with purpose. Build legacy.</p><p><a href="/privacy">Privacy</a> · <a href="/refunds">Refunds</a> · <a href="/terms">Terms</a> · <a href="/vendor-terms">Vendor Terms</a> · <a href="/admin">Admin</a></p></footer><script src="/share-widget.js" defer></script><script src="/learner-driver-promo.js" defer></script></body></html>`; }
function sign(data){ const clean = {...data}; delete clean.signature; let out = Object.keys(clean).filter(k => clean[k] !== '').sort().map(k => `${k}=${encodeURIComponent(clean[k]).replace(/%20/g,'+')}`).join('&'); if (PASSPHRASE) out += `&passphrase=${encodeURIComponent(PASSPHRASE).replace(/%20/g,'+')}`; return crypto.createHash('md5').update(out).digest('hex'); }

function home(){ return page('Home', `<section class="hero"><div><p class="eyebrow">A purpose-driven marketplace</p><h1>Buy. Sell. Build. Grow.</h1><p class="lead">LegacyMart helps authors, creators, educators, ministries, small businesses and entrepreneurs sell products online with dignity, trust and lasting impact.</p><p><a class="btn primary" href="/faith-personified">Buy the Ebook</a><a class="btn ghost" href="/become-a-vendor">Become a Vendor</a></p></div><div class="hero-card"><div class="bigmark">LM</div><h2>Trade • Community • Lasting Impact</h2><p>Launching first with Bevan Shelton’s ebook, then opening to selected vendors.</p></div></section><section class="grid"><article><h2>Faith Personified – My Journey</h2><p>A true-life journey of faith, survival, leadership, ministry, family, entrepreneurship, healing, purpose and divine restoration.</p><p class="price">R${PRICE}</p><a class="btn primary" href="/checkout">Buy via PayFast</a></article><article class="dark"><h2>Start selling on LegacyMart</h2><p>Apply if you have ebooks, printed books, clothing, courses, digital downloads, faith-based resources, study guides, business tools or creative products.</p><a class="btn light" href="/become-a-vendor">Apply to Sell</a></article></section>`); }
function shop(){ return page('Shop', `<section><h1>LegacyMart Shop</h1><div class="product"><h2>Faith Personified – My Journey</h2><p>By Bevan Shelton</p><p>Downloadable ebook. Secure PayFast checkout. Instant access after successful payment confirmation.</p><p class="price">R${PRICE}</p><a class="btn primary" href="/checkout">Buy Ebook</a></div></section>`); }
function faith(){ return page('Faith Personified', `<section><p class="eyebrow">Featured launch product</p><h1>Faith Personified – My Journey</h1><h2>By Bevan Shelton</h2><p class="lead">This book is a true-life journey of faith, survival, rejection, leadership, ministry, family, entrepreneurship, healing, purpose and divine restoration.</p><p>It speaks to the wounded, the dreamer, the believer, the leader, the entrepreneur and the person who knows there is still more inside them.</p><p><b>Format:</b> PDF ebook. <b>Delivery:</b> Instant download after PayFast confirms payment.</p><p class="price">R${PRICE}</p><a class="btn primary" href="/checkout">Buy Now via PayFast</a></section>`); }
function checkout(){
  const payment = CHECKOUT_ENABLED
    ? `<form method="post" action="/payfast/start" class="form" onsubmit="window.izakhonoTrack?.('checkout_start')"><input name="name_first" placeholder="First name" required><input name="name_last" placeholder="Last name" required><input name="email_address" type="email" placeholder="Email address" required><button class="btn primary" type="submit">Continue to PayFast</button><p class="small">Downloads are protected until payment is confirmed.</p></form>`
    : `<div class="form"><h3>Private pilot checkout is disabled</h3><p>No payment will be accepted from this owner-host pilot.</p></div>`;
  return page('Checkout', `<section><h1>Secure Checkout</h1><div class="checkout"><div><h2>Faith Personified – My Journey</h2><p>Digital ebook PDF delivered after successful payment confirmation.</p><p class="price">R${PRICE}</p></div>${payment}</div></section>`);
}

function referenceCheckout(sku){
  const product = referenceProduct(sku);
  if (!product) return page('Reference Checkout', '<section><h1>Product not found</h1><a class="btn primary" href="/shop?seller=bevan-shelton">Back to BEVAN SHELTON™</a></section>');
  const gatewayReady = marketplacePay.gatewayConfig().configured;
  const enabled = REFERENCE_CHECKOUT_ENABLED && gatewayReady;
  const payment = enabled
    ? `<form method="post" action="/marketplace/pay" class="form"><input type="hidden" name="sku" value="${esc(sku)}"><input name="customer_name" placeholder="Full name" required><input name="customer_email" type="email" placeholder="Email address" required><input name="phone" placeholder="Mobile number" required><select name="size" required><option value="">Select size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>2XL</option><option>3XL</option><option>4XL</option><option>5XL</option><option>6XL</option></select><input name="address1" placeholder="Street address" required><input name="suburb" placeholder="Suburb"><input name="city" placeholder="City" required><input name="province" placeholder="Province" required><input name="postal_code" placeholder="Postal code" required><button class="btn primary" type="submit">Continue to secure payment</button><p class="small">Payment is handled by IZAKHONO PAY using the configured hosted provider. Card details never pass through LegacyMart.</p></form>`
    : `<div class="form"><h3>Reference checkout staged</h3><p>The product and payment contract are ready, but this shop will not accept money until <code>REFERENCE_CHECKOUT_ENABLED=true</code> and the owner-host IZAKHONO PAY credentials are present.</p></div>`;
  const fee = Math.round(product.amount_minor * MARKETPLACE_FEE_PERCENT / 100);
  return page('BEVAN SHELTON™ Trial Checkout', `<section><p class="eyebrow">Owner-operated reference transaction</p><h1>Trial Checkout</h1><div class="checkout"><div><h2>${esc(product.title)}</h2><p>Sold by <b>BEVAN SHELTON™</b> · Operated by Bevan Shelton</p><p class="price">${moneyMinor(product.amount_minor)}</p><p class="small">Reference ledger: ${MARKETPLACE_FEE_PERCENT}% marketplace fee = ${moneyMinor(fee)}; seller amount = ${moneyMinor(product.amount_minor-fee)}. Because the marketplace owner and seller are the same during this trial, no third-party payout is triggered.</p></div>${payment}</div></section>`);
}

function marketplaceReturnPage(order, providerStatus){
  if (!order) return page('Payment Status','<section><h1>Order not found</h1></section>');
  const paid = order.status === 'paid';
  return page('Payment Status', `<section><p class="eyebrow">BEVAN SHELTON™ reference transaction</p><h1>${paid ? 'Payment confirmed' : 'Payment pending'}</h1><p>Order <b>${esc(order.id)}</b></p><p>Product: <b>${esc(order.product_title)}</b></p><p>Status: <b>${esc(order.status)}</b>${providerStatus ? ` · Provider: ${esc(providerStatus)}` : ''}</p>${paid ? '<p>The order is now ready for fulfilment testing.</p>' : '<p>LegacyMart does not mark this order paid from the browser return alone. It waits for the signed gateway callback or an independent server-side status confirmation.</p>'}<a class="btn primary" href="/shop?seller=bevan-shelton">Back to reference shop</a></section>`);
}

function vendor(){ return page('Become a Vendor', `<section><h1>Start Selling on LegacyMart</h1><p class="lead">Turn your book, product, course, message or creative gift into an income-generating online store.</p><form method="post" action="/vendor/apply" class="form"><input name="full_name" placeholder="Full name" required><input name="business_name" placeholder="Business name" required><input name="email" type="email" placeholder="Email" required><input name="whatsapp" placeholder="WhatsApp number" required><input name="province" placeholder="Province"><select name="category"><option>Ebooks</option><option>Printed books</option><option>Clothing</option><option>Courses</option><option>Faith-based resources</option><option>Creative products</option><option>Business templates</option></select><textarea name="description" placeholder="Tell us what you want to sell" required></textarea><label><input type="checkbox" required> I agree to the vendor terms.</label><button class="btn primary" type="submit">Submit Vendor Application</button></form></section>`); }
function simple(title, text){ return page(title, `<section><h1>${esc(title)}</h1><p class="lead">${text}</p></section>`); }
function admin(query){ if (query.token !== ADMIN_TOKEN) return page('Admin', `<section><h1>Admin</h1><p>Use:</p><code>/admin?token=YOUR_ADMIN_TOKEN</code></section>`); const orders = readJson(ORDERS_FILE); const vendors = readJson(VENDORS_FILE); const rows = orders.map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.email)}</td><td>${esc(o.status)}</td><td>R${esc(o.amount)}</td><td>${esc(o.created_at)}</td></tr>`).join(''); const vrows = vendors.map(v => `<tr><td>${esc(v.full_name)}</td><td>${esc(v.business_name)}</td><td>${esc(v.email)}</td><td>${esc(v.category)}</td><td>${esc(v.created_at)}</td></tr>`).join(''); return page('Admin', `<section><h1>Admin Dashboard</h1><p><a class="btn ghost" href="/admin/orders.csv?token=${ADMIN_TOKEN}">Export Orders CSV</a><a class="btn ghost" href="/admin/vendors.csv?token=${ADMIN_TOKEN}">Export Vendors CSV</a></p><h2>Orders</h2><table><tr><th>Order</th><th>Email</th><th>Status</th><th>Amount</th><th>Created</th></tr>${rows || '<tr><td colspan="5">No orders yet.</td></tr>'}</table><h2>Vendor Applications</h2><table><tr><th>Name</th><th>Business</th><th>Email</th><th>Category</th><th>Created</th></tr>${vrows || '<tr><td colspan="5">No vendor applications yet.</td></tr>'}</table></section>`); }
function csv(rows, fields){ return [fields.join(','), ...rows.map(r => fields.map(f => `"${String(r[f] || '').replace(/"/g,'""')}"`).join(','))].join('\n'); }
function staticFile(req,res){ const safe = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^\/+/, ''); const file = path.join(PUBLIC_DIR, safe); if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return false; const ext = path.extname(file).toLowerCase(); const types = {'.css':'text/css','.pdf':'application/pdf'}; res.writeHead(200, {...SECURITY_HEADERS, 'Content-Type': types[ext] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res); return true; }

http.createServer(async (req,res) => {
  const url = new URL(req.url, BASE_URL);
  if (req.method === 'GET' && staticFile(req,res)) return;
  if (req.method === 'GET' && url.pathname === '/') return send(res,200,home());
  if (req.method === 'GET' && url.pathname === '/shop') return send(res,200,shop());
  if (req.method === 'GET' && url.pathname === '/faith-personified') return send(res,200,faith());
  if (req.method === 'GET' && url.pathname === '/checkout') { const sku=url.searchParams.get('sku'); return send(res,200,sku ? referenceCheckout(sku) : checkout()); }
  if (req.method === 'GET' && url.pathname === '/become-a-vendor') return send(res,200,vendor());
  if (req.method === 'GET' && url.pathname === '/how-it-works') return send(res,200,simple('How It Works','Buyers browse, buy, pay securely through PayFast and receive downloads or delivery. Vendors apply, get approved, upload products, fulfil orders and grow income.'));
  if (req.method === 'GET' && url.pathname === '/about') return send(res,200,simple('About LegacyMart','LegacyMart is a South African-born, purpose-driven marketplace for trade, community and lasting impact.'));
  if (req.method === 'GET' && url.pathname === '/privacy') return send(res,200,simple('Privacy Policy','We collect buyer and vendor information only to process orders, vendor applications, communication and platform operations, following POPIA principles.'));
  if (req.method === 'GET' && url.pathname === '/refunds') return send(res,200,simple('Refund Policy','Digital products are generally non-refundable once downloaded, unless defective or incorrectly supplied. Physical product returns depend on seller terms and consumer law.'));
  if (req.method === 'GET' && url.pathname === '/terms') return send(res,200,simple('Terms and Conditions','Users must provide accurate information, use PayFast checkout lawfully, respect intellectual property and follow marketplace rules.'));
  if (req.method === 'GET' && url.pathname === '/vendor-terms') return send(res,200,simple('Vendor Terms','Vendors are responsible for product accuracy, legality, quality, fulfilment, customer support and compliance with platform standards.'));
  if (req.method === 'GET' && url.pathname === '/contact') return send(res,200,simple('Contact','For sales, support and vendor enquiries, use the LegacyMart contact channels published at launch.'));
  if (req.method === 'GET' && url.pathname === '/health') return send(res,200,JSON.stringify({ok:true,service:'LegacyMart',checkout_enabled:CHECKOUT_ENABLED,payfast_mode:PAYFAST_MODE,reference_checkout_enabled:REFERENCE_CHECKOUT_ENABLED,izakhono_pay_configured:marketplacePay.gatewayConfig().configured}),'application/json');
  if (req.method === 'GET' && url.pathname === '/admin') return send(res,200,admin(Object.fromEntries(url.searchParams.entries())));
  if (req.method === 'GET' && url.pathname === '/admin/orders.csv') { if (url.searchParams.get('token') !== ADMIN_TOKEN) return send(res,403,'Forbidden','text/plain'); return send(res,200,csv(readJson(ORDERS_FILE),['id','email','status','amount','created_at']),'text/csv'); }
  if (req.method === 'GET' && url.pathname === '/admin/vendors.csv') { if (url.searchParams.get('token') !== ADMIN_TOKEN) return send(res,403,'Forbidden','text/plain'); return send(res,200,csv(readJson(VENDORS_FILE),['full_name','business_name','email','whatsapp','province','category','description','created_at']),'text/csv'); }
  if (req.method === 'POST' && url.pathname === '/api/izakhono-pay/webhook') {
    try {
      const raw = await rawBody(req);
      const verified = marketplacePay.verifyPaidCallback(req.headers, raw);
      if (!verified.ok) return send(res,403,'Forbidden','text/plain');
      const eventOrder = verified.payload?.order || {};
      const localId = String(eventOrder.customer_reference || '');
      const local = readJson(ORDERS_FILE).find(o => o.id===localId && o.kind==='marketplace-reference');
      if (!local) return send(res,404,'Order not found','text/plain');
      const product = referenceProduct(local.sku);
      if (!product || eventOrder.id !== local.gateway_order_id || eventOrder.product_code !== product.product_code || Number(eventOrder.amount_minor) !== product.amount_minor) return send(res,409,'Order mismatch','text/plain');
      if (local.payment_event_id === verified.eventId && local.status === 'paid') return send(res,200,'OK','text/plain');
      mutateOrder(local.id, o => { o.status='paid'; o.payment_event_id=verified.eventId; o.paid_at=eventOrder.paid_at || new Date().toISOString(); o.provider='izakhono-pay'; o.bank_reference=eventOrder.bank_reference || ''; });
      return send(res,200,'OK','text/plain');
    } catch (err) { return send(res,400,'Invalid payment callback','text/plain'); }
  }
  if (req.method === 'POST' && url.pathname === '/marketplace/pay') {
    if (!REFERENCE_CHECKOUT_ENABLED || !marketplacePay.gatewayConfig().configured) return send(res,503,'Reference checkout is not enabled','text/plain');
    try {
      const b=await body(req);
      const sku=String(b.sku || '').trim().toUpperCase();
      const product=referenceProduct(sku);
      if (!product) return send(res,400,'Unknown product','text/plain');
      const name=String(b.customer_name || '').trim().slice(0,120);
      const email=String(b.customer_email || '').trim().toLowerCase().slice(0,120);
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res,400,'Valid name and email required','text/plain');
      const id='LMM-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const fee=Math.round(product.amount_minor * MARKETPLACE_FEE_PERCENT / 100);
      const orders=readJson(ORDERS_FILE);
      orders.push({
        id,kind:'marketplace-reference',shop:'bevan-shelton',seller:'BEVAN SHELTON™',operator:'Bevan Shelton',
        sku,product_code:product.product_code,product_title:product.title,email,status:'pending',
        amount:(product.amount_minor/100).toFixed(2),amount_minor:product.amount_minor,
        marketplace_fee_minor:fee,seller_due_minor:product.amount_minor-fee,
        size:String(b.size || '').slice(0,12),phone:String(b.phone || '').slice(0,40),
        shipping:{address1:String(b.address1 || '').slice(0,180),suburb:String(b.suburb || '').slice(0,120),city:String(b.city || '').slice(0,120),province:String(b.province || '').slice(0,120),postal_code:String(b.postal_code || '').slice(0,20)},
        created_at:new Date().toISOString()
      });
      writeJson(ORDERS_FILE,orders);
      const gateway=await marketplacePay.createPaymentOrder({productCode:product.product_code,customerName:name,customerEmail:email,customerReference:id});
      if (gateway.product_code !== product.product_code || gateway.amount_minor !== product.amount_minor) {
        mutateOrder(id,o=>{o.status='failed';o.failure_reason='gateway-order-mismatch';});
        return send(res,502,'Payment order validation failed','text/plain');
      }
      mutateOrder(id,o=>{o.gateway_order_id=gateway.id;o.provider=gateway.provider || gateway.payment_method;o.provider_status=gateway.status || 'pending';});
      if (gateway.redirect_url) { res.writeHead(303,{Location:gateway.redirect_url,'Cache-Control':'no-store'}); return res.end(); }
      if (gateway.payment_method === 'eft' && gateway.bank) {
        const bank=gateway.bank;
        return send(res,200,page('EFT Payment',`<section><h1>Reference order created</h1><p>Order <b>${esc(id)}</b></p><p>Pay <b>${moneyMinor(product.amount_minor)}</b> using reference <b>${esc(gateway.payment_reference || '')}</b>.</p><p>${esc(bank.bank_name || '')} · ${esc(bank.account_name || '')}<br>Account: ${esc(bank.account_number || '')}<br>Branch: ${esc(bank.branch_code || '')}</p><p class="small">The order remains pending until IZAKHONO PAY verifies settlement.</p></section>`));
      }
      return send(res,502,'No supported payment route returned','text/plain');
    } catch (err) { return send(res,502,page('Payment unavailable','<section><h1>Secure payment is unavailable</h1><p>The reference order was not activated. Please retry after the owner-host payment service is verified.</p></section>')); }
  }
  if (req.method === 'GET' && url.pathname === '/payment/return') {
    const gatewayId=String(url.searchParams.get('order') || '');
    let local=marketplaceOrderByGatewayId(gatewayId);
    if (!local) return send(res,404,marketplaceReturnPage(null,''));
    try {
      const status=await marketplacePay.getPaymentStatus(gatewayId);
      const product=referenceProduct(local.sku);
      if (product && status.product_code===product.product_code && status.amount_minor===product.amount_minor && status.status==='paid') {
        local=mutateOrder(local.id,o=>{o.status='paid';o.provider_status=status.provider_status || 'PAID';o.paid_at=o.paid_at || new Date().toISOString();});
      } else {
        local=mutateOrder(local.id,o=>{o.provider_status=status.provider_status || status.status || 'pending';});
      }
      return send(res,200,marketplaceReturnPage(local,status.provider_status || status.status));
    } catch { return send(res,200,marketplaceReturnPage(local,'pending')); }
  }
  if (req.method === 'POST' && url.pathname === '/vendor/apply') { const b = await body(req); const vendors = readJson(VENDORS_FILE); vendors.push({...b, created_at:new Date().toISOString()}); writeJson(VENDORS_FILE, vendors); return send(res,200,page('Vendor Application Received','<section><h1>Application Received</h1><p>Thank you. LegacyMart will review your application before approval.</p><a class="btn primary" href="/">Back Home</a></section>')); }
  if (req.method === 'POST' && url.pathname === '/payfast/start') { if (!CHECKOUT_ENABLED) return send(res,503,'Checkout disabled in private pilot','text/plain'); const b = await body(req); const id = 'LM-' + Date.now(); const orders = readJson(ORDERS_FILE); orders.push({id,email:b.email_address,status:'pending',amount:PRICE,created_at:new Date().toISOString()}); writeJson(ORDERS_FILE, orders); const data = {merchant_id:MERCHANT_ID, merchant_key:MERCHANT_KEY, return_url:`${BASE_URL}/thank-you?order=${id}`, cancel_url:`${BASE_URL}/checkout?cancelled=1`, notify_url:`${BASE_URL}/payfast/itn`, name_first:b.name_first || '', name_last:b.name_last || '', email_address:b.email_address || '', m_payment_id:id, amount:PRICE, item_name:'Faith Personified - My Journey Ebook'}; data.signature = sign(data); const inputs = Object.entries(data).map(([k,v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join(''); return send(res,200,page('Redirecting to PayFast', `<section><h1>Redirecting to PayFast</h1><form id="pf" method="post" action="${PAYFAST_URL}">${inputs}<button class="btn primary" type="submit">Pay Now</button></form><script>document.getElementById('pf').submit()</script></section>`)); }
  if (req.method === 'POST' && url.pathname === '/payfast/itn') { const b = await body(req); const orders = readJson(ORDERS_FILE); const order = orders.find(o => o.id === b.m_payment_id); if (order) { order.status = b.payment_status === 'COMPLETE' ? 'paid' : String(b.payment_status || 'pending').toLowerCase(); order.itn = b; order.updated_at = new Date().toISOString(); writeJson(ORDERS_FILE, orders); } return send(res,200,'OK','text/plain'); }
  if (req.method === 'GET' && url.pathname === '/thank-you') { const id = url.searchParams.get('order'); return send(res,200,page('Thank You', `<section><h1>Thank you</h1><p>Your order reference is <b>${esc(id || '')}</b>.</p><p>When PayFast confirms payment, your download will unlock.</p><a class="btn primary" href="/download?order=${esc(id || '')}">Check Download</a></section>`)); }
  if (req.method === 'GET' && url.pathname === '/download') { const id = url.searchParams.get('order'); const order = readJson(ORDERS_FILE).find(o => o.id === id); if (!order || order.status !== 'paid') return send(res,403,page('Download Locked','<section><h1>Download locked</h1><p>Your download unlocks after successful payment confirmation.</p></section>')); const file = path.join(DOWNLOAD_DIR, PRODUCT_FILE); if (!fs.existsSync(file)) return send(res,404,page('Ebook Not Uploaded','<section><h1>Ebook file not uploaded yet</h1><p>Upload the final PDF into public/downloads/faith-personified-my-journey.pdf.</p></section>')); res.writeHead(200, {'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${PRODUCT_FILE}"`}); return fs.createReadStream(file).pipe(res); }
  return send(res,404,page('Not Found','<section><h1>Page not found</h1><a class="btn primary" href="/">Back Home</a></section>'));
}).listen(PORT, () => console.log(`LegacyMart running on ${BASE_URL}`));

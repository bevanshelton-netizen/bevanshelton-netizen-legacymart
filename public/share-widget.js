(() => {
  const FEE = 8;
  const products = [
    {sku:'LM-BOOK-001',title:'Faith Personified – My Journey',seller:'LegacyMart Originals',category:'Books & Digital',price:199,icon:'📚',live:true,desc:'A downloadable ebook about faith, survival, leadership, entrepreneurship, healing and purpose.'},
    {sku:'LM-DEMO-002',title:'African Print Weekender',seller:'Founding Maker Demo',category:'Fashion & Accessories',price:690,icon:'👜',live:false,desc:'A showcase listing for handcrafted bags and travel accessories.'},
    {sku:'LM-DEMO-003',title:'Beaded Statement Set',seller:'Founding Maker Demo',category:'Jewellery',price:420,icon:'💎',live:false,desc:'A showcase listing for handmade beadwork and artisan jewellery.'},
    {sku:'LM-DEMO-004',title:'Hand-thrown Ceramic Pair',seller:'Founding Maker Demo',category:'Home & Living',price:360,icon:'🏺',live:false,desc:'A showcase listing for ceramics, décor and handcrafted homeware.'},
    {sku:'LM-DEMO-005',title:'Custom Celebration Jacket',seller:'Founding Maker Demo',category:'Personalised Gifts',price:850,icon:'🧥',live:false,desc:'A showcase listing for made-to-order and personalised gifts.'},
    {sku:'LM-DEMO-006',title:'Botanical Wall Art Download',seller:'Founding Maker Demo',category:'Art & Digital',price:95,icon:'🎨',live:false,desc:'A showcase listing for downloadable art and creative digital goods.'},
    {sku:'LM-DEMO-007',title:'Heritage Baby Blanket',seller:'Founding Maker Demo',category:'Baby & Kids',price:480,icon:'🧶',live:false,desc:'A showcase listing for sewn, knitted and crocheted children’s goods.'},
    {sku:'LM-DEMO-008',title:'Wedding Keepsake Box',seller:'Founding Maker Demo',category:'Weddings & Events',price:540,icon:'🎁',live:false,desc:'A showcase listing for wedding, event and keepsake products.'}
  ];
  const categories = [
    ['Fashion & Accessories','👜'],['Jewellery','💎'],['Home & Living','🏺'],['Art & Digital','🎨'],['Books & Digital','📚'],['Personalised Gifts','🎁'],['Baby & Kids','🧶'],['Weddings & Events','💍']
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => `R${Number(value).toFixed(2)}`;
  const query = new URLSearchParams(location.search);
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const brand = document.querySelector('.brand');
  if (!main || !nav || !brand) return;

  brand.querySelector('b').textContent = 'LegacyMart Makers';
  const small = brand.querySelector('small');
  if (small) small.textContent = 'Made by people. Powered by Izakhono.';
  nav.innerHTML = '<a href="/shop">Shop</a><a href="/shop?view=categories">Categories</a><a href="/become-a-vendor">Sell</a><a href="/how-it-works?view=fees">Fees</a><a href="/how-it-works">How it works</a><a href="/about">About</a>';

  const categoryTiles = () => categories.map(([name, icon]) => `<a class="category-tile" href="/shop?category=${encodeURIComponent(name)}"><span>${icon}</span><b>${esc(name)}</b></a>`).join('');
  const productCard = p => `<article class="product-card"><div class="product-visual"><span>${p.icon}</span><button class="heart" data-favourite="${esc(p.sku)}" aria-label="Save ${esc(p.title)}">♡</button></div><div class="product-body"><p class="pill">${p.live ? 'Live listing' : 'Demo listing'}</p><h3>${esc(p.title)}</h3><p class="seller">by ${esc(p.seller)}</p><p>${esc(p.desc)}</p><div class="product-bottom"><strong>${money(p.price)}</strong><a class="text-link" href="/shop?product=${encodeURIComponent(p.sku)}">View →</a></div></div></article>`;

  function renderHome(){
    main.innerHTML = `<section class="hero"><div><p class="eyebrow">The Izakhono-owned maker marketplace</p><h1>Make it.<br>List it.<br>Sell it.</h1><p class="lead">LegacyMart Makers gives artisans, designers, authors, crafters and independent brands their own storefront experience, discovery tools and a trusted route to buyers — built in Africa for the world.</p><div class="actions"><a class="btn primary" href="/shop">Explore the marketplace</a><a class="btn ghost" href="/become-a-vendor">Open your shop</a></div><div class="trust-strip"><span>0 listing fee at launch</span><span>${FEE}% marketplace fee target</span><span>Independent seller brands</span><span>Digital + physical products</span></div></div><div class="hero-market"><div class="floating-card one">🧵 <b>Handmade</b></div><div class="floating-card two">🎨 <b>Creative</b></div><div class="floating-card three">🌍 <b>Global</b></div><div class="maker-orbit"><span>LM</span></div><p>One marketplace. Thousands of independent makers.</p></div></section><section class="section-tight"><div class="section-head"><div><p class="eyebrow">Shop by category</p><h2>Find something made with meaning</h2></div><a class="text-link" href="/shop?view=categories">See all categories →</a></div><div class="category-grid">${categoryTiles()}</div></section><section class="section-tight"><div class="section-head"><div><p class="eyebrow">Marketplace preview</p><h2>Featured listings</h2><p class="muted">Demo listings show the marketplace experience while founding sellers are onboarded. Only live listings can accept payment.</p></div></div><div class="product-grid">${products.slice(0,4).map(productCard).join('')}</div></section><section class="seller-banner"><div><p class="eyebrow">For makers & independent brands</p><h2>Your shop. Your story. Our marketplace engine.</h2><p>Apply once, build your maker profile and prepare listings without a monthly listing bill during the founding phase.</p></div><a class="btn light" href="/become-a-vendor">Become a founding seller</a></section>`;
  }

  function renderShop(){
    if (query.get('view') === 'categories') {
      main.innerHTML = `<section><p class="eyebrow">Browse the marketplace</p><h1>Categories</h1><p class="lead">From handmade fashion and jewellery to art, books, digital products and personalised gifts.</p><div class="category-grid large">${categoryTiles()}</div></section>`;
      return;
    }
    const sku = query.get('product');
    if (sku) {
      const p = products.find(item => item.sku === sku);
      if (!p) return;
      const action = p.live ? '<a class="btn primary" href="/checkout">Buy now</a>' : '<a class="btn ghost" href="/become-a-vendor">Demo listing — become a seller</a>';
      main.innerHTML = `<section class="product-detail"><div class="detail-visual">${p.icon}</div><div><p class="eyebrow">${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="seller">Sold by <b>${esc(p.seller)}</b></p><p class="lead">${esc(p.desc)}</p><p class="price">${money(p.price)}</p><div class="actions">${action}<button class="btn ghost" data-favourite="${esc(p.sku)}">♡ Save</button></div><div class="buyer-protection"><b>Marketplace protection layer</b><span>Order record</span><span>Seller accountability</span><span>Dispute trail</span></div></div></section>`;
      return;
    }
    const q = (query.get('q') || '').trim().toLowerCase();
    const category = query.get('category') || '';
    const filtered = products.filter(p => (!q || `${p.title} ${p.seller} ${p.desc} ${p.category}`.toLowerCase().includes(q)) && (!category || p.category === category));
    main.innerHTML = `<section class="shop-head"><p class="eyebrow">Discover independent products</p><h1>Marketplace</h1><form class="searchbar" method="get" action="/shop"><input name="q" value="${esc(query.get('q') || '')}" placeholder="Search products, makers or categories"><select name="category"><option value="">All categories</option>${categories.map(([c])=>`<option value="${esc(c)}" ${c===category?'selected':''}>${esc(c)}</option>`).join('')}</select><button class="btn primary" type="submit">Search</button></form><p class="muted">${filtered.length} listing${filtered.length===1?'':'s'} shown</p></section><section class="section-tight"><div class="product-grid">${filtered.map(productCard).join('') || '<div class="empty"><h2>No listings found</h2><p>Try another search or category.</p></div>'}</div></section>`;
  }

  function renderFees(){
    main.innerHTML = `<section><p class="eyebrow">Simple seller economics</p><h1>Keep more of every sale.</h1><div class="fee-table"><div><b>Listing fee</b><span>R0.00 during the founding launch</span></div><div><b>Marketplace commission</b><span>${FEE}% target of item value</span></div><div><b>Payment processing</b><span>Passed through according to the active payment gateway</span></div><div><b>Seller payout</b><span>Automated split payouts activate only after gateway, KYC/KYB, refunds and settlement controls are verified</span></div></div><p class="lead">The final commercial settings stay configurable so Izakhono can adapt the fee model without rebuilding the marketplace.</p></section>`;
  }

  if (location.pathname === '/') renderHome();
  if (location.pathname === '/shop') renderShop();
  if (location.pathname === '/how-it-works' && query.get('view') === 'fees') renderFees();

  const favKey = 'legacymart-makers-favourites';
  const readFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(favKey) || '[]')); } catch { return new Set(); } };
  const syncFavs = () => {
    const favs = readFavs();
    document.querySelectorAll('[data-favourite]').forEach(btn => {
      const active = favs.has(btn.dataset.favourite);
      btn.classList.toggle('saved', active);
      btn.textContent = btn.classList.contains('heart') ? (active ? '♥' : '♡') : (active ? '♥ Saved' : '♡ Save');
    });
  };
  document.addEventListener('click', event => {
    const fav = event.target.closest('[data-favourite]');
    if (fav) {
      event.preventDefault();
      const set = readFavs(); const sku = fav.dataset.favourite;
      set.has(sku) ? set.delete(sku) : set.add(sku);
      localStorage.setItem(favKey, JSON.stringify([...set]));
      syncFavs();
      return;
    }
    const share = event.target.closest('[data-share-marketplace]');
    if (share && navigator.share) navigator.share({title:document.title,url:location.href}).catch(()=>{});
  });
  syncFavs();

  if (!document.querySelector('.marketplace-share')) {
    const button = document.createElement('button');
    button.className = 'marketplace-share';
    button.setAttribute('data-share-marketplace','1');
    button.textContent = 'Share';
    document.body.appendChild(button);
  }
})();
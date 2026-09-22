(() => {
  const FEE = 8;
  const products = [
    {sku:'LM-BOOK-001',title:'Faith Personified – My Journey',seller:'LegacyMart Originals',category:'Books & Digital',price:199,icon:'📚',live:true,desc:'A downloadable ebook about faith, survival, leadership, entrepreneurship, healing and purpose.'},
    {sku:'BS-HOODIE-001',title:'BEVAN SHELTON™ Signature Hoodie',seller:'BEVAN SHELTON™',sellerSlug:'bevan-shelton',category:'Fashion & Accessories',price:550,icon:'🧥',live:false,reference:true,desc:'Premium branded hoodie by BEVAN SHELTON™. Made-to-order sizing and branding options available.'},
    {sku:'BS-TRACK-001',title:'BEVAN SHELTON™ Signature Tracksuit',seller:'BEVAN SHELTON™',sellerSlug:'bevan-shelton',category:'Fashion & Accessories',price:680,icon:'👟',live:false,reference:true,desc:'Premium BEVAN SHELTON™ tracksuit for teams, lifestyle and branded collections.'},
    {sku:'BS-GOLFER-001',title:'BEVAN SHELTON™ Branded Golfer',seller:'BEVAN SHELTON™',sellerSlug:'bevan-shelton',category:'Fashion & Accessories',price:250,icon:'👕',live:false,reference:true,desc:'Smart branded golfer for corporate, club and lifestyle wear. Custom branding and sizing available.'},
    {sku:'BS-TEE-001',title:'BEVAN SHELTON™ Branded Tee',seller:'BEVAN SHELTON™',sellerSlug:'bevan-shelton',category:'Fashion & Accessories',price:190,icon:'👕',live:false,reference:true,desc:'BEVAN SHELTON™ branded T-shirt for custom, team and lifestyle orders.'},
    {sku:'LM-DEMO-002',title:'African Print Weekender',seller:'Founding Maker Demo',category:'Fashion & Accessories',price:690,icon:'👜',live:false,desc:'A showcase listing for handcrafted bags and travel accessories.'},
    {sku:'LM-DEMO-003',title:'Beaded Statement Set',seller:'Founding Maker Demo',category:'Jewellery',price:420,icon:'💎',live:false,desc:'A showcase listing for handmade beadwork and artisan jewellery.'},
    {sku:'LM-DEMO-004',title:'Hand-thrown Ceramic Pair',seller:'Founding Maker Demo',category:'Home & Living',price:360,icon:'🏺',live:false,desc:'A showcase listing for ceramics, décor and handcrafted homeware.'}
  ];
  const categories = [
    ['Fashion & Accessories','👜'],['Jewellery','💎'],['Home & Living','🏺'],['Art & Digital','🎨'],['Books & Digital','📚'],['Personalised Gifts','🎁'],['Baby & Kids','🧶'],['Weddings & Events','💍']
  ];
  const lookbookImageBase = 'https://yfawrenhudjomhnglfhq.supabase.co/functions/v1/legacymart-lookbook-image?code=';
  const bevanLookbook = [
    {code:'LOOK-01',title:'White Story Polo & Trouser Set',category:'Signature Golf & Lifestyle',status:'Price to be confirmed',tone:'light',desc:'White BEVAN SHELTON™ polo and trouser set with the gold crest, signature detail and graphic storytelling motifs.'},
    {code:'LOOK-02',title:'Gold & Navy Golf Set',category:'Golf & Lifestyle',status:'Price to be confirmed',tone:'gold',desc:'Gold golf shirt with strong navy geometric detailing, paired with tailored navy trousers.'},
    {code:'LOOK-03',title:'Signature Cardigan Collection',category:'Knitwear',status:'Price to be confirmed',tone:'light',desc:'Premium cardigan directions in light grey, ivory and navy with gold detailing and brand finishing.'},
    {code:'LOOK-04',title:'BEVAN SHELTON™ Crest',category:'Brand Identity',status:'Brand reference',tone:'gold',desc:'The crowned-horse crest and BEVAN SHELTON™ wordmark used across the collection.'},
    {code:'LOOK-05',title:'Signature Embroidery',category:'Brand Detail',status:'Brand reference',tone:'dark',desc:'Gold BEVAN SHELTON™ signature embroidery shown as a premium garment finishing detail.'},
    {code:'LOOK-06',title:'Premium Cap Gift Box',category:'Caps & Accessories',status:'Price to be confirmed',tone:'dark',desc:'Black cap presented in premium black-and-gold gift packaging.'},
    {code:'LOOK-07',title:'Black & White Cap Collection',category:'Caps & Accessories',status:'Price to be confirmed',tone:'sport',desc:'Black and white caps with gold crest, wordmark and signature side detail.'},
    {code:'LOOK-08',title:'Black Signature Cap Collection',category:'Caps & Accessories',status:'Price to be confirmed',tone:'dark',desc:'Premium black cap collection with gold crest, wordmark, signature and trim detailing.'},
    {code:'LOOK-09',title:'Premium Gift Packaging',category:'Packaging',status:'Presentation reference',tone:'mono',desc:'Black-and-gold presentation box with branded garment, ribbon and signature detailing.'},
    {code:'LOOK-10',title:'Cap Presentation — Alternate View',category:'Caps & Accessories',status:'Price to be confirmed',tone:'gold',desc:'Alternate premium presentation view of the black cap and gift-box treatment.'}
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
  nav.innerHTML = '<a href="/shop">Shop</a><a href="/shop?seller=bevan-shelton">Reference Shop</a><a href="/shop?view=categories">Categories</a><a href="/become-a-vendor">Sell</a><a href="/how-it-works?view=fees">Fees</a><a href="/about">About</a>';

  const categoryTiles = () => categories.map(([name, icon]) => `<a class="category-tile" href="/shop?category=${encodeURIComponent(name)}"><span>${icon}</span><b>${esc(name)}</b></a>`).join('');
  const productCard = p => `<article class="product-card"><div class="product-visual"><span>${p.icon}</span><button class="heart" data-favourite="${esc(p.sku)}" aria-label="Save ${esc(p.title)}">♡</button></div><div class="product-body"><p class="pill">${p.reference ? 'Reference trial' : (p.live ? 'Live listing' : 'Demo listing')}</p><h3>${esc(p.title)}</h3><p class="seller">by ${esc(p.seller)}</p><p>${esc(p.desc)}</p><div class="product-bottom"><strong>${money(p.price)}</strong><a class="text-link" href="/shop?product=${encodeURIComponent(p.sku)}">View →</a></div></div></article>`;
  const lookbookCard = look => `<article class="lookbook-card"><div class="lookbook-visual tone-${esc(look.tone)}" data-photo-ref="${esc(look.code)}"><img src="${lookbookImageBase}${encodeURIComponent(look.code)}" alt="${esc(look.title)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="lookbook-fallback" hidden><span class="look-number">${esc(look.code.replace('LOOK-',''))}</span><span class="look-mark">BS</span><small>Reference image loading</small></div></div><div class="product-body"><p class="pill">Reference look</p><h3>${esc(look.title)}</h3><p class="seller">${esc(look.category)}</p><p>${esc(look.desc)}</p><div class="lookbook-status">${esc(look.status)}</div></div></article>`;

  function renderHome(){
    const referenceProducts = products.filter(p => p.reference).slice(0,4);
    main.innerHTML = `<section class="hero"><div><p class="eyebrow">The Izakhono-owned maker marketplace</p><h1>Make it.<br>List it.<br>Sell it.</h1><p class="lead">LegacyMart Makers gives artisans, designers, authors, crafters and independent brands their own storefront experience, discovery tools and a trusted route to buyers — built in Africa for the world.</p><div class="actions"><a class="btn primary" href="/shop">Explore the marketplace</a><a class="btn ghost" href="/shop?seller=bevan-shelton">See our reference shop</a></div><div class="trust-strip"><span>0 listing fee at launch</span><span>${FEE}% marketplace fee target</span><span>Independent seller brands</span><span>Digital + physical products</span></div></div><div class="hero-market"><div class="floating-card one">🧵 <b>Handmade</b></div><div class="floating-card two">🎨 <b>Creative</b></div><div class="floating-card three">🌍 <b>Global</b></div><div class="maker-orbit"><span>LM</span></div><p>One marketplace. Thousands of independent makers.</p></div></section><section class="section-tight"><div class="section-head"><div><p class="eyebrow">Reference shop</p><h2>BEVAN SHELTON™ is our first seller trial</h2><p class="muted">Owner-operated by Bevan Shelton and used to test the full seller journey before outside sellers are onboarded.</p></div><a class="text-link" href="/shop?seller=bevan-shelton">Open the shop →</a></div><div class="product-grid">${referenceProducts.map(productCard).join('')}</div></section><section class="section-tight"><div class="section-head"><div><p class="eyebrow">Shop by category</p><h2>Find something made with meaning</h2></div><a class="text-link" href="/shop?view=categories">See all categories →</a></div><div class="category-grid">${categoryTiles()}</div></section><section class="seller-banner"><div><p class="eyebrow">For makers & independent brands</p><h2>Use the BEVAN SHELTON™ shop as the reference model.</h2><p>Once the trial proves onboarding, catalogue, ordering, fulfilment, fees and multichannel sync, the same seller system can be opened to other brands.</p></div><a class="btn light" href="/become-a-vendor">Become a founding seller</a></section>`;
  }

  function renderShop(){
    if (query.get('view') === 'categories') {
      main.innerHTML = `<section><p class="eyebrow">Browse the marketplace</p><h1>Categories</h1><p class="lead">From handmade fashion and jewellery to art, books, digital products and personalised gifts.</p><div class="category-grid large">${categoryTiles()}</div></section>`;
      return;
    }

    const sellerSlug = query.get('seller');
    if (sellerSlug === 'bevan-shelton') {
      const sellerProducts = products.filter(p => p.sellerSlug === 'bevan-shelton');
      main.innerHTML = `<section class="shop-head"><p class="eyebrow">Official owner-operated reference shop</p><h1>BEVAN SHELTON™</h1><p class="lead">Seller: BEVAN SHELTON™ · Operator: Bevan Shelton · South Africa. This is LegacyMart Makers’ controlled trial storefront and reference implementation for future sellers.</p><div class="trust-strip"><span>Reference shop</span><span>Trial mode</span><span>Owner operated</span><span>Reference checkout staged</span></div><div class="actions"><a class="btn primary" href="#reference-products">Shop trial products</a><a class="btn ghost" href="#reference-lookbook">View fashion lookbook</a></div></section><section class="section-tight" id="reference-products"><div class="section-head"><div><p class="eyebrow">Priced trial catalogue</p><h2>Reference products</h2></div></div><div class="product-grid">${sellerProducts.map(productCard).join('')}</div></section><section class="section-tight" id="reference-lookbook"><div class="section-head"><div><p class="eyebrow">BEVAN SHELTON™ Reference Lookbook</p><h2>Distinctive fashion directions</h2><p class="muted">These are the actual BEVAN SHELTON™ reference pieces supplied for the trial shop. Unapproved commercial prices remain deliberately uncommitted.</p></div></div><div class="lookbook-grid">${bevanLookbook.map(lookbookCard).join('')}</div></section><section class="seller-banner"><div><p class="eyebrow">What we are testing here</p><h2>One real seller journey before we scale.</h2><p>Catalogue publishing, brand storefronts, buyer discovery, order flow, fee calculation, fulfilment, returns, reviews and multichannel integration will be proven here first.</p></div><a class="btn light" href="/how-it-works?view=fees">View seller economics</a></section>`;
      return;
    }

    const sku = query.get('product');
    if (sku) {
      const p = products.find(item => item.sku === sku);
      if (!p) return;
      const action = p.live
        ? '<a class="btn primary" href="/checkout">Buy now</a>'
        : p.reference
          ? `<a class="btn primary" href="/checkout?sku=${encodeURIComponent(p.sku)}">Run trial checkout</a>`
          : '<a class="btn ghost" href="/become-a-vendor">Demo listing — become a seller</a>';
      const refNote = p.reference ? '<p class="pill">BEVAN SHELTON™ owner-operated trial listing</p>' : '';
      main.innerHTML = `<section class="product-detail"><div class="detail-visual">${p.icon}</div><div><p class="eyebrow">${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="seller">Sold by <b>${esc(p.seller)}</b></p>${refNote}<p class="lead">${esc(p.desc)}</p><p class="price">From ${money(p.price)}</p><div class="actions">${action}<button class="btn ghost" data-favourite="${esc(p.sku)}">♡ Save</button></div><div class="buyer-protection"><b>Marketplace protection layer</b><span>Order record</span><span>Seller accountability</span><span>Dispute trail</span></div></div></section>`;
      return;
    }

    const q = (query.get('q') || '').trim().toLowerCase();
    const category = query.get('category') || '';
    const filtered = products.filter(p => (!q || `${p.title} ${p.seller} ${p.desc} ${p.category}`.toLowerCase().includes(q)) && (!category || p.category === category));
    main.innerHTML = `<section class="shop-head"><p class="eyebrow">Discover independent products</p><h1>Marketplace</h1><form class="searchbar" method="get" action="/shop"><input name="q" value="${esc(query.get('q') || '')}" placeholder="Search products, makers or categories"><select name="category"><option value="">All categories</option>${categories.map(([c])=>`<option value="${esc(c)}" ${c===category?'selected':''}>${esc(c)}</option>`).join('')}</select><button class="btn primary" type="submit">Search</button></form><p class="muted">${filtered.length} listing${filtered.length===1?'':'s'} shown</p></section><section class="section-tight"><div class="product-grid">${filtered.map(productCard).join('') || '<div class="empty"><h2>No listings found</h2><p>Try another search or category.</p></div>'}</div></section>`;
  }

  function renderFees(){
    main.innerHTML = `<section><p class="eyebrow">Simple seller economics</p><h1>Keep more of every sale.</h1><div class="fee-table"><div><b>Listing fee</b><span>R0.00 during the founding launch</span></div><div><b>Marketplace commission</b><span>${FEE}% target of item value</span></div><div><b>Payment processing</b><span>Passed through according to the active payment gateway</span></div><div><b>Seller payout</b><span>Automated split payouts activate only after gateway, KYC/KYB, refunds and settlement controls are verified</span></div></div><p class="lead">The BEVAN SHELTON™ owner-operated shop is the first reference implementation for these economics before third-party sellers are enabled.</p></section>`;
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
    }
  });
  syncFavs();
})();
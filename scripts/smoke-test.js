const http = require('http');
const routes = ['/', '/shop', '/faith-personified', '/checkout', '/become-a-vendor', '/health'];
const base = process.env.BASE_URL || 'http://localhost:3000';
let failed = false;
function check(route){return new Promise(resolve=>{const url=new URL(route,base);http.get(url,res=>{console.log(`${route} -> ${res.statusCode}`); if(res.statusCode>=400) failed=true; res.resume(); res.on('end',resolve);}).on('error',err=>{console.error(route,err.message);failed=true;resolve();});});}
(async()=>{for(const route of routes) await check(route); process.exit(failed?1:0);})();

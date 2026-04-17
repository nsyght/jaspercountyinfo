// Run with: node fetch-places-photos.js
// Fetches real Google Places data for Jasper County businesses

const https = require('https');
const API_KEY = 'AIzaSyCKs0rN2CjZ3PXgW2Dp0lAjWx8fyBMi8Jw';

const businesses = [
  {slug:'the-dumpster-co-monticello',         query:'The Dumpster Co 1705 Wicker Rd Monticello GA 31064'},
  {slug:'monticello-diner',                    query:'diner breakfast restaurant Monticello GA 31064'},
  {slug:'courthouse-square-cafe',              query:'coffee cafe Monticello GA courthouse square'},
  {slug:'el-rancherito-monticello',            query:'Mexican restaurant Monticello GA'},
  {slug:'jasper-county-bbq',                   query:'BBQ restaurant Monticello GA'},
  {slug:'jasper-county-primary-care',          query:'primary care clinic doctor Monticello GA'},
  {slug:'monticello-family-dental',            query:'dentist dental Monticello GA'},
  {slug:'monticello-urgent-care',              query:'urgent care walk in Monticello GA'},
  {slug:'monticello-auto-tire',                query:'auto repair tire shop Monticello GA'},
  {slug:'jasper-county-collision',             query:'auto body collision repair Monticello GA'},
  {slug:'monticello-hair-studio',              query:'hair salon Monticello GA'},
  {slug:'jasper-nails-spa',                    query:'nail salon Monticello GA'},
  {slug:'piedmont-national-wildlife-refuge',   query:'Piedmont National Wildlife Refuge Georgia'},
  {slug:'oconee-national-forest-jasper',       query:'Oconee National Forest Jasper County Georgia'},
  {slug:'jasper-county-library',               query:'Jasper County Library Monticello GA'},
  {slug:'jasper-county-schools',               query:'Jasper County School System Monticello GA'},
  {slug:'jasper-county-lawn-landscape',        query:'lawn care landscaping Monticello GA'},
  {slug:'monticello-animal-clinic',            query:'veterinarian animal clinic Monticello GA'},
  {slug:'jasper-county-farm-supply',           query:'farm supply feed store Monticello GA'},
  {slug:'jasper-county-fitness',               query:'gym fitness center Monticello GA'},
];

function post(data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'places.googleapis.com', path: '/v1/places:searchText', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri,places.regularOpeningHours,places.nationalPhoneNumber,places.formattedAddress,places.photos' }
    };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function fmtTime(h, m) {
  const s = h < 12 ? 'am' : 'pm'; const h12 = h % 12 || 12;
  return `${h12}${m ? ':' + String(m).padStart(2,'0') : ''}${s}`;
}

function parseHours(periods) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const map = {};
  for (const p of (periods || [])) {
    const d = p.open?.day ?? 0;
    map[days[d]] = `${fmtTime(p.open?.hour??0, p.open?.minute??0)}-${fmtTime(p.close?.hour??0, p.close?.minute??0)}`;
  } return map;
}

async function getPhotoUrl(photoName) {
  return new Promise((resolve) => {
    const path = `/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`;
    const req = https.request({ hostname: 'places.googleapis.com', path, method: 'GET' }, res => { resolve(res.headers['location'] || ''); });
    req.on('error', () => resolve('')); req.end();
  });
}

async function run() {
  const results = {};
  for (const biz of businesses) {
    try {
      const data = await post({ textQuery: biz.query, maxResultCount: 1 });
      const place = data.places?.[0];
      if (!place) { console.error(`NOT FOUND: ${biz.slug}`); results[biz.slug] = { found: false }; await new Promise(r=>setTimeout(r,200)); continue; }
      let photoUrl = '';
      if (place.photos?.length > 0) photoUrl = await getPhotoUrl(place.photos[0].name);
      results[biz.slug] = { found: true, name: place.displayName?.text||'', address: place.formattedAddress||'',
        phone: place.nationalPhoneNumber||'', rating: place.rating||'', reviews: place.userRatingCount||'',
        website: place.websiteUri||'', hours: parseHours(place.regularOpeningHours?.periods), photoUrl };
      console.log(`✓ ${biz.slug} — ${place.rating}★ | photo: ${photoUrl?'YES':'none'}`);
    } catch(e) { console.error(`ERROR ${biz.slug}: ${e.message}`); results[biz.slug] = { found: false }; }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\n\n===RESULTS===');
  console.log(JSON.stringify(results, null, 2));
  console.log('===END RESULTS===');
}
run();

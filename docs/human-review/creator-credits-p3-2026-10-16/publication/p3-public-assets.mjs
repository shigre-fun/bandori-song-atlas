import fs from 'node:fs';
import assert from 'node:assert/strict';
const commit=process.argv[2];assert.match(commit,/^[a-f0-9]{40}$/);
const origin='https://tanimachi-bdsongs.com',rows=[];
const get=async path=>{const u=new URL(path,origin);u.searchParams.set('release',commit);const r=await fetch(u,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000),redirect:'manual'});return r;};
const meta=(html,key)=>[...html.matchAll(/<meta\b[^>]*>/g)].find(m=>m[0].includes(`="${key}"`))?.[0].match(/content="([^"]+)"/)?.[1];
for(const path of ['/','/garupa/songs/800/','/ournotes/songs/88/']){
 const response=await get(path);assert.equal(response.status,200);const html=await response.text(),local=fs.readFileSync('dist'+path+'index.html','utf8');
 const image=meta(html,'og:image');assert.equal(image,meta(local,'og:image'));assert.equal(meta(html,'twitter:image'),image);
 const png=await get(image);assert.equal(png.status,200);const bytes=Buffer.from(await png.arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
 const canonical=h=>h.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];assert.equal(canonical(html),canonical(local));
 rows.push({path,ogImage:image,status:200,width:1200,height:630,twitterImageMatches:true,canonicalMatches:true});
}
const home=fs.readFileSync('dist/index.html','utf8');const icons=[...home.matchAll(/<link\b[^>]*>/g)].filter(m=>/rel="(?:icon|apple-touch-icon)"/.test(m[0])).map(m=>m[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
for(const path of icons){const r=await get(path);assert.equal(r.status,200,path);rows.push({icon:path,status:200});}
const missing=await get('/p3-publication-nonexistent-404/');assert.equal(missing.status,404);rows.push({notFoundStatus:404});
for(const path of ['/robots.txt','/sitemap.xml']){const response=await get(path);assert.equal(response.status,200);assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync('dist'+path,'utf8').replace(/\r\n/g,'\n'));rows.push({path,status:200,fullContentMatches:true});}
const search=await get('/search/?q=P3');assert.equal(search.status,200);const searchHtml=await search.text();assert.match(searchHtml,/noindex/);rows.push({searchNoindex:true,xRobotsTag:search.headers.get('x-robots-tag')});
const master=JSON.parse(fs.readFileSync('dist/creators.json'));const creator=master.creators.find(c=>c.previousSlugs?.length);const old='/creators/'+creator.previousSlugs[0]+'/';const redirect=await get(old);assert.equal(redirect.status,301);assert.equal(new URL(redirect.headers.get('location'),origin).pathname,'/creators/'+creator.slug+'/');rows.push({oldCreatorURL:old,status:301,target:creator.slug});
fs.writeFileSync('.cache/p3-public-assets.json',JSON.stringify({status:'PASS',commit,origin,verifiedAt:new Date().toISOString(),rows},null,2)+'\n');console.log({status:'PASS',ogImages:3,icons:icons.length,notFound:404,oldCreatorRedirect:301});

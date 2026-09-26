/* No dependencies or server required. Reusable static blog renderer + ZIP writer. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeSlug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  const date = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const prefixLinks = (html, prefix) => html.replace(/(href|src)="(?!https?:|tel:|#)([^"]+)"/g, (_, attr, url) => `${attr}="${prefix}${url}"`);
  function metadata(html, title, description) {
    html=html.replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`);
    for (const name of ['description','og:description','twitter:description']) html=html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*`), '$1'+esc(description));
    for (const name of ['og:title','twitter:title']) html=html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*`), '$1'+esc(title));
    return html;
  }
  function shell(title, description, content, prefix='') {
    const t=window.TRADEBUILT_TEMPLATE;
    return '<!doctype html>\n<html lang="en-GB"><head>'+prefixLinks(metadata(t.head,title,description),prefix)+'</head><body>'+prefixLinks(t.header,prefix)+'<main id="main">'+content+'</main>'+prefixLinks(t.footer,prefix)+'</body></html>';
  }
  function validatePosts(posts) {
    const seen=new Set();
    for(const post of posts) {
      if (!safeSlug(post.slug) || seen.has(post.slug)) throw new Error('Each article needs a unique lowercase, hyphenated slug.');
      seen.add(post.slug);
      for(const field of ['title','author','publishDate','excerpt','seoTitle','metaDescription','fullArticle']) if(typeof post[field]!=='string'||!post[field].trim()) throw new Error(`${post.slug}: ${field} is required.`);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(post.publishDate)||Number.isNaN(Date.parse(post.publishDate))) throw new Error('Use YYYY-MM-DD for publish dates.');
      if(!Array.isArray(post.categories)||!Array.isArray(post.tags)) throw new Error('Categories and tags must be arrays.');
      if(post.featuredImage && !/^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(post.featuredImage)) throw new Error('Featured images must use an assets/images/ path.');
      if(/<script\b|\bon\w+\s*=|javascript:/i.test(post.fullArticle)) throw new Error('Article HTML may not contain scripts or event handlers.');
      if(post.seoTitle.length!==60||post.metaDescription.length!==160) throw new Error(`${post.slug}: use a 60-character SEO title and 160-character description.`);
    }
  }
  function blogFiles() {
    const posts=[...window.TRADEBUILT_POSTS].sort((a,b)=>b.publishDate.localeCompare(a.publishDate));
    validatePosts(posts);
    const files={};
    const cards=posts.map(p=>`<article class="article-card"><p class="article-meta">${esc(p.categories.join(' / '))} · ${date(p.publishDate)}</p><h2><a href="blog/${p.slug}.html">${esc(p.title)}</a></h2><p>${esc(p.excerpt)}</p><a class="text-link" href="blog/${p.slug}.html" aria-label="Read ${esc(p.title)}">Read the advice <svg class="lucide-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13 5H19V11"/><path d="M19 5L5 19"/></svg></a></article>`).join('');
    files['blog.html']=shell('Website & Marketing Advice for UK Trades | TradeBuilt Guides','Practical website and marketing advice for UK trade businesses. Explore useful guides on planning your website, choosing a package and showing your best work well.',`<section class="page-hero dark"><div class="wrap"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><span>Advice</span></div><p class="eyebrow lime">GOOD ADVICE. NO JARGON.</p><h1>A little knowledge.<br>A stronger business.</h1><p class="lead text-lg">Practical ideas to help you make better decisions about your website and online presence.</p></div></section><section class="section"><div class="wrap article-grid">${cards||'<p>New advice is on the way. <a href="contact.html">Ask us a question</a> in the meantime.</p>'}</div></section>`);
    for(const p of posts) {
      const content=`<section class="page-hero dark"><div class="wrap"><div class="breadcrumb"><a href="../index.html">Home</a><span>/</span><a href="../blog.html">Advice</a></div><p class="eyebrow lime">${esc(p.categories.join(' / '))}</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.excerpt)}</p><p class="hero-note">By ${esc(p.author)} · <time datetime="${p.publishDate}">${date(p.publishDate)}</time></p></div></section><section class="section"><article class="wrap article-body">${p.featuredImage?`<figure style="margin:0 0 35px"><img src="../${p.featuredImage}" width="960" height="640" loading="lazy" alt="${esc(p.imageAlt||'')}"><figcaption class="small muted">Illustrative image, AI-generated.</figcaption></figure>`:''}${p.fullArticle}<p class="small muted" style="margin-top:40px">Topics: ${esc(p.tags.join(', '))}</p><p style="margin-top:35px"><a class="text-link" href="../blog.html">← Back to all advice</a></p></article></section>`;
      let html=shell(p.seoTitle,p.metaDescription,content,'../');
      html=html.replace('content="website"','content="article"');
      const structured={'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,description:p.excerpt,datePublished:p.publishDate,author:{'@type':'Organization',name:p.author},publisher:{'@type':'Organization',name:'TradeBuilt'}};
      html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script></head>');
      files[`blog/${p.slug}.html`]=html;
    }
    return files;
  }
  const encoder=new TextEncoder();
  function zip(files) {
    // ZIP STORE, standard CRC32. Small text assets do not need a compression dependency.
    const crcTable=Array.from({length:256},(_,i)=>{let n=i;for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
    const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
    const blocks=[],directory=[];let offset=0;
    for(const [name,value] of Object.entries(files)) {
      const n=encoder.encode(name),data=typeof value==='string'?encoder.encode(value):value,crc=crc32(data),local=new Uint8Array(30+n.length),l=new DataView(local.buffer);
      l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,0x5821,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,n.length,true);local.set(n,30);blocks.push(local,data);
      const central=new Uint8Array(46+n.length),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,0x5821,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,n.length,true);c.setUint32(42,offset,true);central.set(n,46);directory.push(central);offset+=local.length+data.length;
    }
    const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,directory.length,true);v.setUint16(10,directory.length,true);v.setUint32(12,directory.reduce((s,a)=>s+a.length,0),true);v.setUint32(16,offset,true);
    return new Blob([...blocks,...directory,end],{type:'application/zip'});
  }
  window.TradeBuiltPublisher={blogFiles,metadata,zip,esc};
})();

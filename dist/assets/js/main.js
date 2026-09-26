(() => {
  'use strict';
  const config = window.TRADEBUILT;
  if (document.body.classList.contains('home-page')) {
    const header = document.querySelector('.site-header');
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', updateHeader, {passive: true});
    window.addEventListener('pageshow', updateHeader);
  }
  const nav = document.querySelector('#main-nav');
  const toggle = document.querySelector('.menu-toggle');
  function closeMenu(restoreFocus = false) {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('is-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  matchMedia('(min-width: 701px)').addEventListener('change', () => closeMenu());
  const query = new URLSearchParams(location.search);
  const format = value => new Intl.NumberFormat('en-GB', {style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
  let billing = query.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  function updatePricing() {
    document.querySelectorAll('[data-billing]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === billing)));
    document.querySelectorAll('[data-plan]').forEach(card => {
      const plan = config.packages.find(item => item.id === card.dataset.plan);
      if (!plan) return;
      const amount = card.querySelector('[data-price]');
      if (amount) amount.textContent = format(plan[billing]);
      const suffix = card.querySelector('[data-period]');
      if (suffix) suffix.textContent = billing === 'yearly' ? '/ year' : '/ month';
      const tax = card.querySelector('[data-tax]');
      if (tax) tax.textContent = '+ VAT · ' + (billing === 'yearly' ? 'Billed yearly' : 'Billed monthly');
      const link = card.querySelector('[data-plan-link]');
      if (link) link.href = 'get-started.html?package=' + encodeURIComponent(plan.id) + '&billing=' + billing;
    });
    const note = document.querySelector('#billing-note');
    if (note) note.textContent = billing === 'yearly' ? 'Illustrative annual totals, billed yearly. Annual cancellation and refund arrangements will be confirmed before purchase.' : 'No fixed contracts. Cancel anytime. All prices shown exclude VAT.';
  }
  document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => { billing = button.dataset.billing; updatePricing(); }));
  updatePricing();
  const packageSelect = document.querySelector('#package');
  const billingSelect = document.querySelector('#billing');
  if (packageSelect && billingSelect) {
    if (config.packages.some(p => p.id === query.get('package'))) packageSelect.value = query.get('package');
    billingSelect.value = billing;
    const summary = () => {
      const plan = config.packages.find(p => p.id === packageSelect.value);
      document.querySelector('#summary-name').textContent = plan.name;
      document.querySelector('#summary-price').textContent = format(plan[billingSelect.value]);
      document.querySelector('#summary-period').textContent = billingSelect.value === 'yearly' ? '/ year + VAT' : '/ month + VAT';
      document.querySelector('#summary-billing').textContent = billingSelect.value === 'yearly' ? 'Illustrative annual total. Cancellation and refund arrangements will be confirmed before purchase.' : 'No fixed contracts. Cancel anytime.';
    };
    packageSelect.addEventListener('change',summary); billingSelect.addEventListener('change',summary); summary();
  }
  const ticker = document.querySelector('.trade-ticker');
  const tickerToggle = ticker?.querySelector('.trade-ticker__toggle');
  tickerToggle?.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    tickerToggle.setAttribute('aria-pressed', String(paused));
    tickerToggle.setAttribute('aria-label', paused ? 'Resume trade carousel' : 'Pause trade carousel');
    tickerToggle.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
  });
  const form = document.querySelector('[data-enquiry-form]');
  if (!form) return;
  let widgetId, token = '';
  if (config.formEndpoint && config.turnstileSiteKey) {
    window.tradebuiltTurnstileReady = () => {
      widgetId = window.turnstile.render('#spam-check', {sitekey:config.turnstileSiteKey, action:'enquiry', callback:value => {token=value;}, 'expired-callback':()=>{token='';}, 'error-callback':()=>{token='';}});
    };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=tradebuiltTurnstileReady&render=explicit'; script.async=true; script.defer=true;
    document.head.append(script);
    document.querySelector('[data-form-unavailable]')?.setAttribute('hidden','');
  }
  const status = form.querySelector('.form-status');
  const fields = [...form.querySelectorAll('input:not([type=hidden]):not([name=website_confirm]),textarea,select')];
  function validateField(field) {
    const error = document.getElementById(field.id + '-error');
    let message='';
    if (field.required && (field.type === 'checkbox' ? !field.checked : !field.value.trim())) message=field.type==='checkbox' ? 'Please confirm you have read the privacy information.' : 'Please complete this field.';
    else if (field.type === 'email' && field.value && !field.validity.valid) message='Enter a valid email address, such as name@example.co.uk.';
    else if (field.id === 'phone' && field.value && !/^[+\d\s().-]{7,25}$/.test(field.value)) message='Enter a valid phone number.';
    if (error) error.textContent=message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }
  fields.forEach(field => field.addEventListener('input', () => {if(field.getAttribute('aria-invalid')==='true') validateField(field);}));
  form.addEventListener('submit', async event => {
    event.preventDefault(); status.textContent=''; status.className='form-status';
    const valid=fields.map(validateField).every(Boolean);
    if (!valid) {form.querySelector('[aria-invalid=true]')?.focus(); return;}
    if (!config.formEndpoint || !config.turnstileSiteKey) {
      status.textContent='Online enquiries are not connected yet. Your details have not been sent. Please call 0333 050 8056 or use the WhatsApp link.'; status.classList.add('error'); status.focus(); return;
    }
    if (!token) {status.textContent='Please complete the spam check before sending.';status.classList.add('error');status.focus();return;}
    const submit=form.querySelector('[type=submit]'), original=submit.textContent;
    submit.disabled=true;submit.textContent='Sending your enquiry…';form.setAttribute('aria-busy','true');
    const payload=Object.fromEntries(new FormData(form));payload.consent=form.querySelector('[name=consent]').checked;payload.turnstileToken=token;
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch(config.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json().catch(()=>({}));
      if(!response.ok || result.ok!==true) throw new Error('Unable to confirm delivery. Please try again, call us or use WhatsApp. Your details are still in the form.');
      form.reset();status.textContent='Thank you. Your enquiry has been sent to TradeBuilt. We will be in touch to discuss the next step. No payment has been taken.';status.classList.add('success');status.focus();
    } catch(error) {status.textContent=error.name==='AbortError'?'The request timed out. We could not confirm delivery. Please call or use WhatsApp before sending again.':error.message;status.classList.add('error');status.focus();}
    finally{clearTimeout(timeout);submit.disabled=false;submit.textContent=original;form.removeAttribute('aria-busy');token='';if(widgetId!==undefined)window.turnstile?.reset(widgetId);}
  });
})();

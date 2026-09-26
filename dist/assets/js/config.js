/* Public configuration only. Never put Stripe or Resend secrets here. */
window.TRADEBUILT = Object.freeze({
  siteUrl: '', // Set the final https:// domain before launch, then export updated pages in editor/.
  formEndpoint: '', // HTTPS URL of the separately hosted integration/contact-worker.js endpoint.
  turnstileSiteKey: '', // Public Cloudflare Turnstile site key. Required when enabling the form.
  paymentsEnabled: false,
  examplePricing: true,
  packages: [
    {id:'foundation',name:'Foundation',monthly:49,yearly:588,description:'A professional home for your trade business.',features:['Bespoke website design','Mobile-ready layouts','Core service pages','Website care and support']},
    {id:'growth',name:'Growth',monthly:99,yearly:1188,description:'Build your presence where your customers search.',features:['Everything in Foundation','Additional service pages','Location-focused content','Search optimisation support']},
    {id:'complete',name:'Complete',monthly:199,yearly:2388,description:'A broader approach to your online presence.',features:['Everything in Growth','Expanded content support','AI search optimisation','Ongoing improvement reviews']}
  ]
});

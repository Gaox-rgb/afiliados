// =================================================================================
//  ARCHIVO: functions/product-catalog.js - ROL: CATÁLOGO CORPORATIVO EXCLUSIVO (B2B)
// =================================================================================

exports.PRODUCT_CATALOG = {
  "opus_10": {
    name: "Plan Opus 10 Afiliados ($99 MXN)",
    price: 5.00,
    type: "affiliate_plan",
    description: "Para equipos pequeños con grandes ambiciones.",
    affiliateLimit: 10
  },
  "nucleo_50": {
    name: "Plan Núcleo 50 Afiliados ($199 MXN)",
    price: 10.00,
    type: "affiliate_plan",
    description: "Convierte a tus clientes en una comunidad leal.",
    affiliateLimit: 50
  },
  "zenith_200": {
    name: "Plan Zenith 200 Afiliados ($299 MXN)",
    price: 15.00,
    type: "affiliate_plan",
    description: "La herramienta definitiva de retención y lealtad.",
    isRecommended: true,
    affiliateLimit: 200
  },
  "master_500": {
    name: "Plan Master 500 Afiliados ($499 MXN)",
    price: 25.00,
    type: "affiliate_plan",
    description: "Cubre hasta 500 empleados o clientes.",
    affiliateLimit: 500
  },
  "starter_10": { name: "Plan Opus", price: 5.00, type: "affiliate_plan", affiliateLimit: 10 },
  "growth_50": { name: "Plan Núcleo", price: 10.00, type: "affiliate_plan", affiliateLimit: 50 },
  "business_200": { name: "Plan Zenith", price: 15.00, type: "affiliate_plan", isRecommended: true, affiliateLimit: 200 },
  "enterprise_500": { name: "Plan Master", price: 25.00, type: "affiliate_plan", affiliateLimit: 500 }
},
  "plan_plus": {
    name: "Plan Plus Individual (Emprendedores)",
    price: 2.50,
    type: "individual_plan",
    description: "Acceso individual completo enfocado en emprendedores.",
    affiliateLimit: 1
  },
  "arsenal_plus": {
    name: "Plan Plus Individual (Emprendedores)",
    price: 2.50,
    type: "individual_plan",
    description: "Acceso individual completo enfocado en emprendedores.",
    affiliateLimit: 1
  }
};
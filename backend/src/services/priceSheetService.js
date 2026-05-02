const fs = require('fs');
const path = require('path');
const { readSheetRows } = require('../utils/simpleXlsx');

const LOCAL_PRICE_SHEET_PATH = path.resolve(__dirname, '../../../../Assets/products/lbara-product-catalog.xlsx');
const DEPLOYED_PRICE_SHEET_PATH = path.resolve(__dirname, '../../data/lbara-product-catalog.xlsx');
const LEGACY_PRICE_SHEET_PATH = path.resolve(__dirname, '../../../../Assets/products/lbara-product-prices.xlsx');
const LOCAL_V1_PRICING_TABLE_PATH = path.resolve(__dirname, '../../../../Assets/products/lbara_pricing_table.html');
const LOCAL_V2_PRICING_TABLE_PATH = path.resolve(__dirname, '../../../../Assets/products/lbara_pricing_table_v2.html');
const DEPLOYED_V2_PRICING_TABLE_PATH = path.resolve(__dirname, '../../data/lbara_pricing_table_v2.html');
const DEFAULT_PRICE_SHEET_PATH = fs.existsSync(LOCAL_PRICE_SHEET_PATH) ? LOCAL_PRICE_SHEET_PATH : DEPLOYED_PRICE_SHEET_PATH;
const DEFAULT_PRICING_TABLE_PATH = [
  LOCAL_V2_PRICING_TABLE_PATH,
  DEPLOYED_V2_PRICING_TABLE_PATH,
  LOCAL_V1_PRICING_TABLE_PATH,
].find((candidate) => fs.existsSync(candidate)) || DEPLOYED_V2_PRICING_TABLE_PATH;

const CAD_PER_USD = 1.36;
const TYPE_1_GIFT_CARD_MARGIN = 1.15;
const WEBSITE_FX_RATE = 2.40;
const TYPE_2_DEFAULT_MARGIN = 1.30;
const KNOWLEDGE_CATEGORY_MARGIN = 1.17;
const VPN_BUNDLE_DISCOUNT = 0.13;

const REDUCED_MARGIN_VARIANT_PREFIXES = [
  'chatgpt-plus::',
  'claude-pro::',
  'gemini-advanced::',
  'lovable::',
  'audible::',
  'kindle-unlimited::',
];

const PRICING_TABLE_MATCHES = [
  ['Netflix', 'Standard with Ads', 'netflix-subscription::standard-ads'],
  ['Netflix', 'Standard (1080p)', 'netflix-subscription::standard'],
  ['Netflix', 'Premium (4K, 4 screens)', 'netflix-subscription::premium'],
  ['Prime Video', 'Standalone', 'prime-video::monthly'],
  ['YouTube Premium', 'Individual', 'youtube-premium::monthly'],
  ['Spotify', 'Individual', 'spotify-subscription::individual'],
  ['Spotify', 'Duo', 'spotify-subscription::duo'],
  ['Spotify', 'Family', 'spotify-subscription::family'],
  ['ChatGPT Plus', 'Personal $20 USD', 'chatgpt-plus::monthly'],
  ['Claude Pro', '$20 USD', 'claude-pro::monthly'],
  ['Gemini Advanced', 'Google AI Pro $19.99 USD', 'gemini-advanced::monthly'],
  ['Nano Banana Google', 'Bundled w/ AI Pro ≈', 'nano-banana-google::monthly'],
  ['Lovable', 'Pro $25 USD ≈', 'lovable::monthly'],
  ['Microsoft 365', 'Personal', 'microsoft-365::personal-monthly'],
  ['Microsoft 365', 'Family', 'microsoft-365::family-monthly'],
  ['Adobe Creative Cloud', 'All Apps', 'adobe-creative-cloud::all-apps'],
  ['Canva Pro', 'Individual', 'canva-pro::monthly'],
  ['Grammarly Premium', 'Monthly ≈', 'grammarly-premium::monthly'],
  ['LinkedIn Premium', 'Career ≈', 'linkedin-premium::monthly'],
  ['Zoom Workplace', 'Pro ≈', 'zoom-workplace::monthly'],
  ['PlayStation Plus', 'Essential 1 month', 'playstation-plus::essential-1m'],
  ['PlayStation Plus', 'Extra 1 month', 'playstation-plus::extra-1m'],
  ['PlayStation Plus', 'Premium 1 month', 'playstation-plus::premium-1m'],
  ['Xbox Game Pass', 'Core 1 month ≈', 'xbox-game-pass::core'],
  ['Xbox Game Pass', 'Ultimate 1 month ≈', 'xbox-game-pass::ultimate'],
  ['Twitch Premium / Turbo', 'Monthly', 'twitch-premium::monthly'],
  ['Discord Nitro', 'Basic', 'discord-nitro::basic-monthly'],
  ['Discord Nitro', 'Full', 'discord-nitro::nitro-monthly'],
  ['Apple App Store / iTunes', '$25 USD', 'apple-app-store-itunes-gift-card::usd-25'],
  ['Apple App Store / iTunes', '$50 USD', 'apple-app-store-itunes-gift-card::usd-50'],
  ['Apple App Store / iTunes', '$100 USD', 'apple-app-store-itunes-gift-card::usd-100'],
  ['Google Play', '$25 USD', 'google-play-gift-card::usd-25'],
  ['Google Play', '$50 USD', 'google-play-gift-card::usd-50'],
  ['Steam', '$50 USD', 'steam-gift-card::usd-50'],
  ['Steam', '$100 USD', 'steam-gift-card::usd-100'],
  ['Xbox', '$25 USD', 'xbox-gift-card::usd-25'],
  ['Xbox', '$50 USD', 'xbox-gift-card::usd-50'],
  ['iCloud+', '50GB', 'icloud-plus::50gb'],
  ['iCloud+', '200GB', 'icloud-plus::200gb'],
  ['iCloud+', '2TB', 'icloud-plus::2tb'],
  ['Kindle Unlimited', 'Monthly', 'kindle-unlimited::monthly'],
  ['Audible', 'Premium Plus', 'audible::monthly'],
  ['NordVPN', 'Standard 1 month ≈', 'nordvpn::monthly'],
  ['NordVPN', 'Standard 1 year ≈', 'nordvpn::annual'],
  ['OneDrive Storage', '100 GB', 'onedrive-storage::100gb'],
  ['OneDrive Storage', '1 TB (M365 Personal)', 'onedrive-storage::1tb'],
  ['Strava Subscription', 'Monthly', 'strava-subscription::monthly'],
  ['Flo Premium', 'Monthly', 'flo-premium::monthly'],
  ['Yubo Subscription', 'Yubo Power Pack', 'yubo-subscription::monthly'],
  ['Instagram Verification', 'Meta Verified', 'instagram-verification::monthly'],
  ['X Premium', 'Premium ($8 USD)', 'x-premium::monthly'],
  ['Reddit Premium', 'Monthly', 'reddit-premium::monthly'],
  ['Snapchat+', 'Monthly', 'snapchat-plus::monthly'],
];

const PRICING_TABLE_MATCHES_V2 = [
  ['Netflix Canada', 'Standard with Ads', 'netflix-subscription::standard-ads'],
  ['Netflix Canada', 'Standard', 'netflix-subscription::standard', { billingIncludes: 'Monthly' }],
  ['Netflix Canada', 'Premium', 'netflix-subscription::premium', { billingIncludes: 'Monthly' }],
  ['Netflix Canada', 'Extra Member with Ads', 'netflix-subscription::extra-member-ads'],
  ['Netflix Canada', 'Extra Member ad-free', 'netflix-subscription::extra-member-ad-free'],
  ['Disney+ Canada', 'Standard with Ads', 'disney-plus::standard-ads'],
  ['Disney+ Canada', 'Standard', 'disney-plus::standard-monthly', { billingIncludes: 'Monthly' }],
  ['Disney+ Canada', 'Standard', 'disney-plus::standard-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Disney+ Canada', 'Premium', 'disney-plus::premium-monthly', { billingIncludes: 'Monthly' }],
  ['Disney+ Canada', 'Premium', 'disney-plus::premium-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Crunchyroll Canada', 'Fan', 'crunchyroll::fan-monthly', { billingIncludes: 'Monthly' }],
  ['Crunchyroll Canada', 'Fan', 'crunchyroll::fan-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Crunchyroll Canada', 'Mega Fan', 'crunchyroll::mega-fan-monthly', { billingIncludes: 'Monthly' }],
  ['Crunchyroll Canada', 'Mega Fan', 'crunchyroll::mega-fan-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Crunchyroll Canada', 'Ultimate Fan', 'crunchyroll::ultimate-fan-annual', { multiplier: 12 }],
  ['Paramount+ Canada', 'Essential (with ads)', 'paramount-plus::essential-monthly'],
  ['Paramount+ Canada', 'Standard', 'paramount-plus::standard-monthly'],
  ['Paramount+ Canada', 'Premium', 'paramount-plus::premium-monthly'],
  ['Amazon Prime Video Canada', 'Prime Video standalone', 'prime-video::standalone-monthly'],
  ['Amazon Prime Video Canada', 'Prime full membership', 'prime-video::membership-monthly', { billingIncludes: 'Monthly' }],
  ['Amazon Prime Video Canada', 'Prime full membership', 'prime-video::membership-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['YouTube Premium Canada', 'Premium Lite', 'youtube-premium::lite-monthly'],
  ['YouTube Premium Canada', 'Premium Individual', 'youtube-premium::individual-monthly', { billingIncludes: 'Monthly' }],
  ['YouTube Premium Canada', 'Premium Individual', 'youtube-premium::individual-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['YouTube Premium Canada', 'Premium Family', 'youtube-premium::family-monthly'],
  ['Spotify Canada', 'Premium Individual', 'spotify-subscription::individual'],
  ['Spotify Canada', 'Premium Duo', 'spotify-subscription::duo'],
  ['Spotify Canada', 'Premium Family', 'spotify-subscription::family'],
  ['Apple One Canada', 'Individual', 'apple-one::individual-monthly'],
  ['Apple One Canada', 'Family', 'apple-one::family-monthly'],
  ['Apple One Canada', 'Premier', 'apple-one::premier-monthly'],
  ['Audible Canada', 'Standard', 'audible::standard-monthly'],
  ['Audible Canada', 'Premium Plus', 'audible::premium-plus-monthly', { billingIncludes: 'Monthly' }],
  ['Audible Canada', 'Premium Plus 12-credit', 'audible::premium-plus-12-credit-annual', { multiplier: 12 }],
  ['Audible Canada', 'Premium Plus 24-credit', 'audible::premium-plus-24-credit-annual', { multiplier: 12 }],
  ['Kindle Unlimited Canada', 'Monthly', 'kindle-unlimited::monthly'],
  ['Kindle Unlimited Canada', 'Annual', 'kindle-unlimited::annual', { multiplier: 12 }],
  ['ChatGPT (OpenAI)', 'Go ($8 USD)', 'chatgpt-plus::go-monthly'],
  ['ChatGPT (OpenAI)', 'Plus ($20 USD)', 'chatgpt-plus::plus-monthly'],
  ['ChatGPT (OpenAI)', 'Pro ($200 USD)', 'chatgpt-plus::pro-monthly'],
  ['Claude (Anthropic)', 'Pro ($20 USD)', 'claude-pro::pro-monthly'],
  ['Claude (Anthropic)', 'Pro annual', 'claude-pro::pro-annual', { multiplier: 12 }],
  ['Claude (Anthropic)', 'Max 5x ($100 USD)', 'claude-pro::max-5x-monthly'],
  ['Claude (Anthropic)', 'Max 20x ($200 USD)', 'claude-pro::max-20x-monthly'],
  ['Google Gemini / AI Pro', 'AI Plus', 'gemini-advanced::ai-plus-monthly'],
  ['Google Gemini / AI Pro', 'AI Pro (formerly Gemini Advanced)', 'gemini-advanced::ai-pro-monthly'],
  ['Google Gemini / AI Pro', 'AI Ultra ($249.99 USD)', 'gemini-advanced::ai-ultra-monthly'],
  ['Other AI Tools (estimates)', 'Lovable Pro', 'lovable::pro-monthly', { billingIncludes: '$25 USD' }],
  ['Other AI Tools (estimates)', 'Lovable Pro annual', 'lovable::pro-annual', { multiplier: 12 }],
  ['Snapchat+ Canada', 'Standard Monthly', 'snapchat-plus::standard-monthly'],
  ['Snapchat+ Canada', 'Standard 6-month', 'snapchat-plus::standard-6-month', { multiplier: 6 }],
  ['Snapchat+ Canada', 'Standard Annual', 'snapchat-plus::standard-annual', { multiplier: 12 }],
  ['Snapchat+ Canada', 'Lens+', 'snapchat-plus::lens-plus-monthly'],
  ['Snapchat+ Canada', 'Platinum', 'snapchat-plus::platinum-monthly'],
  ['Snapchat+ Canada', 'Family Plan', 'snapchat-plus::family-plan-monthly'],
  ['Twitch (Turbo + Subs)', 'Twitch Turbo', 'twitch-premium::turbo-monthly'],
  ['Twitch (Turbo + Subs)', 'Channel sub Tier 1', 'twitch-premium::channel-sub-tier-1'],
  ['Twitch (Turbo + Subs)', 'Channel sub Tier 2', 'twitch-premium::channel-sub-tier-2'],
  ['Twitch (Turbo + Subs)', 'Channel sub Tier 3', 'twitch-premium::channel-sub-tier-3'],
  ['Discord Nitro', 'Nitro Basic', 'discord-nitro::basic-monthly', { billingIncludes: 'Monthly' }],
  ['Discord Nitro', 'Nitro Basic', 'discord-nitro::basic-annual', { billingIncludes: 'Annual' }],
  ['Discord Nitro', 'Nitro', 'discord-nitro::nitro-monthly', { billingIncludes: 'Monthly' }],
  ['Discord Nitro', 'Nitro', 'discord-nitro::nitro-annual', { billingIncludes: 'Annual' }],
  ['X Premium', 'Basic', 'x-premium::basic-monthly'],
  ['X Premium', 'Premium', 'x-premium::premium-monthly', { billingIncludes: 'Monthly' }],
  ['X Premium', 'Premium+', 'x-premium::premium-plus-monthly'],
  ['Other social/lifestyle (estimates', 'Strava', 'strava-subscription::monthly', { productContains: 'social/lifestyle' }],
  ['Other social/lifestyle (estimates', 'Flo Premium', 'flo-premium::monthly', { productContains: 'social/lifestyle' }],
  ['Other social/lifestyle (estimates', 'Yubo Power Pack', 'yubo-subscription::monthly', { productContains: 'social/lifestyle' }],
  ['Other social/lifestyle (estimates', 'Instagram / Meta Verified', 'instagram-verification::monthly', { productContains: 'social/lifestyle' }],
  ['Other social/lifestyle (estimates', 'Reddit Premium', 'reddit-premium::monthly', { productContains: 'social/lifestyle' }],
  ['Microsoft 365 Canada', 'Personal', 'microsoft-365::personal-monthly', { billingIncludes: 'Monthly' }],
  ['Microsoft 365 Canada', 'Personal', 'microsoft-365::personal-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Microsoft 365 Canada', 'Family', 'microsoft-365::family-monthly', { billingIncludes: 'Monthly' }],
  ['Microsoft 365 Canada', 'Family', 'microsoft-365::family-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Microsoft 365 Canada', 'Premium', 'microsoft-365::premium-monthly'],
  ['Adobe Creative Cloud', 'Photography (20GB)', 'adobe-creative-cloud::photography-20gb-annual', { multiplier: 12 }],
  ['Adobe Creative Cloud', 'Photography (1TB)', 'adobe-creative-cloud::photography-1tb-monthly'],
  ['Adobe Creative Cloud', 'Single app (e.g. Photoshop)', 'adobe-creative-cloud::single-app'],
  ['Adobe Creative Cloud', 'All Apps', 'adobe-creative-cloud::all-apps', { billingIncludes: 'annual commitment' }],
  ['Adobe Creative Cloud', 'All Apps', 'adobe-creative-cloud::all-apps-no-commit', { billingIncludes: 'no commit' }],
  ['LinkedIn Premium', 'Career', 'linkedin-premium::career-monthly', { billingIncludes: 'Monthly' }],
  ['LinkedIn Premium', 'Career', 'linkedin-premium::career-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['LinkedIn Premium', 'Business', 'linkedin-premium::business-monthly', { billingIncludes: 'Monthly' }],
  ['LinkedIn Premium', 'Business', 'linkedin-premium::business-annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['LinkedIn Premium', 'Sales Navigator Core', 'linkedin-premium::sales-navigator-core-monthly'],
  ['LinkedIn Premium', 'Sales Navigator Advanced', 'linkedin-premium::sales-navigator-advanced-monthly'],
  ['LinkedIn Premium', 'Recruiter Lite', 'linkedin-premium::recruiter-lite-monthly'],
  ['LinkedIn Premium', 'Learning standalone', 'linkedin-premium::learning-monthly'],
  ['Other productivity (estimates)', 'Canva Pro', 'canva-pro::monthly', { billingIncludes: 'Monthly' }],
  ['Other productivity (estimates)', 'Canva Pro', 'canva-pro::annual', { billingIncludes: 'Annual', multiplier: 12 }],
  ['Other productivity (estimates)', 'Grammarly Premium', 'grammarly-premium::monthly'],
  ['Other productivity (estimates)', 'Zoom Workplace Pro', 'zoom-workplace::monthly'],
  ['Other productivity (estimates)', 'GoDaddy .com domain', 'buy-a-domain::dot-com-annual'],
  ['Other productivity (estimates)', 'NordVPN Standard', 'nordvpn::monthly', { billingIncludes: 'Monthly' }],
  ['Other productivity (estimates)', 'NordVPN Standard', 'nordvpn::two-year', { billingIncludes: '2-year', multiplier: 24 }],
  ['iCloud+ Canada (Apple)', '50GB', 'icloud-plus::50gb'],
  ['iCloud+ Canada (Apple)', '200GB', 'icloud-plus::200gb'],
  ['iCloud+ Canada (Apple)', '2TB', 'icloud-plus::2tb'],
  ['iCloud+ Canada (Apple)', '6TB', 'icloud-plus::6tb'],
  ['iCloud+ Canada (Apple)', '12TB', 'icloud-plus::12tb'],
  ['OneDrive / Microsoft Storage', '100GB standalone', 'onedrive-storage::100gb'],
  ['OneDrive / Microsoft Storage', '1TB (M365 Personal)', 'onedrive-storage::1tb'],
  ['OneDrive / Microsoft Storage', '6TB (M365 Family, 6 users)', 'onedrive-storage::6tb'],
  ['PlayStation Plus Canada', 'Essential', 'playstation-plus::essential-1m', { billingIncludes: 'Monthly' }],
  ['PlayStation Plus Canada', 'Essential', 'playstation-plus::essential-3m', { billingIncludes: '3 Months' }],
  ['PlayStation Plus Canada', 'Essential', 'playstation-plus::essential-12m', { billingIncludes: '12 Months' }],
  ['PlayStation Plus Canada', 'Extra', 'playstation-plus::extra-1m', { billingIncludes: 'Monthly' }],
  ['PlayStation Plus Canada', 'Extra', 'playstation-plus::extra-12m', { billingIncludes: '12 Months' }],
  ['PlayStation Plus Canada', 'Premium', 'playstation-plus::premium-1m', { billingIncludes: 'Monthly' }],
  ['PlayStation Plus Canada', 'Premium', 'playstation-plus::premium-12m', { billingIncludes: '12 Months' }],
  ['Xbox Game Pass Canada', 'Core', 'xbox-game-pass::core'],
  ['Xbox Game Pass Canada', 'Standard', 'xbox-game-pass::standard'],
  ['Xbox Game Pass Canada', 'PC Game Pass', 'xbox-game-pass::pc'],
  ['Xbox Game Pass Canada', 'Ultimate', 'xbox-game-pass::ultimate'],
  ['USD-denominated gift cards', 'Steam $20', 'steam-gift-card::usd-20'],
  ['USD-denominated gift cards', 'Steam $50', 'steam-gift-card::usd-50'],
  ['USD-denominated gift cards', 'Steam $100', 'steam-gift-card::usd-100'],
  ['USD-denominated gift cards', 'Apple App Store / iTunes $25', 'apple-app-store-itunes-gift-card::usd-25'],
  ['USD-denominated gift cards', 'Apple App Store / iTunes $50', 'apple-app-store-itunes-gift-card::usd-50'],
  ['USD-denominated gift cards', 'Apple App Store / iTunes $100', 'apple-app-store-itunes-gift-card::usd-100'],
  ['USD-denominated gift cards', 'Google Play $25', 'google-play-gift-card::usd-25'],
  ['USD-denominated gift cards', 'Google Play $50', 'google-play-gift-card::usd-50'],
  ['USD-denominated gift cards', 'Xbox $25', 'xbox-gift-card::usd-25'],
  ['USD-denominated gift cards', 'Xbox $50', 'xbox-gift-card::usd-50'],
].map(([product, tier, variantKey, options = {}]) => ({ product, tier, variantKey, ...options }));

const VPN_BUNDLE_MATCHES = [
  ['disney-plus::standard-ads-vpn-bundle', 'disney-plus::standard-ads', 1],
  ['disney-plus::standard-monthly-vpn-bundle', 'disney-plus::standard-monthly', 1],
  ['disney-plus::premium-monthly-vpn-bundle', 'disney-plus::premium-monthly', 1],
  ['disney-plus::standard-annual-vpn-bundle', 'disney-plus::standard-annual', 12],
  ['disney-plus::premium-annual-vpn-bundle', 'disney-plus::premium-annual', 12],
  ['paramount-plus::essential-monthly-vpn-bundle', 'paramount-plus::essential-monthly', 1],
  ['paramount-plus::standard-monthly-vpn-bundle', 'paramount-plus::standard-monthly', 1],
  ['paramount-plus::premium-monthly-vpn-bundle', 'paramount-plus::premium-monthly', 1],
];

function cleanText(value, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizePricingKey(value) {
  return cleanText(value, 300)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9$+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function moneyOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number(amount.toFixed(3));
}

function giftCardPriceForUsd(usd) {
  return Number((usd * CAD_PER_USD * TYPE_1_GIFT_CARD_MARGIN * WEBSITE_FX_RATE).toFixed(2));
}

function parsePricingTableRows(pricingTablePath) {
  if (!pricingTablePath || !fs.existsSync(pricingTablePath)) return [];

  const html = fs.readFileSync(pricingTablePath, 'utf8').split('<!-- INSIGHTS -->')[0] || '';
  if (html.includes('class="product-block"')) return parseProductBlockPricingRows(html);

  const rows = [];

  for (const rowMatch of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = Array.from(rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)).map((match) => decodeHtml(match[1]));
    if (cells.length !== 7 || cells[0] === 'Product') continue;

    rows.push({
      id: String(rows.length),
      product: cells[0],
      plan: cells[1],
      tier: cells[1],
      billing: '',
      tnd240: moneyOrNull(cells[5]),
      tnd211: moneyOrNull(cells[6]),
    });
  }

  return rows;
}

function decodePricingTierCell(cellHtml) {
  const billing = Array.from(cellHtml.matchAll(/<span[^>]*class="billing"[^>]*>([\s\S]*?)<\/span>/g))
    .map((match) => decodeHtml(match[1]))
    .filter(Boolean)
    .join(' ');
  const tier = decodeHtml(cellHtml.replace(/<span[^>]*class="billing"[^>]*>[\s\S]*?<\/span>/g, ''));

  return {
    tier,
    billing,
    plan: billing ? `${tier} (${billing})` : tier,
  };
}

function parseProductBlockPricingRows(html) {
  const rows = [];

  for (const blockMatch of html.matchAll(/<div class="product-block">([\s\S]*?)(?=<div class="product-block">|<!-- ============================|<footer|$)/g)) {
    const blockHtml = blockMatch[1];
    const product = decodeHtml(blockHtml.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] || '');
    if (!product) continue;

    for (const rowMatch of blockHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const cellHtml = Array.from(rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)).map((match) => match[1]);
      if (cellHtml.length !== 7) continue;

      const decodedCells = cellHtml.map((cell) => decodeHtml(cell));
      if (decodedCells[0] === 'Tier' || decodedCells[0] === 'Card') continue;

      const tierCell = decodePricingTierCell(cellHtml[0]);
      rows.push({
        id: String(rows.length),
        product,
        plan: tierCell.plan,
        tier: tierCell.tier,
        billing: tierCell.billing,
        tnd240: moneyOrNull(decodedCells[4]),
        tnd211: moneyOrNull(decodedCells[5]),
      });
    }
  }

  return rows;
}

function pricingRowMatches(row, match) {
  const normalizedProduct = normalizePricingKey(row.product);
  const normalizedMatchProduct = normalizePricingKey(match.product);
  const productMatches = match.productContains
    ? normalizedProduct.includes(normalizePricingKey(match.productContains))
    : normalizedProduct === normalizedMatchProduct;

  if (!productMatches) return false;
  if (match.tier && normalizePricingKey(row.tier || row.plan) !== normalizePricingKey(match.tier)) return false;
  if (match.billingIncludes && !normalizePricingKey(row.billing || row.plan).includes(normalizePricingKey(match.billingIncludes))) return false;
  if (match.planIncludes && !normalizePricingKey(row.plan).includes(normalizePricingKey(match.planIncludes))) return false;
  return true;
}

function applyMarginRules(amount, variantKey) {
  if (REDUCED_MARGIN_VARIANT_PREFIXES.some((prefix) => variantKey.startsWith(prefix))) {
    return Number((amount * (KNOWLEDGE_CATEGORY_MARGIN / TYPE_2_DEFAULT_MARGIN)).toFixed(3));
  }
  return Number(amount.toFixed(3));
}

function ignoredPricingRow(row) {
  const product = normalizePricingKey(row.product);
  const tier = normalizePricingKey(row.tier || row.plan);

  if (tier.includes('student')) return true;
  if (product === normalizePricingKey('USD-denominated gift cards') && tier.startsWith('netflix $')) return true;
  return false;
}

function addVpnBundleOverrides(overrides) {
  const vpnMonthly = overrides.get('nordvpn::monthly');
  if (!vpnMonthly || vpnMonthly.amount === null) return;

  for (const [bundleKey, baseKey, vpnMonths] of VPN_BUNDLE_MATCHES) {
    const base = overrides.get(baseKey);
    if (!base || base.amount === null) continue;

    overrides.set(bundleKey, {
      amount: Number(((base.amount + (vpnMonthly.amount * vpnMonths)) * (1 - VPN_BUNDLE_DISCOUNT)).toFixed(3)),
      source: 'pricing_table_bundle',
      product: base.product,
      plan: `${base.plan} + NordVPN (${vpnMonths} month${vpnMonths === 1 ? '' : 's'}, 13% bundle discount)`,
      discount: VPN_BUNDLE_DISCOUNT,
    });
  }
}

function loadPricingTableOverrides(pricingTablePath = DEFAULT_PRICING_TABLE_PATH) {
  const rows = parsePricingTableRows(pricingTablePath);
  const usedRows = new Set();
  const overrides = new Map();

  const matches = rows.some((row) => row.billing) ? PRICING_TABLE_MATCHES_V2 : PRICING_TABLE_MATCHES.map(([product, plan, variantKey]) => ({
    product,
    tier: plan,
    variantKey,
  }));

  for (const match of matches) {
    const row = rows.find((candidate) => pricingRowMatches(candidate, match));
    if (!row || row.tnd240 === null) continue;
    const baseAmount = row.tnd240 * (match.multiplier || 1);
    const amount = applyMarginRules(baseAmount, match.variantKey);

    overrides.set(match.variantKey, {
      amount,
      source: 'pricing_table',
      product: row.product,
      plan: row.plan,
      multiplier: match.multiplier || 1,
    });
    usedRows.add(row.id);
  }

  addVpnBundleOverrides(overrides);

  if (!rows.some((row) => normalizePricingKey(row.product).includes('usd denominated gift cards'))) {
    for (const productSlug of ['apple-app-store-itunes-gift-card', 'google-play-gift-card', 'steam-gift-card', 'xbox-gift-card']) {
    for (const usd of [10, 25, 50, 75, 100]) {
      const variantKey = `${productSlug}::usd-${usd}`;
      if (!overrides.has(variantKey)) {
        overrides.set(variantKey, {
          amount: giftCardPriceForUsd(usd),
          source: 'pricing_table_formula',
          product: productSlug,
          plan: `$${usd} USD`,
        });
      }
    }
    }
  }

  const unmappedRows = rows.filter((row) => row.tnd240 !== null && !usedRows.has(row.id) && !ignoredPricingRow(row));
  return { rows, overrides, unmappedRows };
}

function boolFromSheet(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return !['false', '0', 'no', 'inactive', 'off'].includes(normalized);
}

function rowsToObjects(rows) {
  const headers = (rows[0] || []).map((header) => cleanText(header).toLowerCase());
  return rows.slice(1).map((row) => {
    const object = {};
    headers.forEach((header, index) => {
      if (header) object[header] = row[index];
    });
    return object;
  });
}

function readObjectsFromFirstSheet(workbookPath, sheetNames) {
  for (const sheetName of sheetNames) {
    try {
      return { sheetName, rows: rowsToObjects(readSheetRows(workbookPath, sheetName)) };
    } catch {}
  }
  return { sheetName: null, rows: [] };
}

function imageUrlFromRow(row) {
  const explicitUrl = cleanText(row.photo_url || row.image_url, 1000);
  if (explicitUrl) return explicitUrl;

  const photoFile = cleanText(row.photo_file, 500);
  if (!photoFile) return '';
  return '/assets/products/' + encodeURIComponent(photoFile);
}

function integerOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function syncProductPricesFromWorkbook(pool, options = {}) {
  let workbookPath = options.workbookPath || process.env.PRICE_SHEET_PATH || DEFAULT_PRICE_SHEET_PATH;
  if (!fs.existsSync(workbookPath) && workbookPath === DEFAULT_PRICE_SHEET_PATH && fs.existsSync(LEGACY_PRICE_SHEET_PATH)) {
    workbookPath = LEGACY_PRICE_SHEET_PATH;
  }

  if (!fs.existsSync(workbookPath)) {
    return { skipped: true, reason: 'price sheet not found', workbookPath };
  }

  const productRead = readObjectsFromFirstSheet(workbookPath, ['Products']);
  const variationRead = readObjectsFromFirstSheet(workbookPath, ['Variations', 'Prices']);
  const pricingTablePath = options.pricingTablePath || process.env.PRICING_TABLE_PATH || DEFAULT_PRICING_TABLE_PATH;
  const pricingTable = loadPricingTableOverrides(pricingTablePath);
  const productRows = productRead.rows;
  const rows = variationRead.rows;
  const productRowsBySlug = new Map();
  for (const row of productRows) {
    const productSlug = cleanText(row.product_slug, 255);
    if (productSlug) productRowsBySlug.set(productSlug, row);
  }

  const updatedProductSlugs = new Set();
  const productIdsBySlug = new Map();
  let variantsUpdated = 0;
  let variantsDeactivated = 0;
  let productsDeactivated = 0;
  const warnings = [];

  for (const [productSlug, row] of productRowsBySlug.entries()) {
    const productName = cleanText(row.product_name, 255);
    const provider = cleanText(row.provider, 255);
    const category = cleanText(row.category, 100);
    const fulfillmentType = cleanText(row.fulfillment_type, 50);
    const productDescription = cleanText(row.product_description, 2000);
    const accountType = cleanText(row.account_type, 50);
    const durationLabel = cleanText(row.duration_label, 80);
    const imageUrl = imageUrlFromRow(row);
    const deliveryHours = integerOrNull(row.delivery_hours);

    const productResult = await pool.query(
      `INSERT INTO products (slug, name, provider, category, fulfillment_type, description, account_type, duration_label, delivery_hours, image_url, active, price_tnd)
       VALUES (
         $1,
         COALESCE(NULLIF($2, ''), 'Untitled Product'),
         COALESCE(NULLIF($3, ''), 'Lbara.tn'),
         COALESCE(NULLIF($4, ''), 'productivity'),
         COALESCE(NULLIF($5, ''), 'account_setup'),
         NULLIF($6, ''),
         COALESCE(NULLIF($7, ''), 'private'),
         COALESCE(NULLIF($8, ''), 'Options'),
         COALESCE($9, 2),
         NULLIF($10, ''),
         $11,
         0.000
       )
       ON CONFLICT (slug) DO UPDATE SET
         name = COALESCE(NULLIF(EXCLUDED.name, ''), products.name),
         provider = COALESCE(NULLIF(EXCLUDED.provider, ''), products.provider),
         category = COALESCE(NULLIF(EXCLUDED.category, ''), products.category),
         fulfillment_type = COALESCE(NULLIF(EXCLUDED.fulfillment_type, ''), products.fulfillment_type),
         description = COALESCE(EXCLUDED.description, products.description),
         account_type = COALESCE(NULLIF(EXCLUDED.account_type, ''), products.account_type),
         duration_label = COALESCE(NULLIF(EXCLUDED.duration_label, ''), products.duration_label),
         delivery_hours = COALESCE(EXCLUDED.delivery_hours, products.delivery_hours),
         image_url = COALESCE(EXCLUDED.image_url, products.image_url),
         active = EXCLUDED.active
       RETURNING id`,
      [
        productSlug,
        productName,
        provider,
        category,
        fulfillmentType,
        productDescription,
        accountType,
        durationLabel,
        deliveryHours,
        imageUrl,
        boolFromSheet(row.active),
      ]
    );
    productIdsBySlug.set(productSlug, productResult.rows[0].id);
    updatedProductSlugs.add(productSlug);
  }

  const variantSlugsByProduct = new Map();

  for (const row of rows) {
    const productSlug = cleanText(row.product_slug, 255);
    const variantSlug = cleanText(row.variant_slug, 255);
    if (!productSlug || !variantSlug) continue;

    let productId = productIdsBySlug.get(productSlug);

    if (!productId) {
      const productName = cleanText(row.product_name, 255);
      const provider = cleanText(row.provider, 255);
      const category = cleanText(row.category, 100);
      const fulfillmentType = cleanText(row.fulfillment_type, 50);
      const productDescription = cleanText(row.product_description, 2000);

      const productResult = await pool.query(
        `INSERT INTO products (slug, name, provider, category, fulfillment_type, description, price_tnd, active)
         VALUES (
           $1,
           COALESCE(NULLIF($2, ''), 'Untitled Product'),
           COALESCE(NULLIF($3, ''), 'Lbara.tn'),
           COALESCE(NULLIF($4, ''), 'productivity'),
           COALESCE(NULLIF($5, ''), 'account_setup'),
           NULLIF($6, ''),
           0.000,
           TRUE
         )
         ON CONFLICT (slug) DO UPDATE SET
           name = COALESCE(NULLIF(EXCLUDED.name, ''), products.name),
           provider = COALESCE(NULLIF(EXCLUDED.provider, ''), products.provider),
           category = COALESCE(NULLIF(EXCLUDED.category, ''), products.category),
           fulfillment_type = COALESCE(NULLIF(EXCLUDED.fulfillment_type, ''), products.fulfillment_type),
           description = COALESCE(EXCLUDED.description, products.description),
           active = TRUE
         RETURNING id`,
        [productSlug, productName, provider, category, fulfillmentType, productDescription]
      );
      productId = productResult.rows[0].id;
      productIdsBySlug.set(productSlug, productId);
      updatedProductSlugs.add(productSlug);
    }

    if (!variantSlugsByProduct.has(productSlug)) variantSlugsByProduct.set(productSlug, new Set());
    variantSlugsByProduct.get(productSlug).add(variantSlug);

    const variantName = cleanText(row.variant_name, 255);
    const billingPeriod = cleanText(row.billing_period, 80);
    const checkoutMode = cleanText(row.checkout_mode, 30) === 'quote' ? 'quote' : 'full_payment';
    const variantDescription = cleanText(row.variant_description, 2000);
    const sortOrder = integerOrNull(row.sort_order);
    const pricingOverride = pricingTable.overrides.get(`${productSlug}::${variantSlug}`);
    let priceTnd = moneyOrNull(row.price_tnd);
    let depositTnd = moneyOrNull(row.deposit_tnd);

    if (checkoutMode === 'full_payment' && priceTnd === null && depositTnd === null && pricingOverride) {
      priceTnd = pricingOverride.amount;
    }

    await pool.query(
      `INSERT INTO product_variants (product_id, slug, name, billing_period, checkout_mode, price_tnd, deposit_tnd, description, active, sort_order)
       VALUES (
         $1,
         $2,
         COALESCE(NULLIF($3, ''), 'Variant'),
         NULLIF($4, ''),
         $5,
         $6,
         $7,
         NULLIF($8, ''),
         $9,
         COALESCE($10, 100)
       )
       ON CONFLICT (product_id, slug) DO UPDATE SET
         name = COALESCE(NULLIF(EXCLUDED.name, ''), product_variants.name),
         billing_period = COALESCE(EXCLUDED.billing_period, product_variants.billing_period),
         checkout_mode = EXCLUDED.checkout_mode,
         price_tnd = EXCLUDED.price_tnd,
         deposit_tnd = EXCLUDED.deposit_tnd,
         description = EXCLUDED.description,
         active = EXCLUDED.active,
         sort_order = COALESCE(EXCLUDED.sort_order, product_variants.sort_order)`,
      [
        productId,
        variantSlug,
        variantName,
        billingPeriod,
        checkoutMode,
        priceTnd,
        depositTnd,
        variantDescription,
        boolFromSheet(row.active),
        sortOrder,
      ]
    );

    variantsUpdated += 1;
  }

  for (const [productSlug, allowedSlugs] of variantSlugsByProduct.entries()) {
    const productId = productIdsBySlug.get(productSlug);
    if (!productId || allowedSlugs.size === 0) continue;

    const result = await pool.query(
      `UPDATE product_variants
       SET active = FALSE
       WHERE product_id = $1
         AND NOT (slug = ANY($2::varchar[]))
         AND active = TRUE`,
      [productId, Array.from(allowedSlugs)]
    );
    variantsDeactivated += result.rowCount;
  }

  if (updatedProductSlugs.size > 0) {
    const result = await pool.query(
      `UPDATE products
       SET active = FALSE
       WHERE active = TRUE
         AND NOT (slug = ANY($1::varchar[]))`,
      [Array.from(updatedProductSlugs)]
    );
    productsDeactivated = result.rowCount;
  }

  return {
    skipped: false,
    workbookPath,
    productRows: productRows.length,
    rows: rows.length,
    variationSheet: variationRead.sheetName,
    productSheet: productRead.sheetName,
    productsUpdated: updatedProductSlugs.size,
    productsDeactivated,
    variantsUpdated,
    variantsDeactivated,
    pricingTablePath,
    pricingTableRows: pricingTable.rows.length,
    pricingOverridesAvailable: pricingTable.overrides.size,
    pricingTableRowsUnmapped: pricingTable.unmappedRows.map((row) => `${row.product} / ${row.plan}`),
    warnings,
  };
}

module.exports = {
  syncProductPricesFromWorkbook,
  loadPricingTableOverrides,
  parsePricingTableRows,
  DEFAULT_PRICE_SHEET_PATH,
  DEFAULT_PRICING_TABLE_PATH,
};

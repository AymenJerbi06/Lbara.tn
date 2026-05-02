const PRODUCT_ASSET_BASE = '/assets/products/';

function asset(file) {
  return PRODUCT_ASSET_BASE + encodeURIComponent(file);
}

const amountVariants = ['$10', '$25', '$50', '$75', '$100'].map((amount, index) => ({
  slug: amount.replace('$', 'usd-'),
  name: amount + ' Gift Card',
  billing_period: 'One-time',
  checkout_mode: 'full_payment',
  sort_order: (index + 1) * 10,
}));

const QUOTE_DEPOSIT_TND = 1.5;

const monthlyAnnual = [
  { slug: 'monthly', name: 'Monthly Subscription', billing_period: '1 Month', sort_order: 10 },
  { slug: 'annual', name: 'Annual Plan', billing_period: '12 Months', description: 'One annual payment. We deliver or renew access according to the service rules.', sort_order: 20 },
];

const catalog = [
  {
    slug: 'netflix-subscription',
    name: 'Netflix Subscription',
    provider: 'Netflix',
    category: 'streaming',
    image: 'Netflix.jpg',
    fulfillment_type: 'gift_card',
    description: 'Netflix access with plan options selected during checkout.',
    variants: [
      { slug: 'standard-ads', name: 'Standard with Ads', billing_period: '1 Month', sort_order: 10 },
      { slug: 'standard', name: 'Standard', billing_period: '1 Month', sort_order: 20 },
      { slug: 'premium', name: 'Premium', billing_period: '1 Month', sort_order: 30 },
      { slug: 'annual-monthly-gift-cards', name: 'Annual Delivery', billing_period: '12 Monthly Deliveries', description: 'Pay once for the year. We provide the monthly gift-card/reload flow each month.', sort_order: 40 },
    ],
  },
  {
    slug: 'spotify-subscription',
    name: 'Spotify Subscription',
    provider: 'Spotify',
    category: 'streaming',
    image: 'Spotify.jpeg',
    fulfillment_type: 'account_setup',
    description: 'Spotify Premium options, including monthly and annual access.',
    variants: [
      { slug: 'individual', name: 'Individual', billing_period: '1 Month', sort_order: 10 },
      { slug: 'duo', name: 'Duo', billing_period: '1 Month', sort_order: 20 },
      { slug: 'family', name: 'Family', billing_period: '1 Month', sort_order: 30 },
      { slug: 'annual', name: 'Annual Plan', billing_period: '12 Months', sort_order: 40 },
    ],
  },
  { slug: 'youtube-premium', name: 'YouTube Premium', provider: 'Google', category: 'streaming', image: 'youtube_premium.jpg', fulfillment_type: 'gift_card', description: 'Ad-free YouTube and YouTube Music options.', variants: monthlyAnnual },
  { slug: 'prime-video', name: 'Prime Video', provider: 'Amazon', category: 'streaming', image: 'Prime_Video.webp', fulfillment_type: 'account_setup', description: 'Prime Video streaming subscription options.', variants: monthlyAnnual },
  { slug: 'disney-plus', name: 'Disney+', provider: 'Disney', category: 'streaming', image: 'Disney+.webp', fulfillment_type: 'gift_card', description: 'Disney+ streaming subscription options.', variants: monthlyAnnual },
  { slug: 'crunchyroll', name: 'Crunchyroll', provider: 'Crunchyroll', category: 'streaming', image: 'Crunshyroll.jpg', fulfillment_type: 'account_setup', description: 'Anime streaming subscription options.', variants: monthlyAnnual },
  { slug: 'paramount-plus', name: 'Paramount+', provider: 'Paramount', category: 'streaming', image: 'Paramount+.svg', fulfillment_type: 'account_setup', description: 'Paramount+ streaming subscription options.', variants: monthlyAnnual },

  { slug: 'chatgpt-plus', name: 'ChatGPT Plus', provider: 'OpenAI', category: 'ai_tools', image: 'ChatGPT.webp', fulfillment_type: 'giftable_subscription', description: 'ChatGPT Plus access for an eligible account email.', variants: monthlyAnnual },
  { slug: 'claude-pro', name: 'Claude Pro', provider: 'Anthropic', category: 'ai_tools', image: 'Claude.png', fulfillment_type: 'giftable_subscription', description: 'Claude subscription options for an eligible account email.', variants: monthlyAnnual },
  { slug: 'gemini-advanced', name: 'Gemini Advanced', provider: 'Google', category: 'ai_tools', image: 'Gemini.png', fulfillment_type: 'giftable_subscription', description: 'Gemini Advanced subscription options.', variants: monthlyAnnual },
  { slug: 'lovable', name: 'Lovable', provider: 'Lovable', category: 'ai_tools', image: 'Lovable.avif', fulfillment_type: 'account_setup', description: 'Lovable AI builder subscription options.', variants: monthlyAnnual },
  { slug: 'nano-banana-google', name: 'Nano Banana Google', provider: 'Google', category: 'ai_tools', image: 'Nano_Banana_Google.jpg', fulfillment_type: 'account_setup', description: 'Google AI tool access request.', variants: monthlyAnnual },

  { slug: 'canva-pro', name: 'Canva Pro', provider: 'Canva', category: 'productivity', image: 'Canva.webp', fulfillment_type: 'account_setup', description: 'Canva Pro subscription options.', variants: monthlyAnnual },
  { slug: 'adobe-creative-cloud', name: 'Adobe Creative Cloud', provider: 'Adobe', category: 'productivity', image: 'Adobe creative cloud.png', fulfillment_type: 'account_setup', description: 'Adobe Creative Cloud plans and account setup.', variants: [
    { slug: 'single-app', name: 'Single App', billing_period: '1 Month', sort_order: 10 },
    { slug: 'all-apps', name: 'All Apps', billing_period: '1 Month', sort_order: 20 },
    { slug: 'annual-all-apps', name: 'Annual All Apps', billing_period: '12 Months', sort_order: 30 },
  ] },
  { slug: 'microsoft-365', name: 'Microsoft 365', provider: 'Microsoft', category: 'productivity', image: 'Microsoft 365.png', fulfillment_type: 'account_setup', description: 'Microsoft 365 Personal and Family subscription options.', variants: [
    { slug: 'personal-monthly', name: 'Personal', billing_period: '1 Month', sort_order: 10 },
    { slug: 'family-monthly', name: 'Family', billing_period: '1 Month', sort_order: 20 },
    { slug: 'personal-annual', name: 'Personal Annual', billing_period: '12 Months', sort_order: 30 },
    { slug: 'family-annual', name: 'Family Annual', billing_period: '12 Months', sort_order: 40 },
  ] },
  { slug: 'grammarly-premium', name: 'Grammarly Premium', provider: 'Grammarly', category: 'productivity', image: 'Grammarly_Premuim.avif', fulfillment_type: 'account_setup', description: 'Grammarly Premium subscription options.', variants: monthlyAnnual },
  { slug: 'linkedin-premium', name: 'LinkedIn Premium', provider: 'LinkedIn', category: 'productivity', image: 'LinkedIn_Premuim.svg', fulfillment_type: 'account_setup', description: 'LinkedIn Premium subscription options.', variants: monthlyAnnual },
  { slug: 'zoom-workplace', name: 'Zoom Workplace', provider: 'Zoom', category: 'productivity', image: 'Zoom_Workplace__subscription.jpg', fulfillment_type: 'account_setup', description: 'Zoom Workplace subscription options.', variants: monthlyAnnual },
  { slug: 'buy-a-domain', name: 'Buy a Domain', provider: 'Domain Registrar', category: 'productivity', image: 'BuyADomain.jpg', fulfillment_type: 'account_setup', description: 'Domain purchase request. Final quote depends on domain name and extension.', variants: [{ slug: 'domain-request', name: 'Domain Request', billing_period: 'Quote', checkout_mode: 'quote', sort_order: 10 }] },

  { slug: 'coursera-certificate', name: 'Coursera Certificate Request', provider: 'Coursera', category: 'education', image: 'Coursera.png', fulfillment_type: 'existing_account_only', description: 'Request help purchasing a Coursera certificate after you complete a course. Final price depends on the course.', variants: [{ slug: 'certificate-review', name: 'Certificate Review', billing_period: 'Deposit / Quote', checkout_mode: 'quote', description: 'We review the course and contact you with the final certificate price.', sort_order: 10 }] },
  { slug: 'edx-certificate-free-course', name: 'edX Certificate for Free Course', provider: 'edX', category: 'education', image: 'edX Certificates (free Courses).webp', fulfillment_type: 'existing_account_only', description: 'Certificate request for eligible edX free courses. Final price depends on the course.', variants: [{ slug: 'certificate-review', name: 'Certificate Review', billing_period: 'Deposit / Quote', checkout_mode: 'quote', sort_order: 10 }] },
  { slug: 'edx-paid-course', name: 'edX Paid Course', provider: 'edX', category: 'education', image: 'edX paid Courses.jpg', fulfillment_type: 'existing_account_only', description: 'Paid edX course purchase request. Final quote depends on course price.', variants: [{ slug: 'course-review', name: 'Course Review', billing_period: 'Deposit / Quote', checkout_mode: 'quote', sort_order: 10 }] },

  { slug: 'playstation-plus', name: 'PlayStation Plus Subscription', provider: 'PlayStation', category: 'gaming', image: 'Plastation Plus subscription.webp', fulfillment_type: 'gift_card', description: 'PlayStation Plus plan options.', variants: [
    { slug: 'essential-1m', name: 'Essential', billing_period: '1 Month', sort_order: 10 },
    { slug: 'extra-1m', name: 'Extra', billing_period: '1 Month', sort_order: 20 },
    { slug: 'premium-1m', name: 'Premium', billing_period: '1 Month', sort_order: 30 },
    { slug: 'essential-12m', name: 'Essential Annual', billing_period: '12 Months', sort_order: 40 },
    { slug: 'extra-12m', name: 'Extra Annual', billing_period: '12 Months', sort_order: 50 },
    { slug: 'premium-12m', name: 'Premium Annual', billing_period: '12 Months', sort_order: 60 },
  ] },
  { slug: 'xbox-game-pass', name: 'Xbox Game Pass', provider: 'Xbox', category: 'gaming', image: 'Xbox Game Pass.png', fulfillment_type: 'gift_card', description: 'Xbox Game Pass plan options.', variants: [
    { slug: 'pc', name: 'PC Game Pass', billing_period: '1 Month', sort_order: 10 },
    { slug: 'core', name: 'Game Pass Core', billing_period: '1 Month', sort_order: 20 },
    { slug: 'ultimate', name: 'Game Pass Ultimate', billing_period: '1 Month', sort_order: 30 },
    { slug: 'ultimate-annual', name: 'Ultimate Annual', billing_period: '12 Months', sort_order: 40 },
  ] },
  { slug: 'discord-nitro', name: 'Discord Nitro', provider: 'Discord', category: 'gaming', image: 'Discord Nitro.jpg', fulfillment_type: 'giftable_subscription', description: 'Discord Nitro subscription options.', variants: [
    { slug: 'basic-monthly', name: 'Nitro Basic', billing_period: '1 Month', sort_order: 10 },
    { slug: 'nitro-monthly', name: 'Nitro', billing_period: '1 Month', sort_order: 20 },
    { slug: 'nitro-annual', name: 'Nitro Annual', billing_period: '12 Months', sort_order: 30 },
  ] },
  { slug: 'twitch-premium', name: 'Twitch Premium', provider: 'Twitch', category: 'gaming', image: 'Twitch_Premium.png', fulfillment_type: 'giftable_subscription', description: 'Twitch premium/Turbo-style access options.', variants: monthlyAnnual },

  { slug: 'apple-app-store-itunes-gift-card', name: 'Apple App Store & iTunes Gift Card', provider: 'Apple', category: 'gift_cards', image: 'appstore and itunes gift cards.jpg', fulfillment_type: 'gift_card', description: 'Apple App Store and iTunes credit. Region setup may be required.', variants: amountVariants },
  { slug: 'google-play-gift-card', name: 'Google Play Gift Card', provider: 'Google Play', category: 'gift_cards', image: 'google PlayStore Gift Cards.png', fulfillment_type: 'gift_card', description: 'Google Play gift card denominations.', variants: amountVariants },
  { slug: 'steam-gift-card', name: 'Steam Gift Card', provider: 'Steam', category: 'gift_cards', image: 'Steam gift cards.jpg', fulfillment_type: 'gift_card', description: 'Steam wallet gift card denominations.', variants: amountVariants },
  { slug: 'xbox-gift-card', name: 'Xbox Gift Card', provider: 'Xbox', category: 'gift_cards', image: 'Xbox Gift Card.webp', fulfillment_type: 'gift_card', description: 'Xbox gift card denominations.', variants: amountVariants },

  { slug: 'icloud-plus', name: 'iCloud+', provider: 'Apple', category: 'storage', image: 'iCloud+.png', fulfillment_type: 'gift_card', description: 'iCloud+ storage subscription options.', variants: [
    { slug: '50gb', name: '50GB', billing_period: '1 Month', sort_order: 10 },
    { slug: '200gb', name: '200GB', billing_period: '1 Month', sort_order: 20 },
    { slug: '2tb', name: '2TB', billing_period: '1 Month', sort_order: 30 },
    { slug: 'annual', name: 'Annual Delivery', billing_period: '12 Months', sort_order: 40 },
  ] },
  { slug: 'onedrive-storage', name: 'OneDrive Storage Subscription', provider: 'Microsoft', category: 'storage', image: 'OneDrive_Storage Subscription.png', fulfillment_type: 'account_setup', description: 'OneDrive storage subscription options.', variants: [
    { slug: '100gb', name: '100GB', billing_period: '1 Month', sort_order: 10 },
    { slug: '1tb', name: '1TB', billing_period: '1 Month', sort_order: 20 },
    { slug: 'annual', name: 'Annual Storage', billing_period: '12 Months', sort_order: 30 },
  ] },
  { slug: 'google-cloud', name: 'Google Cloud', provider: 'Google Cloud', category: 'cloud', image: 'Google Cloud.png', fulfillment_type: 'account_setup', description: 'Google Cloud billing or credit request. Final quote depends on usage.', variants: [{ slug: 'cloud-request', name: 'Cloud Request', billing_period: 'Quote', checkout_mode: 'quote', sort_order: 10 }] },

  { slug: 'nordvpn', name: 'NordVPN', provider: 'NordVPN', category: 'vpn', image: 'NordVpn.png', fulfillment_type: 'account_setup', description: 'NordVPN subscription options.', variants: monthlyAnnual },
  { slug: 'audible', name: 'Audible', provider: 'Audible', category: 'books', image: 'Audible.webp', fulfillment_type: 'account_setup', description: 'Audible subscription options.', variants: monthlyAnnual },
  { slug: 'kindle-unlimited', name: 'Kindle Unlimited', provider: 'Amazon Kindle', category: 'books', image: 'Kindle_Unlimited.avif', fulfillment_type: 'account_setup', description: 'Kindle Unlimited subscription options.', variants: monthlyAnnual },
  { slug: 'apple-books', name: 'Apple Books Purchase', provider: 'Apple Books', category: 'books', image: 'Books_Apple.png', fulfillment_type: 'gift_card', description: 'Apple Books purchase request using store credit where possible.', variants: [{ slug: 'book-request', name: 'Book Request', billing_period: 'Quote', checkout_mode: 'quote', sort_order: 10 }] },

  { slug: 'snapchat-plus', name: 'Snapchat+', provider: 'Snapchat', category: 'social', image: 'Snapchat plus.png', fulfillment_type: 'account_setup', description: 'Snapchat+ subscription options.', variants: monthlyAnnual },
  { slug: 'reddit-premium', name: 'Reddit Premium', provider: 'Reddit', category: 'social', image: 'Reddit.webp', fulfillment_type: 'account_setup', description: 'Reddit Premium subscription options.', variants: monthlyAnnual },
  { slug: 'x-premium', name: 'X Premium', provider: 'X', category: 'social', image: 'X_premium.webp', fulfillment_type: 'account_setup', description: 'X Premium subscription options.', variants: monthlyAnnual },
  { slug: 'instagram-verification', name: 'Instagram Verification', provider: 'Instagram', category: 'social', image: 'Instagram_verification.webp', fulfillment_type: 'account_setup', description: 'Meta Verified / verification request options.', variants: monthlyAnnual },
  { slug: 'yubo-subscription', name: 'Yubo Subscription', provider: 'Yubo', category: 'social', image: 'Yubo_subscription.avif', fulfillment_type: 'account_setup', description: 'Yubo subscription options.', variants: monthlyAnnual },

  { slug: 'flo-premium', name: 'Flo Premium', provider: 'Flo', category: 'lifestyle', image: 'Flo premium.png', fulfillment_type: 'account_setup', description: 'Flo Premium subscription options.', variants: monthlyAnnual },
  { slug: 'strava-subscription', name: 'Strava Subscription', provider: 'Strava', category: 'lifestyle', image: 'Strava_Subscription.jpg', fulfillment_type: 'account_setup', description: 'Strava subscription options.', variants: monthlyAnnual },
];

function v2Variant(slug, name, billing_period, sort_order, description = '', checkout_mode = 'full_payment') {
  const variant = { slug, name, billing_period, sort_order, checkout_mode };
  if (description) variant.description = description;
  return variant;
}

function giftCardVariants(amounts) {
  return amounts.map((amount, index) => v2Variant(
    `usd-${amount}`,
    `$${amount} Gift Card`,
    'One-time',
    (index + 1) * 10,
    `$${amount} USD store credit delivered with redemption instructions.`
  ));
}

const pricingV2CatalogUpdates = {
  'netflix-subscription': {
    variants: [
      v2Variant('standard-ads', 'Standard with Ads', '1 Month', 10),
      v2Variant('standard', 'Standard', '1 Month', 20),
      v2Variant('premium', 'Premium', '1 Month', 30),
      v2Variant('extra-member-ads', 'Extra Member with Ads', 'Add-on', 40, 'Add-on for an eligible Standard or Premium account.'),
      v2Variant('extra-member-ad-free', 'Extra Member ad-free', 'Add-on', 50, 'Ad-free add-on for an eligible Standard or Premium account.'),
    ],
  },
  'spotify-subscription': {
    variants: [
      v2Variant('individual', 'Premium Individual', '1 Month', 10),
      v2Variant('duo', 'Premium Duo', '1 Month', 20),
      v2Variant('family', 'Premium Family', '1 Month', 30),
    ],
  },
  'youtube-premium': {
    variants: [
      v2Variant('lite-monthly', 'Premium Lite', '1 Month', 10),
      v2Variant('individual-monthly', 'Premium Individual', '1 Month', 20),
      v2Variant('individual-annual', 'Premium Individual Annual', '12 Months', 30),
      v2Variant('family-monthly', 'Premium Family', '1 Month', 40),
    ],
  },
  'prime-video': {
    variants: [
      v2Variant('standalone-monthly', 'Prime Video standalone', '1 Month', 10),
      v2Variant('membership-monthly', 'Prime full membership', '1 Month', 20),
      v2Variant('membership-annual', 'Prime full membership Annual', '12 Months', 30),
    ],
  },
  'disney-plus': {
    description: 'Disney+ is not officially available in Tunisia. Even after purchase, customers should expect to use a reliable VPN to watch and redeem the service. NordVPN bundle options include a 13% bundle discount.',
    variants: [
      v2Variant('standard-ads', 'Standard with Ads', '1 Month', 10, 'Disney+ with ads. A VPN is required from Tunisia because Disney+ is not officially available there.'),
      v2Variant('standard-monthly', 'Standard', '1 Month', 20, 'Ad-free Disney+ in HD. A VPN is required from Tunisia because Disney+ is not officially available there.'),
      v2Variant('standard-annual', 'Standard Annual', '12 Months', 30, 'Ad-free Disney+ in HD paid for the full year. Annual billing lowers the effective monthly cost compared with paying month by month; a VPN is required from Tunisia.'),
      v2Variant('premium-monthly', 'Premium', '1 Month', 40, 'Disney+ Premium with higher-quality streaming where available. A VPN is required from Tunisia because Disney+ is not officially available there.'),
      v2Variant('premium-annual', 'Premium Annual', '12 Months', 50, 'Disney+ Premium paid for the full year. Annual billing lowers the effective monthly cost compared with paying month by month; a VPN is required from Tunisia.'),
      v2Variant('standard-ads-vpn-bundle', 'Standard with Ads + NordVPN', '1 Month', 60, 'Disney+ Standard with Ads bundled with one month of NordVPN at 13% off the combined price. Recommended because Disney+ is not officially available in Tunisia.'),
      v2Variant('standard-monthly-vpn-bundle', 'Standard + NordVPN', '1 Month', 70, 'Disney+ Standard bundled with one month of NordVPN at 13% off the combined price. Recommended because Disney+ is not officially available in Tunisia.'),
      v2Variant('premium-monthly-vpn-bundle', 'Premium + NordVPN', '1 Month', 80, 'Disney+ Premium bundled with one month of NordVPN at 13% off the combined price. Recommended because Disney+ is not officially available in Tunisia.'),
      v2Variant('standard-annual-vpn-bundle', 'Standard Annual + NordVPN', '12 Months', 90, 'Disney+ Standard Annual bundled with 12 months of NordVPN at 13% off the combined price. You pay once for the year and avoid monthly renewals.'),
      v2Variant('premium-annual-vpn-bundle', 'Premium Annual + NordVPN', '12 Months', 100, 'Disney+ Premium Annual bundled with 12 months of NordVPN at 13% off the combined price. You pay once for the year and avoid monthly renewals.'),
    ],
  },
  crunchyroll: {
    variants: [
      v2Variant('fan-monthly', 'Fan', '1 Month', 10),
      v2Variant('fan-annual', 'Fan Annual', '12 Months', 20),
      v2Variant('mega-fan-monthly', 'Mega Fan', '1 Month', 30),
      v2Variant('mega-fan-annual', 'Mega Fan Annual', '12 Months', 40),
      v2Variant('ultimate-fan-annual', 'Ultimate Fan Annual', '12 Months', 50),
    ],
  },
  'paramount-plus': {
    description: 'Paramount+ availability in Tunisia is restricted. Customers should expect to use a reliable VPN after purchase. NordVPN bundle options include a 13% bundle discount.',
    variants: [
      v2Variant('essential-monthly', 'Essential with ads', '1 Month', 10, 'Paramount+ Essential includes the ad-supported streaming plan. A VPN is required from Tunisia because availability is restricted.'),
      v2Variant('standard-monthly', 'Standard', '1 Month', 20, 'Paramount+ Standard is the ad-free plan where available. A VPN is required from Tunisia because availability is restricted.'),
      v2Variant('premium-monthly', 'Premium', '1 Month', 30, 'Paramount+ Premium adds higher-tier features where available. A VPN is required from Tunisia because availability is restricted.'),
      v2Variant('essential-monthly-vpn-bundle', 'Essential with ads + NordVPN', '1 Month', 40, 'Paramount+ Essential bundled with one month of NordVPN at 13% off the combined price. Recommended because Paramount+ availability is restricted in Tunisia.'),
      v2Variant('standard-monthly-vpn-bundle', 'Standard + NordVPN', '1 Month', 50, 'Paramount+ Standard bundled with one month of NordVPN at 13% off the combined price. Recommended because Paramount+ availability is restricted in Tunisia.'),
      v2Variant('premium-monthly-vpn-bundle', 'Premium + NordVPN', '1 Month', 60, 'Paramount+ Premium bundled with one month of NordVPN at 13% off the combined price. Recommended because Paramount+ availability is restricted in Tunisia.'),
    ],
  },
  'chatgpt-plus': {
    name: 'ChatGPT',
    description: 'ChatGPT subscription options for eligible OpenAI accounts.',
    variants: [
      v2Variant('go-monthly', 'ChatGPT Go', '1 Month', 10),
      v2Variant('plus-monthly', 'ChatGPT Plus', '1 Month', 20),
      v2Variant('pro-monthly', 'ChatGPT Pro', '1 Month', 30),
    ],
  },
  'claude-pro': {
    name: 'Claude',
    description: 'Claude subscription options for eligible Anthropic accounts.',
    variants: [
      v2Variant('pro-monthly', 'Claude Pro', '1 Month', 10),
      v2Variant('pro-annual', 'Claude Pro Annual', '12 Months', 20),
      v2Variant('max-5x-monthly', 'Claude Max 5x', '1 Month', 30),
      v2Variant('max-20x-monthly', 'Claude Max 20x', '1 Month', 40),
    ],
  },
  'gemini-advanced': {
    name: 'Google Gemini / AI Pro',
    description: 'Google AI subscription options including AI Plus, AI Pro, and AI Ultra.',
    variants: [
      v2Variant('ai-plus-monthly', 'AI Plus', '1 Month', 10),
      v2Variant('ai-pro-monthly', 'AI Pro', '1 Month', 20),
      v2Variant('ai-ultra-monthly', 'AI Ultra', '1 Month', 30),
    ],
  },
  lovable: {
    variants: [
      v2Variant('pro-monthly', 'Lovable Pro', '1 Month', 10),
      v2Variant('pro-annual', 'Lovable Pro Annual', '12 Months', 20),
    ],
  },
  'nano-banana-google': {
    variants: [
      v2Variant('bundled-ai-pro', 'Bundled with Google AI Pro', 'Included / Quote', 10, 'Not sold as a standalone plan. Use Google Gemini / AI Pro when the customer needs this access.', 'quote'),
    ],
  },
  'canva-pro': {
    variants: [
      v2Variant('monthly', 'Canva Pro', '1 Month', 10),
      v2Variant('annual', 'Canva Pro Annual', '12 Months', 20),
    ],
  },
  'adobe-creative-cloud': {
    variants: [
      v2Variant('photography-20gb-annual', 'Photography 20GB Annual', '12 Months', 10),
      v2Variant('photography-1tb-monthly', 'Photography 1TB', '1 Month', 20),
      v2Variant('single-app', 'Single App', '1 Month', 30),
      v2Variant('all-apps', 'All Apps Annual Commitment', '1 Month', 40),
      v2Variant('all-apps-no-commit', 'All Apps No Commitment', '1 Month', 50),
    ],
  },
  'microsoft-365': {
    variants: [
      v2Variant('personal-monthly', 'Personal', '1 Month', 10),
      v2Variant('personal-annual', 'Personal Annual', '12 Months', 20),
      v2Variant('family-monthly', 'Family', '1 Month', 30),
      v2Variant('family-annual', 'Family Annual', '12 Months', 40),
      v2Variant('premium-monthly', 'Premium with Copilot', '1 Month', 50),
    ],
  },
  'grammarly-premium': {
    variants: [
      v2Variant('monthly', 'Grammarly Premium', '1 Month', 10),
    ],
  },
  'linkedin-premium': {
    variants: [
      v2Variant('career-monthly', 'Career', '1 Month', 10),
      v2Variant('career-annual', 'Career Annual', '12 Months', 20),
      v2Variant('business-monthly', 'Business', '1 Month', 30),
      v2Variant('business-annual', 'Business Annual', '12 Months', 40),
      v2Variant('sales-navigator-core-monthly', 'Sales Navigator Core', '1 Month', 50),
      v2Variant('sales-navigator-advanced-monthly', 'Sales Navigator Advanced', '1 Month', 60),
      v2Variant('recruiter-lite-monthly', 'Recruiter Lite', '1 Month', 70),
      v2Variant('learning-monthly', 'Learning standalone', '1 Month', 80),
    ],
  },
  'zoom-workplace': {
    variants: [
      v2Variant('monthly', 'Zoom Workplace Pro', '1 Month', 10),
    ],
  },
  'buy-a-domain': {
    variants: [
      v2Variant('dot-com-annual', 'GoDaddy .com Domain', '1 Year', 10, 'Standard first-year .com domain estimate. Final renewals and premium domains may differ.'),
      v2Variant('domain-request', 'Custom Domain Request', 'Quote', 20, 'Use this when the domain extension, premium price, or renewal terms need a manual quote.', 'quote'),
    ],
  },
  nordvpn: {
    variants: [
      v2Variant('monthly', 'NordVPN Standard', '1 Month', 10),
      v2Variant('two-year', 'NordVPN Standard 2-year plan', '24 Months', 20),
    ],
  },
  'playstation-plus': {
    variants: [
      v2Variant('essential-1m', 'Essential', '1 Month', 10),
      v2Variant('essential-3m', 'Essential 3 Months', '3 Months', 20),
      v2Variant('essential-12m', 'Essential Annual', '12 Months', 30),
      v2Variant('extra-1m', 'Extra', '1 Month', 40),
      v2Variant('extra-12m', 'Extra Annual', '12 Months', 50),
      v2Variant('premium-1m', 'Premium', '1 Month', 60),
      v2Variant('premium-12m', 'Premium Annual', '12 Months', 70),
    ],
  },
  'xbox-game-pass': {
    variants: [
      v2Variant('core', 'Game Pass Core', '1 Month', 10),
      v2Variant('standard', 'Game Pass Standard', '1 Month', 20),
      v2Variant('pc', 'PC Game Pass', '1 Month', 30),
      v2Variant('ultimate', 'Game Pass Ultimate', '1 Month', 40),
    ],
  },
  'discord-nitro': {
    variants: [
      v2Variant('basic-monthly', 'Nitro Basic', '1 Month', 10),
      v2Variant('basic-annual', 'Nitro Basic Annual', '12 Months', 20),
      v2Variant('nitro-monthly', 'Nitro', '1 Month', 30),
      v2Variant('nitro-annual', 'Nitro Annual', '12 Months', 40),
    ],
  },
  'twitch-premium': {
    name: 'Twitch Turbo & Subs',
    description: 'Twitch Turbo and channel subscription options.',
    variants: [
      v2Variant('turbo-monthly', 'Twitch Turbo', '1 Month', 10),
      v2Variant('channel-sub-tier-1', 'Channel Sub Tier 1', '1 Month', 20),
      v2Variant('channel-sub-tier-2', 'Channel Sub Tier 2', '1 Month', 30),
      v2Variant('channel-sub-tier-3', 'Channel Sub Tier 3', '1 Month', 40),
    ],
  },
  'apple-app-store-itunes-gift-card': {
    variants: giftCardVariants([25, 50, 100]),
  },
  'google-play-gift-card': {
    variants: giftCardVariants([25, 50]),
  },
  'steam-gift-card': {
    variants: giftCardVariants([20, 50, 100]),
  },
  'xbox-gift-card': {
    variants: giftCardVariants([25, 50]),
  },
  'icloud-plus': {
    variants: [
      v2Variant('50gb', '50GB', '1 Month', 10),
      v2Variant('200gb', '200GB', '1 Month', 20),
      v2Variant('2tb', '2TB', '1 Month', 30),
      v2Variant('6tb', '6TB', '1 Month', 40, 'One month of iCloud+ 6TB storage.'),
      v2Variant('12tb', '12TB', '1 Month', 50, 'One month of iCloud+ 12TB storage.'),
    ],
  },
  'onedrive-storage': {
    variants: [
      v2Variant('100gb', '100GB standalone', '1 Month', 10),
      v2Variant('1tb', '1TB Microsoft 365 Personal', '1 Month', 20),
      v2Variant('6tb', '6TB Microsoft 365 Family', '1 Month', 30, 'One month of Microsoft 365 Family storage, 1TB per user for up to 6 users.'),
    ],
  },
  audible: {
    variants: [
      v2Variant('standard-monthly', 'Audible Standard', '1 Month', 10),
      v2Variant('premium-plus-monthly', 'Premium Plus', '1 Month', 20),
      v2Variant('premium-plus-12-credit-annual', 'Premium Plus 12-credit Annual', '12 Months', 30),
      v2Variant('premium-plus-24-credit-annual', 'Premium Plus 24-credit Annual', '12 Months', 40),
    ],
  },
  'kindle-unlimited': {
    variants: [
      v2Variant('monthly', 'Kindle Unlimited', '1 Month', 10),
      v2Variant('annual', 'Kindle Unlimited Annual', '12 Months', 20),
    ],
  },
  'snapchat-plus': {
    variants: [
      v2Variant('standard-monthly', 'Standard Monthly', '1 Month', 10),
      v2Variant('standard-6-month', 'Standard 6-month', '6 Months', 20),
      v2Variant('standard-annual', 'Standard Annual', '12 Months', 30),
      v2Variant('lens-plus-monthly', 'Lens+', '1 Month', 40),
      v2Variant('platinum-monthly', 'Platinum', '1 Month', 50),
      v2Variant('family-plan-monthly', 'Family Plan', '1 Month', 60),
    ],
  },
  'reddit-premium': {
    variants: [
      v2Variant('monthly', 'Reddit Premium', '1 Month', 10),
    ],
  },
  'x-premium': {
    variants: [
      v2Variant('basic-monthly', 'Basic', '1 Month', 10),
      v2Variant('premium-monthly', 'Premium', '1 Month', 20),
      v2Variant('premium-plus-monthly', 'Premium+', '1 Month', 30),
    ],
  },
  'instagram-verification': {
    variants: [
      v2Variant('monthly', 'Instagram / Meta Verified', '1 Month', 10),
    ],
  },
  'yubo-subscription': {
    variants: [
      v2Variant('monthly', 'Yubo Power Pack', '1 Month', 10),
    ],
  },
  'flo-premium': {
    variants: [
      v2Variant('monthly', 'Flo Premium', '1 Month', 10),
    ],
  },
  'strava-subscription': {
    variants: [
      v2Variant('monthly', 'Strava', '1 Month', 10),
    ],
  },
};

const pricingV2NewProducts = [
  {
    slug: 'apple-one',
    name: 'Apple One',
    provider: 'Apple',
    category: 'streaming',
    image: 'iCloud+.png',
    fulfillment_type: 'gift_card',
    description: 'Apple One bundle options including Apple Music, TV+, Arcade, and iCloud storage.',
    variants: [
      v2Variant('individual-monthly', 'Individual', '1 Month', 10),
      v2Variant('family-monthly', 'Family', '1 Month', 20),
      v2Variant('premier-monthly', 'Premier', '1 Month', 30),
    ],
  },
];

const SPECIAL_REQUEST_DESCRIPTION = 'Special request ticket. You pay 1.500 TND only to open the request, review availability, and let us contact you shortly. This ticket fee is not part of the final service price and is not refundable if you change your mind. You must provide the required account details so we can quote and complete the request. Example: if a course certificate costs 40 CAD, the expected final price is about 125.798 TND using 40 CAD x 12% tax x 17% service margin x 2.40.';

const VARIANT_DESCRIPTION_OVERRIDES = {
  'netflix-subscription::standard-ads': 'Netflix Standard with Ads, usually HD streaming with ads on supported devices. Activation is handled through the correct gift-card/account flow.',
  'netflix-subscription::standard': 'Netflix Standard ad-free plan with HD streaming and the Standard plan features available in Canada.',
  'netflix-subscription::premium': 'Netflix Premium plan with the highest streaming quality available for the account, including 4K where supported.',
  'spotify-subscription::individual': 'Spotify Premium for one person: ad-free music, downloads, and on-demand playback.',
  'spotify-subscription::duo': 'Spotify Premium Duo for two people who meet Spotify household/address rules.',
  'spotify-subscription::family': 'Spotify Premium Family for up to 6 eligible members under Spotify household rules.',
  'youtube-premium::lite-monthly': 'YouTube Premium Lite removes ads on YouTube videos where supported, but it does not include the full YouTube Music Premium bundle.',
  'youtube-premium::individual-monthly': 'Full YouTube Premium for one account: ad-free YouTube, background play, downloads, and YouTube Music Premium.',
  'youtube-premium::individual-annual': 'Full YouTube Premium for one account paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'youtube-premium::family-monthly': 'YouTube Premium Family for eligible household members, including ad-free YouTube and YouTube Music Premium.',
  'prime-video::standalone-monthly': 'Prime Video standalone streaming access without the full Amazon Prime membership benefits.',
  'prime-video::membership-monthly': 'Full Amazon Prime membership including Prime Video and other membership benefits available on the account.',
  'prime-video::membership-annual': 'Full Amazon Prime membership paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'crunchyroll::fan-monthly': 'Crunchyroll Fan gives ad-free anime streaming on one device where available.',
  'crunchyroll::fan-annual': 'Crunchyroll Fan paid annually. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'crunchyroll::mega-fan-monthly': 'Crunchyroll Mega Fan adds more devices and offline viewing where available.',
  'crunchyroll::mega-fan-annual': 'Crunchyroll Mega Fan paid annually. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'crunchyroll::ultimate-fan-annual': 'Crunchyroll Ultimate Fan annual plan for the highest consumer tier available in Canada.',
  'chatgpt-plus::go-monthly': 'ChatGPT Go is the entry paid tier, useful for lighter AI usage at a lower monthly price.',
  'chatgpt-plus::plus-monthly': 'ChatGPT Plus is the main personal paid plan with stronger limits and priority access compared with the free tier.',
  'chatgpt-plus::pro-monthly': 'ChatGPT Pro is the high-usage plan for power users who need much higher limits.',
  'claude-pro::pro-monthly': 'Claude Pro monthly access for one Anthropic account.',
  'claude-pro::pro-annual': 'Claude Pro paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'claude-pro::max-5x-monthly': 'Claude Max 5x gives substantially higher usage than Pro for heavier daily work.',
  'claude-pro::max-20x-monthly': 'Claude Max 20x gives the highest Max usage tier for very heavy work.',
  'gemini-advanced::ai-plus-monthly': 'Google AI Plus entry tier with AI features and included storage according to Google account rules.',
  'gemini-advanced::ai-pro-monthly': 'Google AI Pro, formerly Gemini Advanced, with stronger Gemini access and included Google storage.',
  'gemini-advanced::ai-ultra-monthly': 'Google AI Ultra for the highest Google AI tier and advanced media/AI access where supported.',
  'lovable::pro-monthly': 'Lovable Pro monthly access for building and iterating apps with higher limits than the free tier.',
  'lovable::pro-annual': 'Lovable Pro annual access. Annual billing lowers the effective monthly cost compared with paying every month.',
  'canva-pro::monthly': 'Canva Pro monthly access with premium templates, assets, brand tools, and background remover where supported.',
  'canva-pro::annual': 'Canva Pro paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'adobe-creative-cloud::photography-20gb-annual': 'Adobe Photography annual plan with Lightroom and Photoshop plus 20GB cloud storage.',
  'adobe-creative-cloud::photography-1tb-monthly': 'Adobe Photography plan with Lightroom and Photoshop plus 1TB cloud storage.',
  'adobe-creative-cloud::single-app': 'One Adobe app, such as Photoshop, for one account.',
  'adobe-creative-cloud::all-apps': 'Adobe Creative Cloud All Apps under annual commitment pricing.',
  'adobe-creative-cloud::all-apps-no-commit': 'Adobe Creative Cloud All Apps monthly plan without annual commitment; more flexible but more expensive.',
  'microsoft-365::personal-monthly': 'Microsoft 365 Personal for one person with Office apps and 1TB OneDrive storage.',
  'microsoft-365::personal-annual': 'Microsoft 365 Personal paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'microsoft-365::family-monthly': 'Microsoft 365 Family for up to 6 people, each with their own storage allocation.',
  'microsoft-365::family-annual': 'Microsoft 365 Family paid annually. Annual billing lowers the effective monthly cost compared with paying every month.',
  'microsoft-365::premium-monthly': 'Microsoft 365 Premium tier with expanded AI/Copilot-style features where available.',
  'linkedin-premium::career-monthly': 'LinkedIn Premium Career for job seekers, profile insights, and career tools.',
  'linkedin-premium::career-annual': 'LinkedIn Premium Career paid annually. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'linkedin-premium::business-monthly': 'LinkedIn Premium Business for broader browsing and business networking features.',
  'linkedin-premium::business-annual': 'LinkedIn Premium Business paid annually. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'linkedin-premium::sales-navigator-core-monthly': 'LinkedIn Sales Navigator Core for prospecting and lead search workflows.',
  'linkedin-premium::sales-navigator-advanced-monthly': 'LinkedIn Sales Navigator Advanced for larger sales workflows and deeper tools.',
  'linkedin-premium::recruiter-lite-monthly': 'LinkedIn Recruiter Lite for light recruiting and candidate search.',
  'linkedin-premium::learning-monthly': 'LinkedIn Learning standalone access for courses and certificates inside LinkedIn Learning.',
  'nordvpn::monthly': 'NordVPN Standard monthly VPN access. Useful for privacy and for services that require a supported region.',
  'nordvpn::two-year': 'NordVPN Standard 2-year plan. Lower effective monthly cost if you expect to need a VPN long term.',
  'audible::standard-monthly': 'Audible Standard monthly access with the standard Canada offering.',
  'audible::premium-plus-monthly': 'Audible Premium Plus monthly access with one credit and Plus catalog benefits where available.',
  'audible::premium-plus-12-credit-annual': 'Audible Premium Plus annual 12-credit plan. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'audible::premium-plus-24-credit-annual': 'Audible Premium Plus annual 24-credit plan for heavier listeners.',
  'kindle-unlimited::monthly': 'Kindle Unlimited monthly reading access for the supported Amazon account.',
  'kindle-unlimited::annual': 'Kindle Unlimited annual access. Annual billing lowers the effective monthly cost compared with paying every month.',
  'snapchat-plus::standard-monthly': 'Snapchat+ Standard monthly access with the core Snapchat+ feature set.',
  'snapchat-plus::standard-6-month': 'Snapchat+ Standard for 6 months. Multi-month billing lowers the effective monthly cost compared with monthly renewal.',
  'snapchat-plus::standard-annual': 'Snapchat+ Standard paid annually. Annual billing lowers the effective monthly cost compared with monthly renewal.',
  'snapchat-plus::lens-plus-monthly': 'Snapchat Lens+ for advanced AR/lens creation features where available.',
  'snapchat-plus::platinum-monthly': 'Snapchat Platinum for the ad-free/highest-feature option where available.',
  'snapchat-plus::family-plan-monthly': 'Snapchat+ Family Plan for the supported number of users according to Snapchat rules.',
  'x-premium::basic-monthly': 'X Basic gives limited premium features at the lowest paid tier.',
  'x-premium::premium-monthly': 'X Premium includes stronger creator, verification, and premium features than Basic.',
  'x-premium::premium-plus-monthly': 'X Premium+ is the highest X paid tier, including the strongest paid feature set where available.',
};

function applyPricingV2CatalogUpdates() {
  for (const [slug, update] of Object.entries(pricingV2CatalogUpdates)) {
    const product = catalog.find((item) => item.slug === slug);
    if (!product) continue;
    Object.assign(product, update);
  }

  for (const product of pricingV2NewProducts) {
    if (!catalog.some((item) => item.slug === product.slug)) catalog.push(product);
  }

  for (const product of catalog) {
    for (const variant of product.variants || []) {
      const key = `${product.slug}::${variant.slug}`;
      if (VARIANT_DESCRIPTION_OVERRIDES[key]) variant.description = VARIANT_DESCRIPTION_OVERRIDES[key];
      if (variant.checkout_mode === 'quote') {
        variant.deposit_tnd = QUOTE_DEPOSIT_TND;
        variant.description = SPECIAL_REQUEST_DESCRIPTION;
      }
    }
  }
}

applyPricingV2CatalogUpdates();

async function seedProductCatalog(pool) {
  const migrationKey = 'product_catalog_seed_v3';
  const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE key = $1', [migrationKey]);
  if (existing.rows[0]) return;

  await pool.query(`
    UPDATE products
    SET active = FALSE
    WHERE slug IN (
      'netflix-premium-1m',
      'chatgpt-plus-1m',
      'spotify-family-1m',
      'canva-pro-1m',
      'youtube-premium-1m',
      'adobe-cc-1m'
    )
  `);

  for (const product of catalog) {
    const result = await pool.query(
      `INSERT INTO products (slug, name, provider, category, description, price_tnd, badge, account_type, duration_label, delivery_hours, image_url, fulfillment_type, active)
       VALUES ($1,$2,$3,$4,$5,0.000,$6,$7,$8,$9,$10,$11,TRUE)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         provider = EXCLUDED.provider,
         category = EXCLUDED.category,
         description = EXCLUDED.description,
         price_tnd = 0.000,
         badge = EXCLUDED.badge,
         account_type = EXCLUDED.account_type,
         duration_label = EXCLUDED.duration_label,
         delivery_hours = EXCLUDED.delivery_hours,
         image_url = EXCLUDED.image_url,
         fulfillment_type = EXCLUDED.fulfillment_type,
         active = TRUE
       RETURNING id`,
      [
        product.slug,
        product.name,
        product.provider,
        product.category,
        product.description,
        product.badge || null,
        product.account_type || 'private',
        product.duration_label || 'Options',
        product.delivery_hours || 2,
        asset(product.image),
        product.fulfillment_type,
      ]
    );

    const productId = result.rows[0].id;
    for (const variant of product.variants || []) {
      await pool.query(
        `INSERT INTO product_variants (product_id, slug, name, description, billing_period, price_tnd, checkout_mode, deposit_tnd, sort_order, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
         ON CONFLICT (product_id, slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           billing_period = EXCLUDED.billing_period,
           price_tnd = EXCLUDED.price_tnd,
           checkout_mode = EXCLUDED.checkout_mode,
           deposit_tnd = EXCLUDED.deposit_tnd,
           sort_order = EXCLUDED.sort_order,
           active = TRUE`,
        [
          productId,
          variant.slug,
          variant.name,
          variant.description || null,
          variant.billing_period || null,
          variant.price_tnd ?? null,
          variant.checkout_mode || 'full_payment',
          variant.deposit_tnd ?? null,
          variant.sort_order || 100,
        ]
      );
    }
  }

  await pool.query('INSERT INTO schema_migrations (key) VALUES ($1)', [migrationKey]);
}

module.exports = { seedProductCatalog, catalog };

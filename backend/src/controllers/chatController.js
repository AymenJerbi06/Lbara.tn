const crypto = require('crypto');
const axios = require('axios');
const pool = require('../config/db');
const {
  badRequest,
  cleanString,
  cleanEnum,
  rejectUnexpectedFields,
  handleValidationError,
} = require('../utils/validation');

const SITE_KNOWLEDGE = `
Lbara.tn helps Tunisian customers buy digital services that are hard to access locally.
Customers choose a product, choose the exact variation, review the activation path, then check out and pay locally in TND.
Some services can be delivered through gift cards. Some can be gifted to the customer's existing account email. Some require assisted activation on an existing account, or a new account created with an email the customer controls.
For assisted activation, the customer must provide the account for the specific service being purchased, such as a Netflix account for Netflix.
Account-details questions are about which account email, password, two-factor approval, or temporary access may be needed.
Delivery questions are about what the customer receives after payment, where it arrives, and how long it usually takes.
For restricted streaming services like Disney+ or Paramount+, customers may need a reliable VPN even after activation.
Quote or special request products use a 1.500 TND request ticket. That ticket is not part of the final service price and is not refundable if the customer changes their mind.
Delivery is usually under two hours after payment, but special requests or account-sensitive services can require follow-up.
If a service is missing, customers should use the Contact page or the request-service button.
Customers can save favorites and turn on sale alerts from the shop or product page once they are logged in.
Never ask for passwords inside this chat. Direct customers to checkout/contact for account-specific instructions.
`;

const LANGUAGE_META = {
  en: {
    name: 'English',
    instruction: 'Always answer in English.',
  },
  fr: {
    name: 'French',
    instruction: 'Always answer in French. Use clear, natural French suitable for Tunisian customers.',
  },
  ar: {
    name: 'Arabic',
    instruction: 'Always answer in Arabic. Use clear Modern Standard Arabic that Tunisian customers can easily understand.',
  },
};

const CHAT_RESPONSE_FORMAT = {
  type: 'json_schema',
  name: 'lbara_chat_response',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      answer: {
        type: 'string',
      },
      ask_follow_up: {
        type: 'boolean',
      },
      follow_up_options: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: ['answer', 'ask_follow_up', 'follow_up_options'],
  },
};

function hasOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() && !/^your_|change_this/i.test(key.trim()));
}

function fallbackAnswer(message, language = 'en') {
  const text = message.toLowerCase();
  const fallbackAnswers = {
    en: {
      greeting: 'Hi. Tell me which service you are interested in or what you are trying to figure out, and I will guide you step by step.',
      account: 'Account details are only needed when the activation method you choose requires them. For example, assisted activation for Netflix means checkout asks for the Netflix account email/password and any notes needed to activate it. If the service can be gifted, we usually only need the email linked to that service account. Please do not paste passwords into this chat.',
      payment: 'You choose the service and variation first, then checkout shows the local payment amount in TND. The idea is that you pay locally instead of needing an international card.',
      delivery: 'After payment, the delivery path depends on the service. Some products are delivered as a code or gift card, some are gifted to your existing account email, and some require assisted activation on the exact service account you want to use. Gift-card redemption may require a VPN set to Canada and the Canadian service/store region. Most standard deliveries target under two hours, while special requests may need follow-up.',
      vpn: 'Some services are not officially available in Tunisia. For gift-card redemption, use a reliable VPN set to Canada and open the Canadian version or region of the service/store before redeeming. If the product page mentions VPN use after activation, expect to keep using one while watching or using the service.',
      request: 'Special request products use a 1.500 TND request ticket so Lbara.tn can review the exact service and contact you. That ticket is not part of the final price and is not refundable if you change your mind.',
      favorite: 'Create or log in to your account, then use the heart button to save services and the sale alert button to be notified when a product is discounted.',
      buy: 'To buy: open the Shop, choose a service, select the exact variation, read the activation notes, then continue to checkout. Checkout will ask for the delivery method and the account details only when that service needs them.',
      default: 'I can help with how Lbara.tn works, what to expect after payment, which account details may be needed, gift cards, VPN requirements, request tickets, favorites, and sale alerts. For a missing service, use the Contact page to request it.',
    },
    fr: {
      greeting: 'Bonjour. Dites-moi quel service vous intéresse ou ce que vous essayez de comprendre, et je vous guiderai étape par étape.',
      account: 'Les details du compte sont demandes seulement lorsque la methode d activation choisie en a besoin. Par exemple, pour une activation assistee Netflix, le paiement demandera l email et le mot de passe du compte Netflix, ainsi que les notes utiles. Si le service peut etre offert, l email lie au compte suffit souvent. Ne mettez jamais vos mots de passe dans le chat.',
      payment: 'Vous choisissez d’abord le service et la variation, puis le checkout affiche le montant à payer localement en TND. Le but est de payer avec des moyens tunisiens sans carte internationale.',
      delivery: 'Après le paiement, la livraison dépend du service. Certains produits sont livrés sous forme de code ou carte cadeau, certains sont offerts à l’e-mail de votre compte existant, et certains demandent une activation assistée sur le compte exact que vous voulez utiliser. Les livraisons standards visent moins de deux heures, tandis que les demandes spéciales peuvent nécessiter un suivi.',
      vpn: 'Certains services ne sont pas officiellement disponibles en Tunisie. Si la page produit mentionne un VPN, prévoyez d’en utiliser un même après l’activation. Des bundles avec NordVPN peuvent être proposés quand cela facilite l’utilisation.',
      request: 'Les produits sur demande spéciale utilisent un ticket de 1.500 TND pour que Lbara.tn vérifie le service exact et vous contacte. Ce ticket ne fait pas partie du prix final et n’est pas remboursable si vous changez d’avis.',
      favorite: 'Créez un compte ou connectez-vous, puis utilisez le bouton cœur pour sauvegarder vos services et le bouton d’alerte pour être prévenu en cas de réduction.',
      buy: 'Pour acheter : ouvrez la boutique, choisissez un service, sélectionnez la variation exacte, lisez les notes d’activation, puis continuez vers le checkout. Le checkout demandera la méthode de livraison et les détails du compte seulement si le service en a besoin.',
      default: 'Je peux vous aider à comprendre comment Lbara.tn fonctionne, quoi attendre après le paiement, quels détails de compte peuvent être nécessaires, les cartes cadeaux, les VPN, les tickets de demande, les favoris et les alertes promo. Pour un service manquant, utilisez la page Contact.',
    },
    ar: {
      greeting: 'مرحباً. أخبرني بالخدمة التي تهمك أو بما تحاول فهمه، وسأرشدك خطوة بخطوة.',
      account: 'تفاصيل الحساب لا نطلبها إلا إذا كانت طريقة التفعيل المختارة تحتاجها. مثلا إذا اخترت التفعيل بمساعدتنا لخدمة Netflix، ستطلب صفحة الدفع بريد حساب Netflix وكلمة المرور وأي ملاحظات لازمة. إذا كانت الخدمة قابلة للإهداء، غالبا نحتاج فقط البريد المرتبط بحساب الخدمة. لا تكتب كلمات المرور داخل الدردشة.',
      payment: 'تختار الخدمة والنسخة المناسبة أولاً، ثم تظهر لك صفحة الدفع المبلغ بالدينار التونسي. الفكرة هي أن تدفع محلياً بدون الحاجة إلى بطاقة دولية.',
      delivery: 'بعد الدفع، طريقة التسليم تختلف حسب الخدمة. بعض المنتجات تُسلّم ككود أو بطاقة هدية، وبعضها يُهدى إلى بريد حسابك الحالي، وبعضها يحتاج تفعيل بمساعدة الفريق على الحساب المحدد الذي تريد استعماله. أغلب التسليمات العادية تستهدف أقل من ساعتين، أما الطلبات الخاصة فقد تحتاج متابعة.',
      vpn: 'بعض الخدمات غير متاحة رسمياً في تونس. إذا كانت صفحة المنتج تذكر VPN، فتوقع أنك ستحتاج إليه حتى بعد تفعيل الاشتراك. يمكن توفير عروض مع NordVPN عندما يساعد ذلك على استعمال الخدمة.',
      request: 'المنتجات ذات الطلب الخاص تستعمل تذكرة طلب بقيمة 1.500 د.ت حتى يتمكن Lbara.tn من مراجعة الخدمة والتواصل معك. هذه التذكرة ليست جزءاً من السعر النهائي ولا تُسترجع إذا غيرت رأيك.',
      favorite: 'أنشئ حساباً أو سجّل الدخول، ثم استعمل زر القلب لحفظ الخدمات وزر تنبيه التخفيض ليصلك إشعار عند وجود خصم.',
      buy: 'للشراء: افتح المتجر، اختر الخدمة، حدد النسخة المناسبة، اقرأ ملاحظات التفعيل، ثم تابع إلى صفحة الدفع. صفحة الدفع ستطلب طريقة التسليم وتفاصيل الحساب فقط عندما تحتاجها تلك الخدمة.',
      default: 'أستطيع مساعدتك في فهم طريقة عمل Lbara.tn، ماذا يحدث بعد الدفع، ما تفاصيل الحساب التي قد تكون مطلوبة، بطاقات الهدايا، متطلبات VPN، تذاكر الطلب، المفضلة وتنبيهات التخفيض. إذا لم تجد خدمة معينة، استعمل صفحة التواصل لطلبها.',
    },
  };
  const answers = fallbackAnswers[language] || fallbackAnswers.en;

  if (/^(hi|hello|hey|salut|bonjour|bonsoir|مرحبا|مرحباً|اهلا|أهلا|السلام عليكم)[!.?\s]*$/i.test(text)) {
    return answers.greeting;
  }

  if (/(account details|provide my account|service account|my account|login|password|credentials|email linked|compte|identifiants|mot de passe|email du compte|حساب|حسابي|الحساب|كلمة المرور|كلمة السر|بيانات الحساب|معلومات الحساب)/i.test(text)) {
    return answers.account;
  }

  if (/(pay|payment|card|d17|flouci|bank|tnd|dinar|payer|paiement|carte|banque|دينار|الدفع|دفع|بطاقة|بنك)/i.test(text)) {
    return answers.payment;
  }

  if (/(receive|delivery|how long|time|activate|activation|code|account|recevoir|livraison|activation|compte|code|تسليم|استلام|تفعيل|حساب|كود|رمز|وقت)/i.test(text)) {
    return answers.delivery;
  }

  if (/(vpn|tunisia|disney|paramount|region|available|tunisie|région|disponible|تونس|متاح|منطقة|ديزني)/i.test(text)) {
    return answers.vpn;
  }

  if (/(refund|ticket|quote|special|request|coursera|certificate|remboursement|devis|demande|certificat|استرجاع|تذكرة|طلب|شهادة|خاص)/i.test(text)) {
    return answers.request;
  }

  if (/(favorite|wishlist|save|sale|discount|notify|favori|sauvegarder|promo|réduction|تنبيه|تخفيض|مفضلة|حفظ|خصم)/i.test(text)) {
    return answers.favorite;
  }

  if (/(buy|order|checkout|steps|how|acheter|commande|étapes|comment|شراء|أشتري|كيف|طلب|خطوات)/i.test(text)) {
    return answers.buy;
  }

  return answers.default;
}

const DETAIL_PROMPTS = {
  en: [
    'Netflix delivery',
    'ChatGPT account activation',
    'Special request pricing',
  ],
  fr: [
    'Livraison Netflix',
    'Activation du compte ChatGPT',
    'Prix des demandes speciales',
  ],
  ar: [
    'تسليم نتفليكس',
    'تفعيل حساب ChatGPT',
    'تسعير الطلبات الخاصة',
  ],
};

const CHAT_CATALOG_ALIASES = [
  { pattern: /يوتيوب\s*بريميوم|youtube\s*premium/iu, terms: ['youtube', 'premium'] },
  { pattern: /نتفليكس|netflix/iu, terms: ['netflix'] },
  { pattern: /سبوتيفاي|spotify/iu, terms: ['spotify'] },
  { pattern: /شات\s*جي\s*بي\s*تي|شات\s*gpt|chatgpt|chat\s*gpt/iu, terms: ['chatgpt'] },
  { pattern: /كلود|claude/iu, terms: ['claude'] },
  { pattern: /ديزني\s*\+?|disney/iu, terms: ['disney'] },
  { pattern: /باراماونت|paramount/iu, terms: ['paramount'] },
  { pattern: /كورسيرا|coursera/iu, terms: ['coursera'] },
  { pattern: /كانفا|canva/iu, terms: ['canva'] },
  { pattern: /نورد\s*vpn|نورد\s*في\s*بي\s*ان|nordvpn|nord\s*vpn/iu, terms: ['nordvpn'] },
  { pattern: /بلايستيشن|playstation|ps4|ps5/iu, terms: ['playstation'] },
  { pattern: /اكس\s*بوكس|إكس\s*بوكس|xbox/iu, terms: ['xbox'] },
  { pattern: /مايكروسوفت\s*365|microsoft\s*365/iu, terms: ['microsoft', '365'] },
  { pattern: /ابل\s*ون|آبل\s*ون|apple\s*one/iu, terms: ['apple', 'one'] },
];

function detailPromptsFor(language = 'en') {
  return DETAIL_PROMPTS[language] || DETAIL_PROMPTS.en;
}

function cleanChatHistory(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw badRequest('Chat history must be a list.');
  }
  return value.slice(-8).map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw badRequest('Chat history contains an invalid message.');
    }
    return {
      role: cleanEnum(entry.role, ['user', 'assistant'], {
        label: 'History role',
        required: true,
      }),
      content: cleanString(entry.content, {
        label: 'History message',
        required: true,
        min: 1,
        max: 700,
      }),
    };
  });
}

function cleanPageContext(value) {
  return cleanString(value, {
    label: 'Page context',
    required: false,
    max: 500,
  }) || '';
}

const SERVICE_CHAT_HINT_RE = /(netflix|spotify|chatgpt|openai|claude|youtube|coursera|disney|paramount|xbox|playstation|ps4|ps5|microsoft|canva|nordvpn|itunes|google\s*play|apple|نتفليكس|سبوتيفاي|شات|يوتيوب|كورsera|ديزني|اكس\s*بوكس|بلايستيشن|كلود|كانفا|آبل)/i;
const TOPIC_CHAT_HINT_RE = /(gift\s*card|request\s*ticket|certificate|checkout|payment|price|delivery|activation|account|favorite|wishlist|discount|sale|vpn|بطاقة|هدية|تذكرة|شهادة|حساب|سعر|دفع|تسليم|تفعيل|تخفيض|livraison|paiement|compte|prix|activation|réduction|reduction|favori|promo)/i;

function needsMoreDetails(message, history = []) {
  const text = String(message || '').trim();
  if (!text) return false;
  if (SERVICE_CHAT_HINT_RE.test(text)) return false;
  if (history.some((item) => item.role === 'user' && SERVICE_CHAT_HINT_RE.test(item.content))) {
    return false;
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (TOPIC_CHAT_HINT_RE.test(text) && wordCount <= 10) return true;
  if (wordCount <= 6) return true;
  return /^(help|support|delivery|account details|account|payment|price|buy|how|how does it work|contact|aide|support|livraison|compte|paiement|prix|acheter|comment|مساعدة|الدعم|تسليم|حساب|دفع|سعر|شراء|كيف)$/i.test(text);
}

function clarifyingLine(language) {
  const lines = {
    en: 'To make this more accurate, tell me the service name and whether you already have an account for it.',
    fr: 'Pour être plus précis, dites-moi le nom du service et si vous avez déjà un compte pour ce service.',
    ar: 'لكي أعطيك إجابة أدق، أخبرني باسم الخدمة وهل لديك حساب فيها من قبل.',
  };
  return lines[language] || lines.en;
}

function fallbackPayload(message, language, history = [], catalogProducts = []) {
  const productReply = buildCatalogFallbackReply(message, language, catalogProducts);
  if (productReply) return productReply;

  const needsDetails = needsMoreDetails(message, history);
  const baseAnswer = fallbackAnswer(message, language);
  return {
    answer: needsDetails ? `${baseAnswer}\n\n${clarifyingLine(language)}` : baseAnswer,
    needs_details: needsDetails,
    detail_prompts: needsDetails ? detailPromptsFor(language) : [],
  };
}

function formatHistoryForModel(history) {
  if (!history.length) return 'No previous messages.';
  return history
    .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'Customer'}: ${item.content}`)
    .join('\n');
}

function trimForPrompt(value, max = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '...';
}

function collectCatalogTerms(message, pageContext) {
  const text = `${message || ''} ${pageContext || ''}`
    .replace(/[^\p{L}\p{N}+._-]+/gu, ' ')
    .trim();
  if (!text) return [];
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'for', 'with', 'from', 'what', 'when', 'where', 'which', 'that', 'this', 'about', 'your',
    'how', 'does', 'do', 'will', 'can', 'could', 'should', 'would', 'need', 'needs', 'needed', 'i', 'is', 'are', 'it',
    'page', 'path', 'product', 'shop', 'service', 'services', 'account',
    'delivery', 'deliver', 'delivered', 'receive', 'received', 'activation', 'price', 'pricing', 'buy', 'purchase',
    'une', 'des', 'les', 'pour', 'avec', 'dans', 'quoi', 'quel', 'quelle', 'comment', 'page', 'produit',
    'service', 'services', 'compte', 'livraison', 'activation', 'prix',
  ]);
  return [...new Set(text
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !stopWords.has(term.toLowerCase()))
    .slice(0, 10))];
}

function collectAliasCatalogTerms(message) {
  const text = String(message || '');
  const aliases = CHAT_CATALOG_ALIASES
    .filter((alias) => alias.pattern.test(text))
    .flatMap((alias) => alias.terms);
  return [...new Set(aliases)];
}

function formatVariantForPrompt(variant) {
  const price = variant.price_tnd === null || variant.price_tnd === undefined
    ? 'price TBD'
    : `${Number(variant.price_tnd).toFixed(3)} TND`;
  const billing = variant.billing_period ? `, ${variant.billing_period}` : '';
  const checkout = variant.checkout_mode ? `, checkout ${variant.checkout_mode}` : '';
  const deposit = variant.deposit_tnd === null || variant.deposit_tnd === undefined
    ? ''
    : `, deposit ${Number(variant.deposit_tnd).toFixed(3)} TND`;
  const description = trimForPrompt(variant.description, 120);
  return `${variant.name} (${price}${billing}${checkout}${deposit})${description ? ` - ${description}` : ''}`;
}

function formatCatalogContext(products) {
  if (!products.length) return 'No matching product rows were found for this message.';
  return products.map((product) => {
    const variants = Array.isArray(product.variants) ? product.variants.slice(0, 6) : [];
    return [
      `Product: ${product.name} by ${product.provider || 'Lbara.tn'} [${product.category || 'uncategorized'}]`,
      `Description: ${trimForPrompt(product.description, 200) || 'No description available.'}`,
      `Fulfillment: ${product.fulfillment_type || 'not specified'}; account type: ${product.account_type || 'not specified'}; delivery target: ${product.delivery_hours || 'not specified'} hours.`,
      `Variants: ${variants.length ? variants.map(formatVariantForPrompt).join(' | ') : 'No listed variations.'}`,
    ].join('\n');
  }).join('\n\n');
}

function normalizeCatalogText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function rankCatalogProducts(products, message) {
  const query = normalizeCatalogText(message);
  const queryTerms = query.split(/\s+/).filter(Boolean);
  return [...products].sort((left, right) => {
    const score = (product) => {
      const name = normalizeCatalogText(product.name);
      const provider = normalizeCatalogText(product.provider);
      const slug = normalizeCatalogText(product.slug);
      const combined = `${name} ${provider} ${slug}`;
      let value = 0;
      if (name && query.includes(name)) value += 12;
      if (slug && query.includes(slug.replace(/\s+/g, ' '))) value += 10;
      if (provider && query.includes(provider)) value += 4;
      queryTerms.forEach((term) => {
        if (combined.includes(term)) value += 2;
      });
      return value;
    };
    return score(right) - score(left);
  });
}

async function loadCatalogMatches(message, pageContext) {
  const aliasTerms = collectAliasCatalogTerms(message);
  const messageTerms = aliasTerms.length ? aliasTerms : collectCatalogTerms(message, '');
  const terms = messageTerms.length ? messageTerms : collectCatalogTerms('', pageContext);
  if (!terms.length) return [];

  const params = [];
  const termConditions = terms.map((term) => {
    params.push(`%${term}%`);
    const index = params.length;
    return `(
      p.name ILIKE $${index}
      OR p.provider ILIKE $${index}
      OR p.description ILIKE $${index}
      OR p.category ILIKE $${index}
      OR EXISTS (
        SELECT 1
        FROM product_variants search_variants
        WHERE search_variants.product_id = p.id
          AND search_variants.active = TRUE
          AND (
            search_variants.name ILIKE $${index}
            OR search_variants.description ILIKE $${index}
          )
      )
    )`;
  });

  try {
    const result = await pool.query(
      `SELECT
         p.slug,
         p.name,
         p.provider,
         p.category,
         p.description,
         p.fulfillment_type,
         p.account_type,
         p.delivery_hours,
         COALESCE(
           json_agg(
             json_build_object(
               'name', v.name,
               'description', v.description,
               'billing_period', v.billing_period,
               'price_tnd', v.price_tnd,
               'checkout_mode', v.checkout_mode,
               'deposit_tnd', v.deposit_tnd
             )
             ORDER BY v.sort_order, v.name
           ) FILTER (WHERE v.id IS NOT NULL),
           '[]'::json
         ) AS variants
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
       WHERE p.active = TRUE
         AND ${termConditions.join('\n         AND ')}
       GROUP BY p.id
       ORDER BY p.name ASC
       LIMIT 6`,
      params
    );
    return rankCatalogProducts(result.rows, message);
  } catch (err) {
    console.warn('[chat/catalog-context]', err.message);
    return [];
  }
}

function listVariants(product) {
  return Array.isArray(product?.variants) ? product.variants.filter(Boolean) : [];
}

function formatTndAmount(value, language = 'en') {
  if (value === null || value === undefined || value === '') {
    return language === 'ar' ? 'السعر يحدد لاحقا' : language === 'fr' ? 'prix a confirmer' : 'price to be confirmed';
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return language === 'ar' ? 'السعر يحدد لاحقا' : language === 'fr' ? 'prix a confirmer' : 'price to be confirmed';
  }
  const formatted = amount.toFixed(3);
  if (language === 'ar') return `${formatted} دينار`;
  if (language === 'fr') return `${formatted} Dinar`;
  return `${formatted} TND`;
}

function formatVariantList(product, language = 'en', limit = 4) {
  const variants = listVariants(product).slice(0, limit);
  if (!variants.length) return '';
  return variants
    .map((variant) => `${variant.name} (${formatTndAmount(variant.price_tnd, language)})`)
    .join(language === 'ar' ? '، ' : ', ');
}

function lowestVariantPrice(product, language = 'en') {
  const prices = listVariants(product)
    .map((variant) => Number(variant.price_tnd))
    .filter((value) => Number.isFinite(value));
  if (!prices.length) return null;
  return formatTndAmount(Math.min(...prices), language);
}

function productDeliveryText(product, language = 'en') {
  const hours = Number(product?.delivery_hours);
  const timeText = Number.isFinite(hours) && hours > 0
    ? (language === 'ar' ? `خلال نحو ${hours} ساعة` : language === 'fr' ? `environ ${hours} h` : `about ${hours} hours`)
    : (language === 'ar' ? 'بعد الدفع بحسب طريقة التفعيل' : language === 'fr' ? 'apres paiement selon la methode d activation' : 'after payment according to the activation path');
  const fulfillment = String(product?.fulfillment_type || '').toLowerCase();

  if (language === 'ar') {
    if (fulfillment === 'gift_card') return `عادة ما يجهز هذا المنتج عبر مسار بطاقة هدية او كود، مع استهداف التسليم ${timeText}. صفحة الدفع توضح الخطوة الدقيقة قبل تاكيد الطلب.`;
    if (fulfillment === 'gifted_subscription') return `غالبا يتم ارسال الاشتراك الى البريد المرتبط بالحساب المناسب، مع استهداف التسليم ${timeText}.`;
    return `طريقة التسليم تعتمد على مسار التفعيل الخاص بهذا المنتج، مع استهداف التسليم ${timeText}.`;
  }

  if (language === 'fr') {
    if (fulfillment === 'gift_card') return `Ce produit passe generalement par une carte cadeau ou un code, avec une livraison visee ${timeText}. Pour une carte cadeau, utilisez un VPN fiable regle sur le Canada et la version ou region canadienne du service/boutique avant redemption. Le checkout precise l etape exacte avant validation.`;
    if (fulfillment === 'gifted_subscription') return `L abonnement est generalement envoye vers l email lie au bon compte, avec une livraison visee ${timeText}.`;
    return `La livraison depend du parcours d activation de ce produit, avec une livraison visee ${timeText}.`;
  }

  if (fulfillment === 'gift_card') return `This product is usually handled through a gift-card or code path, with delivery targeted in ${timeText}. For gift-card redemption, use a reliable VPN set to Canada and the Canadian service/store region before redeeming. Checkout shows the exact step before you confirm.`;
  if (fulfillment === 'gifted_subscription') return `This subscription is usually sent to the email linked to the correct account, with delivery targeted in ${timeText}.`;
  return `Delivery depends on this product's activation path, with delivery targeted in ${timeText}.`;
}

function productAccountText(product, language = 'en') {
  const serviceName = product?.name || (language === 'ar' ? 'هذه الخدمة' : language === 'fr' ? 'ce service' : 'this service');
  if (language === 'ar') {
    return `اذا اخترت التفعيل بمساعدتنا، فستحتاج الى تقديم حساب ${serviceName} نفسه داخل خطوات الدفع او التعليمات اللاحقة، وليس داخل الدردشة. اذا كانت هناك طريقة لا تحتاج بيانات الحساب، ستظهر لك ايضا حسب النسخة المختارة.`;
  }
  if (language === 'fr') {
    return `Si vous choisissez l activation assistee, il faudra fournir le compte ${serviceName} concerne pendant le checkout ou les instructions qui suivent, pas dans ce chat. Si une option sans partage de compte existe, elle apparaitra aussi selon la variation choisie.`;
  }
  return `If you choose assisted activation, checkout will ask for the actual ${serviceName} account details needed for that path, not inside this chat. If a no-account-sharing option exists for the chosen variation, it will appear there too.`;
}

function productComparisonText(product, language = 'en') {
  const variants = listVariants(product);
  const summary = variants.slice(0, 4).map((variant) => {
    const description = trimForPrompt(variant.description, 90);
    const details = description ? ` - ${description}` : '';
    return `${variant.name}: ${formatTndAmount(variant.price_tnd, language)}${details}`;
  }).join(language === 'ar' ? '\n' : '\n');

  if (language === 'ar') {
    return `${product.name} لديه ${variants.length} خيارات حاليا:\n${summary}\n\nاذا اردت، استطيع مساعدتك على اختيار النسخة المناسبة حسب ما يهمك اكثر: اقل سعر، مزايا اكثر، او مدة اطول.`;
  }
  if (language === 'fr') {
    return `${product.name} propose actuellement ${variants.length} options :\n${summary}\n\nJe peux aussi vous aider a choisir selon votre priorite : le prix le plus bas, plus de fonctionnalites, ou une duree plus longue.`;
  }
  return `${product.name} currently has ${variants.length} options:\n${summary}\n\nI can also help you choose based on what matters most: the lowest price, the fuller feature set, or a longer billing period.`;
}

function catalogPrompts(product, language = 'en', kind = 'overview') {
  const name = product?.name || (language === 'ar' ? 'الخدمة' : language === 'fr' ? 'le service' : 'the service');
  if (language === 'ar') {
    if (kind === 'delivery') return [`قارن خيارات ${name}`, `هل احتاج حسابا ل ${name}؟`, `ما النسخة المناسبة لي؟`];
    if (kind === 'account') return [`كيف يتم تسليم ${name}؟`, `قارن الخيارات`, `ما النسخة المناسبة لي؟`];
    if (kind === 'compare') return [`اي نسخة اقل سعرا؟`, `كيف يتم التسليم؟`, `هل احتاج حسابا؟`];
    return [`قارن خيارات ${name}`, `كيف يتم تسليم ${name}؟`, `هل احتاج حسابا ل ${name}؟`];
  }
  if (language === 'fr') {
    if (kind === 'delivery') return [`Comparer les options ${name}`, `Ai-je besoin d un compte ${name} ?`, `Quelle version me convient ?`];
    if (kind === 'account') return [`Comment ${name} est livre ?`, 'Comparer les options', `Quelle version me convient ?`];
    if (kind === 'compare') return ['Quelle option coute le moins ?', 'Comment est-ce livre ?', 'Ai-je besoin d un compte ?'];
    return [`Comparer les options ${name}`, `Comment ${name} est livre ?`, `Ai-je besoin d un compte ${name} ?`];
  }
  if (kind === 'delivery') return [`Compare ${name} options`, `Do I need a ${name} account?`, 'Which version fits me?'];
  if (kind === 'account') return [`How is ${name} delivered?`, 'Compare the options', 'Which version fits me?'];
  if (kind === 'compare') return ['Which option is cheapest?', 'How is it delivered?', 'Do I need an account?'];
  return [`Compare ${name} options`, `How is ${name} delivered?`, `Do I need a ${name} account?`];
}

function asksForComparison(text) {
  return /(compare|difference|which option|which plan|best option|cheapest|variants?|plans?|lite|family|annual|monthly|compar|diff[eé]rence|quelle option|moins cher|plans?|options?|قارن|الفرق|اي نسخة|أي نسخة|ارخص|أرخص|خيارات)/i.test(text);
}

function asksForDelivery(text) {
  return /(deliver|delivery|receive|arrive|how long|time|code|gift card|livraison|livr[eé]|recevoir|delai|d[eé]lai|carte cadeau|رمز|كود|بطاقة هدية|تسليم|استلام|متى)/i.test(text);
}

function asksForAccount(text) {
  return /(account|email|password|credentials|login|sign in|compte|email|mot de passe|identifiants|حساب|بريد|كلمة المرور|بيانات الدخول)/i.test(text);
}

function asksForPrice(text) {
  return /(price|cost|how much|tnd|dinar|prix|combien|cout|co[uû]t|دينار|السعر|سعر|بكم|كم السعر)/i.test(text);
}

function buildCatalogFallbackReply(message, language = 'en', catalogProducts = []) {
  if (!catalogProducts.length) return null;
  const product = catalogProducts[0];
  const variants = listVariants(product);
  const text = String(message || '');
  const variantList = formatVariantList(product, language);
  const lowestPrice = lowestVariantPrice(product, language);

  if (asksForComparison(text) && variants.length) {
    return {
      answer: productComparisonText(product, language),
      needs_details: true,
      detail_prompts: catalogPrompts(product, language, 'compare'),
    };
  }

  if (asksForDelivery(text)) {
    const answer = language === 'ar'
      ? `${product.name} متاح. ${productDeliveryText(product, language)}`
      : language === 'fr'
        ? `${product.name} est disponible. ${productDeliveryText(product, language)}`
        : `${product.name} is available. ${productDeliveryText(product, language)}`;
    return {
      answer,
      needs_details: true,
      detail_prompts: catalogPrompts(product, language, 'delivery'),
    };
  }

  if (asksForAccount(text)) {
    const answer = language === 'ar'
      ? `${product.name} متاح. ${productAccountText(product, language)}`
      : language === 'fr'
        ? `${product.name} est disponible. ${productAccountText(product, language)}`
        : `${product.name} is available. ${productAccountText(product, language)}`;
    return {
      answer,
      needs_details: true,
      detail_prompts: catalogPrompts(product, language, 'account'),
    };
  }

  if (asksForPrice(text)) {
    let answer;
    if (language === 'ar') {
      answer = lowestPrice
        ? `${product.name} متاح، وتبدا الخيارات حاليا من ${lowestPrice}. ${variantList ? `الخيارات الظاهرة هي: ${variantList}.` : ''}`
        : `${product.name} متاح، لكن السعر يعتمد على النسخة المختارة او على مراجعة الطلب.`;
    } else if (language === 'fr') {
      answer = lowestPrice
        ? `${product.name} est disponible, avec des options qui commencent actuellement a ${lowestPrice}. ${variantList ? `Les options visibles sont : ${variantList}.` : ''}`
        : `${product.name} est disponible, mais le prix depend de la variation choisie ou d une verification manuelle.`;
    } else {
      answer = lowestPrice
        ? `${product.name} is available, with options currently starting at ${lowestPrice}. ${variantList ? `The visible options are: ${variantList}.` : ''}`
        : `${product.name} is available, but the price depends on the selected variation or a manual quote flow.`;
    }
    return {
      answer,
      needs_details: true,
      detail_prompts: catalogPrompts(product, language, 'compare'),
    };
  }

  let answer;
  if (language === 'ar') {
    answer = `${product.name} متاح على Lbara.tn.${variantList ? ` لدي حاليا هذه الخيارات: ${variantList}.` : ''} اخبرني ان كنت تريد مقارنة النسخ او معرفة طريقة التسليم او ما اذا كنت ستحتاج الى حساب لهذا المنتج.`;
  } else if (language === 'fr') {
    answer = `${product.name} est disponible sur Lbara.tn.${variantList ? ` Je vois actuellement ces options : ${variantList}.` : ''} Dites-moi si vous voulez comparer les versions, connaitre la livraison, ou savoir si un compte est necessaire.`;
  } else {
    answer = `${product.name} is available on Lbara.tn.${variantList ? ` I can currently see these options: ${variantList}.` : ''} Tell me if you want to compare the versions, understand delivery, or know whether an account is needed.`;
  }

  return {
    answer,
    needs_details: true,
    detail_prompts: catalogPrompts(product, language, 'overview'),
  };
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text);
      if (typeof content.output_text === 'string') chunks.push(content.output_text);
    }
  }
  return chunks.join('\n').trim();
}

function normalizeFollowUpOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => String(option || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function extractStructuredChatReply(data, fallback) {
  const text = extractResponseText(data);
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    const answer = cleanString(parsed.answer, {
      label: 'Assistant answer',
      required: true,
      min: 1,
      max: 2400,
    });
    return {
      answer,
      ask_follow_up: Boolean(parsed.ask_follow_up),
      follow_up_options: normalizeFollowUpOptions(parsed.follow_up_options),
    };
  } catch {
    return {
      answer: text.slice(0, 2400),
      ask_follow_up: false,
      follow_up_options: [],
    };
  }
}

async function message(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['message', 'language', 'history', 'page_context'], 'Chat message');
    const userMessage = cleanString(req.body.message, {
      label: 'Message',
      required: true,
      min: 2,
      max: 800,
    });
    const language = cleanEnum(req.body.language || 'en', ['en', 'fr', 'ar'], {
      label: 'Language',
      required: false,
    }) || 'en';
    const history = cleanChatHistory(req.body.history);
    const pageContext = cleanPageContext(req.body.page_context);
    const languageMeta = LANGUAGE_META[language] || LANGUAGE_META.en;
    const detailHint = needsMoreDetails(userMessage, history);
    const catalogProducts = await loadCatalogMatches(userMessage, pageContext);

    if (!hasOpenAiKey()) {
      const fallback = fallbackPayload(userMessage, language, history, catalogProducts);
      return res.json({
        success: true,
        powered_by_ai: false,
        ...fallback,
      });
    }

    try {
      const safetyIdentifier = crypto
        .createHash('sha256')
        .update(String(req.user?.id || req.ip || 'guest'))
        .digest('hex')
        .slice(0, 32);
      const catalogContext = formatCatalogContext(catalogProducts);
      const fallback = fallbackPayload(userMessage, language, history, catalogProducts);

      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          instructions: [
            'You are the Lbara.tn website assistant.',
            'Answer clearly, warmly, and briefly.',
            languageMeta.instruction,
            'Use only the provided Lbara.tn context.',
            'Use the conversation history and page context when they help.',
            'Use the live catalog context when the customer asks about a product, variation, price, or delivery expectation.',
            'Do not invent prices, guarantees, or policies.',
            'Do not ask users to paste passwords or sensitive account credentials into chat.',
            'If account details are needed, tell them checkout/contact will collect instructions securely.',
            'If the user asks about account details, explain what account access or email may be needed and when.',
            'If the user asks about delivery, explain what they receive after payment, where it arrives, and timing.',
            'If the latest question is broad or missing information needed for a reliable answer, ask one useful clarifying question instead of giving a generic wall of text.',
            'When a follow-up would help, set ask_follow_up to true and provide 1 to 3 short clickable follow_up_options that a customer might choose next.',
            'When a direct answer is sufficient, set ask_follow_up to false and return an empty follow_up_options array.',
            'The answer should feel conversational and specific, not like a canned FAQ.',
            SITE_KNOWLEDGE,
          ].join('\n'),
          input: [
            `Current page context: ${pageContext || 'Unknown page.'}`,
            'Conversation so far:',
            formatHistoryForModel(history),
            'Relevant live catalog context:',
            catalogContext,
            `Latest customer message: ${userMessage}`,
          ].join('\n\n'),
          text: {
            format: CHAT_RESPONSE_FORMAT,
          },
          max_output_tokens: 360,
          temperature: 0.3,
          store: false,
          safety_identifier: safetyIdentifier,
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const reply = extractStructuredChatReply(response.data, {
        answer: fallback.answer,
        ask_follow_up: fallback.needs_details,
        follow_up_options: fallback.detail_prompts,
      });
      const followUpOptions = normalizeFollowUpOptions(reply.follow_up_options);
      return res.json({
        success: true,
        powered_by_ai: true,
        answer: reply.answer,
        needs_details: Boolean(reply.ask_follow_up) || detailHint,
        detail_prompts: followUpOptions.length
          ? followUpOptions
          : (detailHint ? detailPromptsFor(language) : []),
      });
    } catch (apiErr) {
      console.warn('[chat/openai]', apiErr.response?.data?.error?.message || apiErr.message);
      const fallback = fallbackPayload(userMessage, language, history, catalogProducts);
      return res.json({
        success: true,
        powered_by_ai: false,
        ...fallback,
      });
    }
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[chat/message]', err);
    res.status(500).json({ success: false, message: 'Chat is unavailable right now.' });
  }
}

module.exports = { message };

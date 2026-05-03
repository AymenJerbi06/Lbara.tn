const crypto = require('crypto');
const axios = require('axios');
const {
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

function hasOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() && !/^your_|change_this/i.test(key.trim()));
}

function fallbackAnswer(message, language = 'en') {
  const text = message.toLowerCase();
  const fallbackAnswers = {
    en: {
      payment: 'You choose the service and variation first, then checkout shows the local payment amount in TND. The idea is that you pay locally instead of needing an international card.',
      delivery: 'After payment, the delivery path depends on the service. Some products are delivered as a code or gift card, some are gifted to your existing account email, and some require assisted activation on the exact service account you want to use. Most standard deliveries target under two hours, while special requests may need follow-up.',
      vpn: 'Some services are not officially available in Tunisia. If the product page mentions a VPN, you should expect to use one even after the subscription is activated. Bundles can include NordVPN when that makes the service easier to use.',
      request: 'Special request products use a 1.500 TND request ticket so Lbara.tn can review the exact service and contact you. That ticket is not part of the final price and is not refundable if you change your mind.',
      favorite: 'Create or log in to your account, then use the heart button to save services and the sale alert button to be notified when a product is discounted.',
      buy: 'To buy: open the Shop, choose a service, select the exact variation, read the activation notes, then continue to checkout. Checkout will ask for the delivery method and the account details only when that service needs them.',
      default: 'I can help with how Lbara.tn works, what to expect after payment, which account details may be needed, gift cards, VPN requirements, request tickets, favorites, and sale alerts. For a missing service, use the Contact page to request it.',
    },
    fr: {
      payment: 'Vous choisissez d’abord le service et la variation, puis le checkout affiche le montant à payer localement en TND. Le but est de payer avec des moyens tunisiens sans carte internationale.',
      delivery: 'Après le paiement, la livraison dépend du service. Certains produits sont livrés sous forme de code ou carte cadeau, certains sont offerts à l’e-mail de votre compte existant, et certains demandent une activation assistée sur le compte exact que vous voulez utiliser. Les livraisons standards visent moins de deux heures, tandis que les demandes spéciales peuvent nécessiter un suivi.',
      vpn: 'Certains services ne sont pas officiellement disponibles en Tunisie. Si la page produit mentionne un VPN, prévoyez d’en utiliser un même après l’activation. Des bundles avec NordVPN peuvent être proposés quand cela facilite l’utilisation.',
      request: 'Les produits sur demande spéciale utilisent un ticket de 1.500 TND pour que Lbara.tn vérifie le service exact et vous contacte. Ce ticket ne fait pas partie du prix final et n’est pas remboursable si vous changez d’avis.',
      favorite: 'Créez un compte ou connectez-vous, puis utilisez le bouton cœur pour sauvegarder vos services et le bouton d’alerte pour être prévenu en cas de réduction.',
      buy: 'Pour acheter : ouvrez la boutique, choisissez un service, sélectionnez la variation exacte, lisez les notes d’activation, puis continuez vers le checkout. Le checkout demandera la méthode de livraison et les détails du compte seulement si le service en a besoin.',
      default: 'Je peux vous aider à comprendre comment Lbara.tn fonctionne, quoi attendre après le paiement, quels détails de compte peuvent être nécessaires, les cartes cadeaux, les VPN, les tickets de demande, les favoris et les alertes promo. Pour un service manquant, utilisez la page Contact.',
    },
    ar: {
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

async function message(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['message', 'language'], 'Chat message');
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
    const languageMeta = LANGUAGE_META[language] || LANGUAGE_META.en;

    if (!hasOpenAiKey()) {
      return res.json({
        success: true,
        powered_by_ai: false,
        answer: fallbackAnswer(userMessage, language),
      });
    }

    try {
      const safetyIdentifier = crypto
        .createHash('sha256')
        .update(String(req.user?.id || req.ip || 'guest'))
        .digest('hex')
        .slice(0, 32);

      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          instructions: [
            'You are the Lbara.tn website assistant.',
            'Answer clearly, warmly, and briefly.',
            languageMeta.instruction,
            'Use only the provided Lbara.tn context.',
            'Do not invent prices, guarantees, or policies.',
            'Do not ask users to paste passwords or sensitive account credentials into chat.',
            'If account details are needed, tell them checkout/contact will collect instructions securely.',
            SITE_KNOWLEDGE,
          ].join('\n'),
          input: userMessage,
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

      const answer = extractResponseText(response.data) || fallbackAnswer(userMessage, language);
      return res.json({ success: true, powered_by_ai: true, answer });
    } catch (apiErr) {
      console.warn('[chat/openai]', apiErr.response?.data?.error?.message || apiErr.message);
      return res.json({
        success: true,
        powered_by_ai: false,
        answer: fallbackAnswer(userMessage, language),
      });
    }
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[chat/message]', err);
    res.status(500).json({ success: false, message: 'Chat is unavailable right now.' });
  }
}

module.exports = { message };

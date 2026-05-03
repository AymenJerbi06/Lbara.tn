const crypto = require('crypto');
const axios = require('axios');
const {
  cleanString,
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

function hasOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() && !/^your_|change_this/i.test(key.trim()));
}

function fallbackAnswer(message) {
  const text = message.toLowerCase();

  if (/(pay|payment|card|d17|flouci|bank|tnd|dinar)/.test(text)) {
    return 'You choose the service and variation first, then checkout shows the local payment amount in TND. The idea is that you pay locally instead of needing an international card.';
  }

  if (/(receive|delivery|how long|time|activate|activation|code|account)/.test(text)) {
    return 'After payment, the delivery path depends on the service. Some products are delivered as a code or gift card, some are gifted to your existing account email, and some require assisted activation on the exact service account you want to use. Most standard deliveries target under two hours, while special requests may need follow-up.';
  }

  if (/(vpn|tunisia|disney|paramount|region|available)/.test(text)) {
    return 'Some services are not officially available in Tunisia. If the product page mentions a VPN, you should expect to use one even after the subscription is activated. Bundles can include NordVPN when that makes the service easier to use.';
  }

  if (/(refund|ticket|quote|special|request|coursera|certificate)/.test(text)) {
    return 'Special request products use a 1.500 TND request ticket so Lbara.tn can review the exact service and contact you. That ticket is not part of the final price and is not refundable if you change your mind.';
  }

  if (/(favorite|wishlist|save|sale|discount|notify)/.test(text)) {
    return 'Create or log in to your account, then use the heart button to save services and the sale alert button to be notified when a product is discounted.';
  }

  if (/(buy|order|checkout|steps|how)/.test(text)) {
    return 'To buy: open the Shop, choose a service, select the exact variation, read the activation notes, then continue to checkout. Checkout will ask for the delivery method and the account details only when that service needs them.';
  }

  return 'I can help with how Lbara.tn works, what to expect after payment, which account details may be needed, gift cards, VPN requirements, request tickets, favorites, and sale alerts. For a missing service, use the Contact page to request it.';
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
    rejectUnexpectedFields(req.body, ['message'], 'Chat message');
    const userMessage = cleanString(req.body.message, {
      label: 'Message',
      required: true,
      min: 2,
      max: 800,
    });

    if (!hasOpenAiKey()) {
      return res.json({
        success: true,
        powered_by_ai: false,
        answer: fallbackAnswer(userMessage),
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

      const answer = extractResponseText(response.data) || fallbackAnswer(userMessage);
      return res.json({ success: true, powered_by_ai: true, answer });
    } catch (apiErr) {
      console.warn('[chat/openai]', apiErr.response?.data?.error?.message || apiErr.message);
      return res.json({
        success: true,
        powered_by_ai: false,
        answer: fallbackAnswer(userMessage),
      });
    }
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[chat/message]', err);
    res.status(500).json({ success: false, message: 'Chat is unavailable right now.' });
  }
}

module.exports = { message };

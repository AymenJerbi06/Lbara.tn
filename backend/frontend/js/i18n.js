(function () {
  const LANGUAGES = {
    en: { code: 'EN', label: 'English', dir: 'ltr' },
    fr: { code: 'FR', label: 'Français', dir: 'ltr' },
    ar: { code: 'AR', label: 'العربية', dir: 'rtl' },
  };

  const TEXT = {
    fr: {
      'Home': 'Accueil',
      'Shop': 'Boutique',
      'How It Works': 'Comment ça marche',
      'FAQ': 'FAQ',
      'Contact': 'Contact',
      'Login / Sign Up': 'Connexion / Inscription',
      'Get Started': 'Commencer',
      'My Account': 'Mon compte',
      'Admin Panel': 'Espace admin',
      'Created and designed by': 'Créé et conçu par',
      'Designed by': 'Conçu par',
      'by': 'par',
      'Browse Services': 'Voir les services',
      'Your gateway to': 'Votre accès vers',
      "what's outside.": 'le monde extérieur.',
      'Bridge the Digital Gap': 'Réduire la fracture numérique',
      'Buy digital services unavailable in Tunisia. Pay locally with your Tunisian cards. No international credit card required.': 'Achetez des services numériques difficiles d’accès en Tunisie. Payez localement avec vos cartes tunisiennes. Pas besoin de carte internationale.',
      'Trusted by 2,000+ Tunisians this month.': 'Déjà testé par plus de 2 000 Tunisiens ce mois-ci.',
      'Is your service available?': 'Votre service est-il disponible ?',
      'Search any global service and see if we can curate it for you.': 'Recherchez un service mondial et voyez si nous pouvons vous l’obtenir.',
      'Type a service (e.g. Canva Pro, Midjourney, Coursera)...': 'Tapez un service (ex. Canva Pro, Midjourney, Coursera)...',
      'Request a Service': 'Demander un service',
      'Global Access': 'Accès global',
      'Available via Lbara.tn': 'Disponible via Lbara.tn',
      'Local Payment': 'Paiement local',
      'Pay with TND (EDINAR/Bank)': 'Payez en TND (EDINAR/Banque)',
      'Guided Delivery': 'Livraison guidée',
      'Clear steps per service': 'Étapes claires pour chaque service',
      'Three steps to digital freedom.': 'Trois étapes vers la liberté numérique.',
      "We've removed the friction between you and the world's best software.": 'Nous avons supprimé les obstacles entre vous et les meilleurs logiciels du monde.',
      'Choose Service': 'Choisissez le service',
      'Browse our curated catalog of hundreds of premium digital subscriptions and keys.': 'Parcourez notre catalogue de services numériques premium, abonnements et cartes.',
      'Pay Locally': 'Payez localement',
      'Checkout using D17, Konnect, Flouci, or any Tunisian bank card. No extra fees.': 'Payez avec D17, Konnect, Flouci ou une carte bancaire tunisienne.',
      'Follow Steps & Enjoy': 'Suivez les étapes et profitez',
      'Stop the struggle.': 'Fini la galère.',
      'The Tunisian digital experience: Expectations vs Reality.': 'L’expérience numérique tunisienne : attente vs réalité.',
      'Life before lbara': 'Avant Lbara',
      'Life with Lbara.tn': 'Avec Lbara.tn',
      'Your own private account. Your own name.': 'Votre propre compte privé. À votre nom.',
      'Full warranty. Real human support.': 'Garantie claire. Support humain réel.',
      'Join the smart ones': 'Rejoindre les malins',
      'Ready to upgrade': 'Prêt à améliorer',
      'your digital lifestyle?': 'votre vie numérique ?',
      "Don't let borders limit your potential. Get the tools you need today.": 'Ne laissez pas les frontières limiter votre potentiel. Obtenez les outils dont vous avez besoin.',
      'Start Browsing': 'Commencer à parcourir',
      'Talk to Support': 'Parler au support',
      'The Kinetic Curator of Tunisian Services. Breaking the digital walls one subscription at a time.': 'Le curateur numérique des services tunisiens. Nous brisons les murs numériques, un abonnement à la fois.',
      'Explore': 'Explorer',
      'Streaming Bundles': 'Bundles streaming',
      'Gaming Keys': 'Clés gaming',
      'Company': 'Entreprise',
      'Our Story': 'Notre histoire',
      'Terms of Service': 'Conditions d’utilisation',
      'Privacy Policy': 'Politique de confidentialité',
      'Refund Policy': 'Politique de remboursement',
      'Contact Support': 'Contacter le support',
      'Secure Payment': 'Paiement sécurisé',
      '24/7 Support': 'Support 24/7',
      'All Digital Services': 'Tous les services numériques',
      'Pay with your Tunisian card. Receive instantly.': 'Payez avec votre carte tunisienne. Recevez votre service rapidement.',
      'Search services...': 'Rechercher des services...',
      'Categories': 'Catégories',
      'All': 'Tous',
      'Close': 'Fermer',
      'All Services': 'Tous les services',
      'Hot This Week': 'Populaire cette semaine',
      "Users' Favorite": 'Favoris des utilisateurs',
      'Streaming': 'Streaming',
      'AI Tools': 'Outils IA',
      'Gaming': 'Gaming',
      'Productivity': 'Productivité',
      'Education': 'Éducation',
      'Gift Cards': 'Cartes cadeaux',
      'Social': 'Réseaux sociaux',
      'Storage': 'Stockage',
      'Cloud': 'Cloud',
      'VPN': 'VPN',
      'Books': 'Livres',
      'Lifestyle': 'Lifestyle',
      'Loading services...': 'Chargement des services...',
      'Loading...': 'Chargement...',
      'No services found.': 'Aucun service trouvé.',
      "Can't find what you are looking for?": 'Vous ne trouvez pas ce que vous cherchez ?',
      'Tell us the service, course, app, or subscription you need and we will check whether it can be added to Lbara.tn.': 'Dites-nous le service, cours, application ou abonnement dont vous avez besoin et nous vérifierons s’il peut être ajouté à Lbara.tn.',
      'Request a service': 'Demander un service',
      'Early tester feedback': 'Avis des premiers testeurs',
      'What makes people feel ready to buy': 'Ce qui aide les clients à se décider',
      'See the buying steps': 'Voir les étapes d’achat',
      'Private': 'Privé',
      'Shared': 'Partagé',
      'Options': 'Options',
      'New': 'Nouveau',
      'From': 'À partir de',
      '1 Month': '1 mois',
      'Price TBD': 'Prix à confirmer',
      'Pricing TBD': 'Prix à confirmer',
      'Request ticket': 'Ticket de demande',
      'Gift Card': 'Carte cadeau',
      'Giftable': 'Peut être offert',
      'Account Setup': 'Configuration de compte',
      'Existing Account': 'Compte existant',
      'average from': 'de moyenne sur',
      'review': 'avis',
      'reviews': 'avis',
      'Verified buyer': 'Acheteur vérifié',
      'No options are available for this service yet.': 'Aucune option n’est disponible pour ce service pour le moment.',
      'Selected during checkout': 'Choisi pendant le paiement',
      'Option': 'Option',
      'Quote': 'Devis',
      'Special request ticket': 'Ticket de demande spéciale',
      'Full payment': 'Paiement complet',
      'TBD': 'À confirmer',
      'Within': 'Sous',
      'choices': 'choix',
      'Coming soon': 'Bientôt disponible',
      'No description available yet.': 'Aucune description disponible pour le moment.',
      'This service can use a gift card or store-credit path, and checkout also lets you choose assisted activation if you want Lbara.tn to handle it on your account.': 'Ce service peut utiliser une carte cadeau ou un crédit de boutique. Au paiement, vous pouvez aussi choisir une activation assistée si vous voulez que Lbara.tn s’en occupe sur votre compte.',
      'This service can be gifted to an existing account email, or you can choose assisted activation and provide temporary account access if you want Lbara.tn to handle it for you.': 'Ce service peut être offert à une adresse e-mail liée à un compte existant. Vous pouvez aussi choisir une activation assistée et fournir un accès temporaire si vous voulez que Lbara.tn s’en occupe.',
      'This request must be connected to an account you already use. Checkout will ask for that account so the certificate, item, or activation lands in the right place.': 'Cette demande doit être liée à un compte que vous utilisez déjà. Le paiement demandera ce compte pour que le certificat, l’article ou l’activation arrive au bon endroit.',
      'This service can be activated on your existing account with temporary access, or set up as a new account using an email you control.': 'Ce service peut être activé sur votre compte existant avec un accès temporaire, ou configuré comme nouveau compte avec une adresse e-mail que vous contrôlez.',
      'Important: Disney+ is not officially available in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.': 'Important : Disney+ n’est pas officiellement disponible en Tunisie. Même après paiement et activation, il faut prévoir un VPN fiable pour regarder. Les bundles NordVPN incluent 13 % de réduction sur le prix combiné service + VPN.',
      'Important: Paramount+ availability is restricted in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.': 'Important : Paramount+ est limité en Tunisie. Même après paiement et activation, il faut prévoir un VPN fiable pour regarder. Les bundles NordVPN incluent 13 % de réduction sur le prix combiné service + VPN.',
      'Watch globally popular entertainment with guided activation.': 'Regardez du contenu mondial avec une activation guidée.',
      'Unlock premium AI tools while paying locally in TND.': 'Débloquez des outils IA premium en payant localement en TND.',
      'Keep learning without international-card friction.': 'Continuez à apprendre sans carte internationale.',
      'Top up or unlock content with clear redemption notes.': 'Rechargez ou débloquez du contenu avec des instructions claires.',
      'Make restricted services easier to use from Tunisia.': 'Utilisez plus facilement les services limités en Tunisie.',
      'Choose the version that fits you, then get guided checkout.': 'Choisissez la version qui vous convient, puis suivez un checkout guidé.',
      'All services': 'Tous les services',
      'Loading product...': 'Chargement du produit...',
      'Product not found': 'Produit introuvable',
      'This service may have moved or is not available right now.': 'Ce service a peut-être été déplacé ou n’est pas disponible actuellement.',
      'Back to Shop': 'Retour à la boutique',
      'Save to favorites': 'Ajouter aux favoris',
      'Save': 'Sauvegarder',
      'Saved': 'Sauvegardé',
      'Notify me if discounted': 'Prévenez-moi en cas de promo',
      'Sale alert on': 'Alerte promo activée',
      'No reviews yet': 'Pas encore d’avis',
      'Account': 'Compte',
      'Delivery': 'Livraison',
      'Flow': 'Méthode',
      'Available options': 'Options disponibles',
      'Choose the exact version you need': 'Choisissez la version exacte dont vous avez besoin',
      'Activation path': 'Méthode d’activation',
      'Why choose it here': 'Pourquoi le choisir ici',
      'Tester notes': 'Notes des testeurs',
      'Why people save this product': 'Pourquoi les clients enregistrent ce produit',
      'Selected option': 'Option sélectionnée',
      'Choose an option': 'Choisissez une option',
      'Pick one of the options to see the checkout summary.': 'Choisissez une option pour voir le résumé.',
      'Price': 'Prix',
      'Pricing Soon': 'Prix bientôt disponible',
      'Ask about pricing': 'Demander le prix',
      'Continue to Checkout': 'Continuer vers le paiement',
      'Pay Request Ticket': 'Payer le ticket de demande',
      'Express Checkout': 'Paiement express',
      'Fast-track your premium access in seconds.': 'Finalisez votre accès premium rapidement.',
      'Lightning Fast Checkout': 'Paiement très rapide',
      '1. Delivery Details': '1. Détails de livraison',
      'Email for Activation *': 'E-mail pour l’activation *',
      'Credentials will be sent here within 2 hours.': 'Les accès seront envoyés ici sous 2 heures.',
      'Phone Number (Optional)': 'Numéro de téléphone (optionnel)',
      '2. Activation Method for This Product': '2. Méthode d’activation pour ce produit',
      'Loading the activation choices available for this product...': 'Chargement des méthodes d’activation disponibles...',
      '3. Payment Method': '3. Méthode de paiement',
      'Instant confirmation via Mobile App': 'Confirmation instantanée via application mobile',
      'Bank Card': 'Carte bancaire',
      'Secure local payment gateway': 'Passerelle de paiement locale sécurisée',
      '4. Order Summary': '4. Résumé de commande',
      'Apply Promo Code': 'Code promo',
      'Apply': 'Appliquer',
      'Subtotal': 'Sous-total',
      'Promo Discount': 'Réduction promo',
      'Service Fee': 'Frais de service',
      'FREE': 'GRATUIT',
      'Express Delivery': 'Livraison express',
      'Included': 'Inclus',
      'Total to Pay': 'Total à payer',
      'VAT & Fees Included': 'TVA et frais inclus',
      'Place Order Now': 'Passer la commande',
      'Secure encrypted transaction via Lbara.tn': 'Transaction sécurisée et chiffrée via Lbara.tn',
      'Need assistance?': 'Besoin d’aide ?',
      'Chat with an agent': 'Parler à un agent',
      'Special request ticket - not part of final price': 'Ticket de demande spéciale - non inclus dans le prix final',
      'Pricing Not Ready': 'Prix pas encore prêt',
      'Processing...': 'Traitement...',
      'Payment was not completed. Please try again.': 'Le paiement n’a pas été complété. Veuillez réessayer.',
      'No item selected. Redirecting to shop...': 'Aucun article sélectionné. Redirection vers la boutique...',
      'Using saved cart details. Product options could not be refreshed.': 'Utilisation des détails sauvegardés. Les options du produit n’ont pas pu être actualisées.',
      'This option does not have a price yet. Please contact us first.': 'Cette option n’a pas encore de prix. Contactez-nous d’abord.',
      'Promo codes can be applied after pricing is set.': 'Les codes promo pourront être appliqués après confirmation du prix.',
      'Promo code applied! 10% discount.': 'Code promo appliqué ! 10 % de réduction.',
      'Invalid promo code.': 'Code promo invalide.',
      'Please enter a valid delivery email.': 'Veuillez entrer un e-mail de livraison valide.',
      'Please select a payment method.': 'Veuillez choisir une méthode de paiement.',
      'Payment gateway not configured. Please contact support.': 'La passerelle de paiement n’est pas configurée. Contactez le support.',
      'Direct Inquiry Hub': 'Centre de contact',
      'Our team replies within 2–4 hours.': 'Notre équipe répond sous 2 à 4 heures.',
      'Quick Contact': 'Contact rapide',
      'Email': 'E-mail',
      'Response Time': 'Délai de réponse',
      'Support Hours': 'Horaires du support',
      'Quick Links': 'Liens rapides',
      'Browse Services': 'Voir les services',
      'Send a Message': 'Envoyer un message',
      'Message Sent!': 'Message envoyé !',
      "We'll get back to you within 2–4 hours.": 'Nous vous répondrons sous 2 à 4 heures.',
      'Full Name *': 'Nom complet *',
      'Email Address *': 'Adresse e-mail *',
      'Category': 'Catégorie',
      'Select a category': 'Choisir une catégorie',
      'General': 'Général',
      'Sales': 'Ventes',
      'Technical': 'Technique',
      'Billing / Refund': 'Paiement / Remboursement',
      'Feedback': 'Avis',
      'Subject': 'Sujet',
      'Message *': 'Message *',
      'Send Message': 'Envoyer le message',
      'Your full name': 'Votre nom complet',
      'Brief subject': 'Sujet court',
      'Describe your issue or inquiry in detail...': 'Décrivez votre demande en détail...',
      'Login': 'Connexion',
      'Sign Up': 'Inscription',
      'Create Account': 'Créer un compte',
      'Password': 'Mot de passe',
      'Confirm Password': 'Confirmer le mot de passe',
      'Forgot password?': 'Mot de passe oublié ?',
      'Dashboard': 'Tableau de bord',
      'My Orders': 'Mes commandes',
      'Security': 'Sécurité',
      'Support': 'Support',
      'Sign Out': 'Déconnexion',
      'Quick Actions': 'Actions rapides',
      'Buy New': 'Acheter',
      'Recent Orders': 'Commandes récentes',
      'View All': 'Tout voir',
      'Favorite Services': 'Services favoris',
      'Your saved services and discount alerts.': 'Vos services sauvegardés et alertes promo.',
      'Wishlist': 'Favoris',
      'Sale Alerts': 'Alertes promo',
      'No favorites yet.': 'Aucun favori pour le moment.',
      'No sale alerts yet.': 'Aucune alerte promo pour le moment.',
      'Review purchase': 'Noter l’achat',
      'Edit review': 'Modifier l’avis',
      'Save review': 'Enregistrer l’avis',
      'Verified purchase review': 'Avis d’achat vérifié',
      'Review service': 'Noter le service',
      'Cancel': 'Annuler',
      'Lbara assistant': 'Assistant Lbara',
      'Ask before you buy': 'Demandez avant d’acheter',
      'Hi, I can explain how to buy, what details are needed, delivery timing, VPN needs, request tickets, favorites, and sale alerts.': 'Bonjour, je peux expliquer comment acheter, quels détails sont nécessaires, les délais de livraison, les besoins VPN, les tickets de demande, les favoris et les alertes promo.',
      'How do I buy?': 'Comment acheter ?',
      'How do I buy a service?': 'Comment acheter un service ?',
      'How will I receive my service?': 'Comment vais-je recevoir mon service ?',
      'When do I need to provide my account?': 'Quand dois-je fournir mon compte ?',
      'Account details': 'Détails du compte',
      'What does a request ticket mean?': 'Que signifie ticket de demande ?',
      'Ask a question...': 'Posez une question...',
      'Thinking...': 'Réflexion...',
      'I could not answer that right now.': 'Je ne peux pas répondre à cette question pour le moment.',
      'Chat is unavailable right now.': 'Le chat est indisponible pour le moment.',
    },
    ar: {
      'Home': 'الرئيسية',
      'Shop': 'المتجر',
      'How It Works': 'كيف يعمل',
      'FAQ': 'الأسئلة الشائعة',
      'Contact': 'اتصل بنا',
      'Login / Sign Up': 'دخول / إنشاء حساب',
      'Get Started': 'ابدأ الآن',
      'My Account': 'حسابي',
      'Admin Panel': 'لوحة الإدارة',
      'Created and designed by': 'تم الإنشاء والتصميم من طرف',
      'Designed by': 'صممه',
      'by': 'من طرف',
      'Browse Services': 'تصفح الخدمات',
      'Your gateway to': 'بوابتك إلى',
      "what's outside.": 'العالم الخارجي.',
      'Bridge the Digital Gap': 'نقرّبك من العالم الرقمي',
      'Buy digital services unavailable in Tunisia. Pay locally with your Tunisian cards. No international credit card required.': 'اشترِ خدمات رقمية يصعب الوصول إليها في تونس. ادفع محلياً ببطاقات تونسية. لا تحتاج إلى بطاقة دولية.',
      'Trusted by 2,000+ Tunisians this month.': 'موثوق من أكثر من 2000 تونسي هذا الشهر.',
      'Is your service available?': 'هل خدمتك متوفرة؟',
      'Search any global service and see if we can curate it for you.': 'ابحث عن أي خدمة عالمية وسنخبرك إن كان بإمكاننا توفيرها لك.',
      'Type a service (e.g. Canva Pro, Midjourney, Coursera)...': 'اكتب اسم خدمة مثل Canva Pro أو Coursera...',
      'Request a Service': 'اطلب خدمة',
      'Global Access': 'وصول عالمي',
      'Available via Lbara.tn': 'متوفر عبر Lbara.tn',
      'Local Payment': 'دفع محلي',
      'Pay with TND (EDINAR/Bank)': 'ادفع بالدينار التونسي',
      'Guided Delivery': 'تسليم موجه',
      'Clear steps per service': 'خطوات واضحة لكل خدمة',
      'Three steps to digital freedom.': 'ثلاث خطوات نحو حرية رقمية.',
      "We've removed the friction between you and the world's best software.": 'أزلنا العوائق بينك وبين أفضل الخدمات الرقمية في العالم.',
      'Choose Service': 'اختر الخدمة',
      'Browse our curated catalog of hundreds of premium digital subscriptions and keys.': 'تصفح كتالوجاً مختاراً من الاشتراكات والخدمات الرقمية.',
      'Pay Locally': 'ادفع محلياً',
      'Checkout using D17, Konnect, Flouci, or any Tunisian bank card. No extra fees.': 'ادفع عبر D17 أو Konnect أو Flouci أو بطاقة بنكية تونسية.',
      'Follow Steps & Enjoy': 'اتبع الخطوات واستمتع',
      'Stop the struggle.': 'انتهت المعاناة.',
      'The Tunisian digital experience: Expectations vs Reality.': 'التجربة الرقمية في تونس: التوقعات مقابل الواقع.',
      'Life before lbara': 'قبل Lbara',
      'Life with Lbara.tn': 'مع Lbara.tn',
      'Your own private account. Your own name.': 'حسابك الخاص وباسمك.',
      'Full warranty. Real human support.': 'ضمان واضح ودعم بشري حقيقي.',
      'Join the smart ones': 'انضم للأذكياء',
      'Ready to upgrade': 'جاهز لتطوير',
      'your digital lifestyle?': 'حياتك الرقمية؟',
      "Don't let borders limit your potential. Get the tools you need today.": 'لا تجعل الحدود تمنعك من الأدوات التي تحتاجها.',
      'Start Browsing': 'ابدأ التصفح',
      'Talk to Support': 'تواصل مع الدعم',
      'The Kinetic Curator of Tunisian Services. Breaking the digital walls one subscription at a time.': 'منصة تونسية للوصول إلى الخدمات الرقمية العالمية، اشتراكاً بعد اشتراك.',
      'Explore': 'استكشف',
      'Streaming Bundles': 'باقات البث',
      'Gaming Keys': 'مفاتيح الألعاب',
      'Company': 'الشركة',
      'Our Story': 'قصتنا',
      'Terms of Service': 'شروط الخدمة',
      'Privacy Policy': 'سياسة الخصوصية',
      'Refund Policy': 'سياسة الاسترجاع',
      'Contact Support': 'تواصل مع الدعم',
      'Secure Payment': 'دفع آمن',
      '24/7 Support': 'دعم 24/7',
      'All Digital Services': 'كل الخدمات الرقمية',
      'Pay with your Tunisian card. Receive instantly.': 'ادفع ببطاقتك التونسية واستلم خدمتك بسرعة.',
      'Search services...': 'ابحث عن خدمة...',
      'Categories': 'الفئات',
      'All': 'الكل',
      'Close': 'إغلاق',
      'All Services': 'كل الخدمات',
      'Hot This Week': 'الأكثر طلباً هذا الأسبوع',
      "Users' Favorite": 'المفضل لدى المستخدمين',
      'Streaming': 'البث',
      'AI Tools': 'أدوات الذكاء الاصطناعي',
      'Gaming': 'الألعاب',
      'Productivity': 'الإنتاجية',
      'Education': 'التعليم',
      'Gift Cards': 'بطاقات الهدايا',
      'Social': 'التواصل الاجتماعي',
      'Storage': 'التخزين',
      'Cloud': 'السحابة',
      'VPN': 'VPN',
      'Books': 'الكتب',
      'Lifestyle': 'نمط الحياة',
      'Loading services...': 'جاري تحميل الخدمات...',
      'Loading...': 'جاري التحميل...',
      'No services found.': 'لم يتم العثور على خدمات.',
      "Can't find what you are looking for?": 'لم تجد ما تبحث عنه؟',
      'Tell us the service, course, app, or subscription you need and we will check whether it can be added to Lbara.tn.': 'أخبرنا بالخدمة أو التطبيق أو الاشتراك الذي تحتاجه وسنرى إن كان يمكن إضافته.',
      'Request a service': 'اطلب خدمة',
      'Early tester feedback': 'آراء أولية',
      'What makes people feel ready to buy': 'ما الذي يساعد الناس على الشراء',
      'See the buying steps': 'شاهد خطوات الشراء',
      'Private': 'خاص',
      'Shared': 'مشترك',
      'Options': 'خيارات',
      'New': 'جديد',
      'From': 'ابتداءً من',
      '1 Month': 'شهر واحد',
      'Price TBD': 'السعر يحدد لاحقاً',
      'Pricing TBD': 'السعر يحدد لاحقاً',
      'Request ticket': 'تذكرة طلب',
      'Gift Card': 'بطاقة هدية',
      'Giftable': 'قابل للإهداء',
      'Account Setup': 'إعداد حساب',
      'Existing Account': 'حساب موجود',
      'average from': 'متوسط من',
      'review': 'تقييم',
      'reviews': 'تقييمات',
      'Verified buyer': 'مشتري موثق',
      'No options are available for this service yet.': 'لا توجد خيارات متاحة لهذه الخدمة حالياً.',
      'Selected during checkout': 'يتم اختياره أثناء الدفع',
      'Option': 'خيار',
      'Quote': 'تسعير خاص',
      'Special request ticket': 'تذكرة طلب خاصة',
      'Full payment': 'دفع كامل',
      'TBD': 'يحدد لاحقاً',
      'Within': 'خلال',
      'choices': 'خيارات',
      'Coming soon': 'قريباً',
      'No description available yet.': 'لا يوجد وصف متاح حالياً.',
      'This service can use a gift card or store-credit path, and checkout also lets you choose assisted activation if you want Lbara.tn to handle it on your account.': 'يمكن لهذه الخدمة استعمال بطاقة هدية أو رصيد متجر. أثناء الدفع يمكنك أيضاً اختيار التفعيل بمساعدة Lbara.tn إذا أردت أن نتكفل به على حسابك.',
      'This service can be gifted to an existing account email, or you can choose assisted activation and provide temporary account access if you want Lbara.tn to handle it for you.': 'يمكن إهداء هذه الخدمة إلى بريد إلكتروني مرتبط بحساب موجود. يمكنك أيضاً اختيار التفعيل بمساعدة وتوفير وصول مؤقت إذا أردت أن تتكفل Lbara.tn بالأمر.',
      'This request must be connected to an account you already use. Checkout will ask for that account so the certificate, item, or activation lands in the right place.': 'يجب ربط هذا الطلب بحساب تستعمله بالفعل. أثناء الدفع سنطلب هذا الحساب حتى يصل الشهادة أو العنصر أو التفعيل إلى المكان الصحيح.',
      'This service can be activated on your existing account with temporary access, or set up as a new account using an email you control.': 'يمكن تفعيل هذه الخدمة على حسابك الحالي مع وصول مؤقت، أو إعداد حساب جديد باستعمال بريد إلكتروني تتحكم فيه.',
      'Important: Disney+ is not officially available in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.': 'مهم: Disney+ غير متاح رسمياً في تونس. حتى بعد الدفع والتفعيل، ستحتاج غالباً إلى VPN موثوق للمشاهدة. خيارات NordVPN المجمعة تتضمن خصماً بنسبة 13% على سعر الخدمة مع الـ VPN.',
      'Important: Paramount+ availability is restricted in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.': 'مهم: Paramount+ محدود في تونس. حتى بعد الدفع والتفعيل، ستحتاج غالباً إلى VPN موثوق للمشاهدة. خيارات NordVPN المجمعة تتضمن خصماً بنسبة 13% على سعر الخدمة مع الـ VPN.',
      'Watch globally popular entertainment with guided activation.': 'شاهد محتوى عالمي مع تفعيل موجه.',
      'Unlock premium AI tools while paying locally in TND.': 'استعمل أدوات ذكاء اصطناعي مدفوعة وادفع محلياً بالدينار.',
      'Keep learning without international-card friction.': 'واصل التعلم بدون بطاقة دولية.',
      'Top up or unlock content with clear redemption notes.': 'اشحن أو افتح المحتوى مع تعليمات واضحة.',
      'Make restricted services easier to use from Tunisia.': 'استعمل الخدمات المحدودة في تونس بطريقة أسهل.',
      'Choose the version that fits you, then get guided checkout.': 'اختر النسخة المناسبة ثم اتبع الدفع الموجه.',
      'All services': 'كل الخدمات',
      'Loading product...': 'جاري تحميل المنتج...',
      'Product not found': 'المنتج غير موجود',
      'This service may have moved or is not available right now.': 'قد تكون هذه الخدمة غير متاحة حالياً.',
      'Back to Shop': 'العودة إلى المتجر',
      'Save to favorites': 'إضافة إلى المفضلة',
      'Save': 'حفظ',
      'Saved': 'محفوظ',
      'Notify me if discounted': 'أعلمني عند وجود تخفيض',
      'Sale alert on': 'تنبيه التخفيض مفعّل',
      'No reviews yet': 'لا توجد تقييمات بعد',
      'Account': 'الحساب',
      'Delivery': 'التسليم',
      'Flow': 'الطريقة',
      'Available options': 'الخيارات المتاحة',
      'Choose the exact version you need': 'اختر النسخة التي تحتاجها',
      'Activation path': 'طريقة التفعيل',
      'Why choose it here': 'لماذا تختاره هنا',
      'Tester notes': 'ملاحظات المستخدمين',
      'Why people save this product': 'لماذا يحفظ الناس هذا المنتج',
      'Selected option': 'الخيار المحدد',
      'Choose an option': 'اختر خياراً',
      'Pick one of the options to see the checkout summary.': 'اختر خياراً لرؤية ملخص الطلب.',
      'Price': 'السعر',
      'Pricing Soon': 'السعر قريباً',
      'Ask about pricing': 'اسأل عن السعر',
      'Continue to Checkout': 'المتابعة للدفع',
      'Pay Request Ticket': 'ادفع تذكرة الطلب',
      'Express Checkout': 'الدفع السريع',
      'Fast-track your premium access in seconds.': 'أكمل طلب الوصول للخدمة بسرعة.',
      'Lightning Fast Checkout': 'دفع سريع جداً',
      '1. Delivery Details': '1. تفاصيل التسليم',
      'Email for Activation *': 'البريد الإلكتروني للتفعيل *',
      'Credentials will be sent here within 2 hours.': 'سيتم إرسال بيانات الدخول هنا خلال ساعتين.',
      'Phone Number (Optional)': 'رقم الهاتف (اختياري)',
      '2. Activation Method for This Product': '2. طريقة التفعيل لهذا المنتج',
      'Loading the activation choices available for this product...': 'جار تحميل خيارات التفعيل المتاحة لهذا المنتج...',
      '3. Payment Method': '3. طريقة الدفع',
      'Instant confirmation via Mobile App': 'تأكيد فوري عبر تطبيق الهاتف',
      'Bank Card': 'بطاقة بنكية',
      'Secure local payment gateway': 'بوابة دفع محلية آمنة',
      '4. Order Summary': '4. ملخص الطلب',
      'Apply Promo Code': 'استعمال كود تخفيض',
      'Apply': 'تطبيق',
      'Subtotal': 'المجموع الفرعي',
      'Promo Discount': 'تخفيض ترويجي',
      'Service Fee': 'رسوم الخدمة',
      'FREE': 'مجاني',
      'Express Delivery': 'تسليم سريع',
      'Included': 'مشمولة',
      'Total to Pay': 'المبلغ الإجمالي',
      'VAT & Fees Included': 'الضريبة والرسوم مشمولة',
      'Place Order Now': 'إتمام الطلب الآن',
      'Secure encrypted transaction via Lbara.tn': 'معاملة آمنة ومشفرة عبر Lbara.tn',
      'Need assistance?': 'تحتاج مساعدة؟',
      'Chat with an agent': 'تحدث مع الدعم',
      'Special request ticket - not part of final price': 'تذكرة طلب خاصة - ليست جزءاً من السعر النهائي',
      'Pricing Not Ready': 'السعر غير جاهز',
      'Processing...': 'جار المعالجة...',
      'Payment was not completed. Please try again.': 'لم يكتمل الدفع. حاول مرة أخرى.',
      'No item selected. Redirecting to shop...': 'لم يتم اختيار أي منتج. جار التحويل إلى المتجر...',
      'Using saved cart details. Product options could not be refreshed.': 'نستعمل تفاصيل السلة المحفوظة. لم نتمكن من تحديث خيارات المنتج.',
      'This option does not have a price yet. Please contact us first.': 'هذا الخيار ليس له سعر بعد. يرجى التواصل معنا أولاً.',
      'Promo codes can be applied after pricing is set.': 'يمكن استعمال كود التخفيض بعد تحديد السعر.',
      'Promo code applied! 10% discount.': 'تم تطبيق كود التخفيض! خصم 10%.',
      'Invalid promo code.': 'كود التخفيض غير صالح.',
      'Please enter a valid delivery email.': 'يرجى إدخال بريد إلكتروني صالح للتسليم.',
      'Please select a payment method.': 'يرجى اختيار طريقة الدفع.',
      'Payment gateway not configured. Please contact support.': 'بوابة الدفع غير مهيأة. يرجى التواصل مع الدعم.',
      'Direct Inquiry Hub': 'مركز التواصل',
      'Our team replies within 2–4 hours.': 'فريقنا يرد خلال 2 إلى 4 ساعات.',
      'Quick Contact': 'تواصل سريع',
      'Email': 'البريد الإلكتروني',
      'Response Time': 'وقت الرد',
      'Support Hours': 'ساعات الدعم',
      'Quick Links': 'روابط سريعة',
      'Send a Message': 'أرسل رسالة',
      'Message Sent!': 'تم إرسال الرسالة!',
      "We'll get back to you within 2–4 hours.": 'سنعود إليك خلال 2 إلى 4 ساعات.',
      'Full Name *': 'الاسم الكامل *',
      'Email Address *': 'البريد الإلكتروني *',
      'Category': 'الفئة',
      'Select a category': 'اختر فئة',
      'General': 'عام',
      'Sales': 'المبيعات',
      'Technical': 'تقني',
      'Billing / Refund': 'الدفع / الاسترجاع',
      'Feedback': 'ملاحظات',
      'Subject': 'الموضوع',
      'Message *': 'الرسالة *',
      'Send Message': 'إرسال الرسالة',
      'Your full name': 'اسمك الكامل',
      'Brief subject': 'موضوع قصير',
      'Describe your issue or inquiry in detail...': 'اشرح طلبك بالتفصيل...',
      'Login': 'تسجيل الدخول',
      'Sign Up': 'إنشاء حساب',
      'Create Account': 'إنشاء حساب',
      'Password': 'كلمة المرور',
      'Confirm Password': 'تأكيد كلمة المرور',
      'Forgot password?': 'نسيت كلمة المرور؟',
      'Dashboard': 'لوحة الحساب',
      'My Orders': 'طلباتي',
      'Security': 'الأمان',
      'Support': 'الدعم',
      'Sign Out': 'تسجيل الخروج',
      'Quick Actions': 'إجراءات سريعة',
      'Buy New': 'شراء جديد',
      'Recent Orders': 'آخر الطلبات',
      'View All': 'عرض الكل',
      'Favorite Services': 'الخدمات المفضلة',
      'Your saved services and discount alerts.': 'خدماتك المحفوظة وتنبيهات التخفيض.',
      'Wishlist': 'المفضلة',
      'Sale Alerts': 'تنبيهات التخفيض',
      'No favorites yet.': 'لا توجد مفضلات بعد.',
      'No sale alerts yet.': 'لا توجد تنبيهات تخفيض بعد.',
      'Review purchase': 'قيّم الشراء',
      'Edit review': 'تعديل التقييم',
      'Save review': 'حفظ التقييم',
      'Verified purchase review': 'تقييم شراء موثق',
      'Review service': 'قيّم الخدمة',
      'Cancel': 'إلغاء',
      'Lbara assistant': 'مساعد Lbara',
      'Ask before you buy': 'اسأل قبل الشراء',
      'Hi, I can explain how to buy, what details are needed, delivery timing, VPN needs, request tickets, favorites, and sale alerts.': 'مرحباً، أستطيع أن أشرح لك كيف تشتري، ما التفاصيل المطلوبة، وقت التسليم، متى تحتاج VPN، تذاكر الطلب، المفضلة وتنبيهات التخفيض.',
      'How do I buy?': 'كيف أشتري؟',
      'How do I buy a service?': 'كيف أشتري خدمة؟',
      'How will I receive my service?': 'كيف سأستلم خدمتي؟',
      'When do I need to provide my account?': 'متى يجب أن أقدم حسابي؟',
      'Account details': 'تفاصيل الحساب',
      'What does a request ticket mean?': 'ماذا تعني تذكرة الطلب؟',
      'Ask a question...': 'اكتب سؤالك...',
      'Thinking...': 'جار التفكير...',
      'I could not answer that right now.': 'لا أستطيع الإجابة الآن.',
      'Chat is unavailable right now.': 'الدردشة غير متاحة حالياً.',
    },
  };

  const textNodeOriginals = new WeakMap();

  function language() {
    const saved = localStorage.getItem('lbara_lang');
    return LANGUAGES[saved] ? saved : 'en';
  }

  function t(value, lang = language()) {
    const source = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!source || lang === 'en') return value;
    return TEXT[lang]?.[source] || value;
  }

  function translateElementAttributes(root, lang) {
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
      const original = el.getAttribute('data-i18n-placeholder') || el.getAttribute('placeholder');
      el.setAttribute('data-i18n-placeholder', original);
      el.setAttribute('placeholder', lang === 'en' ? original : t(original, lang));
    });

    root.querySelectorAll('option').forEach((el) => {
      const original = el.getAttribute('data-i18n-option') || el.textContent.trim();
      el.setAttribute('data-i18n-option', original);
      el.textContent = lang === 'en' ? original : t(original, lang);
    });

    root.querySelectorAll('[title]').forEach((el) => {
      const original = el.getAttribute('data-i18n-title') || el.getAttribute('title');
      el.setAttribute('data-i18n-title', original);
      el.setAttribute('title', lang === 'en' ? original : t(original, lang));
    });
  }

  function apply(root = document) {
    const lang = language();
    const meta = LANGUAGES[lang] || LANGUAGES.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    document.body?.classList.toggle('lbara-rtl', meta.dir === 'rtl');

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, textarea, input, select, [data-i18n-skip]')) {
          return NodeFilter.FILTER_REJECT;
        }
        const original = textNodeOriginals.get(node) || node.nodeValue;
        const trimmed = original.replace(/\s+/g, ' ').trim();
        if (!trimmed || (lang !== 'en' && !TEXT[lang]?.[trimmed])) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const original = textNodeOriginals.get(node) || node.nodeValue;
      textNodeOriginals.set(node, original);
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      const trimmed = original.replace(/\s+/g, ' ').trim();
      const translated = lang === 'en' ? trimmed : t(trimmed, lang);
      node.nodeValue = leading + translated + trailing;
    });

    translateElementAttributes(root, lang);
    document.querySelectorAll('[data-language-code]').forEach((el) => {
      el.textContent = meta.code;
    });
  }

  function ensureStyles() {
    if (document.getElementById('lbara-language-styles')) return;
    const style = document.createElement('style');
    style.id = 'lbara-language-styles';
    style.textContent = `
      .lbara-language-wrap{position:relative;display:inline-flex;flex-shrink:0}
      .lbara-language-desktop{display:none!important}
      .lbara-language-mobile{display:inline-flex!important}
      @media(min-width:1024px){.lbara-language-desktop{display:inline-flex!important}.lbara-language-mobile{display:none!important}}
      .lbara-language-btn{height:40px;min-width:54px;border:2px solid #003060;border-radius:999px;background:#fff;color:#003060;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-family:Quicksand,Nunito,sans-serif;font-weight:900;font-size:11px;box-shadow:3px 3px 0 #003060;transition:transform .14s ease,box-shadow .14s ease,background .14s ease}
      .lbara-language-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #003060;background:#fffdf7}
      .lbara-language-btn .material-symbols-outlined{font-size:18px}
      .lbara-language-menu{position:absolute;right:0;top:48px;z-index:10000;min-width:150px;background:#fff;border:3px solid #003060;border-radius:18px;box-shadow:6px 6px 0 #003060;padding:7px;display:none}
      .lbara-language-wrap.open .lbara-language-menu{display:block}
      .lbara-language-menu button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;border-radius:12px;padding:9px 10px;font-family:Quicksand,Nunito,sans-serif;font-weight:900;font-size:12px;color:#003060;text-align:left}
      .lbara-language-menu button:hover,.lbara-language-menu button.active{background:rgba(0,48,96,.07)}
      .lbara-rtl{text-align:right}
      .lbara-rtl .lbara-chat-bubble.bot{align-self:flex-end}
      .lbara-rtl .lbara-chat-bubble.user{align-self:flex-start}
      @media(max-width:767px){.lbara-language-btn{height:30px;min-width:38px;font-size:9px;box-shadow:2px 2px 0 #003060}.lbara-language-btn .material-symbols-outlined{font-size:14px}.lbara-language-menu{top:38px;right:0}}
      @media(max-width:430px){.lbara-language-btn{height:28px;min-width:30px;width:30px}.lbara-language-btn [data-language-code]{display:none}.lbara-language-menu{min-width:136px}}
    `;
    document.head.appendChild(style);
  }

  function selector(id, extraClass = '') {
    ensureStyles();
    const current = language();
    const wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = ('lbara-language-wrap ' + extraClass).trim();
    wrap.innerHTML = `
      <button type="button" class="lbara-language-btn" aria-label="Change language">
        <span class="material-symbols-outlined">language</span>
        <span data-language-code>${LANGUAGES[current].code}</span>
      </button>
      <div class="lbara-language-menu">
        ${Object.entries(LANGUAGES).map(([code, item]) => `
          <button type="button" data-set-language="${code}" class="${code === current ? 'active' : ''}">
            <span>${item.label}</span><span>${item.code}</span>
          </button>
        `).join('')}
      </div>
    `;
    wrap.querySelector('.lbara-language-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      wrap.classList.toggle('open');
    });
    wrap.querySelectorAll('[data-set-language]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        localStorage.setItem('lbara_lang', button.getAttribute('data-set-language'));
        document.querySelectorAll('.lbara-language-wrap.open').forEach((el) => el.classList.remove('open'));
        document.querySelectorAll('[data-set-language]').forEach((el) => {
          el.classList.toggle('active', el.getAttribute('data-set-language') === language());
        });
        apply(document);
        document.dispatchEvent(new CustomEvent('lbara:languagechange', { detail: { lang: language() } }));
      });
    });
    return wrap;
  }

  function init() {
    ensureStyles();
    const desktopBtn = document.getElementById('nav-account-btn');
    if (desktopBtn && !document.getElementById('lbara-language-desktop')) {
      const desktopActions = document.getElementById('lbara-desktop-actions') || desktopBtn.parentElement;
      desktopActions.insertBefore(selector('lbara-language-desktop', 'lbara-language-desktop'), desktopBtn);
    }
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger && !document.getElementById('lbara-language-mobile')) {
      const mobileShop = hamburger.parentElement?.querySelector('a[href="/shop.html"]');
      if (mobileShop) {
        mobileShop.insertAdjacentElement('beforebegin', selector('lbara-language-mobile', 'lbara-language-mobile'));
      } else {
        hamburger.insertAdjacentElement('beforebegin', selector('lbara-language-mobile', 'lbara-language-mobile'));
      }
    }
    document.addEventListener('click', () => {
      document.querySelectorAll('.lbara-language-wrap.open').forEach((el) => el.classList.remove('open'));
    });
    apply(document);
  }

  window.lbaraI18n = { init, apply, t, language };
})();

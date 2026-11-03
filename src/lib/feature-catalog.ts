// Explicit aliases only: matching a term is not evidence of intent.
type Feature = {
  name: string
  keywords: string[]
}

export const features: Feature[] = [
  {
    name: 'E-commerce functionality',
    keywords: [
      'online store',
      'ecommerce',
      'e-commerce',
      'shopping cart',
      'purchase products',
      'buy products',
      'sell products',
      'web shop',
      'webshop',
    ],
  },
  {
    name: 'Payment integration',
    keywords: [
      'payment',
      'payments',
      'card processing',
      'credit card processing',
      'checkout',
      'stripe',
      'paypal',
      'accept payments',
    ],
  },
  {
    name: 'User authentication',
    keywords: ['login', 'authentication', 'user accounts', 'sign up', 'sign in', 'log in', 'user account', 'account registration'],
  },
  {
    name: 'Admin dashboard',
    keywords: ['dashboard', 'admin panel', 'administration panel', 'back office'],
  },
  {
    name: 'Booking system',
    keywords: ['booking', 'appointments', 'appointment', 'scheduling', 'reservation system', 'reservations'],
  },
  {
    name: 'Mobile application',
    keywords: ['mobile app', 'mobile application', 'android app', 'ios app', 'iphone app'],
  },
  {
    name: 'SEO services',
    keywords: ['seo', 'search engine optimization', 'search engine optimisation'],
  },
]


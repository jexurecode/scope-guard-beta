import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'

const plain = 'Build a five-page business website with a contact form.'
const commerce = 'E-commerce functionality'
const payments = 'Payment integration'
const booking = 'Booking system'
const authentication = 'User authentication'
const names = (request: string, agreement = plain) => analyzeScope(agreement, request).detectedChanges.map(c => c.feature)

describe('explicit additions and feature aliases', () => {
  it.each([
    ['Please add an online store.', commerce],
    ["We'd like booking.", booking],
    ['We would like payments.', payments],
    ['Build a shopping cart.', commerce],
    ['Can customers purchase products directly on the website?', commerce],
    ['Allow customers to buy products.', commerce],
    ['We want to sell products.', commerce],
    ['Add a webshop.', commerce],
    ['Implement e-commerce.', commerce],
    ['Create an ecommerce platform.', commerce],
    ['Add Stripe.', payments],
    ['Integrate PayPal.', payments],
    ['Enable credit card processing.', payments],
    ['Payments are required.', payments],
    ['Please add payment integration.', payments],
    ['Add authentication.', authentication],
    ['We need user accounts.', authentication],
    ['Implement sign-up.', authentication],
    ['Add a log-in flow.', authentication],
    ['Implement account registration.', authentication],
    ['Add an admin panel.', 'Admin dashboard'],
    ['Build an administration panel.', 'Admin dashboard'],
    ['Create a dashboard.', 'Admin dashboard'],
    ['Add a booking system.', booking],
    ['Allow appointment scheduling.', booking],
    ['Implement reservations.', booking],
    ['Build a reservation system.', booking],
    ['Develop an iOS app.', 'Mobile application'],
    ['Create a mobile application.', 'Mobile application'],
    ['Add search engine optimisation.', 'SEO services'],
    ['Include SEO services.', 'SEO services'],
  ])('%s', (request, feature) => {
    expect(names(request)).toEqual([feature])
  })
})

describe('exclusions and removals', () => {
  it.each([
    "Don't add payments.",
    'Do not add payments.',
    'We do not need an online store or payment integration.',
    'No payments or booking.',
    'Build a website without payments.',
    'Exclude booking.',
    'Payments are not required.',
    "Payments aren't required.",
    'Payments will not be required.',
    'Booking is not needed.',
    'Payments are out of scope.',
    'Please remove the payment button from the old design.',
    'Delete user accounts.',
    'Get rid of the shopping cart.',
    'Disable checkout.',
    'Never include payments.',
    "We won't need booking.",
    "We don't want to add booking.",
    'Omit the mobile app.',
    'Avoid integrating Stripe.',
  ])('%s', request => {
    const result = analyzeScope(plain, request)
    expect(result.status).toBe('needs-review')
    expect(result.detectedChanges).toEqual([])
    expect(result.reviewNotes?.length).toBeGreaterThan(0)
  })
  it('does not treat removal of an included feature as an addition', () => {
    expect(names('Remove payment integration.', 'Build a website with Stripe payments.')).toEqual([])
  })
  it('normalizes curly apostrophes', () => {
    expect(names('Don\u2019t add payments.')).toEqual([])
  })
})

describe('mixed feature intentions', () => {
  it.each([
    ["Don't add payments, but add a booking system.", [booking]],
    ['Do not add payments but add booking.', [booking]],
    ['Add booking without payments.', [booking]],
    ['Add booking without login or payments.', [booking]],
    ['Add booking except payments.', [booking]],
    ['Add payments and do not add booking.', [payments]],
    ['Add booking but no payments.', [booking]],
    ['Remove payments and add booking.', [booking]],
    ['Add booking and remove payments.', [booking]],
    ['Exclude payments. Add booking.', [booking]],
    ['No payments; build booking.', [booking]],
    ['Add booking, payments are not required.', [booking]],
    ['Remove login. Add an online store with Stripe payments.', [commerce, payments]],
    ['No store or payments. Add booking and user accounts.', [authentication, booking]],
    ['Maybe add payments. Add booking.', [booking]],
    ['Add payments. Do not add payments. Add booking.', [booking]],
    ['Add booking and also exclude payments.', [booking]],
  ])('%s', (request, expected) => {
    expect(names(request as string)).toEqual(expected)
  })
})

describe('agreement context', () => {
  it.each([
    ['Build an online store with Stripe checkout.', 'Add PayPal payments.'],
    ['Deliverables: booking system.', 'Add appointment scheduling.'],
    ['Include user authentication.', 'Add login.'],
    ['Build a mobile application.', 'Create an iOS app.'],
    ['SEO services.', 'Add search engine optimisation.'],
  ])('does not flag an already mentioned feature group: %s', (agreement, request) => {
    const result = analyzeScope(agreement, request)
    expect(result.detectedChanges).toEqual([])
    expect(result.reviewNotes?.join(' ')).toContain('details, quantities')
  })
  it.each([
    'Website without payments.',
    'Payments are excluded.',
    'No payment integration.',
    'Payments are not included.',
  ])('does not count an excluded agreement term as included: %s', agreement => {
    expect(names('Add payments.', agreement)).toEqual([payments])
  })
  it.each([
    'Maybe include payments.',
    'Payment integration is optional.',
    'Include payments. Exclude payments.',
  ])('asks for review when agreement wording is uncertain: %s', agreement => {
    expect(analyzeScope(agreement, 'Add payments.').status).toBe('needs-review')
  })
  it('handles different feature intentions in the agreement', () => {
    expect(names('Add booking and payments.', 'Include booking but exclude payments.')).toEqual([payments])
  })
})

describe('ambiguous and non-addition wording', () => {
  it.each([
    'Maybe add booking.',
    'Could we discuss payments?',
    'Should we add payments?',
    'Do we need to add booking?',
    'When we launch, add payments.',
    'The client said "add payments and add booking and add login".',
    'What about a mobile app?',
    'Payments?',
    'Consider an online store.',
    'If we expand, add payments.',
    'Add booking if the budget allows.',
    'Add payments later.',
    'Add either payments or booking.',
    'Replace payments with booking.',
    'Add booking instead of payments.',
    "Don't remove payments.",
    'Not only payments but booking.',
    'We have no objection to payments.',
    'Please change the checkout button color to blue.',
    'Fix login.',
    'Keep the existing booking system.',
    'Add a Stripe logo.',
    'Add a link to the online store.',
    'Write an article about SEO.',
    'Add text explaining payments.',
    'Add payment terms to the agreement.',
    'Add a payment receipt.',
    "The client said 'add payments'.",
    'The client said "add payments".',
    'We might add payments.',
    'Can we change the heading font?',
    '',
  ])('requires review: %s', request => {
    expect(analyzeScope(plain, request).status).toBe('needs-review')
    expect(names(request)).toEqual([])
  })
  it.each(['Add repayment details.', 'Add a pinstripe background.', 'Add seoul travel details.', 'Add mobile appendix.', 'Add bookingkeeper.'])('avoids substring collisions: %s', request => {
    expect(names(request)).toEqual([])
  })
})

describe('determinism and evidence', () => {
  it('has stable output, one change per feature, and no stateful regex leakage', () => {
    const request = 'Add Stripe payments and PayPal checkout. Add booking.'
    const first = analyzeScope(plain, request)
    expect(first.detectedChanges.map(c => c.feature)).toEqual([payments, booking])
    for (let i = 0; i < 10; i++) {
      analyzeScope(plain, 'Remove payments.')
      expect(analyzeScope(plain, request)).toEqual(first)
    }
    expect(first.detectedChanges.every(c => request.toLowerCase().includes(c.requestEvidence))).toBe(true)
    expect(first.explanation).toContain('human review')
  })
  it('normalizes capitalization and repeated whitespace', () => {
    expect(names('PLEASE ADD an ONLINE   STORE with STRIPE PAYMENTS.')).toEqual([commerce, payments])
  })
})

describe('bounded-input robustness', () => {
  it('handles maximum-size repetitive input without duplicate results', () => {
    const agreement = 'Website. '.repeat(2200).slice(0, 20000)
    const request = 'Add payments. '.repeat(350).slice(0, 5000)
    expect(names(request, agreement)).toEqual([payments])
  })
  it('does not infer details for unrecognized features', () => {
    const result = analyzeScope(plain, 'Add a custom inventory forecasting system.')
    expect(result.status).toBe('needs-review')
    expect(result.detectedChanges).toEqual([])
    expect(result.explanation).toContain('does not confirm')
  })
})

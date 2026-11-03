// Content for the Brisbane service pages (SEO Day 3).
// Each entry becomes a page at /<slug>. Keep the wording factual: Aussie Mate is a
// marketplace where customers post a job and cleaners send quotes, so these pages
// describe how that works and what usually affects a quote. No prices, no promises
// about results, and no claims about cleaner checks or insurance.

export const SERVICE_PAGES = [
  {
    slug: 'house-cleaning-brisbane',
    shortName: 'House cleaning',
    title: 'House Cleaning Brisbane | Get Quotes from Local Cleaners | Aussie Mate',
    description:
      'Post your house cleaning job on Aussie Mate and compare quotes from local Brisbane cleaners. One-off, weekly or fortnightly cleans.',
    h1: 'House cleaning in Brisbane',
    intro:
      'Tell us what your home needs, and local Brisbane cleaners send you quotes. You compare, chat with the ones you like, and book the one that suits your home and your budget.',
    includesTitle: 'What house cleaning can include',
    includes: [
      'Vacuuming and mopping floors throughout the home',
      'Kitchen: benchtops, sink, stovetop and the outside of appliances',
      'Bathrooms and toilets: shower, bath, basin, mirrors and floors',
      'Dusting surfaces, skirting boards and light fittings within reach',
      'Bedrooms and living areas, including making beds if you ask',
      'Extras you can request: inside the oven, inside the fridge, windows, balcony',
    ],
    factorsTitle: 'What affects your quote',
    factors: [
      'The size of the home and the number of bedrooms and bathrooms',
      'How often you want the clean: one-off, weekly or fortnightly',
      'The current condition of the home and any pets',
      'Extras such as the oven, fridge, windows or laundry',
      'Whether you need the clean on a weekday, weekend or at short notice',
    ],
    tipsTitle: 'Getting a good result',
    tips: [
      'Write a clear job description. Cleaners quote more accurately when they know the rooms, the size and any problem areas.',
      'Say what matters most, such as the kitchen and bathrooms, so the time is spent where you want it.',
      'Put away loose items and valuables before the clean so surfaces can be wiped properly.',
      'For regular cleans, tell your cleaner what you would like changed after the first visit.',
    ],
    faqs: [
      {
        q: 'How do I get house cleaning quotes in Brisbane?',
        a: 'Post a job on Aussie Mate with your suburb, the size of your home and the date you want. Local cleaners then send quotes that you can compare.',
      },
      {
        q: 'Can I book a regular weekly or fortnightly clean?',
        a: 'Yes. When you post the job you can say how often you want the clean, and cleaners will quote for that schedule.',
      },
      {
        q: 'Do I need to be home during the clean?',
        a: 'That is up to you and the cleaner. You can agree on access in the chat before the day.',
      },
      {
        q: 'What if I need extras like the oven or windows?',
        a: 'List them in your job. Cleaners can include them in the quote so there are no surprises.',
      },
    ],
    related: ['bond-cleaning-brisbane', 'office-cleaning-brisbane'],
  },
  {
    slug: 'bond-cleaning-brisbane',
    shortName: 'Bond cleaning',
    title: 'Bond Cleaning Brisbane | End of Lease Cleaners | Aussie Mate',
    description:
      'Moving out of a rental in Brisbane? Post your end of lease clean on Aussie Mate and compare quotes from local cleaners.',
    h1: 'Bond cleaning and end of lease cleaning in Brisbane',
    intro:
      'Moving out of a rental is busy enough. Post your end of lease clean, get quotes from local Brisbane cleaners, and choose the one that fits your move-out date and your property.',
    includesTitle: 'What an end of lease clean usually covers',
    includes: [
      'Kitchen: oven, stovetop, rangehood, cupboards, drawers and benchtops',
      'Bathrooms: shower screen, tiles, bath, toilet, vanity and mirrors',
      'Floors: vacuuming carpets and mopping hard floors in every room',
      'Wiping down walls, doors, switches, skirting boards and window sills',
      'Inside wardrobes, built-in shelves and storage',
      'Windows, tracks and screens, and balcony or patio if you have one',
    ],
    factorsTitle: 'What affects your quote',
    factors: [
      'The number of bedrooms and bathrooms and the size of the property',
      'Whether the property has carpet that needs a separate steam clean',
      'The current condition, for example a heavily used oven or mould in bathrooms',
      'Extras such as the garage, balcony, blinds or pet treatment',
      'How close your handover date is, since booking earlier gives more choice',
    ],
    tipsTitle: 'Before you book',
    tips: [
      'Ask your property manager or landlord for their cleaning checklist and add it to your job description.',
      'Check your tenancy agreement for any carpet cleaning or pest treatment requirements.',
      'Book a few days before your handover date so there is time to fix anything that was missed.',
      'Take dated photos of the finished property for your own records.',
    ],
    faqs: [
      {
        q: 'How much does bond cleaning cost in Brisbane?',
        a: 'It depends on the size and condition of the property and any extras. Post your job on Aussie Mate and compare the quotes you receive.',
      },
      {
        q: 'Does a bond clean include carpet cleaning?',
        a: 'Not always. Some tenancy agreements require a separate professional carpet clean, so ask cleaners to say clearly in their quote what is included.',
      },
      {
        q: 'Who holds my bond in Queensland?',
        a: 'In Queensland, rental bonds are held by the Residential Tenancies Authority (RTA). Your tenancy paperwork explains how the refund process works.',
      },
      {
        q: 'How early should I book an end of lease clean?',
        a: 'As early as you can once you know your move-out date. Weekends and the end of the month tend to book up first.',
      },
    ],
    related: ['house-cleaning-brisbane', 'commercial-cleaning-brisbane'],
  },
  {
    slug: 'commercial-cleaning-brisbane',
    shortName: 'Commercial cleaning',
    title: 'Commercial Cleaning Brisbane | Compare Quotes | Aussie Mate',
    description:
      'Find commercial cleaners in Brisbane for shops, offices and warehouses. Post your job on Aussie Mate and compare quotes.',
    h1: 'Commercial cleaning in Brisbane',
    intro:
      'From shopfronts to warehouses, a clean workplace is part of how customers see your business. Describe your premises and schedule on Aussie Mate, and local Brisbane cleaners send quotes for you to compare.',
    includesTitle: 'Where commercial cleaning is used',
    includes: [
      'Retail shops and showrooms',
      'Offices and shared workspaces',
      'Warehouses, workshops and depots',
      'Medical and allied health rooms, gyms and studios',
      'Cafes, salons and other customer-facing premises',
      'Common areas, entrances and amenities',
    ],
    factorsTitle: 'What affects your quote',
    factors: [
      'The floor area and the type of flooring',
      'How often you need the clean, such as daily, weekly or one-off',
      'Whether the clean happens before opening, after hours or on weekends',
      'The number of toilets, kitchenettes and high-touch areas',
      'Special requirements, such as waste handling or window cleaning',
    ],
    tipsTitle: 'Setting up a cleaning arrangement',
    tips: [
      'Write the scope as a list of tasks and how often each is done, so every quote covers the same work.',
      'Say how the cleaner will get access and whether alarms or keys are involved.',
      'Start with a trial period so you can adjust the scope after a few visits.',
      'Ask each cleaner to confirm in the chat exactly what is and is not included.',
    ],
    faqs: [
      {
        q: 'Can I get quotes for a regular commercial clean?',
        a: 'Yes. Post the job with your premises type, size and how often you need it, and cleaners will quote for that schedule.',
      },
      {
        q: 'Can cleaning happen after business hours?',
        a: 'You can state your preferred times in the job. Cleaners tell you in their quote whether they can work to them.',
      },
      {
        q: 'What is the difference between commercial and office cleaning?',
        a: 'Office cleaning is one type of commercial cleaning. Commercial covers other workplaces too, such as shops, warehouses and clinics.',
      },
      {
        q: 'Can I use Aussie Mate for a one-off clean?',
        a: 'Yes. A one-off clean before a new lease, an inspection or an event works the same way as a regular job.',
      },
    ],
    related: ['office-cleaning-brisbane', 'bond-cleaning-brisbane'],
  },
  {
    slug: 'office-cleaning-brisbane',
    shortName: 'Office cleaning',
    title: 'Office Cleaning Brisbane | Quotes from Local Cleaners | Aussie Mate',
    description:
      'Post your office cleaning job on Aussie Mate and compare quotes from local Brisbane cleaners. Daily, weekly or one-off cleans.',
    h1: 'Office cleaning in Brisbane',
    intro:
      'A tidy office makes a better place to work and a better first impression for visitors. Tell us about your space and how often it needs cleaning, and local Brisbane cleaners send you quotes.',
    includesTitle: 'What office cleaning can include',
    includes: [
      'Emptying bins and removing rubbish and recycling',
      'Vacuuming carpets and mopping hard floors',
      'Wiping desks, shared tables, meeting rooms and reception',
      'Kitchenette: benchtops, sink, microwave and the outside of the fridge',
      'Toilets and handwash areas, including restocking items you supply',
      'Glass doors, internal windows and entrance areas',
    ],
    factorsTitle: 'What affects your quote',
    factors: [
      'The size of the office and the number of desks and meeting rooms',
      'How often you want the clean, from daily to monthly',
      'Whether the clean takes place before or after working hours',
      'The number of bathrooms and kitchen areas',
      'Extras like carpet cleaning, internal windows or a one-off deep clean',
    ],
    tipsTitle: 'Making office cleaning run smoothly',
    tips: [
      'Ask staff to clear desks at the end of the day so surfaces can be wiped.',
      'Agree on how cleaning supplies and consumables are provided.',
      'Keep a short checklist in the chat so the cleaner and your team are on the same page.',
      'Review the arrangement after the first month and adjust the schedule if needed.',
    ],
    faqs: [
      {
        q: 'How do I find an office cleaner in Brisbane?',
        a: 'Post your job on Aussie Mate with the size of your office and how often you need it. Local cleaners respond with quotes that you can compare and discuss in the chat.',
      },
      {
        q: 'Can I get a daily or weekly office clean?',
        a: 'Yes. State the days and times you prefer in the job and cleaners will quote for that schedule.',
      },
      {
        q: 'Do I have to sign a long contract?',
        a: 'Terms are agreed between you and the cleaner. Ask about notice periods in the chat before you book.',
      },
      {
        q: 'Can I book a one-off deep clean for my office?',
        a: 'Yes. Mention it in the job description, for example before a move, an inspection or a new team starting.',
      },
    ],
    related: ['commercial-cleaning-brisbane', 'house-cleaning-brisbane'],
  },
]

export const getServicePage = (slug) => SERVICE_PAGES.find((p) => p.slug === slug)

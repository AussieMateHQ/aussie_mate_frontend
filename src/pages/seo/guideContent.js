// Helpful guides for Brisbane customers. The text lives here, the layout is in GuidePage.jsx.
export const GUIDE_PAGES = [
  {
    slug: 'bond-cleaning-checklist-brisbane',
    title: 'Bond Cleaning Checklist Brisbane | End of Lease Cleaning Checklist | Aussie Mate',
    description:
      'A room-by-room end of lease cleaning checklist for Brisbane renters. See what to clean, what agents often check, and how to get quotes from local cleaners.',
    h1: 'Bond cleaning checklist for Brisbane renters',
    intro:
      'Use this room-by-room checklist before your final inspection. It covers what a bond clean usually includes and the spots that are easy to miss. Short on time? Post your end of lease clean on Aussie Mate and compare quotes from local Brisbane cleaners.',
    updated: '2026-11-25',
    note:
      'This is a general guide, not legal advice. Your tenancy agreement and your property manager or landlord set the exact requirements. The Residential Tenancies Authority (rta.qld.gov.au) explains the bond refund process in Queensland.',
    sections: [
      {
        title: 'Kitchen',
        items: [
          'Oven: inside the oven, racks, glass door and trays',
          'Stovetop, burners and the area behind and beside the stove',
          'Rangehood: filter and outside surfaces',
          'Cupboards and drawers: wipe inside and outside, including handles',
          'Benchtops, splashback and sink, including the taps and plughole',
          'Fridge, if it belongs to the property: empty, wipe inside and clean the seals',
          'Dishwasher, if there is one: filter and door seals',
        ],
      },
      {
        title: 'Bathrooms and toilet',
        items: [
          'Shower screen, tiles and grout: remove soap scum and mould marks',
          'Bath or shower base, taps and drain covers',
          'Toilet: inside the bowl, the cistern, the seat and around the base',
          'Vanity, sink and cabinet doors, inside and out',
          'Mirrors and exhaust fan covers',
          'Floor and the edges where the floor meets the wall',
        ],
      },
      {
        title: 'Bedrooms and living areas',
        items: [
          'Inside wardrobes, built-in shelves and storage',
          'Skirting boards, door frames and doors',
          'Light switches and power points: wipe the marks around them',
          'Ceiling fans, light fittings and air-conditioner vents',
          'Walls: spot clean marks where you can',
          'Vacuum all carpets and mop hard floors in every room',
        ],
      },
      {
        title: 'Windows, balcony and outside',
        items: [
          'Window glass inside, plus tracks and sills',
          'Flyscreens and blinds',
          'Balcony or patio: sweep and wipe, including rails and the floor',
          'Garage: sweep out and remove cobwebs',
          'Entry area, letterbox and any outdoor areas included in the lease',
        ],
      },
    ],
    oftenMissedTitle: 'Spots that often get missed',
    oftenMissed: [
      'Oven corners and the inside of the oven door',
      'Window tracks and the sills',
      'Ceiling fan blades and light fittings',
      'Cutlery trays and the inside of drawers',
      'Skirting boards and light switches',
      'Shower drains and the grout lines',
      'The tops of cupboards and the insides of wardrobes',
    ],
    timelineTitle: 'A simple plan for the last week',
    timeline: [
      'About 2 weeks before: ask your property manager for their cleaning checklist and read your tenancy agreement for carpet or pest requirements.',
      'About 1 week before: book your cleaner. Weekends and the end of the month fill up first.',
      'The day before handover: do a walk-through with the checklist above and note anything that was missed.',
      'After the clean: take dated photos of every room for your own records.',
    ],
    faqs: [
      {
        q: 'What does a bond clean include?',
        a: 'Usually the kitchen (including the oven and rangehood), bathrooms, floors, walls, switches, skirting boards, wardrobes and windows. Ask each cleaner to say exactly what their quote includes.',
      },
      {
        q: 'Do I need to use a professional cleaner in Queensland?',
        a: 'Check your tenancy agreement and ask your property manager what they require. Whoever cleans, the property needs to be left as clean as it was at the start of the tenancy, apart from fair wear and tear.',
      },
      {
        q: 'Does the checklist include carpet cleaning?',
        a: 'Carpet cleaning is often a separate job. Check your tenancy agreement, and list it in your Aussie Mate job if you need it.',
      },
      {
        q: 'How do I get quotes from Brisbane cleaners?',
        a: 'Post your job on Aussie Mate with your suburb, the size of the property and your handover date. Local cleaners send quotes, and you can chat with them before you book.',
      },
    ],
    related: ['bond-cleaning-brisbane', 'house-cleaning-brisbane'],
  },
]

export const getGuidePage = (slug) => GUIDE_PAGES.find((p) => p.slug === slug)

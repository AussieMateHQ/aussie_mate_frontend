import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Per-page title / description / canonical for the public pages, so each page
// can show up in Google with its own text instead of one shared title.
// Pages not listed here keep the defaults from index.html.
const SITE = 'https://aussiemate.com.au'

const PAGES = {
  '/': {
    title: 'Aussie Mate | Find Cleaners in Brisbane - Post a Job, Get Quotes',
    description:
      'Post your cleaning job on Aussie Mate and get quotes from local Brisbane cleaners. Bond cleaning, end of lease, house cleaning and more, on the website or the mobile app.',
  },
  '/services': {
    title: 'Cleaning Services in Brisbane | Aussie Mate',
    description:
      'Bond and end of lease cleaning, house cleaning, commercial cleaning, housekeeping and more. Post a job on Aussie Mate and compare quotes from local Brisbane cleaners.',
  },
  '/about': {
    title: 'About Aussie Mate | Brisbane Cleaning Marketplace',
    description:
      'Aussie Mate is a Brisbane cleaning marketplace that connects customers with local cleaners. Post a job, compare quotes, chat and track your job in one place.',
  },
  '/contact': {
    title: 'Contact Aussie Mate | Brisbane Cleaning Marketplace',
    description: 'Questions about posting a cleaning job or becoming a cleaner on Aussie Mate? Get in touch with our team.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Aussie Mate',
    description: 'How Aussie Mate collects, uses and protects your information.',
  },
  '/terms-and-conditions': {
    title: 'Terms and Conditions | Aussie Mate',
    description: 'The terms for using the Aussie Mate website and mobile app.',
  },
}

const setMeta = (selector, create, value) => {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}

export default function usePageSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const key = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
    const page = PAGES[key]
    if (!page) return

    document.title = page.title

    const desc = setMeta('meta[name="description"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('name', 'description')
      return m
    })
    desc.setAttribute('content', page.description)

    const canonical = setMeta('link[rel="canonical"]', () => {
      const l = document.createElement('link')
      l.setAttribute('rel', 'canonical')
      return l
    })
    canonical.setAttribute('href', key === '/' ? `${SITE}/` : `${SITE}${key}`)
  }, [pathname])
}

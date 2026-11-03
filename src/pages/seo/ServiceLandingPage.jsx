import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import { getServicePage } from './serviceContent'

const SITE = 'https://aussiemate.com.au'

// One template for the four Brisbane service pages. The text lives in serviceContent.js.
export default function ServiceLandingPage({ slug }) {
  const navigate = useNavigate()
  const page = getServicePage(slug)

  // Structured data (service + FAQ) so Google can read what the page is about.
  useEffect(() => {
    if (!page) return undefined
    const data = [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${page.shortName} in Brisbane`,
        serviceType: page.shortName,
        description: page.description,
        url: `${SITE}/${page.slug}`,
        areaServed: { '@type': 'City', name: 'Brisbane', containedInPlace: { '@type': 'AdministrativeArea', name: 'Queensland, Australia' } },
        provider: { '@type': 'Organization', name: 'Aussie Mate', url: `${SITE}/` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ]
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = 'service-page-jsonld'
    el.text = JSON.stringify(data)
    document.head.appendChild(el)
    return () => {
      el.remove()
    }
  }, [page])

  if (!page) return null

  const related = page.related.map((s) => getServicePage(s)).filter(Boolean)

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-white relative">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Aussiemate" className="h-10 sm:h-12 md:h-14 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-600 absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <Link to="/services" className="hover:text-gray-900 transition-colors">Services</Link>
          <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
        </nav>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2 font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Log in
        </button>
      </header>

      <main>
        <section className="bg-[#1B222C] py-16 md:py-20 px-6 text-white">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="text-sm text-[#6A8CA7] mb-4">
              <Link to="/" className="hover:text-white">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/services" className="hover:text-white">Services</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-300">{page.shortName}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">{page.h1}</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">{page.intro}</p>
            <button
              onClick={() => navigate('/post-new-job')}
              className="px-8 py-3 bg-[#E58B2E] text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Post a job and get quotes
            </button>
          </div>
        </section>

        <section className="py-14 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold mb-4">{page.includesTitle}</h2>
              <ul className="space-y-3 text-gray-700 list-disc pl-5">
                {page.includes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">{page.factorsTitle}</h2>
              <ul className="space-y-3 text-gray-700 list-disc pl-5">
                {page.factors.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-14 px-6 bg-[#F6F5F0]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">How it works on Aussie Mate</h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <li className="bg-white rounded-2xl p-6">
                <p className="font-bold mb-2">1. Post your job</p>
                <p className="text-gray-700">Describe the work, your Brisbane suburb and the date you want.</p>
              </li>
              <li className="bg-white rounded-2xl p-6">
                <p className="font-bold mb-2">2. Compare quotes</p>
                <p className="text-gray-700">Local cleaners send quotes. Chat with them to confirm what is included.</p>
              </li>
              <li className="bg-white rounded-2xl p-6">
                <p className="font-bold mb-2">3. Book and track</p>
                <p className="text-gray-700">Choose a cleaner, book the job and follow it on the website or the mobile app.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{page.tipsTitle}</h2>
            <ul className="space-y-3 text-gray-700 list-disc pl-5">
              {page.tips.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="py-14 px-6 bg-[#F6F5F0]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {page.faqs.map((f) => (
                <div key={f.q} className="bg-white rounded-2xl p-6">
                  <h3 className="font-bold mb-2">{f.q}</h3>
                  <p className="text-gray-700">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Other Brisbane services</h2>
            <ul className="flex flex-wrap gap-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/${r.slug}`}
                    className="inline-block px-4 py-2 border border-gray-300 rounded-full text-[#1E5D88] font-medium hover:bg-gray-50"
                  >
                    {r.h1}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/services" className="inline-block px-4 py-2 border border-gray-300 rounded-full text-[#1E5D88] font-medium hover:bg-gray-50">
                  All services
                </Link>
              </li>
            </ul>
          </div>
        </section>

        <section className="py-16 px-6 bg-[#1B222C] text-center text-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to get quotes?</h2>
            <p className="text-gray-300 mb-8">Post your {page.shortName.toLowerCase()} job and local Brisbane cleaners will get back to you.</p>
            <button
              onClick={() => navigate('/post-new-job')}
              className="px-8 py-3 bg-[#E58B2E] text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Post a job
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import { getGuidePage } from './guideContent'
import { getServicePage } from './serviceContent'

const SITE = 'https://aussiemate.com.au'

// One template for helpful guides (checklists, how-tos). The text lives in guideContent.js.
export default function GuidePage({ slug }) {
  const navigate = useNavigate()
  const page = getGuidePage(slug)

  // Structured data (article + FAQ) so Google can read what the page is about.
  useEffect(() => {
    if (!page) return undefined
    const data = [
      {
        '@context': 'https://schema.org',
        '@type': page.schemaType || 'Article',
        [page.schemaType === 'WebPage' ? 'name' : 'headline']: page.h1,
        description: page.description,
        dateModified: page.updated,
        mainEntityOfPage: `${SITE}/${page.slug}`,
        author: { '@type': 'Organization', name: 'Aussie Mate', url: `${SITE}/` },
        publisher: { '@type': 'Organization', name: 'Aussie Mate', url: `${SITE}/` },
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
    el.id = 'guide-page-jsonld'
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
              <Link to={page.crumbParent ? page.crumbParent.to : '/bond-cleaning-brisbane'} className="hover:text-white">{page.crumbParent ? page.crumbParent.label : 'Bond cleaning'}</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-300">{page.crumb}</span>
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
            {page.sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-2xl font-bold mb-4">{s.title}</h2>
                <ul className="space-y-3 text-gray-700 list-disc pl-5">
                  {s.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14 px-6 bg-[#F6F5F0]">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold mb-4">{page.oftenMissedTitle}</h2>
              <ul className="space-y-3 text-gray-700 list-disc pl-5">
                {page.oftenMissed.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">{page.timelineTitle}</h2>
              <ol className="space-y-3 text-gray-700 list-decimal pl-5">
                {page.timeline.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {page.faqs.map((f) => (
                <div key={f.q} className="bg-[#F6F5F0] rounded-2xl p-6">
                  <h3 className="font-bold mb-2">{f.q}</h3>
                  <p className="text-gray-700">{f.a}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6">{page.note}</p>
          </div>
        </section>

        <section className="py-14 px-6 bg-[#F6F5F0]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Related Brisbane services</h2>
            <ul className="flex flex-wrap gap-3">
              {(page.moreGuides || []).map((g) => (
                <li key={g.slug}>
                  <Link
                    to={`/${g.slug}`}
                    className="inline-block px-4 py-2 border border-gray-300 rounded-full text-[#1E5D88] font-medium hover:bg-white"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/${r.slug}`}
                    className="inline-block px-4 py-2 border border-gray-300 rounded-full text-[#1E5D88] font-medium hover:bg-white"
                  >
                    {r.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 px-6 bg-[#1B222C] text-center text-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to get quotes?</h2>
            <p className="text-gray-300 mb-8">{page.cta}</p>
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

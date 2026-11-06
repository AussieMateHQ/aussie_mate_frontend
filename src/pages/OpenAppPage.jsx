import React, { useEffect } from 'react'
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/appLinks'

// Landing target for the "Reply" / "View message history" buttons in the
// customer chat email. On a phone it sends the visitor straight to the right
// app store; on a computer it shows both store links.
const OpenAppPage = () => {
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || ''
    if (/android/i.test(ua)) {
      window.location.replace(PLAY_STORE_URL)
    } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      window.location.replace(APP_STORE_URL)
    }
  }, [])

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-custom p-8 text-center">
        <h1 className="text-xl font-semibold text-primary-500 mb-2">
          Open Aussie Mate on your phone
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Get the Aussie Mate app to read your messages and reply to cleaners.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={APP_STORE_URL}
            className="block rounded-lg bg-black text-white py-3 font-medium"
          >
            Download on the App Store
          </a>
          <a
            href={PLAY_STORE_URL}
            className="block rounded-lg bg-black text-white py-3 font-medium"
          >
            Get it on Google Play
          </a>
        </div>
      </div>
    </div>
  )
}

export default OpenAppPage


import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import AppLayout from '../../components/layout/AppLayout';

const PlatformPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 px-8">
        <PageHeader
          title="Platform Policy"
          onBack={() => navigate(-1)}
          className="mb-4 sm:mb-6"
          titleClassName="text-base sm:text-lg md:text-xl font-semibold text-primary-500"
        />
        
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-8">
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              AUSSIEMATE PLATFORM POLICY (LEAD‑GENERATION MODEL)
            </h1>
            <p className="text-gray-500">Effective Date: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Section 1: Definitions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. DEFINITIONS</h2>
            <p className="text-gray-700 mb-4">For clarity throughout this document:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>AUSSIEMATE</strong> – The digital marketplace and lead‑generation platform.</li>
              <li><strong>Platform</strong> – The AUSSIEMATE website, mobile app, and related services.</li>
              <li><strong>Customer</strong> – Any user posting a job request or seeking service providers.</li>
              <li><strong>Contractor</strong> – Any independent business or worker purchasing leads through the platform.</li>
              <li><strong>User</strong> – Any individual using the platform (customer or contractor).</li>
              <li><strong>Lead</strong> – A customer job request or enquiry sent to one or more contractors.</li>
              <li><strong>Lead Fee</strong> – The fee charged to contractors for receiving a lead.</li>
              <li><strong>Subscription</strong> – Any paid plan that provides contractors access to leads or platform features.</li>
              <li><strong>User Content</strong> – Any photos, messages, descriptions, or information uploaded to the platform.</li>
              <li><strong>Job Contract</strong> – The private agreement between customer and contractor. AUSSIEMATE is not a party to this contract.</li>
            </ul>
          </section>

          {/* Section 2: User Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. USER ELIGIBILITY</h2>
            <p className="text-gray-700 mb-4">All users must:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and truthful information</li>
              <li>Not create multiple accounts</li>
              <li>Not impersonate another person</li>
              <li>Not use the platform if previously banned</li>
              <li>Comply with all Australian laws</li>
            </ul>
            <p className="text-gray-700 mt-4">
              AUSSIEMATE may request identity verification at any time.
            </p>
          </section>

          {/* Section 3: Platform Overview */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. PLATFORM OVERVIEW</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 About AUSSIEMATE</h3>
              <p className="text-gray-700 leading-relaxed">
                AUSSIEMATE is a lead‑generation marketplace connecting customers with independent contractors. 
                The platform does not provide services, supervise work, or guarantee outcomes.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Legal Position</h3>
              <p className="text-gray-700 mb-3">AUSSIEMATE:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Is not the employer of any contractor</li>
                <li>Does not supervise or control how work is performed</li>
                <li>Does not guarantee quality, safety, or results</li>
                <li>Does not provide insurance</li>
                <li>Does not handle job payments</li>
                <li>Is not liable for customer or contractor behaviour</li>
              </ul>
              <p className="text-gray-700 mt-3 font-medium">
                All contractors operate as independent businesses.
              </p>
            </div>
          </section>

          {/* Section 4: Customer Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. CUSTOMER POLICY</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Job Posting Requirements</h3>
              <p className="text-gray-700 mb-3">Customers must ensure job listings:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Are accurate and complete</li>
                <li>Include correct location and access details</li>
                <li>Are safe and lawful</li>
                <li>Reflect a reasonable job description</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Customer Privacy</h3>
              <p className="text-gray-700 mb-3">Customer contact details remain hidden until:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>The customer chooses to share them with a contractor, or</li>
                <li>The platform automatically releases them as part of a lead</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Payment Conditions</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>AUSSIEMATE does not handle job payments.</li>
                <li>Customers pay contractors directly.</li>
                <li>AUSSIEMATE is not responsible for pricing, quotes, or payment disputes.</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Customer Conduct</h3>
              <p className="text-gray-700 mb-3">Customers must:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Communicate respectfully</li>
                <li>Provide safe access</li>
                <li>Not request illegal or unsafe tasks</li>
                <li>Not request personal information</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.5 Prohibited Job Types</h3>
              <p className="text-gray-700 mb-3">Customers may not post:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Illegal activities</li>
                <li>High‑risk licensed work (unless contractor is licensed)</li>
                <li>Medical or personal care tasks</li>
                <li>Tasks involving minors without supervision</li>
                <li>Tasks requiring insurance</li>
                <li>Hazardous or dangerous tasks</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Contractor Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. CONTRACTOR POLICY</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Eligibility Requirements</h3>
              <p className="text-gray-700 mb-3">Contractors must:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Be 18+</li>
                <li>Hold a valid ABN</li>
                <li>Provide accurate identity information</li>
                <li>Have the right to work in Australia</li>
                <li>Possess relevant skills</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Contractor Responsibilities</h3>
              <p className="text-gray-700 mb-3">Contractors must:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Communicate professionally</li>
                <li>Provide accurate quotes</li>
                <li>Attend jobs they agree to</li>
                <li>Follow WHS requirements</li>
                <li>Respect customer property</li>
                <li>Maintain their own insurance</li>
                <li>Not misuse customer information</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Lead Purchases</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Contractors pay for leads, not guaranteed jobs.</li>
                <li>Lead fees are non‑refundable, even if:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>The customer does not respond</li>
                    <li>The customer chooses another contractor</li>
                    <li>The job is cancelled</li>
                    <li>The customer provides incorrect information</li>
                    <li>The contractor is unavailable</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Prohibited Contractor Conduct</h3>
              <p className="text-gray-700 mb-3">Contractors must not:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Steal or damage property</li>
                <li>Harass or threaten customers</li>
                <li>Misrepresent skills</li>
                <li>Perform unsafe or illegal work</li>
                <li>Circumvent the platform</li>
                <li>Share customer details</li>
                <li>Create fake jobs or accounts</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Lead System Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. LEAD SYSTEM POLICY</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Lead Distribution</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>A lead may be sent to one or multiple contractors.</li>
                <li>AUSSIEMATE does not guarantee job allocation.</li>
                <li>Contractors are responsible for contacting the customer.</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Lead Fees</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Lead fees are charged when a contractor receives customer details.</li>
                <li>Lead fees are non‑refundable under all circumstances.</li>
                <li>Lead fees may vary based on category, location, or demand.</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 No Guarantees</h3>
              <p className="text-gray-700 mb-3">AUSSIEMATE does not guarantee:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Customer response</li>
                <li>Job acceptance</li>
                <li>Job completion</li>
                <li>Customer accuracy</li>
                <li>Customer reliability</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Customer–Contractor Contract</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All job agreements are strictly between customer and contractor.</li>
                <li>AUSSIEMATE is not a party to any contract.</li>
                <li>AUSSIEMATE does not mediate job disputes.</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Safety & Risk Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. SAFETY & RISK POLICY</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">All users must:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Follow WHS laws</li>
                <li>Avoid unsafe environments</li>
                <li>Stop work if hazards arise</li>
                <li>Report safety concerns</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Restricted Work</h3>
              <p className="text-gray-700 mb-3">Contractors must not perform:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Electrical work (unless licensed)</li>
                <li>Plumbing (unless licensed)</li>
                <li>Roofing or height‑related work</li>
                <li>Asbestos handling</li>
                <li>Confined space work</li>
                <li>Any task requiring insurance</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Insurance Notice</h3>
              <p className="text-gray-700 mb-3">AUSSIEMATE does not provide:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Public liability insurance</li>
                <li>Workers compensation</li>
                <li>Property damage cover</li>
                <li>Personal injury cover</li>
              </ul>
              <p className="text-gray-700 mt-3 font-medium">
                Contractors are responsible for their own insurance.
              </p>
            </div>
          </section>

          {/* Section 8: Service Category Standards */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. SERVICE CATEGORY STANDARDS</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Commercial Cleaning</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Safe chemical use</li>
                <li>Site access compliance</li>
                <li>Confidentiality</li>
                <li>Immediate damage reporting</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Student Cleaner</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Basic cleaning only</li>
                <li>No chemical use unless trained</li>
                <li>No heavy lifting</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Pet Sitting</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Follow owner instructions</li>
                <li>No guests in client homes</li>
                <li>Provide updates</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.4 Non‑NDIS Home Support</h3>
              <div className="mb-4">
                <p className="text-gray-700 font-medium mb-2">Permitted:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Light domestic cleaning</li>
                  <li>Meal prep (non‑medical)</li>
                  <li>Grocery shopping</li>
                  <li>Laundry</li>
                  <li>Social companionship</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-2">Not permitted:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Personal care</li>
                  <li>Medication handling</li>
                  <li>Lifting clients</li>
                  <li>Medical tasks</li>
                </ul>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.5 Handyman Services</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Only tasks within skill level</li>
                <li>No licensed trade work unless qualified</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.6 Housekeeping</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Respect belongings</li>
                <li>Follow laundry rules</li>
                <li>Maintain privacy</li>
              </ul>
            </div>
          </section>

          {/* Section 9: User Content & Communication */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. USER CONTENT & COMMUNICATION</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">Users must not upload or send:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Abusive or threatening messages</li>
                <li>False or misleading information</li>
                <li>Inappropriate photos</li>
                <li>Illegal content</li>
              </ul>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">AUSSIEMATE may use content for:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Dispute review</li>
                <li>Safety checks</li>
                <li>Platform improvement</li>
              </ul>
            </div>
            <p className="text-gray-700">
              AUSSIEMATE may remove content or suspend accounts at its discretion.
            </p>
          </section>

          {/* Section 10: Prohibited Use of Platform */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. PROHIBITED USE OF PLATFORM</h2>
            <p className="text-gray-700 mb-3">Users must not:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Circumvent AUSSIEMATE fees</li>
              <li>Arrange off‑platform payments</li>
              <li>Advertise external services</li>
              <li>Create fake jobs or accounts</li>
              <li>Engage in fraud or scams</li>
              <li>Harass or abuse others</li>
            </ul>
          </section>

          {/* Section 11: Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. INTELLECTUAL PROPERTY</h2>
            <p className="text-gray-700 mb-3">
              All AUSSIEMATE branding, logos, designs, text, images, and technology belong to AUSSIEMATE.
            </p>
            <p className="text-gray-700 mb-3">Users may not:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Copy, Reproduce, Modify, Distribute, or Reverse‑engineer</li>
            </ul>
          </section>

          {/* Section 12: Account Termination Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. ACCOUNT TERMINATION RIGHTS</h2>
            <p className="text-gray-700 mb-3">AUSSIEMATE may suspend or terminate accounts for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Fraud, Safety risks, Abuse or harassment, Illegal activity, Breach of policies, or Misuse of the platform</li>
            </ul>
            <p className="text-gray-700 mt-4">Termination may be immediate and without notice.</p>
          </section>

          {/* Section 13: Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. DISPUTE RESOLUTION</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">AUSSIEMATE may request:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Photos, Messages, or Job notes</li>
              </ul>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">AUSSIEMATE may:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Review evidence, Remove users, or Restrict accounts</li>
              </ul>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-3 font-medium">AUSSIEMATE does not:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Guarantee outcomes, Mediate job disputes, Force refunds, or Accept liability</li>
              </ul>
            </div>
            <p className="text-gray-700">
              All job disputes must be resolved directly between customer and contractor.
            </p>
          </section>

          {/* Section 14: Fees & Charges */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. FEES & CHARGES</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Lead Fees</h3>
              <p className="text-gray-700">Charged when a contractor receives customer details.</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Subscription Fees</h3>
              <p className="text-gray-700">Optional paid plans may apply.</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 GST</h3>
              <p className="text-gray-700">All AUSSIEMATE fees include GST.</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.4 No Refund Policy</h3>
              <p className="text-gray-700 font-medium text-red-600">Lead fees and subscription fees are non‑refundable.</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.5 Fee Updates</h3>
              <p className="text-gray-700">AUSSIEMATE may update fees at any time.</p>
            </div>
          </section>

          {/* Section 15: Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. LIMITATION OF LIABILITY</h2>
            <p className="text-gray-700 mb-3">AUSSIEMATE is not liable for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Injury, Property damage, Theft, Loss of income, Misconduct, Poor workmanship, Incorrect job information, Delays or cancellations, Customer behaviour, or Contractor behaviour</li>
            </ul>
            <p className="text-gray-700 mt-3 font-medium">
              Users accept full responsibility for their actions.
            </p>
          </section>

          {/* Section 16: Indemnity */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. INDEMNITY</h2>
            <p className="text-gray-700 mb-3">Users agree to indemnify AUSSIEMATE against:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Claims, Losses, Damages, Legal costs, or Liabilities</li>
            </ul>
            <p className="text-gray-700 mt-3">
              arising from their actions, negligence, or breach of these policies.
            </p>
          </section>

          {/* Section 17: Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. GOVERNING LAW</h2>
            <p className="text-gray-700">
              These policies are governed by the laws of Queensland, Australia.
            </p>
          </section>

          {/* Section 18: Amendments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. AMENDMENTS</h2>
            <p className="text-gray-700 mb-3">
              AUSSIEMATE may update these policies at any time.
            </p>
            <p className="text-gray-700">
              Continued use of the platform indicates acceptance.
            </p>
          </section>

          {/* Section 19: Severability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. SEVERABILITY</h2>
            <p className="text-gray-700">
              If any part is invalid, the remaining sections remain enforceable.
            </p>
          </section>

          {/* Section 20: App Store Compliance & Verification Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">20. APP STORE COMPLIANCE & VERIFICATION POLICY</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>AUSSIEMATE is a lead‑generation platform</li>
              <li>Apple is not responsible for payments or disputes</li>
              <li>All payments are between customer and contractor</li>
              <li>AUSSIEMATE complies with the Australian Privacy Act</li>
              <li>User content may be moderated</li>
              <li>The app is for lawful use within Australia</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default PlatformPolicyPage;

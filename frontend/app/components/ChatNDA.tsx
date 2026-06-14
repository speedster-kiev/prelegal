'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface NDAFields {
  purpose?: string
  effectiveDate?: string
  mndaTermType?: 'years' | 'until-terminated'
  mndaTermYears?: string
  confidentialityTermType?: 'years' | 'in-perpetuity'
  confidentialityTermYears?: string
  governingLaw?: string
  jurisdiction?: string
  modifications?: string
  party1Name?: string
  party1Title?: string
  party1Company?: string
  party1Address?: string
  party2Name?: string
  party2Title?: string
  party2Company?: string
  party2Address?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const STANDARD_TERMS = `1. **Introduction**. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("**MNDA**") allows each party ("**Disclosing Party**") to disclose or make available information in connection with the <span class="coverpage_link">Purpose</span> which (1) the Disclosing Party identifies to the receiving party ("**Receiving Party**") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("**Confidential Information**"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("**Cover Page**"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.

2. **Use and Protection of Confidential Information**. The Receiving Party shall: (a) use Confidential Information solely for the <span class="coverpage_link">Purpose</span>; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the <span class="coverpage_link">Purpose</span>, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.

3. **Exceptions**. The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.

4. **Disclosures Required by Law**. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.

5. **Term and Termination**. This MNDA commences on the <span class="coverpage_link">Effective Date</span> and expires at the end of the <span class="coverpage_link">MNDA Term</span>. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the <span class="coverpage_link">Term of Confidentiality</span>, despite any expiration or termination of this MNDA.

6. **Return or Destruction of Confidential Information**. Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.

7. **Proprietary Rights**. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.

8. **Disclaimer**. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

9. **Governing Law and Jurisdiction**. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of <span class="coverpage_link">Governing Law</span>, without regard to the conflict of laws provisions of such <span class="coverpage_link">Governing Law</span>. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in <span class="coverpage_link">Jurisdiction</span>. Each party irrevocably submits to the exclusive jurisdiction of such <span class="coverpage_link">Jurisdiction</span> in any such suit, action, or proceeding.

10. **Equitable Relief**. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.

11. **General**. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.`

const OPENER =
  "Hi! I'm your Mutual NDA assistant. Let's get your agreement drafted.\n\nTo start — what's the purpose of this NDA, and what are the names of the two companies involved?"

const CORE_FIELDS: (keyof NDAFields)[] = [
  'purpose', 'effectiveDate', 'mndaTermType', 'confidentialityTermType',
  'governingLaw', 'jurisdiction', 'modifications',
  'party1Name', 'party1Title', 'party1Company', 'party1Address',
  'party2Name', 'party2Title', 'party2Company', 'party2Address',
]

function filledCount(fields: NDAFields): number {
  return CORE_FIELDS.filter((k) => !!fields[k]).length
}

function isComplete(fields: NDAFields): boolean {
  return (
    filledCount(fields) === CORE_FIELDS.length &&
    (fields.mndaTermType !== 'years' || !!fields.mndaTermYears) &&
    (fields.confidentialityTermType !== 'years' || !!fields.confidentialityTermYears)
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '[Effective Date]'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const monthIdx = parseInt(month, 10) - 1
  if (monthIdx < 0 || monthIdx > 11 || isNaN(monthIdx)) return dateStr
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[monthIdx]} ${parseInt(day, 10)}, ${year}`
}

function processTerms(fields: NDAFields): string {
  const mndaTerm =
    fields.mndaTermType === 'years'
      ? `${escapeHtml(fields.mndaTermYears || '1')} year(s) from the Effective Date`
      : fields.mndaTermType === 'until-terminated'
      ? 'until terminated by either party'
      : '[MNDA Term]'

  const confTerm =
    fields.confidentialityTermType === 'years'
      ? `${escapeHtml(fields.confidentialityTermYears || '1')} year(s) from the Effective Date`
      : fields.confidentialityTermType === 'in-perpetuity'
      ? 'in perpetuity'
      : '[Term of Confidentiality]'

  const field = (val: string) =>
    `<span style="color:#209dd7;font-weight:600">${val}</span>`

  return STANDARD_TERMS
    .replace(/<span class="coverpage_link">Purpose<\/span>/g, field(escapeHtml(fields.purpose || '[Purpose]')))
    .replace(/<span class="coverpage_link">Effective Date<\/span>/g, field(escapeHtml(formatDate(fields.effectiveDate))))
    .replace(/<span class="coverpage_link">MNDA Term<\/span>/g, field(mndaTerm))
    .replace(/<span class="coverpage_link">Term of Confidentiality<\/span>/g, field(confTerm))
    .replace(/<span class="coverpage_link">Governing Law<\/span>/g, field(escapeHtml(fields.governingLaw || '[Governing Law]')))
    .replace(/<span class="coverpage_link">Jurisdiction<\/span>/g, field(escapeHtml(fields.jurisdiction || '[Jurisdiction]')))
}

export default function ChatNDA() {
  // messages tracks only the actual API exchange — the opener is rendered as a static UI element
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [fields, setFields] = useState<NDAFields>({})
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const complete = isComplete(fields)
  const progress = filledCount(fields)

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      setFields((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(data.fields as Record<string, unknown>)) {
          if (v !== null && v !== undefined && v !== '') {
            (next as Record<string, unknown>)[k] = v
          }
        }
        return next
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, something went wrong. Please try again." },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleDownload() {
    const element = document.getElementById('nda-document')
    if (!element) return
    const { default: html2pdf } = await import('html2pdf.js')
    html2pdf()
      .set({
        margin: [0.75, 0.75],
        filename: 'mutual-nda.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(element)
      .save()
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm z-10">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#032147' }}>
            Mutual NDA Creator
          </h1>
          <p className="text-xs" style={{ color: '#888888' }}>
            Chat with AI to draft your agreement
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!complete}
          title={complete ? 'Download PDF' : 'Complete all fields to download'}
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#753991' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {complete ? 'Download PDF' : `${progress}/${CORE_FIELDS.length} fields`}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <aside className="w-96 flex-shrink-0 flex flex-col border-r bg-gray-50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Static opener — not sent to the API */}
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 text-gray-800 shadow-sm">
                {OPENER}
              </div>
            </div>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: '#753991' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#888888', animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#888888', animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#888888', animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Progress bar */}
          <div className="px-4 py-2 border-t bg-white">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#888888' }}>
              <span>Fields gathered</span>
              <span style={{ color: complete ? '#209dd7' : '#888888' }}>
                {progress}/{CORE_FIELDS.length}
                {complete && ' ✓'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress / CORE_FIELDS.length) * 100}%`,
                  backgroundColor: complete ? '#209dd7' : '#ecad0a',
                }}
              />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ '--tw-ring-color': '#209dd7' } as React.CSSProperties}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#753991' }}
              >
                Send
              </button>
            </div>
          </div>
        </aside>

        {/* Document Preview */}
        <main className="flex-1 overflow-y-auto bg-gray-100 py-8 px-6">
          <div
            id="nda-document"
            className="max-w-3xl mx-auto bg-white shadow-lg px-16 py-12 font-serif text-gray-900 text-sm leading-relaxed"
          >
            {/* Cover Page */}
            <h1 className="text-xl font-bold text-center mb-6 font-sans">
              Mutual Non-Disclosure Agreement
            </h1>

            <p className="text-xs text-gray-600 mb-6">
              This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover Page
              (&ldquo;Cover Page&rdquo;) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0
              (&ldquo;Standard Terms&rdquo;) identical to those posted at commonpaper.com/standards/mutual-nda/1.0.
              Any modifications of the Standard Terms should be made on the Cover Page, which will control over
              conflicts with the Standard Terms.
            </p>

            <div className="space-y-5 mb-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  Purpose
                </h2>
                <p className="text-xs italic text-gray-500 mb-1">How Confidential Information may be used</p>
                <p>{fields.purpose || <span className="text-gray-400">[Purpose]</span>}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  Effective Date
                </h2>
                <p>
                  {fields.effectiveDate ? (
                    formatDate(fields.effectiveDate)
                  ) : (
                    <span className="text-gray-400">[Effective Date]</span>
                  )}
                </p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  MNDA Term
                </h2>
                <p className="text-xs italic text-gray-500 mb-1">The length of this MNDA</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">
                      {fields.mndaTermType === 'years' ? '☑' : '☐'}
                    </span>
                    <span>Expires {fields.mndaTermYears || '1'} year(s) from Effective Date.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">
                      {fields.mndaTermType === 'until-terminated' ? '☑' : '☐'}
                    </span>
                    <span>Continues until terminated in accordance with the terms of the MNDA.</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  Term of Confidentiality
                </h2>
                <p className="text-xs italic text-gray-500 mb-1">How long Confidential Information is protected</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">
                      {fields.confidentialityTermType === 'years' ? '☑' : '☐'}
                    </span>
                    <span>
                      {fields.confidentialityTermYears || '1'} year(s) from Effective Date, but in the case of
                      trade secrets until Confidential Information is no longer considered a trade secret under
                      applicable laws.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">
                      {fields.confidentialityTermType === 'in-perpetuity' ? '☑' : '☐'}
                    </span>
                    <span>In perpetuity.</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  Governing Law &amp; Jurisdiction
                </h2>
                <p>
                  <strong>Governing Law:</strong>{' '}
                  {fields.governingLaw || <span className="text-gray-400">[Fill in state]</span>}
                </p>
                <p>
                  <strong>Jurisdiction:</strong>{' '}
                  {fields.jurisdiction || <span className="text-gray-400">[Fill in city or county and state]</span>}
                </p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2 font-sans">
                  MNDA Modifications
                </h2>
                <p>
                  {fields.modifications || <span className="text-gray-400">None</span>}
                </p>
              </div>
            </div>

            <p className="mb-5">
              By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
            </p>

            {/* Signature table */}
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="text-xs font-bold text-center font-sans">
                  <th className="text-left pr-3 py-2 font-normal text-gray-400 w-1/4"></th>
                  <th className="py-2 px-3 border border-gray-300 bg-gray-50 w-[37.5%]">PARTY 1</th>
                  <th className="py-2 px-3 border border-gray-300 bg-gray-50 w-[37.5%]">PARTY 2</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold align-top">Signature</td>
                  <td className="px-3 py-3 border border-gray-300 h-10"></td>
                  <td className="px-3 py-3 border border-gray-300 h-10"></td>
                </tr>
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold">Print Name</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party1Name}</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party2Name}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold">Title</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party1Title}</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party2Title}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold">Company</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party1Company}</td>
                  <td className="px-3 py-3 border border-gray-300">{fields.party2Company}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold align-top">
                    <div>Notice Address</div>
                    <div className="font-normal text-gray-400">Use either email or postal address</div>
                  </td>
                  <td className="px-3 py-3 border border-gray-300 whitespace-pre-wrap">{fields.party1Address}</td>
                  <td className="px-3 py-3 border border-gray-300 whitespace-pre-wrap">{fields.party2Address}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-3 text-gray-500 font-sans font-semibold">Date</td>
                  <td className="px-3 py-3 border border-gray-300"></td>
                  <td className="px-3 py-3 border border-gray-300"></td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs text-gray-400 mb-2">
              Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
            </p>

            {/* Standard Terms */}
            <div className="mt-10 pt-8 border-t-2 border-gray-300">
              <h1 className="text-xl font-bold text-center mb-6 font-sans">Standard Terms</h1>

              <div className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-4 [&_li]:leading-relaxed [&_p]:my-0">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {processTerms(fields)}
                </ReactMarkdown>
              </div>

              <p className="text-xs text-gray-400 mt-8">
                Common Paper Mutual Non-Disclosure Agreement{' '}
                <a
                  href="https://commonpaper.com/standards/mutual-nda/1.0/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Version 1.0
                </a>{' '}
                free to use under{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CC BY 4.0
                </a>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

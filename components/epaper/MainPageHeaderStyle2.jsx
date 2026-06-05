/**
 * Main header Style 2 — Telugu Prabha–style layout (pin-to-pin).
 * Fills parent slot (header-library scales to tabloid/broadsheet px size).
 */
import React from 'react'
import { mainHeaderMetrics } from '../../lib/epaper/headerTypography'

const FONT_TEL = 'Mandali, "Noto Sans Telugu", Georgia, serif'
const FONT_SANS = "'Inter', system-ui, sans-serif"

function splitLines(text, max = 6) {
  return String(text || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max)
}

function splitPoints(text, max = 4) {
  return String(text || '')
    .split(/[\n•]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max)
}

function splitPublishedAreas(text) {
  return String(text || '')
    .split(/[•,|]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export default function MainPageHeaderStyle2({ s = {}, pt = 'broadsheet' }) {
  const isBroad = pt === 'broadsheet'
  const { ratio: r } = mainHeaderMetrics(pt)
  const inR = (v) => `${Math.round(v * r * 1000) / 1000}in`
  const centerImage = s.paperNameImageUrl || s.logoUrl || ''
  const rightThumb = s.adRightUrl || s.adUrl || ''

  const leftLines = splitLines(
    s.runningCommentText ||
      'జర్నలిజం పడలు\nప్రారంభించిన అమెరికా\nఅనుకూల భాషనే\nపెట్టిన పలక',
    5
  )
  const leftAuthor = s.runningCommentAuthor || s.sectionName || '- సి.ఎన్.రంగనాథ్'
  const rightTitle = s.rightArticleTitle || s.paperNameEn || 'కరోనా విజృంభణపై కేంద్ర అప్రమత్తం'
  const rightPoints = splitPoints(
    s.rightArticlePoints || s.rightArticleBody || 'నిశితంగా గమనిస్తున్నామని\nకేంద్ర ఆరోగ్య శాఖ\nదేశంలో కరోనా పెరుగుదల',
    4
  )
  const cities = splitPublishedAreas(s.publishedAreas)
  const website = s.websiteUrl || s.paperNameEn || 'www.teluguprabha.net'
  const pageNum = s.pageNumber || '2'

  const logoSize = isBroad ? inR(1.55) : inR(1.3)
  const labelH = isBroad ? inR(0.45) : inR(0.38)
  const rightImgH = isBroad ? inR(1) : inR(0.82)

  return (
    <div
      className="w-full h-full bg-[#f7f4ef] overflow-hidden flex flex-col"
      style={{ fontFamily: FONT_TEL }}
    >
      <div className="flex-1 min-h-0 w-full border border-gray-300 flex bg-white">
        {/* LEFT — Running commentary */}
        <div className="w-[18%] shrink-0 border-r border-gray-300 bg-[#f5f0ea] flex flex-col min-h-0">
          <div className="flex shrink-0" style={{ height: labelH }}>
            <div
              className="bg-black text-white flex items-center justify-center px-2 font-black whitespace-nowrap"
              style={{ fontSize: isBroad ? '0.22in' : '0.19in', fontFamily: FONT_SANS }}
            >
              రన్నింగ్
            </div>
            <div
              className="bg-red-600 text-yellow-300 flex items-center justify-center px-2 font-black whitespace-nowrap"
              style={{ fontSize: isBroad ? '0.22in' : '0.19in', fontFamily: FONT_SANS }}
            >
              కామెంట్రీ
            </div>
          </div>

          <div className="flex-1 min-h-0 px-2 py-1 flex flex-col justify-between overflow-hidden">
            <div
              className="text-gray-700 font-medium space-y-0.5 overflow-hidden"
              style={{ fontSize: isBroad ? '0.14in' : '0.12in', lineHeight: isBroad ? '0.22in' : '0.19in' }}
            >
              {leftLines.map((line, i) => (
                <p key={i} className="m-0">
                  {line}
                </p>
              ))}
            </div>

            <div className="flex justify-center shrink-0 py-1">
              {s.adLeftUrl ? (
                <img
                  src={s.adLeftUrl}
                  alt=""
                  className="object-contain max-w-full"
                  style={{ maxHeight: isBroad ? '0.7in' : '0.55in' }}
                />
              ) : (
                <div
                  className="rounded-full bg-gradient-to-br from-orange-400 to-red-500"
                  style={{ width: isBroad ? '0.7in' : '0.55in', height: isBroad ? '0.7in' : '0.55in' }}
                />
              )}
            </div>

            <div
              className="text-red-600 font-bold text-center shrink-0 truncate"
              style={{ fontSize: isBroad ? '0.13in' : '0.11in' }}
            >
              {leftAuthor}
            </div>
          </div>
        </div>

        {/* CENTER — Logo + meta strip */}
        <div className="w-[64%] shrink-0 flex flex-col justify-between min-h-0 min-w-0">
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden">
            {centerImage ? (
              <img
                src={centerImage}
                alt=""
                className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                style={{ maxHeight: isBroad ? '1.85in' : '1.45in' }}
              />
            ) : (
              <>
                <h1
                  className="font-black text-[#0056a8] leading-none text-center m-0 px-2"
                  style={{ fontSize: logoSize, fontFamily: FONT_TEL }}
                >
                  {s.paperName || 'తెలుగుప్రభ'}
                </h1>
                <div
                  className="w-full flex justify-between items-end px-4 text-gray-500 -mt-1"
                  style={{ fontSize: isBroad ? '0.22in' : '0.18in' }}
                >
                  <span>{s.tagline || 'మన భాష.. మన పత్రిక'}</span>
                  <span style={{ fontSize: isBroad ? '0.18in' : '0.15in', fontFamily: FONT_SANS }}>{website}</span>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 border-t-[4px] border-[#c58a2b] bg-[#f3e6d2]">
            <div
              className="grid grid-cols-3 items-center text-gray-800 font-semibold overflow-hidden divide-x divide-gray-400"
              style={{ fontSize: isBroad ? '0.14in' : '0.12in', fontFamily: FONT_SANS }}
            >
              <div className="flex flex-wrap gap-x-2 px-2 py-1 min-w-0">
                <span className="shrink-0">Published from:</span>
                {cities.slice(0, 4).map((city, i) => (
                  <span key={i}>{city}</span>
                ))}
              </div>
              <div className="flex justify-center gap-2 px-2 py-1 whitespace-nowrap">
                <span>తెలంగాణ</span>
                <span>|</span>
                <span>{s.date || '28.5.2026'}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-x-2 px-2 py-1">
                <span>వెల: {s.price || '₹6.00'}</span>
                <span>సంపుటి: {s.volume || '21'}</span>
                <span>సంచిక: {s.issue || '106'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — News box */}
        <div className="w-[18%] shrink-0 border-l border-gray-300 p-1 bg-white flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col border border-gray-400 bg-white overflow-hidden">
            <div
              className="shrink-0 border-b border-gray-300 overflow-hidden bg-gray-100"
              style={{ height: rightImgH }}
            >
              {rightThumb ? (
                <img src={rightThumb} alt="news" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-sans">
                  Article
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 p-1 flex flex-col overflow-hidden">
              <h2
                className="font-black text-black leading-tight m-0 mb-1"
                style={{ fontSize: isBroad ? '0.24in' : '0.2in', fontFamily: FONT_TEL }}
              >
                {rightTitle}
              </h2>
              <ul
                className="m-0 pl-4 text-gray-700 space-y-0.5 list-disc overflow-hidden flex-1"
                style={{ fontSize: isBroad ? '0.14in' : '0.12in', lineHeight: isBroad ? '0.2in' : '0.17in', fontFamily: FONT_SANS }}
              >
                {rightPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 flex justify-end p-1">
              <div
                className="bg-gray-300 text-black font-black flex items-center justify-center border border-gray-400"
                style={{
                  width: isBroad ? '0.32in' : '0.28in',
                  height: isBroad ? '0.32in' : '0.28in',
                  fontSize: isBroad ? '0.18in' : '0.15in',
                  fontFamily: FONT_SANS,
                }}
              >
                {pageNum}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

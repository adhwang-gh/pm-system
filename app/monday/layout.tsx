import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'PM System',
}

export default function MondayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Stele typefaces */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        /* IBM Plex Mono as the base — consistent monumental feel throughout */
        .stele-root {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.03em;
        }
        /* Jost reserved for the wordmark only */
        .stele-display { font-family: 'Jost', system-ui, sans-serif; letter-spacing: 0.05em; }

        /* Tighten placeholder text */
        .stele-root input::placeholder { letter-spacing: 0.02em; opacity: 0.45; }

        /* Webkit scrollbar stays minimal */
        .stele-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .stele-root ::-webkit-scrollbar-track { background: transparent; }
        .stele-root ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
      `}</style>
      <div className="stele-root h-full flex flex-col" style={{ background: '#0B0B0B' }}>
        {children}
      </div>
    </>
  )
}

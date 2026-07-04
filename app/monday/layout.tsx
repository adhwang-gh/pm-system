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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        .stele-root {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px;
          letter-spacing: 0;
        }
        /* Jost reserved for the wordmark only */
        .stele-display { font-family: 'Jost', system-ui, sans-serif; letter-spacing: 0.05em; }

        /* Tighten placeholder text */
        .stele-root input::placeholder { opacity: 0.45; }

        /* Webkit scrollbar stays minimal */
        .stele-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .stele-root ::-webkit-scrollbar-track { background: transparent; }
        .stele-root ::-webkit-scrollbar-thumb { background: #DDDDD8; border-radius: 2px; }
      `}</style>
      <div className="stele-root h-full flex flex-col" style={{ background: '#F7F7F5' }}>
        {children}
      </div>
    </>
  )
}

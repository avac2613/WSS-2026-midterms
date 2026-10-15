import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast/Toast'
import { SITE_NAME } from '@/components/layout/header/Header'

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`, // 각 페이지 제목 뒤에 서비스 이름이 붙음
  },
  description: 'PDF 자료를 올리면 AI가 핵심을 요약해 주는 학습 도우미',
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: 위 스크립트가 data-theme을 미리 바꾸기 때문에 필요
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

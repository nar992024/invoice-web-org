/**
 * PDF 다운로드 버튼 컴포넌트
 * 견적서를 PDF 파일로 다운로드하는 버튼입니다.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Invoice } from '@/types/invoice'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ERROR_MESSAGES } from '@/lib/constants'
import { sanitizeFilename } from '@/lib/format'

/** 다운로드가 시작될 시간을 확보한 뒤 Blob URL을 해제하기까지의 대기 시간 */
const BLOB_URL_REVOKE_DELAY_MS = 10_000

interface PDFDownloadButtonProps {
  /** 견적서 데이터 */
  invoice: Invoice
  /** 추가 CSS 클래스 */
  className?: string
  /** 버튼 크기 */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * PDF 다운로드 버튼 컴포넌트
 * API를 호출하여 견적서 PDF를 생성하고 다운로드합니다.
 */
export function PDFDownloadButton({
  invoice,
  className,
  size = 'default',
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)

    try {
      // 1단계: API 호출
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice }),
      })

      // 2단계: 응답 검증
      if (!response.ok) {
        throw new Error('PDF 생성 실패')
      }

      // 3단계: Blob 변환
      const blob = await response.blob()

      // 4단계: 다운로드 트리거
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${sanitizeFilename(invoice.invoiceNumber)}.pdf`
      // 일부 브라우저는 문서에 연결되지 않은 링크의 다운로드를 무시한다
      document.body.appendChild(a)
      a.click()
      a.remove()

      // 5단계: 리소스 정리
      // 즉시 해제하면 브라우저가 파일을 읽기 전에 다운로드가 취소될 수 있다
      setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS)

      // 브라우저는 저장 완료 여부를 알려주지 않으므로 시작까지만 안내한다
      toast.success('PDF 다운로드를 시작했습니다')
    } catch (error) {
      console.error(ERROR_MESSAGES.PDF_GENERATION_ERROR, error)
      toast.error(ERROR_MESSAGES.PDF_GENERATION_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      size={size}
      className={cn('gap-2', className)}
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
    </Button>
  )
}

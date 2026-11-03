import { Footer } from '@/components/layout/footer'
import { InvoiceHeader } from '@/components/invoice/InvoiceHeader'
import { InvoiceClientInfo } from '@/components/invoice/InvoiceClientInfo'
import { InvoiceTable } from '@/components/invoice/InvoiceTable'
import { InvoiceSummary } from '@/components/invoice/InvoiceSummary'
import { PDFDownloadButton } from '@/components/invoice/PDFDownloadButton'
import {
  getOptimizedInvoice,
  isInvoiceNotFoundError,
} from '@/lib/services/invoice.service'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import { formatCurrency } from '@/lib/format'

interface InvoicePageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Open Graph 메타데이터 생성
 * 링크 미리보기에 견적서 정보 표시
 */
export async function generateMetadata({
  params,
}: InvoicePageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const invoice = await getOptimizedInvoice(id)

    return {
      title: `견적서 ${invoice.invoiceNumber}`,
      description: `${invoice.clientName}님의 견적서 - 총액: ${formatCurrency(invoice.totalAmount)}`,
      openGraph: {
        title: `견적서 ${invoice.invoiceNumber}`,
        description: `${invoice.clientName}님의 견적서`,
        type: 'website',
      },
    }
  } catch {
    return {
      title: '견적서 조회',
      description: '견적서를 확인하세요',
    }
  }
}

/**
 * 견적서 페이지
 *
 * 응답을 보내기 전에 데이터를 조회해야 없는 견적서에 HTTP 404를 반환할 수 있다.
 * loading.tsx나 Suspense로 스트리밍을 시작하면 상태 코드가 200으로 확정되므로 사용하지 않는다.
 */
export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params

  const invoiceData = await getOptimizedInvoice(id).catch((error: unknown) => {
    if (isInvoiceNotFoundError(error)) {
      notFound()
    }
    // Notion 장애 등은 링크 문제가 아니므로 error.tsx에서 안내한다
    throw error
  })

  return (
    <div className="flex min-h-screen flex-col">
      <main className="bg-muted/30 flex-1">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* 페이지 타이틀 */}
          <div className="mx-auto mb-6 max-w-3xl">
            <h1 className="text-foreground text-3xl font-bold sm:text-4xl">
              견적서 조회
            </h1>
            <p className="text-muted-foreground mt-2">
              견적서의 상세 내용을 확인하실 수 있습니다.
            </p>
          </div>

          {/* 견적서 콘텐츠 */}
          <div className="mx-auto max-w-3xl space-y-8">
            {/* 견적서 헤더 */}
            <InvoiceHeader invoice={invoiceData} />

            {/* 클라이언트 정보 */}
            <InvoiceClientInfo invoice={invoiceData} />

            {/* 견적 항목 테이블 */}
            <InvoiceTable items={invoiceData.items} />

            {/* 총액 요약 */}
            <InvoiceSummary invoice={invoiceData} />

            {/* 구분선 */}
            <Separator className="my-8" />

            {/* 액션 버튼 영역 */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PDFDownloadButton invoice={invoiceData} size="lg" />
            </div>

            {/* 안내 메시지 */}
            <div className="bg-card text-muted-foreground rounded-lg border p-4 text-center text-sm">
              <p>
                견적서에 대한 문의사항이 있으시면 발행자에게 직접 연락해 주세요.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

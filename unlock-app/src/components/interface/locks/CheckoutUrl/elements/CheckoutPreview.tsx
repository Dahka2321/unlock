import { Button, Size } from '@unlock-protocol/ui'
import { Checkout } from '~/components/interface/checkout/main'
import useClipboard from 'react-use-clipboard'
import { ToastHelper } from '@unlock-protocol/ui'
import FileSaver from 'file-saver'
import { PaywallConfigType } from '@unlock-protocol/core'

interface CheckoutPreviewProps {
  paywallConfig?: PaywallConfigType
  id?: string | null
  checkoutUrl: string
}

const onDownloadJson = (paywallConfig: PaywallConfigType) => {
  const fileName = 'paywall-config.json'

  // Create a blob of the data
  const fileToSave = new Blob([JSON.stringify(paywallConfig)], {
    type: 'application/json',
  })

  FileSaver.saveAs(fileToSave, fileName)
}

interface CheckoutShareOrDownloadProps {
  paywallConfig?: PaywallConfigType
  checkoutUrl: string
  size?: Size
  id?: string | null
}

export const CheckoutShareOrDownload = ({
  paywallConfig,
  checkoutUrl,
  size = 'small',
}: CheckoutShareOrDownloadProps) => {
  const [_isCopied, setCopied] = useClipboard(checkoutUrl, {
    successDuration: 2000,
  })
  const hasLocks = Object.entries(paywallConfig?.locks ?? {})?.length > 0

  return paywallConfig ? (
    <div className="flex flex-col gap-3 md:flex-row">
      <Button
        size={size}
        disabled={!hasLocks}
        onClick={() => {
          setCopied()
          ToastHelper.success('URL copied')
        }}
      >
        Copy URL
      </Button>
      <Button
        variant="transparent"
        size={size}
        disabled={!hasLocks}
        onClick={() => onDownloadJson(paywallConfig)}
      >
        Download JSON
      </Button>
    </div>
  ) : null
}

export const CheckoutPreview = ({ paywallConfig }: CheckoutPreviewProps) => {
  const hasLocks = Object.entries(paywallConfig?.locks ?? {})?.length > 0

  return (
    <div className="z-0 flex items-center justify-center w-full px-2 py-10 bg-gray-300 rounded-3xl">
      <div className="flex items-center justify-center w-full max-w-lg">
        {paywallConfig && (
          <div className="flex flex-col items-center w-full gap-4">
            <Checkout paywallConfig={paywallConfig as any} />
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">
                {hasLocks
                  ? ' This checkout modal is ready for you to use.'
                  : 'A Lock is required in order to see the full preview.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

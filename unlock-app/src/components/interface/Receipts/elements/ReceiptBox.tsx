import {
  Button,
  Disclosure,
  Placeholder,
  Detail,
  PriceFormatter,
} from '@unlock-protocol/ui'
import { useReactToPrint } from 'react-to-print'
import { useRef, useState, useEffect } from 'react'
import { PoweredByUnlock } from '../../checkout/PoweredByUnlock'
import { addressMinify } from '~/utils/strings'
import { UpdatePurchaserDrawer } from './UpdatePurchaserDrawer'
import { useGetReceipt } from '~/hooks/useReceipts'
import dayjs from 'dayjs'
import networks from '@unlock-protocol/networks'
import { useLockManager } from '~/hooks/useLockManager'
import { useWeb3Service } from '~/utils/withWeb3Service'
import { useQuery } from '@tanstack/react-query'
import { useGetPrice } from '~/hooks/usePrice'
import Link from 'next/link'
import { HiOutlineExternalLink as ExternalLinkIcon } from 'react-icons/hi'
import { useAuthenticate } from '~/hooks/useAuthenticate'
import { ZeroAddress } from 'ethers'

interface ReceiptBoxProps {
  lockAddress: string
  network: number
  hash: string
}

const Address = ({
  addressLine1 = '',
  addressLine2 = '',
  city = '',
  zip = '',
  country = '',
  state = '',
}: Record<string, string>) => {
  const addressLine =
    city.length + state.length + zip.length > 0
      ? [zip, city, state].filter(Boolean).join(', ')
      : ''
  return (
    <div className="flex flex-col gap-1">
      {addressLine1 && <span className="text-base">{addressLine1}</span>}
      {addressLine2 && <span className="text-base">{addressLine2}</span>}
      {addressLine?.length > 0 && (
        <span className="text-base">{addressLine}</span>
      )}
      <span className="text-base">{country}</span>
    </div>
  )
}

const NotAuthorizedBar = () => {
  const { account } = useAuthenticate()
  return (
    <div className="w-full max-w-lg p-2 mt-5 text-base text-center text-red-700 bg-red-100 border border-red-700 rounded-xl">
      You are connected as {addressMinify(account!)} and this address is not a
      manager or payer for this receipt. If you want to update details, please
      connect as lock manager or payer of the transaction.
    </div>
  )
}

const ReceiptDetails = ({
  supplier,
  receiptDetails,
  isCancelReceipt,
}: {
  supplier: any
  receiptDetails: any
  isCancelReceipt: boolean
}) => {
  const web3Service = useWeb3Service()

  const { data: tokenSymbol, isLoading: isLoadingSymbol } = useQuery({
    queryKey: [
      'getContractTokenSymbol',
      receiptDetails.tokenAddress,
      receiptDetails.network,
    ],
    queryFn: async () => {
      if (receiptDetails.tokenAddress == ZeroAddress) {
        return networks[receiptDetails.network]?.nativeCurrency?.symbol
      }
      return web3Service.getTokenSymbol(
        receiptDetails.tokenAddress,
        receiptDetails.network
      )
    },
    enabled: !!(receiptDetails.tokenAddress && receiptDetails.network),
  })

  const { data: receiptPrice, isLoading: isLoadingPrice } = useGetPrice({
    network: receiptDetails.network,
    amount: receiptDetails.amountTransferred || 0,
    currencyContractAddress: receiptDetails.tokenAddress,
  })
  const multiplier = isCancelReceipt ? -1 : 1

  const vatRatePercentage = (supplier?.vatBasisPointsRate ?? 0) / 100
  const subtotal =
    (multiplier * (receiptPrice?.total ?? 0)) / (1 + vatRatePercentage / 100)
  const vatTotalInAmount = Number((subtotal * vatRatePercentage) / 100)

  if (isLoadingPrice || isLoadingSymbol) {
    return (
      <Placeholder.Root>
        <Placeholder.Line />
      </Placeholder.Root>
    )
  }

  return (
    <div className="grid gap-2 mt-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-400 last-of-type:border-none">
          <div className="col-span-full">
            <h2 className="text-lg font-bold text-brand-ui-primary">
              Service performed:
            </h2>
            {isCancelReceipt
              ? 'NFT membership canceled'
              : supplier?.servicePerformed || 'NFT membership'}
          </div>
          <div className="flex flex-col w-full gap-1 mt-5 md:ml-auto md:w-1/2 col-span-full">
            <h2 className="text-lg font-bold md:ml-auto text-brand-ui-primary">
              Amount
            </h2>
            <div className="grid gap-1">
              {vatRatePercentage > 0 && (
                <>
                  <Detail label="Subtotal" inline>
                    {subtotal.toFixed(2)} {tokenSymbol}
                  </Detail>
                  <Detail label={`VAT (${vatRatePercentage}%)`} inline>
                    {vatTotalInAmount.toFixed(2)} {tokenSymbol}
                  </Detail>
                </>
              )}
              <Detail label="TOTAL" labelSize="medium" inline>
                <PriceFormatter
                  price={(
                    multiplier * parseFloat(receiptPrice?.total ?? '0')
                  ).toString()}
                />{' '}
                {tokenSymbol}
              </Detail>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Purchaser = ({
  isCancelReceipt,
  isPurchaser,
  setPurchaserDrawer,
  purchaserDrawer,
  purchaser,
  receiptDetails,
}: {
  isCancelReceipt: boolean
  isPurchaser: boolean
  setPurchaserDrawer: (value: boolean) => void
  purchaserDrawer: boolean
  purchaser: any
  receiptDetails: any
}) => {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-brand-ui-primary">
          {isCancelReceipt ? 'Refunded to:' : 'Bill to:'}
        </h2>
        {isPurchaser && (
          <Button
            onClick={() => setPurchaserDrawer(!purchaserDrawer)}
            className="print:hidden"
            size="tiny"
            variant="outlined-primary"
          >
            {purchaser ? 'Edit' : 'Add details'}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold">{purchaser?.businessName}</span>
        {purchaser?.email && (
          <span className="text-base">Email: {purchaser?.email}</span>
        )}
        <span className="text-base">
          Wallet:{' '}
          {isCancelReceipt
            ? receiptDetails?.recipient?.length > 0
              ? addressMinify(receiptDetails?.recipient)
              : ''
            : receiptDetails?.payer?.length > 0
              ? addressMinify(receiptDetails?.payer)
              : ''}
        </span>
        <span className="text-base">{purchaser?.fullname}</span>
        <Address {...purchaser} />
      </div>
    </div>
  )
}

export const ReceiptBox = ({ lockAddress, hash, network }: ReceiptBoxProps) => {
  const { account } = useAuthenticate()

  const [purchaserDrawer, setPurchaserDrawer] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState('')
  const { isManager } = useLockManager({
    lockAddress,
    network,
  })

  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    refetch: refetchReceipt,
  } = useGetReceipt({
    lockAddress,
    hash,
    network,
  })

  const { purchaser, supplier, receipt: receiptDetails } = receipt ?? {}

  // enable edit of purchaser only if purchaser match the account
  const isPurchaser =
    receiptDetails?.payer?.toLowerCase() === account?.toLowerCase()

  const isRecipient =
    receiptDetails?.recipient?.toLowerCase() === account?.toLowerCase()

  const isCancelReceipt = receiptDetails?.payer == lockAddress

  const transactionDate =
    receiptDetails && receiptDetails.timestamp
      ? dayjs.unix(receiptDetails.timestamp).format('D MMM YYYY') // example: 20 Jan 1977
      : ''

  useEffect(() => {
    const number = [
      supplier?.prefix,
      receiptDetails?.receiptNumber || '',
      isCancelReceipt ? 'REFUND' : '',
    ]
      .filter((z: string) => !!z)
      .join('-')
    setReceiptNumber(number)
  }, [supplier, receiptDetails, isCancelReceipt])

  const componentRef = useRef<any>()

  const handlePrint = useReactToPrint({
    documentTitle: `Receipt-${receiptNumber}`,
    contentRef: componentRef,
  })

  if (isLoadingReceipt) {
    return (
      <Placeholder.Root>
        <Placeholder.Image className="h-[100px] md:w-[500px]" />
      </Placeholder.Root>
    )
  }

  if (!receipt || !receiptDetails) {
    return <p>There is no receipt for this transaction. </p>
  }

  if (!isManager && !isPurchaser && !isRecipient) {
    return <NotAuthorizedBar />
  }

  const transactionUrl = hash?.length
    ? networks[network].explorer?.urls.transaction(hash)
    : ''

  return (
    <>
      {isPurchaser && (
        <UpdatePurchaserDrawer
          isOpen={purchaserDrawer}
          setIsOpen={setPurchaserDrawer}
          lockAddress={lockAddress}
          network={network}
          hash={hash}
          purchaser={purchaser}
          onSave={() => {
            refetchReceipt()
            setPurchaserDrawer(false)
          }}
        />
      )}
      <div className="grid w-full max-w-lg gap-4 mb-5">
        <div className="grid w-full">
          <Disclosure
            label={`#${receiptNumber}`}
            description={
              transactionUrl?.length && (
                <div
                  onClick={(e: any) => {
                    e?.stopPropagation()
                  }}
                  className="flex"
                >
                  <Link href={transactionUrl}>
                    <div className="flex items-center gap-2">
                      <span>{'Transaction Hash:'} </span>
                      <span className="font-semibold text-brand-ui-primary">
                        {addressMinify(hash)}
                      </span>
                      <ExternalLinkIcon
                        size={20}
                        className="text-brand-ui-primary"
                      />
                    </div>
                  </Link>
                </div>
              )
            }
          >
            <div
              className="relative w-full print:px-6 print:py-10 "
              ref={componentRef}
            >
              <div className="flex flex-col-reverse gap-4 mb-4 md:flex-row md:mb-0 md:justify-between">
                {/* Supplier details */}
                <div className="grid gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                      {supplier?.supplierName}
                    </span>
                    <span className="text-base">{supplier?.vat}</span>
                    <Address {...supplier} />
                  </div>
                </div>

                {/* Receipt header */}
                <div className="grid gap-2">
                  <Detail label="Receipt Number">#{receiptNumber}</Detail>
                  <Detail label="Transaction Date">{transactionDate}</Detail>
                  <Detail label="Transaction Hash">
                    {addressMinify(hash)}
                  </Detail>
                </div>
              </div>

              {/* Purchaser details */}
              <Purchaser
                isCancelReceipt={isCancelReceipt}
                isPurchaser={isPurchaser}
                setPurchaserDrawer={setPurchaserDrawer}
                purchaserDrawer={purchaserDrawer}
                purchaser={purchaser}
                receiptDetails={receiptDetails}
              />
              {/* Receipt details */}
              <ReceiptDetails
                receiptDetails={receiptDetails}
                isCancelReceipt={isCancelReceipt}
                supplier={supplier}
              />
              <div className="mt-4">
                <PoweredByUnlock />
              </div>
            </div>
            <div className="flex justify-end w-full">
              <Button
                size="small"
                onClick={() => handlePrint()}
                disabled={isLoadingReceipt}
              >
                Print PDF
              </Button>
            </div>
          </Disclosure>
        </div>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import {
  MetadataInput,
  PaywallLockConfig,
  MetadataInputType,
  PaywallLockConfigType,
} from '@unlock-protocol/core'
import { useConfig } from '~/utils/withConfig'
import {
  Button,
  Card,
  Input,
  Placeholder,
  ToggleSwitch,
  Tooltip,
  minifyAddress,
  Checkbox,
} from '@unlock-protocol/ui'
import {
  TiArrowSortedUp as UpIcon,
  TiArrowSortedDown as DownIcon,
} from 'react-icons/ti'
import {
  FiTrash as DeleteIcon,
  FiPlus as PlusIcon,
  FiEdit as EditIcon,
} from 'react-icons/fi'
import { BiCog as CogICon } from 'react-icons/bi'
import { RiArrowGoBackLine as GoBackLineIcon } from 'react-icons/ri'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Picker } from '~/components/interface/Picker'
import type { z } from 'zod'
import { useLockSettings } from '~/hooks/useLockSettings'
import { getLocksByNetwork } from '~/hooks/useLocksByManager'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthenticate } from '~/hooks/useAuthenticate'

interface LockListItemProps {
  position: number
  address: string
  network: string | number
  name?: string
  onRemove?: () => void
  onReorder: (change: number) => void
  onEdit?: () => void
  onReset?: () => void
  hasEdit?: boolean
}

// Form component
interface Props {
  onChange: (values: z.infer<typeof PaywallLockConfig>) => void
  defaultValues?: z.infer<typeof PaywallLockConfig>
}

export const BasicConfigForm: React.FC<Props> = ({
  onChange,
  defaultValues,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof PaywallLockConfig>>({
    reValidateMode: 'onChange',
    defaultValues: defaultValues as any,
  })

  // Define an onChange handler for each input field
  const handleInputChange = () => {
    const updatedValues = watch() // Get all form values
    onChange(updatedValues) // Call the onChange prop with updated values
  }

  return (
    <form
      className="grid gap-6"
      onChange={() => {
        handleInputChange()
      }}
    >
      <Input
        label="Name"
        size="small"
        description={PaywallLockConfig.shape.name.description}
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Max Recipients"
        type="text"
        size="small"
        description={PaywallLockConfig.shape.maxRecipients?.description}
        {...register('maxRecipients', {
          valueAsNumber: true,
        })}
      />
      <Input
        label="Recipient"
        size="small"
        description={PaywallLockConfig.shape.recipient?.description}
        {...register('recipient')}
      />
      <Input
        label="Data Builder"
        type="url"
        size="small"
        description={PaywallLockConfig.shape.dataBuilder?.description}
        {...register('dataBuilder')}
      />
      <Checkbox
        label="Collect Email"
        description={PaywallLockConfig.shape.emailRequired?.description}
        error={errors.emailRequired?.message}
        {...register('emailRequired')}
      />
    </form>
  )
}

type LocksProps = Record<string, Partial<PaywallLockConfigType>>

interface LocksFormProps {
  onChange: (locks: LocksProps) => void
  locks: LocksProps
}

interface LockImageProps {
  lockAddress: string
}
interface MetadataDetailProps {
  title: string
  value?: string
}

const LockImage = ({ lockAddress }: LockImageProps) => {
  const config = useConfig()
  const lockImage = `${config.services.storage.host}/lock/${lockAddress}/icon`

  return (
    <div className="flex items-center justify-center w-8 h-8 p-[1px] overflow-hidden bg-gray-200 rounded">
      <img
        src={lockImage}
        alt={lockAddress}
        className="object-cover w-full h-full bg-center"
      />
    </div>
  )
}

const MetadataDetail = ({ title, value }: MetadataDetailProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">{title}</span>
      <span className="text-base font-bold">{value || '-'}</span>
    </div>
  )
}

type RecurringByLock = Record<
  string, // lockAddress
  {
    isRecurringPossible: boolean
    oneYearRecurring?: number
  }
>

type MetadataInput = Omit<z.infer<typeof MetadataInput>, 'defaultValue'>

interface LockMetadataProps {
  onSubmit(data: MetadataInput): void
  metadata?: MetadataInput
}

export const LockMetadataForm = ({ onSubmit, metadata }: LockMetadataProps) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<Omit<z.infer<typeof MetadataInput>, 'defaultValue'>>({
    resolver: zodResolver(
      MetadataInput.omit({
        defaultValue: true,
      })
    ),
  })

  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      setValue(key as keyof MetadataInput, value)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        size="small"
        label="Name"
        description={MetadataInput.shape.name.description}
        error={errors?.name?.message}
      />
      <Input
        {...register('label')}
        label="Label"
        size="small"
        description={MetadataInput.shape.label.description}
        error={errors?.label?.message}
      />
      <Input
        {...register('placeholder')}
        label="Placeholder"
        size="small"
        description={MetadataInput.shape.placeholder.description}
        error={errors?.placeholder?.message}
      />
      <Input
        {...register('value')}
        label="Value"
        size="small"
        description={MetadataInput.shape.value.description}
        error={errors?.value?.message}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="required"
            className="cursor-pointer focus:outline-0 hover:outline-0 outline-0 focus:ring-transparent"
            {...register('required')}
          />
          <label htmlFor="required"> Required </label>
        </div>
        <p className="text-xs text-gray-600 ">
          {MetadataInput.shape.required.description}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="public"
            className="cursor-pointer focus:outline-0 hover:outline-0 outline-0 focus:ring-transparent"
            {...register('public')}
          />
          <label htmlFor="public"> Public </label>
        </div>
        <p className="text-xs text-gray-600 ">
          {MetadataInput.shape.public.description}
        </p>
      </div>
      <div className="space-y-2">
        <select
          className="block w-full box-border rounded-lg transition-all shadow-sm border border-gray-400 hover:border-gray-500 focus:ring-gray-500 focus:border-gray-500 focus:outline-none flex-1 disabled:bg-gray-100 pl-2.5 py-1.5 text-sm"
          {...register('type')}
        >
          {Object.values(MetadataInput.shape.type._def.values)?.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 ">
          {MetadataInput.shape.type.description}
        </p>
      </div>
      <Button type="submit">Add Field</Button>
    </form>
  )
}
export const LocksForm = ({
  onChange,
  locks: locksDefault = {},
}: LocksFormProps) => {
  const { account } = useAuthenticate()
  const [network, setNetwork] = useState<string | number>()
  const [lockAddress, setLockAddress] = useState<string>('')
  const [addLock, setAddLock] = useState(false)
  const [defaultValue, setDefaultValue] = useState<Record<string, any>>({})
  const [recurring, setRecurring] = useState<string | number>('')
  const [recurringUnlimited, setRecurringUnlimited] = useState(false)
  const [lockRecurring, setLockRecurring] = useState<RecurringByLock>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)

  const { getIsRecurringPossible } = useLockSettings()

  const [locks, setLocks] = useState<LocksProps>(() => {
    const orderedLocks = {} as LocksProps
    Object.entries(locksDefault).forEach(([address, properties], index) => {
      orderedLocks[address] = {
        ...properties,
        order: index,
      }
    })
    return orderedLocks
  })

  useEffect(() => {
    const orderedLocks = {} as LocksProps
    Object.entries(locksDefault).forEach(([address, properties], index) => {
      orderedLocks[address] = {
        ...properties,
        order: index,
      }
    })
    setLocks(orderedLocks)
  }, [locksDefault])

  // preload default and set recurring (es. saved config)
  useEffect(() => {
    const getRecurringCb = async () => {
      const promises = Object.entries(locks).map(
        async ([lockAddress, { network }]) => {
          if (!lockRecurring[lockAddress]) {
            const result = await getIsRecurringPossible({
              lockAddress,
              network: Number(network),
            })
            setLockRecurring({
              ...lockRecurring,
              [lockAddress]: {
                ...result,
              },
            })
            return result
          } else {
            lockRecurring[lockAddress]
          }
        }
      )
      await Promise.allSettled(promises)
    }
    getRecurringCb()
  }, [getIsRecurringPossible, locks, lockRecurring])

  const reset = () => {
    setLockAddress('')
    setNetwork(undefined)
    setAddLock(false)
  }

  const { isLoading: isLoadingLocksByNetwork, data: locksByNetwork = [] } =
    useQuery({
      queryKey: ['locksByNetwork', network, account],
      queryFn: async () =>
        getLocksByNetwork({
          account,
          network,
        }),
      enabled: !!account,
    })

  const onReorderInList = (lockAddress: string, order: number) => {
    const lock = locks[lockAddress]
    if (lock) {
      if (order == -1) {
        const previousLock = Object.keys(locks).find((address) => {
          return locks[address].order == lock.order! - 1
        })
        if (previousLock) {
          const previousLockOrder = locks[previousLock].order
          locks[previousLock].order = lock.order!
          lock.order = previousLockOrder
        }
      } else if (order == 1) {
        const nextLock = Object.keys(locks).find((address) => {
          return locks[address].order == lock.order! + 1
        })
        if (nextLock) {
          const nextLockOrder = locks[nextLock].order
          locks[nextLock].order = lock.order
          lock.order = nextLockOrder
        }
      }
      setLocks(locks)
      onChange(locks)
    }
  }

  const onRemoveFromList = (lockAddress: string) => {
    if (!lockAddress) {
      return
    }
    let newObj = {}
    Object.entries(locks)
      .sort(([, l], [, m]) => {
        return (l.order || 0) - (m.order || 0)
      })
      .filter(
        ([address]) => address.toLowerCase() !== lockAddress.toLowerCase()
      )
      .map(([lockAddress, fields], order) => {
        newObj = {
          ...newObj,
          [lockAddress]: {
            ...fields,
            order, // rewrite the order!
          },
        }
      })
    reset()
    setLocks(newObj)
    onChange(newObj)
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setIsEditing(true)
  }

  const handleSubmit = (e: z.infer<typeof MetadataInput>) => {
    const lock = locks[lockAddress]
    lock.metadataInputs![editIndex] = e

    const lockWithMetadata = {
      ...locks,
      [lockAddress]: lock,
    }
    setLocks(lockWithMetadata)
    setIsEditing(false)
  }

  const MetadataList = () => {
    if (!locks[lockAddress]?.metadataInputs) {
      return null
    }
    return (
      <div className="flex flex-col gap-3">
        {locks[lockAddress]?.metadataInputs?.map((metadata, index) => {
          return isEditing && editIndex === index ? (
            <LockMetadataForm
              key={index}
              onSubmit={handleSubmit}
              metadata={metadata}
            />
          ) : (
            <div
              key={index}
              className="flex items-center justify-between w-full p-4 text-sm bg-white rounded-lg shadow"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="grid w-full grid-cols-3">
                  <MetadataDetail title="Form label" value={metadata?.name} />
                  <MetadataDetail
                    title="Default value"
                    value={metadata?.defaultValue}
                  />
                  <MetadataDetail
                    title="Required"
                    value={metadata?.required ? 'YES' : 'NO'}
                  />
                </div>
                <div className="flex justify-around items-center gap-2 w-1/5">
                  <button
                    type="button"
                    onClick={() => onRemoveMetadata(metadata?.name)}
                    aria-label="Remove metadata"
                    className="mt-1 text-gray-500"
                  >
                    <DeleteIcon size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    aria-label="Edit"
                    className="mt-1 text-gray-500"
                  >
                    <EditIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const onAddLock = async ({
    lockAddress,
    network,
    name = '',
    fields = null,
  }: {
    lockAddress: string
    network?: number | string
    name?: string
    fields?: any
  }) => {
    const defaultLockName = locksByNetwork?.find(
      (lock) => lock.address?.toLowerCase() === lockAddress?.toLowerCase()
    )?.name

    // set default name if none is set
    if (!fields && !fields?.name) {
      fields = {
        ...fields,
        name: defaultLockName ?? name ?? 'default',
      }
    }

    // merge current field with new fields
    fields = {
      ...locks[lockAddress],
      ...fields,
    }

    // get recurring default value
    const { isRecurringPossible = false, oneYearRecurring } =
      await getIsRecurringPossible({
        lockAddress,
        network: Number(network),
      })

    // update mapping
    setLockRecurring({
      ...lockRecurring,
      [lockAddress]: {
        isRecurringPossible,
        oneYearRecurring,
      },
    })

    const recurringPayments =
      fields?.recurringPayments ||
      (isRecurringPossible ? oneYearRecurring : undefined)

    const locksByAddress = {
      ...locks,
      [lockAddress]: {
        network: parseInt(`${network}`),
        ...fields,
        recurringPayments,
        order: Object.keys(locks).length,
      },
    }
    setLocks(locksByAddress)
    onChange(locksByAddress)
    setAddMetadata(false)
    setLockAddress(lockAddress)
    setNetwork(network)
    setDefaultValue({})
    setAddLock(false)
  }

  const addLockMutation = useMutation({
    mutationFn: onAddLock,
  })

  const onAddMetadata = (fields: MetadataInputType) => {
    const lock = locks[lockAddress]
    const metadata = lock?.metadataInputs || []

    // update metadata by lock address
    const lockWithMetadata = {
      ...locks,
      [lockAddress]: {
        ...lock,
        metadataInputs: [...metadata, fields],
      },
    }

    setLocks(lockWithMetadata)
    onChange(lockWithMetadata)
    setAddMetadata(false)
  }

  const onRemoveMetadata = (fieldName: string) => {
    const lock = locks[lockAddress]
    const metadata =
      lock?.metadataInputs?.filter(
        (metadata) => metadata?.name?.toLowerCase() !== fieldName?.toLowerCase()
      ) ?? []

    // update metadata by lock address
    const lockWithMetadata = {
      ...locks,
      [lockAddress]: {
        ...lock,
        metadataInputs: [...metadata],
      },
    }

    setLocks(lockWithMetadata)
    onChange(lockWithMetadata)
  }

  // Called when editing a lock
  const onEditLock = (address: string) => {
    const [, config] =
      Object.entries(locks).find(
        ([lockAddress]) => lockAddress?.toLowerCase() === address?.toLowerCase()
      ) ?? []
    if (config) {
      setLockAddress(address)
      setNetwork(config.network)
      setDefaultValue(config)
    } else {
      // if no config is found, do not set the lock to be edited
    }
  }

  const onRecurringChange = ({ recurringPayments }: any) => {
    addLockMutation.mutate({
      lockAddress,
      network,
      fields: {
        recurringPayments,
      },
    })
  }

  const [addMetadata, setAddMetadata] = useState(false)

  const onChangeLock = (
    lockAddress?: string,
    network?: string | number,
    name?: string
  ) => {
    if (!lockAddress || !network) return
    setNetwork(network)
    setLockAddress(lockAddress)
    onRemoveFromList(lockAddress)
    addLockMutation.mutateAsync({
      lockAddress,
      network,
      name,
    })
  }

  useEffect(() => {
    setRecurring(locks[lockAddress]?.recurringPayments ?? '')
  }, [lockAddress, locks])

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Card.Title>Featured in this modal</Card.Title>
          <Card.Description>
            Adjust each lock & behavior by click on the gear icon
          </Card.Description>
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(locks ?? {})
            ?.sort(([, l], [, m]) => {
              return (l.order || 0) - (m.order || 0)
            })
            .map(
              (
                [address, values]: [string, z.infer<typeof PaywallLockConfig>],
                order
              ) => {
                const hasEdit =
                  lockAddress?.toLowerCase() === address?.toLowerCase()

                return (
                  <div key={address}>
                    <LockListItem
                      position={
                        order === Object.entries(locks).length - 1 ? -1 : order
                      }
                      name={values.name}
                      address={address}
                      network={values!.network!}
                      onRemove={() => onRemoveFromList(address)}
                      onReorder={(change) => onReorderInList(address, change)}
                      onEdit={() => onEditLock(address)}
                      onReset={reset}
                      hasEdit={hasEdit}
                    />
                    {hasEdit && (
                      <div className="bg-white ">
                        <div className="flex flex-col p-4">
                          <div className="px-4 py-2 mb-2 text-base text-gray-800 bg-gray-100 rounded-lg whitespace-nowrap">
                            Address: {lockAddress}
                          </div>
                          <h2 className="mb-2 text-lg font-bold text-brand-ui-primary">
                            Settings
                          </h2>
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center justify-between">
                                <span className="px-1 text-sm">
                                  Number of renewals
                                </span>
                                <ToggleSwitch
                                  title="Unlimited"
                                  enabled={recurringUnlimited}
                                  setEnabled={(enabled: boolean) => {
                                    setRecurringUnlimited(enabled)
                                    const recurringPayments = enabled
                                      ? 'forever'
                                      : ''
                                    setRecurring(recurringPayments)
                                    onRecurringChange({
                                      recurringPayments,
                                    })
                                  }}
                                />
                              </span>
                              <Input
                                size="small"
                                onChange={(e) => {
                                  setRecurring(e?.target.value)
                                  onRecurringChange({
                                    recurringPayments: e?.target?.value ?? '',
                                  })
                                }}
                                value={recurring}
                                disabled={recurringUnlimited}
                              />
                              <span className="mb-4 text-xs text-gray-600">
                                This only applies to locks which have been
                                enable for recurring payments. For native
                                currency locks, this will only allow renewals
                                for credit card based memberships if set.
                                <a
                                  className="underline"
                                  target="_blank"
                                  href="https://unlock-protocol.com/guides/recurring-memberships/"
                                  rel="noreferrer noopener"
                                >
                                  Learn more
                                </a>
                                .
                              </span>
                            </div>
                            <BasicConfigForm
                              defaultValues={defaultValue}
                              onChange={(fields: any) => {
                                onAddLock({
                                  lockAddress,
                                  network,
                                  fields,
                                })
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 p-6 bg-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <h2 className="text-lg font-bold text-brand-ui-primary">
                                  Metadata
                                </h2>
                                {!addMetadata && (
                                  <Button
                                    variant="outlined-primary"
                                    size="small"
                                    onClick={() => setAddMetadata(true)}
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                              <span className="text-xs text-gray-600">
                                (Optional) Collect additional information from
                                your members during the checkout process.
                                <br />
                                Note: if you have checked{' '}
                                <code>Collect email address</code> above, there
                                is no need to enter email address again here.
                              </span>
                            </div>
                          </div>
                          {!addMetadata ? (
                            <MetadataList />
                          ) : (
                            <div className="grid items-center grid-cols-1 gap-2 mt-2 rounded-xl">
                              <LockMetadataForm onSubmit={onAddMetadata} />
                            </div>
                          )}
                          <Button onClick={() => reset()}>Done</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            )}
        </div>
      </div>
      {addLockMutation?.isPending && (
        <Placeholder.Root className="mt-4">
          <Placeholder.Line size="xl" className="py-8" />
        </Placeholder.Root>
      )}
      <div>
        {!addLock && !lockAddress && (
          <button
            className="flex justify-between w-full mt-12 font-bold border-0"
            onClick={() => setAddLock(true)}
          >
            <span className="text-lg font-bold text-brand-ui-primary">
              Add a lock
            </span>
            <PlusIcon className="text-brand-ui-primary" size={25} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {addLock && (
          <div className="mt-12">
            <h2 className="mb-2 text-lg font-bold text-brand-ui-primary">
              Select a lock
            </h2>
            <div className="flex flex-col w-full gap-4">
              {isLoadingLocksByNetwork ? (
                <Placeholder.Line size="lg" />
              ) : (
                <>
                  <Picker
                    userAddress={account!}
                    onChange={(state) => {
                      onChangeLock(state.lockAddress, state.network, state.name)
                    }}
                    customOption={true}
                  />
                  <Button
                    className="w-full"
                    size="small"
                    onClick={() => {
                      setAddLock(false)
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
const LockListItem = ({
  position,
  address,
  name,
  onRemove,
  onEdit,
  onReorder,
  onReset,
  hasEdit = false,
}: LockListItemProps) => {
  const tooltip = hasEdit ? 'Back' : 'Edit'
  return (
    <div className="flex items-center justify-between w-full h-16 gap-2 p-4 py-1 text-sm bg-white">
      <div className="flex items-center w-full">
        <div className="flex items-center gap-2">
          <Tooltip label={tooltip} tip={tooltip} side="bottom">
            <button
              className="text-gray-500 "
              type="button"
              onClick={void 0}
              aria-label="Edit lock"
            >
              {hasEdit ? (
                <GoBackLineIcon
                  className="hover:text-brand-ui-primary"
                  onClick={onReset}
                  size={22}
                />
              ) : (
                <CogICon
                  className="hover:text-brand-ui-primary"
                  onClick={onEdit}
                  size={25}
                />
              )}
            </button>
          </Tooltip>
          <LockImage lockAddress={address} />
          <span className="text-base font-bold">{name || 'Default'}</span>
        </div>
        <span className="ml-auto text-base font-normal">
          {minifyAddress(address)}
        </span>
      </div>
      <div className="flex gap-2 item-center">
        <Tooltip label="Reorder" tip="Reorder" side="bottom">
          <div className="flex flex-col">
            {position === 0 && <UpIcon color="lightgrey" size={20} />}
            {position !== 0 && (
              <button
                className="text-gray-500 hover:text-brand-ui-primary"
                type="button"
                disabled={position === 0}
                onClick={() => onReorder(-1)}
                aria-label="Move lock up"
              >
                <UpIcon size={20} />
              </button>
            )}
            {position === -1 && <DownIcon color="lightgrey" size={20} />}
            {position > -1 && (
              <button
                className="text-gray-500 hover:text-brand-ui-primary"
                type="button"
                disabled={position === -1}
                onClick={() => onReorder(1)}
                aria-label="Move lock up"
              >
                <DownIcon size={20} />
              </button>
            )}
          </div>
        </Tooltip>
        <Tooltip label="Delete" tip="Delete" side="bottom">
          <button
            className="text-gray-500 hover:text-brand-ui-primary"
            type="button"
            onClick={onRemove}
            aria-label="Remove lock"
          >
            <DeleteIcon size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

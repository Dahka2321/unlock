import hre from 'hardhat'
import { it } from 'vitest'

import WalletService from '../../walletService'
import Web3Service from '../../web3Service'
import { deployUnlock, deployTemplate } from '.'

export const chainId = 31337

// used to run some tests only for ERC20 locks
export const itIfErc20 = (isERC20) => (isERC20 ? it : it.skip)

// setup all libs for tests
export const setupTest = async (unlockVersion) => {
  let walletService
  let web3Service
  let accounts

  const [signer] = await hre.ethers.getSigners()
  const ethersProvider = signer.provider
  // mock functions that are not implemented in hardhat
  signer.provider.waitForTransaction = async (hash) =>
    await signer.provider.getTransactionReceipt(hash)

  // pass hardhat ethers provider
  const networks = {
    [chainId]: {
      provider: 'http://localhost:8545',
    },
  }
  networks[chainId].ethersProvider = ethersProvider

  // deploy Unlock
  const unlockAddress = await deployUnlock(unlockVersion)
  networks[chainId].unlockAddress = unlockAddress

  walletService = new WalletService(networks)

  await walletService.connect(ethersProvider, signer)
  web3Service = new Web3Service(networks)

  // listAccounts() is missing from ethers BrowserProvider
  accounts = await walletService.provider.send('eth_accounts', [])

  return {
    accounts,
    walletService,
    web3Service,
  }
}

export const setupLock = async ({
  walletService,
  web3Service,
  publicLockVersion,
  unlockVersion,
  lockParams,
  ERC20,
}) => {
  let lock
  let lockAddress
  let lockCreationHash

  // here we need to setup unlock template properly
  const unlock = await walletService.getUnlockContract()

  // deploy the relevant template
  const templateAddress = await deployTemplate(publicLockVersion)

  // prepare unlock for upgradeable locks
  const lockVersionNumber = parseInt(publicLockVersion.replace('v', ''))
  await unlock.addLockTemplate(templateAddress, lockVersionNumber)

  // set the right template in Unlock
  const tx = await unlock.setLockTemplate(templateAddress)
  await tx.wait()

  // parse erc20
  const { isERC20 } = lockParams
  lockParams.currencyContractAddress = isERC20 ? await ERC20.getAddress() : null

  // unique Lock name to avoid conflicting addresses
  lockParams.name = `Unlock${unlockVersion} - Lock ${publicLockVersion} - ${lockParams.name}`

  // use createLockAtVersion starting on v10
  lockParams.publicLockVersion = parseInt(publicLockVersion.replace('v', ''))

  lockAddress = await walletService.createLock(
    lockParams,
    {} /** transactionOptions */,
    (error, hash) => {
      if (error) {
        throw error
      }
      lockCreationHash = hash
    }
  )
  lock = await web3Service.getLock(lockAddress, chainId)

  if (versionEqualOrAbove(publicLockVersion, 'v10')) {
    // test will fail with default to 1 key per address
    await walletService.setMaxKeysPerAddress({
      lockAddress,
      chainId,
      maxKeysPerAddress: 100,
    })
  }

  return {
    lock,
    lockAddress,
    lockCreationHash,
  }
}

export const versionEqualOrAbove = (publicLockVersion, targetVersion) => {
  const versionNumber = parseInt(publicLockVersion.replace('v', ''))
  const targetVersionNumber = parseInt(targetVersion.replace('v', ''))
  return versionNumber >= targetVersionNumber
}

export const versionEqualOrBelow = (publicLockVersion, targetVersion) => {
  const versionNumber = parseInt(publicLockVersion.replace('v', ''))
  const targetVersionNumber = parseInt(targetVersion.replace('v', ''))
  return versionNumber <= targetVersionNumber
}

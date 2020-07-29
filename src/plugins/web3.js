import Vue from 'vue'
import { Harmony, HarmonyExtension } from '@harmony-js/core'
import { Messenger, Provider } from '@harmony-js/network'

import {
  ChainID,
  ChainType
} from '@harmony-js/utils'

const URL_ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://api.s0.t.hmny.io' : 'https://api.s0.b.hmny.io'
const CHAIN_ID = process.env.NODE_ENV === 'production' ? ChainID.HmyMainnet : ChainID.HmyTestnet
const harmony = new Harmony(URL_ENDPOINT, {
  chainType: ChainType.Harmony,
  chainId: CHAIN_ID
})

const web3Plugin = {
  install (VueInstance) {
    VueInstance.prototype.$web3 = harmony
  }
}
Vue.use(web3Plugin)

new Promise((resolve) => {
  const check = () => {
    if (!window.harmony) { 
      setTimeout(check, 250)
    } else {
      resolve(window.harmony)
      const harmonyEx = new HarmonyExtension(window.harmony)
      harmonyEx.provider = new Provider(URL_ENDPOINT).provider
      harmonyEx.messenger = new Messenger(harmonyEx.provider, ChainType.Harmony, CHAIN_ID)
      harmonyEx.setShardID(0)
      harmonyEx.wallet.messenger = harmonyEx.messenger
      harmonyEx.blockchain.messenger = harmonyEx.messenger
      harmonyEx.transactions.messenger = harmonyEx.messenger
      harmonyEx.contracts.wallet = harmonyEx.wallet

      const ext = {
        install (VueInstance) {
          VueInstance.prototype.$harmonyEx = harmonyEx
        }
      }
  
      Vue.use(ext)
    } 
  }
  check()
})

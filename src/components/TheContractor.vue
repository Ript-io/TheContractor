<template>
  <vs-row vs-justify="space-around">
    <vs-col vs-type="flex" vs-w="6">
      <vs-card title="The Contractor">
        <div style="display:flex">
        <vs-alert style="margin-bottom:10px; align-self:center" active="true">
          Enter your contract's ABI and address below. You can save your ABI for later, this is stored in your browser's local storage and will not follow you to other devices. The list will be pre-populated with
          well-known contracts, such as, the Ript Token Creator ABI and bUSD implementation ABI.
        </vs-alert>        <div v-if="$env !== 'mainnet'" style="align-self:center; margin-left:10px">
      <vs-chip color="red" label small class="font-weight-medium">
        {{ $env.toUpperCase() }}
      </vs-chip>
    </div>        
    <div v-else style="align-self:center; margin-left:10px">
            <vs-chip color="primary" label small class="font-weight-medium">
        {{ $env.toUpperCase() }}
      </vs-chip>
    </div>
    <div  v-if="!getUser.address" style="width:75px;margin-left:10px; align-self:center"><vs-button style="width:75px" v-on:click="login">Login</vs-button>          </div>
</div>
<div style="display:flex" v-if="getUser.address"><h3 style="margin-top:10px; margin-bottom:10px">Logged In: {{getUser.address}}</h3><vs-button @click="logout" title="Logout" color="primary" type="flat" icon="logout"></vs-button></div>
        <div style="display:flex; margin-bottom:5px">
      
          <vs-input
            style="width:50%"
            label="Contract Address"
            placeholder="Enter Contract Address Here"
            v-model="contractAddress"
          />
          <v-select
            style="align-self:flex-end; width:25%; margin-left:5px"
            v-model="selectedSavedAbi"
            label="name"
            @input="populateFromSavedABI"
            :options="localStorageContracts"
            placeholder="Saved Contracts"
          />
          <v-select
            style="align-self:flex-end; width:25%; margin-left:5px"
            v-model="selectedWellKnown"
            label="name"
            @input="populateFromWellKnown"
            :options="wellKnownAbi"
            placeholder="Well-Known Contracts"
          />
        </div>
        <vs-textarea @input="clearSave" label="Paste Your ABI Here" v-model="abi" height="200px" />
        <vs-button v-on:click="parseAbi">Read Contract</vs-button>
        <div v-if="selectedSavedAbi ? selectedSavedAbi.length === 0 : []" style="float:right; display:flex">
                <vs-checkbox style="color:#000" v-model="saveABI">Save Contract</vs-checkbox>
            <vs-input placeholder="Contract Name" v-model="savedABIName" />
        </div>
        <div v-else style="float:right">
          <vs-button v-on:click="deleteSavedABIEntry">Delete Saved ABI</vs-button>
        </div>
        <span v-if="error" class="text-danger" style="text-align:center; display:block">
          <br />
          {{this.error}}
        </span>
      </vs-card>
    </vs-col>
    <vs-col vs-type="flex" vs-w="4" v-if="abiJson">
      <vs-card title="Interact with your contract">
        <v-select
          style="margin-bottom:5px"
          placeholder="Click to interact with your functions"
          @input="changeFunction"
          v-model="selectedAbi"
          :options="abiJson"
          label="name"
        >
          <template #option="{name, stateMutability}">
            {{name}}
            <small style="float:right">{{stateMutability}}</small>
          </template>
        </v-select>
        <div v-if="selectedAbi">
          <div v-if="selectedAbi.inputs.length === 0 && selectedAbi.stateMutability === 'view'">
            <vs-textarea
              v-if="result"
              height="125px"
              size="large"
              label="Value:"
              v-model="result"
            />
            <vs-checkbox
              v-if="result && canConvertResult"
              @input="convertResultToOne"
              v-model="convertResult"
            >Convert result into integer</vs-checkbox>
          </div>
          <div
            v-else-if="selectedAbi.inputs.length === 0 && selectedAbi.stateMutability === 'nonpayable'"
          >
            <vs-button v-on:click="executeActions" style="margin-top:5px" color="primary">Execute</vs-button>
          </div>
          <div
            v-else-if="selectedAbi.inputs.length !== 0 && selectedAbi.stateMutability === 'view'"
          >
            <div v-for="(input,index) in selectedAbi.inputs" :key="input.name">
              <label>{{input.name}}</label>
              <vs-input
                style="width:100%; margin-bottom:5px"
                v-model="inputParams[index]"
                :placeholder="input.type"
                :name="input"
              />
            </div>
            <vs-button v-on:click="inputAction" style="margin-top:5px" color="primary">Execute</vs-button>
            <vs-textarea
              v-if="result"
              height="125px"
              style="width:100%; margin-top:5px"
              size="large"
              label="Value:"
              v-model="result"
            />
            <vs-checkbox
              v-if="result && canConvertResult"
              @input="convertResultToOne"
              v-model="convertResult"
            >Convert result into integer</vs-checkbox>
          </div>
          <div v-else-if="selectedAbi.stateMutability === 'payable'">
            <label>Enter Amount Here</label><div style="display:flex">
              <vs-input
                style="width:100%; margin-bottom:5px"
                v-model="payableAmount"
                :placeholder="convertToOne ? 'ONE' : 'Wei'"
              />                  
              <vs-tooltip
                    color="darkred"
                    position="left"
                    title="Convert to ONE"
                    text="If checked, the number provided will be automatically converted from ONE to Wei. However, only use if you know what you are doing!"
                  >
                    <label style="color:grey">ONE</label>
                    <vs-checkbox v-model="convertToOne" />
                  </vs-tooltip></div>

            <div v-for="(input,index) in selectedAbi.inputs" :key="input.name">
              <label>{{input.name}}</label>
              <vs-input
                style="width:100%; margin-bottom:5px"
                v-model="inputParams[index]"
                :placeholder="input.type"
                :name="input"
              />
            </div>
            <vs-button v-on:click="executeActions" style="margin-top:5px" color="primary">Execute</vs-button>
          </div>
          <div v-else>
            <div v-for="(input,index) in selectedAbi.inputs" :key="index">
              <div v-if="input.type.indexOf('int') === -1">
                <label>{{input.name}}</label>
                <vs-input
                  style="width:100%; margin-bottom:5px"
                  v-model="inputParams[index]"
                  :placeholder="input.type"
                  :name="input"
                />
              </div>
              <div v-else>
                <label>{{input.name}}</label>
                <div style="display:flex;margin-bottom:5px">
                  <vs-input v-model="inputParams[index]" :placeholder="input.type" :name="input" style="width:100%; margin-bottom:5px" />
                                          <vs-tooltip
                        color="darkred"
                        class="flex"
                        position="left"
                        title="Convert to ONE"
                        text="If checked, the number provided will be automatically converted from ONE to Wei. However, only use if you know what you are doing!"
                      >
                      <vs-checkbox v-model="inputParamsConvert[index]" />
                                              
                        <label style="color:grey">ONE</label>
                      </vs-tooltip>
                      </div>
              </div>
            </div>
            <vs-button v-on:click="executeActions" style="margin-top:5px" color="primary">Execute</vs-button>
          </div>
        </div>
        <div style="text-align:center;margin-top:5px" v-if="txHash">
          <vs-alert>
          <label>Transaction Hash:</label>&nbsp;
          <b>
            <a
              class="underline"
              :href="`${explorerLink}/#/tx/${txHash}`"
              target="_blank"
            >{{ txHash }}</a>
          </b>
          </vs-alert>
        </div>
      </vs-card>
    </vs-col>
  </vs-row>
</template>

<script>
import vSelect from 'vue-select'
import { Contract } from '@harmony-js/contract'
import { Unit } from '@harmony-js/utils'
import { fromBech32 } from '@harmony-js/crypto'
import wellKnown from '../assets/abi/well-known.json'

Storage.prototype.setObj = function (key, obj) {
  return this.setItem(key, JSON.stringify(obj))
}

Storage.prototype.getObj = function (key) {
  return JSON.parse(this.getItem(key))
}

export default {
  data () {
    return {
      abi: '',
      abiJson: '',
      selectedAbi: '',
      error: '',
      result: '',
      canConvertResult: false,
      convertResult: false,
      contractInstance: [],
      contractAddress: '',
      inputParams: [],
      inputParamsConvert: [],
      saveABI: false,
      savedABIName: '',
      selectedSavedAbi: [],
      localStorageContracts: [],
      txHash: '',
      convertToOne: false,
      payableAmount: '',
      explorerLink: process.env.NODE_ENV === 'production' ? 'https://explorer.harmony.one' : 'https://explorer.testnet.harmony.one',
      wellKnownAbi: wellKnown,
      selectedWellKnown: [],
      getUser: {
        address: ''
      }
    }
  },
  mounted () {
    this.selectedSavedAbi = ''
    this.getContractList()
  },
  methods: {
        login () {
      if (window.harmony) {
        window.harmony.getAccount(this.$web3).then(account => {
          this.getUser.address = account.address
        })
      } else {
        this.$vs.notify({title:'Please install Math Wallet', time:10000, text:'Math wallet is required to unlock all functionality.', color:'danger', icon:'error'})

      }
    },
        async logout () {
      await window.harmony.forgetIdentity()
      this.getUser.address = ''
    },
    convertResultToOne () {
      this.result = this.convertResult ? new Unit(this.result).asWei().toOne() : new Unit(this.result).asOne().toWei()
    },
    clearSave () {
      if (this.selectedSavedAbi) {
        this.selectedSavedAbi = []
      }
    },
    convertAddress (input) {
      return input.startsWith('one') ? fromBech32(input) : input
    },
    deleteSavedABIEntry () {
      const newList = JSON.parse(localStorage.getItem('savedContracts')).filter(
        x => x.name !== this.selectedSavedAbi.name
      )
      localStorage.setObj('savedContracts', newList)
      this.$vs.notify({
        title: 'Success.',
        time: 10000,
        text: `You successfully removed ${this.selectedSavedAbi.name} from your list!`,
        color: 'success',
        icon: 'thumb_up'
      })
      this.selectedSavedAbi = ''
      this.getContractList()
    },
    async changeFunction () {
      this.inputParams = []
      this.inputParamsConvert = []
      this.convertResult = false
      this.payableAmount = ''
      this.instantAction()
    },
    async instantAction () {
      this.result = ''
      this.txHash = ''
      if (this.selectedAbi.stateMutability === 'view') {
        if (this.inputParams.length === 0 && this.selectedAbi.inputs.length > 0) return
        this.contractInstance = new Contract(
          this.abiJson,
          this.contractAddress,
          { gasPrice: new Unit('1000000000').toWei(), gas: '1000000' },
          this.$web3
        )

        if (this.getUser.address) {
          const options = {
            gasPrice: new Unit('1000000000').toWei(),
            gas: '1000000',
            from: fromBech32(this.getUser.address)
          }

          const ext = this.$harmonyEx.contracts.createContract(
            this.abiJson,
            this.contractAddress
          )

          if (this.inputParams.length) {
            this.result = await ext.methods[this.selectedAbi.name](
              ...this.inputParams
            ).call(options)
          } else {
            this.result = await ext.methods[this.selectedAbi.name]().call(
              options
            )
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (this.inputParams.length) {
            this.result = await this.contractInstance.methods[
              this.selectedAbi.name
            ](...this.inputParams).call()
          } else {
            this.result = await this.contractInstance.methods[
              this.selectedAbi.name
            ]().call()
          }
        }
        if (this.selectedAbi.outputs.length > 1) {
          this.result = JSON.stringify(this.result)
        } else {
          this.result = this.result.toString()
        }
      }
      this.canConvertResult =
        Number.isInteger(parseInt(this.result)) &&
        !this.result.toString().startsWith('one') &&
        !this.result.toString().startsWith('0x')
      this.convertResult = false
    },
    async inputAction () {
      this.result = ''
      this.txHash = ''
      if (this.selectedAbi.stateMutability === 'view') {
        if (this.inputParams.length === 0 && this.selectedAbi.inputs.length > 0) return
        this.contractInstance = new Contract(
          this.abiJson,
          this.contractAddress,
          { gasPrice: new Unit('1000000000').toWei(), gas: '1000000' },
          this.$web3
        )
        const mutateParams = this.inputParams.map(x => this.convertAddress(x))

        if (this.getUser.address) {
          const options = {
            gasPrice: new Unit('1000000000').toWei(),
            gas: '1000000',
            from: fromBech32(this.getUser.address)
          }

          const ext = this.$harmonyEx.contracts.createContract(
            this.abiJson,
            this.contractAddress
          )
          if (this.inputParams.length) {
            this.result = await ext.methods[this.selectedAbi.name](
              ...mutateParams
            ).call(options)
          } else {
            this.result = await ext.methods[this.selectedAbi.name]().call(
              options
            )
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (this.inputParams.length) {
            this.result = await this.contractInstance.methods[
              this.selectedAbi.name
            ](...mutateParams).call()
          } else {
            this.result = await this.contractInstance.methods[
              this.selectedAbi.name
            ]().call()
          }
        }
        
        if (this.selectedAbi.outputs.length > 1) {
          this.result = JSON.stringify(this.result)
        }
      }
      this.canConvertResult =
        Number.isInteger(parseInt(this.result)) &&
        !this.result.toString().startsWith('one') &&
        !this.result.toString().startsWith('0x')
      this.convertResult = false
    },
    async executeActions () {
      if (!this.getUser.address) {
        this.$vs.notify({
          title: 'Login',
          time: 10000,
          text: 'Please login to use this functionality.',
          color: 'danger',
          icon: 'thumb_down'
        })
        return
      }
      this.txHash = ''
      // eslint-disable-next-line init-declarations
      let txHash, receipt, confirmation, error

      const getParamsConvert = this.inputParamsConvert
      const mutateParams = this.inputParams
        .map(x => this.convertAddress(x))
        .map(function (value, index) {
          if (getParamsConvert[index] === true) {
            return new Unit(value).asOne().toWei()
          } else {
            return value
          }
        })

      const ext = this.$harmonyEx.contracts.createContract(
        this.abiJson,
        this.contractAddress
      )
      const payableAmount = this.payableAmount ? this.convertToOne ? new Unit(this.payableAmount).asOne().toWei() : this.payableAmount : 0
      if (this.inputParams) {
        await ext.methods[this.selectedAbi.name](
          ...mutateParams
        ).send({
          value: payableAmount,
          gasLimit: '9000000',
          gasPrice: new Unit('1000000000').toWei()
        }).on('transactionHash', (_hash) => {
          txHash = _hash
        })
          .on('receipt', (_receipt) => {
            receipt = _receipt
          })
          .on('confirmation', (_confirmation) => {
            confirmation = _confirmation
          })
          .on('error', (_error) => {
            error = _error
          })
        if (error) {
          this.$vs.notify({
            title: 'Failed to send transaction.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
        }

        if (confirmation === 'REJECTED') {
          this.$vs.notify({
            title: 'TX Rejected.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
          return
        }

        if (txHash) {
          this.txHash = txHash
        }

        if (receipt) {
          this.$vs.notify({
            title: 'Success.',
            time: 10000,
            text: 'You successfully wrote to your contract!',
            color: 'success',
            icon: 'thumb_up'
          })
        } else {
          this.$vs.notify({
            title: 'Something went wrong.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
        }
      } else {
        await ext.methods[this.selectedAbi.name]().send({
          value: payableAmount,
          gasLimit: '9000000',
          gasPrice: new Unit('1000000000').toWei()
        }).on('transactionHash', (_hash) => {
          txHash = _hash
        })
          .on('receipt', (_receipt) => {
            receipt = _receipt
          })
          .on('confirmation', (_confirmation) => {
            confirmation = _confirmation
          })
          .on('error', (_error) => {
            error = _error
          })
        if (error) {
          this.$vs.notify({
            title: 'Failed to send transaction.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
        }

        if (confirmation === 'REJECTED') {
          this.$vs.notify({
            title: 'TX Rejected.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
          return
        }

        if (txHash) {
          this.txHash = txHash
        }

        if (receipt) {
          this.$vs.notify({
            title: 'Success.',
            time: 10000,
            text: 'You successfully wrote to your contract!',
            color: 'success',
            icon: 'thumb_up'
          })
        } else {
          this.$vs.notify({
            title: 'Something went wrong.',
            time: 10000,
            text: 'Ooops. Something went wrong.',
            color: 'danger',
            icon: 'thumb_down'
          })
        }
      }
      this.convertResult = false
    },
    populateFromSavedABI () {
      const getABI = JSON.parse(localStorage.getItem('savedContracts')).filter(
        x => x.name === this.selectedSavedAbi.name
      )
      this.contractAddress = getABI[0].address
      this.abi = getABI[0].abi
      this.selectedWellKnown = ''
    },
    populateFromWellKnown () {
      this.contractAddress = this.selectedWellKnown.contractAddress
      this.abi = JSON.stringify(this.selectedWellKnown.abi)
      this.selectedSavedAbi = ''
    },
    getContractList () {
      this.localStorageContracts =
        localStorage.getObj('savedContracts').length > 0 ? localStorage.getObj('savedContracts') : []
    },
    parseAbi () {
      if (!this.contractAddress) {
        this.$vs.notify({
          title: 'Please enter contract address.',
          time: 10000,
          text: 'You must fill in contract address.',
          color: 'danger',
          icon: 'thumb_down'
        })
        return
      }
      this.contractAddress = this.convertAddress(this.contractAddress)
      this.selectedAbi = ''
      if (this.saveABI) {
        let currentArray = []
        if (!localStorage.getObj('savedContracts')) {
          currentArray = localStorage.getObj('savedContracts') ? localStorage.getObj('savedContracts') : []
        } else {
          currentArray = JSON.parse(localStorage.savedContracts)
        }
        const savedContractObj = {
          name: this.savedABIName,
          address: this.contractAddress,
          abi: this.abi
        }
        if (
          currentArray.filter(x => x.name === savedContractObj.name).length > 0
        ) {
          this.$vs.notify({
            title: 'Name Taken.',
            time: 10000,
            text: `The name ${savedContractObj.name} is already taken in your list. Please choose a new name.`,
            color: 'danger',
            icon: 'thumb_down'
          })
          return
        }
        currentArray.push(savedContractObj)
        localStorage.setObj('savedContracts', currentArray)
        this.$vs.notify({
          title: 'Success.',
          time: 10000,
          text: `You successfully added ${this.savedABIName} to your list!`,
          color: 'success',
          icon: 'thumb_up'
        })
        this.getContractList()
        this.selectedSavedAbi = this.localStorageContracts.filter(
          x => x.name === this.savedABIName
        )
      }
      let abiJSON = ''
      try {
        abiJSON = JSON.parse(this.abi)
      } catch (e) {
        this.error = e.message
      }
      this.abiJson = abiJSON
        .filter(x => x.type === 'function')
        .sort(function (a, b) {
          const nameA = a.stateMutability.toUpperCase() // ignore upper and lowercase
          const nameB = b.stateMutability.toUpperCase() // ignore upper and lowercase
          if (nameA < nameB) {
            return -1
          }
          if (nameA > nameB) {
            return 1
          }

          // names must be equal
          return 0
        })
      this.error = ''
    }
  },
  components: {
    'v-select': vSelect
  }
}
</script>
<style>
.vs-textarea {
  height:91%
}

.vs__dropdown-option--highlight {
  background: #1a3b4c !important;
}
</style>
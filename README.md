# GraphQL code generation 

This is a guide to help you quickly integrate Everscale into your Typescript project using Evercloud GraphQL API for making queries to the blockchain, and [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) for automatically generating type definitions from the API schema.

## Evercloud GraphQL

[Evercloud](https://www.evercloud.dev/) makes it easy to set up and manage a GraphQL endpoint for your application, providing you with secure access to the Everscale blockchain.

Follow [this guide](https://docs.evercloud.dev/products/evercloud/get-started) to set up a project on Evercloud. Make sure to note down the project ID in the security tab, as well as the BASE64 encoded project secret for HTTP Authorization, as you will need to configure these in the code.

Once you have the necessary credentials, you're ready to start making GraphQL queries to the Everscale network in your TypeScript project. To cater to various development preferences, we'll provide two versions for each example: one using the Everscale SDK (follow [this guide](https://docs.everos.dev/ever-sdk/guides/installation/add_sdk_to_your_app) for setup instructions) and another using [Axios](https://axios-http.com/), a popular HTTP client for JavaScript.

## Setting up code generation

First, add both the `graphql` and `@graphql-codegen/cli` packages to your project's dependencies:

**npm**:

```shell
npm install graphql
npm install -D typescript
npm install -D @graphql-codegen/cli
npm install -D @graphql-codegen/typescript
```

**yarn**:

```shell
yarn add graphql
yarn add -D typescript
yarn add -D @graphql-codegen/cli
yarn add -D @graphql-codegen/typescript
```

Next, create a file named `codegen.ts` in your project's root folder containing the following (adjust as needed):

```typescript
import type {CodegenConfig} from '@graphql-codegen/cli'

// configure your credentials here
const PROJECT_ID = ''
const PROJECT_SECRET_BASE64 = ''

const schemaUrl = `https://mainnet.evercloud.dev/${PROJECT_ID}/graphql`

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [schemaUrl]: {
        headers: {
          Authorization: `Basic ${PROJECT_SECRET_BASE64}`,
        },
      },
    },
  ],
  documents: ['src/**/*.ts'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript'],
    },
  },
  watch: true,
}

export default config
```

Finally, follow [these instructions](https://the-guild.dev/graphql/codegen/docs/getting-started/development-workflow) to add GraphQL code generation to your development workflow.

## API initialization

To start making queries to the GraphQL API, you'll need to configure your client. Following is an example on how you can do that using either the Everscale SDK or Axios.

**Everscale SDK**:

```typescript
import {TonClient} from '@eversdk/core'
import {libNode} from '@eversdk/lib-node'

// configure your credentials here
const PROJECT_ID = ''
const PROJECT_SECRET_BASE64 = ''

TonClient.useBinaryLibrary(libNode)

const client = new TonClient({
  network: {
    endpoints: [`https://mainnet.evercloud.dev/${PROJECT_ID}/graphql`],
    access_key: PROJECT_SECRET_BASE64,
  },
})
```

**Axios**:
```typescript
import axios from 'axios'

// configure your credentials here
const PROJECT_ID = ''
const PROJECT_SECRET_BASE64 = ''

axios.defaults.baseURL = `https://mainnet.evercloud.dev/${PROJECT_ID}/graphql`
axios.defaults.headers.post['Content-Type'] = 'application/json'
if (PROJECT_SECRET_BASE64) {
  axios.defaults.auth = {
    username: '',
    password: PROJECT_SECRET_BASE64,
  }
}
```

## Code examples

Following examples demonstrate how you can use the types generated from the GraphQL schema in your project.

### Get account balance

**Everscale SDK**:

```typescript
import {BlockchainQuery} from './generated/graphql'

// Specify your account's address 
const ACCOUNT_ADDRESS = ''

try {
  const query = `
    query {
      blockchain {
        account(
          address: "${ACCOUNT_ADDRESS}"
        ) {
          info {
            balance(format: DEC)
          }
        }
      }
    }`
  const {result} = await client.net.query({query})
  const blockchain: BlockchainQuery = result.data.blockchain
  console.log(`The account balance is ${blockchain.account.info.balance / 10**9}`)
  client.close()
} catch (error) {
  console.error(error)
}
```

**Axios**:
```typescript
import {BlockchainQuery} from './generated/graphql'

// Specify your account's address 
const ACCOUNT_ADDRESS = ''

try {
  const query = `
    query {
      blockchain {
        account(
          address: "${ACCOUNT_ADDRESS}"
        ) {
          info {
            balance(format: DEC)
          }
        }
      }
    }`
  const {data} = await axios.post('', {query})
  const blockchain: BlockchainQuery = data.data.blockchain
  console.log(`The account balance is ${blockchain.account.info.balance / 10**9}`)
} catch (error) {
  console.error(error)
}
```

### Get incoming messages

This example shows how to query incoming messages for a specified destination account using both the Everscale SDK and Axios. This can be particularly useful for processing incoming token transfers or other transaction-related information.

**Everscale SDK**:

```typescript
import {BlockchainQuery} from './generated/graphql'

// Specify your account's address 
const ACCOUNT_ADDRESS = ''

interface MyQuery {
  address: string
  cursor: string | null
  count: number
  seq_no: number
}

try {
  const query = `
    query MyQuery($address: String!, $cursor: String, $count: Int, $seq_no: Int){
      blockchain {
        account(address: $address){
          messages(
            msg_type: ExtIn
            master_seq_no_range: {
              start: $seq_no
            }
            first: $count
            after: $cursor
          ){
            edges{
              node{
                hash
                msg_type
                value(format: DEC)
                src
              }
            }
          }
        }
      }
    }`
  const variables: MyQuery = {
    address: ACCOUNT_ADDRESS,
    cursor: null,
    count: 10, // number per page, max: 50
    seq_no: 1, // set to the initial block sequence number
  }
  while (true) { // infinity loop, implement exit condition here
    const {result} = await client.net.query({query, variables})
    const data: BlockchainQuery = result.data
    const messages = data.account.messages
    variables.cursor = messages.pageInfo.endCursor || variables.cursor
    messages.edges.forEach(edge => {
      const message = edge.node
      // do something with message
      console.log(message)
    })
    // implement a delay here so as not to spam the API
  }

  client.close()
} catch (error) {
  console.error(error)
}
```

**Axios**:
```typescript
import {BlockchainQuery} from './generated/graphql'

// Specify your account's address 
const ACCOUNT_ADDRESS = ''

interface MyQuery {
  address: string
  cursor: string | null
  count: number
  seq_no: number
}

try {
  const query = `
    query MyQuery($address: String!, $cursor: String, $count: Int, $seq_no: Int){
      blockchain {
        account(address: $address){
          messages(
            msg_type: ExtIn
            master_seq_no_range: {
              start: $seq_no
            }
            first: $count
            after: $cursor
          ){
            edges{
              node{
                hash
                msg_type
                value(format: DEC)
                src
              }
            }
          }
        }
      }
    }`
  const variables: MyQuery = {
    address: ACCOUNT_ADDRESS,
    cursor: null,
    count: 10, // number per page, max: 50
    seq_no: 1, // set to the initial block sequence number
  }
  while (true) { // infinity loop, implement exit condition here
    const {data} = await axios.post('', {query, variables})
    const result: BlockchainQuery = data.data
    const messages = result.account.messages
    variables.cursor = messages.pageInfo.endCursor || variables.cursor
    messages.edges.forEach(edge => {
      const message = edge.node
      // do something with message
      console.log(message)
    })
    // implement a delay here so as not to spam the API
  }
} catch (error) {
  console.error(error)
}
```

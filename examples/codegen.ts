import type {CodegenConfig} from '@graphql-codegen/cli'

// configure your credentials here
const PROJECT_ID = ''
const PROJECT_SECRET = ''

const schemaUrl = `https://mainnet.evercloud.dev/${PROJECT_ID}/graphql`

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [schemaUrl]: {
        headers: {
          Authorization: `Basic ${PROJECT_SECRET}`,
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

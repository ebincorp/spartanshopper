/**
 * Ambient types for the vendored Amazon Creators API Node.js SDK
 * (vendor/creatorsapi-sdk/dist/index.js — CommonJS, ships no declarations).
 * Only the surface used by lib/creators-api.ts is declared.
 */
declare module '*creatorsapi-sdk/dist/index.js' {
  export class ApiClient {
    credentialId: string
    credentialSecret: string
    version: string
    marketplace: string | null
    authEndpoint: string | null
    timeout: number
  }

  export class GetItemsRequestContent {
    partnerTag: string
    itemIds: string[]
    resources: string[]
    condition?: string
    currencyOfPreference?: string
    languagesOfPreference?: string[]
  }

  // The response is deserialized into plain nested objects; we navigate it
  // defensively in creators-api.ts, so `any` is the honest shape here.
  export class DefaultApi {
    constructor(apiClient: ApiClient)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getItems(xMarketplace: string, req: GetItemsRequestContent): Promise<any>
  }
}

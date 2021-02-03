import { lookup } from 'https://deno.land/x/media_types/mod.ts'

const DEFAULT_REFERER = 'https://localhost:8080/'
const DEFAULT_SDK_SOURCE = 'onfido_web_sdk'
const DEFAULT_SDK_VERSION = '6.4.0'

const DEFAULT_METADATA = {
  captureMethod: 'html5',
  imageResizeInfo: null,
  isCrossDeviceFlow: false,
  deviceType: 'desktop',
  system: {
    os: 'Linux',
    os_version: '0',
    browser: 'Chrome',
    browser_version: '88.0.4324.146',
  },
}

export const DEFAULT_DOCUMENT_VALIDATIONS = {
  detect_document: 'error',
  detect_cutoff: 'error',
  detect_glare: 'error',
  detect_blur: 'error',
}

export default class OnfidoApi {
  private readonly apiUrl = 'https://api.onfido.com/v3'
  private token: string | null = null

  init = async (): Promise<void> => {
    const url = 'https://token-factory.onfido.com/sdk_token'
    const secret = Deno.env.get('SDK_TOKEN_FACTORY_SECRET')

    const res = await fetch(url, {
      headers: {
        Authorization: `BASIC ${secret}`,
        Referer: DEFAULT_REFERER,
      },
    })

    if (res.status !== 200) {
      const error = new Error('Request failed')
      Object.assign(error, { meta: res })
      throw error
    }

    const json = (await res.json()) as Record<string, string>
    this.token = json.message
  }

  uploadDocument = async (
    type: string,
    filename: string,
    validations?: Record<string, string | undefined>
  ): Promise<Record<string, unknown>> => {
    const fileArray = await Deno.readFile(filename)
    const fileBlob = new Blob([fileArray.buffer], { type: lookup(filename) })

    const body = new FormData()
    body.append('type', type)
    body.append('file', fileBlob)
    body.append('sdk_metadata', JSON.stringify(DEFAULT_METADATA))

    if (validations) {
      body.append('sdk_validations', JSON.stringify(validations))
    }
    body.append('sdk_source', DEFAULT_SDK_SOURCE)
    body.append('sdk_version', DEFAULT_SDK_VERSION)

    const res = await fetch(`${this.apiUrl}/documents`, {
      body,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Referer: DEFAULT_REFERER,
      },
    })

    return res.json()
  }
}

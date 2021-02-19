import { h, FunctionComponent } from 'preact'
import { memo, useEffect, useState } from 'preact/compat'

import type { ApiTestEnvs } from './types'

interface ExtendedError extends Error {
  meta: XMLHttpRequest | Record<string, unknown>
}

type BinaryMediaReponse = {
  media_id: string
}

type BinaryMediaPayload = {
  binary_media: { uuid: string }
}

type DocumentFieldPayload = {
  name: string
  raw_value: string
  source: string
}

type DocumentFieldsList = {
  document_fields: DocumentFieldPayload[]
}

type CreateDocumentResponse = {
  applicant_uuid: string
  document_uuid: string
  document_media: Array<BinaryMediaPayload | DocumentFieldsList>
  document_type: 'IDENTITY_DOCUMENT' | 'OTHERS'
}

export const readFileAsBinary = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Reader result type mismatched'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })

const handleRequestFailed = (
  meta: XMLHttpRequest | Record<string, unknown>
): ExtendedError => {
  const error = new Error('Request failed')
  Object.assign(error, { meta })
  return error as ExtendedError
}

const getToken = (env: ApiTestEnvs): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'GET',
      `https://sdk-token-factory.eu-west-1.${env}.onfido.xyz/sdk_token`
    )

    request.setRequestHeader(
      'Authorization',
      `BASIC ${process.env.SDK_TOKEN_FACTORY_SECRET}`
    )

    request.onload = () => {
      const response = JSON.parse(request.response)

      if (request.status === 200 || request.status === 201) {
        const { message: token } = response || {}
        resolve(token)
      } else {
        reject(handleRequestFailed(response))
      }
    }

    request.onerror = () => reject(handleRequestFailed(request))

    request.send()
  })

export const uploadBinaryMedia = (
  env: ApiTestEnvs,
  token: string,
  file: File
): Promise<BinaryMediaReponse> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api-gateway.eu-west-1.${env}.onfido.xyz/v4/binary_media`
    )

    request.setRequestHeader('Authorization', `Bearer ${token}`)

    request.onload = () => {
      const response = JSON.parse(request.response)

      if (request.status === 200 || request.status === 201) {
        resolve(response)
      } else {
        reject(handleRequestFailed(response))
      }
    }

    request.onerror = () => reject(handleRequestFailed(request))

    const formData = new FormData()
    formData.append('media', file, file.name)
    request.send(formData)
  })

const createDocument = (
  env: ApiTestEnvs,
  token: string,
  uuids: string[]
): Promise<CreateDocumentResponse> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api-gateway.eu-west-1.${env}.onfido.xyz/v4/documents`
    )

    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.setRequestHeader('Content-Type', 'application/json')

    request.onload = () => {
      const response = JSON.parse(request.response)

      if (request.status === 200 || request.status === 201) {
        resolve(response)
      } else {
        reject(handleRequestFailed(response))
      }
    }

    request.onerror = () => reject(handleRequestFailed(request))

    const body = {
      document_media: uuids.map((uuid) => ({ binary_media: { uuid } })),
    }
    request.send(JSON.stringify(body))
  })

type Props = {
  env: ApiTestEnvs
}

const ApiTests: FunctionComponent<Props> = ({ env }) => {
  const [token, setToken] = useState(null)
  const [frontCapture, setFrontCapture] = useState<File>(null)
  const [backCapture, setBackCapture] = useState<File>(null)
  const [error, setError] = useState<ExtendedError>(null)
  const [response, setResponse] = useState<CreateDocumentResponse>(null)

  useEffect(() => {
    getToken(env).then(setToken)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploads = async () => {
    setError(null)
    const uuids: string[] = []

    try {
      const { media_id: frontUuid } = await uploadBinaryMedia(
        env,
        token,
        frontCapture
      )
      uuids.push(frontUuid)

      if (backCapture) {
        const { media_id: backUuid } = await uploadBinaryMedia(
          env,
          token,
          backCapture
        )
        uuids.push(backUuid)
      }

      const createDocumentRes = await createDocument(env, token, uuids)
      setResponse(createDocumentRes)
    } catch (error) {
      setError(error)
    }
  }

  const handleFormSubmit = (event: Event) => {
    event.preventDefault()
    handleUploads()
  }

  const handleFileChanged = (event: Event) => {
    const input = event.target as HTMLInputElement

    setFrontCapture(input.files[0])
    setBackCapture(input.files[1])
  }

  if (!token) {
    return <span>Fetching token...</span>
  }

  return (
    <div style={{ margin: '0 auto', maxWidth: '30em' }}>
      <h1>v4 API tests</h1>
      <form
        onSubmit={handleFormSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <input type="file" multiple onChange={handleFileChanged} />
        {frontCapture && (
          <button type="submit" style={{ margin: '1em 0' }}>
            Upload
          </button>
        )}
        {error && (
          <div style={{ textAlign: 'left' }}>
            <pre>Error: {error.message}</pre>
            <pre>{JSON.stringify(error.meta, null, 2)}</pre>
          </div>
        )}
        {response && (
          <div style={{ textAlign: 'left' }}>
            <pre>Response:</pre>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  )
}

export default memo(ApiTests)

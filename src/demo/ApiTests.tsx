import { h, FunctionComponent } from 'preact'
import { memo, useEffect, useState } from 'preact/compat'
import { uploadBinaryMedia, createV4Document } from '~utils/onfidoApi'

import type { CreateV4DocumentResponse } from '~types/api'
import type { ApiTestEnvs } from './types'

interface ExtendedError extends Error {
  meta: XMLHttpRequest | Record<string, unknown>
}

const buildBaseUrl = (env: ApiTestEnvs): string => {
  switch (env) {
    case 'dev':
    case 'pre-prod':
      return `https://api-gateway.eu-west-1.${env}.onfido.xyz`
    case 'production':
    default:
      return 'https://api.onfido.com'
  }
}

const getToken = (env: ApiTestEnvs): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const baseUrl =
      env === 'dev' || env === 'pre-prod'
        ? `https://sdk-token-factory.eu-west-1.${env}.onfido.xyz`
        : 'https://token-factory.onfido.com'
    request.open('GET', `${baseUrl}/sdk_token`)

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
        reject(new Error(request.response))
      }
    }

    request.onerror = () => reject(new Error('Request failed'))

    request.send()
  })

type ApiTestsProps = {
  env: ApiTestEnvs
}

const ApiTests: FunctionComponent<ApiTestsProps> = ({ env }) => {
  const [token, setToken] = useState(null)
  const [frontCapture, setFrontCapture] = useState<File>(null)
  const [backCapture, setBackCapture] = useState<File>(null)
  const [videoCapture, setVideoCapture] = useState<File>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ExtendedError>(null)
  const [response, setResponse] = useState<CreateV4DocumentResponse>(null)

  useEffect(() => {
    getToken(env).then(setToken)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploads = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    const baseUrl = buildBaseUrl(env)
    const uuids: string[] = []

    try {
      if (frontCapture) {
        const { media_id: frontUuid } = await uploadBinaryMedia(
          { file: frontCapture, filename: frontCapture.name, sdkMetadata: {} },
          baseUrl,
          token
        )
        uuids.push(frontUuid)
      }

      if (backCapture) {
        const { media_id: backUuid } = await uploadBinaryMedia(
          { file: backCapture, filename: backCapture.name, sdkMetadata: {} },
          baseUrl,
          token
        )
        uuids.push(backUuid)
      }

      if (videoCapture) {
        const { media_id: videoUuid } = await uploadBinaryMedia(
          { file: videoCapture, filename: videoCapture.name, sdkMetadata: {} },
          baseUrl,
          token,
          true
        )
        uuids.push(videoUuid)
      }

      const createDocumentRes = await createV4Document(uuids, baseUrl, token)
      setResponse(createDocumentRes)
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (event: Event) => {
    event.preventDefault()
    handleUploads()
  }

  const handleFileChanged = (event: Event) => {
    const input = event.target as HTMLInputElement

    const files = Array.from(input.files)
    const images = files.filter((file) => file.type.includes('image'))
    const videos = files.filter((file) => file.type.includes('video'))

    setFrontCapture(images[0])
    setBackCapture(images[1])
    setVideoCapture(videos[0])
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
        {(frontCapture || videoCapture) && (
          <button disabled={loading} type="submit" style={{ margin: '1em 0' }}>
            {loading ? 'Uploading...' : 'Upload'}
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

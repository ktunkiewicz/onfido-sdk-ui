import { h, FunctionComponent } from 'preact'
import { memo, useEffect, useState } from 'preact/compat'

import type { ApiTestEnvs } from './types'

const handleRequestFailed = (request: XMLHttpRequest): Error => {
  const error = new Error('Request failed')
  Object.assign(error, { meta: request })
  return error
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
      if (request.status === 200 || request.status === 201) {
        const { message: token } = JSON.parse(request.response) || {}
        resolve(token)
      } else {
        reject(handleRequestFailed(request))
      }
    }

    request.onerror = () => reject(handleRequestFailed(request))

    request.send()
  })

const uploadBinaryMedia = (
  env: ApiTestEnvs,
  token: string,
  file: File
): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api-gateway.eu-west-1.${env}.onfido.xyz/v4/binary_media`
    )

    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.setRequestHeader('Content-Type', 'multipart/form-data')

    request.onload = () => {
      if (request.status === 200 || request.status === 201) {
        resolve(JSON.parse(request.response))
      } else {
        reject(handleRequestFailed(request))
      }
    }

    request.onerror = () => reject(handleRequestFailed(request))

    const formData = new FormData()
    formData.append('media', file, 'document.jpg')
    request.send(formData)
  })

type Props = {
  env: ApiTestEnvs
}

const ApiTests: FunctionComponent<Props> = ({ env }) => {
  const [token, setToken] = useState(null)
  const [file, setFile] = useState<File>(null)
  const [error, setError] = useState<Error>(null)

  useEffect(() => {
    getToken(env).then(setToken)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = (event: Event) => {
    uploadBinaryMedia(env, token, file)
      .then((data) => console.log(data))
      .catch(setError)
    event.preventDefault()
  }

  const handleFileChanged = (event: Event) => {
    const input = event.target as HTMLInputElement
    setFile(input.files[0])
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
        <input type="file" onChange={handleFileChanged} />
        {file && (
          <button type="submit" style={{ margin: '1em 0' }}>
            Upload
          </button>
        )}
        {error && <pre>Error: {error.message}</pre>}
      </form>
    </div>
  )
}

export default memo(ApiTests)

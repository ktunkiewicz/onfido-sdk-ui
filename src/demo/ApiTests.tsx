import { h, FunctionComponent } from 'preact'
import { memo, useEffect, useState } from 'preact/compat'

const REQUEST_ENV = 'pre-prod'

const handleRequestFailed = (request: XMLHttpRequest): Error => {
  const error = new Error('Request failed')
  Object.assign(error, { meta: request })
  return error
}

const getToken = (): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'GET',
      `https://sdk-token-factory.eu-west-1.${REQUEST_ENV}.onfido.xyz/sdk_token`
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
  token: string,
  file: File
): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api-gateway.eu-west-1.${REQUEST_ENV}.onfido.xyz/v4/binary_media`
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

const ApiTests: FunctionComponent = () => {
  const [token, setToken] = useState(null)

  const [file, setFile] = useState<File>(null)
  useEffect(() => {
    getToken().then(setToken)
  }, [])

  const handleFormSubmit = (event: Event) => {
    uploadBinaryMedia(token, file)
      .then((data) => console.log(data))
      .catch((error) => console.log(error))
    event.preventDefault()
  }

  const handleFileChanged = (event: Event) => {
    const input = event.target as HTMLInputElement
    setFile(input.files[0])
  }

  return (
    <div>
      <h1>/v4 APIs tests</h1>
      <form onSubmit={handleFormSubmit}>
        <input type="file" onChange={handleFileChanged} />
        {token && file && <button type="submit">Upload</button>}
      </form>
    </div>
  )
}

export default memo(ApiTests)

import { h, Component } from 'preact'
import Visibility from 'visibilityjs'
import { screenshot } from '~utils/camera'
import { blobToLossyBase64 } from '~utils/blob'
import { randomId } from '~utils/string'
import { DocumentOverlay } from '../Overlay'
import Camera from '../Camera'
import CameraError from '../CameraError'
import { postToBackend } from '~utils/sdkBackend'
import style from '../Camera/style.scss'

import type { ErrorCallback } from '~types/api'
import type { SdkMetadata, UrlsConfig } from '~types/commons'
import type { CapturePayload } from '~types/redux'
import type { TrackScreenProp, TriggerOnErrorProp } from '~types/routers'

const maxAttempts = 3

const requestError = { name: 'REQUEST_ERROR', type: 'error' }

type Props = {
  onError: () => void
  onValidCapture: (payload: CapturePayload) => void
  renderFallback: (text: string) => JSX.Element
  token?: string
  trackScreen: TrackScreenProp
  triggerOnError: TriggerOnErrorProp
  urls: UrlsConfig
}

type State = {
  hasError: boolean
}

type CameraRef = typeof Camera

export default class DocumentAutoCapture extends Component<Props, State> {
  private webcam?: CameraRef = null
  private interval?: number
  private captureIds: string[] = []

  state = {
    hasError: false,
  }

  componentDidMount(): void {
    this.start()
  }

  componentWillUnmount(): void {
    this.stop()
  }

  screenshot = (): void => {
    if (this.captureIds.length < maxAttempts) {
      screenshot(this.webcam, (blob: Blob, sdkMetadata: SdkMetadata) =>
        this.handleScreenshotBlob(blob, sdkMetadata)
      )
    } else {
      console.warn(
        'Screenshotting is slow, waiting for responses before uploading more'
      )
    }
  }

  start = (): void => {
    this.stop()
    this.interval = Visibility.every(1000, this.screenshot)
  }

  stop = (): void => {
    Visibility.stop(this.interval)
  }

  handleScreenshotBlob = (blob: Blob, sdkMetadata: SdkMetadata): void =>
    blobToLossyBase64(
      blob,
      (base64: string) => this.handleScreenshot(blob, base64, sdkMetadata),
      (error: Error) =>
        console.error('Error converting screenshot to base64', error),
      { maxWidth: 200 }
    )

  handleScreenshot = (
    blob: Blob,
    base64: string,
    sdkMetadata: SdkMetadata
  ): void => {
    if (base64) {
      const id = randomId()
      this.captureIds.push(id)

      this.validate(base64, id, (valid) =>
        valid
          ? this.props.onValidCapture({ blob, base64, id, sdkMetadata })
          : null
      )
    }
  }

  validate = (
    base64: string,
    id: string,
    callback: (valid: boolean) => void
  ): void => {
    const { urls, token } = this.props
    const url = urls.detect_document_url
    const data = JSON.stringify({ image: base64, id })

    postToBackend(
      data,
      url,
      token,
      ({ valid }) => {
        this.setProcessed(id)
        callback(valid)
      },
      this.handleValidationError
    )
  }

  setProcessed = (id: string): void => {
    this.captureIds = this.captureIds.filter((captureId) => captureId === id)
  }

  handleValidationError: ErrorCallback = (error) => {
    this.setState({ hasError: true })
    this.props.triggerOnError(error)
    this.props.onError()
  }

  render(): JSX.Element {
    const { hasError } = this.state
    const { trackScreen, renderFallback } = this.props

    return (
      <Camera
        {...this.props}
        className={style.docAutoCaptureFrame}
        webcamRef={(c: CameraRef) => (this.webcam = c)}
        renderError={
          hasError ? (
            <CameraError
              error={requestError}
              {...{ trackScreen, renderFallback }}
            />
          ) : undefined
        }
      >
        <DocumentOverlay />
      </Camera>
    )
  }
}
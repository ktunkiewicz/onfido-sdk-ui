import { h, FunctionComponent } from 'preact'
import { memo, useContext, useEffect, useRef, useState } from 'preact/compat'
import Webcam from 'react-webcam-onfido'

import { mimeType } from '~utils/blob'
import { screenshot } from '~utils/camera'
import { getInactiveError } from '~utils/inactiveError'
import { DOC_VIDEO_INSTRUCTIONS_MAPPING } from '~utils/localesMapping'
import { LocaleContext } from '~locales'
import { DocumentOverlay } from '../Overlay'
import VideoCapture from '../VideoCapture'
import VideoLayer from './VideoLayer'
import useCaptureStep from './useCaptureStep'

import { TILT_MODE, CaptureVariants } from '~types/docVideo'
import type { WithTrackingProps } from '~types/hocs'
import type { CapturePayload } from '~types/redux'
import type {
  HandleCaptureProp,
  HandleDocVideoCaptureProp,
  RenderFallbackProp,
} from '~types/routers'
import type { DocumentTypes } from '~types/steps'

const renamedCapture = (
  payload: CapturePayload,
  step: CaptureVariants
): CapturePayload => ({
  ...payload,
  filename: `document_${step}.${mimeType(payload.blob)}`,
})

export type Props = {
  cameraClassName?: string
  documentType: DocumentTypes
  renderFallback: RenderFallbackProp
  onCapture: HandleDocVideoCaptureProp
} & WithTrackingProps

const DocumentVideo: FunctionComponent<Props> = ({
  cameraClassName,
  documentType,
  onCapture,
  renderFallback,
  trackScreen,
}) => {
  const {
    step,
    stepNumber,
    totalSteps,
    nextStep,
    restart: restartFlow,
  } = useCaptureStep(documentType)
  const [frontPayload, setFrontPayload] = useState<CapturePayload>(null)
  const { translate } = useContext(LocaleContext)
  const webcamRef = useRef<Webcam>(null)
  const [webcamInfo, setWebcamInfo] = useState<Record<string, unknown>>(null)

  useEffect(() => {
    setTimeout(() => {
      if (!webcamInfo && webcamRef.current && webcamRef.current.stream) {
        const [track] = webcamRef.current.stream.getVideoTracks()

        setWebcamInfo({
          settings: track.getSettings(),
          constraints: track.getConstraints(),
          capabilities: track.getCapabilities(),
        })
      }
    }, 100)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log(JSON.stringify(webcamInfo, null, 2))
  }, [webcamInfo])

  const onRecordingStart = () => {
    nextStep()

    screenshot(webcamRef.current, (blob, sdkMetadata) => {
      const frontPayload = renamedCapture(
        {
          blob,
          sdkMetadata,
        },
        'front'
      )

      setFrontPayload(frontPayload)
    })
  }

  const onVideoCapture: HandleCaptureProp = (payload) => {
    const videoPayload = renamedCapture(payload, 'video')

    if (documentType === 'passport') {
      onCapture({
        front: frontPayload,
        video: videoPayload,
      })
      return
    }

    screenshot(webcamRef.current, (blob, sdkMetadata) => {
      const backPayload = renamedCapture(
        {
          blob,
          sdkMetadata,
        },
        'back'
      )

      onCapture({
        front: frontPayload,
        video: videoPayload,
        back: backPayload,
      })
    })
  }

  const mappedLocale =
    documentType === 'passport' && step !== 'back'
      ? DOC_VIDEO_INSTRUCTIONS_MAPPING.passport[step]
      : DOC_VIDEO_INSTRUCTIONS_MAPPING.others[step]

  const title = translate(mappedLocale.title)
  const subtitle = translate(mappedLocale.subtitle)

  const passedProps = {
    onNext: nextStep,
    step,
    stepNumber,
    subtitle,
    title,
    totalSteps,
  }

  return (
    <VideoCapture
      cameraClassName={cameraClassName}
      facing="environment"
      inactiveError={getInactiveError(true)}
      method="document"
      onRecordingStart={onRecordingStart}
      onRedo={restartFlow}
      onVideoCapture={onVideoCapture}
      renderFallback={renderFallback}
      renderOverlay={() => (
        <DocumentOverlay
          marginBottom={0.5}
          tilt={step === 'tilt' ? TILT_MODE : undefined}
          type={documentType}
          withPlaceholder={step === 'intro'}
        >
          <code
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: 'black',
              overflow: 'auto',
              padding: '3em 1em',
              textAlign: 'left',
              width: '100%',
              zIndex: 10,
            }}
          >
            {JSON.stringify(webcamInfo, null, 2)}
          </code>
        </DocumentOverlay>
      )}
      renderVideoLayer={(props) => <VideoLayer {...props} {...passedProps} />}
      trackScreen={trackScreen}
      webcamRef={webcamRef}
    />
  )
}

export default memo(DocumentVideo)

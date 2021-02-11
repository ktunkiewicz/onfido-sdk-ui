import { h, FunctionComponent, Fragment } from 'preact'
import { memo, useCallback, useContext, useState } from 'preact/compat'

import { LocaleContext } from '~locales'
import Button from '../Button'
import Instructions from './Instructions'
import ProgressBar from './ProgressBar'
import style from './style.scss'

import { TILT_MODE, CaptureSteps } from '~types/docVideo'
import type { VideoLayerProps } from '../VideoCapture'

export type Props = {
  onNext: () => void
  step: CaptureSteps
  stepNumber: number
  subtitle: string
  title: string
  totalSteps: number
} & VideoLayerProps

const BUTTON_LOCALE_MAP: Record<CaptureSteps, string> = {
  intro: 'doc_video_capture.button_start',
  front: 'doc_video_capture.button_record',
  tilt: 'doc_video_capture.button_next',
  back: 'doc_video_capture.button_stop',
}

const SUCCESS_STATE_TIMEOUT = 1000

const VideoLayer: FunctionComponent<Props> = ({
  disableInteraction,
  isRecording,
  onNext,
  onStart,
  onStop,
  step,
  stepNumber,
  subtitle,
  title,
  totalSteps,
}) => {
  const [shouldShowSuccess, showSuccessState] = useState(false)
  const { translate } = useContext(LocaleContext)

  const handleNext = useCallback(() => {
    if (step === 'intro') {
      onNext()
      return
    }

    showSuccessState(true)

    setTimeout(() => {
      showSuccessState(false)
      onNext()
    }, SUCCESS_STATE_TIMEOUT)
  }, [step, onNext])

  const startRecording = (
    <Fragment>
      <Instructions title={title} />
      <Button
        variants={['centered', 'primary', 'lg']}
        disabled={disableInteraction}
        onClick={onStart}
      >
        {translate('doc_video_capture.button_start')}
      </Button>
    </Fragment>
  )

  const recording = shouldShowSuccess ? (
    <span className={style.success} />
  ) : (
    <Fragment>
      <Instructions
        icon={step}
        subtitle={subtitle}
        tiltMode={TILT_MODE}
        title={title}
      />
      <Button
        variants={['centered', 'primary', 'lg']}
        disabled={disableInteraction}
        onClick={stepNumber < totalSteps ? handleNext : onStop}
      >
        {translate(BUTTON_LOCALE_MAP[step])}
      </Button>
    </Fragment>
  )

  return (
    <Fragment>
      <ProgressBar stepNumber={stepNumber} totalSteps={totalSteps} />
      <div className={style.actions}>
        {isRecording ? recording : startRecording}
      </div>
    </Fragment>
  )
}

export default memo(VideoLayer)

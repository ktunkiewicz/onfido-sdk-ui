import { h } from 'preact'
import classNames from 'classnames'
import { localised } from '../../locales'
import Actions from './Actions'
import CaptureViewer from './CaptureViewer'
import PageTitle from '../PageTitle'
import Error from '../Error'
import theme from '../Theme/style.scss'
import style from './style.scss'

const LOCALES_MAPPING = {
  passport: 'doc_confirmation.body_passport',
  driving_licence: 'doc_confirmation.body_license',
  national_identity_card: 'doc_confirmation.body_id',
  residence_permit: 'doc_confirmation.body_permit',
  bank_building_society_statement: 'doc_confirmation.body_bank_statement',
  utility_bill: 'doc_confirmation.body_bill',
  council_tax: 'doc_confirmation.body_tax_letter',
  benefit_letters: 'doc_confirmation.body_benefits_letter',
  government_letter: 'doc_confirmation.body_government_letter',
}

const getMessageKey = ({
  capture,
  documentType,
  poaDocumentType,
  error,
  forceRetake,
  method,
}) => {
  if (method === 'face') {
    return `confirm.face.${capture.variant}.message`
  }

  // In case of real error encountered but there's a `forceRetake` flag activated
  if (error && error.type === 'error') {
    return LOCALES_MAPPING[documentType || poaDocumentType]
  }

  if (forceRetake) {
    return 'doc_confirmation.body_image_poor'
  }

  if (error && error.type === 'warn') {
    return 'doc_confirmation.body_image_medium'
  }

  return LOCALES_MAPPING[documentType || poaDocumentType]
}

const Previews = localised(
  ({
    capture,
    retakeAction,
    confirmAction,
    error,
    method,
    documentType,
    poaDocumentType,
    translate,
    isFullScreen,
    isUploading,
    forceRetake,
  }) => {
    const methodNamespace =
      method === 'face' ? `confirm.face.${capture.variant}` : 'doc_confirmation'
    const title = translate(`${methodNamespace}.title`)
    const imageAltTag = translate(`${methodNamespace}.image_accessibility`)
    const videoAriaLabel = translate('video_confirmation.video_accessibility')
    const message = translate(
      getMessageKey({
        capture,
        documentType,
        poaDocumentType,
        error,
        forceRetake,
        method,
      })
    )

    return (
      <div
        className={classNames(
          style.previewsContainer,
          theme.fullHeightContainer,
          {
            [style.previewsContainerIsFullScreen]: isFullScreen,
          }
        )}
      >
        {isFullScreen ? null : error.type ? (
          <Error
            {...{ error, withArrow: true, role: 'alert', focusOnMount: false }}
          />
        ) : (
          <PageTitle title={title} smaller={true} className={style.title} />
        )}
        <CaptureViewer
          {...{ capture, method, isFullScreen, imageAltTag, videoAriaLabel }}
        />
        {!isFullScreen && (
          <div>
            <p className={style.message}>{message}</p>
            <Actions
              {...{
                retakeAction,
                confirmAction,
                isUploading,
                error,
                forceRetake,
              }}
            />
          </div>
        )}
      </div>
    )
  }
)

export default Previews

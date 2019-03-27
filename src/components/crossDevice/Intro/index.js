import { h } from 'preact'
import classNames from 'classnames'
import theme from '../../Theme/style.css'
import style from './style.css'
import Title from '../../Title'
import Button from '../../Button'
import { trackComponent } from '../../../Tracker'
import {preventDefaultOnClick} from '../../utils'
import {componentsList} from '../../Router/StepComponentMap'
import { localised } from '../../../locales'

const previousComponentType = ({flow = 'captureSteps', documentType, steps, step, actions}) =>
  componentsList({ flow, documentType, steps, actions })[step || 0].step.type

const Intro = ({translate, nextStep, mobileConfig}) => {
  const isFace = previousComponentType(mobileConfig) === 'face'
  const stages = {
    'sms': 'sms',
    ...(isFace ?
      {'take-selfie': 'face.take_photos' } :
      {'take-photos': 'document.take_photos' }
    ),
    'return-computer': 'return_computer',
  }

  return (
    <div className={theme.fullHeightMobileContainer}>
      <Title
        title={translate(`cross_device.intro.${ isFace ? 'face' : 'document' }.title`)}
      />
      <div className={classNames(theme.thickWrapper, style.content)}>
      {
        Object.keys(stages).map(key =>
          <div key={key} className={style.stage}>
            <div className={classNames(style.stageIcon, style[`stageIcon-${key}`])}></div>
            <div className={style.stageMessage}>
              {translate(`cross_device.intro.${stages[key]}`)}
            </div>
          </div>
        )
      }
      </div>
      <div className={theme.thickWrapper}>
        <Button
          variants={["primary", "centered"]}
          onClick={preventDefaultOnClick(nextStep)}
        >
          {translate(`cross_device.intro.${ isFace ? 'face' : 'document' }.action`)}
        </Button>
      </div>
    </div>
  )
}

export default trackComponent(localised(Intro))

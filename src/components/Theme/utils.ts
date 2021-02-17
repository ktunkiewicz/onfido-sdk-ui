import { kebabCase } from '~utils/string'

import { UICustomisationOptions } from '~types/ui-customisation-options'

export const setUICustomisations = (
  customUI: UICustomisationOptions = {}
): void => {
  const sdkCustomisations = Object.keys(customUI).map(
    (key) => `--osdk-${kebabCase(key)}: ${customUI[key]};`
  )
  const style = `
    <style>
        :root {
          ${sdkCustomisations.join('\n')}
        }
    </style>`
  document.head.insertAdjacentHTML('beforeend', style)
}

export const isButtonGroupStacked = (): boolean =>
  !!JSON.parse(
    getComputedStyle(document.body).getPropertyValue(
      '--osdk-button-group-stacked'
    )
  )
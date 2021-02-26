export type UICustomizationOptions = {
  // Modal (SDK Container)
  colorBackgroundSurfaceModal?: string
  colorBorderSurfaceModal?: string

  // Primary Button
  colorContentButtonPrimaryText?: string
  colorBackgroundButtonPrimary?: string
  colorBackgroundButtonPrimaryHover?: string
  colorBackgroundButtonPrimaryActive?: string
  colorBorderButtonPrimary?: string

  // Secondary Button
  colorContentButtonSecondaryText?: string
  colorBackgroundButtonSecondary?: string
  colorBackgroundButtonSecondaryHover?: string
  colorBackgroundButtonSecondaryActive?: string
  colorBorderButtonSecondary?: string

  // Applied to both Primary, Secondary Buttons
  borderRadiusButton?: string

  // Displays Primary, Secondary Button groups as stacked blocks instead of inline on the same row
  buttonGroupStacked?: boolean

  // Document Type Option Button
  colorBorderDocTypeButton?: string
  colorBorderDocTypeButtonHover?: string
  colorBorderDocTypeButtonActive?: string

  // Link
  colorBorderLinkUnderline?: string
  colorContentLinkTextHover?: string
  colorBackgroundLinkHover?: string
  colorBackgroundLinkActive?: string

  // Warning Popup
  colorContentAlertInfo?: string
  colorBackgroundAlertInfo?: string
  colorBackgroundAlertInfoLinkHover?: string
  colorBackgroundAlertInfoLinkActive?: string

  // Error Popup
  colorContentAlertError?: string
  colorBackgroundAlertError?: string
  colorBackgroundAlertErrorLinkHover?: string
  colorBackgroundAlertErrorLinkActive?: string

  // Header/Highlight Pills
  colorBackgroundInfoPill?: string
  colorContentInfoPill?: string
}

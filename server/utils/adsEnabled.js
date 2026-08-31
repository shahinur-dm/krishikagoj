/** Global visitor-facing ads switch. Missing field defaults to ON. */
export function isAdsGloballyEnabled(settings) {
  if (!settings) return true
  if (settings.adsEnabled === false || settings.ads_enabled === false) return false
  return true
}

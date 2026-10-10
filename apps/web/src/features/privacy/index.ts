// GDPR: consent for optional storage, the privacy policy, data export and
// account deletion.
export { ConsentLayer } from './components/ConsentLayer';
export { PolicyUpdateModal } from './components/PolicyUpdateModal';
export { PrivacyPolicy } from './components/PrivacyPolicy';
export { PrivacySettingsButton } from './components/PrivacySettingsButton';
export { YourData } from './components/YourData';
export { PRIVACY_POLICY_VERSION, useConsentStore } from './consent';
export {
  useAcceptPolicy,
  useDeleteAccount,
  useExportMyData,
  usePrivacySync,
} from './hooks/usePrivacy';

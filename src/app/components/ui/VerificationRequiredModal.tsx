// This component has been retired.
// Email verification is now handled by:
//   1. The inline banner in Dashboard.tsx (visible, unmissable, with resend)
//   2. The amber bar in Layout.tsx (persistent across all pages)
//   3. Toast warnings when unverified users try restricted actions (withVerification in AuthContext)
export default function VerificationRequiredModal() {
  return null;
}

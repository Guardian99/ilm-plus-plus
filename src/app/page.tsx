import { redirect } from 'next/navigation'

// Proxy handles this for valid sessions (role home) and unauthenticated
// requests (/login). This redirect is a fallback in case proxy is bypassed.
export default function RootPage() {
  redirect('/login')
}

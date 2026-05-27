import { redirect } from 'next/navigation';

// Legacy /auth route — redirect to Clerk's sign-in page
export default function AuthPage() {
  redirect('/sign-in');
}

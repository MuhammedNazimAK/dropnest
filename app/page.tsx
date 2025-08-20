import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPage from './LandingPageClient';

export default async function Page() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');  // if logged in, send them away
  }
  return <LandingPage />;  // else show landing page
}

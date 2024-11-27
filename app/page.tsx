import { Button } from "@/components/ui/button";
import { SignedOut } from "@clerk/nextjs";
import { SignedIn, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-6xl">
          Village Banking
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Empower your community with modern financial solutions
        </p>
        <div className="space-x-4">
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

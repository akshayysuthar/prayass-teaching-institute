import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-12 px-4 sm:px-10 lg:px-8">
      <div className="w-full mx-auto max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <SignIn />
      </div>
    </div>
  );
}

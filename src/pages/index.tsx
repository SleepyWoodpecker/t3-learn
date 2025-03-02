import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";

import { api } from "~/utils/api";

export default function Home() {
  const hello = api.post.hello.useQuery({ text: "from tRPC" });

  const user = useUser();

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div>
          {!user.isSignedIn ? (
            <SignInButton>
              <button>Sign in</button>
            </SignInButton>
          ) : (
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          )}
        </div>
        <p className="text-2xl text-white">
          {hello.data ? hello.data.greeting : "Loading tRPC query..."}
        </p>
      </main>
    </>
  );
}

import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage } from "~/components/LoadingSpinner";
import { useState } from "react";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const trpcRoutes = api.useUtils();

  const { mutate, isPending: isUploadingPost } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");

      // invalidate the cache for the feed query
      void trpcRoutes.posts.getAll.invalidate();
    },
  });

  const handleCreateNewPost = async (
    e: React.SyntheticEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    mutate({ content: input });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.imageUrl}
        alt="profile-image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      ></Image>
      <input
        placeholder="Type some emojis!!!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isUploadingPost}
      ></input>
      <button className="border px-3" onClick={handleCreateNewPost}>
        Post!
      </button>
    </div>
  );
};

// neat trick to keep prisma as the single source of truth in type definitions
type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <>
      <div className="flex gap-3 border-b border-slate-400 p-4">
        <Image
          src={author.imageUrl}
          className="h-14 w-14 rounded-full"
          width={56}
          height={56}
          alt="Author profile pic"
        ></Image>
        <div className="flex flex-col">
          <div className="flex gap-1.5 text-slate-300">
            <span>{`@${author.username}`}</span>
            <span>·</span>
            <span className="font-thin">{`${dayjs(post.createdAt).fromNow()}`}</span>
          </div>
          <span className="">{post.content}</span>
        </div>
      </div>
    </>
  );
};

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return <div>Something went wrong</div>;
  }

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();

  // useful properties you can get

  if (!isLoaded) {
    return <div></div>;
  }

  // because the T3 stack makes use of react query and because react query caches the API calls,
  // you can call the feed query here first, so all of your data gets loaded in ASAP
  api.posts.getAll.useQuery();

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* should put classes in the globals.css files since that would be the first to be rendered -> provide a more complete experience */}
      <main className="flex h-screen justify-center">
        {/* main content */}
        {/* process of doing styling is really just trial and error with numbers??? */}
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          {" "}
          {/* imposes the max width for md and above sized screens */}
          <div className="flex border-b border-slate-400 p-4">
            <div className="flex w-full justify-evenly">
              {!isSignedIn ? (
                <SignInButton>
                  <button>Sign in</button>
                </SignInButton>
              ) : (
                <>
                  <CreatePostWizard />
                  {/* <SignOutButton>Sign Out</SignOutButton> */}
                </>
              )}
            </div>
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
}

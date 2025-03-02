import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { User } from "@clerk/nextjs/server";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.firstName,
    imageUrl: user.imageUrl,
  };
};

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

    // however, this gives too much infromation about each user to each requesting page
    const users = (
      await (
        await clerkClient()
      ).users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).data.map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      // read up on error handling inside TRPC
      if (!author?.username) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });
      }

      console.log(author.username);

      return {
        post,
        author: {
          ...author,
          username: author.username,
        },
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji().min(1).max(150),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.currentUser;
      const post = await ctx.db.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});

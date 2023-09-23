"use server";

import { connectToDB } from "./../mongoose";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export const createThread = async ({ text, author, communityId, path }: Params) => {
  connectToDB();

  try {
    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    // update user model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to creating thread: ${error.message}`);
  }
};

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
  connectToDB();

  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({
      createdAt: "desc",
    })
    .skip(skipAmount)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: { path: "author", model: User, select: "_id name parentId image" },
    });

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
};

export const fetchThreadById = async (id: string) => {
  connectToDB();

  try {
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          { path: "author", model: User, select: "_id id name parentId image" },
          {
            path: "children",
            model: Thread,
            populate: { path: "author", model: User, select: "_id id name parentId image" },
          },
        ],
      })
      .exec();

    return thread;
  } catch (error: any) {
    throw new Error(`Failed when fetching thread: ${error.message}`);
  }
};

export const addCommentToThread = async (
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) => {
  connectToDB();

  try {
    const oriThread = await Thread.findById(threadId);
    if (!oriThread) throw new Error("Thread not found");

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    const savedCommentThread = await commentThread.save();

    oriThread.children.push(savedCommentThread._id);

    await oriThread.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed when adding comment to thread: ${error.message}`);
  }
};

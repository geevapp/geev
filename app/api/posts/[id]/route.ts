import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const GET = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) => {
    try {
        const { id } = await params;
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: {
                        entries: true,
                        interactions: true,
                    },
                },
            },
        });

        if (!post) {
            return apiError('Post not found', 404);
        }

        return apiSuccess(post);
    } catch (error) {
        return apiError('Failed to fetch post', 500);
    }
}

const PATCH = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) => {
    try {
        const user = await getCurrentUser(request);
        if (!user) return apiError('Unauthorized', 401);

        const { id } = await params;
        const body = await request.json();

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { entries: true },
                },
            },
        });

        if (!post) {
            return apiError('Post not found', 404);
        }

        if (post.creatorId !== user.id) {
            return apiError('Forbidden', 403);
        }

        if (post._count.entries > 0) {
            return apiError('Cannot edit post with entries', 400);
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
            },
        });

        return apiSuccess(updatedPost);
    } catch (error) {
        return apiError('Failed to update post', 500);
    }
}

const DELETE = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) => {
    try {
        const user = await getCurrentUser(request);
        if (!user) return apiError('Unauthorized', 401);

        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { entries: true },
                },
            },
        });

        if (!post) {
            return apiError('Post not found', 404);
        }

        if (post.creatorId !== user.id) {
            return apiError('Forbidden', 403);
        }

        if (post._count.entries > 0) {
            return apiError('Cannot delete post with entries', 400);
        }

        await prisma.post.delete({
            where: { id },
        });

        return apiSuccess({ deleted: true });
    } catch (error) {
        return apiError('Failed to delete post', 500);
    }
}

export {
    GET,
    PATCH,
    DELETE
}
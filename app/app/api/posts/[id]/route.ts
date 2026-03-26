import { apiError, apiSuccess } from "@/lib/api-response";

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GET = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) => {
    try {
        const { id } = await params;
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                user: {
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
                entries: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                                username: true,
                            }
                        }
                    }
                },
                winners: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                                username: true,
                            }
                        }
                    }
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

        if (post.userId !== user.id) {
            return apiError('Forbidden', 403);
        }

        const isOnlyStatusUpdate = body.status !== undefined && Object.keys(body).every(k => k === 'status');

        if (post._count.entries > 0 && !isOnlyStatusUpdate) {
            return apiError('Cannot edit post details with entries', 400);
        }

        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.status !== undefined) updateData.status = body.status;

        const updatedPost = await prisma.post.update({
            where: { id },
            data: updateData,
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

        if (post.userId !== user.id) {
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
// app/api/posts/[id]/contributions/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth'
import { readJsonBody } from '@/lib/parse-json-body'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) return apiError('Unauthorized', 401)

    const { id } = await params

    try {
      const post = await prisma.post.findUnique({
        where:  { id },
        select: { id: true, type: true },
      })

      if (!post) return apiError('Post not found', 404)

      if (post.type !== 'HELP_REQUEST') {
        return apiError('Contributions are only allowed on help-request posts', 422)
      }

      const raw = await readJsonBody<Record<string, unknown>>(request)
      if (!raw.ok) return raw.response

      const { amount, message, isAnonymous, paymentRef } = raw.data

      if (typeof amount !== 'number' || amount <= 0) {
        return apiError('Amount must be a positive number', 422)
      }
      if (typeof paymentRef !== 'string' || !paymentRef.trim()) {
        return apiError('Payment reference is required', 422)
      }

      // Guard against duplicate submissions with the same payment reference
      const duplicate = await prisma.helpContribution.findUnique({
        where: { paymentRef },
      })
      if (duplicate) {
        return apiError('This payment has already been recorded', 409)
      }

      const contribution = await prisma.helpContribution.create({
        data: {
          postId:        id,
          contributorId: isAnonymous ? null : currentUser.id,
          amount:        amount as number,
          message:       typeof message === 'string' ? message : null,
          isAnonymous:   isAnonymous === true,
          paymentRef,
          paymentStatus: 'COMPLETED',
        },
        select: {
          id:          true,
          amount:      true,
          message:     true,
          isAnonymous: true,
          createdAt:   true,
          contributor: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      })

      return apiSuccess(contribution, 201)
    } catch (dbError) {
      return apiError('Failed to create contribution', 500)
    }
  } catch (error) {
    return apiError('Failed to create contribution', 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const skip  = (page - 1) * limit

    try {
      const [contributions, total] = await prisma.$transaction([
        prisma.helpContribution.findMany({
          where:   { postId: id, paymentStatus: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id:          true,
            amount:      true,
            message:     true,
            isAnonymous: true,
            createdAt:   true,
            contributor: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        }),
        prisma.helpContribution.count({
          where: { postId: id, paymentStatus: 'COMPLETED' },
        }),
      ])

      // Mask contributor identity for anonymous contributions
      const sanitised = contributions.map((c) =>
        c.isAnonymous ? { ...c, contributor: null } : c,
      )

      return apiSuccess({
        data:       sanitised,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (dbError) {
      return apiError('Failed to fetch contributions', 500)
    }
  } catch (error) {
    return apiError('Failed to fetch contributions', 500)
  }
}
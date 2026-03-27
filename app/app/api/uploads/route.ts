import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/api-response'
import { uploadToS3 } from '@/lib/storage'
import { validateFile } from '@/lib/file-validation'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) return apiError('Unauthorized', 401)

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return apiError('Invalid multipart body', 400)
    }

    const file = formData.get('file')
    if (!(file instanceof File)) return apiError('No file provided', 400)

    const folder = (formData.get('folder') as string | null) ?? 'uploads'

    const validationError = validateFile(file.type, file.size)
    if (validationError) return apiError(validationError.message, 422)

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const { url, key } = await uploadToS3(buffer, file.name, file.type, folder)
      return apiSuccess({ url, key }, 'upload successful')
    } catch (uploadError) {
      console.error('[upload] S3 error:', uploadError)
      return apiError('Upload failed. Please try again.', 502)
    }
  } catch (error) {
    return apiError('Upload failed', 500)
  }
}
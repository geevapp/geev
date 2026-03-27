import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToS3 } from '@/lib/storage';
import { validateFile } from '@/lib/file-validation';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const folder = (formData.get('folder') as string | null) ?? 'uploads';

  const validationError = validateFile(file.type, file.size);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 422 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url, key } = await uploadToS3(buffer, file.name, file.type, folder);
    return NextResponse.json({ url, key }, { status: 201 });
  } catch (err) {
    console.error('[upload] S3 error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 502 });
  }
}
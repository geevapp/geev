import { NextRequest, NextResponse } from 'next/server';

interface SupportFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function POST (request: NextRequest) {
    try {
        const body: SupportFormData = await request.json();

        // Validate required fields
        if (!body.name || !body.email || !body.subject || !body.message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Log the support request (in production, this would be sent to an email service or database)
        console.log('Support Request:', {
            timestamp: new Date().toISOString(),
            ...body,
        });

        // TODO: Integrate with email service (e.g., SendGrid, Mailgun, etc.)
        // For now, we'll just log it and return success
        // Example:
        // await emailService.send({
        //   to: 'support@geev.app',
        //   from: body.email,
        //   subject: `Support Request: ${body.subject}`,
        //   html: `<p><strong>From:</strong> ${body.name} (${body.email})</p><p><strong>Message:</strong></p><p>${body.message}</p>`,
        // });

        return NextResponse.json(
            {
                success: true,
                message: 'Support request received. We will get back to you soon.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Support endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to process support request' },
            { status: 500 }
        );
    }
}

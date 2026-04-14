import { NextRequest, NextResponse } from 'next/server';

// Simulated send message API
// In production, this would connect to the WhatsApp API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, accountId } = body;

    if (!phone || !message || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak lengkap: phone, message, dan accountId diperlukan' },
        { status: 400 }
      );
    }

    // Simulate processing delay (500ms - 2000ms)
    const delay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate random success/failure (85% success rate)
    const isSuccess = Math.random() < 0.85;

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        data: {
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          phone,
          message,
          accountId,
          status: 'success',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      const errors = [
        'Gagal mengirim: nomor tidak terdaftar di WhatsApp',
        'Gagal mengirim: timeout, coba lagi nanti',
        'Gagal mengirim: akun diblokir sementara',
        'Gagal mengirim: format nomor tidak valid',
      ];

      return NextResponse.json({
        success: false,
        data: {
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          phone,
          message,
          accountId,
          status: 'failed',
          error: errors[Math.floor(Math.random() * errors.length)],
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

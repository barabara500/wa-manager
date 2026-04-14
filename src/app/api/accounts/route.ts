import { NextRequest, NextResponse } from 'next/server';

// Simulated account management API
// In production, this would manage real WhatsApp sessions

// In-memory store for demo purposes
interface AccountData {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected' | 'scanning';
  lastActive: string;
  enabled: boolean;
  messagesSentToday: number;
}

let accountsStore: AccountData[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: accountsStore,
    total: accountsStore.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Nama dan nomor telepon diperlukan' },
        { status: 400 }
      );
    }

    const newAccount: AccountData = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name,
      phoneNumber,
      status: 'scanning',
      lastActive: new Date().toISOString(),
      enabled: false,
      messagesSentToday: 0,
    };

    accountsStore.push(newAccount);

    // Simulate QR scanning - after 3 seconds, mark as connected
    setTimeout(() => {
      const idx = accountsStore.findIndex(a => a.id === newAccount.id);
      if (idx !== -1) {
        accountsStore[idx] = {
          ...accountsStore[idx],
          status: 'connected',
          enabled: true,
        };
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      data: newAccount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID akun diperlukan' },
        { status: 400 }
      );
    }

    const idx = accountsStore.findIndex(a => a.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    accountsStore[idx] = { ...accountsStore[idx], ...updates, lastActive: new Date().toISOString() };

    return NextResponse.json({
      success: true,
      data: accountsStore[idx],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID akun diperlukan' },
        { status: 400 }
      );
    }

    const idx = accountsStore.findIndex(a => a.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    accountsStore.splice(idx, 1);

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dihapus',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

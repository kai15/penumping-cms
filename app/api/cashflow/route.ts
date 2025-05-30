import { NextResponse } from 'next/server';
import { readFromSheet, writeToSheet, updateInSheet, deleteFromSheet } from '../../services/sheets';

// GET /api/cashflow - Mendapatkan semua data cashflow
export async function GET() {
  try {
    const entries = await readFromSheet();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error in GET /api/cashflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashflow entries' },
      { status: 500 }
    );
  }
}

// POST /api/cashflow - Menambah data cashflow baru
export async function POST(request: Request) {
  try {
    const entry = await request.json();
    const success = await writeToSheet(entry);
    
    if (success) {
      return NextResponse.json({ message: 'Entry added successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to add entry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/cashflow:', error);
    return NextResponse.json(
      { error: 'Failed to add entry' },
      { status: 500 }
    );
  }
}

// PUT /api/cashflow - Mengupdate data cashflow
export async function PUT(request: Request) {
  try {
    const entry = await request.json();
    const success = await updateInSheet(entry);
    
    if (success) {
      return NextResponse.json({ message: 'Entry updated successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to update entry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/cashflow:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/cashflow - Menghapus data cashflow
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const success = await deleteFromSheet(id);
    
    if (success) {
      return NextResponse.json({ message: 'Entry deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/cashflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
} 
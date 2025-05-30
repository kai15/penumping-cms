import { google } from 'googleapis';
import { CashflowEntry } from '../types/cashflow';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Cashflow';

// Ensure sheet exists and has correct headers
async function ensureSheetExists() {
  try {
    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    // Check if sheet exists
    const sheetExists = spreadsheet.data.sheets?.some(
      sheet => sheet.properties?.title === SHEET_NAME
    );

    if (!sheetExists) {
      // Create new sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          }],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:M1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'ID',
            'Period',
            'Date',
            'Nama',
            'Type',
            'Category',
            'Ketengan',
            'Qty',
            'Price',
            'Total',
            'Notes',
            'Created At',
            'Updated At'
          ]],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error;
  }
}

// Initialize sheet
ensureSheetExists().catch(console.error);

// Read data from sheet
export async function readFromSheet(): Promise<CashflowEntry[]> {
  try {
    await ensureSheetExists();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:M`, // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: row[0] || `temp-${index}`,
      period: row[1] || '',
      date: row[2] || '',
      name: row[3] || '',
      type: row[4] || 'income',
      category: row[5] || 'Lain-Lain',
      isKetengan: row[6] === 'Yes',
      qty: parseInt(row[7]) || 0,
      price: parseInt(row[8]) || 0,
      total: parseInt(row[9]) || 0,
      notes: row[10] || '',
      createdAt: new Date(row[11] || Date.now()),
      updatedAt: new Date(row[12] || Date.now()),
    }));
  } catch (error) {
    console.error('Error reading from sheet:', error);
    return [];
  }
}

// Write data to sheet
export async function writeToSheet(entry: CashflowEntry): Promise<boolean> {
  try {
    await ensureSheetExists();
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:M`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          entry.id,
          entry.period,
          entry.date,
          entry.name,
          entry.type,
          entry.category,
          entry.isKetengan ? 'Yes' : 'No',
          entry.qty,
          entry.price,
          entry.total,
          entry.notes,
          now,
          now,
        ]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return false;
  }
}

// Update data in sheet
export async function updateInSheet(entry: CashflowEntry): Promise<boolean> {
  try {
    await ensureSheetExists();
    // First, get all rows to find the index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:A`, // Only get IDs
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === entry.id);

    if (rowIndex === -1) {
      console.error('Entry not found in sheet');
      return false;
    }

    const now = new Date().toISOString();
    // Update the row (add 2 because of 0-based index and header row)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex + 2}:M${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          entry.id,
          entry.period,
          entry.date,
          entry.name,
          entry.type,
          entry.category,
          entry.isKetengan ? 'Yes' : 'No',
          entry.qty,
          entry.price,
          entry.total,
          entry.notes,
          entry.createdAt,
          now,
        ]],
      },
    });
    return true;
  } catch (error) {
    console.error('Error updating sheet:', error);
    return false;
  }
}

// Delete data from sheet
export async function deleteFromSheet(id: string): Promise<boolean> {
  try {
    await ensureSheetExists();
    // First, get all rows to find the index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:A`, // Only get IDs
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      console.error('Entry not found in sheet');
      return false;
    }

    // Delete the row using batch update
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming it's the first sheet
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // Add 1 because of header row
              endIndex: rowIndex + 2, // Add 2 because endIndex is exclusive
            },
          },
        }],
      },
    });
    return true;
  } catch (error) {
    console.error('Error deleting from sheet:', error);
    return false;
  }
} 
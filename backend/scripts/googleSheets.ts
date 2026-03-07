import { google } from "googleapis";
import path from "path";

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), "credentials/google-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function getSheet(sheetId: string, range: string) {
  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = res.data.values || [];

  const headers = rows[0];

  const data = rows.slice(1).map((row) => {
    const obj: any = {};

    headers.forEach((h, i) => {
      obj[h] = row[i];
    });

    return obj;
  });

  return data;
}

export async function writeSheet(
  sheetId: string,
  range: string,
  values: any[][],
) {
  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });
}

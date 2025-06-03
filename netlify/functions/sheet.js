import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const spreadsheetId = "18jG5HkOn2_O-cmjCsoYJ3-Nl6U4gsYQ_De_cBHmPwbQ";

export const handler = async (event) => {
  const { name, email } = JSON.parse(event.body || "{}");

  let credentials_parsed = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  const auth = new GoogleAuth({
    credentials: credentials_parsed,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = auth.fromJSON(credentials_parsed);

  const sheets = google.sheets({ version: "v4", auth: authClient });

  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A2:B",
  });

  const rows = readRes.data.values || [];

  const already_exists = rows.some(([existingName, existingEmail]) => {
    return existingName === name || existingEmail === email;
  });

  if (already_exists) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Duplicate skipped" }),
    };
  }

  sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A:B",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: { values: [[name, email]] },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Success" }),
  };
};

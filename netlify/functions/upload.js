import { Dropbox } from "dropbox";
import fetch from "isomorphic-fetch";
import dotenv from "dotenv";

dotenv.config();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { name, files } = JSON.parse(event.body || "{}");

  if (!files || files.length === 0) {
    return { statusCode: 400, body: "No files were uploaded" };
  }

  let accessToken = "";
  try {
    const tokenRes = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed to refresh token: ", tokenData);
      return { statusCode: 500, body: "Failed to refresh Dropbox Token" };
    }

    accessToken = tokenData.access_token;
  } catch (error) {
    console.error("Token exchange failed: ", error);
    return { statusCode: 500, body: "Token exchange failed" };
  }

  // Trying API directly

  try {
    for (let file of files) {
      const content = Buffer.from(file.content, "base64");
      const filePath = `/legacy-uploads/${name || "anonymous"}-${
        file.filename
      }`;

      const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({
            path: filePath,
            mode: { ".tag": "add" },
            autorename: true,
            mute: false,
          }),
          "Content-Type": "application/octet-stream",
        },
        body: content,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Dropbox upload failed: ${res.status} ${errText}`);
      }
    }
    return { statusCode: 200, body: "Upload successful" };
  } catch (error) {
    console.error("This is the error foo: ", error);
    return { statusCode: 500, body: "Upload failed" };
  }
};

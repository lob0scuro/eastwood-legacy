import { Dropbox } from "dropbox";

export const handler = async (event) => {
  console.log("Starting...");
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

  // const dbx = new Dropbox({
  //   clientId: process.env.DROPBOX_APP_KEY,
  //   clientSecret: process.env.DROPBOX_APP_SECRET,
  //   refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
  //   fetch,
  // });

  const dbx = new Dropbox({ accessToken, fetch });

  try {
    for (let file of files) {
      const content = Buffer.from(file.content, "base64");
      await dbx.filesUpload({
        path: `/legacy-uploads/${name || "anonymous"}-${file.filename}`,
        contents: content,
      });
    }
    return { statusCode: 200, body: "Upload successful" };
  } catch (error) {
    console.log("This is the error foo: ", error);
    return { statusCode: 500, body: "Upload failed" };
  }
};

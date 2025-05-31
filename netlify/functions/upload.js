const { Dropbox } = require("dropbox");
const { config } = require("@netlify/functions");

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { name, files } = JSON.parse(event.body || "{}");

  if (!files || files.length === 0) {
    return { statusCode: 400, body: "No files were uploaded" };
  }

  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

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
    return { statusCode: 500, body: `Upload failed: ${error.message}` };
  }
};

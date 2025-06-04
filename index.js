let allFiles = [];

const MAX_FILE_SIZE_MB = 125;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileUpload = document.getElementById("photo");
const preview = document.getElementById("preview");
preview.style.maxHeight = "200px";
preview.style.overflowY = "auto";
const loading = document.getElementById("loading-screen");
const submitButton = document.getElementById("submit-button");

window.addEventListener("load", () => {
  submitButton.disabled = true;
  allFiles = [];
});

fileUpload.addEventListener("change", (event) => {
  const files = event.target.files;
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`${file.name} is too large. Max size is ${MAX_FILE_SIZE_MB}`);
      continue;
    }
    if (allFiles.length > 4) {
      alert("You can only upload up to 5 images at a time.");
      continue;
    }
    allFiles.push(file);
    if (allFiles.length > 0) {
      submitButton.disabled = false;
    }
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "flex-start";
      wrapper.style.margin = "0.5rem";
      wrapper.style.width = "fit-content";
      const imageItemWrapper = document.createElement("div");
      imageItemWrapper.style.display = "flex";
      imageItemWrapper.style.flexDirection = "row";
      imageItemWrapper.style.alignItems = "center";
      const image = document.createElement("img");
      image.classList.add("thumbnail");
      image.style.maxWidth = "150px";
      const button = document.createElement("button");
      button.textContent = "✕";
      button.style.backgroundColor = "#831313";
      button.style.color = "#f9f9f9";
      button.style.borderRadius = "8px";
      button.style.width = "24px";
      button.style.height = "24px";
      button.addEventListener("click", () => {
        allFiles = allFiles.filter((f) => f !== file);
        preview.removeChild(wrapper);

        if (allFiles.length === 0) {
          submitButton.disabled = true;
        }
      });

      reader.onload = (e) => {
        image.src = e.target.result;
      };

      reader.readAsDataURL(file);

      wrapper.appendChild(imageItemWrapper);
      imageItemWrapper.appendChild(image);
      imageItemWrapper.appendChild(button);
      preview.appendChild(wrapper);
    }
  }
});

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  loading.style.display = "flex";

  const name = document.querySelector('input[name="name"]').value;
  const email = document.querySelector('input[type="email"]').value;

  if (!name) {
    alert("Please enter your name so we can know who sent in this photo.");
    loading.style.display = "none";
    return;
  }

  const files = await Promise.all(
    allFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve({
            filename: file.name,
            content: base64,
            type: file.type,
          });
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
      });
    })
  );

  try {
    const [sheetResult, uploadResult] = await Promise.all([
      fetch("/.netlify/functions/sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      }),
      fetch("/.netlify/functions/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, files }),
      }),
    ]);

    if (!sheetResult.ok) {
      throw new Error("Sheet upload failed.");
    }
    if (!uploadResult.ok) {
      throw new Error("File upload failed.");
    }

    allFiles = [];
    preview.innerHTML = "";
    window.location.href = "success.html";
  } catch (error) {
    alert("Submission failed, please try again.");
    console.error("Error: ", error.message);
  } finally {
    loading.style.display = "none";
  }
});

let allFiles = [];

document.getElementById("photo").addEventListener("change", function (event) {
  const newFiles = Array.from(event.target.files);

  // Add new files while avoiding duplicates (by name + size)
  newFiles.forEach((file) => {
    const exists = allFiles.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (!exists) {
      allFiles.push(file);
    }
  });

  renderPreviews();
  event.target.value = ""; // Clear input so same file can be reselected
});

function renderPreviews() {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  allFiles.forEach((file, index) => {
    const fileType = file.type;
    const reader = new FileReader();

    reader.onload = function (e) {
      const container = document.createElement("div");
      container.style.position = "relative";
      container.style.display = "inline-block";

      let element;

      if (fileType.startsWith("image/")) {
        element = document.createElement("img");
        element.src = e.target.result;
        element.style.width = "120px";
        element.style.height = "auto";
      } else if (fileType.startsWith("video/")) {
        element = document.createElement("video");
        element.src = e.target.result;
        element.controls = true;
        element.style.width = "160px";
        element.style.height = "auto";
      }

      if (element) {
        element.style.border = "1px solid #ccc";
        element.style.borderRadius = "4px";
        element.style.display = "block";
        container.appendChild(element);
      }

      // Add remove button
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "✖";
      removeBtn.style.position = "absolute";
      removeBtn.style.top = "5px";
      removeBtn.style.right = "5px";
      removeBtn.style.background = "rgba(0, 0, 0, 0.7)";
      removeBtn.style.color = "white";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "50%";
      removeBtn.style.width = "24px";
      removeBtn.style.height = "24px";
      removeBtn.style.cursor = "pointer";

      removeBtn.addEventListener("click", () => {
        allFiles.splice(index, 1); // Remove file from array
        renderPreviews(); // Re-render
      });

      container.appendChild(removeBtn);
      preview.appendChild(container);
    };

    reader.readAsDataURL(file);
  });
}

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.querySelector('input[name="name"]').value;
  const fileInput = document.querySelector('input[type="file"]');
  const files = fileInput.files;

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  if (files.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }

  const fileData = await Promise.all(
    [...files].map(async (file) => {
      const buffer = await file.arrayBuffer();
      return {
        filename: file.name,
        content: btoa(String.fromCharCode(...new Uint8Array(buffer))),
      };
    })
  );

  const result = await fetch("./netlify/functions/upload", {
    methos: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, files: fileData }),
  });

  if (result.ok) {
    alert("Upload Successful");
    fileInput.value = "";
  } else {
    alert("Upload failed, please try again.");
  }
});

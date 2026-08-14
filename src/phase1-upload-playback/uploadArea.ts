export function setupUploadArea(
  dropZone: HTMLElement,
  fileInput: HTMLInputElement,
  onFile: (file: File) => void,
): void {
  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragover");
    handleFiles(event.dataTransfer?.files ?? null);
  });

  fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
  });
}

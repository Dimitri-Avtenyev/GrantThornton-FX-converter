window.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.querySelector('.droparea');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropArea?.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropArea?.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropArea?.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropArea?.classList.add('highlight');
  }

  function unhighlight() {
    dropArea?.classList.remove('highlight');
  }

  dropArea?.addEventListener('drop', handleDrop, false);

  async function handleDrop(e) {
    e.preventDefault();
    unhighlight();
    dropArea.innerHTML = '<p>Processing...</p>';
    const files = e.dataTransfer?.files;

    if (files) {
      // Send a message to the main process to process the Excel file
      console.log(files[0].path);
      electronAPI.send('processFile', files[0].path);
    }
  }

  electronAPI.receive("resetMessage", () => {
    dropArea.innerHTML = '<p>Drag & drop</p>';
  });
});



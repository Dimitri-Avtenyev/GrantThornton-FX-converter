
document.getElementById("reconnectBtn").addEventListener("click", () => {
  // Send a message to the main process to attempt connection restoration
  console.log("button clicked")
  electronAPI.send("try-connection-again");
});

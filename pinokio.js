// pinokio.js
module.exports = {
  menu: async (kernel, info) => {
    // Check if the KTransformers virtual environment is installed
    let installed = await info.exists("KTransformers", "venv");
    
    // Check if the specific GGUF model file has been downloaded
    let model_downloaded = await info.exists("models", "Kimi-K2", "kimi-k2-instruct.Q4_K_M.gguf");
    
    // Check if the server script is currently running
    let running = await info.running("start.json");

    if (running) {
      // If the server is running, provide a link to the Web UI
      let local = info.local("start.json");
      return [{
        icon: "fa-solid fa-rocket",
        text: "Web UI",
        href: local?.url ? `${local.url}/docs` : "http://127.0.0.1:8000/docs", // KTransformers uses a FastAPI backend, /docs is the API explorer
        target: "_blank"
      }, {
        icon: "fa-solid fa-terminal",
        text: "Terminal",
        href: "start.json"
      }];
    } else if (installed && model_downloaded) {
      // If everything is installed but not running, show the start button
      return [{
        icon: "fa-solid fa-power-off",
        text: "Start Server",
        href: "start.json"
      }, {
        icon: "fa-solid fa-download",
        text: "Re-Download Model",
        href: "download_model.json"
      }];
    } else if (installed) {
      // If the environment is installed but the model isn't, prompt to download
      return [{
        icon: "fa-solid fa-download",
        text: "Download Model",
        href: "download_model.json"
      }];
    } else {
      // If nothing is installed, show the install button
      return [{
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.json"
      }];
    }
  }
};
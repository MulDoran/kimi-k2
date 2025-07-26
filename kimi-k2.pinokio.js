module.exports = class {
  constructor(kernel) {
    this.kernel = kernel;
    this.conda_env = "kimi-k2-env";
    this.server_port = null;
  }

  async install() {
    this.kernel.ui.open({
      html: `
        <div class='p-4'>
          <h1>Installing Kimi K2</h1>
          <p>This process will download the necessary components to run Kimi K2 locally:</p>
          <ul>
            <li>- KTransformers: The inference engine that supports GGUF models.</li>
            <li>- Model Configuration: From the official Moonshot AI repository.</li>
            <li>- GGUF Model: A quantized version of Kimi K2 (~19 GB).</li>
          </ul>
          <p>The download may take some time depending on your internet connection.</p>
        </div>
      `,
      href: "/?selected=Kimi K2 (GGUF)"
    });

    const env_exists = await this.kernel.conda.exists(this.conda_env);
    if (!env_exists) {
      await this.kernel.shell.run({
        message: `Creating Conda environment (${this.conda_env})...`,
        script: `conda create -n ${this.conda_env} python=3.10 -y`
      });
    }

    await this.kernel.shell.run({
      message: "Cloning KTransformers repository...",
      script: "git clone https://github.com/K-AI/KTransformers.git KTransformers",
      path: this.kernel.homedir,
      when: "!exists('KTransformers')"
    });

    await this.kernel.shell.run({
      message: "Installing KTransformers dependencies...",
      script: `conda run -n ${this.conda_env} pip install -r requirements.txt`,
      path: "KTransformers"
    });

    await this.kernel.shell.run({
      message: "Cloning original Kimi K2 repo for configuration files...",
      script: "git clone https://huggingface.co/moonshotai/Kimi-K2-Instruct Kimi-K2-GGUF",
      path: this.kernel.homedir,
      when: "!exists('Kimi-K2-GGUF')"
    });

    await this.kernel.shell.run({
      message: "Cleaning up unnecessary large files...",
      script: "rm -f *.safetensors",
      path: "Kimi-K2-GGUF"
    });

    await this.kernel.shell.run({
      message: "Downloading Kimi K2 GGUF model (~19 GB). This will take a while...",
      script: `aria2c -x 16 -s 16 -k 1M "https://huggingface.co/lmstudio-community/Kimi-K2-Instruct-GGUF/resolve/main/Kimi-K2-Instruct-Q4_K_M.gguf" -o "Kimi-K2-Instruct-Q4_K_M.gguf"`,
      path: "Kimi-K2-GGUF",
      when: "!exists('Kimi-K2-Instruct-Q4_K_M.gguf')"
    });

    this.kernel.ui.success("Kimi K2 has been installed successfully!");
  }

  async run(params) {
    this.server_port = params.args.port;
    
    await this.kernel.shell.run({
      message: `Starting Kimi K2 server on port ${this.server_port}...`,
      daemon: true, 
      path: "KTransformers",
      script: `conda run -n ${this.conda_env} python server/main.py --model_path ../Kimi-K2-GGUF --gguf_path ../Kimi-K2-GGUF --port ${this.server_port} --cache_lens 30000`
    });
  }
  
  async stop() {
    const running = await this.kernel.running(__dirname);
    if (running && running.length > 0) {
        const port = running[0].params.params.port;
        await this.kernel.process.kill(port);
        this.kernel.ui.success("Kimi K2 server stopped.");
    }
  }

  async menu(running) {
    if (running && running.length > 0) {
      const port = running[0].params.params.port;
      return [{
        text: "Open Web UI (FastAPI Docs)",
        href: `http://127.0.0.1:${port}/docs`
      }, {
        text: "API Endpoint",
        href: `http://127.0.0.1:${port}`
      }];
    }
    return null;
  }
}
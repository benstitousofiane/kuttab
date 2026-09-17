# 📜 Kuttab

> **Local-first, zero-API, zero-dependency CLI tool for AI-assisted coding.**

Kuttab bridges the gap between **web-based LLMs** (ChatGPT, Claude, Gemini, Ollama) and your **local codebase**. It allows you to feed your full project context to any AI and apply surgical `SEARCH/REPLACE` patch blocks back to your disk in milliseconds—without paying for API keys or locking yourself into heavy subscriptions.

---

## ✨ Features

- ⚡ **Zero API Keys Needed**: Use your existing Web subscriptions (ChatGPT Plus, Claude Pro, Gemini Advanced) or local models.
- 🎯 **Surgical Patching**: Modify 5 lines across 10 files without making the LLM regenerate thousands of lines of untouched code.
- 🔍 **Ultra-Tolerant Matching**: Built-in 3-tier alignment engine (Exact, Line-by-Line, and Trimmed) built to handle Linux/Windows line-ending (`\r\n` / `\n`) and whitespace discrepancies seamlessly.
- 📦 **Context Bundler**: Automatically respects `.gitignore` rules to build clean, lightweight context files for LLMs.
- 🪶 **Minimalist & Lightweight**: Fast TypeScript execution with zero bloat.

---

## 🚀 Quick Start

### 1. Build project context

Generate a clean `kuttab-context.txt` containing your project structure, system instructions for the AI, and source code:

```bash
npx kuttab pack
2. Prompt your AICopy the content of kuttab-context.txt into your favorite LLM interface (ChatGPT, Claude, Gemini, etc.) alongside your request.The embedded system instructions force the AI to return changes as concise SEARCH/REPLACE blocks:Plaintext<<<<<<< SEARCH: src/core/applier.ts
const result = 1 / 0;
=======
const result = safeDivide(1, 0);
>>>>>>> REPLACE
3. Apply the patchPaste the AI's response into a patch.txt file (or pipe it) and execute:Bashnpx kuttab apply patch.txt
Kuttab will parse the diff blocks, match the original code precisely, and rewrite the files directly on disk.🛠️ CLI ReferenceCommandDescriptionkuttab pack [options]Collects project files into a single context file (kuttab-context.txt).kuttab apply <file>Parses and applies SEARCH/REPLACE patch blocks from a file to your local code.Options for pack-o, --output <file> : Specify custom output file path (Default: kuttab-context.txt).-d, --dir <directory> : Target a specific sub-directory instead of the entire root.🧠 Why Kuttab?Most AI coding tools (Aider, Cursor, Copilot) force you into monthly API consumption models or proprietary IDEs.Kuttab keeps you in full control:Speed: Generating a 10-line SEARCH/REPLACE patch takes ~2 seconds on web LLMs vs waiting 1 minute for 1,400 lines of full file rewrite.Safety: Code that isn't targeted in the SEARCH block is never touched or hallucinated away.Privacy: You control exactly what context is generated and what patches are executed.
```

### 📄 License
Public Domain

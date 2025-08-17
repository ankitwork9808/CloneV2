# 🧠 Web Clone AI Agent

This project is an **AI-powered CLI tool** that clones websites into fully functional offline versions using **plain HTML, CSS, and JS**.

The agent follows a structured reasoning process (**START → THINK → TOOL → OBSERVE → OUTPUT**) while executing the cloning operation.

---

## 📂 Project Structure

```
.
├── src/scrapeWebsite.ts          # Website cloning logic
├── src/index.ts                  # Main entry (AI Agent loop)
├── package.json
├── pnpm-lock.yaml
├── cloned-site
└── .env                      # API keys & environment variables
```

---

## ⚙️ Setup

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

---

## 🚀 Running the Agent

Run:

```bash
pnpm dev
```

👉 The agent will prompt you for a website URL:

```
💡 Enter the website URL:
```

Example:

```
💡 Enter the website URL: https://www.piyushgarg.dev
```

The agent will then:

- Think through the request
- Call the `scrapeWebsite()` tool
- Clone the site into `./cloned-site/`
- Rewrite assets/links so the site runs fully **offline**
- Edit the site, ask to add update or remove
- Prompt to ask to publish the site live
- If Y then `publishSite()`
- Click and view the site

---

## 🛠️ Output

- The cloned website will be available in:

  ```
  ./cloned-site/{site_url}
  {subdomain}.vercel.app
  ```

- Assets are organized into subfolders (`/css`, `/js`, `/images`, etc.).
- You can open `index.html` directly in a browser to view the offline site.

## 🎥 Demo

[![Watch the video](https://www.youtube.com/watch?v=3FJbVMWAkog)]([https://youtu.be/om7hPTGVbUE](https://www.youtube.com/watch?v=3FJbVMWAkog))

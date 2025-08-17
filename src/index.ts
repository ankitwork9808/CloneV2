import "dotenv/config";
import axios from "axios";
import readline from "readline";
import { OpenAI } from "openai";
import { exec, execSync } from "child_process";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getConsoleInput(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function scrapeWebsite(url: string) {
  const { scrapeWebsite } = await import("./scrapeWebsite");
  return await scrapeWebsite(url, {
    outDir: "./cloned-site",
    maxPages: 1,
  });
}

async function publishSite(site_path: string ,subdomain:string) {
  try {
    console.log("🚀 Deploying to Vercel...");
    const response = execSync(`npx vercel --prod --cwd ${site_path} --yes --name ${subdomain}`, { encoding: "utf-8", stdio: "pipe" });
    const match = response.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/);
    console.log(response);
    const vercel_url = match ? match[0] : null;
    console.log(`\n🔗 Your site is live: \x1b[36mhttps://${subdomain}.vercel.app\x1b[0m`);
    console.log(`🌍 Click to open → https://${subdomain}.vercel.app\n`);
    return vercel_url;
  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    return null;
  }
}

async function getWeatherDetailsByCity(cityName: string) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  const { data } = await axios.get(url, { responseType: "json" });
  return `The current weather for ${cityName} is ${data}`;
}

async function getGithubUserInfoByUsername(userName: string) {
  const url = `https://api.github.com/users/${userName.toLowerCase()}`;

  const { data } = await axios.get(url, { responseType: "json" });
  return JSON.stringify({
    login: data.login,
    id: data.id,
    name: data.name,
    location: data.location,
    twitter_username: data.twitter_username,
    public_repos: data.public_repos,
    public_gists: data.public_gists,
    user_view_type: data.user_view_type,
    followers: data.followers,
    following: data.following,
  });
}

async function executeCommand(cmd: string) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err: Error | null, data: string) => {
      if (err) reject(err.message);
      else resolve(data);
    });
  });
}

const TOOL_MAP = {
  getWeatherDetailsByCity: getWeatherDetailsByCity,
  getGithubUserInfoByUsername: getGithubUserInfoByUsername,
  executeCommand: executeCommand,
  scrapeWebsite: scrapeWebsite,
};

async function main() {
  const userPrompt = await getConsoleInput("👨‍💻 Enter the website URL: ");
  const cloned_site = await scrapeWebsite(userPrompt);
  console.log(cloned_site);
  const console_input = await getConsoleInput("Do you want to publish the site? (y/n) ");
  console.log(console_input);
  if(console_input == 'y') {
    const subdomain = await getConsoleInput("Enter the sub-domain, *.vercel.com : ");
    publishSite(cloned_site.path, subdomain);
  }
  rl.close();

  const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK and OUTPUT format.
    For a given user query first think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.
    
    Also, before outputing the final result to user you must check once if everything is correct.
    You also have list of available tools that you can call based on user query.
    
    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - getWeatherDetailsByCity(cityName: string): Returns the current weather data of the city.
    - getGithubUserInfoByUsername(userName: string): Retuns the public info about the github user using github api
    - getConsoleInput(command: string): Ask any question from user if required and get the answer
    - executeCommand(command: string): Takes a linux / unix command as arg and executes the command on user's machine and returns the output
    - scrapeWebsite(url: string): Clones the website at the given URL into a fully functional offline version.

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Always make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool

    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL" , "content": "string", "tool_name": "string", "input": "string" }

    Example_1:
    User: Hey, can you tell me weather of Patiala?
    ASSISTANT: { "step": "START", "content": "The user is intertested in the current weather details about Patiala" } 
    ASSISTANT: { "step": "THINK", "content": "Let me see if there is any available tool for this query" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available getWeatherDetailsByCity which returns current weather data" } 
    ASSISTANT: { "step": "THINK", "content": "I need to call getWeatherDetailsByCity for city patiala to get weather details" }
    ASSISTANT: { "step": "TOOL", "input": "patiala", "tool_name": "getWeatherDetailsByCity" }
    DEVELOPER: { "step": "OBSERVE", "content": "The weather of patiala is cloudy with 27 Cel" }
    ASSISTANT: { "step": "THINK", "content": "Great, I got the weather details of Patiala" }
    ASSISTANT: { "step": "OUTPUT", "content": "The weather in Patiala is 27 C with little cloud. Please make sure to carry an umbrella with you. ☔️" }

    Example_2:
    User: Given a website "https://www.piyushgarg.dev" Can you clone the entire site (HTML, CSS, JS) locally using plain HTML/CSS/JS ?
    ASSISTANT: { "step": "START", "content": "The user wants to clone the entire website 'https://www.piyushgarg.dev' locally" }
    ASSISTANT: {"step": "THINK", "content": "Check if the website is available online, if yes continue if not return an error message" }
    ASSISTANT: { "step": "THINK", "content": "Rewrite all external links and code so the site runs completely offline without dependencies on external CDNs or APIs." }
    ASSISTANT: { "step": "THINK", "content": "The task is to clone the website into a fully functional offline version using plain HTML/CSS/JS with responsive layout, closely matching the original design, and organize assets in a clean directory structure (/css, /js, /images, etc.)."}
    ASSISTANT: { "step": "THINK", "content": "Let me see if there are any available tool for this query" }
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available scrapeWebsite which can be used to clone the website" }
    ASSISTANT: { "step": "THINK", "content": "I need to call scrapeWebsite for url https://www.piyushgarg.dev to clone the website" }
    ASSISTANT: { "step": "TOOL", "input": "https://www.piyushgarg.dev", "tool_name": "scrapeWebsite" }
    DEVELOPER: { "step": "OBSERVE", "content": "The website 'https://www.piyushgarg.dev' has been cloned successfully" }
    ASSISTANT: { "step": "OUTPUT", "content": "The website 'https://www.piyushgarg.dev' has been cloned successfully and is available locally." }
  `;

  const messages: Array<{
    role: "system" | "user" | "assistant" | "developer";
    content: string;
  }> = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Clone the website ${userPrompt} into a fully functional offline version. Rewrite all code, assets,
       and links so it runs locally without internet access.`,
    },
  ];

  while (true) {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      stream: false,
    });
    console.log("rawContentrawContent", response.choices[0].message.content)
    const rawContent = response.choices[0].message.content;

    try {
      const parsedContent = JSON.parse(rawContent as string);

      messages.push({
        role: "assistant",
        content: JSON.stringify(parsedContent),
      });

      if (parsedContent.step === "START") {
        console.log(`🤖`, parsedContent.content);
        continue;
      }

      if (parsedContent.step === "THINK") {
        console.log(`🤖`, parsedContent.content);
        continue;
      }
      
      if (parsedContent.step === "TOOL") {
        const toolKey = parsedContent.tool_name as keyof typeof TOOL_MAP;
        if (!TOOL_MAP[toolKey]) {
          messages.push({
            role: "developer",
            content: "There is no tool available for users request",
          });
          continue;
        }

        const res = await TOOL_MAP[toolKey](parsedContent.input);
        console.log(
          `🛠️ ${toolKey} for ${parsedContent.input} gave output ${res}`
        );

        messages.push({
          role: "developer",
          content: JSON.stringify({ step: "OBSERVE", content: res }),
        });

        continue;
      }

      if (parsedContent.step === "OUTPUT") {
        console.log(`🤖`, parsedContent.content);
        break;
      }
      
    } catch (error) {
      console.error(
        `⚠️ Error occurred while processing :`,
        error
      );
      messages.push({
        role: "developer",
        content: JSON.stringify({
          step: "OBSERVE",
          content:
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message: string }).message
              : String(error),
        }),
      });
      break;
    }
  }
  console.log("\n ...DONE 👍");
}

main();

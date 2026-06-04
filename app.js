import readline from "node:readline/promises";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const tvly = new tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  // return groq.chat.completions.create({
  //   messages: [
  //     {
  //       role: "user",
  //       content: "Hi",
  //     },
  //   ],
  //   model: "llama-3.3-70b-versatile",
  // });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant who answers the asked questions.
          You have access to following tools
          1. searchWeb({query}:{query:string})`,
    },
    // {
    //   role: "user",
    //   content: "What is the current weather in Karachi",
    //   // when was iphone 16 launched?
    //   // what is the current weather in Karachi?
    // },
  ];

  while (true) {
    // user question
    const question = await rl.question("You:");
    // For now, let’s assume that if the user says ‘bye,’ the chat should stop.
    if (question === "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    while (true) {
      const completions = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        // messages: [
        //   {
        //     role: "system",
        //     content: `You are a smart personal assistant who answers the asked questions.
        //       You have access to following tools
        //       1. searchWeb({query}:{query:string})`,
        //   },
        //   {
        //     role: "user",
        //     content: "when was iphone 16 launched?",
        //     // when was iphone 16 launched?
        //     // what is the current weather in Karachi?
        //   },
        // ],
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search the latest informtion and realtime data on the internet.",
              parameters: {
                // JSON Schema object
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to perform search on.",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      messages.push(completions.choices[0].message);

      const toolcalls = completions.choices[0].message.tool_calls;
      if (!toolcalls) {
        console.log(`Assistant: ${completions.choices[0].message.content}`);
        break;
      }

      for (const tool of toolcalls) {
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionParams));
          // console.log("toolResult: ", toolResult);
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      }
    }
  }
  rl.close()
}

main();

async function webSearch({ query }) {
  console.log("web search tool called");
  const response = await tvly.search(query);
  // console.log("TavilyResponse: ", response);

  const finalResult = response.results.map((item) => item.content).join("\n\n");
  // console.log("finalResult: ", finalResult);

  return finalResult;
}

import fetch from "node-fetch";
import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

export async function handler() {
  // 1. Fetch puzzle JSON
  const res = await fetch(
    "https://www.minutecryptic.com/api/daily_puzzle/today?tz=America/Denver"
  );
  if (!res.ok) throw new Error("Failed to fetch puzzle");
  const data = await res.json();

  // 2. Build clue text
  const clueText = data.clue.map(x => x.text).join(" ");
  const lengthString = `(${data.config.join(",")})`;

  // Let’s reformat date → 18 Nov. 2025
  const dateObj = new Date(data.date);
  const dateDisplay = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).replace(" ", " ").replace(",", "");

  // 3. Assemble Slack blocks
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Clue for ${dateDisplay}*\n\n> ${clueText} ${lengthString}`
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Play"
        },
        url: "https://www.minutecryptic.com/"
      }
    },
    {
      type: "image",
      image_url: data.thumbnail,
      alt_text: `Clue for ${dateDisplay}: ${clueText} ${lengthString}`
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Clue by ${data.setterName} | <${data.explainerVideo}|hint>`
        }
      ]
    }
  ];

  // 4. Post to Slack
  await slack.chat.postMessage({
    channel: CHANNEL_ID,
    blocks,
    text: `Clue for ${dateDisplay}: ${clueText} ${lengthString}`
  });

  return { statusCode: 200, body: "ok" };
}

if (process.env.NODE_ENV !== "production") {
  handler()
}

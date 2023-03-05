import { NextApiRequest, NextApiResponse } from 'next';
import moment from 'moment-timezone';

type Project = {
  repo_name: string
  description: string
  stars: number
  language: string
}

export const config = {
  runtime: 'nodejs',
}

function constructSlackPayload(projects: Project[]) {
  const papersPayload = projects.map(({ repo_name, description, stars, language }) => {
    const projects = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${repo_name}*\nDescription: ${description}\nStars in past 24 hrs: ${stars}\nLink: https://github.com/${repo_name}\nLanguage: ${language}\n\n`
      },
    }

    return projects
  })

  const completePayload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Trending OSS projects in past 24 hours - ${moment().tz("America/Los_Angeles").format('dddd, MMMM Do')}*`
        }
      },
      {
        "type": "divider"
      },
      ...papersPayload
    ]
  }
  return completePayload
}

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const ossInsightResponse = await fetch('https://api.ossinsight.io/q/trending-repos?language=All&period=past_24_hours').then(data => data.json())
  const { data } = ossInsightResponse

  const response = await fetch(process.env.SLACK_WEBHOOK_URL ?? '', {
    method: 'POST',
    body: JSON.stringify(constructSlackPayload(data))
  })

  res.status(200).json({
    body: response
  });
}
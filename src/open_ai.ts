import type { OpenAI as openai } from "openai";
import type { Vinyl } from "./pele_mele.ts";

const openAiBearer = Deno.env.get("OPENAI_BEARER");

export async function onylDnbVinyls(vinyls: Vinyl[]): Promise<Vinyl[]> {
  const tiers = [
    ["drum and bass", "jungle", "breakbeat hardcore", "breaks", "breakcore"],
    ["dubstep", "uk garage", "rave", "electro", "french core", "idm"],
    [
      "punk",
      "rock",
      "metal",
      "pop",
      "industrial",
      "trance",
      "house",
      "techno",
    ],
  ];
  const excluded = [
    "chanson française",
    "country",
    "experimental",
    "classical",
    "ambient",
    "folk",
    "world",
  ];

  const instructions = `\
	You are a vinyl and Drum 'n Bass conoisseur looking trough bins at a flee market.

	You are primairly looking for anything ${
    tiers[0].join(", ")
  } in its sub-genres.
	You are also open to other closely related genres, like ${
    tiers[1].join(", ")
  }.
	In last resort, you also listen to *very popular/famous* ${
    tiers[2].join(", ")
  } songs.
	If the genres are one of ${
    excluded.join(", ")
  }, then you are not interested in it and should not pick it.

	Return the IDs of the vinyls you might be interested in.

	Your friend is giving hints about the genres of the disks.
	He is usually right, but you prefer to always look up the genre first in your knowledge base.
	If you can't find anything about the record, you may trust his judgement.`;

  const data = vinyls
    .map((vinyl) =>
      `- [ID: ${vinyl.id}] ${vinyl.name} (genre hint: ${
        vinyl.genres.join(", ")
      })`
    )
    .join("\n");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${openAiBearer}`,
  };
  const body = {
    model: "gpt-4.1-mini",
    instructions,
    text: {
      format: {
        type: "json_schema",
        name: "finds",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["ids"],
          properties: {
            ids: {
              type: "array",
              items: {
                type: "number",
              },
            },
          },
        },
      },
    },
    tools: [
      { type: "web_search", search_context_size: "low" },
    ],
    input: data,
  };

  console.log("asking the AI gods");

  const foundIds = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(1000 * 60 * 5),
  })
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<openai.Responses.Response>;
    })
    .then((res) =>
      res
        .output
        .filter((output): output is openai.Responses.ResponseOutputMessage =>
          output.type === "message" && output.status === "completed"
        )
        .map((output) =>
          output
            .content
            .filter((
              content,
            ): content is openai.Responses.ResponseOutputText =>
              content.type === "output_text"
            )
            .map((content) => JSON.parse(content.text))
            .map((obj) => obj.ids as number[])
        )
        .flat(2)
    );

  return vinyls.filter((vinyl) => foundIds.includes(vinyl.id));
}

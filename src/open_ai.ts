import type { OpenAI as openai } from "openai";
import type { Vinyl } from "./pele_mele.ts";

export async function onylDnbVinyls(vinyls: Vinyl[], openAiBearer: string): Promise<Vinyl[]> {
	const tiers = [
		["drum and bass", "jungle", "breakbeat hardcore", "breaks", "breakcore"],
		["dubstep", "uk garage", "rave", "electro", "french core", "idm"],
		["punk", "rock", "metal", "pop", "industrial", "trance", "house", "techno"],
	];
	const excluded = ["chanson française", "country", "experimental", "classical", "ambient", "folk", "world"];

	const instructions = `\
I am a vinyl and Drum 'n Bass conoisseur looking trough bins at a flee market.

I really like ${tiers[0].join(", ")}, or its sub-genres.
I am also open to other closely related genres, like ${tiers[1].join(", ")}.
In last resort, I also listen to *very popular/famous* ${tiers[2].join(", ")} songs.

However, I strongly dislike ${excluded.join(", ")}.

The seller sometimes gives hints about the genres of the disks.
They are usually right but often very broad.
I still prefer to always look up the genre first in my knowledge base.
If I can't find anything about the record, then I might trust their judgement.`;

	const headers = {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${openAiBearer}`,
	};
	const body = {
		model: "gpt-6-luna",
		input: instructions,
		questions: vinyls.map(vinyl => ({
			type: "predicate",
			name: `${vinyl.id}`,
			instructions: `Will I like the following vinyl: ${vinyl.name}${vinyl.name} ${vinyl.genres.length ? ` (genre hint: ${vinyl.genres.join(", ")})` : ""}?`,
		})),
	};

	console.log("asking the AI gods");

	const foundIds = await fetch("https://api.openai.com/v1/decisions", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(1000 * 60 * 2),
	})
		.then((res) => {
			if(!res.ok) throw new Error(res.statusText);
			return res.json() as Promise<openai.Decisions.Decision>;
		})
		.then((res) => res
			.answers
			.filter((answer): answer is openai.Decision.AnswerResourcePredicate => "probability" in answer)
			.filter(answer => answer.probability >= 0.4)
			.map(answer => +answer.name!)
		);

	return vinyls.filter((vinyl) => foundIds.includes(vinyl.id));
}

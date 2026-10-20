import * as Discord from "./discord.ts";
import type { Env } from "./env.ts";
import * as Db from "./kv.ts";
import * as OpenAI from "./open_ai.ts";
import * as PeleMele from "./pele_mele.ts";

async function main(env: Env) {
	main:
	do {
		const lastFetch = await Db.getLastFetch(env.KV);
		const newVinyls: PeleMele.Vinyl[] = [];
		for await(const vinyl of PeleMele.fetchAllNewVinyls(lastFetch)) newVinyls.push(vinyl);
		if(!newVinyls.length) {
			console.log("no new vinyls");
			break main;
		}

		const newDnbVinyls = await OpenAI.onylDnbVinyls(newVinyls, env.OPENAI_BEARER);
		if(!newDnbVinyls.length) {
			console.log("no new DnB vinyls");
			break main;
		}

		await Discord.letHimKnow(newDnbVinyls, env);
	} while(false);
	await Db.setLastFetch(env.KV);
	console.log("done for now");
}

export default {
	async fetch(request: Request, env: unknown, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if(url.pathname === "/" && request.method === "GET") return new Response("pele-mele-vinyls worker is running");

		if(url.pathname !== "/run") return new Response("Not found", { status: 404 });

		if(request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });

		if(!(env as Env).MANUAL_TRIGGER_TOKEN) return new Response("Manual trigger is not configured", { status: 503 });

		if(request.headers.get("Authorization") !== `Bearer ${(env as Env).MANUAL_TRIGGER_TOKEN}`) return new Response("Unauthorized", { status: 401 });

		try {
			await main(env as Env);
			return new Response("Vinyl check completed");
		} catch(error) {
			console.error("Manual vinyl check failed", error);
			return new Response("Vinyl check failed", { status: 500 });
		}
	},

	scheduled(_controller: ScheduledController, env: unknown, ctx: ExecutionContext) {
		ctx.waitUntil(main(env as Env));
	},
} satisfies ExportedHandler;

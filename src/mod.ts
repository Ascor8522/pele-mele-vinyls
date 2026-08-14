import * as Discord from "./discord.ts";
import * as Db from "./kv.ts";
import * as OpenAI from "./open_ai.ts";
import * as PeleMele from "./pele_mele.ts";

async function main() {
  const kv = await Deno.openKv();
  main:
  do {
    const lastFetch = await Db.getLastFetch(kv);
    const newVinyls = await Array.fromAsync(
      PeleMele.fetchAllNewVinyls(lastFetch),
    );
    if (!newVinyls.length) {
      console.log("no new vinyls");
      break main;
    }

    const newDnbVinyls = await OpenAI.onylDnbVinyls(newVinyls);
    if (!newVinyls.length) {
      console.log("no new DnB vinyls");
      break main;
    }

    await Discord.letHimKnow(newDnbVinyls);
  } while (false);
  await Db.setLastFetch(kv);
  console.log("done for now");
}

Deno.cron("check-for-new-vinyls", "0 */3 * * *", () => main());

// dummy http server for crons to be enabled
Deno.serve(() => new Response());

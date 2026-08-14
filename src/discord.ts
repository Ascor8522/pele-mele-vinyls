import type {
  APIEmbed,
  RESTPostAPIWebhookWithTokenJSONBody as WebhookBody,
} from "discord-api-types";
import type { Vinyl } from "./pele_mele.ts";

const WEBHOOK_ID = Deno.env.get("WEBHOOK_ID");
const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN");

export async function letHimKnow(vinyls: Vinyl[]) {
  const webhookUrl =
    `https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}?with_components=True`;

  const webhookHeaders = {
    "Content-Type": "application/json",
  };

  const vinylsPerMessage = 10;

  while (vinyls.length) {
    const body: WebhookBody = {
      embeds: vinyls
        .slice(0, vinylsPerMessage)
        .map((vinyl) => vinylEmbed(vinyl)),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
      .then((res) => {
        if (!res.ok) {
          res
            .json()
            .then((err) => console.error(err))
            .then(() => {
              throw new Error(res.statusText);
            });
        }
      });

    await new Promise((res) => setTimeout(res, 1_000));

    vinyls = vinyls.slice(10);
  }
}

function vinylEmbed(vinyl: Vinyl): APIEmbed {
  const thumbnailPlaceholderUrl =
    "https://community.mp3tag.de/uploads/default/original/2X/a/acf3edeb055e7b77114f9e393d1edeeda37e50c9.png";

  const genreColors: Record<string, string> = {
    "Ambient": "#7BA7D7",
    "Avant Garde": "#6C4080",
    "Bal Musette": "#E6A15C",
    "Blues": "#3273B5",
    "Chanson Française": "#D95272",
    "Classique": "#D9BC59",
    "Country": "#A66D42",
    "Electro": "#3CB9C7",
    "Experimental": "#8C54D9",
    "Folk": "#7A993D",
    "Hardcore / Punk": "#C73C3C",
    "Hip hop": "#E67935",
    "House": "#D93675",
    "Industriel": "#5B656B",
    "Jazz": "#603A73",
    "K Pop": "#E67CA7",
    "K Rock": "#802A3E",
    "Latin": "#E65C35",
    "Lounge": "#4A8594",
    "Metal": "#2D3133",
    "New Age": "#4AD4B7",
    "Non music": "#8B959A",
    "Oldies": "#C28953",
    "Pop/Rock": "#E64545",
    "Post Rock": "#5C758C",
    "Rap": "#E6C93C",
    "Reggae": "#3FA358",
    "Soul/Funk": "#764FD9",
    "Soundtrack": "#537FD6",
    "Techno": "#54D960",
    "Trip Hop": "#2E8254",
    "World Music": "#BD6A3A",
  };

  const priceFmt = new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: vinyl.currency,
  });
  const nameEncoded = encodeURIComponent(vinyl.name);
  return {
    title: vinyl.name,
    description: [
      `__Name__: ${vinyl.nameCleaned}`,
      `__Genre(s)__: ${vinyl.genres.join(", ")}`,
      `__Label__: ${vinyl.label}`,
      `__Year__: ${vinyl.year}`,
      ``,
      `__Format__: ${vinyl.format}`,
      `__45t__: ${vinyl.is45t ? "yes" : "no"}`,
      ``,
      `__Price__: ${priceFmt.format(vinyl.price)}`,
      ``,
      `__Links__: ` +
      ` [Discogs](https://www.discogs.com/search?q=${nameEncoded})` +
      ` [RateYourMusic](https://rateyourmusic.com/search?searchtype=l&searchterm=${nameEncoded})` +
      ` [MusicBrainz](https://musicbrainz.org/search?type=release&method=indexed&query=${nameEncoded})`,
      ` [YouTube Music](https://music.youtube.com/search?q=${nameEncoded})` +
      ` [YouTube](https://www.youtube.com/results?search_query=${nameEncoded})` +
      ` [SoundCloud](https://soundcloud.com/search?q=${nameEncoded})`,
      ` [I'm Feeling Lucky](http://www.google.com/search?btnI=I'm+Feeling+Lucky&q=${nameEncoded})` +
      ` [Google](https://www.google.com/search?q=${nameEncoded})`,
    ].join("\n"),
    url: vinyl.permalink,
    thumbnail: { url: vinyl.thumbnail ?? thumbnailPlaceholderUrl },
    color: vinyl
      .genres
      .map((genre) => genreColors[genre])
      .filter((color) => !!color)
      .map((color) => color.replace("#", ""))
      .map((color) => parseInt(color, 16))
      .find((color) => !!color),
  };
}

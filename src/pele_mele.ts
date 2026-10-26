import type { ProductRequest, ProductResponse } from "@typewoo/sdk";

export async function* fetchAllNewVinyls(after: Date | null) {
	let page = 1;
	let maxPages: number | undefined = undefined;

	const url = new URL("https://online.pele-mele.be/wp-json/wc/store/v1/products");
	const params: ProductRequest = {
		category: "57", // vinyl
		after: after?.toISOString(),
		per_page: 100,
		orderby: "date",
		order: "desc",
	};
	for(const key in params) {
		const value = params[key as keyof ProductRequest];
		if(value) url.searchParams.set(key, `${value}`);
	}

	do {
		console.log("fetching page", page, "out of", maxPages ?? "unknown");

		url.searchParams.set("page", `${page++}`);

		const products = await fetch(url, { signal: AbortSignal.timeout(30_000) })
			.then((res) => {
				if(!res.ok) throw new Error(res.statusText);

				maxPages = +(res.headers.get("X-WP-TotalPages") ?? "1");
				return res.json() as Promise<ProductResponse[]>;
			});

		for(const product of products) {
			const {
				id,
				name,
				permalink,
				prices: {
					price: price_in_minor_units,
					currency_code: currency,
					currency_minor_unit,
					currency_thousand_separator,
					currency_decimal_separator,
				},
				images,
				attributes,
			} = product;

			const genres = attributes
				.filter((attr) => attr.name === "Genre")
				.map((genres) => genres.terms.map((term) => term.name))
				.flat()
				.sort();
			const thumbnail = images
				.find(() => true)
				?.thumbnail;
			const price = +price_in_minor_units
				.replace(currency_thousand_separator, "")
				.replace(currency_decimal_separator, ".") /
				(10 ** currency_minor_unit);
			let is45t,
				nameCleaned,
				label;  // TODO
			const year = name.match(/\b(?:19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2})?\b/);
			const formats = name.match(new RegExp([
				/LP/,
				/RSD/,
				/Comp/,
				/Ltd/,
				/RE/,
				/RM/,
				/RP/,
				/Album/,
				/PICTURE DISC/,
				/\d+ lps/,
				/\d+xLP/
			]
				.map(r => r.source)
				.map(r => `(?:\b${r}\b)`)
				.join("|"), "g")) ?? [];

			console.log("found", name);

			yield {
				id,
				name,
				permalink,
				thumbnail,
				price,
				currency,
				genres,
				is45t,
				nameCleaned,
				label,
				year,
				formats,
			};
		}
	} while(page < maxPages!);
}

export type Vinyl = ReturnType<typeof fetchAllNewVinyls> extends AsyncGenerator<infer U, void, unknown> ? U : never;

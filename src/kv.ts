const key = "pele-mele-vinyls:lastFetch";

export async function getLastFetch(kv: KVNamespace): Promise<Date | null> {
	const value = await kv.get(key);
	if(!value) return null;

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function setLastFetch(kv: KVNamespace): Promise<void> {
	return kv.put(key, new Date().toISOString());
}

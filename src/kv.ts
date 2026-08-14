const key = ["pele-mele-vinlys", "lastFetch"] as const;

export function getLastFetch(kv: Deno.Kv) {
  return kv
    .get<Date>(key)
    .then((entry) => entry.value);
}

export function setLastFetch(kv: Deno.Kv) {
  return kv.set(key, new Date());
}

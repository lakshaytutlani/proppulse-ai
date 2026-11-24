import data from "../../data/metro-markets.json";
import type { City, Market } from "@/types";

export const DATA_DISCLAIMER: string = data._meta.data_quality;
export const MARKETS = data.markets as Market[];

export function marketsByCity(city: City): Market[] {
  return MARKETS.filter((m) => m.city === city);
}

export function getMarkets(slugs: string[]): Market[] {
  return slugs
    .map((s) => MARKETS.find((m) => m.slug === s))
    .filter((m): m is Market => Boolean(m));
}

/** Lightweight list for the client-side form. */
export function marketOptions() {
  return MARKETS.map((m) => ({ city: m.city, slug: m.slug, locality: m.locality }));
}

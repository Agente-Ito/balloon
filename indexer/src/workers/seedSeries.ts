import { getSeriesById, createSeries } from "../resolvers/series";

const DEFAULT_SERIES = [
  { id: "new-year",     name: "Happy New Year",    month: 1,  day: 1,  celebrationType: 2 },
  { id: "valentines",   name: "Valentine's Day",   month: 2,  day: 14, celebrationType: 2 },
  { id: "easter",       name: "Happy Easter",      month: 3,  day: 30, celebrationType: 2 },
  { id: "halloween",    name: "Happy Halloween",   month: 10, day: 31, celebrationType: 2 },
  { id: "christmas",    name: "Merry Christmas",   month: 12, day: 25, celebrationType: 2 },
  { id: "new-year-eve", name: "New Year's Eve",    month: 12, day: 31, celebrationType: 2 },
  { id: "diwali",       name: "Happy Diwali",      month: 10, day: 20, celebrationType: 2 },
  { id: "hanukkah",     name: "Happy Hanukkah",    month: 12, day: 26, celebrationType: 2 },
];

const ADMIN = (process.env.ADMIN_ADDRESS ?? "0x0000000000000000000000000000000000000000") as string;

export function seedDefaultSeries(): void {
  for (const s of DEFAULT_SERIES) {
    if (!getSeriesById(s.id)) {
      createSeries({ ...s, curator: ADMIN, description: `Community badge design for ${s.name}` });
      console.log(`[seed] Created series: ${s.id}`);
    }
  }
}

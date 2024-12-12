import { db } from "@/server/db";
import { type CreateCard, cards } from "@/server/db/schema";

console.log("Starting to seed database...");

const colors = ["red", "green", "blue", "yellow"] as const;
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const actionTypes = ["draw_two", "reverse", "skip"] as const;
const wildTypes = ["wild", "wild_draw_four"] as const;

const deck: CreateCard[] = [];

for (const color of colors) {
  deck.push({
    color,
    type: "number",
    value: 0,
  });

  for (const number of numbers.slice(1)) {
    deck.push({
      color,
      type: "number",
      value: number,
    });
    deck.push({
      color,
      type: "number",
      value: number,
    });
  }
}

for (const color of colors) {
  for (const actionType of actionTypes) {
    deck.push({
      color,
      type: actionType,
      value: null,
    });
    deck.push({
      color,
      type: actionType,
      value: null,
    });
  }
}

for (const wildType of wildTypes) {
  for (let i = 0; i < 4; i++) {
    deck.push({
      color: "wild",
      type: wildType,
      value: null,
    });
  }
}

console.log(`Prepared ${deck.length} cards for insertion...`);

try {
  await db.insert(cards).values(deck);
  console.log("Successfully seeded the database!");
} catch (error) {
  console.error("Error seeding database:", error);
  process.exit(1);
}

process.exit(0);

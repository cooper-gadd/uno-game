import { db } from "@/server/db";
import { type CreateCard, cards } from "@/server/db/schema";

console.log("Starting to seed database...");

const colors = ["red", "green", "blue", "yellow"] as const;
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const actionTypes = ["draw_two", "reverse", "skip"] as const;
const wildTypes = [
  "wild",
  "wild_draw_four",
  "wild_shuffle_hands",
  "wild_customizable",
] as const;

const deck: CreateCard[] = [];

// Add number cards
for (const color of colors) {
  // Add one zero
  deck.push({
    color,
    type: "number",
    value: 0,
  });

  // Add two of each 1-9
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

// Add action cards (two of each per color)
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

// Add wild cards (4 of each type)
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

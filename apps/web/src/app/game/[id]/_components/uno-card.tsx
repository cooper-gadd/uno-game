import { cn } from "@/lib/utils";
import { type Card as CardType } from "@/server/db/schema";

export function UnoCard({ card }: { card: CardType }) {
  const { color, type, value } = card;

  const getSymbol = () => {
    if (type === "number") return value;
    switch (type) {
      case "draw_two":
        return "+2";
      case "reverse":
        return "⟲";
      case "skip":
        return "⊘";
      case "wild":
        return "W";
      case "wild_draw_four":
        return "W+4";
      default:
        return "?";
    }
  };

  return (
    <svg
      viewBox="0 0 96 144"
      width="96"
      height="144"
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        color === "red" && "border-red-800 dark:border-red-400",
        color === "blue" && "border-blue-800 dark:border-blue-400",
        color === "green" && "border-green-800 dark:border-green-400",
        color === "yellow" && "border-yellow-700 dark:border-yellow-300",
        color === "wild" &&
          "border-4 border-transparent bg-gradient-to-br from-red-500 via-blue-500 to-green-500 bg-clip-border",
        !color && "border-gray-700",
      )}
    >
      <text
        x="48"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold"
        fill="currentColor"
      >
        {getSymbol()}
      </text>
    </svg>
  );
}

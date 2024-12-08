import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Card as CardType } from "@/server/db/schema";

export function UnoCard({ card }: { card: CardType }) {
  const isPlayable = true;
  const { color, type, value } = card;

  return (
    <Card
      className={cn(
        "h-36 w-24",
        isPlayable && "cursor-pointer transition-transform hover:scale-105",
        (() => {
          if (color === "red") return "border-red-700";
          if (color === "blue") return "border-blue-700";
          if (color === "green") return "border-green-700";
          if (color === "yellow") return "border-yellow-600";
          if (color === "wild")
            return "border-4 border-transparent bg-gradient-to-br from-red-500 via-blue-500 to-green-500 bg-clip-border";
          return "border-gray-700";
        })(),
      )}
    >
      <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
        {(() => {
          if (type === "number") {
            return value;
          }

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
        })()}
      </CardContent>
    </Card>
  );
}

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
        getCardBackground(color),
      )}
    >
      <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
        {renderCardContent({ color, type, value })}
      </CardContent>
    </Card>
  );
}

function getCardBackground(color: string): string {
  switch (color) {
    case "red":
      return "bg-red-600 hover:bg-red-500 border-red-700";
    case "blue":
      return "bg-blue-600 hover:bg-blue-500 border-blue-700";
    case "green":
      return "bg-green-600 hover:bg-green-500 border-green-700";
    case "yellow":
      return "bg-yellow-500 hover:bg-yellow-400 border-yellow-600";
    case "wild":
      return "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 hover:from-red-400 hover:via-blue-400 hover:to-green-400";
    default:
      return "bg-gray-600 hover:bg-gray-500 border-gray-700";
  }
}

function renderCardContent(card: {
  color: string;
  type: string;
  value: number | null;
}) {
  if (card.type === "number") {
    return card.value;
  }

  switch (card.type) {
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
}

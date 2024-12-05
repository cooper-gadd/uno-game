import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
          UNO
        </h1>
        <p className="text-xl text-muted-foreground">
          The classic card game reimagined for the digital age
        </p>
        <Button size="lg" className="mt-4" asChild>
          <Link href="/login">Play Now!</Link>
        </Button>
      </div>
    </div>
  );
}

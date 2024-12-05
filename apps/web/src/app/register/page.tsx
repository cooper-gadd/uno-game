import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { RegisterForm } from "./_components/register-form";
import { headers } from "next/headers";
export default async function Page() {
  const header = await headers();
  const nonce = {
    ip:
      (header.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0] ?? "unknown",
    browser: header.get("user-agent") ?? "unknown",
    timestamp: new Date(),
  };
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm nonce={nonce} />
          <div className="mt-4 text-center text-sm">
            Have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

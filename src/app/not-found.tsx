import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-5xl font-extrabold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold text-zinc-900">Page not found</p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Go to menu
      </Link>
    </div>
  );
}

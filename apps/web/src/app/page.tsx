import { Wordmark } from "@/components/brand/Wordmark";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="m-0">
        <Wordmark className="h-8 w-auto sm:h-10" />
      </h1>
      <p className="mt-8 text-xs uppercase tracking-[0.32em] text-ink-500">
        Under development
      </p>
    </main>
  );
}

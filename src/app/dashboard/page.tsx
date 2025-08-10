import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome</h1>
      <p className="text-muted-foreground">Choose a practice mode to begin.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <a href="/practice/intervals" className="border rounded-md p-4 hover:bg-gray-50">
          Intervals
        </a>
        <a href="/practice/chords" className="border rounded-md p-4 hover:bg-gray-50">
          Chords
        </a>
        <a href="/practice/progressions" className="border rounded-md p-4 hover:bg-gray-50">
          Progressions
        </a>
      </div>
    </div>
  );
}



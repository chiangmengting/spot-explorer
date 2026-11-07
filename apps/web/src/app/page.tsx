import SpotExplorer from '@/components/SpotExplorer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Spot Explorer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              地図から周辺のスポットを探す
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Location Explorer
          </span>
        </div>
      </header>

      <SpotExplorer />
    </main>
  );
}

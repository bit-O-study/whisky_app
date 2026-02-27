export default function TestLoadingPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-gray-900 to-gray-800 px-7 py-12 text-center shadow-2xl">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full border-4 border-white/20 border-t-amber-400 animate-spin" />
        <p className="text-2xl font-black text-white">당신의 취향을 분석하고 있어요</p>
        <p className="text-sm text-gray-300 mt-2">Flavor Vector를 계산해서 가장 잘 맞는 위스키를 찾는 중입니다.</p>
        <div className="mt-6 h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse rounded-full" />
        </div>
      </div>
    </section>
  );
}

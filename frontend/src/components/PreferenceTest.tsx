import { useMemo, useState } from "react";
import type {
  FlavorDimension,
  FlavorVector,
  PreferenceQuestion,
} from "../types/preference";

interface PreferenceTestProps {
  onSubmit: (vector: FlavorVector) => void;
  onCancel: () => void;
}

const questions: PreferenceQuestion[] = [
  {
    id: "q1",
    title: "첫 잔을 고른다면 어떤 향이 끌리나요?",
    options: [
      { label: "꿀, 캐러멜처럼 달콤한 향", weights: { sweet: 3, body: 1 } },
      { label: "모닥불 같은 스모키 향", weights: { smoky: 3, woody: 1 } },
      { label: "사과, 건포도 같은 과일 향", weights: { fruity: 3, sweet: 1 } },
      { label: "후추, 시나몬 같은 스파이시 향", weights: { spicy: 3, body: 1 } },
    ],
  },
  {
    id: "q2",
    title: "평소 즐기는 디저트 취향은?",
    options: [
      { label: "초콜릿, 카라멜 디저트", weights: { sweet: 3, woody: 1 } },
      { label: "상큼한 과일 타르트", weights: { fruity: 3, sweet: 1 } },
      { label: "디저트보다 짭짤한 안주", weights: { spicy: 2, body: 2 } },
      { label: "달달함보단 깔끔함", weights: { smoky: 1, woody: 2, body: 1 } },
    ],
  },
  {
    id: "q3",
    title: "캠핑에서 더 마음이 가는 분위기는?",
    options: [
      { label: "불멍과 훈연 요리", weights: { smoky: 3, woody: 2 } },
      { label: "과일 칵테일과 음악", weights: { fruity: 3, sweet: 1 } },
      { label: "진한 스테이크 한 점", weights: { body: 3, spicy: 1 } },
      { label: "견과류와 초콜릿 페어링", weights: { woody: 2, sweet: 2 } },
    ],
  },
  {
    id: "q4",
    title: "원하는 피니시는 어떤 느낌인가요?",
    options: [
      { label: "부드럽고 달콤하게 오래", weights: { sweet: 3, body: 1 } },
      { label: "입안에 남는 스파이스", weights: { spicy: 3, body: 1 } },
      { label: "나무 향이 길게 남는 느낌", weights: { woody: 3, smoky: 1 } },
      { label: "상쾌하고 과일향 중심", weights: { fruity: 3, sweet: 1 } },
    ],
  },
  {
    id: "q5",
    title: "도수가 높은 술에 대한 선호도는?",
    options: [
      { label: "강렬할수록 좋다", weights: { body: 3, spicy: 2 } },
      { label: "적당히 무게감 있는 정도", weights: { body: 2, woody: 1 } },
      { label: "부드럽고 마시기 편한 쪽", weights: { sweet: 2, fruity: 1 } },
      { label: "잘 모르겠다", weights: { sweet: 1, smoky: 1, fruity: 1, spicy: 1, woody: 1, body: 1 } },
    ],
  },
  {
    id: "q6",
    title: "향을 맡았을 때 가장 반가운 노트는?",
    options: [
      { label: "바닐라, 토피", weights: { sweet: 3, woody: 1 } },
      { label: "훈연, 가죽", weights: { smoky: 3, woody: 1 } },
      { label: "건자두, 오렌지", weights: { fruity: 3, sweet: 1 } },
      { label: "정향, 생강", weights: { spicy: 3, body: 1 } },
    ],
  },
  {
    id: "q7",
    title: "한 잔 마실 때 원하는 질감은?",
    options: [
      { label: "묵직하고 점성 있는 질감", weights: { body: 3, woody: 1 } },
      { label: "가볍고 산뜻한 질감", weights: { fruity: 2, sweet: 2 } },
      { label: "드라이하고 스모키한 질감", weights: { smoky: 2, spicy: 1, woody: 1 } },
      { label: "부드럽고 둥근 질감", weights: { sweet: 2, body: 1, fruity: 1 } },
    ],
  },
  {
    id: "q8",
    title: "한 병을 고를 때 더 중요한 건?",
    options: [
      { label: "향의 개성", weights: { smoky: 1, fruity: 1, spicy: 1, woody: 1 } },
      { label: "부드러운 밸런스", weights: { sweet: 2, body: 1, fruity: 1 } },
      { label: "강한 캐릭터", weights: { body: 2, spicy: 2 } },
      { label: "오크 숙성감", weights: { woody: 3, sweet: 1 } },
    ],
  },
  {
    id: "q9",
    title: "친구에게 위스키를 설명한다면?",
    options: [
      { label: "달콤해서 입문하기 좋다", weights: { sweet: 3, fruity: 1 } },
      { label: "스모키해서 매력적이다", weights: { smoky: 3, woody: 1 } },
      { label: "과일향과 산미가 좋다", weights: { fruity: 3, sweet: 1 } },
      { label: "묵직하고 짜릿하다", weights: { body: 2, spicy: 2 } },
    ],
  },
  {
    id: "q10",
    title: "마지막 질문: 오늘의 기분은?",
    options: [
      { label: "따뜻하고 달달한 밤", weights: { sweet: 2, woody: 1, body: 1 } },
      { label: "강렬하고 개성 있는 밤", weights: { smoky: 2, spicy: 2 } },
      { label: "상큼하고 가벼운 밤", weights: { fruity: 3, sweet: 1 } },
      { label: "차분하고 깊은 밤", weights: { woody: 2, body: 2 } },
    ],
  },
];

const dimensionOrder: FlavorDimension[] = ["sweet", "smoky", "fruity", "spicy", "woody", "body"];

function buildFlavorVector(selected: number[]): FlavorVector {
  const totals: Record<FlavorDimension, number> = {
    sweet: 0,
    smoky: 0,
    fruity: 0,
    spicy: 0,
    woody: 0,
    body: 0,
  };

  selected.forEach((optionIndex, qIndex) => {
    const option = questions[qIndex].options[optionIndex];
    if (!option) {
      return;
    }

    dimensionOrder.forEach((dimension) => {
      totals[dimension] += option.weights[dimension] ?? 0;
    });
  });

  const sum = dimensionOrder.reduce((acc, dimension) => acc + totals[dimension], 0);
  if (sum <= 0) {
    return {
      sweet: 16.67,
      smoky: 16.67,
      fruity: 16.67,
      spicy: 16.67,
      woody: 16.67,
      body: 16.67,
    };
  }

  return {
    sweet: (totals.sweet / sum) * 100,
    smoky: (totals.smoky / sum) * 100,
    fruity: (totals.fruity / sum) * 100,
    spicy: (totals.spicy / sum) * 100,
    woody: (totals.woody / sum) * 100,
    body: (totals.body / sum) * 100,
  };
}

export default function PreferenceTest({ onSubmit, onCancel }: PreferenceTestProps) {
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [step, setStep] = useState(0);

  const progress = useMemo(() => Math.round(((step + 1) / questions.length) * 100), [step]);

  const current = questions[step];
  const selectedIndex = answers[step];

  function selectOption(index: number) {
    const copied = [...answers];
    copied[step] = index;
    setAnswers(copied);
  }

  function goPrev() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    if (selectedIndex < 0) {
      return;
    }

    if (step === questions.length - 1) {
      onSubmit(buildFlavorVector(answers));
      return;
    }
    setStep((prev) => Math.min(questions.length - 1, prev + 1));
  }

  return (
    <section className="max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 p-6 sm:p-8 shadow-xl border border-amber-100">
        <div className="mb-7">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>취향 테스트 진행률</span>
            <span className="font-semibold">{step + 1} / {questions.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="min-h-[320px] sm:min-h-[340px] transition-all duration-300">
          <p className="text-xs font-semibold tracking-wide text-amber-700">Q{step + 1}</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">{current.title}</h2>
          {current.description && <p className="text-sm text-gray-600 mt-1">{current.description}</p>}

          <div className="mt-6 grid gap-3">
            {current.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => selectOption(index)}
                  className={[
                    "w-full rounded-2xl border px-4 py-4 text-left text-sm sm:text-base transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500",
                    isSelected
                      ? "bg-amber-500 text-white border-amber-500 shadow-md -translate-y-0.5"
                      : "bg-white/90 border-amber-100 hover:border-amber-300 hover:bg-white",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={step === 0 ? onCancel : goPrev}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {step === 0 ? "홈으로" : "이전"}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={selectedIndex < 0}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {step === questions.length - 1 ? "결과 보기" : "다음"}
          </button>
        </div>
      </div>
    </section>
  );
}

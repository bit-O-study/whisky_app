import LiquorDetailView from "@/features/catalog/ui/LiquorDetailView";

interface PageProps {
    params: { id: string };
}

export default function LiquorDetailPage({ params }: PageProps) {
    const { id } = params;

    const dummyLiquor = {
        id: id,
        name: "더미 위스키 상세",
        brand: "Dummy Brand",
        category: "Whisky",
        country: "Scotland",
        alcohol_percent: 40,
        volume_ml: 700,
        lowest_price: 198000,
        vendors: [
            { source: "EMART", current_price: 198000, product_url: "#" },
            { source: "LOTTEON", current_price: 205000, product_url: "#" }
        ]
    };

    return <LiquorDetailView liquor={dummyLiquor} />;
}
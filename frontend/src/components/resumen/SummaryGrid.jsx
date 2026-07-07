import SummaryCard from "./SummaryCard";

export default function SummaryGrid({ cards }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => <SummaryCard key={card.title} card={card} />)}
    </section>
  );
}

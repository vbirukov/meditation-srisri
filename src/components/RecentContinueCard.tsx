import './RecentContinueCard.css';

interface RecentContinueCardProps {
  label: string;
  title: string;
  meta: string;
  cta: string;
  onContinue: () => void;
}

export function RecentContinueCard({
  label,
  title,
  meta,
  cta,
  onContinue,
}: RecentContinueCardProps) {
  return (
    <section className="continue-card" aria-label={label}>
      <p className="continue-card__label">{label}</p>
      <button type="button" className="continue-card__main" onClick={onContinue}>
        <div className="continue-card__text">
          <strong className="continue-card__title">{title}</strong>
          <span className="continue-card__meta">{meta}</span>
        </div>
        <span className="continue-card__cta">{cta}</span>
      </button>
    </section>
  );
}

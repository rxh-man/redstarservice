export function ServiceFlipCard({
  title,
  arabic,
  back,
  icon,
}: {
  title: string;
  arabic: string;
  back: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flip-card h-56">
      <div className="flip-inner">
        <div className="flip-face bg-primary text-primary-foreground p-6 flex flex-col justify-between shadow-card">
          <div className="text-gold">{icon}</div>
          <div>
            <div className="text-xl font-semibold">{title}</div>
            <div className="arabic text-base mt-1">{arabic}</div>
          </div>
        </div>
        <div className="flip-face flip-back bg-gold text-gold-foreground p-5 flex items-center text-sm leading-relaxed">
          {back}
        </div>
      </div>
    </div>
  );
}

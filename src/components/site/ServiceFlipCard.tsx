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
        <div className="flip-face bg-card border border-border p-6 flex flex-col justify-between shadow-card">
          <div className="flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-gold/10 border border-gold/40 text-gold">
              {icon}
            </div>
            <span className="arabic text-sm">{arabic}</span>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">Hover to learn more →</div>
          </div>
        </div>
        <div className="flip-face flip-back bg-gradient-gold text-gold-foreground p-5 flex items-center text-sm leading-relaxed">
          {back}
        </div>
      </div>
    </div>
  );
}

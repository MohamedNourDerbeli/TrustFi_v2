interface FeatureSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageRight?: boolean;
  features?: string[];
}

export default function FeatureSection({
  title,
  description,
  imageSrc,
  imageAlt,
  imageRight = false,
  features = [],
}: FeatureSectionProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${imageRight ? 'md:grid-flow-dense' : ''}`}>
      <div className={imageRight ? 'md:col-start-2' : ''}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="rounded-2xl w-full h-auto shadow-lg"
        />
      </div>
      <div className={imageRight ? 'md:col-start-1 md:row-start-1' : ''}>
        <h3 className="text-3xl md:text-4xl font-semibold mb-4">{title}</h3>
        <p className="text-lg text-muted-foreground mb-6">{description}</p>
        {features.length > 0 && (
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

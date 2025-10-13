import React, { CSSProperties, ReactNode, forwardRef, useMemo } from 'react';

export type GlowIntensity = 'sm' | 'md' | 'lg';

export interface GlowEffectProps {
  children: ReactNode;
  /**
   * Controls the blur radius and spread of the glow halo.
   * @default 'md'
   */
  intensity?: GlowIntensity;
  /**
   * Accent color for the glow halo.
   * @default '#6366f1'
   */
  color?: string;
  /**
   * Additional class name applied to the root element.
   */
  className?: string;
  /**
   * Inline styles merged with the effect styles.
   */
  style?: CSSProperties;
}

const intensityBlur: Record<GlowIntensity, number> = {
  sm: 12,
  md: 18,
  lg: 26,
};

/**
 * Wraps arbitrary children with a subtle halo glow that responds to hover state.
 * The effect does not rely on any CSS preprocessor, making it safe to ship from a package
 * without leaking global styles.
 */
export const GlowEffect = forwardRef<HTMLDivElement, GlowEffectProps>(
  ({ children, intensity = 'md', color = '#6366f1', className, style }, ref) => {
    const blurAmount = intensityBlur[intensity];

    const haloStyle = useMemo<CSSProperties>(() => ({
      position: 'absolute',
      inset: '-8px',
      borderRadius: 'inherit',
      background: `radial-gradient(circle at 30% 20%, ${color}55, transparent 60%)`,
      filter: `blur(${blurAmount}px)`,
      opacity: 0.65,
      transition: 'opacity 200ms ease, transform 200ms ease',
      transform: 'scale(0.98)',
      pointerEvents: 'none',
    }), [blurAmount, color]);

    const containerStyle = useMemo<CSSProperties>(() => ({
      position: 'relative',
      display: 'block',
      borderRadius: '16px',
      overflow: 'visible',
      transition: 'transform 200ms ease',
    }), []);

    const mergedStyle: CSSProperties = {
      ...containerStyle,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={mergedStyle}
        onMouseEnter={(event) => {
          const target = event.currentTarget.querySelector('[data-glow-halo]') as HTMLElement | null;
          if (target) {
            target.style.opacity = '1';
            target.style.transform = 'scale(1)';
          }
        }}
        onMouseLeave={(event) => {
          const target = event.currentTarget.querySelector('[data-glow-halo]') as HTMLElement | null;
          if (target) {
            target.style.opacity = '0.65';
            target.style.transform = 'scale(0.98)';
          }
        }}
      >
        <div data-glow-halo style={haloStyle} />
        <div style={{ position: 'relative', borderRadius: 'inherit' }}>{children}</div>
      </div>
    );
  }
);

GlowEffect.displayName = 'GlowEffect';

export default GlowEffect;

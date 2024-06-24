import React, { useEffect, useRef } from 'react';
import clsx from 'clsx'

interface BackgroundPatternProps {
  fill?: string;
  style?: object;
  spacing?: number;
  sizing?: number;
  className?: string;
}

const BackgroundPattern = ({ fill= "#6CE89E", style, spacing=40, sizing=10, className }: BackgroundPatternProps) => {
  const containerRef = useRef<HTMLDivElement>(null); // Use useRef to access the DOM element
  console.log(sizing)
  useEffect(() => {
    if (containerRef.current) { // Check if the ref's current property is not null
      const pattern = createPlusSignPattern();

      containerRef.current.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(pattern)}')`;
    }
  }, []);

  const createPlusSignPattern = () => {
    // Define the size and spacing of the plus signs
    const size = sizing; // Size of the plus signs
    const space = spacing; // Spacing between the plus signs

    const svgPattern = `<svg width="${size + space}" height="${size + space}" viewBox="-1 -1 75 75" xmlns="http://www.w3.org/2000/svg">
      <path stroke="${fill}" fill="${fill}" d="M5.80484 2.77731L3.52794 2.47206L3.22269 0.195163C3.18766 -0.0650542 2.81234 -0.0650542 2.77731 0.195163L2.47206 2.47206L0.195163 2.77731C-0.0650542 2.81234 -0.0650542 3.18766 0.195163 3.22269L2.47206 3.52794L2.77731 5.80484C2.81234 6.06505 3.18766 6.06505 3.22269 5.80484L3.52794 3.52794L5.80484 3.22269C6.06505 3.18766 6.06505 2.81234 5.80484 2.77731Z" />
    </svg>`

    return svgPattern;
  };

  return (
    <div
      style={style}
      className={clsx(className, "fixed")} ref={containerRef}>
      {/* The pattern is applied to this container */}
    </div>
  );
};

export default BackgroundPattern;
import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

export function ChartFrame({ children, height = 320 }) {
  const frameRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!frameRef.current) return undefined;

    const updateWidth = () => {
      const nextWidth = frameRef.current?.getBoundingClientRect().width || 0;
      setWidth(nextWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="h-80 w-full min-w-0" style={{ minHeight: height }}>
      {width > 0 ? (
        <ResponsiveContainer width={Math.floor(width)} height={height}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  );
}

export default ChartFrame;

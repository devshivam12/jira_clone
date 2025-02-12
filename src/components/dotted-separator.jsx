import { cn } from '../lib/utils';

export const DottedSeparator = ({
  className,
  color = '#d4d4d8',
  height = '2px',
  dotSize = '2px',
  gapSize = '6px',
  direction = 'horizontal',
}) => {
  const isHorizontal = direction === 'horizontal';

  // Convert sizes to numbers for calculations
  const dotSizeValue = parseInt(dotSize, 10);
  const gapSizeValue = parseInt(gapSize, 10);

  return (
    <div
      className={cn(
        isHorizontal
          ? 'w-full flex items-center'
          : 'h-full flex flex-col items-center',
        className,
      )}
    >
      <div
        className={isHorizontal ? 'flex-grow' : 'flex-grow-0'}
        style={{
          width: isHorizontal ? '100%' : height,
          height: isHorizontal ? height : '100%',
          backgroundImage: `radial-gradient(circle, ${color} 25%, transparent 25%)`,
          backgroundSize: isHorizontal
            ? `${dotSizeValue + gapSizeValue}px ${height}`
            : `${height} ${dotSizeValue + gapSizeValue}px`,
          backgroundRepeat: isHorizontal ? 'repeat-x' : 'repeat-y',
          backgroundPosition: 'center',
        }}
      />
    </div>
  );
};

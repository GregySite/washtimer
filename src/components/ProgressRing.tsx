interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressRing = ({ 
  progress, 
  size = 200, 
  strokeWidth = 12,
  color = "#14b8d4" // Fallback color instead of CSS variable
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg 
      className="progress-ring" 
      width={size} 
      height={size}
      style={{
        WebkitTransform: 'rotate(-90deg)',
        transform: 'rotate(-90deg)',
      }}
    >
      {/* Background circle */}
      <circle
        stroke="#c5dfe8"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress circle */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={String(circumference)}
        strokeDashoffset={String(offset)}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ 
          WebkitTransition: 'stroke-dashoffset 0.5s ease',
          transition: 'stroke-dashoffset 0.5s ease',
        }}
      />
    </svg>
  );
};

export default ProgressRing;

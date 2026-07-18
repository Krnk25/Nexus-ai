export default function MatrixRain() {

  const chars = Array.from({ length: 250 });

  return (
    <div className="matrix">

      {chars.map((_, i) => (
        <span
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 5}s`
          }}
        >
          {Math.random() > 0.5 ? "1" : "0"}
        </span>
      ))}

    </div>
  );
}
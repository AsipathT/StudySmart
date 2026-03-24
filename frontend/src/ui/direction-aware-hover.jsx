import React from "react";

function getHoverDirection(event, element) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;

  const angle = Math.atan2(y, x); // -PI..PI
  const deg = (angle * 180) / Math.PI; // -180..180
  const normalized = (deg + 180 + 45) % 360; // 0..360, rotated by 45deg
  const quadrant = Math.floor(normalized / 90); // 0..3

  // 0: right, 1: bottom, 2: left, 3: top
  switch (quadrant) {
    case 0:
      return "right";
    case 1:
      return "bottom";
    case 2:
      return "left";
    default:
      return "top";
  }
}

const exitTranslate = {
  top: "-translate-y-6",
  bottom: "translate-y-6",
  left: "-translate-x-6",
  right: "translate-x-6",
};

export function DirectionAwareHover({
  imageUrl,
  children,
  staticContent,
  className = "",
  tintClassName = "from-black/70 via-black/30",
  staticCardClassName = "",
  hoverCardClassName = "",
}) {
  const ref = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  const [direction, setDirection] = React.useState("top");

  const handleEnter = (e) => {
    if (!ref.current) return;
    setDirection(getHoverDirection(e, ref.current));
    setHovered(true);
  };

  const handleLeave = (e) => {
    if (!ref.current) {
      setHovered(false);
      return;
    }
    setDirection(getHoverDirection(e, ref.current));
    setHovered(false);
  };

  const hoverState = hovered
    ? "opacity-100 translate-x-0 translate-y-0"
    : `opacity-0 ${exitTranslate[direction]}`;

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={[
        "group relative w-full overflow-hidden rounded-2xl",
        "border border-gray-200/80 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "scale-105 transition-transform duration-500",
          "group-hover:scale-110",
        ].join(" ")}
        loading="lazy"
        draggable={false}
      />

      {/* Tint/gradient for readability */}
      <div
        className={[
          "absolute inset-0 bg-gradient-to-t to-transparent",
          tintClassName,
        ].join(" ")}
        aria-hidden="true"
      />

      {/* Always-visible content (stats) */}
      {staticContent ? (
        <div className="relative z-10 flex h-full items-end p-4">
          <div
            className={[
              "w-full rounded-xl border border-white/60",
              "bg-white/90 backdrop-blur-md",
              "px-3.5 py-3 shadow-sm",
              staticCardClassName,
            ].join(" ")}
          >
            {staticContent}
          </div>
        </div>
      ) : null}

      {/* Hover overlay content */}
      <div
        className={[
          "pointer-events-none absolute inset-0 z-20 flex items-end p-4",
          "transition-all duration-300 ease-out",
          hoverState,
        ].join(" ")}
        aria-hidden={!hovered}
      >
        <div
          className={[
            "w-full rounded-xl border border-white/15",
            "bg-black/55 px-3.5 py-3 text-white backdrop-blur-md",
            hoverCardClassName,
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

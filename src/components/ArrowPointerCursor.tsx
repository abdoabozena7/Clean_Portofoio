import { useEffect, useRef } from "react";

type PointerLikeEvent = MouseEvent | Touch;

type CursorPosition = {
  distanceX: number;
  distanceY: number;
  distance: number;
  pointerX: number;
  pointerY: number;
};

const ArrowPointerCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (!cursor || !supportsFinePointer) {
      return undefined;
    }

    const root = document.body;
    const position: CursorPosition = {
      distanceX: 0,
      distanceY: 0,
      distance: 0,
      pointerX: 0,
      pointerY: 0,
    };

    let previousPointerX = 0;
    let previousPointerY = 0;
    let angle = 0;
    let previousAngle = 0;
    let angleDisplace = 0;
    const degrees = 57.296;
    const cursorSize = 20;

    Object.assign(cursor.style, {
      boxSizing: "border-box",
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "2147483647",
      width: `${cursorSize}px`,
      height: `${cursorSize}px`,
      transition: "250ms, transform 100ms",
      userSelect: "none",
      pointerEvents: "none",
      opacity: "0",
    } satisfies Partial<CSSStyleDeclaration>);

    const rotate = () => {
      const unsortedAngle =
        Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) *
        degrees;
      const style = cursor.style;
      previousAngle = angle;

      if (position.distanceX <= 0 && position.distanceY >= 0) {
        angle = 90 - unsortedAngle + 0;
      } else if (position.distanceX < 0 && position.distanceY < 0) {
        angle = unsortedAngle + 90;
      } else if (position.distanceX >= 0 && position.distanceY <= 0) {
        angle = 90 - unsortedAngle + 180;
      } else if (position.distanceX > 0 && position.distanceY > 0) {
        angle = unsortedAngle + 270;
      }

      if (Number.isNaN(angle)) {
        angle = previousAngle;
      } else if (angle - previousAngle <= -270) {
        angleDisplace += 360 + angle - previousAngle;
      } else if (angle - previousAngle >= 270) {
        angleDisplace += angle - previousAngle - 360;
      } else {
        angleDisplace += angle - previousAngle;
      }

      style.left = `${-cursorSize / 2}px`;
      style.top = "0px";
      style.transform += ` rotate(${angleDisplace}deg)`;
    };

    const move = (event: PointerLikeEvent) => {
      previousPointerX = position.pointerX;
      previousPointerY = position.pointerY;
      position.pointerX = event.pageX + root.getBoundingClientRect().x;
      position.pointerY = event.pageY + root.getBoundingClientRect().y;
      position.distanceX = previousPointerX - position.pointerX;
      position.distanceY = previousPointerY - position.pointerY;
      position.distance = Math.sqrt(
        position.distanceY ** 2 + position.distanceX ** 2,
      );

      cursor.style.transform = `translate3d(${position.pointerX}px, ${position.pointerY}px, 0)`;

      if (position.distance > 1) {
        rotate();
      } else {
        cursor.style.transform += ` rotate(${angleDisplace}deg)`;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      move(event);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches[0]) {
        move(event.touches[0]);
      }
    };

    document.documentElement.classList.add("curzr-arrow-active");
    window.setTimeout(() => {
      cursor.removeAttribute("hidden");
    }, 500);
    cursor.style.opacity = "1";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.documentElement.classList.remove("curzr-arrow-active");
      cursor.style.opacity = "0";
      cursor.setAttribute("hidden", "hidden");
    };
  }, []);

  return (
    <div ref={cursorRef} className="curzr-arrow-pointer" hidden>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <path
          d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
          fill="#F2F5F8"
        />
        <path
          d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
          fill="#111920"
        />
      </svg>
    </div>
  );
};

export default ArrowPointerCursor;

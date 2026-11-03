import { createRoot } from "react-dom/client";
import { startTransition } from "react";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
const render = () => root.render(<App />);
if (matchMedia("(pointer: coarse), (max-width: 767px)").matches) {
  // Let React yield during construction of the initial tree on touch devices.
  startTransition(render);
} else {
  render();
}

import { createRoot } from "react-dom/client";
import App from "./App";
import { bindInput } from "./systems/input";
import "./styles.css";

bindInput();
createRoot(document.getElementById("root")!).render(<App />);

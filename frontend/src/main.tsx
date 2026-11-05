import { createRoot } from "react-dom/client";
import App from "./App";
import Moderation from "./ui/Moderation";
import { bindInput } from "./systems/input";
import "./styles.css";

bindInput();
const moderating = location.pathname.startsWith("/moderate");
createRoot(document.getElementById("root")!).render(moderating ? <Moderation /> : <App />);

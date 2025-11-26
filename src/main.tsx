
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
 import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/Experium">
    <App />
  </BrowserRouter>
);


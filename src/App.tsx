import { CssBaseline } from "@mui/material";
// import theme from "./theme";
// import CurrencySwapForm from "./currency-swap-form";
import CurrencySwapForm from "./CurrencySwapForm";
import "./index.css";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <CssBaseline />
      <div className="w-full flex justify-center p-4 box-border">
        <CurrencySwapForm />
      </div>
    </>
  );
}
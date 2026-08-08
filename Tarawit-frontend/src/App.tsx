import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { verifyTokenThunk } from "./features/auth/authSlice";
import router from "./routes/router";
import SplashScreen from "./components/SplashScreen";
import GlobalLoader from "./components/GlobalLoader";

function App() {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);
  const [showSplash, setShowSplash] = useState(true);
  const { globalLoading } = useAppSelector((s) => s.ui);

  useEffect(() => {
    const init = async () => {
      const start = Date.now();

      await dispatch(verifyTokenThunk());

      const elapsed = Date.now() - start;
      const minDuration = 800;

      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        setTimeout(() => setShowSplash(false), remaining);
      } else {
        setShowSplash(false);
      }
    };

    init();
  }, [dispatch]);

  if (status === "checking" || showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <GlobalLoader show={globalLoading} />
    </>
  );
}
export default App;

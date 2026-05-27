import { useEffect, useState } from "react";
import useDevMindStore from "../store/useDevMindStore";

const usePreview = () => {
  const { code } = useDevMindStore();
  const [previewCode, setPreviewCode] = useState(code);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPreviewCode(code);
    }, 600);

    return () => clearTimeout(timeout);
  }, [code]);

  return { previewCode };
};

export default usePreview;
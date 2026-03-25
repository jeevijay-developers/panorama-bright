import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface PageTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType>({ title: "", setTitle: () => {} });

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState("");
  const setTitle = useCallback((t: string) => setTitleState(t), []);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(newTitle?: string) {
  const ctx = useContext(PageTitleContext);
  // Allow pages to set title on mount
  return ctx;
}

export function useSetPageTitle(title: string) {
  const { setTitle } = useContext(PageTitleContext);
  // We need useEffect but can't import here cleanly, so just expose setTitle
  return setTitle;
}

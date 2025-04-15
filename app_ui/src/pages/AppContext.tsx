import { createContext, useContext, useState } from "react";

interface AppContextType  {
  userId: number;
  setUserId: (id: number) => void;
  itemId:number;
  setItemId: (id:number) => void;
  isLoggedIn:Boolean;
  setIsLoggedIn: (loggedIn:boolean) => void;
  flag: number;
  setFlag: (flag:number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState(0);
  const [itemId,setItemId] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [flag,setFlag] = useState(0)

  return (
    <AppContext.Provider value={{ userId, setUserId, itemId, setItemId, isLoggedIn, setIsLoggedIn, flag, setFlag}}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = ():AppContextType => {
  const context = useContext(AppContext);
  if (!context){
    throw new Error("useAppContext must be used within AppProvider")
  };
  return context;
};

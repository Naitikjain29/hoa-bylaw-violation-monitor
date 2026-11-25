"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("hoa_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
        localStorage.setItem("hoa_user", JSON.stringify(res.data.user));
      } catch {
        localStorage.removeItem("hoa_token");
        localStorage.removeItem("hoa_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: loggedInUser } = res.data;
    localStorage.setItem("hoa_token", token);
    localStorage.setItem("hoa_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    router.push("/dashboard");
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { token, user: newUser } = res.data;
    localStorage.setItem("hoa_token", token);
    localStorage.setItem("hoa_user", JSON.stringify(newUser));
    setUser(newUser);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("hoa_token");
    localStorage.removeItem("hoa_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
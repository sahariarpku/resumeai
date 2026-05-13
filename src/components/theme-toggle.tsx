"use client";

import React from "react";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("mid");
    else if (theme === "mid") setTheme("white");
    else setTheme("dark");
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={cycleTheme} 
      className="relative overflow-hidden w-9 h-9 rounded-full border-muted bg-background hover:bg-muted"
      title="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" && (
          <motion.div
            key="dark"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        )}
        {theme === "mid" && (
          <motion.div
            key="mid"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Monitor className="h-4 w-4" />
          </motion.div>
        )}
        {theme === "white" && (
          <motion.div
            key="white"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute text-yellow-500"
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

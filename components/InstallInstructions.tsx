import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function InstallInstructions() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold mb-2">Install on Android</h2>
      <ol className="list-decimal list-inside space-y-2">
        <li>Open this website in Chrome on your Android device</li>
        <li>Tap the menu icon (three dots in the top-right corner)</li>
        <li>Tap "Add to Home screen"</li>
        <li>Choose a name for the app and tap "Add"</li>
        <li>The app icon will appear on your home screen</li>
      </ol>
    </motion.div>
  );
}

"use client";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "@/components/Auth";
import { Chat } from "@/components/Chat";
import { useEffect } from "react";
import { requestNotificationToken } from "@/lib/firebase";

export default function Home() {
  const [user] = useAuthState(auth);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    }

    // Request FCM token
    requestNotificationToken();
  }, []);

  return (
    <main className="p-4">
      {user ? <Chat /> : <Auth />}
    </main>
  );
}
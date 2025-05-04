"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth, provider, createUserIfNotExists } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export function Auth() {
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider);
    await createUserIfNotExists(result.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Chat Application</h1>
        <Button onClick={signInWithGoogle}>Sign in with Google</Button>
      </Card>
    </div>
  );
}
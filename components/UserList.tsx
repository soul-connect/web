"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserList({ onSelectUser, className }: { onSelectUser: (userId: string) => void; className?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unseenCounts, setUnseenCounts] = useState<{ [key: string]: number }>({}); // Track unseen messages

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
      setUsers(users.filter((u: any) => u.uid !== currentUser?.uid));
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) fetchUsers();
    });

    return () => unsubscribeAuth();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for unseen messages for each user
    const unsubscribe = onSnapshot(
      query(collection(db, "messages"), where("receiverId", "==", currentUser.uid), where("seen", "==", false)),
      (snapshot) => {
        const counts: { [key: string]: number } = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const senderId = data.senderId;
          counts[senderId] = (counts[senderId] || 0) + 1;

          // Push notification for new unseen messages
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `You have a new message from ${data.senderName}`,
              icon: "/icons/icon-192x192.png"
            });
          }
        });
        setUnseenCounts(counts);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className={`bg-muted p-4 overflow-auto ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Users</h2>
      <div className="space-y-2">
        {users.map((user) => (
          <Button
            key={user.uid}
            variant="ghost"
            className="w-full justify-start gap-2 relative"
            onClick={() => onSelectUser(user.uid)}
          >
            <Avatar>
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
            {user.displayName}
            {unseenCounts[user.uid] > 0 && (
              <span className="absolute right-2 top-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unseenCounts[user.uid]}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
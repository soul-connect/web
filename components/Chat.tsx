"use client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, addDoc, serverTimestamp, query, where, or, and, orderBy, doc, getDoc, getDocs, writeBatch, onSnapshot } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { UserList } from "./UserList";
import { IoMdSend } from "react-icons/io";
import { MdPermMedia } from "react-icons/md";
import { RiAiGenerate2 } from "react-icons/ri";
import { IoCall, IoVideocam } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react"; // Import the emoji picker

export function Chat() {
  const [user] = useAuthState(auth);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null); // Store selected user's name
  const [isChatView, setIsChatView] = useState(false); // Toggle between screens
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false); // Tooltip state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to toggle emoji picker
  const [messages, loading, error] = useCollection(
    selectedUser && user?.uid
      ? query(
          collection(db, "messages"),
          or(
            and(
              where("senderId", "==", user.uid),
              where("receiverId", "==", selectedUser)
            ),
            and(
              where("senderId", "==", selectedUser),
              where("receiverId", "==", user.uid)
            )
          ),
          orderBy("timestamp", "asc")
        )
      : null,
    {
      snapshotListenOptions: { includeMetadataChanges: true }
    }
  );

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch selected user's name when user is selected
  useEffect(() => {
    const fetchSelectedUserName = async () => {
      if (selectedUser) {
        const userDoc = await getDoc(doc(db, "users", selectedUser));
        if (userDoc.exists()) {
          setSelectedUserName(userDoc.data()?.displayName || "Unknown User");
        }
      }
    };

    fetchSelectedUserName();
  }, [selectedUser]);

  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (!selectedUser || !user) return;

      const unseenMessagesQuery = query(
        collection(db, "messages"),
        where("senderId", "==", selectedUser),
        where("receiverId", "==", user.uid),
        where("seen", "==", false)
      );

      const snapshot = await getDocs(unseenMessagesQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      await batch.commit();
    };

    markMessagesAsSeen();
  }, [selectedUser, user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "messages"), where("receiverId", "==", user?.uid), where("seen", "==", false)),
      (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Push notification for new unseen messages
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `You have a new message from ${data.senderName}`,
              icon: "/icons/icon-192x192.png"
            });
          }
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !selectedUser) return;

    await addDoc(collection(db, "messages"), {
      text: message,
      senderId: user.uid,
      receiverId: selectedUser,
      senderName: user.displayName,
      participants: [user.uid, selectedUser],
      timestamp: serverTimestamp(),
      seen: false, // Add this field
    });
    setMessage("");
  };

  const handleFileUpload = async (file: File) => {
    if (!user || !selectedUser) return;

    const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "messages"), {
      mediaUrl: url,
      senderId: user.uid,
      receiverId: selectedUser,
      senderName: user.displayName,
      participants: [user.uid, selectedUser],
      timestamp: serverTimestamp(),
    });
  };

  const handleAiGenerateClick = () => {
    setShowTooltip(true); // Show the tooltip
    setTimeout(() => {
      setShowTooltip(false); // Hide the tooltip after 4 seconds
    }, 4000);
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji); // Append the selected emoji to the message
    setShowEmojiPicker(false); // Close the emoji picker
  };

  return (
    <div className="h-screen flex flex-col">
      {!isChatView ? (
        // Screen 1: User List
        <UserList
          onSelectUser={(userId) => {
            setSelectedUser(userId);
            setIsChatView(true); // Switch to chat view
          }}
          className="flex-1 overflow-auto"
        />
      ) : (
        // Screen 2: Chat View
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
            <Button variant="ghost" onClick={() => setIsChatView(false)}>
              ←
            </Button>
            <div className="font-semibold flex items-center gap-2">
            <Avatar>
              {/* <AvatarImage src={user.photoURL} /> */}
              <AvatarFallback>{selectedUserName}</AvatarFallback>
            </Avatar>
            {selectedUserName || "Loading..."}</div>
            </div>

            <div className="flex items-center gap-4 text-xl"><IoCall/>
            <IoVideocam/></div>
          </div>
          <ScrollArea className="flex-1 p-4 relative overflow-auto bg-[url('/chat-bg-light.png')]" ref={scrollAreaRef}>
            <div className="space-y-4">
              {loading ? (
                <div className="ßabsolute bottom-8 left-4 right-4">Loading messages...</div>
              ) : messages?.empty ? (
                <div
                  className="cursor-pointer absolute bottom-8 left-4 right-4 bg-red-300/30 backdrop-blur-md border border-white/20 rounded-4xl text-center px-4 py-2 shadow-lg"
                  onClick={async () => {
                    if (!user || !selectedUser) return;

                    // Send the "Hii" message
                    await addDoc(collection(db, "messages"), {
                      text: "Hii",
                      senderId: user.uid,
                      receiverId: selectedUser,
                      senderName: user.displayName,
                      participants: [user.uid, selectedUser],
                      timestamp: serverTimestamp(),
                      seen: false, // Mark as unseen
                    });

                    console.log("Hii message sent!");
                  }}
                >
                  Say "Hii" <span className="inline-block animate-shake">👋🏻</span> and show some love to your pockie
                </div>
              ) : (
                messages?.docs.map((doc) => {
                  const data = doc.data();
                  const isCurrentUser = data.senderId === user?.uid;

                  return (
                    <div
                      key={doc.id}
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      } mb-4`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-red-300/30 backdrop-blur-sm text-black shadow-lg"
                            : "bg-red-500/30 backdrop-blur-sm"
                        }`}
                      >
                        {data.text && <p className="text-sm">{data.text}</p>}
                        {data.mediaUrl && (
                          <img
                            src={data.mediaUrl}
                            className="max-w-full mt-2 rounded"
                            alt="Shared media"
                          />
                        )}
                        <small className="block mt-1 text-xs opacity-75">
                          {new Date(data.timestamp?.toDate()).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <form
            onSubmit={sendMessage}
            className="p-4 border-t flex gap-2 items-center sticky bottom-0 bg-background"
          >
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="cursor-pointer"
              >
                😊
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1"
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,audio/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileUpload(e.target.files[0])
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAiGenerateClick}
              className="relative cursor-pointer"
            >
              <RiAiGenerate2 />
              {showTooltip && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded-lg px-2 py-1 shadow-lg">
                  This feature is coming soon!
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              <MdPermMedia />
            </Button>
            <Button type="submit" className="bg-red-300/30 backdrop-blur-md text-black cursor-pointer"><IoMdSend/></Button>
          </form>
        </div>
      )}
    </div>
  );
}
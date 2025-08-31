'use client';
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useIsMobile } from "@/hooks/use-is-mobile";
import Link from "next/link";
import assistantData from '@/data/assistant.json';
import { chat } from '@/ai/genkit';
import { type ChatMessage } from '@/ai/schemas';

const renderContent = (content: string) => {
    // This regex looks for <Link href="...">...</Link> and captures the href and the text.
    const linkRegex = /<Link href="(.+?)">(.+?)<\/Link>/g;
    let lastIndex = 0;
    const parts = [];

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        // Push text before the link
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }
        // Push the link component
        const href = match[1];
        const text = match[2];
        parts.push(<Link key={match.index} href={href} className="text-primary underline hover:text-primary/80">{text}</Link>);
        lastIndex = match.index + match[0].length;
    }

    // Push any remaining text after the last link
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }
    
    // Now, handle newlines for all string parts
    return parts.map((part, index) => {
        if (typeof part === 'string') {
            return part.split('\n').map((line, i) => (
                <React.Fragment key={`${index}-${i}`}>
                    {line}
                    {i < part.split('\n').length - 1 && <br />}
                </React.Fragment>
            ));
        }
        return part;
    });
};


export default function MessagesPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [assistantName, setAssistantName] = useState('Assistant');
    const [assistantAvatar, setAssistantAvatar] = useState('/avatar-placeholder.png');
    const viewportRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const isMobile = useIsMobile();
    
    // Audio refs
    const typingSoundRef = useRef<HTMLAudioElement | null>(null);
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Load assistant data
        setAssistantName(assistantData.name);
        if (assistantData.avatarUrl) {
            setAssistantAvatar(assistantData.avatarUrl);
        }

        // Set initial welcome message
        const welcomeMessage: ChatMessage = {
            role: 'model',
            content: `Hai! Aku ${assistantData.name}. Ada yang bisa kubantu hari ini?`
        };
        setMessages([welcomeMessage]);

        // Initialize audio on client
        if (typeof window !== 'undefined') {
            typingSoundRef.current = new Audio('/sounds/typing.mp3');
            typingSoundRef.current.volume = 0.2;
            notificationSoundRef.current = new Audio('/sounds/notification.mp3');
        }
    }, []);
    
    // Play notification sound for the initial message
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'model') {
            notificationSoundRef.current?.play().catch(e => console.log("Audio play failed:", e));
        }
    }, [messages]);

    const scrollToBottom = () => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        typingSoundRef.current?.play().catch(e => console.log("Audio play failed:", e));
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        
        setIsLoading(true);

        try {
            const aiResponse = await chat(newMessages); 
            notificationSoundRef.current?.play().catch(e => console.log("Audio play failed:", e));
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
             console.error("Chat error:", error);
             notificationSoundRef.current?.play().catch(e => console.log("Audio play failed:", e));
             const errorMessage: ChatMessage = {
                role: 'model',
                content: `Maaf, terjadi masalah: ${(error as Error).message}`
             };
             setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
             <CardHeader className="flex flex-row items-center gap-3 border-b bg-card z-10 shrink-0">
                 {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft />
                    </Button>
                 )}
                 <Avatar>
                    <AvatarImage src={assistantAvatar} alt={assistantName} />
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-bold text-lg">{assistantName}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Online</CardDescription>
                </div>
            </CardHeader>
            <div className="flex-grow p-0 overflow-hidden">
                <ScrollArea className="h-full" viewportRef={viewportRef}>
                    <div className="space-y-6 p-4">
                        {messages.map((message, index) => (
                            <div key={index} className={cn("flex items-end gap-2", message.role === 'user' ? "justify-end" : "justify-start")}>
                                {message.role === 'model' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={assistantAvatar} alt={assistantName} />
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                    message.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card text-card-foreground border rounded-bl-none"
                                )}>
                                    {renderContent(message.content)}
                                </div>
                                 {message.role === 'user' && (
                                    <Avatar className="h-8 w-8">
                                         <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-end gap-2 justify-start">
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={assistantAvatar} alt={assistantName} />
                                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="bg-card text-card-foreground border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{animationDelay: '200ms'}}></span>
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{animationDelay: '400ms'}}></span>
                                </div>
                            </div>
                        )}
                         {messages.length === 0 && !isLoading && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Bot className="mx-auto h-12 w-12 mb-4" />
                                <p className="font-semibold">Selamat Datang!</p>
                                <p className="text-sm">Ketik pesan untuk memulai percakapan.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <div className="p-4 border-t bg-card shrink-0">
                <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={`Ketik pesan untuk ${assistantName}...`}
                        className="flex-grow rounded-full h-12 px-5"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="rounded-full w-12 h-12" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
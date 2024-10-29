import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { ChatMessage } from './Types/chatTypes';

const Container = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
`;

const ChatContainer = styled.div`
    height: 500px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 20px;
    overflow-y: auto;
    margin-bottom: 20px;
    background: #f5f5f5;
`;

const MessageContainer = styled.div<{ isSystem?: boolean }>`
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 4px;
    background: ${props => props.isSystem ? '#e3e3e3' : '#ffffff'};
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const MessageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.8em;
    color: #666;
`;

const Form = styled.form`
    display: flex;
    gap: 10px;
`;

const Input = styled.input`
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
`;

const Button = styled.button`
    padding: 10px 20px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        background: #0052a3;
    }
`;

const App = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [hasSetUsername, setHasSetUsername] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize WebSocket connection
        ws.current = new WebSocket('ws://localhost:3001');

        ws.current.onopen = () => {
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const message: ChatMessage = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
        };

        ws.current.onclose = () => {
            setIsConnected(false);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!ws.current || !isConnected) return;

        if (!hasSetUsername && username.trim()) {
            ws.current.send(JSON.stringify({
                type: 'setUsername',
                username: username.trim()
            }));
            setHasSetUsername(true);
            return;
        }

        if (hasSetUsername && message.trim()) {
            ws.current.send(JSON.stringify({
                type: 'chat',
                message: message.trim()
            }));
            setMessage('');
        }
    };

    return (
        <Container>
            <h1>WebSocket Chat</h1>
            <ChatContainer ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <MessageContainer key={index} isSystem={msg.type === 'system'}>
                        <MessageHeader>
                            <span>{msg.sender || 'System'}</span>
                            <span>{format(msg.timeStamp, 'HH:mm:ss')}</span>
                        </MessageHeader>
                        <div>{msg.message}</div>
                    </MessageContainer>
                ))}
            </ChatContainer>
            <Form onSubmit={handleSubmit}>
                {!hasSetUsername ? (
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username..."
                        required
                    />
                ) : (
                    <Input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        required
                    />
                )}
                <Button type="submit">
                    {!hasSetUsername ? 'Set Username' : 'Send'}
                </Button>
            </Form>
            {!isConnected && (
                <p style={{ color: 'red' }}>Disconnected from server</p>
            )}
        </Container>
    );
  }


  export default App;
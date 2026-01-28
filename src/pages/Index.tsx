import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type TabType = 'contacts' | 'profile' | 'settings' | 'search' | 'gallery';

interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  time: string;
  isMine: boolean;
  type: 'text' | 'video';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, name: 'Анна Иванова', avatar: '👩‍💼', lastMessage: 'Привет! Как дела?', time: '10:30', unread: 2, online: true },
    { id: 2, name: 'Группа 6В', avatar: '🎓', lastMessage: 'Домашка на завтра?', time: '09:15', unread: 5, online: false },
    { id: 3, name: 'Максим Петров', avatar: '👨‍💻', lastMessage: 'Отправил видео', time: 'Вчера', unread: 0, online: false },
    { id: 4, name: 'Мария Смирнова', avatar: '👩‍🎨', lastMessage: 'Спасибо!', time: 'Вчера', unread: 0, online: true },
  ]);

  const [chatMessages, setChatMessages] = useState<{ [key: number]: Message[] }>({
    1: [
      { id: 1, text: 'Привет! Как дела?', time: '10:25', isMine: false, type: 'text' },
      { id: 2, text: 'Отлично! А у тебя?', time: '10:27', isMine: true, type: 'text' },
      { id: 3, text: 'Тоже хорошо 😊', time: '10:30', isMine: false, type: 'text' },
    ],
    2: [
      { id: 1, text: 'Домашка на завтра?', time: '09:15', isMine: false, type: 'text' },
      { id: 2, text: 'Задачи 5-10 из учебника', time: '09:20', isMine: true, type: 'text' },
    ],
    3: [
      { id: 1, text: 'Привет!', time: 'Вчера', isMine: false, type: 'text' },
      { id: 2, text: 'Смотри какой видос', time: 'Вчера', isMine: false, type: 'video' },
    ],
    4: [
      { id: 1, text: 'Спасибо большое!', time: 'Вчера', isMine: false, type: 'text' },
      { id: 2, text: 'Всегда пожалуйста! 😊', time: 'Вчера', isMine: true, type: 'text' },
    ],
  });

  const [totalUnread, setTotalUnread] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = contacts.reduce((sum, contact) => sum + contact.unread, 0);
    setTotalUnread(total);
  }, [contacts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedContact]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6 && selectedContact) {
        simulateIncomingMessage();
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [selectedContact, chatMessages]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const simulateIncomingMessage = () => {
    if (!selectedContact) return;
    
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        'Как дела?',
        'Ты где? 🤔',
        'Окей, понял!',
        'Супер! 🎉',
        'Спасибо большое!',
        'А что по домашке?',
        'Созвонимся вечером?',
        'Увидимся завтра! 👋',
      ];
      
      const randomMessage = responses[Math.floor(Math.random() * responses.length)];
      const newMessage: Message = {
        id: Date.now(),
        text: randomMessage,
        time: getCurrentTime(),
        isMine: false,
        type: 'text',
      };

      setChatMessages(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
      }));

      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id 
          ? { ...c, lastMessage: randomMessage, time: getCurrentTime() }
          : c
      ));

      setIsTyping(false);
      
      toast.info(`Новое сообщение от ${selectedContact.name}`, {
        description: randomMessage,
        duration: 2000,
      });
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const newMessage: Message = {
      id: Date.now(),
      text: messageInput,
      time: getCurrentTime(),
      isMine: true,
      type: 'text',
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));

    setContacts(prev => prev.map(c => 
      c.id === selectedContact.id 
        ? { ...c, lastMessage: messageInput, time: getCurrentTime() }
        : c
    ));

    toast.success('Отправлено!', { duration: 1000 });
    setMessageInput('');
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.unread > 0) {
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, unread: 0 } : c
      ));
    }
  };

  const handleAttachVideo = () => {
    if (!selectedContact) return;

    const newMessage: Message = {
      id: Date.now(),
      text: 'Отправил видео',
      time: getCurrentTime(),
      isMine: true,
      type: 'video',
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));

    setContacts(prev => prev.map(c => 
      c.id === selectedContact.id 
        ? { ...c, lastMessage: 'Отправил видео', time: getCurrentTime() }
        : c
    ));

    toast.success('Видео отправлено!', { duration: 1500 });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contacts':
        return (
          <div className="flex h-full">
            <div className="w-80 border-r border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Контакты
                </h2>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`p-4 cursor-pointer transition-all hover:bg-muted/50 border-b border-border/50 ${
                      selectedContact?.id === contact.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-2xl">{contact.avatar}</AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full ring-2 ring-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{contact.name}</h3>
                          <span className="text-xs text-muted-foreground">{contact.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      </div>
                      {contact.unread > 0 && (
                        <Badge className="bg-gradient-to-r from-primary to-secondary">{contact.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xl">{selectedContact.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedContact.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedContact.online ? 'В сети' : 'Был(а) недавно'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {(chatMessages[selectedContact.id] || []).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3 ${
                              message.isMine
                                ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                                : 'bg-card border border-border'
                            }`}
                          >
                            {message.type === 'video' && (
                              <div className="mb-2 rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                                <Icon name="Video" size={48} className="text-muted-foreground" />
                              </div>
                            )}
                            <p className="text-sm">{message.text}</p>
                            <span className="text-xs opacity-70 mt-1 block">{message.time}</span>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                          <div className="max-w-[70%] rounded-2xl p-3 bg-card border border-border">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleAttachVideo}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Icon name="Video" size={20} />
                      </Button>
                      <Input
                        placeholder="Написать сообщение..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                      >
                        <Icon name="Send" size={20} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2 animate-scale-in">
                    <Icon name="MessageSquare" size={64} className="mx-auto opacity-50" />
                    <p className="text-lg">Выберите контакт, чтобы начать общение</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <Card className="w-96 p-8 text-center space-y-6 border-primary/20">
              <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/20">
                <AvatarFallback className="text-6xl">👤</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ваш профиль</h2>
                <p className="text-muted-foreground">user@example.com</p>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon name="Phone" size={20} className="text-accent" />
                  <span>+7 (999) 123-45-67</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon name="Mail" size={20} className="text-secondary" />
                  <span>user@example.com</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Редактировать профиль
              </Button>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto p-8 space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">Настройки</h2>
            <div className="space-y-4">
              {[
                { icon: 'Bell', title: 'Уведомления', desc: 'Настроить push-уведомления' },
                { icon: 'Lock', title: 'Безопасность', desc: 'Пароль и двухфакторная аутентификация' },
                { icon: 'Palette', title: 'Тема', desc: 'Выбрать цветовую схему' },
                { icon: 'Globe', title: 'Язык', desc: 'Изменить язык интерфейса' },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
                      <Icon name={item.icon as any} size={24} className="text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="max-w-2xl mx-auto p-8 space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Поиск</h2>
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="Поиск сообщений, контактов, файлов..." className="pl-10" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">НЕДАВНИЕ ПОИСКИ</h3>
              {['Анна Иванова', 'Группа 6В', 'видео'].map((term, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Icon name="Clock" size={18} className="text-muted-foreground" />
                  <span>{term}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="max-w-4xl mx-auto p-8 space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">Галерея</h2>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                <Card
                  key={item}
                  className="aspect-square overflow-hidden cursor-pointer hover:scale-105 transition-transform border-border/50"
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                    <Icon name="Image" size={48} className="text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Messenger 6В
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 relative">
              <Icon name="Bell" size={20} />
              {totalUnread > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-xs">
                  {totalUnread}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-20 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col items-center py-6 gap-4">
          {[
            { id: 'contacts', icon: 'MessageSquare', label: 'Контакты' },
            { id: 'profile', icon: 'User', label: 'Профиль' },
            { id: 'settings', icon: 'Settings', label: 'Настройки' },
            { id: 'search', icon: 'Search', label: 'Поиск' },
            { id: 'gallery', icon: 'Image', label: 'Галерея' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative h-14 w-14 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg'
                  : 'hover:bg-muted'
              }`}
              title={tab.label}
            >
              <Icon name={tab.icon as any} size={24} />
              {activeTab === tab.id && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-l-full"></div>
              )}
            </Button>
          ))}
        </nav>

        <main className="flex-1 overflow-hidden">{renderTabContent()}</main>
      </div>
    </div>
  );
};

export default Index;
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/a7ff2fba-cc6a-4321-a8fd-a8576214edb1';
const CURRENT_USER_ID = 1;

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [key: number]: Message[] }>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAvatar, setNewContactAvatar] = useState('👤');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const avatarOptions = ['👤', '👨', '👩', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '🎓', '👑', '🤖'];

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const total = contacts.reduce((sum, contact) => sum + contact.unread, 0);
    setTotalUnread(total);
  }, [contacts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedContact]);

  useEffect(() => {
    if (!selectedContact) return;
    
    const interval = setInterval(() => {
      loadMessages(selectedContact.id);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedContact]);

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_URL}?action=contacts&userId=${CURRENT_USER_ID}`);
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      toast.error('Ошибка загрузки контактов');
    }
  };

  const loadMessages = async (contactId: number) => {
    try {
      const response = await fetch(`${API_URL}?action=messages&userId=${CURRENT_USER_ID}&contactId=${contactId}`);
      const data = await response.json();
      setChatMessages(prev => ({
        ...prev,
        [contactId]: data.messages || []
      }));
      
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, unread: 0 } : c
      ));
    } catch (error) {
      toast.error('Ошибка загрузки сообщений');
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    if (!chatMessages[contact.id]) {
      await loadMessages(contact.id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || loading) return;

    setLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          receiverId: selectedContact.id,
          text: messageInput,
          type: 'text'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newMessage: Message = {
          id: data.messageId,
          text: messageInput,
          time: data.time,
          isMine: true,
          type: 'text'
        };

        setChatMessages(prev => ({
          ...prev,
          [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
        }));

        setContacts(prev => prev.map(c => 
          c.id === selectedContact.id 
            ? { ...c, lastMessage: messageInput, time: data.time }
            : c
        ));

        setMessageInput('');
        toast.success('Отправлено!', { duration: 1000 });
      }
    } catch (error) {
      toast.error('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachVideo = async () => {
    if (!selectedContact || loading) return;

    setLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          receiverId: selectedContact.id,
          text: 'Отправил видео',
          type: 'video'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newMessage: Message = {
          id: data.messageId,
          text: 'Отправил видео',
          time: data.time,
          isMine: true,
          type: 'video'
        };

        setChatMessages(prev => ({
          ...prev,
          [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
        }));

        setContacts(prev => prev.map(c => 
          c.id === selectedContact.id 
            ? { ...c, lastMessage: 'Отправил видео', time: data.time }
            : c
        ));

        toast.success('Видео отправлено!', { duration: 1500 });
      }
    } catch (error) {
      toast.error('Ошибка отправки видео');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || loading) return;

    setLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          name: newContactName,
          avatar: newContactAvatar,
          phone: newContactPhone || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Контакт добавлен!');
        setNewContactName('');
        setNewContactPhone('');
        setNewContactAvatar('👤');
        setIsAddDialogOpen(false);
        await loadContacts();
      }
    } catch (error) {
      toast.error('Ошибка добавления контакта');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contacts':
        return (
          <div className="flex h-full">
            <div className="w-80 border-r border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Контакты
                </h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="hover:bg-accent/20">
                      <Icon name="UserPlus" size={20} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить контакт</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium">Имя</label>
                        <Input
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="Введите имя"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Телефон (необязательно)</label>
                        <Input
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          placeholder="+7 (999) 123-45-67"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Аватар</label>
                        <div className="grid grid-cols-6 gap-2 mt-2">
                          {avatarOptions.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => setNewContactAvatar(avatar)}
                              className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                                newContactAvatar === avatar 
                                  ? 'border-primary bg-primary/10 scale-110' 
                                  : 'border-border hover:border-accent'
                              }`}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddContact} 
                        disabled={loading || !newContactName.trim()}
                        className="w-full bg-gradient-to-r from-primary to-secondary"
                      >
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleAttachVideo}
                        disabled={loading}
                        className="hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Icon name="Video" size={20} />
                      </Button>
                      <Input
                        placeholder="Написать сообщение..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={loading}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={loading || !messageInput.trim()}
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
                <p className="text-muted-foreground">you@example.com</p>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon name="Phone" size={20} className="text-accent" />
                  <span>+7 (999) 123-45-67</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon name="Mail" size={20} className="text-secondary" />
                  <span>you@example.com</span>
                </div>
              </div>
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

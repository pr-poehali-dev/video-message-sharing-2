-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    phone VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица контактов (связи между пользователями)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    contact_user_id INTEGER NOT NULL REFERENCES users(id),
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);

-- Добавляем тестовых пользователей
INSERT INTO users (name, avatar, phone, email) VALUES
('Вы', '👤', '+7 (999) 123-45-67', 'you@example.com'),
('Анна Иванова', '👩‍💼', '+7 (999) 111-11-11', 'anna@example.com'),
('Группа 6В', '🎓', NULL, NULL),
('Максим Петров', '👨‍💻', '+7 (999) 222-22-22', 'max@example.com'),
('Мария Смирнова', '👩‍🎨', '+7 (999) 333-33-33', 'maria@example.com')
ON CONFLICT (phone) DO NOTHING;

-- Добавляем контакты для первого пользователя
INSERT INTO contacts (user_id, contact_user_id, is_online) 
SELECT 1, id, CASE WHEN id IN (2, 5) THEN true ELSE false END
FROM users WHERE id > 1
ON CONFLICT (user_id, contact_user_id) DO NOTHING;

-- Добавляем тестовые сообщения
INSERT INTO messages (sender_id, receiver_id, text, message_type, created_at) VALUES
(2, 1, 'Привет! Как дела?', 'text', NOW() - INTERVAL '30 minutes'),
(1, 2, 'Отлично! А у тебя?', 'text', NOW() - INTERVAL '28 minutes'),
(2, 1, 'Тоже хорошо 😊', 'text', NOW() - INTERVAL '25 minutes'),
(3, 1, 'Домашка на завтра?', 'text', NOW() - INTERVAL '2 hours'),
(1, 3, 'Задачи 5-10 из учебника', 'text', NOW() - INTERVAL '1 hour 50 minutes'),
(4, 1, 'Привет!', 'text', NOW() - INTERVAL '1 day'),
(4, 1, 'Смотри какой видос', 'video', NOW() - INTERVAL '1 day'),
(5, 1, 'Спасибо большое!', 'text', NOW() - INTERVAL '1 day'),
(1, 5, 'Всегда пожалуйста! 😊', 'text', NOW() - INTERVAL '1 day');
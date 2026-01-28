import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """
    API для работы с мессенджером: получение контактов, сообщений, отправка сообщений, добавление контактов
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        path = event.get('queryStringParameters', {}).get('action', '')
        user_id = int(event.get('queryStringParameters', {}).get('userId', '1'))
        
        if method == 'GET':
            if path == 'contacts':
                cur.execute("""
                    SELECT 
                        u.id, u.name, u.avatar, c.is_online,
                        COALESCE(
                            (SELECT m.text 
                             FROM messages m 
                             WHERE (m.sender_id = u.id AND m.receiver_id = %s) 
                                OR (m.sender_id = %s AND m.receiver_id = u.id)
                             ORDER BY m.created_at DESC LIMIT 1),
                            ''
                        ) as last_message,
                        COALESCE(
                            (SELECT TO_CHAR(m.created_at, 'HH24:MI')
                             FROM messages m 
                             WHERE (m.sender_id = u.id AND m.receiver_id = %s) 
                                OR (m.sender_id = %s AND m.receiver_id = u.id)
                             ORDER BY m.created_at DESC LIMIT 1),
                            ''
                        ) as last_time,
                        COALESCE(
                            (SELECT COUNT(*) 
                             FROM messages m 
                             WHERE m.sender_id = u.id AND m.receiver_id = %s AND NOT m.is_read),
                            0
                        ) as unread_count
                    FROM contacts c
                    JOIN users u ON c.contact_user_id = u.id
                    WHERE c.user_id = %s
                    ORDER BY (
                        SELECT MAX(m.created_at)
                        FROM messages m 
                        WHERE (m.sender_id = u.id AND m.receiver_id = %s) 
                           OR (m.sender_id = %s AND m.receiver_id = u.id)
                    ) DESC NULLS LAST
                """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
                
                contacts = []
                for row in cur.fetchall():
                    contacts.append({
                        'id': row[0],
                        'name': row[1],
                        'avatar': row[2],
                        'online': row[3],
                        'lastMessage': row[4],
                        'time': row[5],
                        'unread': row[6]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'contacts': contacts}),
                    'isBase64Encoded': False
                }
            
            elif path == 'messages':
                contact_id = int(event.get('queryStringParameters', {}).get('contactId', '0'))
                
                cur.execute("""
                    SELECT id, sender_id, text, message_type, 
                           TO_CHAR(created_at, 'HH24:MI') as time
                    FROM messages
                    WHERE (sender_id = %s AND receiver_id = %s) 
                       OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at ASC
                """, (user_id, contact_id, contact_id, user_id))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'isMine': row[1] == user_id,
                        'text': row[2],
                        'type': row[3],
                        'time': row[4]
                    })
                
                cur.execute("""
                    UPDATE messages 
                    SET is_read = true 
                    WHERE sender_id = %s AND receiver_id = %s AND NOT is_read
                """, (contact_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'send_message':
                receiver_id = body.get('receiverId')
                text = body.get('text')
                message_type = body.get('type', 'text')
                
                cur.execute("""
                    INSERT INTO messages (sender_id, receiver_id, text, message_type)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, TO_CHAR(created_at, 'HH24:MI') as time
                """, (user_id, receiver_id, text, message_type))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'messageId': result[0],
                        'time': result[1]
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_contact':
                name = body.get('name')
                phone = body.get('phone', None)
                avatar = body.get('avatar', '👤')
                
                cur.execute("""
                    INSERT INTO users (name, avatar, phone)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (name, avatar, phone))
                
                new_user_id = cur.fetchone()[0]
                
                cur.execute("""
                    INSERT INTO contacts (user_id, contact_user_id, is_online)
                    VALUES (%s, %s, false)
                """, (user_id, new_user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'contactId': new_user_id}),
                    'isBase64Encoded': False
                }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

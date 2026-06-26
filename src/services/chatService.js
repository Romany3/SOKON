import apiClient, { emitStoreChange, getStoredUser } from './apiClient';
import { mapApartment } from './apartmentService';
import { mapUser } from './userService';

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return value?.chats || value?.conversations || value?.messages || value?.data?.chats || value?.data?.conversations || value?.data?.messages || value?.data || [];
};

const getSessionUserId = () => {
  const user = getStoredUser();
  return user?._id || user?.id || '';
};

const imageMessagePattern = /__image__:(https?:\/\/[^\s]+)(?:\s|$)/g;

const toUrlArray = (value) => {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.url || item.secure_url || item.imageUrl || item.fileUrl || '';
      }
      return '';
    })
    .filter(Boolean);
};

const extractImageUrlsFromText = (text = '') => {
  const urls = [];
  const normalizedText = `${text}`;

  let match;
  while ((match = imageMessagePattern.exec(normalizedText)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  imageMessagePattern.lastIndex = 0;
  return urls;
};

const stripImageMarkersFromText = (text = '') =>
  `${text}`
    .replace(imageMessagePattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const mapMessage = (message) => {
  if (!message) {
    return null;
  }

  const rawText = message.text || message.message || message.body || '';
  const encodedImages = extractImageUrlsFromText(rawText);
  const explicitImages = [
    ...toUrlArray(message.images),
    ...toUrlArray(message.image),
    ...toUrlArray(message.imageUrl),
    ...toUrlArray(message.photoUrl),
    ...toUrlArray(message.media),
  ];
  const images = [...new Set([...explicitImages, ...encodedImages])];
  const text = stripImageMarkersFromText(rawText);

  return {
    ...message,
    _id: message.id || message._id || message.messageId || '',
    id: message.id || message._id || message.messageId || '',
    senderId: message.senderId || message.sender_id || message.sender?.id || message.sender?._id || '',
    sender: message.sender ? mapUser(message.sender) : null,
    text,
    images,
    image: images[0] || '',
    createdAt: message.createdAt || message.created_at || message.timestamp || '',
  };
};

const normalizeMessageList = (payload) => asArray(payload).map(mapMessage).filter(Boolean);

export const mapChat = (chat) => {
  if (!chat) {
    return null;
  }

  const participantsSource = Array.isArray(chat.participants)
    ? chat.participants
    : Array.isArray(chat.users)
      ? chat.users
      : Array.isArray(chat.members)
        ? chat.members
        : [];

  const participants = participantsSource.map((participant) => {
    if (typeof participant === 'object' && participant !== null) {
      const mapped = mapUser(participant);
      return mapped;
    }

    const participantId = `${participant}`;
    const displayNames = chat.displayNames || chat.display_names || {};
    const displayPhotos = chat.displayPhotos || chat.display_photos || {};
    return {
      _id: participantId,
      id: participantId,
      name: displayNames[participantId] || '',
      fullName: displayNames[participantId] || '',
      avatar: displayPhotos[participantId] || '',
      photoUrl: displayPhotos[participantId] || '',
    };
  });

  const currentUserId = getSessionUserId();
  const otherParticipant =
    participants.find((participant) => `${participant?._id || participant?.id}` !== `${currentUserId}`) ||
    participants[0] ||
    null;

  const apartment = chat.apartment || chat.relatedApartment || chat.apartmentData || null;
  
  // Robust Last Message Detection
  let rawLastMessage = chat.lastMessage || chat.last_message || chat.message || null;
  
  if (!rawLastMessage && Array.isArray(chat.messages) && chat.messages.length > 0) {
    rawLastMessage = chat.messages[chat.messages.length - 1];
  }
  
  // If still nothing, check for text fields that might be the last message content
  if (!rawLastMessage && (chat.lastMessageText || chat.last_text)) {
    rawLastMessage = { text: chat.lastMessageText || chat.last_text, createdAt: chat.updatedAt || chat.lastMessageAt };
  }

  const fallbackLastMessage = typeof rawLastMessage === 'string' ? { message: rawLastMessage } : rawLastMessage;
  const lastMessageMapped = fallbackLastMessage ? mapMessage(fallbackLastMessage) : null;

  return {
    ...chat,
    _id: chat.id || chat._id || chat.chatId || '',
    id: chat.id || chat._id || chat.chatId || '',
    participants,
    otherParticipant:
      otherParticipant ||
      lastMessageMapped?.sender ||
      (chat.otherParticipant ? mapUser(chat.otherParticipant) : null) ||
      (chat.other_participant ? mapUser(chat.other_participant) : null) ||
      null,
    apartment: apartment ? mapApartment(apartment) : null,
    unreadCount: chat.unreadCount || chat.unread_count || 0,
    lastMessage: lastMessageMapped,
    updatedAt: chat.updatedAt || chat.updated_at || chat.lastMessageAt || lastMessageMapped?.createdAt || '',
    messages: Array.isArray(chat.messages) ? chat.messages.map(mapMessage).filter(Boolean) : [],
  };
};

const normalizeChatList = (payload) => asArray(payload).map(mapChat).filter(Boolean);

const findExistingChat = (chats, participantIds = []) => {
  const targetIds = participantIds.map((id) => `${id}`).filter(Boolean).sort();

  if (!targetIds.length) {
    return null;
  }

  return chats.find((chat) => {
    const chatIds = (chat.participants || [])
      .map((participant) => `${participant?._id || participant?.id || participant}`)
      .filter(Boolean)
      .sort();

    if (chatIds.length !== targetIds.length) {
      return false;
    }

    return chatIds.every((value, index) => value === targetIds[index]);
  });
};

const uploadChatImages = async (files = [], folder = 'chats') => {
  const urls = [];

  for (const file of files) {
    if (!(file instanceof File) && !(file instanceof Blob)) {
      if (typeof file === 'string' && file.startsWith('http')) {
        urls.push(file);
      }
      continue;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await apiClient.post('/storage/apartment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data || {};
      const url = data.secure_url || data.url || data.imageUrl || data.fileUrl || '';
      if (url) {
        urls.push(url);
      }
    } catch (err) {
      console.error('Error uploading chat image:', err);
    }
  }

  return urls;
};

export const chatAPI = {
  getChats: async (userId = getSessionUserId()) => {
    const response = await apiClient.get('/chats', { params: { userId } });
    const normalized = normalizeChatList(response.data);
    return { data: { chats: normalized, conversations: normalized } };
  },

  getConversations: async (userId) => chatAPI.getChats(userId),

  getChatById: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return { data: { chat: mapChat(response.data?.chat || response.data?.data?.chat || response.data) } };
  },

  getMessages: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`);
    return { data: { messages: normalizeMessageList(response.data) } };
  },

  getMessagesByQuery: async (chatId) => {
    const response = await apiClient.get('/messages', { params: { chat_id: chatId } });
    return { data: { messages: normalizeMessageList(response.data) } };
  },

  getConversation: async (chatId) => {
    const [chatResponse, messagesResponse, queryMessagesResponse] = await Promise.all([
      chatAPI.getChatById(chatId).catch(() => ({ data: { chat: null } })),
      chatAPI.getMessages(chatId).catch(() => ({ data: { messages: [] } })),
      chatAPI.getMessagesByQuery(chatId).catch(() => ({ data: { messages: [] } })),
    ]);

    const chat = chatResponse.data?.chat;
    const combinedMessages = [
      ...(messagesResponse.data?.messages || []),
      ...(queryMessagesResponse.data?.messages || []),
    ];
    const dedupedMessages = combinedMessages.filter((message, index, array) => {
      const messageId = message?._id || message?.id;
      if (!messageId) {
        return array.findIndex((item) => `${item?.text || ''}-${item?.createdAt || ''}` === `${message?.text || ''}-${message?.createdAt || ''}`) === index;
      }
      return array.findIndex((item) => `${item?._id || item?.id}` === `${messageId}`) === index;
    });

    return {
      data: {
        conversation: chat ? { ...chat, messages: dedupedMessages } : null,
      },
    };
  },

  getOrCreateConversation: async ({ participantIds = [], apartmentId, participants = [] } = {}) => {
    // 1. Check if a conversation already exists between these two users
    const response = await chatAPI.getChats();
    const chats = response.data?.chats || response.data?.conversations || [];
    const existingChat = findExistingChat(chats, participantIds);

    if (existingChat) {
      return { data: { conversation: existingChat } };
    }

    // 2. Build displayNames / displayPhotos from provided participant metadata
    const displayNames = {};
    const displayPhotos = {};
    participants.forEach((p) => {
      const pid = `${p?._id || p?.id || ''}`;
      if (pid) {
        displayNames[pid] = p?.fullName || p?.name || '';
        displayPhotos[pid] = p?.photoUrl || p?.avatar || '';
      }
    });

    // 3. Generate a deterministic chat ID: sorted participant IDs joined by '_'
    const chatId = [...participantIds].map((id) => `${id}`).sort().join('_');

    const createResponse = await apiClient.post('/chats', {
      id: chatId,
      users: participantIds,
      apartmentId: apartmentId || undefined,
      displayNames,
      displayPhotos,
      lastMessage: '',
      timestamp: new Date().toISOString(),
    });

    emitStoreChange();
    return { data: { conversation: mapChat(createResponse.data?.chat || createResponse.data?.data?.chat || createResponse.data) } };
  },

  sendMessage: async (chatId, payload = {}) => {
    const currentUserId = getSessionUserId();
    const images = Array.isArray(payload.images) ? await uploadChatImages(payload.images, `chat-${chatId}`) : [];
    const body = {
      senderId: currentUserId,
      message: payload.message || payload.text || '',
    };

    if (images.length) {
      const imageMarkers = images.map((image) => `__image__:${image}`);
      body.message = body.message ? `${body.message}\n${imageMarkers.join('\n')}` : imageMarkers.join('\n');
    }

    const response = await apiClient.post(`/chats/${chatId}/messages`, body);
    emitStoreChange();
    return { data: { message: mapMessage(response.data?.message || response.data?.data?.message || response.data) } };
  },

  markConversationAsRead: async () => ({ data: { success: true } }),
};

// PUBLIC_INTERFACE
/**
 * API client service for Claude AI Chat Interface backend
 * Handles all HTTP requests and SSE streaming for real-time chat responses
 */

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// PUBLIC_INTERFACE
/**
 * Fetches all chats from the backend
 * @returns {Promise<Array>} Array of chat objects
 */
export async function getAllChats() {
  const response = await fetch(`${API_BASE_URL}/api/chats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chats: ${response.statusText}`);
  }
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Creates a new chat
 * @param {string} title - Optional title for the chat
 * @returns {Promise<Object>} Created chat object
 */
export async function createChat(title = 'New conversation') {
  const response = await fetch(`${API_BASE_URL}/api/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create chat: ${response.statusText}`);
  }
  
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Gets a specific chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Chat object
 */
export async function getChat(chatId) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chat: ${response.statusText}`);
  }
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Updates a chat's title
 * @param {string} chatId - Chat ID
 * @param {string} title - New title
 * @returns {Promise<Object>} Updated chat object
 */
export async function updateChat(chatId, title) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update chat: ${response.statusText}`);
  }
  
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Deletes a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
export async function deleteChat(chatId) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete chat: ${response.statusText}`);
  }
}

// PUBLIC_INTERFACE
/**
 * Gets all messages for a specific chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(chatId) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Sends a message to a chat and handles SSE streaming response
 * @param {string} chatId - Chat ID
 * @param {string} content - Message content
 * @param {Object} callbacks - Callback functions for different events
 * @param {Function} callbacks.onUserMessage - Called when user message is confirmed
 * @param {Function} callbacks.onThinking - Called when assistant starts thinking
 * @param {Function} callbacks.onContent - Called for each content chunk (streaming)
 * @param {Function} callbacks.onComplete - Called when response is complete
 * @param {Function} callbacks.onError - Called on error
 * @returns {Object} Object with abort method to cancel the stream
 */
export function sendMessageStream(chatId, content, callbacks) {
  const {
    onUserMessage,
    onThinking,
    onContent,
    onComplete,
    onError,
  } = callbacks;

  const abortController = new AbortController();

  // Start the SSE connection
  fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Handle SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const event = JSON.parse(data);

              switch (event.event) {
                case 'user_message':
                  if (onUserMessage) {
                    onUserMessage(event.data);
                  }
                  break;

                case 'thinking':
                  if (onThinking) {
                    onThinking();
                  }
                  break;

                case 'content':
                  if (onContent) {
                    onContent(event.data);
                  }
                  break;

                case 'complete':
                  if (onComplete) {
                    onComplete(event.data);
                  }
                  break;

                case 'error':
                  if (onError) {
                    onError(event.data);
                  }
                  break;

                default:
                  console.warn('Unknown event type:', event.event);
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err, data);
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else if (onError) {
        onError({ message: error.message });
      }
    });

  return {
    abort: () => abortController.abort(),
  };
}
